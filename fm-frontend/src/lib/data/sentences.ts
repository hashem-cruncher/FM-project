interface ArabicSentence {
    sentence: string;
    translation: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    words: string[];
}

interface SentenceCategory {
    id: string;
    title: string;
    description: string;
    icon: string;
    sentences: ArabicSentence[];
}

export const arabicSentences: SentenceCategory[] = [
    {
        id: 'greetings',
        title: 'التحيات',
        description: 'جمل للترحيب والتحية',
        icon: '👋',
        sentences: [
            {
                sentence: 'السلام عليكم',
                translation: 'Peace be upon you',
                category: 'greetings',
                difficulty: 'easy',
                words: ['السلام', 'عليكم']
            },
            {
                sentence: 'صباح الخير',
                translation: 'Good morning',
                category: 'greetings',
                difficulty: 'easy',
                words: ['صباح', 'الخير']
            },
            {
                sentence: 'مساء النور',
                translation: 'Good evening',
                category: 'greetings',
                difficulty: 'easy',
                words: ['مساء', 'النور']
            }
        ]
    },
    {
        id: 'family',
        title: 'العائلة',
        description: 'جمل عن العائلة',
        icon: '👨‍👩‍👧‍👦',
        sentences: [
            {
                sentence: 'أبي يحب القراءة',
                translation: 'My father loves reading',
                category: 'family',
                difficulty: 'easy',
                words: ['أبي', 'يحب', 'القراءة']
            },
            {
                sentence: 'أمي تطبخ الطعام',
                translation: 'My mother cooks food',
                category: 'family',
                difficulty: 'easy',
                words: ['أمي', 'تطبخ', 'الطعام']
            },
            {
                sentence: 'أخي يلعب كرة القدم',
                translation: 'My brother plays football',
                category: 'family',
                difficulty: 'medium',
                words: ['أخي', 'يلعب', 'كرة', 'القدم']
            }
        ]
    },
    {
        id: 'school',
        title: 'المدرسة',
        description: 'جمل عن المدرسة',
        icon: '🏫',
        sentences: [
            {
                sentence: 'المعلم يشرح الدرس',
                translation: 'The teacher explains the lesson',
                category: 'school',
                difficulty: 'medium',
                words: ['المعلم', 'يشرح', 'الدرس']
            },
            {
                sentence: 'الطالب يكتب الواجب',
                translation: 'The student writes homework',
                category: 'school',
                difficulty: 'medium',
                words: ['الطالب', 'يكتب', 'الواجب']
            },
            {
                sentence: 'المدرسة كبيرة وجميلة',
                translation: 'The school is big and beautiful',
                category: 'school',
                difficulty: 'medium',
                words: ['المدرسة', 'كبيرة', 'و', 'جميلة']
            }
        ]
    },
    {
        id: 'daily',
        title: 'الحياة اليومية',
        description: 'جمل من الحياة اليومية',
        icon: '🌞',
        sentences: [
            {
                sentence: 'أنا أشرب الماء',
                translation: 'I drink water',
                category: 'daily',
                difficulty: 'easy',
                words: ['أنا', 'أشرب', 'الماء']
            },
            {
                sentence: 'القطة تنام على السرير',
                translation: 'The cat sleeps on the bed',
                category: 'daily',
                difficulty: 'hard',
                words: ['القطة', 'تنام', 'على', 'السرير']
            },
            {
                sentence: 'الشمس تشرق في الصباح',
                translation: 'The sun rises in the morning',
                category: 'daily',
                difficulty: 'hard',
                words: ['الشمس', 'تشرق', 'في', 'الصباح']
            }
        ]
    }
]; 