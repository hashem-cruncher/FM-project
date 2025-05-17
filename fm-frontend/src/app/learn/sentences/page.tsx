"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { arabicSentences } from '@/lib/data/sentences';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpeechReader } from "@/components/learning/SpeechReader";
import { CelebrationEffects } from "@/components/learning/CelebrationEffects";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ProgressState {
    [key: string]: number;
}

interface PracticeQuestion {
    type: 'multiple_choice' | 'arrange' | 'complete';
    sentence: string;
    question: string;
    options?: string[];
    correctAnswer: string | string[];
    translation?: string;
}

export default function SentencesLearningPage() {
    const [selectedCategory, setSelectedCategory] = useState(arabicSentences[0]);
    const [selectedSentence, setSelectedSentence] = useState(arabicSentences[0].sentences[0]);
    const [progress, setProgress] = useState<ProgressState>({});
    const [showCelebration, setShowCelebration] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const [showWords, setShowWords] = useState(false);
    const [practiceMode, setPracticeMode] = useState<'learn' | 'practice'>('learn');
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState<string | string[]>('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [practiceScore, setPracticeScore] = useState(0);
    const router = useRouter();

    // Load progress from server
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
                const response = await fetch(`http://localhost:5000/api/progress/user/${user.id}`);
                if (response.ok) {
                    const serverData = await response.json();
                    const sentencesLevel = serverData.find((p: any) => p.level_id === 5);

                    if (sentencesLevel?.learned_items) {
                        try {
                            const learnedItems = typeof sentencesLevel.learned_items === 'string'
                                ? JSON.parse(sentencesLevel.learned_items)
                                : sentencesLevel.learned_items;

                            setProgress(learnedItems);
                        } catch (error) {
                            console.error('Error parsing learned items:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading progress:', error);
                toast.error('حدث خطأ في تحميل التقدم');
            }
        };

        loadProgress();
    }, []);

    const saveProgressToServer = async () => {
        if (!userId) return;

        try {
            setIsSaving(true);
            const totalSentences = arabicSentences.reduce((sum, category) => sum + category.sentences.length, 0);
            const learnedSentences = Object.keys(progress).filter(key => progress[key] === 100).length;
            const progressPercentage = Math.round((learnedSentences / totalSentences) * 100);

            const response = await fetch('http://localhost:5000/api/progress/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    level_id: 5,
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

            if (responseData.success && responseData.data.user) {
                localStorage.setItem('user', JSON.stringify(responseData.data.user));
            }

            if (progressPercentage === 100 && !showCelebration) {
                setShowCelebration(true);
                toast.success('أحسنت! لقد أكملت تعلم الجمل القصيرة. يمكنك الآن مراجعة ما تعلمته 🎉');

                // Force refresh progress data
                const refreshResponse = await fetch(`http://localhost:5000/api/progress/user/${userId}`);
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    // Update local storage with fresh progress data
                    localStorage.setItem('sentences_progress', JSON.stringify({
                        level_id: 5,
                        level_progress: progressPercentage,
                        completed: true,
                        completed_at: new Date().toISOString(),
                        learned_items: progress
                    }));
                }
            }

            setIsSaving(false);
        } catch (error) {
            console.error('Error saving progress:', error);
            toast.error('حدث خطأ في حفظ التقدم');
            setIsSaving(false);
        }
    };

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

    const markAsLearned = () => {
        const sentenceKey = `${selectedCategory.id}-${selectedSentence.sentence}`;
        setProgress(prev => ({
            ...prev,
            [sentenceKey]: 100
        }));

        // Move to next sentence in category
        const currentIndex = selectedCategory.sentences.indexOf(selectedSentence);
        if (currentIndex < selectedCategory.sentences.length - 1) {
            setSelectedSentence(selectedCategory.sentences[currentIndex + 1]);
        } else if (currentIndex === selectedCategory.sentences.length - 1) {
            // If last sentence in category, move to next category
            const currentCategoryIndex = arabicSentences.indexOf(selectedCategory);
            if (currentCategoryIndex < arabicSentences.length - 1) {
                const nextCategory = arabicSentences[currentCategoryIndex + 1];
                setSelectedCategory(nextCategory);
                setSelectedSentence(nextCategory.sentences[0]);
            }
        }

        setShowTranslation(false);
        setShowWords(false);
    };

    const totalProgress = Math.round(
        (Object.keys(progress).filter(key => progress[key] === 100).length /
            arabicSentences.reduce((sum, category) => sum + category.sentences.length, 0)) * 100
    );

    const isSentenceLearned = (category: string, sentence: string) => {
        return progress[`${category}-${sentence}`] === 100;
    };

    const startPractice = () => {
        setPracticeMode('practice');
        setShowTranslation(false);
        setShowWords(false);
        setSelectedWord(null);
    };

    // Function to generate practice questions from learned sentences
    const generatePracticeQuestions = () => {
        const learnedSentences = arabicSentences.flatMap(category =>
            category.sentences.filter(sentence =>
                isSentenceLearned(category.id, sentence.sentence)
            )
        );

        if (learnedSentences.length === 0) {
            toast.error('يجب عليك تعلم بعض الجمل أولاً قبل بدء التمارين');
            setPracticeMode('learn');
            return;
        }

        const questions: PracticeQuestion[] = [];

        // Multiple choice questions
        learnedSentences.forEach(sentence => {
            questions.push({
                type: 'multiple_choice',
                sentence: sentence.sentence,
                question: 'اختر الكلمة المناسبة لإكمال الجملة',
                options: [
                    ...sentence.words,
                    ...learnedSentences
                        .filter(s => s.sentence !== sentence.sentence)
                        .flatMap(s => s.words)
                        .slice(0, 3)
                ].sort(() => Math.random() - 0.5).slice(0, 4),
                correctAnswer: sentence.words[Math.floor(Math.random() * sentence.words.length)]
            });

            // Add question about sentence type
            questions.push({
                type: 'multiple_choice',
                sentence: sentence.sentence,
                question: 'ما نوع هذه الجملة؟',
                options: [
                    'جملة اسمية',
                    'جملة فعلية',
                    'جملة استفهامية',
                    'جملة تعجبية'
                ],
                correctAnswer: (() => {
                    const firstWord = sentence.sentence.split(/\s+/)[0] || '';
                    if (['هل', 'ما', 'متى', 'أين', 'كيف', 'لماذا'].includes(firstWord)) {
                        return 'جملة استفهامية';
                    }
                    if (firstWord.match(/^(ي|ت|أ|ن)/)) {
                        return 'جملة فعلية';
                    }
                    if (sentence.sentence.includes('!')) {
                        return 'جملة تعجبية';
                    }
                    return 'جملة اسمية';
                })()
            });
        });

        // Arrange words questions
        learnedSentences.forEach(sentence => {
            const shuffledWords = [...sentence.words].sort(() => Math.random() - 0.5);
            questions.push({
                type: 'arrange',
                sentence: '',
                question: 'رتب الكلمات لتكوين جملة صحيحة',
                correctAnswer: sentence.words,
                options: shuffledWords
            });
        });

        // Complete the sentence questions
        learnedSentences.forEach(sentence => {
            const words = sentence.words;
            const missingWordIndex = Math.floor(Math.random() * words.length);
            const missingWord = words[missingWordIndex];
            const questionWords = [...words];
            questionWords[missingWordIndex] = '____';

            questions.push({
                type: 'complete',
                sentence: questionWords.join(' '),
                question: 'أكمل الجملة بالكلمة المناسبة',
                options: [
                    missingWord,
                    ...learnedSentences
                        .flatMap(s => s.words)
                        .filter(w => w !== missingWord && w.length === missingWord.length)
                        .slice(0, 3)
                ].sort(() => Math.random() - 0.5),
                correctAnswer: missingWord
            });
        });

        // Shuffle questions and select a subset
        setPracticeQuestions(questions.sort(() => Math.random() - 0.5).slice(0, 10));
        setCurrentQuestionIndex(0);
        setUserAnswer('');
        setShowResult(false);
        setPracticeScore(0);
    };

    const handleAnswerSubmit = () => {
        const currentQuestion = practiceQuestions[currentQuestionIndex];
        let correct = false;

        if (currentQuestion.type === 'arrange') {
            // For arrange questions, check if userAnswer is array and compare sentences
            if (Array.isArray(userAnswer)) {
                const userSentence = userAnswer.join(' ').trim();
                const correctSentence = (currentQuestion.correctAnswer as string[]).join(' ').trim();
                correct = userSentence === correctSentence;

                // If incorrect, don't show the correct answer immediately
                if (!correct) {
                    toast.error('ترتيب الكلمات غير صحيح، حاول مرة أخرى');
                    setShowResult(true);
                    setTimeout(() => {
                        setShowResult(false);
                        setUserAnswer([]);
                    }, 2000);
                    return;
                }
            }
        } else {
            correct = userAnswer === currentQuestion.correctAnswer;
        }

        setIsCorrect(correct);
        setShowResult(true);
        if (correct) {
            setPracticeScore(prev => prev + 1);
            toast.success('إجابة صحيحة! 🎉');
        }

        setTimeout(() => {
            if (currentQuestionIndex < practiceQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setUserAnswer('');
                setShowResult(false);
            } else {
                // Move to final results screen
                const finalScore = practiceScore + (correct ? 1 : 0);
                setPracticeScore(finalScore);
                setCurrentQuestionIndex(practiceQuestions.length);

                // Save progress if score is good
                if (finalScore >= 7) {
                    markAsLearned();
                }
            }
        }, 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto py-8 px-4"
        >
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <motion.h1
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="text-4xl font-bold font-arabic mb-4"
                    >
                        تعلم قراءة وفهم الجمل البسيطة
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        className="text-xl text-muted-foreground font-arabic"
                    >
                        {practiceMode === 'learn' ? 'اختر فئة للبدء في تعلم جملها' : 'تدرب على فهم الجمل من خلال التمارين'}
                    </motion.p>
                </div>

                <Card className="p-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold font-arabic">التقدم الكلي</h2>
                            <span className="font-arabic text-lg">{totalProgress}%</span>
                        </div>
                        <Progress value={totalProgress} className="h-2" />

                        {totalProgress === 100 && (
                            <div className="flex justify-center gap-4 mt-4">
                                <Button
                                    className="font-arabic text-lg group"
                                    onClick={() => router.push('/dashboard')}
                                >
                                    <Icons.Home className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                    العودة للوحة التحكم
                                </Button>
                                <Button
                                    className="font-arabic text-lg group"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedCategory(arabicSentences[0]);
                                        setSelectedSentence(arabicSentences[0].sentences[0]);
                                        setShowTranslation(false);
                                        setShowWords(false);
                                        setPracticeMode('learn');
                                    }}
                                >
                                    <Icons.RefreshCw className="ml-2 h-5 w-5 group-hover:rotate-180 transition-transform" />
                                    مراجعة الجمل
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="flex justify-center gap-4 mb-6">
                    <Button
                        variant={practiceMode === 'learn' ? "default" : "outline"}
                        className="font-arabic text-lg group"
                        onClick={() => setPracticeMode('learn')}
                    >
                        <Icons.Book className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                        وضع التعلم
                    </Button>
                    <Button
                        variant={practiceMode === 'practice' ? "default" : "outline"}
                        className="font-arabic text-lg group"
                        onClick={startPractice}
                    >
                        <Icons.GraduationCap className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                        وضع التدريب
                    </Button>
                </div>

                {practiceMode === 'learn' ? (
                    <Tabs defaultValue={selectedCategory.id} className="space-y-4">
                        <ScrollArea className="w-full">
                            <TabsList className="flex w-max px-4 mb-4">
                                {arabicSentences.map((category) => (
                                    <TabsTrigger
                                        key={category.id}
                                        value={category.id}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setSelectedSentence(category.sentences[0]);
                                            setShowTranslation(false);
                                            setShowWords(false);
                                        }}
                                        className="font-arabic text-lg px-6"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{category.icon}</span>
                                            <span>{category.title}</span>
                                            <Badge variant="outline" className="ml-2">
                                                {category.sentences.filter(s =>
                                                    isSentenceLearned(category.id, s.sentence)
                                                ).length} / {category.sentences.length}
                                            </Badge>
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </ScrollArea>

                        {arabicSentences.map((category) => (
                            <TabsContent key={category.id} value={category.id}>
                                <Card className="p-6">
                                    <div className="space-y-6">
                                        <div className="text-center space-y-4">
                                            <h3 className="text-2xl font-bold font-arabic">{category.title}</h3>
                                            <p className="text-muted-foreground font-arabic">
                                                {category.description}
                                            </p>
                                        </div>

                                        <div className="grid gap-4">
                                            <Card className="p-6 text-center space-y-6">
                                                <motion.div
                                                    key={selectedSentence.sentence}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="text-3xl font-arabic font-bold relative group">
                                                        {selectedSentence.sentence}
                                                        <div className="absolute -right-12 top-1/2 -translate-y-1/2">
                                                            <SpeechReader
                                                                text={selectedSentence.sentence}
                                                                variant="word"
                                                                size="sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    <AnimatePresence mode="wait">
                                                        {showTranslation && (
                                                            <motion.p
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 10 }}
                                                                className="text-xl text-muted-foreground"
                                                            >
                                                                {selectedSentence.translation}
                                                            </motion.p>
                                                        )}
                                                    </AnimatePresence>

                                                    <AnimatePresence mode="wait">
                                                        {showWords && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="flex flex-wrap gap-2 justify-center"
                                                                dir="rtl"
                                                            >
                                                                {selectedSentence.words.map((word, index) => (
                                                                    <motion.div
                                                                        key={index}
                                                                        initial={{ opacity: 0, x: 20 }}
                                                                        animate={{
                                                                            opacity: 1,
                                                                            x: 0,
                                                                            scale: selectedWord === word ? 1.1 : 1
                                                                        }}
                                                                        transition={{
                                                                            delay: index * 0.1,
                                                                            duration: 0.3
                                                                        }}
                                                                        whileHover={{ scale: 1.1 }}
                                                                        className={cn(
                                                                            "bg-muted px-4 py-2 rounded-full font-arabic relative group cursor-pointer",
                                                                            selectedWord === word && "bg-primary/10 border-primary"
                                                                        )}
                                                                        onClick={() => setSelectedWord(word)}
                                                                    >
                                                                        {word}
                                                                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <SpeechReader
                                                                                text={word}
                                                                                variant="word"
                                                                                size="sm"
                                                                            />
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>

                                                <div className="flex justify-center gap-4">
                                                    <Button
                                                        onClick={() => setShowTranslation(!showTranslation)}
                                                        variant="outline"
                                                        className="font-arabic group"
                                                    >
                                                        <Icons.Languages className={cn(
                                                            "ml-2 h-5 w-5 transition-transform",
                                                            showTranslation && "rotate-180"
                                                        )} />
                                                        {showTranslation ? 'إخفاء الترجمة' : 'إظهار الترجمة'}
                                                    </Button>
                                                    <Button
                                                        onClick={() => setShowWords(!showWords)}
                                                        variant="outline"
                                                        className="font-arabic group"
                                                    >
                                                        <Icons.SplitSquareHorizontal className={cn(
                                                            "ml-2 h-5 w-5 transition-transform",
                                                            showWords && "rotate-180"
                                                        )} />
                                                        {showWords ? 'إخفاء الكلمات' : 'إظهار الكلمات'}
                                                    </Button>
                                                </div>

                                                <Button
                                                    onClick={markAsLearned}
                                                    className={cn(
                                                        "w-full font-arabic text-lg transition-all",
                                                        isSentenceLearned(selectedCategory.id, selectedSentence.sentence)
                                                            ? "bg-green-500 hover:bg-green-600"
                                                            : ""
                                                    )}
                                                    disabled={isSentenceLearned(selectedCategory.id, selectedSentence.sentence)}
                                                >
                                                    {isSentenceLearned(selectedCategory.id, selectedSentence.sentence)
                                                        ? <><Icons.CheckCircle className="ml-2 h-5 w-5" /> تم التعلم</>
                                                        : <><Icons.Check className="ml-2 h-5 w-5" /> تعلمت هذه الجملة</>
                                                    }
                                                </Button>
                                            </Card>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {category.sentences.map((sentence) => (
                                                    <motion.div
                                                        key={sentence.sentence}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <Card
                                                            className={cn(
                                                                "p-4 cursor-pointer transition-all",
                                                                selectedSentence.sentence === sentence.sentence && "ring-2 ring-primary",
                                                                isSentenceLearned(category.id, sentence.sentence) && "bg-muted"
                                                            )}
                                                            onClick={() => {
                                                                setSelectedSentence(sentence);
                                                                setShowTranslation(false);
                                                                setShowWords(false);
                                                                setSelectedWord(null);
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-arabic text-lg">
                                                                    {sentence.sentence}
                                                                </span>
                                                                {isSentenceLearned(category.id, sentence.sentence) && (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="text-green-500"
                                                                    >
                                                                        <Icons.CheckCircle className="h-5 w-5" />
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                ) : (
                    <Card className="p-6">
                        <div className="space-y-6">
                            {practiceQuestions.length === 0 ? (
                                <div className="text-center space-y-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <h3 className="text-2xl font-bold font-arabic mb-4">تمارين على الجمل</h3>
                                        <p className="text-muted-foreground font-arabic mb-8">
                                            اختبر فهمك للجمل من خلال التمارين التفاعلية
                                        </p>
                                        <Button
                                            className="font-arabic text-lg"
                                            onClick={generatePracticeQuestions}
                                        >
                                            <Icons.Play className="ml-2 h-5 w-5" />
                                            ابدأ التمرين
                                        </Button>
                                    </motion.div>
                                </div>
                            ) : currentQuestionIndex === practiceQuestions.length ? (
                                <div className="text-center space-y-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <h3 className="text-2xl font-bold font-arabic mb-4">
                                            نتيجة التمرين
                                        </h3>
                                        <div className="text-4xl font-bold mb-4">
                                            {practiceScore}/{practiceQuestions.length}
                                        </div>
                                        <p className="text-muted-foreground font-arabic mb-8">
                                            {practiceScore >= 7
                                                ? "أحسنت! لقد اجتزت التمرين بنجاح 🎉"
                                                : "حاول مرة أخرى للحصول على نتيجة أفضل"}
                                        </p>
                                        <div className="flex justify-center gap-4">
                                            <Button
                                                className="font-arabic text-lg"
                                                onClick={() => {
                                                    generatePracticeQuestions();
                                                    setCurrentQuestionIndex(0);
                                                    setPracticeScore(0);
                                                    setUserAnswer('');
                                                    setShowResult(false);
                                                }}
                                            >
                                                <Icons.RefreshCw className="ml-2 h-5 w-5" />
                                                إعادة التمرين
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="font-arabic text-lg"
                                                onClick={() => {
                                                    setPracticeMode('learn');
                                                    setCurrentQuestionIndex(0);
                                                    setPracticeScore(0);
                                                    setPracticeQuestions([]);
                                                }}
                                            >
                                                <Icons.ArrowRight className="ml-2 h-5 w-5" />
                                                العودة للتعلم
                                            </Button>
                                        </div>
                                    </motion.div>
                                </div>
                            ) : (
                                <motion.div
                                    key={currentQuestionIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex justify-between items-center">
                                        <Badge variant="outline" className="font-arabic">
                                            سؤال {currentQuestionIndex + 1} من {practiceQuestions.length}
                                        </Badge>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-arabic">
                                                النتيجة: {practiceScore}/{currentQuestionIndex}
                                            </Badge>
                                            <Progress
                                                value={(currentQuestionIndex / practiceQuestions.length) * 100}
                                                className="w-24 h-2"
                                            />
                                        </div>
                                    </div>

                                    <div className="text-center space-y-4">
                                        <h3 className="text-xl font-bold font-arabic">
                                            {practiceQuestions[currentQuestionIndex].question}
                                        </h3>
                                        {practiceQuestions[currentQuestionIndex].type !== 'arrange' && (
                                            <div className="text-2xl font-arabic p-4 bg-muted/20 rounded-lg">
                                                {practiceQuestions[currentQuestionIndex].sentence}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        {practiceQuestions[currentQuestionIndex].type === 'multiple_choice' && (
                                            <>
                                                <RadioGroup
                                                    value={userAnswer as string}
                                                    onValueChange={setUserAnswer}
                                                    className="space-y-3"
                                                    dir="rtl"
                                                >
                                                    {practiceQuestions[currentQuestionIndex].options?.map((option, index) => (
                                                        <motion.div
                                                            key={index}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                        >
                                                            <Label
                                                                className={cn(
                                                                    "flex items-center p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/5",
                                                                    showResult && option === practiceQuestions[currentQuestionIndex].correctAnswer && "bg-green-100 border-green-500",
                                                                    showResult && userAnswer === option && option !== practiceQuestions[currentQuestionIndex].correctAnswer && "bg-red-100 border-red-500"
                                                                )}
                                                            >
                                                                <RadioGroupItem
                                                                    value={option}
                                                                    disabled={showResult}
                                                                    className="ml-4"
                                                                />
                                                                <span className="font-arabic text-lg">{option}</span>
                                                            </Label>
                                                        </motion.div>
                                                    ))}
                                                </RadioGroup>

                                                {showResult && !isCorrect && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-center mt-4 p-4 bg-red-50 rounded-lg border border-red-200"
                                                    >
                                                        <p className="text-red-500 font-arabic mb-2">إجابة غير صحيحة</p>
                                                        <p className="text-muted-foreground font-arabic">
                                                            الإجابة الصحيحة هي: <span className="font-bold text-foreground">{practiceQuestions[currentQuestionIndex].correctAnswer}</span>
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </>
                                        )}

                                        {practiceQuestions[currentQuestionIndex].type === 'arrange' && (
                                            <div className="space-y-6">
                                                <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
                                                    {practiceQuestions[currentQuestionIndex].options?.map((word, index) => (
                                                        <motion.div
                                                            key={index}
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: index * 0.1 }}
                                                            className={cn(
                                                                "bg-primary/10 px-4 py-2 rounded-full font-arabic cursor-pointer hover:bg-primary/20 transition-colors",
                                                                Array.isArray(userAnswer) && userAnswer.includes(word) && "opacity-50 cursor-not-allowed"
                                                            )}
                                                            onClick={() => {
                                                                if (!showResult && (!Array.isArray(userAnswer) || !userAnswer.includes(word))) {
                                                                    const currentAnswer = Array.isArray(userAnswer) ? userAnswer : [];
                                                                    setUserAnswer([...currentAnswer, word]);
                                                                }
                                                            }}
                                                        >
                                                            {word}
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                {Array.isArray(userAnswer) && userAnswer.length > 0 && (
                                                    <div className="mt-8">
                                                        <h4 className="text-lg font-bold font-arabic mb-4">جملتك:</h4>
                                                        <div className="flex flex-wrap gap-2 justify-center bg-muted/20 p-6 rounded-lg min-h-[100px]" dir="rtl">
                                                            {userAnswer.map((word, index) => (
                                                                <motion.div
                                                                    key={index}
                                                                    className={cn(
                                                                        "bg-primary/20 px-4 py-2 rounded-full font-arabic cursor-pointer hover:bg-primary/30 transition-colors",
                                                                        showResult && isCorrect && "bg-green-100 hover:bg-green-200",
                                                                        showResult && !isCorrect && "bg-red-100 hover:bg-red-200"
                                                                    )}
                                                                    onClick={() => {
                                                                        if (!showResult) {
                                                                            const newAnswer = [...userAnswer];
                                                                            newAnswer.splice(index, 1);
                                                                            setUserAnswer(newAnswer);
                                                                        }
                                                                    }}
                                                                >
                                                                    {word}
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {showResult && !isCorrect && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-center text-red-500 font-arabic"
                                                    >
                                                        حاول مرة أخرى
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}

                                        {practiceQuestions[currentQuestionIndex].type === 'complete' && (
                                            <RadioGroup
                                                value={userAnswer as string}
                                                onValueChange={setUserAnswer}
                                                className="space-y-2"
                                            >
                                                {practiceQuestions[currentQuestionIndex].options?.map((option, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                    >
                                                        <Label
                                                            className={cn(
                                                                "flex items-center space-x-2 space-x-reverse p-4 rounded-lg border cursor-pointer transition-colors",
                                                                showResult && option === practiceQuestions[currentQuestionIndex].correctAnswer && "bg-green-100 border-green-500",
                                                                showResult && userAnswer === option && option !== practiceQuestions[currentQuestionIndex].correctAnswer && "bg-red-100 border-red-500"
                                                            )}
                                                        >
                                                            <RadioGroupItem value={option} disabled={showResult} />
                                                            <span className="font-arabic text-lg">{option}</span>
                                                        </Label>
                                                    </motion.div>
                                                ))}
                                            </RadioGroup>
                                        )}
                                    </div>

                                    {!showResult && (
                                        <Button
                                            className="w-full font-arabic text-lg"
                                            onClick={handleAnswerSubmit}
                                            disabled={!userAnswer}
                                        >
                                            <Icons.Check className="ml-2 h-5 w-5" />
                                            تحقق من الإجابة
                                        </Button>
                                    )}

                                    {showResult && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center"
                                        >
                                            <div className={cn(
                                                "text-2xl font-bold mb-4",
                                                isCorrect ? "text-green-500" : "text-red-500"
                                            )}>
                                                {isCorrect ? "إجابة صحيحة! 🎉" : "حاول مرة أخرى"}
                                            </div>
                                            {!isCorrect && (
                                                <div className="text-muted-foreground font-arabic">
                                                    الإجابة الصحيحة: {practiceQuestions[currentQuestionIndex].correctAnswer}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </Card>
                )}
            </div>

            <CelebrationEffects
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
            />
        </motion.div>
    );
} 