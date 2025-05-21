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
import { Image as ImageIcon, Loader2, Wand2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Image from 'next/image';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImageGeneratorProps {
    text: string;
    className?: string;
}

export function ImageGenerator({ text, className }: ImageGeneratorProps) {
    const [imageData, setImageData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [imageStyle, setImageStyle] = useState<string>("cartoon");
    const [error, setError] = useState<string | null>(null);

    const generateImage = async () => {
        if (!text || text.trim().length < 5) {
            toast.error("النص قصير جدًا، يرجى توفير جملة كاملة");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            toast.info("جاري إنشاء الصورة... قد يستغرق ذلك بعض الوقت");

            const response = await fetch('http://localhost:5000/api/images/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sentence: text,
                    style: imageStyle,
                    size: "1024x1024"
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `فشل في الاتصال بالخادم: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.image_data) {
                setImageData(data.image_data);
                toast.success("تم إنشاء الصورة بنجاح");
            } else {
                throw new Error(data.message || "حدث خطأ في إنشاء الصورة");
            }
        } catch (error) {
            console.error("Error generating image:", error);
            setError(`فشل في إنشاء الصورة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            toast.error("فشل الاتصال بخدمة إنشاء الصور");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStyleChange = (value: string) => {
        setImageStyle(value);
        // Clear previous image when style changes
        setImageData(null);
        setError(null);
    };

    const handleRetry = () => {
        setError(null);
        generateImage();
    };

    return (
        <Card className={`p-4 ${className} overflow-hidden`}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        <span className="font-arabic font-bold">توليد صورة توضيحية</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Select value={imageStyle} onValueChange={handleStyleChange}>
                            <SelectTrigger className="w-[160px] font-arabic">
                                <SelectValue placeholder="اختر نمط الصورة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cartoon" className="font-arabic">كرتوني للأطفال</SelectItem>
                                <SelectItem value="realistic" className="font-arabic">واقعي</SelectItem>
                                <SelectItem value="artistic" className="font-arabic">فني</SelectItem>
                                <SelectItem value="digital_art" className="font-arabic">فن رقمي</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={generateImage}
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
                                    إنشاء صورة
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

                {imageData && (
                    <div className="relative aspect-square max-w-md mx-auto mt-2 rounded-lg overflow-hidden">
                        <Image
                            src={`data:image/png;base64,${imageData}`}
                            alt="صورة توضيحية للجملة"
                            className="object-cover rounded-lg"
                            width={400}
                            height={400}
                            priority
                        />
                    </div>
                )}

                {!imageData && !isLoading && !error && (
                    <div className="bg-muted/30 rounded-lg aspect-square max-w-md mx-auto flex items-center justify-center">
                        <div className="text-center text-muted-foreground p-4 font-arabic">
                            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>اضغط على زر "إنشاء صورة" لتوليد صورة توضيحية للجملة</p>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="bg-muted/10 rounded-lg aspect-square max-w-md mx-auto flex items-center justify-center">
                        <div className="text-center p-4 font-arabic">
                            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                            <p className="text-lg font-semibold">جاري إنشاء الصورة...</p>
                            <p className="text-sm text-muted-foreground mt-2">قد يستغرق ذلك بضع لحظات، يرجى الانتظار</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
} 