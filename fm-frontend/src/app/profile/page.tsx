"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import * as Icons from "lucide-react";
import { toast } from 'sonner';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface User {
    id: number;
    username: string;
    nickname?: string;
    email: string;
    streak_days: number;
    total_stars: number;
    completed_lessons: number;
    created_at: string;
}

interface UserPreferences {
    sound_enabled: boolean;
    notifications_enabled: boolean;
    theme: 'light' | 'dark';
    language: 'ar' | 'en';
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState<Partial<User>>({});
    const [preferences, setPreferences] = useState<UserPreferences>({
        sound_enabled: true,
        notifications_enabled: true,
        theme: 'light',
        language: 'ar'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            const userData = localStorage.getItem('user');
            if (!userData) {
                router.push('/login');
                return;
            }

            const currentUser = JSON.parse(userData);
            setUser(currentUser);
            setEditedUser({
                nickname: currentUser.nickname,
                email: currentUser.email
            });

            try {
                // Load user preferences
                const response = await fetch(`http://localhost:5000/api/users/${currentUser.id}/preferences`);
                if (response.ok) {
                    const prefsData = await response.json();
                    setPreferences(prefsData);
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
                toast.error('حدث خطأ في تحميل التفضيلات');
            }
        };

        loadUserData();
    }, []);

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);

        try {
            // Update user info
            const userResponse = await fetch(`http://localhost:5000/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editedUser),
            });

            if (!userResponse.ok) throw new Error('Failed to update user info');

            // Update preferences
            const prefsResponse = await fetch(`http://localhost:5000/api/users/${user.id}/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferences),
            });

            if (!prefsResponse.ok) throw new Error('Failed to update preferences');

            const updatedUser = await userResponse.json();
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setIsEditing(false);
            toast.success('تم حفظ التغييرات بنجاح');
        } catch (error) {
            console.error('Error saving changes:', error);
            toast.error('حدث خطأ في حفظ التغييرات');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
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
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                            <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                    </div>
                    <h1 className="text-4xl font-bold font-arabic mb-2">
                        {user.nickname || user.username}
                    </h1>
                    <p className="text-muted-foreground font-arabic">
                        عضو منذ {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </p>
                </div>

                <Tabs defaultValue="info" className="space-y-6">
                    <TabsList className="w-full">
                        <TabsTrigger value="info" className="w-full font-arabic">
                            <Icons.User className="ml-2 h-4 w-4" />
                            المعلومات الشخصية
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="w-full font-arabic">
                            <Icons.BarChart2 className="ml-2 h-4 w-4" />
                            الإحصائيات
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="w-full font-arabic">
                            <Icons.Settings className="ml-2 h-4 w-4" />
                            التفضيلات
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info">
                        <Card className="p-6">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold font-arabic">المعلومات الشخصية</h2>
                                    <Button
                                        variant="outline"
                                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                        disabled={isSaving}
                                        className="font-arabic"
                                    >
                                        {isEditing ? (
                                            isSaving ? (
                                                <>جاري الحفظ...</>
                                            ) : (
                                                <><Icons.Save className="ml-2 h-4 w-4" />حفظ التغييرات</>
                                            )
                                        ) : (
                                            <><Icons.Edit className="ml-2 h-4 w-4" />تعديل المعلومات</>
                                        )}
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="font-arabic">اسم المستخدم</Label>
                                        <Input
                                            value={user.username}
                                            disabled
                                            className="font-arabic"
                                            dir="rtl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-arabic">الاسم المستعار</Label>
                                        <Input
                                            value={editedUser.nickname || ''}
                                            onChange={(e) => setEditedUser({ ...editedUser, nickname: e.target.value })}
                                            disabled={!isEditing}
                                            className="font-arabic"
                                            dir="rtl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-arabic">البريد الإلكتروني</Label>
                                        <Input
                                            value={editedUser.email || ''}
                                            onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                                            disabled={!isEditing}
                                            className="font-arabic"
                                            dir="rtl"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="stats">
                        <Card className="p-6">
                            <h2 className="text-2xl font-bold font-arabic mb-6">الإحصائيات</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center space-y-2">
                                    <div className="text-4xl font-bold text-primary">{user.completed_lessons}</div>
                                    <div className="text-sm font-arabic text-muted-foreground">درس مكتمل</div>
                                </div>
                                <div className="text-center space-y-2">
                                    <div className="text-4xl font-bold text-primary">{user.total_stars}</div>
                                    <div className="text-sm font-arabic text-muted-foreground">نجوم ذهبية</div>
                                </div>
                                <div className="text-center space-y-2">
                                    <div className="text-4xl font-bold text-primary">{user.streak_days}</div>
                                    <div className="text-sm font-arabic text-muted-foreground">أيام متتالية</div>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="preferences">
                        <Card className="p-6">
                            <h2 className="text-2xl font-bold font-arabic mb-6">التفضيلات</h2>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-arabic">تفعيل الأصوات</Label>
                                        <p className="text-sm text-muted-foreground font-arabic">
                                            تشغيل الأصوات والمؤثرات الصوتية
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.sound_enabled}
                                        onCheckedChange={(checked) =>
                                            setPreferences(prev => ({ ...prev, sound_enabled: checked }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-arabic">تفعيل الإشعارات</Label>
                                        <p className="text-sm text-muted-foreground font-arabic">
                                            استلام إشعارات التذكير والتحفيز
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.notifications_enabled}
                                        onCheckedChange={(checked) =>
                                            setPreferences(prev => ({ ...prev, notifications_enabled: checked }))
                                        }
                                    />
                                </div>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="mt-8 flex justify-center">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        className="font-arabic text-lg"
                    >
                        <Icons.ArrowRight className="ml-2 h-5 w-5" />
                        العودة للوحة التحكم
                    </Button>
                </div>
            </div>
        </div>
    );
} 