import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeechReaderProps {
    text: string;
    lang?: string;
    variant?: 'letter' | 'word' | 'default';
    size?: 'sm' | 'default';
    className?: string;
}

export const SpeechReader = ({
    text,
    lang = 'ar-SA',
    variant = 'default',
    size = 'default',
    className
}: SpeechReaderProps) => {
    const synth = useRef<SpeechSynthesis | null>(null);
    const utterance = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synth.current = window.speechSynthesis;
            utterance.current = new SpeechSynthesisUtterance();
            utterance.current.lang = lang;

            // Adjust speech parameters based on variant
            if (variant === 'letter') {
                utterance.current.rate = 0.7; // Slower for letters
                utterance.current.pitch = 1.2; // Slightly higher pitch for clarity
            } else if (variant === 'word') {
                utterance.current.rate = 0.8; // Normal rate for words
                utterance.current.pitch = 1; // Normal pitch
            } else {
                utterance.current.rate = 1; // Default rate
                utterance.current.pitch = 1; // Default pitch
            }
        }

        return () => {
            if (synth.current?.speaking) {
                synth.current.cancel();
            }
        };
    }, [lang, variant]);

    const speak = () => {
        if (!synth.current || !utterance.current) return;

        // Cancel any ongoing speech
        if (synth.current.speaking) {
            synth.current.cancel();
        }

        utterance.current.text = text;
        synth.current.speak(utterance.current);
    };

    return (
        <Button
            onClick={speak}
            variant="outline"
            className={cn(
                "font-arabic",
                size === 'sm' ? "text-sm p-2" : "text-lg",
                variant === 'letter' && "bg-primary/5 hover:bg-primary/10",
                variant === 'word' && "bg-secondary/5 hover:bg-secondary/10",
                className
            )}
            type="button"
        >
            {variant === 'letter' ? (
                <Volume2 className="h-4 w-4" />
            ) : (
                <>
                    استمع إلى النطق
                    <Volume2 className="mr-2 h-5 w-5" />
                </>
            )}
        </Button>
    );
}; 