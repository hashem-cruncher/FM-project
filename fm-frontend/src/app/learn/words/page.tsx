"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import * as Icons from "lucide-react";
import { toast } from 'sonner';
import { CelebrationEffects } from "@/components/learning/CelebrationEffects";
import { useRouter } from 'next/navigation';
import { SpeechReader } from "@/components/learning/SpeechReader";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Arabic simple words data organized by categories
const arabicWords = [
    {
        category: "الأسرة",
        icon: "Heart",
        description: "تعلم كلمات عن أفراد العائلة",
        words: [
            { word: "أَب", meaning: "أب", example: "أَبي طَبيب", image: "father.png" },
            { word: "أُم", meaning: "أم", example: "أُمي مُعَلِّمَة", image: "mother.png" },
            { word: "أَخ", meaning: "أخ", example: "أَخي طالِب", image: "brother.png" },
            { word: "أُخْت", meaning: "أخت", example: "أُخْتي طالِبَة", image: "sister.png" },
            { word: "جَد", meaning: "جد", example: "جَدي كَبير", image: "grandfather.png" }
        ]
    },
    {
        category: "الحيوانات",
        icon: "Cat",
        words: [
            { word: "قِط", meaning: "قط", example: "القِط جَميل" },
            { word: "كَلْب", meaning: "كلب", example: "الكَلْب وَفِي" },
            { word: "أَسَد", meaning: "أسد", example: "الأَسَد قَوِي" },
            { word: "عُصْفور", meaning: "عصفور", example: "العُصْفور يُغَرِّد" },
            { word: "سَمَك", meaning: "سمك", example: "السَمَك في البَحْر" }
        ]
    },
    {
        category: "الطعام",
        icon: "Apple",
        words: [
            { word: "خُبْز", meaning: "خبز", example: "الخُبْز طازِج" },
            { word: "حَليب", meaning: "حليب", example: "الحَليب مُفيد" },
            { word: "مَوْز", meaning: "موز", example: "المَوْز حُلْو" },
            { word: "تُفّاح", meaning: "تفاح", example: "التُفّاح لَذيذ" },
            { word: "عَصير", meaning: "عصير", example: "العَصير بارِد" }
        ]
    },
    {
        category: "المدرسة",
        icon: "GraduationCap",
        words: [
            { word: "كِتاب", meaning: "كتاب", example: "الكِتاب جَديد" },
            { word: "قَلَم", meaning: "قلم", example: "القَلَم أَزْرَق" },
            { word: "مَكْتَب", meaning: "مكتب", example: "المَكْتَب نَظيف" },
            { word: "كُرْسي", meaning: "كرسي", example: "الكُرْسي مُريح" },
            { word: "حَقيبَة", meaning: "حقيبة", example: "الحَقيبَة ثَقيلَة" }
        ]
    }
];

interface ProgressState {
    [key: string]: number;
}

