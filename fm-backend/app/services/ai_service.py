import openai
import os
import json
import random
from datetime import datetime
import re


class AIService:
    """خدمة الذكاء الاصطناعي للتكامل مع OpenAI وإنشاء محتوى تعليمي"""

    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("يجب تعيين OPENAI_API_KEY في متغيرات البيئة")

        # Set API key for OpenAI client
        self.client = openai.OpenAI(api_key=self.api_key)

    def generate_story(
        self,
        error_words,
        theme=None,
        age_group="children",
        difficulty="intermediate",
        length="short",
    ):
        """
        إنشاء قصة تتضمن الكلمات التي يواجه الطالب صعوبة في نطقها

        Parameters:
        - error_words: قائمة بالكلمات الصعبة مع فئة الخطأ
        - theme: موضوع القصة (اختياري)
        - age_group: الفئة العمرية (children, youth)
        - difficulty: مستوى الصعوبة (beginner, intermediate, advanced)
        - length: طول القصة (short, medium)

        Returns:
        - قصة مولدة تحتوي على الكلمات المستهدفة
        """
        # تجهيز الكلمات للتضمين في القصة
        target_words = [item["word"] for item in error_words]

        # تحديد موضوع القصة إذا لم يتم تحديده
        themes = [
            "الطبيعة",
            "المغامرات",
            "المدرسة",
            "الحيوانات",
            "العائلة",
            "الصداقة",
            "الرياضة",
        ]
        story_theme = theme if theme else random.choice(themes)

        # تحديد طول القصة
        word_count = "150" if length == "short" else "300"

        # إنشاء نص التعليمات لـ OpenAI
        system_prompt = """
        أنت معلم للغة العربية متخصص في إنشاء قصص تعليمية للأطفال.
        ستقوم بإنشاء قصة قصيرة تتضمن كلمات محددة مع تقديم كافة عناصر القصة المطلوبة للاستخدام في تطبيق تعليمي.
        يجب أن تكون القصة مناسبة للأطفال وجذابة وتعليمية، مع التركيز على الكلمات المستهدفة للتدريب على النطق.
        
        مهم جدًا: يجب إعادة الاستجابة بتنسيق JSON دقيق حسب الهيكل التالي:
        {
            "story_text": "نص القصة هنا",
            "vocabulary": [
                {"word": "كلمة1", "meaning": "معنى الكلمة1"},
                {"word": "كلمة2", "meaning": "معنى الكلمة2"},
                ...
            ],
            "questions": [
                {"question": "سؤال1", "options": ["خيار1", "خيار2", "خيار3", "خيار4"], "correctAnswer": 2},
                ...
            ],
            "moral": "المغزى الأخلاقي للقصة"
        }
        """

        user_prompt = f"""
        اكتب قصة قصيرة باللغة العربية حوالي {word_count} كلمة عن {story_theme}.
        يجب أن تتضمن القصة الكلمات التالية بشكل طبيعي في السياق: {", ".join(target_words)}
        
        القصة يجب أن تكون:
        - مناسبة للفئة العمرية: {age_group}
        - بمستوى صعوبة: {difficulty}
        - ذات بداية ووسط ونهاية واضحة
        - تحتوي على شخصيات وحبكة بسيطة
        - تعليمية وممتعة
        - تستخدم لغة فصحى بسيطة
        
        أعد الكلمات المستهدفة في عدة سياقات مختلفة إذا أمكن للتدريب على نطقها.
        
        بعد كتابة القصة، قم بإعداد المكونات التالية لاستخدامها في التطبيق التعليمي:
        
        1. قائمة بخمس مفردات مهمة من القصة مع شرح معناها باللغة العربية.
           - اختر الكلمات الصعبة أو غير المألوفة التي قد يصعب فهمها على الطفل
           - لا تركز فقط على الكلمات المستهدفة، بل اختر مفردات متنوعة تثري قاموس الطفل اللغوي
           - قدم شرحًا واضحًا وبسيطًا لمعنى كل كلمة
        
        2. ثلاثة أسئلة فهم حول القصة، كل سؤال له أربعة خيارات مع الإجابة الصحيحة.
        
        3. مغزى أخلاقي واضح للقصة في جملة واحدة.
        
        يجب تضمين جميع المكونات المذكورة أعلاه في كائن JSON واحد حسب البنية المحددة في تعليمات النظام.
        """

        try:
            # Use the updated OpenAI client
            response = self.client.chat.completions.create(
                model="gpt-4.1-nano-2025-04-14",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=1500,
                response_format={"type": "json_object"},
            )

            # استخراج الاستجابة الكاملة
            response_content = response.choices[0].message.content

            try:
                data = json.loads(response_content)

                # استخراج مكونات القصة من JSON
                story_text = data.get("story_text", "")
                vocabulary = data.get("vocabulary", [])
                questions = data.get("questions", [])
                moral = data.get("moral", "تحسين مهارات النطق والقراءة من خلال التمرين")

            except Exception as e:
                print(f"Error parsing AI response JSON: {str(e)}")
                # في حالة فشل التحليل، استخدم قيمًا افتراضية
                story_text = response_content

                # تحليل النص لاستخراج كلمات مفيدة للمفردات
                # في هذه الحالة نستخدم مزيج من الكلمات المستهدفة وبعض الكلمات الطويلة من النص
                words = story_text.split()
                long_words = [w for w in words if len(w) > 5 and is_valid_word(w)]
                unique_words = list(set(long_words))
                random.shuffle(unique_words)

                # إنشاء قائمة مفردات بالجمع بين الكلمات المستهدفة وكلمات أخرى من القصة
                vocabulary = []
                for word in target_words[:3]:  # نأخذ بعض الكلمات المستهدفة
                    if word not in [v["word"] for v in vocabulary]:
                        vocabulary.append(
                            {"word": word, "meaning": "كلمة مستهدفة للتمرين"}
                        )

                # إضافة بعض الكلمات الطويلة من القصة
                for word in unique_words[:5]:
                    if len(vocabulary) < 5 and word not in [
                        v["word"] for v in vocabulary
                    ]:
                        vocabulary.append(
                            {"word": word, "meaning": f"كلمة مهمة من القصة تعني..."}
                        )

                questions = [
                    {
                        "question": "ما هو موضوع القصة؟",
                        "options": [story_theme, "الصداقة", "المغامرات", "الطبيعة"],
                        "correctAnswer": 0,
                    },
                    {
                        "question": "ما هي الكلمات المستهدفة في القصة؟",
                        "options": [
                            "كل الكلمات",
                            "الكلمات الطويلة",
                            target_words[0] if target_words else "كلمات محددة",
                            "لا توجد كلمات مستهدفة",
                        ],
                        "correctAnswer": 2,
                    },
                    {
                        "question": "ما الهدف من هذه القصة؟",
                        "options": [
                            "التسلية فقط",
                            "تعلم النطق الصحيح",
                            "القراءة السريعة",
                            "الحفظ",
                        ],
                        "correctAnswer": 1,
                    },
                ]
                moral = "تحسين مهارات النطق والقراءة من خلال التمرين"

            # تحديد الكلمات المستهدفة في النص
            highlighted_story = self._highlight_target_words(story_text, target_words)

            return {
                "success": True,
                "story": {
                    "text": story_text,
                    "highlighted_text": highlighted_story,
                    "target_words": target_words,
                    "theme": story_theme,
                    "generated_at": datetime.utcnow().isoformat(),
                    "metadata": {
                        "age_group": age_group,
                        "difficulty": difficulty,
                        "length": length,
                    },
                },
                "vocabulary": vocabulary,
                "questions": questions,
                "moral": moral,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    def _highlight_target_words(self, text, target_words):
        """
        تمييز الكلمات المستهدفة في النص
        إضافة علامات HTML لتمييز الكلمات (<mark>الكلمة</mark>)
        استخدام التعبيرات النمطية لضمان تحديد جميع الحالات
        """
        highlighted_text = text

        # Sort target words by length (descending) to handle longer phrases first
        sorted_target_words = sorted(target_words, key=len, reverse=True)

        for word in sorted_target_words:
            if not word or len(word.strip()) < 2:
                continue  # Skip empty or very short words

            # تطهير الكلمة من أي أحرف خاصة قد تؤثر على التعبير النمطي
            escaped_word = re.escape(word.strip())

            # استخدام تعبير نمطي محسن لمطابقة الكلمة في جميع السياقات المحتملة
            # 1. يراعي الحروف المتصلة واللواحق والسوابق
            # 2. يطابق الكلمات بداية ووسط ونهاية النص
            # 3. يتعامل مع علامات الترقيم المختلفة

            # Arabic word boundaries - these are characters that can surround an Arabic word
            arabic_boundaries = r'[،.؟!:؛""\'()[\]{}\s\n…—–\-]'

            # Pattern: word at beginning, middle, or end of text with proper boundaries
            pattern = rf"(^|{arabic_boundaries})({escaped_word})($|{arabic_boundaries})"

            # Replace while preserving surrounding context
            highlighted_text = re.sub(pattern, r"\1<mark>\2</mark>\3", highlighted_text)

            # Also try to match word forms that might have prefixes or suffixes
            # This is particularly important for Arabic where words can have affixes
            word_form_pattern = rf"(\b)({escaped_word}[ً-ْ]*)(\b)"
            highlighted_text = re.sub(
                word_form_pattern, r"\1<mark>\2</mark>\3", highlighted_text
            )

        return highlighted_text

    def generate_practice_exercises(self, error_words, error_categories, count=5):
        """
        إنشاء تمارين تدريبية مخصصة بناءً على أخطاء النطق

        Parameters:
        - error_words: قائمة بالكلمات الصعبة
        - error_categories: فئات الأخطاء
        - count: عدد التمارين المطلوبة

        Returns:
        - تمارين مولدة للتدريب على النطق
        """
        system_prompt = """
        أنت معلم للغة العربية متخصص في تعليم النطق الصحيح.
        سيطلب منك إنشاء تمارين قصيرة للتدريب على نطق كلمات محددة.
        يجب أن تكون التمارين متنوعة وتركز على المشاكل الصوتية المحددة.
        
        مهم جدًا: يجب إعادة الاستجابة بتنسيق JSON دقيق حسب الهيكل التالي:
        {
            "exercises": [
                {
                    "id": 1,
                    "word": "الكلمة المستهدفة",
                    "sentence": "جملة تحتوي على الكلمة المستهدفة",
                    "tip": "نصيحة حول كيفية نطق الكلمة",
                    "drill": "تمرين صوتي مقترح"
                },
                ...
            ]
        }
        """

        error_info = []
        for word, category in zip(error_words, error_categories):
            error_info.append(f"الكلمة: {word}, فئة الخطأ: {category}")

        user_prompt = f"""
        أنشئ {count} تمارين قصيرة للتدريب على النطق الصحيح للكلمات التالية:
        
        {"\n".join(error_info)}
        
        لكل تمرين:
        1. اكتب جملة قصيرة (5-10 كلمات) تحتوي على الكلمة المستهدفة
        2. قدم نصيحة قصيرة حول كيفية نطق الكلمة بشكل صحيح
        3. اقترح تمرينًا صوتيًا بسيطًا للتدريب
        
        التمارين يجب أن تكون متنوعة ومناسبة للأطفال.
        
        يجب تضمين جميع التمارين في كائن JSON واحد حسب البنية المحددة في تعليمات النظام.
        """

        try:
            # Use the updated OpenAI client
            response = self.client.chat.completions.create(
                model="gpt-4.1-nano-2025-04-14",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=1000,
                response_format={"type": "json_object"},
            )

            # استخراج الاستجابة
            response_content = response.choices[0].message.content

            # تحليل JSON
            try:
                data = json.loads(response_content)
                parsed_exercises = data.get("exercises", [])

                # تنسيق النص القديم للتوافق مع الواجهة السابقة
                exercises_text = ""
                for ex in parsed_exercises:
                    exercises_text += (
                        f"{ex['id']}. {ex['sentence']}\n{ex['tip']}\n{ex['drill']}\n\n"
                    )

                return {
                    "success": True,
                    "exercises": exercises_text,
                    "parsed_exercises": parsed_exercises,
                    "generated_at": datetime.utcnow().isoformat(),
                }

            except Exception as e:
                print(f"Error parsing exercise JSON: {str(e)}")
                # في حالة فشل التحليل، استخدم النص الخام
                fallback_exercises = []
                for i, word in enumerate(error_words[:count]):
                    fallback_exercises.append(
                        {
                            "id": i + 1,
                            "word": word,
                            "sentence": f"هذه جملة تحتوي على كلمة {word} للتدريب.",
                            "tip": f"تأكد من نطق حروف كلمة {word} بوضوح.",
                            "drill": f"كرر كلمة {word} خمس مرات متتالية بشكل بطيء ثم سريع.",
                        }
                    )

                # إنشاء نص التمارين للتوافق مع الواجهة القديمة
                exercises_text = ""
                for ex in fallback_exercises:
                    exercises_text += (
                        f"{ex['id']}. {ex['sentence']}\n{ex['tip']}\n{ex['drill']}\n\n"
                    )

                return {
                    "success": True,
                    "exercises": exercises_text,
                    "parsed_exercises": fallback_exercises,
                    "generated_at": datetime.utcnow().isoformat(),
                }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "exercises": "",
                "parsed_exercises": [],
                "generated_at": datetime.utcnow().isoformat(),
            }


