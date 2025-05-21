"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { ImagePlus, Loader2, Wand2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Image from 'next/image';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StoryImageGeneratorProps {
    storyText: string;
    className?: string;
}

export function StoryImageGenerator({ storyText, className }: StoryImageGeneratorProps) {
    const [imageData, setImageData] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [imageStyle, setImageStyle] = useState<string>("cartoon");
    const [error, setError] = useState<string | null>(null);

    const extractKeyScenes = (text: string): string[] => {
        // Split the text into sentences
        const sentences = text.split(/[.!?؟،]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10 && s.length < 250); // Filter out very short or very long sentences

        // If we have fewer than 4 sentences, return all of them
        if (sentences.length <= 4) return sentences;

        // Find potential scenes/sections in the story
        const scenes = [];

        // Always include the first sentence for introduction
        scenes.push(sentences[0]);

        // For medium-length stories, include two middle scenes
        if (sentences.length >= 6) {
            // First middle scene (near 1/3 point)
            const firstMiddleIndex = Math.floor(sentences.length / 3);
            scenes.push(sentences[firstMiddleIndex]);

            // Second middle scene (near 2/3 point)
            const secondMiddleIndex = Math.floor(sentences.length * 2 / 3);
            scenes.push(sentences[secondMiddleIndex]);
        }
        // For shorter stories, take just one middle scene
        else if (sentences.length > 4) {
            const middleIndex = Math.floor(sentences.length / 2);
            scenes.push(sentences[middleIndex]);

            // Add another scene between middle and end
            const thirdQuarterIndex = Math.floor((sentences.length + middleIndex) / 2);
            scenes.push(sentences[thirdQuarterIndex]);
        }

        // Always include the last sentence for conclusion
        scenes.push(sentences[sentences.length - 1]);

        return scenes;
    };

    const generateImages = async () => {
        if (!storyText || storyText.trim().length < 20) {
            toast.error("النص قصير جدًا، يرجى توفير قصة كاملة");
            return;
        }

        setIsLoading(true);
        setError(null);

        const keyScenes = extractKeyScenes(storyText);
        const newImages: string[] = [];

        try {
            toast.info("جاري إنشاء الصور للقصة... قد يستغرق ذلك بعض الوقت");

            // First, get a summary of the story and extract key characters/settings
            const storyContext = `
                القصة تتحدث عن: ${storyText.substring(0, 150)}...
                
                نريد صور متسلسلة مرتبطة ببعضها البعض، تستخدم نفس الشخصيات والبيئة والألوان.
                كل صورة يجب أن تكون جزءًا من نفس العالم البصري للصور الأخرى.
            `;

            // Generate images sequentially with consistent characters/styles
            for (let i = 0; i < keyScenes.length; i++) {
                const scene = keyScenes[i];
                try {
                    // Determine scene position in story
                    const scenePosition = i === 0 ? "بداية" : i === keyScenes.length - 1 ? "نهاية" : "وسط";

                    // Create a rich context for this scene
                    const sceneContext = `
                        ${storyContext}
                        
                        هذه الصورة للـ${scenePosition} القصة وتمثل المشهد التالي:
                        "${scene}"
                        
                        الصورة رقم ${i + 1} من ${keyScenes.length} في القصة.
                    `;

                    const response = await fetch('http://localhost:5000/api/images/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            sentence: sceneContext, // Use rich context instead of just the sentence
                            style: imageStyle,
                            size: "1024x1024",
                            consistent_with_previous: i > 0, // Signal that this should be consistent with previous images
                            consistency_factor: 0.8 // High consistency factor
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `فشل في الاتصال بالخادم: ${response.status}`);
                    }

                    const data = await response.json();

                    if (data.success && data.image_data) {
                        newImages.push(data.image_data);
                        // Show progress update
                        toast.info(`تم إنشاء صورة ${i + 1} من ${keyScenes.length}`);
                    } else {
                        throw new Error(data.message || "فشل في إنشاء الصورة");
                    }
                } catch (error) {
                    console.error("Error generating image for scene:", scene, error);
                    setError(`حدث خطأ أثناء إنشاء الصورة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);

                    // Stop trying if we hit an API error
                    if (error instanceof Error && error.message.includes('API')) {
                        break;
                    }
                }
            }

            if (newImages.length > 0) {
                setImageData(newImages);
                toast.success(`تم إنشاء ${newImages.length} صور توضيحية مترابطة للقصة`);
            } else {
                setError("فشل في إنشاء الصور، يرجى المحاولة مرة أخرى لاحقًا");
                toast.error("فشل في إنشاء الصور، يرجى المحاولة مرة أخرى");
            }
        } catch (error) {
            console.error("Error generating story images:", error);
            setError(`فشل الاتصال بخدمة إنشاء الصور: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            toast.error("فشل الاتصال بخدمة إنشاء الصور");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStyleChange = (value: string) => {
        setImageStyle(value);
        // Don't clear previous images when style changes as they might have taken time to generate
    };

    const handleRetry = () => {
        setError(null);
        generateImages();
    };

    return (
        <Card className={`p-4 ${className} overflow-hidden`}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImagePlus className="h-5 w-5" />
                        <span className="font-arabic font-bold">توليد صور مترابطة للقصة</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Select value={imageStyle} onValueChange={handleStyleChange}>
                            <SelectTrigger className="w-[160px] font-arabic">
                                <SelectValue placeholder="اختر نمط الصور" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cartoon" className="font-arabic">كرتوني للأطفال</SelectItem>
                                <SelectItem value="realistic" className="font-arabic">واقعي</SelectItem>
                                <SelectItem value="artistic" className="font-arabic">فني</SelectItem>
                                <SelectItem value="digital_art" className="font-arabic">فن رقمي</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={generateImages}
                            disabled={isLoading}
                            className="font-arabic"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    جاري الإنشاء...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="ml-2 h-4 w-4" />
                                    إنشاء صور مترابطة
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4 ml-2" />
                        <AlertDescription className="font-arabic">
                            {error}
                            <Button
                                variant="link"
                                className="mr-2 p-0 h-auto font-arabic text-primary"
                                onClick={handleRetry}
                            >
                                إعادة المحاولة
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {imageData.length > 0 && (
                    <div className="mt-4">
                        <Carousel
                            opts={{
                                align: "center",
                                loop: true
                            }}
                            className="w-full max-w-md mx-auto"
                        >
                            <CarouselContent>
                                {imageData.map((img, index) => (
                                    <CarouselItem key={index}>
                                        <div className="p-1">
                                            <Card className="overflow-hidden">
                                                <div className="aspect-square relative">
                                                    <Image
                                                        src={`data:image/png;base64,${img}`}
                                                        alt={`صورة توضيحية للقصة ${index + 1}`}
                                                        className="object-cover"
                                                        fill
                                                        priority
                                                    />
                                                </div>
                                                <div className="p-2 text-center font-arabic text-sm text-muted-foreground">
                                                    صورة {index + 1} من {imageData.length}
                                                </div>
                                            </Card>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex" />
                            <CarouselNext className="hidden md:flex" />
                        </Carousel>
                    </div>
                )}

                {imageData.length === 0 && !isLoading && !error && (
                    <div className="bg-muted/30 rounded-lg aspect-square max-w-md mx-auto flex items-center justify-center">
                        <div className="text-center text-muted-foreground p-4 font-arabic">
                            <ImagePlus className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>اضغط على زر "إنشاء صور مترابطة" لتوليد صور متناسقة تحكي القصة بشكل متسلسل ومترابط</p>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="bg-muted/10 rounded-lg aspect-square max-w-md mx-auto flex items-center justify-center">
                        <div className="text-center p-4 font-arabic">
                            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                            <p className="text-lg font-semibold">جاري إنشاء الصور المترابطة...</p>
                            <p className="text-sm text-muted-foreground mt-2">قد تستغرق العملية بضع دقائق، يرجى الانتظار</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
} 