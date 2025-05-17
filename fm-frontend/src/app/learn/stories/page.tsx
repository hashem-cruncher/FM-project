"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import * as LucideIcons from "lucide-react";
import { toast } from 'sonner';
import { arabicStories } from '@/lib/data/stories';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CelebrationEffects } from "@/components/learning/CelebrationEffects";
import { motion } from "framer-motion";
import { BookOpen, Book, GraduationCap, ChevronRight, ChevronLeft, Home, RefreshCw, CheckCircle, Mic } from "lucide-react";
import { Icons } from "@/components/icons";
import { SpeechRecognition } from "@/components/learning/SpeechRecognition";
import { SpeechAnalytics } from "@/components/learning/SpeechAnalytics";
import { SpeechService } from "@/lib/services/speech-service";

interface ProgressState {
    [key: string]: {
        read: boolean;
        vocabularyLearned: boolean;
        questionsAnswered: boolean;
        speechCompleted?: boolean;
        score: number;
        speechAccuracy?: number;
    };
}

export default function StoriesLearningPage() {
    const [selectedStory, setSelectedStory] = useState(arabicStories[0]);
    const [progress, setProgress] = useState<ProgressState>({});
    const [showCelebration, setShowCelebration] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showVocabulary, setShowVocabulary] = useState(false);
    const [showQuestions, setShowQuestions] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
    const [showSpeech, setShowSpeech] = useState(false);
    const [speechAccuracy, setSpeechAccuracy] = useState(0);
    const router = useRouter();
    const speechService = new SpeechService();

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
                    const storiesLevel = serverData.find((p: any) => p.level_id === 6);

                    if (storiesLevel?.learned_items) {
                        try {
                            const learnedItems = typeof storiesLevel.learned_items === 'string'
                                ? JSON.parse(storiesLevel.learned_items)
                                : storiesLevel.learned_items;

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
            const totalStories = arabicStories.length;
            const completedStories = Object.values(progress).filter(
                p => p.read && p.vocabularyLearned && p.questionsAnswered && p.score >= 2
            ).length;
            const progressPercentage = Math.round((completedStories / totalStories) * 100);

            const response = await fetch('http://localhost:5000/api/progress/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    level_id: 6,
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
                toast.success('أحسنت! لقد أكملت قراءة وفهم القصص القصيرة 🎉');

                // Force refresh progress data
                const refreshResponse = await fetch(`http://localhost:5000/api/progress/user/${userId}`);
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
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

    const markAsRead = () => {
        setProgress(prev => ({
            ...prev,
            [selectedStory.id]: {
                ...prev[selectedStory.id],
                read: true,
                vocabularyLearned: prev[selectedStory.id]?.vocabularyLearned || false,
                questionsAnswered: prev[selectedStory.id]?.questionsAnswered || false,
                score: prev[selectedStory.id]?.score || 0
            }
        }));
        setShowVocabulary(true);
    };

    const markVocabularyLearned = () => {
        setProgress(prev => ({
            ...prev,
            [selectedStory.id]: {
                ...prev[selectedStory.id],
                vocabularyLearned: true
            }
        }));
        setShowQuestions(true);
    };

    const handleAnswerSubmit = () => {
        // التحقق من أن جميع الأسئلة تم الإجابة عليها
        const allQuestionsAnswered = selectedStory.questions.every((_, idx) =>
            selectedAnswers[idx] !== undefined
        );

        if (!allQuestionsAnswered) {
            toast.error('يرجى الإجابة على جميع الأسئلة أولاً');
            return;
        }

        const score = selectedStory.questions.reduce((acc, q, idx) => {
            return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
        }, 0);

        setProgress(prev => ({
            ...prev,
            [selectedStory.id]: {
                ...prev[selectedStory.id],
                questionsAnswered: true,
                score
            }
        }));

        if (score >= 2) {
            toast.success('أحسنت! لقد أجبت على معظم الأسئلة بشكل صحيح 🌟');
            setShowSpeech(true);
        } else {
            toast.info('حاول مرة أخرى للحصول على درجة أفضل');
        }

        // حفظ التقدم مباشرة بعد الإجابة
        saveProgressToServer();
    };

    const handleSpeechAccuracyChange = (accuracy: number) => {
        setSpeechAccuracy(accuracy);
    };

    const handleSpeechComplete = async (results: { accuracy: number; recognizedText: string; errors: Array<{ word: string; type: 'severe' | 'minor' | 'correct' }> }) => {
        if (userId) {
            // Save to backend
            try {
                await speechService.saveSpeechActivity({
                    user_id: userId,
                    story_id: selectedStory.id,
                    original_text: selectedStory.content,
                    recognized_text: results.recognizedText,
                    accuracy: results.accuracy
                });
            } catch (error) {
                console.error('Error saving speech activity:', error);
            }

            // Update local progress
            setProgress(prev => ({
                ...prev,
                [selectedStory.id]: {
                    ...prev[selectedStory.id],
                    speechCompleted: true,
                    speechAccuracy: results.accuracy
                }
            }));

            if (results.accuracy >= 70) {
                toast.success('أحسنت! لقد تمكنت من قراءة القصة بشكل جيد 🎉');
            } else if (results.accuracy >= 50) {
                toast.info('جيد! استمر في التمرين لتحسين مهارات القراءة لديك.');
            } else {
                toast.info('استمر في التمرين، ستتحسن مع الوقت!');
            }

            // Save progress to server
            saveProgressToServer();
        }
    };

    const isStoryCompleted = (storyId: string) => {
        const storyProgress = progress[storyId];
        return storyProgress?.read &&
            storyProgress?.vocabularyLearned &&
            storyProgress?.questionsAnswered &&
            storyProgress?.score >= 2 &&
            storyProgress?.speechCompleted === true &&
            (storyProgress?.speechAccuracy ?? 0) >= 70;
    };

    const totalProgress = Math.round(
        (Object.values(progress).filter(p =>
            p.read && p.vocabularyLearned && p.questionsAnswered && p.score >= 2 &&
            p.speechCompleted === true && (p.speechAccuracy ?? 0) >= 70
        ).length / arabicStories.length) * 100
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto px-4 py-8"
        >
            <div className="text-center mb-12">
                <motion.h1
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="text-4xl font-bold font-arabic mb-4"
                >
                    القصص القصيرة
                </motion.h1>
                <p className="text-xl text-muted-foreground font-arabic leading-relaxed">
                    اقرأ واستمتع بمجموعة من القصص التعليمية الشيقة والهادفة
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* قائمة القصص */}
                <Card className="p-6 h-fit sticky top-4 bg-card/50 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold font-arabic mb-6 flex items-center gap-3 border-b pb-4">
                        <BookOpen className="h-7 w-7 text-primary" />
                        <span>القصص المتوفرة</span>
                    </h2>
                    <div className="space-y-4">
                        {arabicStories.map((story) => (
                            <motion.div
                                key={story.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    variant={selectedStory.id === story.id ? "default" : "outline"}
                                    className={`w-full text-right font-arabic transition-all duration-300 p-4 h-auto ${isStoryCompleted(story.id)
                                        ? 'border-green-500 bg-green-50 hover:bg-green-100'
                                        : ''
                                        }`}
                                    onClick={() => {
                                        setSelectedStory(story);
                                        setShowVocabulary(false);
                                        setShowQuestions(false);
                                        setSelectedAnswers({});
                                    }}
                                >
                                    <div className="flex flex-col items-start w-full gap-3">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-xl font-semibold">{story.title}</span>
                                            {isStoryCompleted(story.id) && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-green-500"
                                                >
                                                    <Icons.CheckCircle className="h-5 w-5" />
                                                </motion.div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                            <Badge
                                                variant="outline"
                                                className={`
                                                    px-3 py-1 text-sm
                                                    ${story.difficulty === 'easy'
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : story.difficulty === 'medium'
                                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'}
                                                `}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {story.difficulty === 'easy' && <Icons.Check className="h-4 w-4" />}
                                                    {story.difficulty === 'medium' && <Icons.Languages className="h-4 w-4" />}
                                                    {story.difficulty === 'hard' && <Icons.Trophy className="h-4 w-4" />}
                                                    <span>
                                                        {story.difficulty === 'easy' ? 'مستوى مبتدئ' :
                                                            story.difficulty === 'medium' ? 'مستوى متوسط' :
                                                                'مستوى متقدم'}
                                                    </span>
                                                </div>
                                            </Badge>
                                            {progress[story.id] && (
                                                <span className="text-sm text-muted-foreground">
                                                    {progress[story.id].score}/3
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </Card>

                {/* محتوى القصة */}
                <Card className="p-6 lg:col-span-2">
                    <Tabs defaultValue="story" className="w-full">
                        <TabsList className="w-full mb-6">
                            <TabsTrigger value="story" className="w-full font-arabic">
                                <Book className="h-4 w-4 ml-2" />
                                القصة
                            </TabsTrigger>
                            <TabsTrigger
                                value="vocabulary"
                                className="w-full font-arabic"
                                disabled={!progress[selectedStory.id]?.read}
                            >
                                <GraduationCap className="h-4 w-4 ml-2" />
                                المفردات
                            </TabsTrigger>
                            <TabsTrigger
                                value="questions"
                                className="w-full font-arabic"
                                disabled={!progress[selectedStory.id]?.vocabularyLearned}
                            >
                                <CheckCircle className="h-4 w-4 ml-2" />
                                الأسئلة
                            </TabsTrigger>
                            <TabsTrigger
                                value="speech"
                                className="w-full font-arabic"
                                disabled={!(progress[selectedStory.id]?.questionsAnswered && progress[selectedStory.id]?.score >= 2)}
                            >
                                <Mic className="h-4 w-4 ml-2" />
                                تمرين النطق
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="story">
                            <div className="relative">
                                <ScrollArea className="h-[500px] w-full rounded-md border p-6 bg-[#FFFDF7]">
                                    <div className="space-y-6 text-right">
                                        <motion.h2
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-3xl font-bold font-arabic text-center mb-8"
                                        >
                                            {selectedStory.title}
                                        </motion.h2>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-xl font-arabic leading-relaxed whitespace-pre-line px-4"
                                            dir="rtl"
                                            style={{ textAlign: 'justify' }}
                                        >
                                            {selectedStory.content}
                                        </motion.div>
                                    </div>
                                </ScrollArea>

                                {!progress[selectedStory.id]?.read && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6"
                                    >
                                        <Button
                                            onClick={markAsRead}
                                            className="w-full font-arabic py-6 text-lg bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-5 w-5 ml-2" />
                                            أنهيت القراءة
                                        </Button>
                                    </motion.div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="vocabulary">
                            <ScrollArea className="h-[500px] w-full rounded-md border p-6">
                                <div className="space-y-6 text-right">
                                    <h3 className="text-2xl font-bold font-arabic mb-6">المفردات الجديدة</h3>
                                    <div className="grid gap-4">
                                        {selectedStory.vocabulary.map((item, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <Card className="p-4 hover:bg-muted/5 transition-colors">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground font-arabic">{item.meaning}</span>
                                                        <span className="text-xl font-bold font-arabic">{item.word}</span>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                    {!progress[selectedStory.id]?.vocabularyLearned && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-6"
                                        >
                                            <Button
                                                onClick={markVocabularyLearned}
                                                className="w-full font-arabic py-6 text-lg bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle className="h-5 w-5 ml-2" />
                                                تعلمت المفردات
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="questions">
                            <ScrollArea className="h-[500px] w-full rounded-md border p-6" dir="rtl">
                                <div className="space-y-8 text-right">
                                    <h3 className="text-2xl font-bold font-arabic mb-6">أسئلة الفهم</h3>
                                    {selectedStory.questions.map((q, idx) => (
                                        <motion.div
                                            key={idx}
                                            className="space-y-4 bg-muted/5 p-6 rounded-lg"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <p className="text-xl font-arabic mb-4">{q.question}</p>
                                            <RadioGroup
                                                value={selectedAnswers[idx]?.toString()}
                                                onValueChange={(value) => {
                                                    setSelectedAnswers(prev => ({
                                                        ...prev,
                                                        [idx]: parseInt(value)
                                                    }));
                                                }}
                                                className="space-y-3"
                                                dir="rtl"
                                            >
                                                {q.options.map((option, optIdx) => (
                                                    <div key={optIdx} className="flex items-center gap-3 p-3 hover:bg-muted/10 rounded-lg transition-colors">
                                                        <RadioGroupItem
                                                            value={optIdx.toString()}
                                                            id={`q${idx}-opt${optIdx}`}
                                                            className="ml-3"
                                                        />
                                                        <Label
                                                            htmlFor={`q${idx}-opt${optIdx}`}
                                                            className="font-arabic text-lg cursor-pointer flex-1 text-right"
                                                        >
                                                            {option}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </motion.div>
                                    ))}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="sticky bottom-0 bg-background p-4 border-t"
                                    >
                                        <Button
                                            onClick={handleAnswerSubmit}
                                            className="w-full font-arabic py-6 text-lg bg-green-600 hover:bg-green-700"
                                            disabled={Object.keys(selectedAnswers).length !== selectedStory.questions.length}
                                        >
                                            تحقق من إجاباتي
                                            <CheckCircle className="mr-2 h-5 w-5" />
                                        </Button>
                                    </motion.div>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="speech">
                            <ScrollArea className="h-[500px] w-full rounded-md border p-6">
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold font-arabic text-right mb-6">تمرين النطق والقراءة</h3>
                                    <p className="text-muted-foreground font-arabic text-right mb-6">
                                        تدرب على قراءة القصة بصوت عالٍ. سيقوم النظام بتحليل نطقك وتقديم ملاحظات.
                                    </p>

                                    <SpeechRecognition
                                        originalText={selectedStory.content}
                                        onAccuracyChange={handleSpeechAccuracyChange}
                                        onComplete={handleSpeechComplete}
                                    />

                                    {userId && (
                                        <div className="mt-10 pt-6 border-t">
                                            <h3 className="text-2xl font-bold font-arabic text-right mb-6">تحليل أداء النطق</h3>
                                            <SpeechAnalytics
                                                userId={userId}
                                                storyId={selectedStory.id}
                                            />
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>

            {/* شريط التقدم */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="mt-8 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold font-arabic">التقدم الكلي</h2>
                        <span className="text-lg font-arabic">
                            {Math.round(
                                (Object.values(progress).filter(p =>
                                    p.read && p.vocabularyLearned && p.questionsAnswered && p.score >= 2 &&
                                    p.speechCompleted === true && (p.speechAccuracy ?? 0) >= 70
                                ).length / arabicStories.length) * 100
                            )}%
                        </span>
                    </div>
                    <Progress
                        value={
                            (Object.values(progress).filter(p =>
                                p.read && p.vocabularyLearned && p.questionsAnswered && p.score >= 2 &&
                                p.speechCompleted === true && (p.speechAccuracy ?? 0) >= 70
                            ).length / arabicStories.length) * 100
                        }
                        className="h-3"
                    />

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
                                <Home className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                العودة للوحة التحكم
                            </Button>
                            <Button
                                className="font-arabic text-lg group"
                                variant="outline"
                                onClick={() => {
                                    // Reset story progress for review
                                    setSelectedStory(arabicStories[0]);
                                    setShowVocabulary(false);
                                    setShowQuestions(false);
                                    setSelectedAnswers({});
                                    // Clear progress for review
                                    const reviewProgress = { ...progress };
                                    Object.keys(reviewProgress).forEach(key => {
                                        reviewProgress[key] = {
                                            ...reviewProgress[key],
                                            read: false,
                                            vocabularyLearned: false,
                                            questionsAnswered: false,
                                            score: 0,
                                            speechCompleted: false,
                                            speechAccuracy: 0
                                        };
                                    });
                                    setProgress(reviewProgress);
                                    setShowCelebration(false);
                                    toast.success('يمكنك الآن مراجعة القصص من جديد');
                                }}
                            >
                                <RefreshCw className="ml-2 h-5 w-5 group-hover:rotate-180 transition-transform" />
                                مراجعة القصص
                            </Button>
                        </motion.div>
                    )}
                </Card>
            </motion.div>

            <CelebrationEffects
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                type="stories"
            />
        </motion.div>
    );
} 