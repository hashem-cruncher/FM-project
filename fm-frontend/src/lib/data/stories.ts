interface StoryQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
}

interface ArabicStory {
    id: string;
    title: string;
    content: string;
    difficulty: 'easy' | 'medium' | 'hard';
    moral: string;
    vocabulary: {
        word: string;
        meaning: string;
    }[];
    questions: StoryQuestion[];
    isAIGenerated?: boolean;
    highlightedContent?: string;
    targetWords?: string[];
}

// Default built-in stories
export const arabicStories: ArabicStory[] = [
    {
        id: 'rabbit-turtle',
        title: 'الأرنب والسلحفاة',
        content: `كان هناك أرنب سريع يحب أن يتباهى بسرعته. وكان دائماً يسخر من السلحفاة البطيئة.

في يوم من الأيام، تحدت السلحفاة الأرنب في سباق. ضحك الأرنب وقال: "حسناً، سأريك كم أنا سريع!"

بدأ السباق. ركض الأرنب بسرعة كبيرة، وابتعد عن السلحفاة. وعندما رأى أنه متقدم كثيراً، قرر أن يأخذ قيلولة تحت شجرة.

أما السلحفاة، فاستمرت في المشي ببطء وثبات. وعندما استيقظ الأرنب، وجد أن السلحفاة قد سبقته إلى خط النهاية!

تعلم الأرنب درساً مهماً: لا تستهن بقدرات الآخرين، والمثابرة أهم من السرعة.`,
        difficulty: 'easy',
        moral: 'المثابرة والعمل الجاد يؤديان إلى النجاح',
        vocabulary: [
            { word: 'يتباهى', meaning: 'يفتخر' },
            { word: 'يسخر', meaning: 'يستهزئ' },
            { word: 'قيلولة', meaning: 'نوم قصير في النهار' },
            { word: 'ثبات', meaning: 'استمرار بدون تغيير' },
            { word: 'المثابرة', meaning: 'الاستمرار في العمل بجد' }
        ],
        questions: [
            {
                question: 'لماذا كان الأرنب يسخر من السلحفاة؟',
                options: [
                    'لأنها كبيرة',
                    'لأنها بطيئة',
                    'لأنها خضراء',
                    'لأنها تعيش في الماء'
                ],
                correctAnswer: 1
            },
            {
                question: 'ماذا فعل الأرنب عندما تقدم في السباق؟',
                options: [
                    'أكمل الركض',
                    'عاد إلى البيت',
                    'نام تحت شجرة',
                    'ساعد السلحفاة'
                ],
                correctAnswer: 2
            },
            {
                question: 'ما هو الدرس المستفاد من القصة؟',
                options: [
                    'السرعة هي الأهم',
                    'النوم مفيد للصحة',
                    'المثابرة أهم من السرعة',
                    'السلاحف أفضل من الأرانب'
                ],
                correctAnswer: 2
            }
        ]
    },
    {
        id: 'kind-tree',
        title: 'الشجرة الكريمة',
        content: `كانت هناك شجرة تفاح كبيرة، وكان هناك ولد صغير يحب أن يلعب حولها كل يوم. كان يجمع أوراقها ويتسلق فروعها ويأكل من تفاحها.

كبر الولد، وأصبح يزور الشجرة أقل فأقل. وفي يوم من الأيام، عاد وكان حزيناً.

قالت الشجرة: "تعال العب معي!"
قال الولد: "لم أعد صغيراً لألعب. أحتاج إلى بيت لأسكن فيه."
قالت الشجرة: "خذ فروعي وابنِ بيتك."

مرت السنوات، وعاد الرجل إلى الشجرة مرة أخرى. كانت الشجرة سعيدة لرؤيته وقدمت له كل ما تملك لمساعدته.

في النهاية، لم يتبق من الشجرة سوى جذع قديم، لكنها كانت سعيدة لأنها ساعدت صديقها.`,
        difficulty: 'easy',
        moral: 'العطاء بدون مقابل هو أجمل أنواع الحب',
        vocabulary: [
            { word: 'يتسلق', meaning: 'يصعد' },
            { word: 'فروع', meaning: 'أغصان الشجرة' },
            { word: 'جذع', meaning: 'ساق الشجرة' },
            { word: 'كريمة', meaning: 'سخية ومعطاءة' },
            { word: 'العطاء', meaning: 'تقديم المساعدة والهدايا' }
        ],
        questions: [
            {
                question: 'ماذا كان الولد يفعل عند الشجرة؟',
                options: [
                    'ينام تحتها فقط',
                    'يلعب ويأكل من تفاحها',
                    'يقطع أغصانها',
                    'يرسم عليها'
                ],
                correctAnswer: 1
            },
            {
                question: 'كيف ساعدت الشجرة الولد عندما كبر؟',
                options: [
                    'أعطته المال',
                    'علمته القراءة',
                    'أعطته فروعها ليبني بيتاً',
                    'طردته بعيداً'
                ],
                correctAnswer: 2
            },
            {
                question: 'ما هي صفة الشجرة الرئيسية في القصة؟',
                options: [
                    'الكرم والعطاء',
                    'الأنانية',
                    'الكسل',
                    'الغضب'
                ],
                correctAnswer: 0
            }
        ]
    },
    {
        id: 'wise-ant',
        title: 'النملة الحكيمة',
        content: `في فصل الصيف، كانت النملة تعمل بجد. كانت تجمع الطعام وتخزنه لفصل الشتاء. وبينما كانت تعمل، كان الجندب يغني ويلعب.

قال الجندب للنملة: "لماذا تتعبين نفسك؟ تعالي واستمتعي بالصيف معي!"
لكن النملة أجابت: "يجب أن أجمع الطعام للشتاء. وأنصحك أن تفعل مثلي."

جاء الشتاء، والثلج يغطي كل شيء. لم يجد الجندب طعاماً، وكان جائعاً وبارداً. أما النملة، فكانت في بيتها الدافئ مع كل الطعام الذي جمعته.

ساعدت النملة الجندب وعلمته درساً مهماً: العمل الجاد في وقته يجلب الراحة في المستقبل.`,
        difficulty: 'medium',
        moral: 'التخطيط للمستقبل والعمل الجاد مهمان للنجاح',
        vocabulary: [
            { word: 'يخزن', meaning: 'يحفظ للمستقبل' },
            { word: 'الجندب', meaning: 'حشرة تصدر صوتاً موسيقياً' },
            { word: 'يتعب', meaning: 'يبذل جهداً كبيراً' },
            { word: 'الثلج', meaning: 'ماء متجمد أبيض' },
            { word: 'التخطيط', meaning: 'الإعداد للمستقبل' }
        ],
        questions: [
            {
                question: 'ماذا كانت النملة تفعل في الصيف؟',
                options: [
                    'تنام طوال اليوم',
                    'تغني مع الجندب',
                    'تجمع وتخزن الطعام',
                    'تلعب في الحديقة'
                ],
                correctAnswer: 2
            },
            {
                question: 'لماذا لم يستمع الجندب لنصيحة النملة؟',
                options: [
                    'لأنه كان مشغولاً باللعب والغناء',
                    'لأنه كان مريضاً',
                    'لأنه كان يجمع الطعام ليلاً',
                    'لأنه كان يساعد الحيوانات الأخرى'
                ],
                correctAnswer: 0
            },
            {
                question: 'ما الذي حدث للجندب في الشتاء؟',
                options: [
                    'وجد طعاماً كثيراً',
                    'سافر إلى مكان دافئ',
                    'كان جائعاً وبارداً',
                    'بنى بيتاً جديداً'
                ],
                correctAnswer: 2
            }
        ]
    }
];