export default function SimpleWordsLearningPage() {
    const [selectedCategory, setSelectedCategory] = useState(arabicWords[0]);
    const [selectedWord, setSelectedWord] = useState(arabicWords[0].words[0]);
    const [progress, setProgress] = useState<ProgressState>({});
    const [showCelebration, setShowCelebration] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [exerciseMode, setExerciseMode] = useState<'learn' | 'practice'>('learn');
    const [showMeaning, setShowMeaning] = useState(false);
    const [practiceWords, setPracticeWords] = useState<typeof selectedWord[]>([]);
    const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
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
                    const wordsLevel = serverData.find((p: any) => p.level_id === 4);

                    if (wordsLevel?.learned_items) {
                        try {
                            const learnedItems = typeof wordsLevel.learned_items === 'string'
                                ? JSON.parse(wordsLevel.learned_items)
                                : wordsLevel.learned_items;

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
            const totalWords = arabicWords.reduce((sum, category) => sum + category.words.length, 0);
            const learnedWords = Object.keys(progress).filter(key => progress[key] === 100).length;
            const progressPercentage = Math.round((learnedWords / totalWords) * 100);

            const response = await fetch('http://localhost:5000/api/progress/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    level_id: 4,
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
                toast.success('أحسنت! لقد أكملت تعلم الكلمات البسيطة. يمكنك الآن مراجعة ما تعلمته 🎉');

                // Force refresh progress data
                const refreshResponse = await fetch(`http://localhost:5000/api/progress/user/${userId}`);
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    // Update local storage with fresh progress data
                    localStorage.setItem('words_progress', JSON.stringify({
                        level_id: 4,
                        level_progress: progressPercentage,
                        completed: true,
                        completed_at: new Date().toISOString(),
                        learned_items: progress
                    }));
                }
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

    // Save progress when component unmounts
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
        const wordKey = `${selectedCategory.category}-${selectedWord.word}`;
        setProgress(prev => ({
            ...prev,
            [wordKey]: 100
        }));
    };

    const handleCategorySelect = (category: typeof arabicWords[0]) => {
        setSelectedCategory(category);
        setSelectedWord(category.words[0]);
    };

    const totalProgress = Math.round(
        (Object.keys(progress).filter(key => progress[key] === 100).length /
            arabicWords.reduce((sum, category) => sum + category.words.length, 0)) * 100
    );

    const startPractice = () => {
        // Get all words from the current category
        const words = [...selectedCategory.words];
        // Shuffle the words
        for (let i = words.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [words[i], words[j]] = [words[j], words[i]];
        }
        setPracticeWords(words);
        setCurrentPracticeIndex(0);
        setExerciseMode('practice');
        setSelectedAnswer(null);
    };

    const handleAnswerSelect = (answer: string) => {
        setSelectedAnswer(answer);
        const isCorrect = answer === practiceWords[currentPracticeIndex].word;

        if (isCorrect) {
            toast.success('إجابة صحيحة! 🎉');
            // Mark the word as learned
            const wordKey = `${selectedCategory.category}-${practiceWords[currentPracticeIndex].word}`;
            setProgress(prev => ({
                ...prev,
                [wordKey]: 100
            }));

            // Move to next word after a short delay
            setTimeout(() => {
                if (currentPracticeIndex < practiceWords.length - 1) {
                    setCurrentPracticeIndex(prev => prev + 1);
                    setSelectedAnswer(null);
                } else {
                    setExerciseMode('learn');
                    toast.success('أحسنت! لقد أكملت التمرين 🌟');
                }
            }, 1000);
        } else {
            toast.error('حاول مرة أخرى');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold font-arabic mb-4"
                >
                    تعلم الكلمات البسيطة
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-muted-foreground font-arabic"
                >
                    {exerciseMode === 'learn' ? 'اختر فئة للبدء في تعلم كلماتها' : 'اختر الكلمة الصحيحة'}
                </motion.p>
            </div>

            {exerciseMode === 'learn' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Categories Grid */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="p-6">
                            <h2 className="text-2xl font-bold font-arabic mb-4">الفئات</h2>
                            <div className="space-y-2">
                                {arabicWords.map((category) => {
                                    const Icon = (Icons as any)[category.icon];
                                    const categoryProgress = category.words.filter(
                                        word => progress[`${category.category}-${word.word}`] === 100
                                    ).length / category.words.length * 100;

                                    return (
                                        <motion.div
                                            key={category.category}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Button
                                                variant={selectedCategory.category === category.category ? "default" : "outline"}
                                                className={cn(
                                                    "w-full justify-start text-right font-arabic text-lg",
                                                    categoryProgress === 100 && "border-green-500 bg-green-50",
                                                    selectedCategory.category === category.category && "ring-2 ring-primary"
                                                )}
                                                onClick={() => handleCategorySelect(category)}
                                            >
                                                {Icon && <Icon className="ml-2 h-5 w-5" />}
                                                {category.category}
                                                <span className="mr-auto text-sm">
                                                    {Math.round(categoryProgress)}%
                                                </span>
                                            </Button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Words Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold font-arabic">{selectedCategory.category}</h2>
                                <Button
                                    variant="outline"
                                    className="font-arabic"
                                    onClick={startPractice}
                                >
                                    <Icons.Play className="ml-2 h-5 w-5" />
                                    ابدأ التمرين
                                </Button>
                            </div>
                            <p className="text-muted-foreground font-arabic mb-4">{selectedCategory.description}</p>
                            <div className="grid grid-cols-2 gap-2">
                                {selectedCategory.words.map((word) => {
                                    const isLearned = progress[`${selectedCategory.category}-${word.word}`] === 100;
                                    return (
                                        <motion.div
                                            key={word.word}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Button
                                                variant={selectedWord.word === word.word ? "default" : "outline"}
                                                className={cn(
                                                    "w-full text-xl font-arabic aspect-square",
                                                    isLearned && "border-green-500 bg-green-50",
                                                    selectedWord.word === word.word && "ring-2 ring-primary"
                                                )}
                                                onClick={() => setSelectedWord(word)}
                                            >
                                                {word.word}
                                            </Button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Word Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="p-6">
                            <div className="text-center">
                                <motion.div
                                    key={selectedWord.word}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="text-2xl font-bold font-arabic mb-4">{selectedWord.word}</h2>
                                    <div className="text-8xl font-arabic mb-6 relative group">
                                        {selectedWord.word}
                                        <div className="absolute -right-12 top-1/2 -translate-y-1/2">
                                            <SpeechReader
                                                text={selectedWord.word}
                                                variant="word"
                                                size="sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div
                                            className="bg-muted/50 rounded-lg p-4 cursor-pointer"
                                            onClick={() => setShowMeaning(!showMeaning)}
                                        >
                                            <h3 className="text-xl font-bold font-arabic mb-2">المعنى</h3>
                                            <motion.p
                                                initial={false}
                                                animate={{ opacity: showMeaning ? 1 : 0 }}
                                                className="text-lg font-arabic text-muted-foreground"
                                            >
                                                {showMeaning ? selectedWord.meaning : '* * * * *'}
                                            </motion.p>
                                        </div>

                                        <div className="bg-muted/50 rounded-lg p-4">
                                            <h3 className="text-xl font-bold font-arabic mb-2">مثال</h3>
                                            <div className="text-2xl font-arabic p-4 border rounded relative group">
                                                {selectedWord.example}
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <SpeechReader
                                                        text={selectedWord.example}
                                                        variant="word"
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full font-arabic text-lg"
                                            onClick={markAsLearned}
                                        >
                                            <Icons.Check className="ml-2 h-5 w-5" />
                                            تم الفهم
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl mx-auto"
                >
                    <Card className="p-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold font-arabic mb-2">
                                اختر الكلمة المناسبة
                            </h2>
                            <p className="text-lg text-muted-foreground font-arabic">
                                {practiceWords[currentPracticeIndex]?.example}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {selectedCategory.words.map((word) => (
                                <motion.div
                                    key={word.word}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full text-xl font-arabic py-8",
                                            selectedAnswer === word.word && "ring-2 ring-primary",
                                            selectedAnswer && word.word === practiceWords[currentPracticeIndex].word && "bg-green-500 text-white",
                                            selectedAnswer === word.word && word.word !== practiceWords[currentPracticeIndex].word && "bg-red-500 text-white"
                                        )}
                                        onClick={() => handleAnswerSelect(word.word)}
                                        disabled={selectedAnswer !== null}
                                    >
                                        {word.word}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-between">
                            <Button
                                variant="outline"
                                className="font-arabic"
                                onClick={() => setExerciseMode('learn')}
                            >
                                <Icons.ArrowRight className="ml-2 h-5 w-5" />
                                العودة للتعلم
                            </Button>
                            <div className="text-sm text-muted-foreground font-arabic">
                                {currentPracticeIndex + 1} / {practiceWords.length}
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Progress Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="mt-8 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold font-arabic">تقدمك في تعلم الكلمات</h2>
                        <span className="text-lg font-arabic">{totalProgress}%</span>
                    </div>
                    <Progress value={totalProgress} className="h-3" />

                    {totalProgress === 100 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex justify-center gap-4"
                        >
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
                                    setSelectedCategory(arabicWords[0]);
                                    setSelectedWord(arabicWords[0].words[0]);
                                    setExerciseMode('learn');
                                }}
                            >
                                <Icons.RefreshCw className="ml-2 h-5 w-5 group-hover:rotate-180 transition-transform" />
                                مراجعة الكلمات
                            </Button>
                        </motion.div>
                    )}
                </Card>
            </motion.div>

            <CelebrationEffects
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
            />
        </div>
    );
} 