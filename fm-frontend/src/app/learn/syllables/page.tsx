"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WritingPractice } from "@/components/learning/WritingPractice";
import * as Icons from "lucide-react";
import { toast } from 'sonner';
import { CelebrationEffects } from "@/components/learning/CelebrationEffects";
import { useRouter } from 'next/navigation';
import { SpeechReader } from "@/components/learning/SpeechReader";
import { cn } from "@/lib/utils";

// Arabic syllables data
const arabicSyllables = [
    {
        pattern: "بَ",
        type: "مقطع قصير مفتوح",
        description: "حرف + فتحة",
        examples: ["بَدَأَ", "كَتَبَ", "ذَهَبَ"],
        meanings: ["بدأ", "كتب", "ذهب"],
        audioFile: "ba.mp3"
    },
    {
        pattern: "بُ",
        type: "مقطع قصير مفتوح",
        description: "حرف + ضمة",
        examples: ["كُتُب", "مُدُن", "رُسُل"],
        meanings: ["كتب", "مدن", "رسل"],
        audioFile: "bu.mp3"
    },
    {
        pattern: "بِ",
        type: "مقطع قصير مفتوح",
        description: "حرف + كسرة",
        examples: ["عِلْم", "بِنْت", "مِنْ"],
        meanings: ["علم", "بنت", "من"],
        audioFile: "bi.mp3"
    },
    {
        pattern: "بَا",
        type: "مقطع طويل مفتوح",
        description: "حرف + فتحة + ألف",
        examples: ["كَاتِب", "بَاب", "دَار"],
        meanings: ["كاتب", "باب", "دار"],
        audioFile: "baa.mp3"
    },
    {
        pattern: "بُو",
        type: "مقطع طويل مفتوح",
        description: "حرف + ضمة + واو",
        examples: ["نُور", "سُور", "حُوت"],
        meanings: ["نور", "سور", "حوت"],
        audioFile: "boo.mp3"
    },
    {
        pattern: "بِي",
        type: "مقطع طويل مفتوح",
        description: "حرف + كسرة + ياء",
        examples: ["كَرِيم", "عَظِيم", "كَبِير"],
        meanings: ["كريم", "عظيم", "كبير"],
        audioFile: "bee.mp3"
    },
    {
        pattern: "بَنْ",
        type: "مقطع طويل مغلق",
        description: "حرف + فتحة + حرف ساكن",
        examples: ["بَنْت", "قَلْب", "شَمْس"],
        meanings: ["بنت", "قلب", "شمس"],
        audioFile: "ban.mp3"
    },
    {
        pattern: "بُنْ",
        type: "مقطع طويل مغلق",
        description: "حرف + ضمة + حرف ساكن",
        examples: ["صُبْح", "حُبّ", "قُلْ"],
        meanings: ["صبح", "حب", "قل"],
        audioFile: "bun.mp3"
    },
    {
        pattern: "بِنْ",
        type: "مقطع طويل مغلق",
        description: "حرف + كسرة + حرف ساكن",
        examples: ["بِنْت", "عِلْم", "ذِكْر"],
        meanings: ["بنت", "علم", "ذكر"],
        audioFile: "bin.mp3"
    }
];

// Audio feature flag - set to false until audio files are available
const AUDIO_ENABLED = false;

interface ProgressState {
    [key: string]: number;
}

