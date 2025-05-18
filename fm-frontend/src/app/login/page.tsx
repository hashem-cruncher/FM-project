'use client';

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import Link from "next/link"
import { LogIn, User, KeyRound, AlertCircle } from "lucide-react"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { fetchApi } from '@/utils/api'

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Clear any previous error message
        setErrorMessage(null);

        try {
            // Use our API utility instead of direct fetch
            const result = await fetchApi('api/login', {
                method: 'POST',
                body: JSON.stringify(formData),
            });

            if (result.success) {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(result.data.user));

                // Show success message
                toast.success(result.data.message || 'تم تسجيل الدخول بنجاح!');

                // Redirect to dashboard
                router.push('/dashboard');
                router.refresh(); // Refresh to update navigation state
            } else {
                // Handle different types of errors
                const statusCode = result.status || 500;
                let errorText = '';

                // Backend response may have different error formats
                if (result.error) {
                    // Error from fetchApi utility
                    errorText = `خطأ: ${result.error}`;
                } else if (result.data && result.data.error) {
                    // Server returned a specific error message
                    errorText = `خطأ (${statusCode}): ${result.data.error}`;

                    // Special handling for common errors
                    if (result.data.error.includes('اسم المستخدم') ||
                        result.data.error.includes('كلمة المرور')) {
                        errorText = `بيانات الدخول غير صحيحة: ${result.data.error}`;
                    }
                } else {
                    // Handle 401 specifically for authentication failures
                    if (statusCode === 401) {
                        errorText = `اسم المستخدم أو كلمة المرور غير صحيحة`;
                    } else {
                        // Generic error based on status code
                        errorText = `حدث خطأ أثناء تسجيل الدخول (${statusCode})`;
                    }
                }

                // Display error in UI and toast
                setErrorMessage(errorText);
                toast.error(errorText);
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorText = 'حدث خطأ في الاتصال بالخادم';
            setErrorMessage(errorText);
            toast.error(errorText);
        } finally {
            setIsLoading(false);
        }
    };

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="container max-w-md mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
                    <LogIn className="h-12 w-12 text-primary" />
                </div>
                <h1 className="kid-title mb-4 text-4xl">مرحباً بعودتك! 👋</h1>
                <p className="text-xl text-muted-foreground font-arabic">
                    سعداء برؤيتك مرة أخرى
                </p>
            </div>

            <Card className="p-8 kid-friendly-card border-2">
                {errorMessage && (
                    <div className="mb-6 border-2 border-red-600 bg-red-50 text-red-800 p-4 rounded-md shadow-md animate-pulse">
                        <div className="flex gap-2 items-start">
                            <AlertCircle className="h-6 w-6 mt-0.5 flex-shrink-0 text-red-600" />
                            <div>
                                <h3 className="font-bold text-lg mb-1">خطأ في تسجيل الدخول</h3>
                                <p className="whitespace-pre-line text-lg">{errorMessage}</p>
                            </div>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label
                                htmlFor="username"
                                className="text-lg font-arabic flex items-center gap-2"
                            >
                                <User className="h-5 w-5" />
                                اسم المستخدم
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="أدخل اسم المستخدم"
                                className="text-lg py-6 text-right font-arabic"
                                value={formData.username}
                                onChange={(e) => updateFormData("username", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <Label
                                htmlFor="password"
                                className="text-lg font-arabic flex items-center gap-2"
                            >
                                <KeyRound className="h-5 w-5" />
                                كلمة المرور
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="أدخل كلمة المرور"
                                className="text-lg py-6 text-right font-arabic"
                                value={formData.password}
                                onChange={(e) => updateFormData("password", e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full text-lg font-arabic py-6 bounce-hover"
                            disabled={isLoading}
                        >
                            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                        </Button>

                        <div className="text-center space-y-4">
                            <p className="text-muted-foreground font-arabic">
                                ليس لديك حساب بعد؟
                            </p>
                            <Button
                                variant="outline"
                                className="w-full text-lg font-arabic py-6 wiggle-hover"
                                asChild
                            >
                                <Link href="/register">
                                    إنشاء حساب جديد 🚀
                                </Link>
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>

            <div className="text-center mt-8">
                <Button
                    variant="link"
                    className="text-lg font-arabic text-muted-foreground hover:text-primary"
                    asChild
                >
                    <Link href="/forgot-password">
                        نسيت كلمة المرور؟
                    </Link>
                </Button>
            </div>
        </div>
    );
} 