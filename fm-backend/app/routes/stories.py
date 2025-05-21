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
import threading

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
    if re.match(r'^[،.؟!:؛"""\'()\[\]{}…—–-]+$', word):
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

        # التحقق من وجود كلمات مخصصة في الطلب
        custom_words = data.get("custom_words")

        if custom_words and isinstance(custom_words, list) and len(custom_words) > 0:
            # استخدام الكلمات المخصصة التي تم اختيارها من قبل المستخدم
            error_words = custom_words
            logger.info(f"Using {len(error_words)} custom words for story generation")
        else:
            # الحصول على أخطاء النطق للمستخدم
            speech_errors = (
                db.session.query(
                    SpeechErrorRecord.original_word,
                    SpeechErrorRecord.error_category,
                    func.count(SpeechErrorRecord.id).label("error_count"),
                )
                .filter_by(user_id=user_id)
                .group_by(
                    SpeechErrorRecord.original_word, SpeechErrorRecord.error_category
                )
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

        # التحقق من وجود كلمات مخصصة في الطلب
        custom_words = data.get("custom_words")

        if custom_words and isinstance(custom_words, list) and len(custom_words) > 0:
            # استخدام الكلمات المخصصة التي تم اختيارها من قبل المستخدم
            # سننشئ filtered_errors في شكل كائنات متوافقة مع الواجهة التي نستخدمها
            filtered_errors = [
                type(
                    "obj",
                    (object,),
                    {
                        "original_word": word["word"],
                        "error_category": word["category"],
                        "error_count": word["count"],
                    },
                )
                for word in custom_words
            ]
            logger.info(
                f"Using {len(filtered_errors)} custom words for exercises generation"
            )
        else:
            # الحصول على أخطاء النطق للمستخدم
            speech_errors = (
                db.session.query(
                    SpeechErrorRecord.original_word,
                    SpeechErrorRecord.error_category,
                    func.count(SpeechErrorRecord.id).label("error_count"),
                )
                .filter_by(user_id=user_id)
                .group_by(
                    SpeechErrorRecord.original_word, SpeechErrorRecord.error_category
                )
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
def save_story(user_id):
    """حفظ قصة للمستخدم"""
    try:
        data = request.json

        # التحقق من وجود البيانات اللازمة
        if not data or not data.get("story") or not data.get("story").get("text"):
            return jsonify({"success": False, "message": "البيانات غير كاملة"}), 400

        # التحقق من وجود المستخدم
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "المستخدم غير موجود"}), 404

        # تحضير بيانات القصة
        story_data = data.get("story", {})

        # تحويل البيانات من JSON إلى نصوص لتخزينها في قاعدة البيانات
        target_words_json = json.dumps(story_data.get("target_words", []))
        vocabulary_json = json.dumps(data.get("vocabulary", []))
        questions_json = json.dumps(data.get("questions", []))

        # تحديد مستوى الصعوبة
        difficulty = story_data.get("metadata", {}).get("difficulty", "intermediate")
        age_group = story_data.get("metadata", {}).get("age_group", "")

        # إنشاء كائن القصة
        story = AIGeneratedStory(
            user_id=user_id,
            title=story_data.get("theme", "قصة جديدة"),
            content=story_data.get("text"),
            highlighted_content=story_data.get(
                "highlighted_text", story_data.get("text")
            ),
            theme=story_data.get("theme", "قصة جديدة"),
            difficulty=difficulty,
            age_group=age_group,
            target_words=target_words_json,
            vocabulary=vocabulary_json,
            questions=questions_json,
            moral=data.get("moral", ""),
            images_generated=False,  # القصة لم تنشأ لها صور بعد
        )

        # حفظ القصة في قاعدة البيانات
        db.session.add(story)
        db.session.commit()

        # بدء عملية إنشاء الصور في الخلفية (استدعاء غير متزامن)
        # يمكن استخدام Celery أو طرق أخرى للعمليات الخلفية، لكن هنا سنستخدم طريقة بسيطة
        try:
            # استدعاء خدمة إنشاء الصور بشكل مباشر
            ai_service = AIService()
            # اختيار نمط الصور بناءً على الفئة العمرية والصعوبة
            image_style = "cartoon"  # افتراضي للأطفال
            if difficulty == "advanced":
                image_style = "realistic"

            # إنشاء الصور (هذا سيحدث بعد الاستجابة للطلب)
            threading.Thread(
                target=ai_service.generate_story_images, args=(story.id, image_style)
            ).start()
        except Exception as img_error:
            logger.error(f"تعذر بدء عملية إنشاء الصور: {str(img_error)}")
            # نواصل بدون إنشاء صور في حالة الخطأ

        return jsonify(
            {"success": True, "message": "تم حفظ القصة بنجاح", "story_id": story.id}
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"خطأ في حفظ القصة: {str(e)}")
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
    """الحصول على قصة واحدة مولدة بواسطة الذكاء الاصطناعي"""
    try:
        # البحث عن القصة
        story = AIGeneratedStory.query.get(story_id)
        if not story:
            return jsonify({"success": False, "message": "القصة غير موجودة"}), 404

        # تحويل القصة إلى الصيغة المطلوبة
        response_data = story.to_story_response()

        # إضافة معلومات الصور تلقائيًا
        response_data["images"] = [img.to_dict() for img in story.images]
        response_data["images_generated"] = story.images_generated

        return jsonify(response_data)
    except Exception as e:
        logger.error(f"Error retrieving AI story: {str(e)}")
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