def is_valid_word(word):
    # إزالة الفراغات
    word = word.strip()

    # التحقق من أن الكلمة ليست فارغة
    if not word:
        return False

    # التحقق من أن الكلمة ليست علامة ترقيم
    if re.match(r'^[،.؟!:؛""\'()[\]{}…—–-]+$', word):
        return False

    # قائمة بحروف الجر والكلمات غير المهمة باللغة العربية
    stopwords = [
        "في",
        "على",
        "من",
        "إلى",
        "عن",
        "بـ",
        "لـ",
        "كـ",
        "ب",
        "ل",
        "و",
        "ثم",
        "أو",
        "أم",
        "إن",
        "إذا",
        "هو",
        "هي",
        "هم",
        "هن",
        "أنت",
        "أنتم",
        "أنتن",
        "أنا",
        "نحن",
        "هذا",
        "هذه",
        "ذلك",
        "تلك",
        "هؤلاء",
        "أولئك",
        "التي",
        "الذي",
        "اللذان",
        "اللتان",
        "الذين",
        "اللواتي",
        "ما",
        "ماذا",
        "متى",
        "أين",
        "كيف",
        "لماذا",
        "لم",
        "لن",
        "لا",
        "ليس",
        "كان",
        "كانت",
        "كانوا",
        "يكون",
        "تكون",
        "بين",
        "حول",
        "عند",
        "حتى",
        "منذ",
        "خلال",
        "عبر",
        "فوق",
        "تحت",
        "أمام",
        "خلف",
        "قبل",
        "بعد",
    ]

    # التحقق من أن الكلمة ليست من حروف الجر أو الكلمات غير المهمة
    if word in stopwords:
        return False

    # التحقق من أن طول الكلمة مناسب (أكثر من حرفين)
    if len(word) <= 2:
        return False

    return True
