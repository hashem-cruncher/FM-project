// fm-frontend\src\app\dashboard\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import * as Icons from "lucide-react";
import { toast } from 'sonner';

interface User {
    id: number;
    username: string;
    nickname?: string;
    email: string;
    streak_days: number;
    total_stars: number;
    completed_lessons: number;
}

interface LearningLevel {
    id: number;
    title: string;
    description: string;
    order: number;
    icon_name: string;
    color_class: string;
    progress: number;
    is_locked: boolean;
}

interface UserProgress {
    level_id: number;
    level_progress: number;
    is_completed: boolean;
    completed_at: string | null;
    learned_items: Record<string, any>;
    is_locked: boolean;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [levels, setLevels] = useState<LearningLevel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userData);
        setUser(currentUser);

        try {
            // Clear any stale progress data
            localStorage.removeItem('alphabet_progress');
            localStorage.removeItem('diacritics_progress');

            // Fetch server progress
            const progressResponse = await fetch(`http://localhost:5000/api/progress/user/${currentUser.id}`);
            let userProgress: UserProgress[] = [];

            if (progressResponse.ok) {
                userProgress = await progressResponse.json();
                console.log('User Progress from server:', userProgress);

                // Fetch levels
                const response = await fetch(`http://localhost:5000/api/learning/levels?user_id=${currentUser.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch levels');
                }

                const levelsData = await response.json();
                console.log('Levels data:', levelsData);

                // Merge levels with progress
                const enhancedLevels = levelsData.map((level: LearningLevel) => {
                    const levelProgress = userProgress.find((p) => p.level_id === level.id);
                    console.log(`Processing level ${level.id}:`, { levelProgress });

                    const previousLevelCompleted = level.id === 1 || userProgress.some((p) =>
                        p.level_id === level.id - 1 &&
                        p.is_completed &&
                        p.level_progress === 100
                    );

                    console.log(`Level ${level.id} previous level completed:`, previousLevelCompleted);

                    return {
                        ...level,
                        progress: levelProgress?.level_progress || 0,
                        is_locked: !previousLevelCompleted
                    };
                });

                console.log('Enhanced levels:', enhancedLevels);
                setLevels(enhancedLevels);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('حدث خطأ في تحميل البيانات');
        } finally {
            setIsLoading(false);
        }
    };

    // تحديث البيانات عند تحميل الصفحة
    useEffect(() => {
        fetchData();
    }, []);

    // تحديث البيانات عند العودة للصفحة
    useEffect(() => {
        window.addEventListener('focus', fetchData);
        return () => window.removeEventListener('focus', fetchData);
    }, []);

    // Get icon component by name
    const getIcon = (iconName: string) => {
        const Icon = (Icons as any)[iconName];
        return Icon ? <Icon className="h-8 w-8" /> : null;
    };

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-bounce text-4xl mb-4">🎈</div>
                    <p className="text-xl font-arabic">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <div className="inline-block p-4 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 mb-4">
                    <Icons.Trophy className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <div className="flex items-center justify-center gap-3">
                    <h1 className="text-4xl font-bold font-arabic mb-4">
                        مرحباً {user.nickname || user.username} 🌟
                    </h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-primary/10"
                        onClick={() => router.push('/profile')}
                    >
                        <Icons.User className="h-6 w-6" />
                    </Button>
                </div>
                <p className="text-xl text-muted-foreground font-arabic">
                    هيا نبدأ مغامرة تعلم القراءة معاً!
                </p>
            </div>

            <h2 className="text-2xl font-bold font-arabic mb-6">المستويات التعليمية</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Special Alphabet Card - Always First */}
                <Card
                    className="p-6 relative overflow-hidden transition-all duration-300 hover:scale-105"
                >
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                            <Icons.Languages className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-arabic mb-2">
                                الحروف الهجائية
                            </h2>
                            <p className="text-muted-foreground font-arabic">
                                تعلم الحروف العربية بطريقة تفاعلية مع التدريب على الكتابة والنطق
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-arabic">
                                <span>التقدم</span>
                                <span>{levels.find(l => l.id === 1)?.progress || 0}%</span>
                            </div>
                            <Progress value={levels.find(l => l.id === 1)?.progress || 0} className="h-2" />
                        </div>

                        <Button
                            className="w-full font-arabic text-lg py-6 group relative overflow-hidden"
                            onClick={() => router.push('/learn/alphabet')}
                        >
                            <span className="relative z-10">
                                {levels.find(l => l.id === 1)?.progress === 100 ? "مراجعة" : levels.find(l => l.id === 1)?.progress === 0 ? "ابدأ التعلم" : "أكمل التعلم"}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 transform group-hover:translate-x-full transition-transform duration-300" />
                        </Button>
                    </div>
                </Card>

                {/* Other Levels */}
                {levels.slice(1).map((level) => (
                    <Card
                        key={level.id}
                        className={`p-6 relative overflow-hidden transition-all duration-300 hover:scale-105 ${level.is_locked ? 'opacity-75' : ''}`}
                    >
                        {level.is_locked && (
                            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-10">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🔒</div>
                                    <p className="text-lg font-arabic">
                                        أكمل المستوى السابق أولاً
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-4 mb-6">
                            <div className={`p-3 rounded-xl ${level.color_class}`}>
                                {getIcon(level.icon_name)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold font-arabic mb-2">
                                    {level.title}
                                </h2>
                                <p className="text-muted-foreground font-arabic">
                                    {level.description}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-arabic">
                                    <span>التقدم</span>
                                    <span>{level.progress}%</span>
                                </div>
                                <Progress value={level.progress} className="h-2" />
                            </div>

                            <Button
                                className="w-full font-arabic text-lg py-6 group relative overflow-hidden"
                                disabled={level.is_locked}
                                onClick={() => router.push(`/lessons/${level.id}`)}
                            >
                                <span className="relative z-10">
                                    {level.progress === 0 ? "ابدأ التعلم" : "أكمل التعلم"}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 transform group-hover:translate-x-full transition-transform duration-300" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="mt-12 p-6">
                <div className="text-center space-y-6">
                    <h3 className="text-2xl font-bold font-arabic">إنجازاتك 🏆</h3>
                    <div className="flex justify-center gap-8">
                        <div className="text-center space-y-2">
                            <div className="text-3xl font-bold text-primary">{user.completed_lessons}</div>
                            <div className="text-sm font-arabic text-muted-foreground">
                                درس مكتمل
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="text-3xl font-bold text-primary">{user.total_stars}</div>
                            <div className="text-sm font-arabic text-muted-foreground">
                                نجوم ذهبية
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="text-3xl font-bold text-primary">{user.streak_days}</div>
                            <div className="text-sm font-arabic text-muted-foreground">
                                أيام متتالية
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <Button
                            variant="outline"
                            className="font-arabic text-lg group"
                            onClick={() => router.push('/profile')}
                        >
                            <Icons.User className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                            عرض الملف الشخصي
                        </Button>
                    </div>

                    {/* إضافة وحدة لعرض آخر الدروس */}
                    <div className="mt-8">
                        <h4 className="text-xl font-bold font-arabic mb-4">آخر نشاط</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {levels.flatMap((level: any) =>
                                (level.lessons || [])
                                    .filter((lesson: any) => lesson.progress > 0 && !lesson.is_completed)
                                    .slice(0, 2) // عرض آخر درسين فقط
                                    .map((lesson: any) => (
                                        <Card key={`${level.id}-${lesson.lesson_id}`} className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-bold font-arabic">{level.title}</h5>
                                                    <p className="text-sm font-arabic text-muted-foreground">{lesson.lesson_title}</p>
                                                </div>
                                                <Button
                                                    onClick={() => router.push(`/lessons/${level.id}/${lesson.lesson_id}`)}
                                                    className="font-arabic text-sm"
                                                >
                                                    أكمل التعلم
                                                </Button>
                                            </div>
                                            <Progress value={lesson.progress} className="h-2 mt-2" />
                                        </Card>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
