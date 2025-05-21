import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen, Wand, BookText, RefreshCw, Share, Lightbulb, ChevronLeft, ChevronRight, Printer, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { addAIGeneratedStory } from "@/lib/data/stories";
import { Checkbox } from "@/components/ui/checkbox";

interface StoryGeneratorProps {
    userId: number;
}

interface StoryResponse {
    success: boolean;
    user_id: number;
    target_errors: Array<{
        word: string;
        category: string;
        count: number;
    }>;
    story: {
        text: string;
        highlighted_text: string;
        target_words: string[];
        theme: string;
        generated_at: string;
        metadata: {
            age_group: string;
            difficulty: string;
            length: string;
        };
    };
}

interface Exercise {
    id: number;
    sentence: string;
    tip: string;
    drill: string;
}

interface ExerciseResponse {
    success: boolean;
    user_id: number;
    exercises: string;
    parsed_exercises: Exercise[];
    generated_at: string;
}

export function AIStoryGenerator({ userId }: StoryGeneratorProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState("");
    const [length, setLength] = useState("short");
    const [difficulty, setDifficulty] = useState("intermediate");
    const [story, setStory] = useState<StoryResponse | null>(null);
    const [exercises, setExercises] = useState<ExerciseResponse | null>(null);
    const [exerciseTab, setExerciseTab] = useState(0);
    const [exercisesLoading, setExercisesLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // New state for managing target words
    const [targetWords, setTargetWords] = useState<Array<{ word: string; category: string; count: number; selected: boolean }>>([]);
    const [customWord, setCustomWord] = useState("");
    const [loadingWords, setLoadingWords] = useState(false);

    // Fetch the user's target words
    useEffect(() => {
        if (!userId) return;

        const fetchTargetWords = async () => {
            try {
                setLoadingWords(true);
                const response = await fetch(`http://localhost:5000/api/stories/target-words/${userId}`);
                if (!response.ok) throw new Error('Failed to fetch target words');

                const data = await response.json();
                if (data.success) {
                    setTargetWords(data.words.map((word: any) => ({
                        ...word,
                        selected: true // By default, all words are selected
                    })));
                }
            } catch (error) {
                console.error('Error fetching target words:', error);
                // Use default words if we can't fetch from the backend
                setTargetWords([
                    { word: "مدرسة", category: "default", count: 1, selected: true },
                    { word: "كتاب", category: "default", count: 1, selected: true },
                    { word: "قلم", category: "default", count: 1, selected: true },
                ]);
            } finally {
                setLoadingWords(false);
            }
        };

        fetchTargetWords();
    }, [userId]);

    // Handle adding a custom word
    const addCustomWord = () => {
        if (!customWord.trim()) return;

        // Check if word already exists
        if (targetWords.some(item => item.word === customWord)) {
            toast.error("هذه الكلمة موجودة بالفعل");
            return;
        }

        setTargetWords([
            ...targetWords,
            { word: customWord, category: "custom", count: 1, selected: true }
        ]);
        setCustomWord("");
        toast.success("تمت إضافة الكلمة");
    };

    // Handle toggling word selection
    const toggleWordSelection = (index: number) => {
        const updatedWords = [...targetWords];
        updatedWords[index].selected = !updatedWords[index].selected;
        setTargetWords(updatedWords);
    };

    // Handle removing a word
    const removeWord = (index: number) => {
        const updatedWords = [...targetWords];
        updatedWords.splice(index, 1);
        setTargetWords(updatedWords);
        toast.success("تم حذف الكلمة");
    };

    const generateStory = async () => {
        // Check if any words are selected
        const selectedWords = targetWords.filter(word => word.selected);
        if (selectedWords.length === 0) {
            toast.error("يرجى اختيار كلمة واحدة على الأقل");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/stories/generate/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    theme: theme || undefined,
                    length,
                    difficulty,
                    custom_words: selectedWords.map(word => ({
                        word: word.word,
                        category: word.category,
                        count: word.count
                    }))
                }),
            });

            const data = await response.json();

            if (data.success) {
                setStory(data);
                toast.success("تم إنشاء القصة بنجاح!");
            } else {
                toast.error(data.message || "حدث خطأ أثناء إنشاء القصة");
            }
        } catch (error) {
            console.error('Error generating story:', error);
            toast.error("حدث خطأ في الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    const generateExercises = async () => {
        if (!story) return;

        try {
            setExercisesLoading(true);
            // Use the same target words that were selected for the story
            const selectedWords = targetWords.filter(word => word.selected).map(word => ({
                word: word.word,
                category: word.category,
                count: word.count
            }));

            const response = await fetch(`http://localhost:5000/api/stories/exercises/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    count: 5,
                    custom_words: selectedWords.length > 0 ? selectedWords : undefined
                }),
            });

            const data = await response.json();

            if (data.success) {
                setExercises(data);
                toast.success("تم إنشاء التمارين بنجاح!");
            } else {
                toast.error(data.message || "حدث خطأ أثناء إنشاء التمارين");
            }
        } catch (error) {
            console.error('Error generating exercises:', error);
            toast.error("حدث خطأ في الاتصال بالخادم");
        } finally {
            setExercisesLoading(false);
        }
    };

    const saveStory = async () => {
        if (!story) return;

        try {
            setSaved(true);
            setLoading(true);
            toast.loading("جاري حفظ القصة في قاعدة البيانات...");

            // Add exercises data to the story object if they exist
            const storyWithExercises = {
                ...story,
                exercises: exercises?.parsed_exercises || []
            };

            const storyId = await addAIGeneratedStory(storyWithExercises);

            // Dismiss any existing toasts
            toast.dismiss();

            // Show success message with action button
            toast.success("تم حفظ القصة في مكتبة القصص بنجاح", {
                action: {
                    label: "عرض القصص",
                    onClick: () => router.push('/learn/stories')
                },
                duration: 4000
            });

            // Add auto-redirect with delay
            setTimeout(() => {
                router.push('/learn/stories');
            }, 3000);
        } catch (error) {
            console.error('Error saving story:', error);
            toast.error("حدث خطأ في حفظ القصة في قاعدة البيانات");
            setSaved(false);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const storyContent = story?.story.text || '';
        const targetWords = story?.target_errors.map(e => e.word).join('، ') || '';
        const exerciseContent = exercises?.parsed_exercises.map(ex =>
            `<div class="exercise-item" style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                <p><strong>الجملة: </strong>${ex.sentence}</p>
                <p><strong>النصيحة: </strong>${ex.tip}</p>
                <p><strong>التمرين: </strong>${ex.drill}</p>
            </div>`
        ).join('') || '';

        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>قصة وتمارين النطق</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; text-align: center; }
                    h2 { color: #555; margin-top: 30px; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .story { line-height: 1.6; text-align: justify; margin-bottom: 30px; }
                    .target-words { margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
                    .exercises-container { margin-top: 30px; }
                    @media print {
                        .no-print { display: none; }
                        body { font-size: 12pt; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>قصة وتمارين النطق</h1>
                    
                    <div class="story">
                        <h2>القصة</h2>
                        <p>${storyContent.replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    <div class="target-words">
                        <strong>الكلمات المستهدفة: </strong>${targetWords}
                    </div>
                    
                    <div class="exercises-container">
                        <h2>تمارين النطق</h2>
                        ${exerciseContent}
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 30px;">
                        <button onclick="window.print()">طباعة</button>
                    </div>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
    };

    const nextExercise = () => {
        if (exercises && exerciseTab < exercises.parsed_exercises.length - 1) {
            setExerciseTab(exerciseTab + 1);
        }
    };

    const prevExercise = () => {
        if (exerciseTab > 0) {
            setExerciseTab(exerciseTab - 1);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <h2 className="text-2xl font-bold font-arabic mb-4 flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span>إنشاء قصة مخصصة للتدريب على النطق</span>
                </h2>

                <div className="mb-6">
                    <Label className="font-arabic mb-2 block">الكلمات المستهدفة</Label>

                    {loadingWords ? (
                        <div className="flex justify-center py-4">
                            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                            <span className="font-arabic mr-2">جاري تحميل الكلمات...</span>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-2 mb-4">
                                {targetWords.map((word, index) => (
                                    <div key={index} className="flex items-center justify-between border rounded-md p-2">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`word-${index}`}
                                                checked={word.selected}
                                                onCheckedChange={() => toggleWordSelection(index)}
                                            />
                                            <Label
                                                htmlFor={`word-${index}`}
                                                className={`font-arabic ${!word.selected ? 'text-muted-foreground' : ''}`}
                                            >
                                                {word.word}
                                            </Label>
                                            {word.category !== "default" && word.category !== "custom" && (
                                                <Badge variant="outline" className="font-arabic text-xs">
                                                    {word.count} مرات
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeWord(index)}
                                            className="h-7 w-7"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 mb-6">
                                <Input
                                    placeholder="أضف كلمة جديدة..."
                                    className="font-arabic text-right"
                                    value={customWord}
                                    onChange={(e) => setCustomWord(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addCustomWord()}
                                />
                                <Button
                                    variant="outline"
                                    onClick={addCustomWord}
                                    className="font-arabic"
                                >
                                    <Plus className="h-4 w-4 ml-1" />
                                    إضافة
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <div className="space-y-2">
                        <Label htmlFor="theme" className="font-arabic">موضوع القصة (اختياري)</Label>
                        <Input
                            id="theme"
                            placeholder="مثال: الحيوانات، المدرسة، المغامرات..."
                            className="font-arabic text-right"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="length" className="font-arabic">طول القصة</Label>
                        <Select value={length} onValueChange={setLength}>
                            <SelectTrigger>
                                <SelectValue className="font-arabic" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="short" className="font-arabic">قصيرة (حوالي 150 كلمة)</SelectItem>
                                <SelectItem value="medium" className="font-arabic">متوسطة (حوالي 300 كلمة)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="mb-6">
                    <Label className="font-arabic mb-2 block">مستوى الصعوبة</Label>
                    <RadioGroup
                        className="flex gap-4"
                        value={difficulty}
                        onValueChange={setDifficulty}
                    >
                        <div className="flex items-center space-x-2 flex-row-reverse">
                            <Label htmlFor="difficulty-beginner" className="font-arabic">مبتدئ</Label>
                            <RadioGroupItem value="beginner" id="difficulty-beginner" />
                        </div>
                        <div className="flex items-center space-x-2 flex-row-reverse">
                            <Label htmlFor="difficulty-intermediate" className="font-arabic">متوسط</Label>
                            <RadioGroupItem value="intermediate" id="difficulty-intermediate" />
                        </div>
                        <div className="flex items-center space-x-2 flex-row-reverse">
                            <Label htmlFor="difficulty-advanced" className="font-arabic">متقدم</Label>
                            <RadioGroupItem value="advanced" id="difficulty-advanced" />
                        </div>
                    </RadioGroup>
                </div>

                <Button
                    onClick={generateStory}
                    disabled={loading || targetWords.filter(w => w.selected).length === 0}
                    className="w-full font-arabic text-lg group"
                >
                    {loading ? (
                        <RefreshCw className="h-5 w-5 ml-2 animate-spin" />
                    ) : (
                        <Wand className="h-5 w-5 ml-2 group-hover:rotate-12 transition-transform" />
                    )}
                    إنشاء قصة مخصصة
                </Button>
            </Card>

            {story && (
                <Tabs defaultValue="story" className="w-full">
                    <TabsList className="w-full mb-4">
                        <TabsTrigger value="story" className="w-full font-arabic">
                            <BookText className="h-4 w-4 ml-2" />
                            القصة
                        </TabsTrigger>
                        <TabsTrigger
                            value="exercises"
                            className="w-full font-arabic"
                            onClick={() => {
                                if (!exercises && !exercisesLoading) {
                                    generateExercises();
                                }
                            }}
                        >
                            <Lightbulb className="h-4 w-4 ml-2" />
                            تمارين النطق
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="story">
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold font-arabic">{story.story.theme}</h3>
                                    <Badge variant="outline" className="font-arabic">
                                        {story.story.metadata.difficulty === 'beginner' ? 'مبتدئ' :
                                            story.story.metadata.difficulty === 'intermediate' ? 'متوسط' :
                                                'متقدم'}
                                    </Badge>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={handlePrint}>
                                        <Printer className="h-4 w-4 ml-1" />
                                        <span className="font-arabic">طباعة</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={saved ? "outline" : "default"}
                                        disabled={saved || loading}
                                        onClick={saveStory}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 ml-1 animate-spin" />
                                                <span className="font-arabic">جاري الحفظ...</span>
                                            </>
                                        ) : (
                                            <>
                                                <BookOpen className="h-4 w-4 ml-1" />
                                                <span className="font-arabic">{saved ? "تم الحفظ ✓" : "حفظ القصة"}</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-4 flex-wrap mb-4">
                                <p className="text-sm text-muted-foreground font-arabic ml-2">الكلمات المستهدفة:</p>
                                {story.target_errors.map((error, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="font-arabic text-sm"
                                    >
                                        {error.word}
                                    </Badge>
                                ))}
                            </div>

                            <ScrollArea className="h-96 w-full rounded-md border p-6 bg-[#FFFDF7]">
                                <div className="text-xl font-arabic text-right leading-relaxed whitespace-pre-line">
                                    <div
                                        className="story-content"
                                        dangerouslySetInnerHTML={{
                                            __html: story.story.highlighted_text.replace(/\n/g, '<br>')
                                        }}
                                    />
                                </div>
                            </ScrollArea>

                            <div className="text-center mt-6 space-y-3">
                                <p className="font-arabic text-sm text-muted-foreground">
                                    تم إنشاء هذه القصة باستخدام الذكاء الاصطناعي بناءً على الكلمات التي تم اختيارها
                                </p>
                                <div className="bg-green-50 border-2 border-green-300 rounded-md p-4 mt-3 shadow-sm">
                                    <p className="font-arabic text-green-800 font-semibold flex items-center justify-center">
                                        <BookOpen className="h-5 w-5 ml-2 text-green-600" />
                                        لحفظ القصة والتمارين في قاعدة البيانات والوصول إليها لاحقاً،<br />
                                        اضغط على زر "حفظ القصة" أعلى الصفحة
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="exercises">
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold font-arabic">تمارين النطق المخصصة</h3>
                                <Button size="sm" variant="outline" onClick={handlePrint}>
                                    <Printer className="h-4 w-4 ml-1" />
                                    <span className="font-arabic">طباعة</span>
                                </Button>
                            </div>

                            {exercisesLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                    <p className="font-arabic mr-2">جارِ إنشاء التمارين...</p>
                                </div>
                            ) : exercises ? (
                                <div>
                                    {!saved && (
                                        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-md shadow-sm">
                                            <p className="font-arabic text-blue-800 font-semibold text-center flex items-center justify-center">
                                                <BookOpen className="h-5 w-5 ml-2 text-blue-600" />
                                                تذكير: يجب حفظ القصة في قاعدة البيانات للاحتفاظ بالتمارين والوصول إليها لاحقاً
                                            </p>
                                        </div>
                                    )}
                                    <motion.div
                                        key={exerciseTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-muted/10 rounded-lg p-6 min-h-[300px]"
                                    >
                                        {exercises.parsed_exercises.length > 0 ? (
                                            <div className="space-y-6">
                                                <div>
                                                    <Badge variant="outline" className="mb-2 font-arabic">
                                                        تمرين {exerciseTab + 1} من {exercises.parsed_exercises.length}
                                                    </Badge>
                                                    <h4 className="text-lg font-bold font-arabic text-right mb-4">
                                                        {exercises.parsed_exercises[exerciseTab].sentence}
                                                    </h4>
                                                </div>

                                                <div className="bg-white p-4 rounded-md">
                                                    <p className="font-arabic text-right mb-2 text-muted-foreground text-sm">
                                                        نصيحة للنطق:
                                                    </p>
                                                    <p className="font-arabic text-right">
                                                        {exercises.parsed_exercises[exerciseTab].tip}
                                                    </p>
                                                </div>

                                                <div className="bg-primary/10 p-4 rounded-md">
                                                    <p className="font-arabic text-right mb-2 text-muted-foreground text-sm">
                                                        تمرين مقترح:
                                                    </p>
                                                    <p className="font-arabic text-right">
                                                        {exercises.parsed_exercises[exerciseTab].drill}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <p className="font-arabic text-muted-foreground">
                                                    لم يتم العثور على تمارين. حاول إنشاء التمارين مرة أخرى.
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>

                                    {exercises.parsed_exercises.length > 1 && (
                                        <div className="flex justify-between mt-4">
                                            <Button
                                                variant="outline"
                                                onClick={prevExercise}
                                                disabled={exerciseTab === 0}
                                            >
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                                <span className="font-arabic">السابق</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={nextExercise}
                                                disabled={exerciseTab === exercises.parsed_exercises.length - 1}
                                            >
                                                <span className="font-arabic">التالي</span>
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="font-arabic text-muted-foreground mb-4">
                                        اضغط على الزر أدناه لإنشاء تمارين مخصصة بناءً على الكلمات التي تحتاج إلى تدريب
                                    </p>
                                    <Button
                                        onClick={generateExercises}
                                        className="font-arabic"
                                    >
                                        <Lightbulb className="h-4 w-4 ml-2" />
                                        إنشاء تمارين
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </TabsContent>
                </Tabs >
            )}

            <style jsx global>{`
                .story-content mark {
                    background-color: #ffeaa7;
                    padding: 0 2px;
                    border-radius: 3px;
                }
            `}</style>
        </div >
    );
} 