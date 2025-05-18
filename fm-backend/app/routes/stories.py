from flask import Blueprint, request, jsonify
from app.models.user import User, SpeechErrorRecord, SpeechActivity, AIGeneratedStory
from app.db import db
from app.services.ai_service import AIService
from sqlalchemy import func
import datetime
import logging
import traceback
import json
import re
import random

logger = logging.getLogger(__name__)
stories_bp = Blueprint("stories", __name__)

# قائمة بحروف الجر والكلمات غير المهمة باللغة العربية
ARABIC_STOPWORDS = [
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


# دالة للتحقق من أن الكلمة ليست علامة ترقيم
def is_valid_word(word):
    # إزالة الفراغات
    word = word.strip()

    # التحقق من أن الكلمة ليست فارغة
    if not word:
        return False

    # التحقق من أن الكلمة ليست علامة ترقيم
    if re.match(r'^[،.؟!:؛""' "()[\]{}…—–-]+$", word):
        return False

    # التحقق من أن الكلمة ليست من حروف الجر أو الكلمات غير المهمة
    if word in ARABIC_STOPWORDS:
        return False

    # التحقق من أن طول الكلمة مناسب (أكثر من حرفين)
    if len(word) <= 2:
        return False

    return True


@stories_bp.route("/generate/<int:user_id>", methods=["POST"])
def generate_story(user_id):
    """
    إنشاء قصة مخصصة بناءً على أخطاء النطق السابقة للمستخدم
    """
    try:
        # التحقق من وجود المستخدم
        user = User.query.get(user_id)
        if not user:
            return (
                jsonify({"success": False, "message": "لم يتم العثور على المستخدم"}),
                404,
            )

        # استخراج معلمات الطلب
        data = request.json or {}
        theme = data.get("theme")  # موضوع القصة (اختياري)
        age_group = data.get("age_group", "children")
        difficulty = data.get("difficulty", "intermediate")
        length = data.get("length", "short")
        error_limit = data.get(
            "error_limit", 15
        )  # زيادة الحد لضمان الحصول على كلمات كافية بعد التصفية

        # الحصول على أخطاء النطق للمستخدم
        speech_errors = (
            db.session.query(
                SpeechErrorRecord.original_word,
                SpeechErrorRecord.error_category,
                func.count(SpeechErrorRecord.id).label("error_count"),
            )
            .filter_by(user_id=user_id)
            .group_by(SpeechErrorRecord.original_word, SpeechErrorRecord.error_category)
            .order_by(func.count(SpeechErrorRecord.id).desc())
            .limit(
                error_limit * 2
            )  # ضاعف الحد لضمان وجود عدد كافٍ من الكلمات بعد الفلترة
            .all()
        )

        # تصفية الكلمات الصالحة فقط
        filtered_errors = []
        for error in speech_errors:
            if is_valid_word(error.original_word):
                filtered_errors.append(error)

        # إذا كان لدينا أقل من 5 كلمات، استخدم بعض الكلمات من أنشطة النطق السابقة
        if len(filtered_errors) < 5:
            recent_activities = (
                SpeechActivity.query.filter_by(user_id=user_id)
                .order_by(SpeechActivity.created_at.desc())
                .limit(5)
                .all()
            )

            sample_words = set()  # استخدام مجموعة لتجنب التكرار
            for activity in recent_activities:
                if activity.original_text:
                    words = activity.original_text.split()
                    for word in words:
                        if is_valid_word(word) and word not in sample_words:
                            sample_words.add(word)

            # إنشاء كائنات شبيهة بأخطاء النطق من الكلمات العينة
            for word in sample_words:
                sample_error = type(
                    "obj",
                    (object,),
                    {
                        "original_word": word,
                        "error_category": "general",
                        "error_count": 1,
                    },
                )
                filtered_errors.append(sample_error)

        # اختيار عشوائي للكلمات من القائمة المصفاة
        # وضمان أننا لا نستخدم أكثر من error_limit
        if len(filtered_errors) > error_limit:
            selected_errors = random.sample(
                filtered_errors, min(error_limit, len(filtered_errors))
            )
        else:
            selected_errors = filtered_errors

        # مزج الترتيب للتأكد من أن الكلمات مختلفة في كل مرة
        random.shuffle(selected_errors)

        # تحضير بيانات الأخطاء للإرسال إلى خدمة الذكاء الاصطناعي
        error_words = [
            {
                "word": error.original_word,
                "category": error.error_category,
                "count": error.error_count,
            }
            for error in selected_errors
        ]

        # إذا لم نجد أي كلمات صالحة، استخدم كلمات افتراضية للتدريب
        if not error_words:
            default_words = ["مدرسة", "كتاب", "قلم", "طالب", "معلم"]
            error_words = [
                {"word": word, "category": "default", "count": 1}
                for word in default_words
            ]

        # إنشاء قصة باستخدام OpenAI
        ai_service = AIService()
        result = ai_service.generate_story(
            error_words=error_words,
            theme=theme,
            age_group=age_group,
            difficulty=difficulty,
            length=length,
        )

        if not result.get("success"):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "فشل في إنشاء القصة",
                        "error": result.get("error"),
                    }
                ),
                500,
            )

        # إضافة معلومات المستخدم والأخطاء إلى النتيجة
        result["user_id"] = user_id
        result["target_errors"] = error_words

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error generating story: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@stories_bp.route("/exercises/<int:user_id>", methods=["POST"])
def generate_exercises(user_id):
    """
    إنشاء تمارين مخصصة للتدريب على النطق بناءً على أخطاء المستخدم
    """
    try:
        # التحقق من وجود المستخدم
        user = User.query.get(user_id)
        if not user:
            return (
                jsonify({"success": False, "message": "لم يتم العثور على المستخدم"}),
                404,
            )

        # استخراج معلمات الطلب
        data = request.json or {}
        count = data.get("count", 5)  # عدد التمارين
        error_limit = data.get(
            "error_limit", 15
        )  # زيادة الحد لضمان الحصول على كلمات كافية بعد التصفية

        # الحصول على أخطاء النطق للمستخدم
        speech_errors = (
            db.session.query(
                SpeechErrorRecord.original_word,
                SpeechErrorRecord.error_category,
                func.count(SpeechErrorRecord.id).label("error_count"),
            )
            .filter_by(user_id=user_id)
            .group_by(SpeechErrorRecord.original_word, SpeechErrorRecord.error_category)
            .order_by(func.count(SpeechErrorRecord.id).desc())
            .limit(
                error_limit * 2
            )  # ضاعف الحد لضمان وجود عدد كافٍ من الكلمات بعد الفلترة
            .all()
        )

        # تصفية الكلمات الصالحة فقط
        filtered_errors = []
        for error in speech_errors:
            if is_valid_word(error.original_word):
                filtered_errors.append(error)

        if not filtered_errors:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "لم يتم العثور على أخطاء نطق مناسبة لهذا المستخدم",
                    }
                ),
                404,
            )

        # اختيار عشوائي للكلمات من القائمة المصفاة
        if len(filtered_errors) > count:
            selected_errors = random.sample(
                filtered_errors, min(count, len(filtered_errors))
            )
        else:
            selected_errors = filtered_errors

        # مزج الترتيب للتأكد من أن الكلمات مختلفة في كل مرة
        random.shuffle(selected_errors)

        # تحضير بيانات الأخطاء للإرسال إلى خدمة الذكاء الاصطناعي
        error_words = [error.original_word for error in selected_errors]
        error_categories = [error.error_category for error in selected_errors]

        # إنشاء تمارين باستخدام OpenAI
        ai_service = AIService()
        result = ai_service.generate_practice_exercises(
            error_words=error_words, error_categories=error_categories, count=count
        )

        if not result.get("success"):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "فشل في إنشاء التمارين",
                        "error": result.get("error"),
                    }
                ),
                500,
            )

        # إضافة معلومات المستخدم والأخطاء إلى النتيجة
        result["user_id"] = user_id

        # parsed_exercises الآن يتم إرجاعها مباشرة من ai_service
        # فلا حاجة لإعادة تحليل exercises_text

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error generating exercises: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@stories_bp.route("/save/<int:user_id>", methods=["POST"])
def save_ai_story(user_id):
    """
    حفظ قصة مولدة بواسطة الذكاء الاصطناعي في قاعدة البيانات
    """
    try:
        # التحقق من وجود المستخدم
        user = User.query.get(user_id)
        if not user:
            return (
                jsonify({"success": False, "message": "لم يتم العثور على المستخدم"}),
                404,
            )

        # استلام بيانات القصة
        data = request.json or {}

        if not data.get("story"):
            return jsonify({"success": False, "message": "بيانات القصة مفقودة"}), 400

        story_data = data.get("story", {})

        # استخراج البيانات اللازمة
        title = story_data.get("theme", "قصة بدون عنوان")
        content = story_data.get("text", "")
        highlighted_content = story_data.get("highlighted_text", "")
        theme = story_data.get("theme", "")
        metadata = story_data.get("metadata", {})
        difficulty = metadata.get("difficulty", "intermediate")
        age_group = metadata.get("age_group", "children")
        target_words = json.dumps(story_data.get("target_words", []))

        vocabulary = json.dumps(data.get("vocabulary", []))
        questions = json.dumps(data.get("questions", []))
        moral = data.get("moral", "")

        # إنشاء سجل القصة الجديد
        ai_story = AIGeneratedStory(
            user_id=user_id,
            title=title,
            content=content,
            highlighted_content=highlighted_content,
            theme=theme,
            difficulty=difficulty,
            age_group=age_group,
            target_words=target_words,
            vocabulary=vocabulary,
            questions=questions,
            moral=moral,
        )

        db.session.add(ai_story)
        db.session.commit()

        return jsonify(
            {"success": True, "message": "تم حفظ القصة بنجاح", "story_id": ai_story.id}
        )

    except Exception as e:
        logger.error(f"Error saving AI story: {str(e)}")
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@stories_bp.route("/ai-stories/<int:user_id>", methods=["GET"])
def get_ai_stories(user_id):
    """
    الحصول على جميع القصص المولدة بواسطة الذكاء الاصطناعي للمستخدم
    """
    try:
        # التحقق من وجود المستخدم
        user = User.query.get(user_id)
        if not user:
            return (
                jsonify({"success": False, "message": "لم يتم العثور على المستخدم"}),
                404,
            )

        # الحصول على القصص
        stories = (
            AIGeneratedStory.query.filter_by(user_id=user_id)
            .order_by(AIGeneratedStory.created_at.desc())
            .all()
        )

        # تحويل القصص إلى تنسيق متوافق مع الواجهة الأمامية
        stories_data = [story.to_story_response() for story in stories]

        return jsonify({"success": True, "stories": stories_data})

    except Exception as e:
        logger.error(f"Error retrieving AI stories: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@stories_bp.route("/ai-story/<int:story_id>", methods=["GET"])
def get_ai_story(story_id):
    """
    الحصول على قصة محددة مولدة بواسطة الذكاء الاصطناعي
    """
    try:
        # البحث عن القصة
        story = AIGeneratedStory.query.get(story_id)
        if not story:
            return (
                jsonify({"success": False, "message": "لم يتم العثور على القصة"}),
                404,
            )

        # تحويل القصة إلى تنسيق متوافق مع الواجهة الأمامية
        story_data = story.to_story_response()

        return jsonify(story_data)

    except Exception as e:
        logger.error(f"Error retrieving AI story: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@stories_bp.route("/ai-story/<int:story_id>", methods=["DELETE"])
def delete_ai_story(story_id):
    """
    حذف قصة مولدة بواسطة الذكاء الاصطناعي
    """
    try:
        # البحث عن القصة
        story = AIGeneratedStory.query.get(story_id)
        if not story:
            return (
                jsonify({"success": False, "message": "لم يتم العثور على القصة"}),
                404,
            )

        # حذف القصة
        db.session.delete(story)
        db.session.commit()

        return jsonify({"success": True, "message": "تم حذف القصة بنجاح"})

    except Exception as e:
        logger.error(f"Error deleting AI story: {str(e)}")
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@stories_bp.route("/history/<int:user_id>", methods=["GET"])
def get_story_history(user_id):
    """
    الحصول على تاريخ القصص المنشأة للمستخدم
    """
    # تحويل المسار للمسار الجديد
    return get_ai_stories(user_id)
