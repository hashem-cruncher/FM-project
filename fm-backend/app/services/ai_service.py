import openai
import os
import json
import random
from datetime import datetime


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
        سيطلب منك إنشاء قصة قصيرة تتضمن كلمات محددة يجب أن تظهر بشكل طبيعي في السياق.
        يجب أن تكون القصة مناسبة للأطفال وجذابة وتعليمية.
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
            )

            # استخراج القصة من الاستجابة
            story_text = response.choices[0].message.content

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
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    def _highlight_target_words(self, text, target_words):
        """
        تمييز الكلمات المستهدفة في النص
        إضافة علامات HTML لتمييز الكلمات (<mark>الكلمة</mark>)
        """
        highlighted_text = text

        for word in target_words:
            # استخدام علامات منتظمة للعثور على الكلمة كاملة
            highlighted_text = highlighted_text.replace(
                f" {word} ", f" <mark>{word}</mark> "
            )
            # حالة بداية الجملة
            highlighted_text = highlighted_text.replace(
                f"{word} ", f"<mark>{word}</mark> "
            )
            # حالة نهاية الجملة
            highlighted_text = highlighted_text.replace(
                f" {word}.", f" <mark>{word}</mark>."
            )
            highlighted_text = highlighted_text.replace(
                f" {word}،", f" <mark>{word}</mark>،"
            )
            highlighted_text = highlighted_text.replace(
                f" {word}!", f" <mark>{word}</mark>!"
            )
            highlighted_text = highlighted_text.replace(
                f" {word}؟", f" <mark>{word}</mark>؟"
            )
            highlighted_text = highlighted_text.replace(
                f" {word}:", f" <mark>{word}</mark>:"
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
        """

        try:
            # Use the updated OpenAI client
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=1000,
            )

            exercises_text = response.choices[0].message.content

            return {
                "success": True,
                "exercises": exercises_text,
                "generated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            return {"success": False, "error": str(e)}
