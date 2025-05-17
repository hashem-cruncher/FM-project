"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface LetterFormsProps {
    initialForm?: string;
    medialForm?: string;
    finalForm?: string;
    isolatedForm: string;
}

export function LetterForms({ initialForm, medialForm, finalForm, isolatedForm }: LetterFormsProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold font-arabic mb-2">أشكال الحرف</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {finalForm && (
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-arabic mb-1">في النهاية</span>
                        <div className="text-4xl font-arabic bg-muted/10 rounded-lg p-4 w-full text-center">
                            {finalForm}
                        </div>
                    </div>
                )}
                {medialForm && (
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-arabic mb-1">في الوسط</span>
                        <div className="text-4xl font-arabic bg-muted/10 rounded-lg p-4 w-full text-center">
                            {medialForm}
                        </div>
                    </div>
                )}
                {initialForm && (
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-arabic mb-1">في البداية</span>
                        <div className="text-4xl font-arabic bg-muted/10 rounded-lg p-4 w-full text-center">
                            {initialForm}
                        </div>
                    </div>
                )}
                <div className="flex flex-col items-center">
                    <span className="text-sm font-arabic mb-1">منفرد</span>
                    <div className="text-4xl font-arabic bg-muted/10 rounded-lg p-4 w-full text-center">
                        {isolatedForm}
                    </div>
                </div>
            </div>
        </div>
    );
} 