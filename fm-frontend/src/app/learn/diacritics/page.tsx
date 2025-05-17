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
import { WritingPractice } from "@/components/learning/WritingPractice";

// Arabic diacritics data
const arabicDiacritics = [
    {
        mark: "َ",
        name: "فَتحة",
        transliteration: "fatha",
        sound: "a",
        description: "علامة تُوضع فوق الحرف وتنطق كصوت الألف القصيرة",
        examples: ["كَتَبَ", "ذَهَبَ", "جَلَسَ"],
        practiceWords: [
            { word: "كَتَبَ", meaning: "كتب" },
            { word: "ذَهَبَ", meaning: "ذهب" },
            { word: "جَلَسَ", meaning: "جلس" },
            { word: "قَرَأَ", meaning: "قرأ" },
            { word: "فَتَحَ", meaning: "فتح" }
        ],
        audioFile: "fatha.mp3"
    },
    {
        mark: "ُ",
        name: "ضَمة",
        transliteration: "damma",
        sound: "u",
        description: "علامة تُوضع فوق الحرف وتنطق كصوت الواو القصيرة",
        examples: ["كُتُب", "يَكتُبُ", "يَدرُسُ"],
        practiceWords: [
            { word: "كُتُب", meaning: "كتب" },
            { word: "يَكتُبُ", meaning: "يكتب" },
            { word: "يَدرُسُ", meaning: "يدرس" },
            { word: "يَقرُأُ", meaning: "يقرأ" },
            { word: "يَدخُلُ", meaning: "يدخل" }
        ],
        audioFile: "damma.mp3"
    },
    {
        mark: "ِ",
        name: "كَسرة",
        transliteration: "kasra",
        sound: "i",
        description: "علامة تُوضع تحت الحرف وتنطق كصوت الياء القصيرة",
        examples: ["كِتاب", "مِن", "بِنت"],
        practiceWords: [
            { word: "كِتاب", meaning: "كتاب" },
            { word: "مِن", meaning: "من" },
            { word: "بِنت", meaning: "بنت" },
            { word: "عِلم", meaning: "علم" },
            { word: "فِكر", meaning: "فكر" }
        ],
        audioFile: "kasra.mp3"
    },
    {
        mark: "ْ",
        name: "سُكون",
        transliteration: "sukoon",
        sound: "no vowel",
        description: "علامة تُوضع فوق الحرف وتدل على عدم وجود حركة",
        examples: ["مِنْ", "قُمْ", "كَمْ"],
        practiceWords: [
            { word: "مِنْ", meaning: "من" },
            { word: "قُمْ", meaning: "قم" },
            { word: "كَمْ", meaning: "كم" },
            { word: "هَلْ", meaning: "هل" },
            { word: "لَمْ", meaning: "لم" }
        ],
        audioFile: "sukoon.mp3"
    }
];

// Progress persistence
const PROGRESS_KEY = 'diacritics-learning-progress';

// Audio feature flag - set to false until audio files are available
const AUDIO_ENABLED = false;

interface ProgressState {
    [key: string]: number;
}