@stories_bp.route("/generate-images/<int:story_id>", methods=["POST"])
def generate_story_images(story_id):
    """توليد صور للقصة"""
    try:
        data = request.json or {}
        image_style = data.get("style", "cartoon")

        # الاستعلام عن القصة للتأكد من وجودها
        story = AIGeneratedStory.query.get(story_id)
        if not story:
            return jsonify({"success": False, "message": "القصة غير موجودة"}), 404

        # استدعاء خدمة الذكاء الاصطناعي لتوليد الصور
        ai_service = AIService()
        result = ai_service.generate_story_images(story_id, image_style)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        logger.error(f"Error generating images for story: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@stories_bp.route("/target-words/<int:user_id>", methods=["GET"])
def get_target_words(user_id):
    """
    الحصول على الكلمات المستهدفة للمستخدم استنادًا إلى أخطاء النطق السابقة
    """
    try:
        # التحقق من وجود المستخدم
        user = User.query.get(user_id)
        if not user:
            return (
                jsonify({"success": False, "message": "لم يتم العثور على المستخدم"}),
                404,
            )

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
            .limit(30)  # زيادة الحد لضمان وجود عدد كافٍ من الكلمات بعد الفلترة
            .all()
        )

        # تصفية الكلمات الصالحة فقط
        filtered_errors = []
        for error in speech_errors:
            if is_valid_word(error.original_word):
                filtered_errors.append(
                    {
                        "word": error.original_word,
                        "category": error.error_category,
                        "count": error.error_count,
                    }
                )

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
                        if (
                            is_valid_word(word)
                            and word not in [e["word"] for e in filtered_errors]
                            and word not in sample_words
                        ):
                            sample_words.add(word)
                            filtered_errors.append(
                                {
                                    "word": word,
                                    "category": "general",
                                    "count": 1,
                                }
                            )

        # إذا لم نجد أي كلمات صالحة، استخدم كلمات افتراضية للتدريب
        if not filtered_errors:
            default_words = [
                "مدرسة",
                "كتاب",
                "قلم",
                "طالب",
                "معلم",
                "حديقة",
                "منزل",
                "سيارة",
                "طريق",
                "صديق",
            ]
            filtered_errors = [
                {"word": word, "category": "default", "count": 1}
                for word in default_words
            ]

        return jsonify({"success": True, "words": filtered_errors})

    except Exception as e:
        logger.error(f"Error fetching target words: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
