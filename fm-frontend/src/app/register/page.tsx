'use client';

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import Link from "next/link"
import { UserPlus, User, Mail, KeyRound, Sparkles, Brain, Book } from "lucide-react"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        nickname: "",
        age: "",
        arabicLevel: "",
        learningStyle: "",
        favoriteColor: "",
        favoriteAnimal: "",
        preferredLearningTime: "",
        hobbies: "",
    });

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            // Validate password match
            if (formData.password !== formData.confirmPassword) {
                toast.error("كلمات المرور غير متطابقة!");
                return;
            }
            // Validate required fields
            if (!formData.username || !formData.email || !formData.password) {
                toast.error("جميع الحقول مطلوبة!");
                return;
            }
            setStep(2);
            return;
        }

        // Validate step 2 required fields
        if (!formData.nickname || !formData.age || !formData.arabicLevel || !formData.learningStyle) {
            toast.error("الرجاء إكمال جميع الحقول المطلوبة!");
            return;
        }

        setIsLoading(true);
        try {
            // Remove confirmPassword before sending to backend
            const { confirmPassword, ...dataToSend } = formData;

            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const data = await response.json();

                // Handle validation errors
                if (data.errors) {
                    data.errors.forEach((error: string) => toast.error(error));
                    if (data.errors.some((error: string) =>
                        error.includes('اسم المستخدم') ||
                        error.includes('البريد الإلكتروني') ||
                        error.includes('كلمة المرور')
                    )) {
                        setStep(1); // Go back to first step for credential-related errors
                    }
                    throw new Error('validation_errors');
                }

                // Handle other errors
                if (data.error) {
                    toast.error(data.error);
                    if (data.error.includes('اسم المستخدم') || data.error.includes('البريد الإلكتروني')) {
                        setStep(1);
                    }
                    throw new Error(data.error);
                }

                throw new Error('حدث خطأ في التسجيل');
            }

            const data = await response.json();

            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));

            // Show success message
            toast.success('تم إنشاء الحساب بنجاح! 🎉');

            // Clear form data
            setFormData({
                username: "",
                email: "",
                password: "",
                confirmPassword: "",
                nickname: "",
                age: "",
                arabicLevel: "",
                learningStyle: "",
                favoriteColor: "",
                favoriteAnimal: "",
                preferredLearningTime: "",
                hobbies: "",
            });

            // Redirect to dashboard and refresh navigation state
            router.push('/dashboard');
            router.refresh();

        } catch (error: any) {
            if (error.message !== 'validation_errors') {
                console.error('Registration error:', error);
                toast.error(error.message || 'حدث خطأ في الاتصال بالخادم');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-md mx-auto px-4 py-8">
            <div className="text-center mb-8">
                <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
                    <UserPlus className="h-12 w-12 text-primary" />
                </div>
                <h1 className="kid-title text-4xl mb-2">انضم إلى مغامرة التعلم! 🚀</h1>
                <p className="text-xl text-muted-foreground font-arabic">
                    {step === 1 ? "أخبرنا عن نفسك" : "اختر تفضيلاتك المفضلة"}
                </p>
            </div>

            <Card className="p-8 kid-friendly-card border-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 ? (
                        <>
                            <div className="space-y-4">
                                <Label htmlFor="username" className="text-lg font-arabic flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    اسم المستخدم
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="اختر اسماً مميزاً"
                                    className="text-lg py-6 text-right font-arabic"
                                    value={formData.username}
                                    onChange={(e) => updateFormData("username", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="email" className="text-lg font-arabic flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    البريد الإلكتروني
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="أدخل بريدك الإلكتروني"
                                    className="text-lg py-6 text-right font-arabic"
                                    value={formData.email}
                                    onChange={(e) => updateFormData("email", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="password" className="text-lg font-arabic flex items-center gap-2">
                                    <KeyRound className="h-5 w-5" />
                                    كلمة المرور
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="اختر كلمة مرور قوية"
                                    className="text-lg py-6 text-right font-arabic"
                                    value={formData.password}
                                    onChange={(e) => updateFormData("password", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="confirmPassword" className="text-lg font-arabic flex items-center gap-2">
                                    <KeyRound className="h-5 w-5" />
                                    تأكيد كلمة المرور
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="أعد كتابة كلمة المرور"
                                    className="text-lg py-6 text-right font-arabic"
                                    value={formData.confirmPassword}
                                    onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <Label htmlFor="nickname" className="text-lg font-arabic flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    الاسم المستعار
                                </Label>
                                <Input
                                    id="nickname"
                                    type="text"
                                    placeholder="ما هو اسمك المفضل؟"
                                    className="text-lg py-6 text-right font-arabic"
                                    value={formData.nickname}
                                    onChange={(e) => updateFormData("nickname", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="age" className="text-lg font-arabic flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    العمر
                                </Label>
                                <Select
                                    value={formData.age}
                                    onValueChange={(value) => updateFormData("age", value)}
                                >
                                    <SelectTrigger className="text-lg py-6 text-right font-arabic">
                                        <SelectValue placeholder="اختر عمرك" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[5, 6, 7, 8, 9, 10, 11, 12].map((age) => (
                                            <SelectItem key={age} value={age.toString()}>
                                                {age} سنوات
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="arabicLevel" className="text-lg font-arabic flex items-center gap-2">
                                    <Book className="h-5 w-5" />
                                    مستوى اللغة العربية
                                </Label>
                                <Select
                                    value={formData.arabicLevel}
                                    onValueChange={(value) => updateFormData("arabicLevel", value)}
                                >
                                    <SelectTrigger className="text-lg py-6 text-right font-arabic">
                                        <SelectValue placeholder="اختر مستواك" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">مبتدئ</SelectItem>
                                        <SelectItem value="intermediate">متوسط</SelectItem>
                                        <SelectItem value="advanced">متقدم</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="learningStyle" className="text-lg font-arabic flex items-center gap-2">
                                    <Brain className="h-5 w-5" />
                                    أسلوب التعلم المفضل
                                </Label>
                                <Select
                                    value={formData.learningStyle}
                                    onValueChange={(value) => updateFormData("learningStyle", value)}
                                >
                                    <SelectTrigger className="text-lg py-6 text-right font-arabic">
                                        <SelectValue placeholder="كيف تحب أن تتعلم؟" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="visual">بالصور 🎨</SelectItem>
                                        <SelectItem value="audio">بالصوت والموسيقى 🎵</SelectItem>
                                        <SelectItem value="interactive">التفاعل 🎮</SelectItem>
                                        <SelectItem value="reading">بالقراءة والكتابة 📚</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="favoriteColor" className="text-lg font-arabic flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    اللون المفضل
                                </Label>
                                <Select
                                    value={formData.favoriteColor}
                                    onValueChange={(value) => updateFormData("favoriteColor", value)}
                                >
                                    <SelectTrigger className="text-lg py-6 text-right font-arabic">
                                        <SelectValue placeholder="ما هو لونك المفضل؟" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="red">أحمر ❤️</SelectItem>
                                        <SelectItem value="blue">أزرق 💙</SelectItem>
                                        <SelectItem value="green">أخضر 💚</SelectItem>
                                        <SelectItem value="yellow">أصفر 💛</SelectItem>
                                        <SelectItem value="purple">بنفسجي 💜</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="hobbies" className="text-lg font-arabic flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    الهوايات
                                </Label>
                                <Input
                                    id="hobbies"
                                    type="text"
                                    placeholder="ما هي هواياتك المفضلة؟"
                                    className="text-lg py-6 text-right font-arabic"
                                    value={formData.hobbies}
                                    onChange={(e) => updateFormData("hobbies", e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full text-lg font-arabic py-6 bounce-hover"
                        disabled={isLoading}
                    >
                        {isLoading ? "جاري التسجيل..." : step === 1 ? "التالي ➡️" : "إنشاء الحساب 🎉"}
                    </Button>

                    {step === 1 && (
                        <div className="text-center space-y-4">
                            <p className="text-muted-foreground font-arabic">
                                لديك حساب بالفعل؟
                            </p>
                            <Button
                                variant="outline"
                                className="w-full text-lg font-arabic py-6 wiggle-hover"
                                asChild
                            >
                                <Link href="/login">
                                    تسجيل الدخول
                                </Link>
                            </Button>
                        </div>
                    )}
                </form>
            </Card>
        </div>
    );
} 