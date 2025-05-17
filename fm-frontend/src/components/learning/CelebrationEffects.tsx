import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type LearningType = 'alphabet' | 'diacritics' | 'syllables' | 'words' | 'sentences' | 'stories';

interface MessageContent {
    title: string;
    description: string;
    achievement: string;
    next: string;
}

type Messages = Record<LearningType, MessageContent>;

interface CelebrationEffectsProps {
    isOpen: boolean;
    onClose: () => void;
    type?: LearningType;
}

export function CelebrationEffects({ isOpen, onClose, type = 'alphabet' }: CelebrationEffectsProps) {
    const router = useRouter();
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleContinue = () => {
        onClose();
        router.push('/dashboard');
    };

    const handleReview = () => {
        onClose();
    };

    const messages: Partial<Messages> = {
        alphabet: {
            title: '🎉 مبروك! أنت بطل! 🎉',
            description: 'تهانينا على إكمال تعلم الحروف العربية! لقد حققت إنجازاً رائعاً',
            achievement: 'لقد أكملت تعلم جميع الحروف العربية!',
            next: 'يمكنك الآن مراجعة الحروف أو الانتقال للمستوى التالي'
        },
        diacritics: {
            title: '🎉 رائع! أنت متميز! 🎉',
            description: 'تهانينا على إكمال تعلم الحركات والتشكيل! إنجاز يستحق الاحتفال',
            achievement: 'لقد أتقنت جميع الحركات والتشكيل!',
            next: 'يمكنك الآن مراجعة الحركات أو الانتقال للمستوى التالي'
        },
        stories: {
            title: '🎉 أحسنت! أنت قارئ متميز! 🎉',
            description: 'تهانينا على إكمال قراءة وفهم جميع القصص القصيرة! إنجاز رائع',
            achievement: 'لقد أكملت قراءة وفهم جميع القصص!',
            next: 'يمكنك الآن مراجعة القصص أو الانتقال للمستوى التالي'
        }
    };

    const defaultMessages = messages.alphabet!;
    const currentMessages = messages[type] || defaultMessages;

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center font-arabic text-2xl">
                        {currentMessages.title}
                    </DialogTitle>
                    <DialogDescription className="text-center font-arabic">
                        {currentMessages.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-6 py-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="relative w-48 h-48 flex items-center justify-center text-8xl"
                    >
                        🏆
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-center space-y-2"
                    >
                        <p className="text-xl font-arabic text-green-600">
                            {currentMessages.achievement}
                        </p>
                        <p className="text-sm font-arabic text-gray-600">
                            {currentMessages.next}
                        </p>
                    </motion.div>

                    <div className="flex gap-4">
                        <Button
                            onClick={handleReview}
                            className="font-arabic text-lg"
                            variant="outline"
                        >
                            مراجعة
                        </Button>
                        <Button
                            onClick={handleContinue}
                            className="font-arabic text-lg"
                        >
                            المستوى التالي
                        </Button>
                    </div>
                </div>

                {isOpen && (
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        numberOfPieces={200}
                        recycle={false}
                        colors={['#FFC107', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0']}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
} 