export default function SyllablesLearningPage() {
    const [selectedSyllable, setSelectedSyllable] = useState(arabicSyllables[0]);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [progress, setProgress] = useState<ProgressState>({});
    const [showCelebration, setShowCelebration] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const [selectedExample, setSelectedExample] = useState<string | null>(null);

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
                    const syllablesLevel = serverData.find((p: any) => p.level_id === 3);

                    if (syllablesLevel?.learned_items) {
                        try {
                            const learnedItems = typeof syllablesLevel.learned_items === 'string'
                                ? JSON.parse(syllablesLevel.learned_items)
                                : syllablesLevel.learned_items;

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
            const totalSyllables = arabicSyllables.length;
            const learnedSyllables = Object.keys(progress).filter(key => progress[key] === 100).length;
            const progressPercentage = Math.round((learnedSyllables / totalSyllables) * 100);

            console.log('Sending progress update:', {
                user_id: userId,
                level_id: 3,
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
                    level_id: 3, // Level ID for syllables
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
                toast.success('أحسنت! لقد أكملت تعلم المقاطع الصوتية. يمكنك الآن مراجعة ما تعلمته 🎉');

                // Force refresh progress data
                const refreshResponse = await fetch(`http://localhost:5000/api/progress/user/${userId}`);
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    // Update local storage with fresh progress data
                    localStorage.setItem('syllables_progress', JSON.stringify({
                        level_id: 3,
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
        const syllableIndex = arabicSyllables.indexOf(selectedSyllable).toString();
        setProgress(prev => ({
            ...prev,
            [syllableIndex]: 100
        }));
    };

    const totalProgress = Math.round(
        (Object.values(progress).filter(v => v === 100).length / arabicSyllables.length) * 100
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold font-arabic mb-4"
                >
                    تعلم المقاطع الصوتية
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-muted-foreground font-arabic"
                >
                    اختر مقطعاً للبدء في تعلمه
                </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Syllables Grid */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="p-6">
                        <h2 className="text-2xl font-bold font-arabic mb-4">المقاطع الصوتية</h2>
                        <div className="grid grid-cols-3 gap-2">
                            {arabicSyllables.map((syllable, index) => (
                                <motion.div
                                    key={syllable.pattern}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant={selectedSyllable.pattern === syllable.pattern ? "default" : "outline"}
                                        className={cn(
                                            "w-full text-2xl font-arabic aspect-square",
                                            progress[index] === 100 && "border-green-500 bg-green-50",
                                            selectedSyllable.pattern === syllable.pattern && "ring-2 ring-primary"
                                        )}
                                        onClick={() => setSelectedSyllable(syllable)}
                                    >
                                        {syllable.pattern}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                </motion.div>

                {/* Syllable Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="p-6">
                        <div className="text-center">
                            <motion.div
                                key={selectedSyllable.pattern}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-2xl font-bold font-arabic mb-4">{selectedSyllable.type}</h2>
                                <div className="text-9xl font-arabic mb-6 relative group">
                                    {selectedSyllable.pattern}
                                    <div className="absolute -right-12 top-1/2 -translate-y-1/2">
                                        <SpeechReader
                                            text={selectedSyllable.pattern}
                                            variant="letter"
                                            size="sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <h3 className="text-xl font-bold font-arabic mb-2">التركيب</h3>
                                        <p className="text-lg font-arabic text-muted-foreground">
                                            {selectedSyllable.description}
                                        </p>
                                    </div>

                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <h3 className="text-xl font-bold font-arabic mb-4">أمثلة</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {selectedSyllable.examples.map((word, index) => (
                                                <motion.div
                                                    key={word}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-lg border",
                                                        selectedExample === word && "bg-primary/5 border-primary"
                                                    )}
                                                    onClick={() => setSelectedExample(word)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-2xl font-arabic">{word}</span>
                                                        <span className="text-sm text-muted-foreground font-arabic">
                                                            ({selectedSyllable.meanings[index]})
                                                        </span>
                                                    </div>
                                                    <SpeechReader
                                                        text={word}
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
                </motion.div>

                {/* Practice */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="p-6">
                        <h2 className="text-2xl font-bold font-arabic mb-4">تدرب على الكتابة</h2>
                        <WritingPractice
                            letter={selectedSyllable.pattern}
                            onComplete={markAsLearned}
                        />
                    </Card>
                </motion.div>
            </div>

            {/* Progress Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="mt-8 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold font-arabic">تقدمك في تعلم المقاطع</h2>
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
                                onClick={() => setSelectedSyllable(arabicSyllables[0])}
                            >
                                <Icons.RefreshCw className="ml-2 h-5 w-5 group-hover:rotate-180 transition-transform" />
                                مراجعة المقاطع
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