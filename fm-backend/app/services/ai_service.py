import openai
import os
import json
import random
from datetime import datetime
import re
import requests
import base64

# Import these at the top level to avoid circular imports
from app.db import db

# Import the models class references but not the actual models
import app.models.user as user_models


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

    def generate_image_for_sentence(
        self,
        sentence,
        image_style="realistic",
        size="1024x1024",
        consistent_with_previous=False,
        consistency_factor=0.5,
        entity_id=None,
        entity_type=None,
    ):
        """
        إنشاء صورة توضيحية للجملة أو القصة باستخدام OpenAI

        Parameters:
        - sentence: الجملة أو القصة المراد إنشاء صورة لها
        - image_style: نمط الصورة (realistic, cartoon, artistic)
        - size: حجم الصورة (1024x1024, 512x512)
        - consistent_with_previous: ما إذا كانت الصورة يجب أن تكون متسقة مع الصور السابقة
        - consistency_factor: عامل الاتساق (0.0 - 1.0) حيث 1.0 تعني تناسق كامل
        - entity_id: معرف الكيان المرتبط بالصورة (قصة أو جملة)
        - entity_type: نوع الكيان ('story' أو 'sentence')

        Returns:
        - رابط الصورة المولدة أو التشفير Base64 للصورة
        """
        try:
            # إضافة تعليمات الاتساق إذا كانت مطلوبة
            consistency_instructions = ""
            if consistent_with_previous:
                consistency_instructions = f"""
                IMPORTANT: This image should be CONSISTENT with previous images in the same story.
                - Use the same character designs, art style, colors, and settings
                - Maintain visual coherence with a consistency factor of {consistency_factor*100}%
                - Keep the same artistic style, character appearances, and scene elements
                - This is frame {sentence.split('الصورة رقم')[-1].split('من')[0].strip() if 'الصورة رقم' in sentence else 'N'} in a sequence
                """

            description_prompt = f"""
            Translate the following Arabic content to English and create a detailed visual description
            for generating an image that illustrates it (without mentioning text in the image):
            
            "{sentence}"
            
            {consistency_instructions}
            
            Make the description detailed, visual, and suitable for an educational context for children.
            """

            # الحصول على وصف الصورة باللغة الإنجليزية
            description_response = self.client.chat.completions.create(
                model="gpt-4.1-nano-2025-04-14",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that translates Arabic sentences to English and creates visual descriptions for image generation.",
                    },
                    {"role": "user", "content": description_prompt},
                ],
                temperature=0.7,
                max_tokens=300,
            )

            image_description = description_response.choices[0].message.content.strip()

            # تخصيص الوصف حسب نمط الصورة المطلوب
            style_descriptions = {
                "realistic": "Create a photorealistic image that illustrates: ",
                "cartoon": "Create a colorful cartoon-style image suitable for children that illustrates: ",
                "artistic": "Create an artistic painting-like image that illustrates: ",
                "digital_art": "Create a digital art illustration with vibrant colors that shows: ",
            }

            style_prompt = style_descriptions.get(
                image_style, style_descriptions["realistic"]
            )

            # إضافة تعليمات الاتساق إلى الوصف النهائي
            consistency_suffix = ""
            if consistent_with_previous:
                consistency_suffix = " Make sure this image is consistent in style, characters and setting with previous images in the same story sequence."

            final_prompt = f"{style_prompt}{image_description}{consistency_suffix}"

            # توليد الصورة باستخدام OpenAI - updated parameters for newer API version
            result = self.client.images.generate(
                model="dall-e-3",
                prompt=final_prompt,
                size=size,
                n=1,
                quality="standard",
            )

            # استخراج URL الصورة والتحويل إلى base64
            image_url = result.data[0].url

            # تنزيل الصورة من URL
            response = requests.get(image_url)
            if response.status_code == 200:
                # تحويل الصورة إلى base64
                image_b64 = base64.b64encode(response.content).decode("utf-8")

                return {
                    "success": True,
                    "image_data": image_b64,
                    "prompt_used": final_prompt,
                    "generated_at": datetime.utcnow().isoformat(),
                }
            else:
                raise Exception(
                    f"Failed to download image from URL: {response.status_code}"
                )

        except Exception as e:
            print(f"Error generating image: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "generated_at": datetime.utcnow().isoformat(),
            }

    def generate_story_images(self, story_id, image_style="cartoon"):
        """إنشاء صور للقصة بشكل تلقائي وحفظها في قاعدة البيانات"""
        # Use the imported references instead of direct imports
        AIGeneratedStory = user_models.AIGeneratedStory
        StoryImage = user_models.StoryImage

        try:
            # البحث عن القصة في قاعدة البيانات
            story = AIGeneratedStory.query.get(story_id)
            if not story:
                return {"success": False, "message": "القصة غير موجودة"}

            # التحقق من عدم وجود صور مسبقة
            if story.images_generated:
                return {
                    "success": True,
                    "message": "تم إنشاء الصور مسبقاً",
                    "images": [img.to_dict() for img in story.images],
                }

            # استخراج مشاهد رئيسية من القصة
            key_scenes = self._extract_key_scenes(story.content)

            # إنشاء الصور بشكل متتابع
            images = []

            # أولاً، قم بإنشاء سياق للقصة لضمان تناسق الصور
            story_context = f"""
                القصة تتحدث عن: {story.content[:150]}...
                
                نريد صور متسلسلة مرتبطة ببعضها البعض، تستخدم نفس الشخصيات والبيئة والألوان.
                كل صورة يجب أن تكون جزءًا من نفس العالم البصري للصور الأخرى.
            """

            # إنشاء الصور (بحد أقصى 4 صور)
            for i, scene in enumerate(key_scenes[:4]):
                # تحديد موقع المشهد في القصة
                scene_position = (
                    "بداية"
                    if i == 0
                    else "نهاية" if i == len(key_scenes) - 1 else f"وسط"
                )

                # إنشاء سياق غني لهذا المشهد
                scene_context = f"""
                    {story_context}
                    
                    هذه الصورة للـ{scene_position} القصة وتمثل المشهد التالي:
                    "{scene}"
                    
                    الصورة رقم {i + 1} من {min(len(key_scenes), 4)} في القصة.
                """

                result = self.generate_image_for_sentence(
                    sentence=scene_context,
                    image_style=image_style,
                    size="1024x1024",
                    consistent_with_previous=i > 0,
                    consistency_factor=0.8,
                )

                if result["success"]:
                    # إنشاء وحفظ صورة جديدة
                    story_image = StoryImage(
                        story_id=story.id,
                        image_data=result["image_data"],
                        scene_text=scene,
                        position=i,
                        style=image_style,
                    )
                    db.session.add(story_image)
                    images.append(story_image)

            # تحديث حالة إنشاء الصور في القصة
            story.images_generated = True
            db.session.commit()

            return {
                "success": True,
                "message": f"تم إنشاء {len(images)} صور للقصة",
                "images": [img.to_dict() for img in images],
            }

        except Exception as e:
            db.session.rollback()
            print(f"Error generating story images: {str(e)}")
            return {"success": False, "message": f"حدث خطأ: {str(e)}"}

    def _extract_key_scenes(self, text):
        """استخراج المشاهد الرئيسية من النص"""
        # تقسيم النص إلى جمل
        import re

        try:
            # تحسين نمط التعبير المنتظم للتعامل مع اللغة العربية بشكل أفضل
            sentences = re.split(r"[.!?؟،؛\n]+", text)
            sentences = [
                s.strip()
                for s in sentences
                if len(s.strip()) > 10 and len(s.strip()) < 250
            ]

            # إذا كان لدينا أقل من 4 جمل، نعيد كل الجمل
            if len(sentences) <= 4:
                return sentences

            # البحث عن مشاهد/أقسام محتملة في القصة
            scenes = []

            # دائمًا نشمل الجملة الأولى للمقدمة
            scenes.append(sentences[0])

            # بالنسبة للقصص متوسطة الطول، نشمل مشهدين في الوسط
            if len(sentences) >= 6:
                # المشهد الأوسط الأول (بالقرب من نقطة 1/3)
                first_middle_index = len(sentences) // 3
                scenes.append(sentences[first_middle_index])

                # المشهد الأوسط الثاني (بالقرب من نقطة 2/3)
                second_middle_index = (len(sentences) * 2) // 3
                scenes.append(sentences[second_middle_index])
            # بالنسبة للقصص الأقصر، نأخذ مشهدًا واحدًا في الوسط
            elif len(sentences) > 4:
                middle_index = len(sentences) // 2
                scenes.append(sentences[middle_index])

                # نضيف مشهدًا آخر بين الوسط والنهاية
                third_quarter_index = (len(sentences) + middle_index) // 2
                scenes.append(sentences[third_quarter_index])

            # دائمًا نشمل الجملة الأخيرة للخاتمة
            scenes.append(sentences[len(sentences) - 1])

            return scenes
        except Exception as e:
            print(f"Error extracting key scenes: {str(e)}")
            # في حالة الفشل، نعيد 4 أجزاء بسيطة من النص
            text_length = len(text)
            return [
                text[: min(200, text_length // 4)].strip(),
                text[text_length // 4 : text_length // 2].strip(),
                text[text_length // 2 : 3 * text_length // 4].strip(),
                text[3 * text_length // 4 :].strip(),
            ]

    def generate_section_exercises(self, section_title, sentences):
        """
        توليد تمارين متنوعة مخصصة لقسم محدد من أقسام تعلم الجمل

        Parameters:
        - section_title: عنوان القسم (مثلاً: "التحيات"، "الأسرة"، إلخ)
        - sentences: قائمة بالجمل الموجودة في هذا القسم

        Returns:
        - مجموعة من التمارين المتنوعة (اختيار من متعدد وترتيب جمل)
        """
        system_prompt = """
        أنت معلم للغة العربية متخصص في إنشاء تمارين تعليمية للمبتدئين.
        ستقوم بإنشاء تمارين متنوعة بناءً على مجموعة جمل من قسم محدد لمساعدة الطلاب على تعلم اللغة العربية.
        يجب أن تكون التمارين مناسبة للمبتدئين وتركز على الفهم والاستخدام الصحيح للجمل.
        
        ستقوم بإنشاء نوعين من التمارين:
        1. تمارين اختيار من متعدد (املأ الفراغ): 3 تمارين
        2. تمارين ترتيب الجمل: 3 تمارين
        
        مهم جدًا: يجب إعادة الاستجابة بتنسيق JSON دقيق حسب الهيكل التالي:
        {
            "exercises": {
                "multiple_choice": [
                    {
                        "id": 1,
                        "question": "أكمل الجملة: ____ عليكم",
                        "options": ["السلام", "صباح", "مساء", "شكرًا"],
                        "correct_answer": "السلام",
                        "explanation": "شرح بسيط للإجابة الصحيحة"
                    },
                    ...
                ],
                "sentence_ordering": [
                    {
                        "id": 1,
                        "original_sentence": "الجملة الأصلية بترتيبها الصحيح",
                        "shuffled_words": ["كلمة3", "كلمة1", "كلمة2"],
                        "correct_order": [1, 2, 0],
                        "level": "سهل"
                    },
                    ...
                ]
            }
        }
        """

        user_prompt = f"""
        عنوان القسم: {section_title}
        
        الجمل التي يجب استخدامها لإنشاء التمارين:
        {", ".join(sentences)}
        
        قم بإنشاء 6 تمارين متنوعة مقسمة كالتالي:
        - 3 تمارين اختيار من متعدد (ملء الفراغات)
        - 3 تمارين ترتيب الجمل
        
        التمارين يجب أن تكون:
        1. مناسبة للقسم وموضوعه ({section_title})
        2. متدرجة من السهل إلى الصعب
        3. تستخدم الجمل المقدمة أو تعديلات بسيطة عليها
        4. تعليمية وتساعد على الفهم والتذكر
        
        ملاحظات هامة:
        - في تمارين الاختيار من متعدد، تأكد من أن الخيارات متقاربة ومنطقية.
        - في تمارين ترتيب الجمل، قدم كلمات الجملة بترتيب عشوائي وقم بتوفير الترتيب الصحيح في مصفوفة الأرقام.
        - اجعل التمارين مناسبة لمستوى المبتدئين في تعلم اللغة العربية.
        """

        try:
            # استدعاء نموذج OpenAI
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

            # استخراج المحتوى من الاستجابة
            response_content = response.choices[0].message.content

            try:
                # تحليل الاستجابة JSON
                data = json.loads(response_content)

                # التحقق من صحة البيانات المستلمة
                if "exercises" not in data:
                    raise ValueError("بنية البيانات المستلمة غير صحيحة")

                # إعادة البيانات المنسقة
                return {
                    "success": True,
                    "section_title": section_title,
                    "exercises": data["exercises"],
                    "generated_at": datetime.utcnow().isoformat(),
                }

            except json.JSONDecodeError as e:
                print(f"Error parsing JSON response: {str(e)}")
                return {
                    "success": False,
                    "error": "فشل في تحليل استجابة النموذج اللغوي",
                    "generated_at": datetime.utcnow().isoformat(),
                }

        except Exception as e:
            print(f"Error generating section exercises: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "generated_at": datetime.utcnow().isoformat(),
            }

    def generate_sentence_category(
        self, category_name=None, difficulty_level="beginner", num_sentences=3
    ):
        """
        إنشاء فئة جديدة من الجمل مع جمل متناسبة مع المستوى المطلوب ومناسبة للأطفال

        Parameters:
        - category_name: اسم الفئة (اختياري، إذا كان فارغًا سيتم اقتراح فئة)
        - difficulty_level: مستوى الصعوبة (beginner, intermediate, advanced)
        - num_sentences: عدد الجمل المطلوبة في الفئة

        Returns:
        - فئة جديدة من الجمل مع جمل مولدة
        """
        system_prompt = """
        أنت مستشار تعليمي متخصص في إنشاء محتوى تعليمي للأطفال لتعلم اللغة العربية.
        عليك إنشاء فئة من الجمل البسيطة المناسبة للأطفال مع ترجمة وتفاصيل لكل جملة.
        اجعل الجمل ممتعة وجذابة للأطفال، وسهلة النطق والفهم.
        
        مهم جدًا: يجب إعادة الاستجابة بتنسيق JSON دقيق حسب الهيكل التالي:
        {
            "id": "category_id", 
            "title": "عنوان الفئة",
            "description": "وصف قصير للفئة",
            "icon": "ايموجي مناسب للفئة",
            "sentences": [
                {
                    "sentence": "الجملة بالعربية",
                    "translation": "الترجمة الإنجليزية",
                    "category": "category_id",
                    "difficulty": "easy/medium/hard",
                    "words": ["كلمة1", "كلمة2", "..."]
                },
                ...
            ]
        }
        """

        user_prompt = f"""
        أنشئ فئة جديدة من الجمل العربية مناسبة للأطفال لتعلم اللغة العربية.
        
        {"اسم الفئة المطلوبة: " + category_name if category_name else "اقترح فئة جديدة مثيرة للاهتمام ومناسبة للأطفال"}
        مستوى الصعوبة: {difficulty_level}
        عدد الجمل المطلوبة: {num_sentences}
        
        لكل جملة، قم بتوفير:
        1. الجملة باللغة العربية (بسيطة ومناسبة للأطفال)
        2. الترجمة الإنجليزية للجملة
        3. تصنيف صعوبة الجملة (easy, medium, hard)
        4. قائمة بالكلمات المكونة للجملة
        
        إرشادات إضافية:
        - استخدم جملًا قصيرة وسهلة النطق
        - تأكد من استخدام مفردات مألوفة للأطفال
        - اجعل الجمل ممتعة وجذابة
        - تأكد من أن الكلمات المستخدمة مناسبة للفئة العمرية
        - استخدم ايموجي معبر ومناسب للفئة
        """

        try:
            # استدعاء نموذج OpenAI
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

            # استخراج المحتوى من الاستجابة
            response_content = response.choices[0].message.content

            try:
                # تحليل الاستجابة JSON
                data = json.loads(response_content)

                # التحقق من صحة البيانات المستلمة
                required_fields = ["id", "title", "description", "icon", "sentences"]
                for field in required_fields:
                    if field not in data:
                        raise ValueError(f"حقل {field} مفقود في البيانات المستلمة")

                # التحقق من صحة كل جملة
                for sentence in data["sentences"]:
                    required_sentence_fields = [
                        "sentence",
                        "translation",
                        "category",
                        "difficulty",
                        "words",
                    ]
                    for field in required_sentence_fields:
                        if field not in sentence:
                            raise ValueError(f"حقل {field} مفقود في بيانات الجملة")

                # إعادة البيانات المنسقة
                return {
                    "success": True,
                    "category": data,
                    "generated_at": datetime.utcnow().isoformat(),
                }

            except json.JSONDecodeError as e:
                print(f"Error parsing JSON response: {str(e)}")
                return {
                    "success": False,
                    "error": "فشل في تحليل استجابة النموذج اللغوي",
                    "generated_at": datetime.utcnow().isoformat(),
                }

        except Exception as e:
            print(f"Error generating sentence category: {str(e)}")
            return {
                "success": False,
                "error": str(e),
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
