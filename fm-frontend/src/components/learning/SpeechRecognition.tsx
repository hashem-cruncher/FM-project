import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mic, MicOff, Play, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { SpeechService } from "@/lib/services/speech-service";

interface SpeechRecognitionProps {
    originalText: string;
    onAccuracyChange: (accuracy: number) => void;
    onComplete: (results: {
        accuracy: number;
        recognizedText: string;
        errors: Array<{ word: string; type: 'severe' | 'minor' | 'correct'; matched?: string }>;
    }) => void;
}

export function SpeechRecognition({
    originalText,
    onAccuracyChange,
    onComplete
}: SpeechRecognitionProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recognizedText, setRecognizedText] = useState("");
    const [accuracy, setAccuracy] = useState(0);
    const [highlightedText, setHighlightedText] = useState<React.ReactNode>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [errorWords, setErrorWords] = useState<Array<{ word: string; type: 'severe' | 'minor' | 'correct'; matched?: string }>>([]);
    const [activityId, setActivityId] = useState<number | null>(null);

    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const speechService = useRef(new SpeechService());

    // Initialize speech recognition
    useEffect(() => {
        try {
            // Try to use the Web Speech API with Arabic language
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'ar-SA'; // Arabic

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = Array.from(event.results)
                        .map((result: any) => result[0].transcript)
                        .join('');

                    setRecognizedText(transcript);

                    // Calculate preliminary accuracy for feedback
                    // Compare just the whole text for interim results to avoid heavy computation
                    // We'll calculate word-by-word accuracy later in processResults
                    const normalizedOriginal = normalizeArabicText(originalText);
                    const normalizedTranscript = normalizeArabicText(transcript);

                    const prelimAccuracy = calculateWordSimilarity(normalizedOriginal, normalizedTranscript);
                    setAccuracy(prelimAccuracy);
                    onAccuracyChange(prelimAccuracy);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error', event);
                    if (event.error === 'not-allowed') {
                        toast.error("يرجى السماح بالوصول إلى الميكروفون");
                    }
                    stopRecording();
                };
            } else {
                toast.error("متصفحك لا يدعم التعرف على الكلام. يرجى استخدام Chrome أو Edge.");
            }
        } catch (error) {
            console.error('Speech recognition initialization error:', error);
            toast.error("حدث خطأ في تهيئة التعرف على الكلام");
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [originalText]);

    const startRecording = async () => {
        try {
            // Reset states
            setRecognizedText("");
            setHighlightedText(null);
            setAccuracy(0);
            setRecordingTime(0);
            audioChunksRef.current = [];
            setAudioBlob(null);
            setActivityId(null);
            setErrorWords([]);

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup MediaRecorder for audio recording
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(audioBlob);
            };

            // Start recording
            mediaRecorderRef.current.start();

            // Start speech recognition
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }

            setIsRecording(true);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            toast.error("حدث خطأ في بدء التسجيل");
        }
    };

    const stopRecording = () => {
        // Stop the recording timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Stop speech recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        // Stop media recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();

            // Stop all audio tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }

        setIsRecording(false);
        setIsProcessing(true);

        // Process the results
        setTimeout(() => {
            processResults();
            setIsProcessing(false);
        }, 1000);
    };

    const playRecordedAudio = () => {
        if (audioBlob) {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        }
    };

    const processResults = () => {
        if (!recognizedText) {
            toast.error("لم يتم التعرف على أي كلام. حاول مرة أخرى.");
            return;
        }

        // Normalize and compare texts
        const normalizedOriginal = normalizeArabicText(originalText);
        const normalizedRecognized = normalizeArabicText(recognizedText);

        // Calculate final accuracy
        const finalAccuracy = calculateWordSimilarity(normalizedOriginal, normalizedRecognized);
        setAccuracy(finalAccuracy);

        // Find word-level differences
        const errors = findWordErrors(normalizedOriginal, normalizedRecognized);
        setErrorWords(errors);

        // Create highlighted text
        setHighlightedText(generateHighlightedText(originalText, errors));

        // Call onComplete with results
        onComplete({
            accuracy: finalAccuracy,
            recognizedText,
            errors
        });

        // Save activity and get the activity ID
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            // Determine story ID from the URL path
            const pathSegments = window.location.pathname.split('/');
            const storyId = pathSegments[pathSegments.length - 1] || 'default-story';

            // Save activity
            handleSaveActivity(user.id, storyId, finalAccuracy);
        }
    };

    // Save the errors to the database after activity is saved
    useEffect(() => {
        const saveErrorsToDatabase = async () => {
            if (activityId && errorWords.length > 0) {
                try {
                    // Extract userId from localStorage
                    const userData = localStorage.getItem('user');
                    if (!userData) return;

                    const user = JSON.parse(userData);
                    const userId = user.id;

                    // Format errors for API - only include severe and minor errors (not correct words)
                    const formattedErrors = errorWords
                        .filter(error => (error.type === 'severe' || error.type === 'minor') && error.matched)
                        .map(error => ({
                            original_word: error.word,
                            spoken_word: error.matched || '',
                            error_type: error.type as 'severe' | 'minor', // Ensure type is correct
                            error_category: speechService.current.classifyArabicError(error.word, error.matched || '')
                        }));

                    if (formattedErrors.length > 0) {
                        await speechService.current.saveSpeechErrors({
                            user_id: userId,
                            activity_id: activityId,
                            errors: formattedErrors
                        });
                        console.log('Speech errors saved successfully');
                    }
                } catch (error) {
                    console.error('Error saving speech errors:', error);
                }
            }
        };

        saveErrorsToDatabase();
    }, [activityId, errorWords]);

    // Update the onComplete handler to save activity and set activityId
    const handleSaveActivity = async (userId: number, storyId: string, accuracy: number) => {
        try {
            let audioData = undefined;
            if (audioBlob) {
                audioData = await speechService.current.blobToBase64(audioBlob);
            }

            const response = await speechService.current.saveSpeechActivity({
                user_id: userId,
                story_id: storyId,
                original_text: originalText,
                recognized_text: recognizedText,
                accuracy: accuracy,
                audio_data: audioData
            });

            if (response.success && response.data) {
                setActivityId(response.data.activity_id);
                return response.data.activity_id;
            }
        } catch (error) {
            console.error('Error saving speech activity:', error);
        }
        return null;
    };

    // Arabic text normalization
    const normalizeArabicText = (text: string) => {
        return text
            .replace(/[َُِْ~ٍّ]/g, '') // Remove tashkeel (diacritics)
            .replace(/[أإآ]/g, 'ا') // Normalize alif variations more comprehensively
            .replace(/[ؤ]/g, 'و') // Normalize waw with hamza
            .replace(/[ئ]/g, 'ي') // Normalize yaa with hamza
            .replace(/[ة]/g, 'ه') // Normalize ta marbouta
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    };

    // Improved tokenization for Arabic text
    const tokenizeArabicText = (text: string) => {
        // First normalize the text
        const normalized = normalizeArabicText(text);

        // Insert spaces around punctuation marks for better tokenization
        const withSpacedPunctuation = normalized
            .replace(/([.،؛؟!:"""''()[\]{}])/g, ' $1 ');

        // Split by whitespace and filter out empty strings
        return withSpacedPunctuation
            .split(/\s+/)
            .filter(word => word.length > 0);
    };

    // Enhanced function for calculating word similarity with Arabic phonetic awareness
    const calculateWordSimilarity = (word1: string, word2: string) => {
        // Early return for exact matches
        if (word1 === word2) return 100;

        // Early return for empty inputs
        if (!word1 || !word2) return 0;

        // Character groups that are phonetically similar in Arabic
        const similarGroups = [
            ['ت', 'ط'],     // ta and taa
            ['د', 'ض'],     // dal and daad
            ['س', 'ص'],     // seen and saad
            ['ذ', 'ز', 'ظ'], // thal, zay, and dhaa
            ['ح', 'ه'],     // haa and ha
            ['ع', 'ء'],     // ayn and hamza
            ['ق', 'ك'],     // qaf and kaf
        ];

        // Less similar but sometimes confused characters
        const lessSimialarPairs = [
            ['س', 'ش'],    // seen and sheen
            ['ل', 'ن'],    // lam and noon
            ['ب', 'ت'],    // ba and ta
            ['ج', 'خ'],    // jeem and khaa
            ['ر', 'ز'],    // ra and zay
        ];

        // Cost matrix for Levenshtein distance calculation
        const costs = {
            insertion: 2,
            deletion: 2,
            substitution: 3,
            similarSubstitution: 1, // Lower cost for similar phoneme substitution
            lessSimialarSubstitution: 2 // Medium cost for less similar phoneme substitution
        };

        // Function to check if two characters are phonetically similar
        const areSimilar = (char1: string, char2: string) => {
            return similarGroups.some(group => group.includes(char1) && group.includes(char2));
        };

        // Function to check if two characters are somewhat similar
        const areSomewhatSimilar = (char1: string, char2: string) => {
            return lessSimialarPairs.some(pair => pair.includes(char1) && pair.includes(char2));
        };

        // Enhanced Levenshtein distance with phonetic awareness
        const m = word1.length;
        const n = word2.length;

        // Create distance matrix
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        // Initialize first row and column
        for (let i = 0; i <= m; i++) dp[i][0] = i * costs.deletion;
        for (let j = 0; j <= n; j++) dp[0][j] = j * costs.insertion;

        // Fill dp table
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (word1[i - 1] === word2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1]; // No cost for match
                } else {
                    let substitutionCost = costs.substitution;

                    if (areSimilar(word1[i - 1], word2[j - 1])) {
                        substitutionCost = costs.similarSubstitution;
                    } else if (areSomewhatSimilar(word1[i - 1], word2[j - 1])) {
                        substitutionCost = costs.lessSimialarSubstitution;
                    }

                    dp[i][j] = Math.min(
                        dp[i - 1][j] + costs.deletion,      // deletion
                        dp[i][j - 1] + costs.insertion,     // insertion
                        dp[i - 1][j - 1] + substitutionCost // substitution
                    );
                }
            }
        }

        // Calculate similarity as percentage
        const maxLen = Math.max(m, n);
        const maxPossibleDistance = maxLen * costs.substitution; // Worst case: all substitutions
        const distance = dp[m][n];

        // Apply stricter similarity scoring
        const similarity = Math.max(0, (maxPossibleDistance - distance) / maxPossibleDistance * 100);

        // Apply additional penalty for length difference
        const lengthDiffPenalty = Math.abs(m - n) * 5; // 5% penalty per character difference

        return Math.max(0, Math.min(100, similarity - lengthDiffPenalty));
    };

    // Completely revamp the findWordErrors function for better Arabic processing
    const findWordErrors = (original: string, recognized: string) => {
        // Tokenize both texts properly
        const originalWords = tokenizeArabicText(original);
        const recognizedWords = tokenizeArabicText(recognized);

        // Initialize dynamic programming matrix for sequence alignment
        const m = originalWords.length;
        const n = recognizedWords.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        // Initialize backtracking matrix to record decisions
        const backtrack: string[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(''));

        // Initialize first row and column
        for (let i = 0; i <= m; i++) {
            dp[i][0] = i;
            backtrack[i][0] = 'up';
        }

        for (let j = 0; j <= n; j++) {
            dp[0][j] = j;
            backtrack[0][j] = 'left';
        }

        // Fill dp table with similarity scores
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                // Calculate similarity between words
                const similarity = calculateWordSimilarity(originalWords[i - 1], recognizedWords[j - 1]);

                // More precise threshold for different error types
                const matchCost = similarity >= 95 ? 0 : (similarity >= 80 ? 0.5 : 1);

                // Decide on best operation
                const options = [
                    dp[i - 1][j - 1] + matchCost, // match/substitute
                    dp[i - 1][j] + 1,             // delete
                    dp[i][j - 1] + 1              // insert
                ];

                const minVal = Math.min(...options);
                dp[i][j] = minVal;

                // Record the decision for backtracking
                if (minVal === options[0]) backtrack[i][j] = 'diag';
                else if (minVal === options[1]) backtrack[i][j] = 'up';
                else backtrack[i][j] = 'left';
            }
        }

        // Backtrack to find word alignments and errors
        const errors: Array<{ word: string; type: 'severe' | 'minor' | 'correct'; matched?: string }> = [];
        let i = m, j = n;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && backtrack[i][j] === 'diag') {
                // Words are aligned (match or substitution)
                const similarity = calculateWordSimilarity(originalWords[i - 1], recognizedWords[j - 1]);
                const normalizedOriginal = normalizeArabicText(originalWords[i - 1]);
                const normalizedRecognized = normalizeArabicText(recognizedWords[j - 1]);

                // Use stricter thresholds for error classification
                // If words are different even after normalization, they should be classified as errors
                if (normalizedOriginal === normalizedRecognized || similarity >= 95) {
                    errors.unshift({
                        word: originalWords[i - 1],
                        type: 'correct',
                        matched: recognizedWords[j - 1]
                    });
                } else if (similarity >= 75) {
                    errors.unshift({
                        word: originalWords[i - 1],
                        type: 'minor',
                        matched: recognizedWords[j - 1]
                    });
                } else {
                    errors.unshift({
                        word: originalWords[i - 1],
                        type: 'severe',
                        matched: recognizedWords[j - 1]
                    });
                }
                i--; j--;
            } else if (i > 0 && backtrack[i][j] === 'up') {
                // Word in original text is missing in recognized text
                errors.unshift({
                    word: originalWords[i - 1],
                    type: 'severe',
                    matched: 'مفقود' // Mark as missing
                });
                i--;
            } else {
                // Extra word in recognized text, ignore
                j--;
            }
        }

        return errors;
    };

    // Improved text highlighting function that guarantees all words are processed
    const generateHighlightedText = (text: string, errors: Array<{ word: string; type: 'severe' | 'minor' | 'correct'; matched?: string }>) => {
        // Extract words from original text, preserving spaces for reconstruction
        const words = [];
        let currentWord = '';
        let spaces = '';

        // Better tokenization that preserves original spacing
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ' || char === '\t' || char === '\n') {
                if (currentWord) {
                    words.push({ word: currentWord, spaces: '' });
                    currentWord = '';
                }
                spaces += char;
            } else {
                if (spaces) {
                    if (words.length > 0) {
                        words[words.length - 1].spaces = spaces;
                    }
                    spaces = '';
                }
                currentWord += char;
            }
        }

        // Add the last word if exists
        if (currentWord) {
            words.push({ word: currentWord, spaces: spaces });
        }

        // Create a map for error lookup
        const errorMap = new Map();
        errors.forEach(error => {
            errorMap.set(normalizeArabicText(error.word), error);
        });

        return (
            <div className="text-right font-arabic leading-relaxed" dir="rtl">
                {words.map(({ word, spaces }, index) => {
                    const normalizedWord = normalizeArabicText(word);
                    const error = errorMap.get(normalizedWord);

                    // Special case for punctuation
                    const isPunctuation = /^[.،؛؟!:"""''()[\]{}]$/.test(word);

                    // Determine class based on error type
                    let colorClass = 'text-gray-700'; // Default
                    let tooltipText = '';

                    if (error) {
                        if (error.type === 'severe') {
                            colorClass = 'text-red-600 font-bold';
                            tooltipText = error.matched === 'مفقود' ? 'مفقود' : `نطقت: ${error.matched}`;
                        } else if (error.type === 'minor') {
                            colorClass = 'text-yellow-600 font-semibold';
                            tooltipText = `نطقت: ${error.matched}`;
                        } else if (error.type === 'correct') {
                            colorClass = 'text-green-600';
                        }
                    }

                    return (
                        <span key={index}>
                            <span
                                className={`${colorClass} ${isPunctuation ? '' : 'mx-[2px]'} ${error?.matched ? 'relative group cursor-help' : ''}`}
                                title={tooltipText}
                            >
                                {word}
                                {error?.matched && error.type !== 'correct' && (
                                    <span className="absolute -bottom-8 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {tooltipText}
                                    </span>
                                )}
                            </span>
                            {spaces && <span className="whitespace-pre">{spaces}</span>}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <Card className="p-6 w-full">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-arabic">تمرين النطق</h3>

                    <Badge
                        variant="outline"
                        className={`px-3 py-1 ${accuracy >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                            accuracy >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-red-50 text-red-700 border-red-200'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {accuracy >= 80 && <Icons.CheckCircle className="h-4 w-4" />}
                            {accuracy >= 60 && accuracy < 80 && <Icons.Languages className="h-4 w-4" />}
                            {accuracy < 60 && <AlertTriangle className="h-4 w-4" />}
                            <span className="font-arabic">{Math.round(accuracy)}% دقة</span>
                        </div>
                    </Badge>
                </div>

                {/* Recording controls */}
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: isRecording ? [1, 1.1, 1] : 1 }}
                        transition={{ repeat: isRecording ? Infinity : 0, duration: 1.5 }}
                        className={`w-16 h-16 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-100' : 'bg-muted'
                            }`}
                    >
                        {isRecording ? (
                            <Mic className="h-8 w-8 text-red-500" />
                        ) : (
                            <MicOff className="h-8 w-8 text-muted-foreground" />
                        )}
                    </motion.div>

                    {isRecording && (
                        <div className="w-full space-y-2">
                            <div className="flex justify-between">
                                <span>جارٍ التسجيل...</span>
                                <span dir="ltr">{recordingTime}s</span>
                            </div>
                            <Progress value={Math.min(recordingTime / 60 * 100, 100)} className="h-2" />
                        </div>
                    )}

                    {isProcessing && (
                        <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>جارٍ معالجة الكلام...</span>
                        </div>
                    )}

                    <div className="flex gap-4">
                        {!isRecording ? (
                            <Button
                                onClick={startRecording}
                                className="font-arabic"
                                disabled={isProcessing}
                            >
                                <Mic className="mr-2 h-4 w-4" />
                                ابدأ التسجيل
                            </Button>
                        ) : (
                            <Button
                                onClick={stopRecording}
                                variant="destructive"
                                className="font-arabic"
                            >
                                <MicOff className="mr-2 h-4 w-4" />
                                إيقاف التسجيل
                            </Button>
                        )}

                        {audioBlob && (
                            <Button
                                onClick={playRecordedAudio}
                                variant="outline"
                                className="font-arabic"
                                disabled={isRecording || isProcessing}
                            >
                                <Play className="mr-2 h-4 w-4" />
                                استماع
                            </Button>
                        )}
                    </div>
                </div>

                {/* Original text */}
                <div className="space-y-2">
                    <h4 className="font-bold font-arabic">النص الأصلي:</h4>
                    <div className="p-4 bg-muted/10 rounded-md text-lg font-arabic leading-relaxed text-right" dir="rtl">
                        {originalText}
                    </div>
                </div>

                {/* Recognition results */}
                {recognizedText && (
                    <div className="space-y-2">
                        <h4 className="font-bold font-arabic">النص المعترف به:</h4>
                        <div className="p-4 bg-muted/10 rounded-md text-lg font-arabic leading-relaxed text-right" dir="rtl">
                            {recognizedText}
                        </div>
                    </div>
                )}

                {/* Highlighted comparison */}
                {highlightedText && (
                    <div className="space-y-2">
                        <h4 className="font-bold font-arabic">تحليل النطق:</h4>
                        <div className="p-4 bg-muted/10 rounded-md text-lg leading-relaxed">
                            {highlightedText}
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                                <span className="font-arabic">صحيح</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                                <span className="font-arabic">خطأ بسيط</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                <span className="font-arabic">خطأ جسيم</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics */}
                {accuracy > 0 && (
                    <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold font-arabic">نسبة الدقة</h4>
                                <span className="font-semibold">{Math.round(accuracy)}%</span>
                            </div>
                            <Progress value={accuracy} className="h-3" />
                        </div>

                        {accuracy >= 80 && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-800 font-arabic text-right">
                                <div className="flex items-center gap-2">
                                    <Icons.CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-semibold">ممتاز!</span>
                                </div>
                                <p className="mt-1">نطقك ممتاز، استمر في التمرين للوصول إلى الإتقان.</p>
                            </div>
                        )}

                        {accuracy >= 60 && accuracy < 80 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800 font-arabic text-right">
                                <div className="flex items-center gap-2">
                                    <Icons.Languages className="h-5 w-5 text-yellow-600" />
                                    <span className="font-semibold">جيد</span>
                                </div>
                                <p className="mt-1">نطقك جيد ولكن هناك بعض الأخطاء، انتبه للكلمات المميزة باللون الأصفر والأحمر.</p>
                            </div>
                        )}

                        {accuracy < 60 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 font-arabic text-right">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <span className="font-semibold">يحتاج إلى تحسين</span>
                                </div>
                                <p className="mt-1">تحتاج إلى مزيد من التمرين، ركّز على نطق الكلمات المميزة باللون الأحمر واستمع إلى النطق الصحيح.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}

// Declare global type for the Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
} 