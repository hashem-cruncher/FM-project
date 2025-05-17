"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function LessonRedirectPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const levelId = parseInt(id);

    useEffect(() => {
        // Redirect based on level ID
        switch (levelId) {
            case 1:
                router.push('/learn/alphabet');
                break;
            case 2:
                router.push('/learn/diacritics');
                break;
            case 3:
                router.push('/learn/syllables');
                break;
            case 4:
                router.push('/learn/words');
                break;
            case 5:
                router.push('/learn/sentences');
                break;
            case 6:
                router.push('/learn/stories');
                break;
            default:
                router.push('/dashboard');
                break;
        }
    }, [levelId, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-bounce text-4xl mb-4">🎯</div>
                <p className="text-xl font-arabic">جاري تحميل الدرس...</p>
            </div>
        </div>
    );
} 