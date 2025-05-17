// fm-frontend\src\app\learn\alphabet\page.tsx
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WritingPractice } from "@/components/learning/WritingPractice";
import * as Icons from "lucide-react";
import { use } from 'react';
import { LetterForms } from "@/components/learning/LetterForms";
import { toast } from 'sonner';
import { CelebrationEffects } from "@/components/learning/CelebrationEffects";
import { useRouter } from 'next/navigation';
import { SpeechReader } from "@/components/learning/SpeechReader";

// Arabic alphabet data with all forms
const arabicAlphabet = [
    {
        letter: "ا",
        name: "ألف",
        transliteration: "alif",
        initialForm: "ا",
        medialForm: "ـا",
        finalForm: "ـا",
        commonWords: ["أسد", "أرنب", "أمير"],
        audioFile: "alif.mp3"
    },
    {
        letter: "ب",
        name: "باء",
        transliteration: "baa",
        initialForm: "بـ",
        medialForm: "ـبـ",
        finalForm: "ـب",
        commonWords: ["باب", "بحر", "بيت"],
        audioFile: "baa.mp3"
    },
    {
        letter: "ت",
        name: "تاء",
        transliteration: "taa",
        initialForm: "تـ",
        medialForm: "ـتـ",
        finalForm: "ـت",
        commonWords: ["تمر", "تين", "تاج"],
        audioFile: "taa.mp3"
    },
    {
        letter: "ث",
        name: "ثاء",
        transliteration: "thaa",
        initialForm: "ثـ",
        medialForm: "ـثـ",
        finalForm: "ـث",
        commonWords: ["ثعلب", "ثوب", "ثلج"],
        audioFile: "thaa.mp3"
    },
    {
        letter: "ج",
        name: "جيم",
        transliteration: "jeem",
        initialForm: "جـ",
        medialForm: "ـجـ",
        finalForm: "ـج",
        commonWords: ["جمل", "جبل", "جوز"],
        audioFile: "jeem.mp3"
    },
    {
        letter: "ح",
        name: "حاء",
        transliteration: "haa",
        initialForm: "حـ",
        medialForm: "ـحـ",
        finalForm: "ـح",
        commonWords: ["حصان", "حوت", "حمار"],
        audioFile: "haa.mp3"
    },
    {
        letter: "خ",
        name: "خاء",
        transliteration: "khaa",
        initialForm: "خـ",
        medialForm: "ـخـ",
        finalForm: "ـخ",
        commonWords: ["خروف", "خبز", "خيار"],
        audioFile: "khaa.mp3"
    },
    {
        letter: "د",
        name: "دال",
        transliteration: "daal",
        initialForm: "د",
        medialForm: "ـد",
        finalForm: "ـد",
        commonWords: ["دب", "درس", "دجاج"],
        audioFile: "daal.mp3"
    },
    {
        letter: "ذ",
        name: "ذال",
        transliteration: "thaal",
        initialForm: "ذ",
        medialForm: "ـذ",
        finalForm: "ـذ",
        commonWords: ["ذئب", "ذهب", "ذرة"],
        audioFile: "thaal.mp3"
    },
    {
        letter: "ر",
        name: "راء",
        transliteration: "raa",
        initialForm: "ر",
        medialForm: "ـر",
        finalForm: "ـر",
        commonWords: ["رمان", "رجل", "رأس"],
        audioFile: "raa.mp3"
    },
    {
        letter: "ز",
        name: "زاي",
        transliteration: "zaay",
        initialForm: "ز",
        medialForm: "ـز",
        finalForm: "ـز",
        commonWords: ["زهرة", "زرافة", "زيت"],
        audioFile: "zaay.mp3"
    },
    {
        letter: "س",
        name: "سين",
        transliteration: "seen",
        initialForm: "سـ",
        medialForm: "ـسـ",
        finalForm: "ـس",
        commonWords: ["سمك", "سيارة", "سلحفاة"],
        audioFile: "seen.mp3"
    },
    {
        letter: "ش",
        name: "شين",
        transliteration: "sheen",
        initialForm: "شـ",
        medialForm: "ـشـ",
        finalForm: "ـش",
        commonWords: ["شمس", "شجرة", "شاي"],
        audioFile: "sheen.mp3"
    },
    {
        letter: "ص",
        name: "صاد",
        transliteration: "saad",
        initialForm: "صـ",
        medialForm: "ـصـ",
        finalForm: "ـص",
        commonWords: ["صقر", "صندوق", "صوت"],
        audioFile: "saad.mp3"
    },
    {
        letter: "ض",
        name: "ضاد",
        transliteration: "daad",
        initialForm: "ضـ",
        medialForm: "ـضـ",
        finalForm: "ـض",
        commonWords: ["ضفدع", "ضوء", "ضيف"],
        audioFile: "daad.mp3"
    },
    {
        letter: "ط",
        name: "طاء",
        transliteration: "taa",
        initialForm: "طـ",
        medialForm: "ـطـ",
        finalForm: "ـط",
        commonWords: ["طائر", "طماطم", "طاولة"],
        audioFile: "taa2.mp3"
    },
    {
        letter: "ظ",
        name: "ظاء",
        transliteration: "thaa",
        initialForm: "ظـ",
        medialForm: "ـظـ",
        finalForm: "ـظ",
        commonWords: ["ظبي", "ظل", "ظرف"],
        audioFile: "thaa2.mp3"
    },
    {
        letter: "ع",
        name: "عين",
        transliteration: "ayn",
        initialForm: "عـ",
        medialForm: "ـعـ",
        finalForm: "ـع",
        commonWords: ["عين", "عصفور", "عنب"],
        audioFile: "ayn.mp3"
    },
    {
        letter: "غ",
        name: "غين",
        transliteration: "ghayn",
        initialForm: "غـ",
        medialForm: "ـغـ",
        finalForm: "ـغ",
        commonWords: ["غزال", "غيوم", "غابة"],
        audioFile: "ghayn.mp3"
    },
    {
        letter: "ف",
        name: "فاء",
        transliteration: "faa",
        initialForm: "فـ",
        medialForm: "ـفـ",
        finalForm: "ـف",
        commonWords: ["فيل", "فراشة", "فراولة"],
        audioFile: "faa.mp3"
    },
    {
        letter: "ق",
        name: "قاف",
        transliteration: "qaaf",
        initialForm: "قـ",
        medialForm: "ـقـ",
        finalForm: "ـق",
        commonWords: ["قمر", "قلم", "قطة"],
        audioFile: "qaaf.mp3"
    },
    {
        letter: "ك",
        name: "كاف",
        transliteration: "kaaf",
        initialForm: "كـ",
        medialForm: "ـكـ",
        finalForm: "ـك",
        commonWords: ["كتاب", "كلب", "كرة"],
        audioFile: "kaaf.mp3"
    },
    {
        letter: "ل",
        name: "لام",
        transliteration: "laam",
        initialForm: "لـ",
        medialForm: "ـلـ",
        finalForm: "ـل",
        commonWords: ["ليمون", "لوح", "لؤلؤ"],
        audioFile: "laam.mp3"
    },
    {
        letter: "م",
        name: "ميم",
        transliteration: "meem",
        initialForm: "مـ",
        medialForm: "ـمـ",
        finalForm: "ـم",
        commonWords: ["موز", "مدرسة", "مفتاح"],
        audioFile: "meem.mp3"
    },
    {
        letter: "ن",
        name: "نون",
        transliteration: "noon",
        initialForm: "نـ",
        medialForm: "ـنـ",
        finalForm: "ـن",
        commonWords: ["نمر", "نحلة", "نجمة"],
        audioFile: "noon.mp3"
    },
    {
        letter: "ه",
        name: "هاء",
        transliteration: "haa",
        initialForm: "هـ",
        medialForm: "ـهـ",
        finalForm: "ـه",
        commonWords: ["هدهد", "هلال", "هرم"],
        audioFile: "haa2.mp3"
    },
    {
        letter: "و",
        name: "واو",
        transliteration: "waaw",
        initialForm: "و",
        medialForm: "ـو",
        finalForm: "ـو",
        commonWords: ["وردة", "ورق", "وجه"],
        audioFile: "waaw.mp3"
    },
    {
        letter: "ي",
        name: "ياء",
        transliteration: "yaa",
        initialForm: "يـ",
        medialForm: "ـيـ",
        finalForm: "ـي",
        commonWords: ["يد", "ياسمين", "يمامة"],
        audioFile: "yaa.mp3"
    }
];

