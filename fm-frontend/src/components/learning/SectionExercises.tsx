import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BookOpen, RefreshCw, Lightbulb, Check, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MultipleChoiceExercise {
    id: number;
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
}

interface SentenceOrderingExercise {
    id: number;
    original_sentence: string;
    shuffled_words: string[];
    correct_order: number[];
    level: string;
}

interface SectionExercises {
    multiple_choice: MultipleChoiceExercise[];
    sentence_ordering: SentenceOrderingExercise[];
}

interface SectionExercisesProps {
    sectionTitle: string;
    sentences: { sentence: string; translation: string; words: string[] }[];
    onComplete: (score: number, total: number) => void;
}

export function SectionExercises({ sectionTitle, sentences, onComplete }: SectionExercisesProps) {
    const [exercises, setExercises] = useState<SectionExercises | null>(null);
    const [loading, setLoading] = useState(false);
    const [exerciseType, setExerciseType] = useState<'multiple_choice' | 'sentence_ordering'>('multiple_choice');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState<string | number[]>('');
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [exerciseComplete, setExerciseComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // استرجاع الجمل كنصوص بسيطة من props
    const sentenceTexts = sentences.map(item => item.sentence);

    // توليد التمارين من الخادم
    const generateExercises = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/api/learning/generate-section-exercises', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    section_title: sectionTitle,
                    sentences: sentenceTexts
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `خطأ في الاتصال: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setExercises(data.exercises);
                setExerciseType('multiple_choice');
                setCurrentIndex(0);
                setUserAnswer('');
                setSelectedWords([]);
                setShowResult(false);
                setScore(0);
                setTotalAnswered(0);
                setExerciseComplete(false);
            } else {
                throw new Error(data.error || 'فشل في توليد التمارين');
            }
        } catch (error) {
            console.error('Error generating exercises:', error);
            setError(`فشل في توليد التمارين: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            toast.error('حدث خطأ أثناء توليد التمارين');
        } finally {
            setLoading(false);
        }
    };

    // توليد التمارين عند تحميل المكون
    useEffect(() => {
        if (sentences.length >= 3) {
            generateExercises();
        } else {
            setError('عدد الجمل غير كافٍ لتوليد التمارين. يجب أن يكون هناك 3 جمل على الأقل.');
        }
    }, []);

    // التحقق من إجابة المستخدم في تمارين الاختيار من متعدد
    const checkMultipleChoiceAnswer = () => {
        if (!exercises) return;

        const currentExercise = exercises.multiple_choice[currentIndex];
        const isAnswerCorrect = userAnswer === currentExercise.correct_answer;

        setIsCorrect(isAnswerCorrect);
        setShowResult(true);

        if (isAnswerCorrect) {
            setScore(prev => prev + 1);
        }

        setTotalAnswered(prev => prev + 1);

        // الانتقال إلى السؤال التالي بعد ثانيتين
        setTimeout(() => {
            setShowResult(false);
            if (currentIndex < exercises.multiple_choice.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setUserAnswer('');
            } else if (exerciseType === 'multiple_choice') {
                // الانتقال إلى تمارين ترتيب الجمل بعد الانتهاء من الاختيار المتعدد
                setExerciseType('sentence_ordering');
                setCurrentIndex(0);
                setUserAnswer('');
                setSelectedWords([]);
            } else {
                // إكمال جميع التمارين
                finishExercises();
            }
        }, 2000);
    };

    // التحقق من إجابة المستخدم في تمارين ترتيب الجمل
    const checkSentenceOrderingAnswer = () => {
        if (!exercises) return;

        const currentExercise = exercises.sentence_ordering[currentIndex];

        // التحقق من أن المستخدم قد اختار جميع الكلمات
        if (selectedWords.length !== currentExercise.shuffled_words.length) {
            toast.error('يرجى ترتيب جميع الكلمات');
            return;
        }

        // إنشاء الجملة الأصلية والجملة المرتبة من قبل المستخدم
        const originalSentence = currentExercise.original_sentence.trim();
        const userSentence = selectedWords.join(' ').trim();

        const isAnswerCorrect = originalSentence === userSentence;

        setIsCorrect(isAnswerCorrect);
        setShowResult(true);

        if (isAnswerCorrect) {
            setScore(prev => prev + 1);
        }

        setTotalAnswered(prev => prev + 1);

        // الانتقال إلى السؤال التالي بعد ثانيتين
        setTimeout(() => {
            setShowResult(false);
            if (currentIndex < exercises.sentence_ordering.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedWords([]);
            } else {
                // إكمال جميع التمارين
                finishExercises();
            }
        }, 2000);
    };

    // إكمال جميع التمارين وإرسال النتيجة
    const finishExercises = () => {
        setExerciseComplete(true);

        // حساب النسبة المئوية للنجاح
        const totalExercises = exercises ?
            exercises.multiple_choice.length + exercises.sentence_ordering.length : 0;

        // استدعاء الدالة التي تم تمريرها من المكون الأب
        onComplete(score, totalExercises);
    };

    // إضافة كلمة إلى ترتيب الجملة
    const addWordToOrdering = (word: string) => {
        if (!showResult) {
            setSelectedWords(prev => [...prev, word]);
        }
    };

    // إزالة كلمة من ترتيب الجملة
    const removeWordFromOrdering = (index: number) => {
        if (!showResult) {
            setSelectedWords(prev => {
                const newArr = [...prev];
                newArr.splice(index, 1);
                return newArr;
            });
        }
    };

    // التعامل مع تغيير نوع التمرين
    const handleExerciseTypeChange = (value: string) => {
        if (value === 'multiple_choice' || value === 'sentence_ordering') {
            setExerciseType(value);
            setCurrentIndex(0);
            setUserAnswer('');
            setSelectedWords([]);
            setShowResult(false);
        }
    };

    // إعادة التمرين
    const resetExercise = () => {
        setCurrentIndex(0);
        setUserAnswer('');
        setSelectedWords([]);
        setShowResult(false);
        setScore(0);
        setTotalAnswered(0);
        setExerciseComplete(false);
        setExerciseType('multiple_choice');
    };

    // توجيه المتعلم بناءً على نتيجته
    const getCompletionMessage = () => {
        const totalExercises = exercises ?
            exercises.multiple_choice.length + exercises.sentence_ordering.length : 0;
        const percentage = totalExercises > 0 ? (score / totalExercises) * 100 : 0;

        if (percentage >= 80) {
            return 'ممتاز! أنت متقن لهذا القسم';
        } else if (percentage >= 60) {
            return 'جيد جدًا! يمكنك مراجعة الأخطاء للتحسين';
        } else {
            return 'استمر في الممارسة. نوصي بمراجعة هذا القسم مرة أخرى';
        }
    };

    if (loading) {
        return (
            <Card className="p-6 text-center">
                <div className="flex flex-col items-center justify-center py-8">
                    <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-xl font-bold font-arabic mb-2">جاري إنشاء التمارين...</p>
                    <p className="text-muted-foreground font-arabic">
                        نستخدم الذكاء الاصطناعي لتوليد تمارين مخصصة لقسم {sectionTitle}
                    </p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5 ml-2" />
                    <AlertDescription className="font-arabic">
                        {error}
                    </AlertDescription>
                </Alert>
                <div className="mt-4 text-center">
                    <Button onClick={generateExercises} className="font-arabic">
                        <RefreshCw className="h-4 w-4 ml-2" />
                        إعادة المحاولة
                    </Button>
                </div>
            </Card>
        );
    }

    if (exerciseComplete) {
        return (
            <Card className="p-6">
                <div className="text-center space-y-6 py-8">
                    <h3 className="text-2xl font-bold font-arabic mb-4">
                        نتيجة التمارين
                    </h3>

                    <div className="relative flex justify-center">
                        <div className="w-36 h-36 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-3xl font-bold">
                                {score}/{exercises ? exercises.multiple_choice.length + exercises.sentence_ordering.length : 0}
                            </span>
                        </div>
                    </div>

                    <p className="text-xl font-arabic mb-2">
                        {getCompletionMessage()}
                    </p>

                    <div className="flex justify-center gap-4">
                        <Button onClick={resetExercise} className="font-arabic">
                            <RefreshCw className="h-4 w-4 ml-2" />
                            إعادة التمارين
                        </Button>
                        <Button variant="outline" onClick={() => onComplete(score, totalAnswered)} className="font-arabic">
                            <Check className="h-4 w-4 ml-2" />
                            استمرار التعلم
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    if (!exercises) {
        return (
            <Card className="p-6 text-center">
                <div className="py-8">
                    <p className="text-muted-foreground font-arabic mb-4">لا توجد تمارين متاحة لهذا القسم</p>
                    <Button onClick={generateExercises} className="font-arabic">
                        <Lightbulb className="h-4 w-4 ml-2" />
                        توليد تمارين جديدة
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="space-y-6">
                {/* عنوان القسم والتقدم */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold font-arabic">تمارين قسم {sectionTitle}</h3>
                        <Badge variant="outline" className="font-arabic">
                            {totalAnswered}/{exercises.multiple_choice.length + exercises.sentence_ordering.length} تمرين
                        </Badge>
                    </div>
                    <Progress value={(totalAnswered / (exercises.multiple_choice.length + exercises.sentence_ordering.length)) * 100} className="h-2" />
                </div>

                {/* تبويبات أنواع التمارين */}
                <Tabs value={exerciseType} onValueChange={handleExerciseTypeChange} className="w-full">
                    <TabsList className="w-full">
                        <TabsTrigger value="multiple_choice" className="w-full font-arabic">
                            <BookOpen className="h-4 w-4 ml-2" />
                            اختيار من متعدد
                        </TabsTrigger>
                        <TabsTrigger value="sentence_ordering" className="w-full font-arabic">
                            <Lightbulb className="h-4 w-4 ml-2" />
                            ترتيب الجمل
                        </TabsTrigger>
                    </TabsList>

                    {/* محتوى تمارين الاختيار من متعدد */}
                    <TabsContent value="multiple_choice">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`mc-${currentIndex}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex justify-between items-center">
                                    <Badge variant="outline" className="font-arabic">
                                        سؤال {currentIndex + 1} من {exercises.multiple_choice.length}
                                    </Badge>
                                    <Badge variant="outline" className="font-arabic">
                                        النتيجة: {score}/{totalAnswered}
                                    </Badge>
                                </div>

                                <div className="text-center space-y-4">
                                    <h3 className="text-xl font-bold font-arabic">
                                        {exercises.multiple_choice[currentIndex].question}
                                    </h3>
                                </div>

                                <RadioGroup
                                    value={userAnswer as string}
                                    onValueChange={setUserAnswer}
                                    className="space-y-3"
                                    dir="rtl"
                                >
                                    {exercises.multiple_choice[currentIndex].options.map((option, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Label
                                                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/5
                                                    ${showResult && option === exercises.multiple_choice[currentIndex].correct_answer ? 'bg-green-100 border-green-500' : ''}
                                                    ${showResult && userAnswer === option && option !== exercises.multiple_choice[currentIndex].correct_answer ? 'bg-red-100 border-red-500' : ''}`}
                                            >
                                                <RadioGroupItem
                                                    value={option}
                                                    disabled={showResult}
                                                    className="ml-4"
                                                />
                                                <span className="font-arabic text-lg">{option}</span>
                                            </Label>
                                        </motion.div>
                                    ))}
                                </RadioGroup>

                                {showResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                                    >
                                        <p className={`font-arabic font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                            {isCorrect ? 'إجابة صحيحة! أحسنت' : 'إجابة خاطئة'}
                                        </p>
                                        <p className="font-arabic text-muted-foreground mt-1">
                                            {exercises.multiple_choice[currentIndex].explanation}
                                        </p>
                                    </motion.div>
                                )}

                                {!showResult && (
                                    <Button
                                        onClick={checkMultipleChoiceAnswer}
                                        disabled={!userAnswer}
                                        className="w-full font-arabic"
                                    >
                                        <Check className="h-4 w-4 ml-2" />
                                        تحقق من الإجابة
                                    </Button>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </TabsContent>

                    {/* محتوى تمارين ترتيب الجمل */}
                    <TabsContent value="sentence_ordering">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`so-${currentIndex}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex justify-between items-center">
                                    <Badge variant="outline" className="font-arabic">
                                        تمرين {currentIndex + 1} من {exercises.sentence_ordering.length}
                                    </Badge>
                                    <Badge variant="outline" className="font-arabic">
                                        المستوى: {exercises.sentence_ordering[currentIndex].level}
                                    </Badge>
                                </div>

                                <div className="text-center space-y-4">
                                    <h3 className="text-xl font-bold font-arabic">
                                        رتب الكلمات لتكوين جملة صحيحة
                                    </h3>
                                </div>

                                {/* الكلمات المتاحة للاختيار */}
                                <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
                                    {exercises.sentence_ordering[currentIndex].shuffled_words.map((word, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`bg-primary/10 px-4 py-2 rounded-full font-arabic cursor-pointer hover:bg-primary/20 transition-colors 
                                                ${selectedWords.includes(word) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            onClick={() => !selectedWords.includes(word) && addWordToOrdering(word)}
                                        >
                                            {word}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* الجملة التي يتم تكوينها */}
                                <div className="mt-8">
                                    <h4 className="text-lg font-bold font-arabic mb-4">جملتك:</h4>
                                    <div className="flex flex-wrap gap-2 justify-center bg-muted/20 p-6 rounded-lg min-h-[100px]" dir="rtl">
                                        {selectedWords.map((word, index) => (
                                            <motion.div
                                                key={index}
                                                className={`bg-primary/20 px-4 py-2 rounded-full font-arabic cursor-pointer hover:bg-primary/30 transition-colors
                                                    ${showResult && isCorrect ? 'bg-green-100 hover:bg-green-200' : ''}
                                                    ${showResult && !isCorrect ? 'bg-red-100 hover:bg-red-200' : ''}`}
                                                onClick={() => !showResult && removeWordFromOrdering(index)}
                                            >
                                                {word}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {showResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                                    >
                                        <p className={`font-arabic font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                            {isCorrect ? 'ترتيب صحيح! أحسنت' : 'ترتيب خاطئ'}
                                        </p>
                                        {!isCorrect && (
                                            <p className="font-arabic text-muted-foreground mt-1">
                                                الترتيب الصحيح: {exercises.sentence_ordering[currentIndex].original_sentence}
                                            </p>
                                        )}
                                    </motion.div>
                                )}

                                {!showResult && (
                                    <Button
                                        onClick={checkSentenceOrderingAnswer}
                                        disabled={selectedWords.length !== exercises.sentence_ordering[currentIndex].shuffled_words.length}
                                        className="w-full font-arabic"
                                    >
                                        <Check className="h-4 w-4 ml-2" />
                                        تحقق من الترتيب
                                    </Button>
                                )}

                                {selectedWords.length > 0 && !showResult && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedWords([])}
                                        className="w-full font-arabic mt-2"
                                    >
                                        <RefreshCw className="h-4 w-4 ml-2" />
                                        إعادة الترتيب
                                    </Button>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </TabsContent>
                </Tabs>
            </div>
        </Card>
    );
} 