export default function DiacriticsLearningPage() {
    const [selectedDiacritic, setSelectedDiacritic] = useState(arabicDiacritics[0]);
    const [progress, setProgress] = useState<ProgressState>({});
    const [showCelebration, setShowCelebration] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedPracticeWord, setSelectedPracticeWord] = useState<string | null>(null);
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
                    const diacriticsLevel = serverData.find((p: any) => p.level_id === 2); // Assuming level_id 2 for diacritics

                    if (diacriticsLevel?.learned_items) {
                        try {
                            const learnedItems = typeof diacriticsLevel.learned_items === 'string'
                                ? JSON.parse(diacriticsLevel.learned_items)
                                : diacriticsLevel.learned_items;

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
            const totalDiacritics = arabicDiacritics.length;
            const learnedDiacritics = Object.keys(progress).filter(key => progress[key] === 100).length;
            const progressPercentage = Math.round((learnedDiacritics / totalDiacritics) * 100);

            // Log the progress being sent
            console.log('Sending progress update:', {
                user_id: userId,
                level_id: 2,
                progress: progressPercentage,
                completed: progressPercentage === 100,
                unlock_next_level: progressPercentage === 100,
                learned_items: progress
            });

            const response = await fetch('http://localhost:5000/api/progress/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    level_id: 2, // Level ID for diacritics
                    progress: progressPercentage,
                    completed: progressPercentage === 100,
                    unlock_next_level: progressPercentage === 100,
                    learned_items: progress
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server response error:', errorData);
                throw new Error('Failed to save progress');
            }

            const responseData = await response.json();
            console.log('Server response:', responseData);

            if (responseData.success && responseData.data.user) {
                localStorage.setItem('user', JSON.stringify(responseData.data.user));
            }

            if (progressPercentage === 100 && !showCelebration) {
                setShowCelebration(true);
                toast.success('أحسنت! لقد أكملت تعلم الحركات والتشكيل. يمكنك الآن مراجعة ما تعلمته 🎉');

                // Force refresh progress data
                const refreshResponse = await fetch(`http://localhost:5000/api/progress/user/${userId}`);
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    // Update local storage with fresh progress data
                    localStorage.setItem('diacritics_progress', JSON.stringify({
                        level_id: 2,
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
        const diacriticIndex = arabicDiacritics.indexOf(selectedDiacritic).toString();
        setProgress(prev => ({
            ...prev,
            [diacriticIndex]: 100
        }));
    };

    const totalProgress = Math.round(
        (Object.values(progress).filter(v => v === 100).length / arabicDiacritics.length) * 100
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold font-arabic mb-4">تعلم الحركات والتشكيل</h1>
                <p className="text-xl text-muted-foreground font-arabic">اختر علامة تشكيل للبدء في تعلمها</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Diacritics Grid */}
                <Card className="p-6">
                    <h2 className="text-2xl font-bold font-arabic mb-4">علامات التشكيل</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {arabicDiacritics.map((diacritic, index) => (
                            <Button
                                key={diacritic.mark}
                                variant={selectedDiacritic.mark === diacritic.mark ? "default" : "outline"}
                                className={cn(
                                    "text-2xl font-arabic aspect-square",
                                    progress[index] === 100 && "border-green-500 bg-green-50",
                                    selectedDiacritic.mark === diacritic.mark && "ring-2 ring-primary"
                                )}
                                onClick={() => setSelectedDiacritic(diacritic)}
                            >
                                {`بـ${diacritic.mark}`}
                            </Button>
                        ))}
                    </div>
                </Card>

                {/* Diacritic Details */}
                <Card className="p-6">
                    <div className="text-center">
                        <motion.div
                            key={selectedDiacritic.mark}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h2 className="text-2xl font-bold font-arabic mb-4">{selectedDiacritic.name}</h2>
                            <div className="text-9xl font-arabic mb-6 relative group">
                                {`بـ${selectedDiacritic.mark}`}
                                <div className="absolute -right-12 top-1/2 -translate-y-1/2">
                                    <SpeechReader
                                        text={selectedDiacritic.name}
                                        variant="letter"
                                        size="sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold font-arabic mb-2">الوصف</h3>
                                    <p className="text-lg font-arabic text-muted-foreground">
                                        {selectedDiacritic.description}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold font-arabic mb-4">أمثلة</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {selectedDiacritic.practiceWords.map((item, index) => (
                                            <motion.div
                                                key={item.word}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-lg border",
                                                    selectedPracticeWord === item.word && "bg-primary/5 border-primary"
                                                )}
                                                onClick={() => setSelectedPracticeWord(item.word)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-2xl font-arabic">{item.word}</span>
                                                    <span className="text-sm text-muted-foreground font-arabic">
                                                        ({item.meaning})
                                                    </span>
                                                </div>
                                                <SpeechReader
                                                    text={item.word}
                                                    variant="word"
                                                    size="sm"
                                                />
                                            </motion.div>
                                        ))}
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

                {/* Practice */}
                <Card className="p-6">
                    <h2 className="text-2xl font-bold font-arabic mb-4">تدرب على الكتابة</h2>
                    <WritingPractice
                        letter={selectedDiacritic.mark}
                        onComplete={markAsLearned}
                    />
                </Card>
            </div>

            {/* Progress Bar */}
            <Card className="mt-8 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold font-arabic">تقدمك في تعلم الحركات</h2>
                    <span className="text-lg font-arabic">{totalProgress}%</span>
                </div>
                <Progress value={totalProgress} className="h-3" />

                {totalProgress === 100 && (
                    <div className="mt-4 flex justify-center">
                        <Button
                            className="font-arabic text-lg"
                            onClick={() => router.push('/dashboard')}
                        >
                            <Icons.Home className="ml-2 h-5 w-5" />
                            العودة للوحة التحكم
                        </Button>
                    </div>
                )}
            </Card>

            <CelebrationEffects
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                type="diacritics"
            />
        </div>
    );
} 