// Progress persistence
const PROGRESS_KEY = 'alphabet-learning-progress';

// Audio feature flag - set to false until audio files are available
const AUDIO_ENABLED = false;

// Preload audio utility with existence check
const preloadAudio = async (audioFile: string): Promise<HTMLAudioElement> => {
    // If audio is disabled, reject immediately
    if (!AUDIO_ENABLED) {
        return Promise.reject(new Error('Audio features are currently disabled'));
    }

    // Check if audio file exists before attempting to load
    try {
        const response = await fetch(`/audio/${audioFile}`);
        if (!response.ok) {
            throw new Error(`Audio file not found: ${audioFile}`);
        }

        return new Promise((resolve, reject) => {
            const audio = new Audio(`/audio/${audioFile}`);
            audio.addEventListener('canplaythrough', () => resolve(audio));
            audio.addEventListener('error', (e) => reject(e));
            audio.load();
        });
    } catch (error) {
        return Promise.reject(error);
    }
};

interface ProgressState {
    [key: string]: number;
}

export default function AlphabetLearningPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [selectedLetter, setSelectedLetter] = useState(() => {
        const index = id ? parseInt(id) - 1 : 0;
        return arabicAlphabet[index] || arabicAlphabet[0];
    });
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [progress, setProgress] = useState<ProgressState>({});
    const [showCelebration, setShowCelebration] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [celebrating, setCelebrating] = useState(false);
    const router = useRouter();

    // Load progress from localStorage and server
    useEffect(() => {
        const loadProgress = async () => {
            const userData = localStorage.getItem('user');
            if (!userData) {
                router.push('/login');
                return;
            }

            const user = JSON.parse(userData);
            setUserId(user.id);

            try {
                // Fetch from server first
                const response = await fetch(`http://localhost:5000/api/progress/user/${user.id}`);
                if (response.ok) {
                    const serverData = await response.json();
                    const alphabetLevel = serverData.find((p: any) => p.level_id === 1);

                    if (alphabetLevel?.learned_items) {
                        try {
                            // Parse learned_items from server
                            const learnedItems = typeof alphabetLevel.learned_items === 'string'
                                ? JSON.parse(alphabetLevel.learned_items)
                                : alphabetLevel.learned_items;

                            // Update progress state with server data
                            setProgress(learnedItems);

                            // Also update local storage
                            localStorage.setItem('alphabet_progress', JSON.stringify({
                                level_id: 1,
                                level_progress: alphabetLevel.progress,
                                completed: alphabetLevel.is_completed,
                                completed_at: alphabetLevel.completed_at,
                                learned_letters: learnedItems
                            }));
                        } catch (error) {
                            console.error('Error parsing learned items:', error);
                        }
                    }
                } else {
                    // If server fetch fails, try local storage as fallback
                    const localProgress = localStorage.getItem('alphabet_progress');
                    if (localProgress) {
                        const progressData = JSON.parse(localProgress);
                        if (progressData.learned_letters) {
                            setProgress(progressData.learned_letters);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading progress:', error);
                toast.error('حدث خطأ في تحميل التقدم');

                // Try local storage as fallback
                const localProgress = localStorage.getItem('alphabet_progress');
                if (localProgress) {
                    try {
                        const progressData = JSON.parse(localProgress);
                        if (progressData.learned_letters) {
                            setProgress(progressData.learned_letters);
                        }
                    } catch (e) {
                        console.error('Error parsing local progress:', e);
                    }
                }
            }
        };

        loadProgress();
    }, []);

    const saveProgressToServer = async () => {
        if (!userId) return;

        try {
            setIsSaving(true);
            // Calculate progress percentage based on learned letters
            const totalLetters = arabicAlphabet.length;
            const learnedLetters = Object.keys(progress).filter(key => progress[key] === 100).length;
            const progressPercentage = Math.round((learnedLetters / totalLetters) * 100);

            // Send progress to server
            const response = await fetch('http://localhost:5000/api/progress/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    level_id: 1,
                    progress: progressPercentage,
                    completed: progressPercentage === 100,
                    unlock_next_level: progressPercentage === 100,
                    learned_items: progress
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save progress');
            }

            const responseData = await response.json();

            // Update local storage with server data
            if (responseData.success && responseData.data.user) {
                localStorage.setItem('user', JSON.stringify(responseData.data.user));
            }

            // Save progress to local storage
            const progressData = {
                level_id: 1,
                level_progress: progressPercentage,
                completed: progressPercentage === 100,
                completed_at: progressPercentage === 100 ? new Date().toISOString() : null,
                learned_letters: progress
            };
            localStorage.setItem('alphabet_progress', JSON.stringify(progressData));

            // If level completed, show celebration
            if (progressPercentage === 100 && !showCelebration) {
                setCelebrating(true);
                setTimeout(() => setCelebrating(false), 3000);
                toast.success('أحسنت! لقد أكملت تعلم الحروف الهجائية 🎉');
            }

            setIsSaving(false);
            return true;
        } catch (error) {
            console.error('Error saving progress:', error);
            toast.error('حدث خطأ في حفظ التقدم');
            setIsSaving(false);
            return false;
        }
    };

    // Save progress when component unmounts or before unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveProgressToServer();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            saveProgressToServer();
        };
    }, [progress]);

    useEffect(() => {
        if (!AUDIO_ENABLED) {
            setAudio(null);
            setIsLoadingAudio(false);
            return;
        }

        if (selectedLetter.audioFile) {
            setIsLoadingAudio(true);
            preloadAudio(selectedLetter.audioFile)
                .then(audioElement => {
                    setAudio(audioElement);
                    setIsLoadingAudio(false);
                })
                .catch(error => {
                    console.error('Error loading audio:', error);
                    setIsLoadingAudio(false);
                    setAudio(null);
                });
        }
    }, [selectedLetter]);

    const playLetterSound = async () => {
        if (!AUDIO_ENABLED) {
            toast.info('ميزة الصوت غير متوفرة حالياً');
            return;
        }

        if (!audio) {
            toast.error('عذراً، ملفات الصوت غير متوفرة حالياً');
            return;
        }

        if (isLoadingAudio) {
            toast.info('جاري تحميل الصوت...');
            return;
        }

        try {
            if (audio.paused) {
                await audio.play();
            } else {
                audio.currentTime = 0;
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            toast.error('عذراً، حدث خطأ في تشغيل الصوت');
        }
    };

    const markAsLearned = () => {
        const letterIndex = arabicAlphabet.indexOf(selectedLetter).toString();
        setProgress(prev => ({
            ...prev,
            [letterIndex]: 100
        }));
    };

    const totalProgress = Math.round(
        (Object.values(progress).filter(v => v === 100).length / arabicAlphabet.length) * 100
    );

    // Preload audio when letter changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

            // حفظ التقدم في الخادم أيضاً
            saveProgressToServer();

            // التحقق من اكتمال جميع الحروف
            const totalProgress = Math.round(
                (Object.values(progress).filter(v => v === 100).length / arabicAlphabet.length) * 100
            );

            if (totalProgress === 100) {
                setShowCelebration(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progress]);

    // إضافة طريقة استرجاع التقدم عند اختيار حرف
    const handleLetterSelect = (letter: typeof arabicAlphabet[0]) => {
        setSelectedLetter(letter);

        // حفظ الموضع الحالي قبل الانتقال
        saveProgressToServer();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold font-arabic mb-4">تعلم الحروف العربية</h1>
                <p className="text-xl text-muted-foreground font-arabic">اختر حرفاً للبدء في تعلمه</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Letter Grid */}
                <Card className="p-6">
                    <h2 className="text-2xl font-bold font-arabic mb-4">الحروف الأبجدية</h2>
                    <div className="grid grid-cols-4 gap-2">
                        {arabicAlphabet.map((letter, index) => (
                            <Button
                                key={letter.letter}
                                variant={selectedLetter.letter === letter.letter ? "default" : "outline"}
                                className={`text-2xl font-arabic aspect-square ${progress[index] === 100 ? 'border-green-500 bg-green-50' : ''
                                    }`}
                                onClick={() => handleLetterSelect(letter)}
                            >
                                {letter.letter}
                            </Button>
                        ))}
                    </div>
                </Card>

                {/* Letter Details */}
                <Card className="p-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-arabic mb-4">{selectedLetter.name}</h2>
                        <div className="text-9xl font-arabic mb-6">{selectedLetter.letter}</div>

                        <div className="space-y-4">
                            <div className="grid gap-4">
                                <SpeechReader text={selectedLetter.name} variant="letter" className="w-full" />

                                <div className="bg-muted/50 rounded-lg p-4">
                                    <h3 className="text-xl font-bold font-arabic mb-4">أشكال الحرف</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-sm font-arabic text-muted-foreground">في البداية</p>
                                            <div className="text-4xl font-arabic bg-background rounded p-2">
                                                {selectedLetter.initialForm}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-arabic text-muted-foreground">في الوسط</p>
                                            <div className="text-4xl font-arabic bg-background rounded p-2">
                                                {selectedLetter.medialForm}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-arabic text-muted-foreground">في النهاية</p>
                                            <div className="text-4xl font-arabic bg-background rounded p-2">
                                                {selectedLetter.finalForm}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-arabic text-muted-foreground">منفرد</p>
                                            <div className="text-4xl font-arabic bg-background rounded p-2">
                                                {selectedLetter.letter}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-muted/50 rounded-lg p-4">
                                    <h3 className="text-xl font-bold font-arabic mb-4">أمثلة</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {selectedLetter.commonWords?.map((word, index) => (
                                            <div key={index} className="flex items-center justify-between bg-background rounded p-2">
                                                <span className="text-2xl font-arabic">{word}</span>
                                                <SpeechReader text={word} variant="word" size="sm" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Writing Practice */}
                <Card className="p-6">
                    <h2 className="text-2xl font-bold font-arabic mb-4">تدرب على الكتابة</h2>
                    <WritingPractice
                        letter={selectedLetter.letter}
                        onComplete={markAsLearned}
                    />
                </Card>
            </div>

            {/* Progress Bar */}
            <Card className="mt-8 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold font-arabic">تقدمك في تعلم الحروف</h2>
                    <span className="text-lg font-arabic">{totalProgress}%</span>
                </div>
                <Progress value={totalProgress} className="h-3" />
            </Card>

            <CelebrationEffects
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
            />
        </div>
    );
}
