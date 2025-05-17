"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIStoryGenerator } from "@/components/learning/AIStoryGenerator";
import { ArrowLeft, BookOpen, BookText, Wand } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from 'sonner';

export default function AIStoriesPage() {
    const [userId, setUserId] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Load user from localStorage
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }

        try {
            const user = JSON.parse(userData);
            setUserId(user.id);
        } catch (error) {
            console.error('Error parsing user data:', error);
            toast.error('حدث خطأ في تحميل بيانات المستخدم');
            router.push('/login');
        }
    }, []);

    if (!userId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-bounce text-4xl mb-4">📚</div>
                    <p className="text-xl font-arabic">جاري التحميل...</p>
                </div>
            </div>
        );
    }

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
                    قصص ذكية للتدريب على النطق
                </motion.h1>
                <p className="text-xl text-muted-foreground font-arabic leading-relaxed">
                    قصص تفاعلية مخصصة تركز على الكلمات التي تواجه صعوبة في نطقها
                </p>
            </div>

            <div className="flex justify-between items-center mb-6">
                <Button
                    variant="outline"
                    onClick={() => router.push('/learn/stories')}
                    className="font-arabic"
                >
                    <ArrowLeft className="h-4 w-4 ml-2" />
                    العودة إلى القصص
                </Button>

                <div className="flex items-center gap-2">
                    <Wand className="h-5 w-5 text-primary animate-pulse" />
                    <span className="font-arabic text-sm text-muted-foreground">
                        تم إنشاؤها بواسطة الذكاء الاصطناعي
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <AIStoryGenerator userId={userId} />

                <Card className="p-6 mt-8">
                    <div className="text-center space-y-4">
                        <BookText className="h-12 w-12 mx-auto text-primary" />
                        <h3 className="text-xl font-bold font-arabic">كيف تعمل القصص الذكية؟</h3>
                        <p className="font-arabic text-muted-foreground">
                            نقوم بتحليل أخطاء النطق التي واجهتها سابقًا، ثم ننشئ قصصًا مخصصة تحتوي على هذه الكلمات
                            لمساعدتك على التدريب بطريقة ممتعة ومفيدة.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div className="bg-muted/10 rounded-lg p-4 text-center">
                                <div className="rounded-full bg-primary/10 h-12 w-12 flex items-center justify-center mx-auto mb-2">
                                    <span className="font-bold text-primary">1</span>
                                </div>
                                <h4 className="font-bold font-arabic mb-2">تحليل الأخطاء</h4>
                                <p className="text-sm font-arabic text-muted-foreground">
                                    نحلل الكلمات التي واجهت صعوبة في نطقها خلال التمارين السابقة
                                </p>
                            </div>

                            <div className="bg-muted/10 rounded-lg p-4 text-center">
                                <div className="rounded-full bg-primary/10 h-12 w-12 flex items-center justify-center mx-auto mb-2">
                                    <span className="font-bold text-primary">2</span>
                                </div>
                                <h4 className="font-bold font-arabic mb-2">إنشاء القصة</h4>
                                <p className="text-sm font-arabic text-muted-foreground">
                                    ننشئ قصة بموضوع من اختيارك تتضمن هذه الكلمات بشكل طبيعي
                                </p>
                            </div>

                            <div className="bg-muted/10 rounded-lg p-4 text-center">
                                <div className="rounded-full bg-primary/10 h-12 w-12 flex items-center justify-center mx-auto mb-2">
                                    <span className="font-bold text-primary">3</span>
                                </div>
                                <h4 className="font-bold font-arabic mb-2">تمارين مخصصة</h4>
                                <p className="text-sm font-arabic text-muted-foreground">
                                    نضيف تمارين تساعدك على إتقان نطق الكلمات الصعبة بطريقة مركزة
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
} 