"use client";

import { useState, useEffect, useRef } from 'react';
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
import { ImageGenerator } from "@/components/learning/ImageGenerator";
import { SectionExercises } from "@/components/learning/SectionExercises";
import { SpeechRecognition } from "@/components/learning/SpeechRecognition";
import { SpeechAnalytics } from "@/components/learning/SpeechAnalytics";
import { SpeechService } from "@/lib/services/speech-service";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProgressState {
    [key: string]: number | {
        read?: boolean;
        vocabularyLearned?: boolean;
        questionsAnswered?: boolean;
        speechCompleted?: boolean;
        score?: number;
        speechAccuracy?: number;
    } | {
        completed: boolean;
        accuracy: number;
    };
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
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [showSectionExercises, setShowSectionExercises] = useState(false);
    const [allCategories, setAllCategories] = useState(arabicSentences);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [activeTab, setActiveTab] = useState("");
    const [viewMode, setViewMode] = useState<'scroll' | 'grid'>('scroll');
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // إضافة حالات للحوار وعملية توليد الفئات
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [difficultyLevel, setDifficultyLevel] = useState("beginner");
    const [numSentences, setNumSentences] = useState(5);

    const [showSpeechPractice, setShowSpeechPractice] = useState(false);
    const [speechAccuracy, setSpeechAccuracy] = useState(0);
    const speechService = new SpeechService();

    const router = useRouter();
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const scrollableRef = useRef<HTMLDivElement>(null);

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

                // تحميل الفئات المخصصة من الخادم
                await loadCustomCategories(user.id);
            } catch (error) {
                console.error('Error loading progress:', error);
                toast.error('حدث خطأ في تحميل التقدم');
            }
        };

        loadProgress();
    }, []);

    // تحميل الفئات المخصصة من الخادم
    const loadCustomCategories = async (userId: number) => {
        try {
            setIsLoadingCategories(true);
            const response = await fetch(`http://localhost:5000/api/learning/custom-sentence-categories/${userId}`);
            if (response.ok) {
                const result = await response.json();

                if (result.success && Array.isArray(result.categories) && result.categories.length > 0) {
                    // دمج الفئات المخصصة مع الفئات الافتراضية
                    const baseCategories = arabicSentences;

                    // دمج الفئات وتجنب التكرار
                    const merged = [...baseCategories];

                    result.categories.forEach((customCat: any) => {
                        // تنسيق البيانات للتوافق مع بنية الفئات
                        const formattedCategory = {
                            id: customCat.id,
                            title: customCat.title,
                            description: customCat.description,
                            icon: customCat.icon,
                            sentences: customCat.sentences
                        };

                        // البحث عن الفئة إذا كانت موجودة من قبل
                        const existingIndex = merged.findIndex(cat => cat.id === customCat.id);

                        if (existingIndex >= 0) {
                            // تحديث الفئة الموجودة
                            merged[existingIndex] = formattedCategory;
                        } else {
                            // إضافة فئة جديدة
                            merged.push(formattedCategory);
                        }
                    });

                    setAllCategories(merged);

                    // تعيين علامة التبويب النشطة (إذا لم تكن محددة بالفعل)
                    if (!activeTab && merged.length > 0) {
                        setActiveTab(merged[0].id);
                        setSelectedCategory(merged[0]);
                        setSelectedSentence(merged[0].sentences[0]);
                    }
                }
            } else {
                console.error('Error loading custom categories');
            }
            setIsLoadingCategories(false);
        } catch (error) {
            console.error('Error loading custom categories:', error);
            setIsLoadingCategories(false);
        }
    };

    const saveProgressToServer = async () => {
        if (!userId) return;

        try {
            setIsSaving(true);
            // Get previous progress data format
            const sentenceProgressData = { ...progress };

            // Convert to new format if needed for compatibility
            const progressData = Object.keys(sentenceProgressData).reduce((acc, key) => {
                if (typeof sentenceProgressData[key] === 'number') {
                    acc[key] = {
                        read: sentenceProgressData[key] === 100,
                        speechCompleted: !!sentenceProgressData[`${key}_speech`]
                    };
                } else {
                    acc[key] = sentenceProgressData[key];
                }
                return acc;
            }, {} as Record<string, any>);

            const totalSentences = allCategories.reduce((sum, category) => sum + category.sentences.length, 0);
            const learnedSentences = Object.keys(progressData).filter(key => {
                const progress = progressData[key];
                return (typeof progress === 'number' && progress === 100) ||
                    (typeof progress === 'object' && progress.read === true);
            }).length;
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
                    learned_items: progressData
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
                        learned_items: progressData
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
            const currentCategoryIndex = allCategories.indexOf(selectedCategory);
            if (currentCategoryIndex < allCategories.length - 1) {
                const nextCategory = allCategories[currentCategoryIndex + 1];
                setSelectedCategory(nextCategory);
                setSelectedSentence(nextCategory.sentences[0]);
            }
        }

        setShowTranslation(false);
        setShowWords(false);
    };

    const totalProgress = Math.round(
        (Object.keys(progress).filter(key => progress[key] === 100).length /
            allCategories.reduce((sum, category) => sum + category.sentences.length, 0)) * 100
    );

    const isSentenceLearned = (category: string, sentence: string) => {
        return progress[`${category}-${sentence}`] === 100;
    };

    // التعامل مع إكمال التمارين
    const handleExercisesComplete = (score: number, total: number) => {
        // إعادة للوضع العادي بعد الانتهاء من التمارين
        setShowSectionExercises(false);

        // عرض النتيجة بشكل منبثق
        toast.success(`أكملت التمارين بنتيجة ${score} من ${total}`, {
            description: "استمر في التعلم والتدرب على الجمل الأخرى"
        });

        // إذا كانت النتيجة جيدة، نعتبر القسم مكتملاً
        if (score / total >= 0.7) {
            // وضع علامة تعلم على جميع جمل القسم الحالي
            selectedCategory.sentences.forEach((sentence) => {
                const sentenceKey = `${selectedCategory.id}-${sentence.sentence}`;
                if (!progress[sentenceKey]) {
                    setProgress(prev => ({
                        ...prev,
                        [sentenceKey]: 100
                    }));
                }
            });

            toast.success(`أحسنت! تم إكمال قسم ${selectedCategory.title} بنجاح`, {
                icon: <Icons.Award className="text-yellow-500" />,
            });
        }
    };

    // إضافة وظيفة لإنشاء فئة جديدة باستخدام النموذج اللغوي
    const generateNewCategory = async () => {
        if (!userId) {
            toast.error('يجب تسجيل الدخول لاستخدام هذه الميزة');
            return;
        }

        try {
            setIsGenerating(true);

            const response = await fetch('http://localhost:5000/api/learning/generate-sentence-category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category_name: categoryName || undefined,
                    difficulty_level: difficultyLevel,
                    num_sentences: numSentences,
                    user_id: userId
                }),
            });

            if (!response.ok) {
                throw new Error('فشل في توليد فئة جديدة');
            }

            const result = await response.json();

            if (result.success && result.category) {
                // إضافة الفئة الجديدة إلى القائمة
                const newCategory = result.category;

                // تحديث قائمة الفئات
                setAllCategories(prevCategories => [...prevCategories, newCategory]);

                // إغلاق الحوار
                setIsGenerateDialogOpen(false);

                // عرض رسالة نجاح
                toast.success('تم إنشاء فئة جديدة بنجاح!', {
                    description: `تمت إضافة "${newCategory.title}" بـ ${newCategory.sentences.length} جمل`
                });

                // تعيين الفئة الجديدة كعلامة تبويب نشطة
                setActiveTab(newCategory.id);

                // مؤقت قصير للتأكد من اكتمال تحديث الحالة
                setTimeout(() => {
                    // تحديد الفئة المضافة حديثًا
                    setSelectedCategory(newCategory);
                    if (newCategory.sentences.length > 0) {
                        setSelectedSentence(newCategory.sentences[0]);
                    }

                    // تمرير شريط التصنيفات إلى آخر عنصر (الفئة الجديدة)
                    const scrollElement = scrollableRef.current;
                    if (scrollElement) {
                        scrollElement.scrollTo({
                            left: scrollElement.scrollWidth,
                            behavior: 'smooth'
                        });
                    }
                }, 200);
            } else {
                throw new Error(result.message || 'فشل في توليد فئة جديدة');
            }
        } catch (error) {
            console.error('Error generating category:', error);
            toast.error('حدث خطأ في إنشاء الفئة الجديدة');
        } finally {
            setIsGenerating(false);
        }
    };

    // Update scroll indicators
    const updateScrollIndicators = () => {
        const scrollElement = scrollableRef.current;
        if (scrollElement) {
            setCanScrollLeft(scrollElement.scrollLeft > 0);
            setCanScrollRight(
                scrollElement.scrollLeft < scrollElement.scrollWidth - scrollElement.clientWidth - 10
            );
        }
    };

    // Add an effect to check for scroll possibilities whenever categories change
    useEffect(() => {
        if (viewMode === 'scroll') {
            updateScrollIndicators();
            // Add scroll event listener to update indicators during scrolling
            const scrollElement = scrollableRef.current;
            if (scrollElement) {
                scrollElement.addEventListener('scroll', updateScrollIndicators);
                return () => scrollElement.removeEventListener('scroll', updateScrollIndicators);
            }
        }
    }, [allCategories, viewMode]);

    // Also update indicators after layout changes
    useEffect(() => {
        const timer = setTimeout(updateScrollIndicators, 500);
        return () => clearTimeout(timer);
    }, [viewMode, isLoadingCategories, allCategories.length]);

    // Handle speech completion
    const handleSpeechComplete = async (results: { accuracy: number; recognizedText: string; errors: Array<{ word: string; type: 'severe' | 'minor' | 'correct' }> }) => {
        if (userId) {
            try {
                // Save to backend
                await speechService.saveSpeechActivity({
                    user_id: userId,
                    story_id: `sentence-${selectedCategory.id}-${selectedSentence.sentence.substring(0, 20)}`,
                    original_text: selectedSentence.sentence,
                    recognized_text: results.recognizedText,
                    accuracy: results.accuracy
                });

                // Update local progress
                const sentenceKey = `${selectedCategory.id}-${selectedSentence.sentence}`;
                setProgress(prev => {
                    const existingProgress = prev[sentenceKey];
                    if (typeof existingProgress === 'number') {
                        return {
                            ...prev,
                            [sentenceKey]: 100,
                            [`${sentenceKey}_speech`]: {
                                completed: true,
                                accuracy: results.accuracy
                            }
                        } as ProgressState;
                    } else {
                        return {
                            ...prev,
                            [sentenceKey]: {
                                ...(typeof existingProgress === 'object' ? existingProgress : {}),
                                read: true,
                                speechCompleted: true,
                                speechAccuracy: results.accuracy
                            }
                        } as ProgressState;
                    }
                });

                setSpeechAccuracy(results.accuracy);

                if (results.accuracy >= 70) {
                    toast.success('أحسنت! لقد تمكنت من قراءة الجملة بشكل جيد 🎉');
                } else if (results.accuracy >= 50) {
                    toast.info('جيد! استمر في التمرين لتحسين مهارات القراءة لديك.');
                } else {
                    toast.info('استمر في التمرين، ستتحسن مع الوقت!');
                }

                // Save progress to server
                saveProgressToServer();
            } catch (error) {
                console.error('Error saving speech activity:', error);
            }
        }
    };

    // Handle speech accuracy change
    const handleSpeechAccuracyChange = (accuracy: number) => {
        setSpeechAccuracy(accuracy);
    };

    // Check if sentence has speech practice completed
    const isSentenceSpeechCompleted = (categoryId: string, sentence: string) => {
        const sentenceKey = `${categoryId}-${sentence}`;
        const progressValue = progress[sentenceKey];

        if (!progressValue) return false;

        if (typeof progressValue === 'object') {
            return 'speechCompleted' in progressValue && progressValue.speechCompleted === true;
        }

        // Check if there's a speech completion record
        return !!progress[`${sentenceKey}_speech`];
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
                        اختر فئة للبدء في تعلم جملها
                    </motion.p>
                </div>

                <Card className="p-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold font-arabic">التقدم الكلي</h2>
                            <span className="font-arabic text-lg">{totalProgress}%</span>
                        </div>
                        <Progress value={totalProgress} className="h-2" />

                        <div className="flex justify-center gap-4 mt-4">
                            {totalProgress === 100 && (
                                <>
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
                                            setSelectedCategory(allCategories[0]);
                                            setSelectedSentence(allCategories[0].sentences[0]);
                                            setShowTranslation(false);
                                            setShowWords(false);
                                        }}
                                    >
                                        <Icons.RefreshCw className="ml-2 h-5 w-5 group-hover:rotate-180 transition-transform" />
                                        مراجعة الجمل
                                    </Button>
                                </>
                            )}
                            <Button
                                className="font-arabic text-lg group bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                                onClick={() => setIsGenerateDialogOpen(true)}
                            >
                                <Icons.Sparkles className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                توليد فئة جديدة
                            </Button>
                        </div>
                    </div>
                </Card>

                <Tabs
                    defaultValue={activeTab || allCategories[0]?.id}
                    value={activeTab || allCategories[0]?.id}
                    onValueChange={setActiveTab}
                    className="space-y-4"
                >
                    <div className="relative w-full">
                        <div className="flex justify-end flex-wrap mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewMode(viewMode === 'scroll' ? 'grid' : 'scroll')}
                                className="font-arabic"
                            >
                                {viewMode === 'scroll' ? (
                                    <>
                                        <Icons.Grid className="ml-2 h-4 w-4" />
                                        عرض شبكي
                                    </>
                                ) : (
                                    <>
                                        <Icons.ArrowLeftRight className="ml-2 h-4 w-4" />
                                        عرض أفقي
                                    </>
                                )}
                            </Button>
                        </div>

                        {isLoadingCategories ? (
                            <div className="flex justify-center items-center py-4">
                                <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="font-arabic mr-2">جاري تحميل الفئات...</span>
                            </div>
                        ) : viewMode === 'scroll' ? (
                            <div className="relative">
                                <ScrollArea className="w-full" scrollHideDelay={0}>
                                    <div
                                        ref={scrollableRef}
                                        className="overflow-x-auto"
                                        onScroll={updateScrollIndicators}
                                    >
                                        <div ref={tabsContainerRef} className="relative">
                                            <TabsList className="flex w-max px-12 mb-4" key={allCategories.length}>
                                                {allCategories.map((category) => (
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
                                        </div>
                                    </div>
                                </ScrollArea>

                                {canScrollLeft && (
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="absolute left-1 top-1/2 transform -translate-y-1/2 shadow-md rounded-full bg-background/80 backdrop-blur-sm hover:bg-background z-10"
                                        onClick={() => {
                                            const scrollElement = scrollableRef.current;
                                            if (scrollElement) {
                                                scrollElement.scrollTo({
                                                    left: scrollElement.scrollLeft - 300,
                                                    behavior: 'smooth'
                                                });
                                            }
                                        }}
                                    >
                                        <Icons.ChevronLeft className="h-4 w-4" />
                                    </Button>
                                )}

                                {canScrollRight && (
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 shadow-md rounded-full bg-background/80 backdrop-blur-sm hover:bg-background z-10"
                                        onClick={() => {
                                            const scrollElement = scrollableRef.current;
                                            if (scrollElement) {
                                                scrollElement.scrollTo({
                                                    left: scrollElement.scrollLeft + 300,
                                                    behavior: 'smooth'
                                                });
                                            }
                                        }}
                                    >
                                        <Icons.ChevronRight className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2 bg-transparent h-auto flex-wrap">
                                {allCategories.map((category) => (
                                    <TabsTrigger
                                        key={category.id}
                                        value={category.id}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setSelectedSentence(category.sentences[0]);
                                            setShowTranslation(false);
                                            setShowWords(false);
                                        }}
                                        className="font-arabic p-4 h-auto w-full flex flex-col items-center justify-center gap-2 rounded-lg border shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                    >
                                        <span className="text-3xl">{category.icon}</span>
                                        <span className="text-center font-semibold">{category.title}</span>
                                        <Badge variant="outline" className="mt-1 px-2 py-1">
                                            {category.sentences.filter(s =>
                                                isSentenceLearned(category.id, s.sentence)
                                            ).length} / {category.sentences.length}
                                        </Badge>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        )}
                    </div>

                    {allCategories.map((category) => (
                        <TabsContent key={category.id} value={category.id}>
                            <Card className="p-6">
                                <div className="space-y-6">
                                    <div className="text-center space-y-4">
                                        <h3 className="text-2xl font-bold font-arabic">{category.title}</h3>
                                        <p className="text-muted-foreground font-arabic">
                                            {category.description}
                                        </p>
                                    </div>

                                    {showSectionExercises && selectedCategory.id === category.id ? (
                                        // عرض مكون تمارين القسم
                                        <SectionExercises
                                            sectionTitle={category.title}
                                            sentences={category.sentences}
                                            onComplete={handleExercisesComplete}
                                        />
                                    ) : (
                                        // عرض محتوى القسم العادي
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

                                                    {/* Add speech practice section */}
                                                    <AnimatePresence mode="wait">
                                                        {showSpeechPractice && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="pt-4 border-t"
                                                            >
                                                                <SpeechRecognition
                                                                    originalText={selectedSentence.sentence}
                                                                    onAccuracyChange={handleSpeechAccuracyChange}
                                                                    onComplete={handleSpeechComplete}
                                                                />

                                                                {userId && speechAccuracy > 0 && (
                                                                    <div className="mt-6 pt-4 border-t">
                                                                        <h3 className="text-xl font-bold font-arabic text-right mb-4">تحليل أداء النطق</h3>
                                                                        <SpeechAnalytics
                                                                            userId={userId}
                                                                            storyId={`sentence-${selectedCategory.id}-${selectedSentence.sentence.substring(0, 20)}`}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>

                                                {/* Add Image Generator Component */}
                                                <AnimatePresence>
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.3 }}
                                                    >
                                                        <ImageGenerator
                                                            text={selectedSentence.sentence}
                                                            className="mt-4"
                                                        />
                                                    </motion.div>
                                                </AnimatePresence>

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

                                                <div className="flex justify-center gap-3 mt-4">
                                                    <Button
                                                        onClick={markAsLearned}
                                                        className={cn(
                                                            "font-arabic text-lg transition-all",
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

                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setShowSectionExercises(true)}
                                                        className="font-arabic"
                                                    >
                                                        <Icons.GraduationCap className="ml-2 h-5 w-5" />
                                                        تمارين القسم
                                                    </Button>

                                                    <Button
                                                        variant={showSpeechPractice ? "default" : "outline"}
                                                        onClick={() => setShowSpeechPractice(!showSpeechPractice)}
                                                        className="font-arabic"
                                                    >
                                                        <Icons.Mic className="ml-2 h-5 w-5" />
                                                        {showSpeechPractice ? 'إخفاء تمرين النطق' : 'تمرين النطق'}
                                                    </Button>
                                                </div>
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
                                    )}
                                </div>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* حوار توليد فئة جديدة */}
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-arabic text-xl">إنشاء فئة جديدة من الجمل</DialogTitle>
                        <DialogDescription className="font-arabic">
                            سيتم استخدام الذكاء الاصطناعي لتوليد فئة جديدة من الجمل المناسبة للأطفال
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 font-arabic">
                        <div className="grid gap-2">
                            <Label className="font-arabic" htmlFor="category-name">اسم الفئة (اختياري)</Label>
                            <Input
                                id="category-name"
                                placeholder="اترك فارغًا لاقتراح فئة تلقائيًا"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                className="font-arabic"
                                dir="rtl"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="font-arabic" htmlFor="difficulty">مستوى الصعوبة</Label>
                            <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                                <SelectTrigger id="difficulty" className="font-arabic">
                                    <SelectValue placeholder="اختر المستوى" />
                                </SelectTrigger>
                                <SelectContent className="font-arabic">
                                    <SelectItem value="beginner">مبتدئ</SelectItem>
                                    <SelectItem value="intermediate">متوسط</SelectItem>
                                    <SelectItem value="advanced">متقدم</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label className="font-arabic" htmlFor="num-sentences">عدد الجمل</Label>
                            <Select
                                value={String(numSentences)}
                                onValueChange={(val) => setNumSentences(Number(val))}
                            >
                                <SelectTrigger id="num-sentences" className="font-arabic">
                                    <SelectValue placeholder="عدد الجمل" />
                                </SelectTrigger>
                                <SelectContent className="font-arabic">
                                    <SelectItem value="3">3 جمل</SelectItem>
                                    <SelectItem value="5">5 جمل</SelectItem>
                                    <SelectItem value="7">7 جمل</SelectItem>
                                    <SelectItem value="10">10 جمل</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            onClick={generateNewCategory}
                            disabled={isGenerating}
                            className="font-arabic"
                        >
                            {isGenerating ? (
                                <>
                                    <Icons.Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    جارِ التوليد...
                                </>
                            ) : (
                                <>
                                    <Icons.Sparkles className="ml-2 h-4 w-4" />
                                    توليد الفئة
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CelebrationEffects
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
            />
        </motion.div>
    );
} 