// Function to add AI-generated story to the stories list and save to database
export async function addAIGeneratedStory(storyData: any): Promise<string> {
    // Create unique ID based on timestamp
    const storyId = `ai-story-${Date.now()}`;

    // Extract difficulty from metadata
    let difficulty: 'easy' | 'medium' | 'hard';
    switch (storyData.story.metadata.difficulty) {
        case 'beginner':
            difficulty = 'easy';
            break;
        case 'advanced':
            difficulty = 'hard';
            break;
        default:
            difficulty = 'medium';
    }

    // Create vocabulary list from target words if not provided
    let vocabulary = storyData.vocabulary || [];
    if (!vocabulary.length && storyData.target_errors) {
        vocabulary = storyData.target_errors.map((error: any) => ({
            word: error.word,
            meaning: error.category || 'كلمة مستهدفة للتدريب'
        }));
    }

    // Create simple questions to practice comprehension if not provided
    let questions = storyData.questions || [];
    if (!questions.length) {
        questions = [
            {
                question: 'ما هو موضوع القصة؟',
                options: [
                    storyData.story.theme,
                    'الصداقة',
                    'المغامرات',
                    'الطبيعة'
                ],
                correctAnswer: 0
            },
            {
                question: 'ما هي الكلمات المستهدفة في هذه القصة؟',
                options: [
                    storyData.target_errors[0]?.word || 'لا توجد كلمات',
                    storyData.target_errors[1]?.word || 'كلمات عادية',
                    'جميع الكلمات المميزة بالألوان',
                    'كلمات عشوائية'
                ],
                correctAnswer: 2
            },
            {
                question: 'ما الهدف من هذه القصة؟',
                options: [
                    'التسلية فقط',
                    'تعلم معلومات جديدة',
                    'التدريب على نطق الكلمات الصعبة',
                    'حفظ قصة جديدة'
                ],
                correctAnswer: 2
            }
        ];
    }

    // Create new story object with AI data
    const newStory: ArabicStory = {
        id: storyId,
        title: storyData.story.theme || 'قصة منشأة بالذكاء الاصطناعي',
        content: storyData.story.text,
        difficulty: difficulty,
        moral: storyData.moral || 'تحسين مهارات النطق والقراءة',
        vocabulary: vocabulary,
        questions: questions,
        isAIGenerated: true,
        highlightedContent: storyData.story.highlighted_text,
        targetWords: storyData.story.target_words || storyData.target_errors.map((e: any) => e.word)
    };

    // Add to the stories array in memory
    arabicStories.unshift(newStory);

    try {
        // Save story to backend database
        const userId = getUserIdFromLocalStorage();
        if (userId) {
            const response = await fetch(`http://localhost:5000/api/stories/save/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(storyData),
            });

            const data = await response.json();
            if (data.success) {
                console.log(`Story saved to database with ID: ${data.story_id}`);
                return data.story_id.toString();
            } else {
                console.error('Failed to save story to database:', data.message);
            }
        } else {
            console.warn('User not logged in, story saved only in memory');
        }
    } catch (error) {
        console.error('Error saving story to database:', error);
    }

    // Return the ID of the newly created story
    return storyId;
}

// Function to get user ID from localStorage
function getUserIdFromLocalStorage(): number | null {
    try {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            return user.id;
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
    }
    return null;
}

// Function to load AI-generated stories from the backend
export async function loadAIGeneratedStories(): Promise<ArabicStory[]> {
    try {
        const userId = getUserIdFromLocalStorage();
        if (!userId) {
            console.warn('User not logged in, cannot load stories');
            return [];
        }

        const response = await fetch(`http://localhost:5000/api/stories/ai-stories/${userId}`);
        const data = await response.json();

        if (data.success && data.stories) {
            // Convert backend stories to ArabicStory format
            const stories: ArabicStory[] = data.stories.map((storyData: any) => {
                // Extract difficulty from metadata
                let difficulty: 'easy' | 'medium' | 'hard';
                switch (storyData.story.metadata.difficulty) {
                    case 'beginner':
                        difficulty = 'easy';
                        break;
                    case 'advanced':
                        difficulty = 'hard';
                        break;
                    default:
                        difficulty = 'medium';
                }

                return {
                    id: `ai-story-${storyData.id}`,
                    title: storyData.story.theme || 'قصة منشأة بالذكاء الاصطناعي',
                    content: storyData.story.text,
                    difficulty: difficulty,
                    moral: storyData.moral || 'تحسين مهارات النطق والقراءة',
                    vocabulary: storyData.vocabulary || [],
                    questions: storyData.questions || [],
                    isAIGenerated: true,
                    highlightedContent: storyData.story.highlighted_text,
                    targetWords: storyData.story.target_words
                };
            });

            // Add to the stories array (replacing any existing AI stories)
            const nonAiStories = arabicStories.filter(story => !story.isAIGenerated);
            arabicStories.length = 0; // Clear the array
            arabicStories.push(...stories, ...nonAiStories);

            return stories;
        }
        return [];
    } catch (error) {
        console.error('Error loading AI stories:', error);
        return [];
    }
}

// Function to get a single AI-generated story by ID
export async function getAIStoryById(storyId: string): Promise<ArabicStory | null> {
    try {
        // Extract the numeric ID from the string (format: "ai-story-123")
        const idMatch = storyId.match(/ai-story-(\d+)/);
        if (!idMatch) return null;

        const numericId = idMatch[1];
        const response = await fetch(`http://localhost:5000/api/stories/ai-story/${numericId}`);
        const storyData = await response.json();

        if (storyData.success) {
            // Extract difficulty from metadata
            let difficulty: 'easy' | 'medium' | 'hard';
            switch (storyData.story.metadata.difficulty) {
                case 'beginner':
                    difficulty = 'easy';
                    break;
                case 'advanced':
                    difficulty = 'hard';
                    break;
                default:
                    difficulty = 'medium';
            }

            return {
                id: storyId,
                title: storyData.story.theme || 'قصة منشأة بالذكاء الاصطناعي',
                content: storyData.story.text,
                difficulty: difficulty,
                moral: storyData.moral || 'تحسين مهارات النطق والقراءة',
                vocabulary: storyData.vocabulary || [],
                questions: storyData.questions || [],
                isAIGenerated: true,
                highlightedContent: storyData.story.highlighted_text,
                targetWords: storyData.story.target_words
            };
        }
        return null;
    } catch (error) {
        console.error('Error loading AI story:', error);
        return null;
    }
} 