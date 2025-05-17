"use client";

import { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";

interface WritingPracticeProps {
    letter: string;
    onComplete?: () => void;
}

export function WritingPractice({ letter, onComplete }: WritingPracticeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size based on container
        const container = canvas.parentElement;
        if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }

        // Setup context
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);

        // Draw guidelines
        drawGuidelines(ctx, canvas.width, canvas.height);
    }, []);

    const drawGuidelines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.save();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;

        // Draw horizontal guidelines
        const lineHeight = height / 4;
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * lineHeight);
            ctx.lineTo(width, i * lineHeight);
            ctx.stroke();
        }

        // Draw dotted middle line
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.restore();
    };

    const getCoordinates = (event: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        if ('touches' in event) {
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas || !context) return;

        event.preventDefault();
        const coords = getCoordinates(event, canvas);
        setIsDrawing(true);
        setLastPoint(coords);

        context.beginPath();
        context.moveTo(coords.x, coords.y);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!isDrawing || !canvas || !context || !lastPoint) return;

        event.preventDefault();
        const coords = getCoordinates(event, canvas);

        // Smooth line drawing using quadratic curves
        const midPoint = {
            x: (lastPoint.x + coords.x) / 2,
            y: (lastPoint.y + coords.y) / 2
        };

        context.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
        context.stroke();

        setLastPoint(coords);
    };

    const stopDrawing = () => {
        if (!context) return;
        setIsDrawing(false);
        setLastPoint(null);
        context.stroke();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        drawGuidelines(context, canvas.width, canvas.height);
    };

    return (
        <div className="space-y-4">
            <div className="relative bg-white rounded-lg border-2 border-dashed border-primary/50">
                <canvas
                    ref={canvasRef}
                    className="touch-none w-full h-[300px]"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <span className="text-9xl font-arabic">{letter}</span>
                </div>
            </div>
            <div className="flex gap-4">
                <Button
                    className="flex-1 font-arabic"
                    variant="outline"
                    onClick={clearCanvas}
                >
                    <Icons.Eraser className="ml-2 h-5 w-5" />
                    مسح
                </Button>
                <Button
                    className="flex-1 font-arabic"
                    onClick={onComplete}
                >
                    <Icons.Check className="ml-2 h-5 w-5" />
                    تم التعلم
                </Button>
            </div>
        </div>
    );
} 