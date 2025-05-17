'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: number;
    username: string;
    nickname?: string;
}

export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check for user data in localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [pathname]); // Re-check when pathname changes

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        toast.success('تم تسجيل الخروج بنجاح');
        router.push('/login');
    };

    // Don't show navbar on login or register pages
    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    return (
        <nav className="border-b">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold font-arabic">
                    تعلم القراءة 📚
                </Link>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <span className="text-lg font-arabic">
                                مرحباً، {user.nickname || user.username}
                            </span>
                            <Button
                                variant="outline"
                                className="font-arabic flex items-center gap-2"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                تسجيل الخروج
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                className="font-arabic flex items-center gap-2"
                                asChild
                            >
                                <Link href="/login">
                                    <LogIn className="h-4 w-4" />
                                    تسجيل الدخول
                                </Link>
                            </Button>
                            <Button
                                className="font-arabic flex items-center gap-2"
                                asChild
                            >
                                <Link href="/register">
                                    <UserPlus className="h-4 w-4" />
                                    انضم إلينا
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
} 