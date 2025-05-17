from flask import Blueprint, request, jsonify
from app.models.user import User, SpeechErrorRecord, SpeechActivity
from app.db import db
from app.services.ai_service import AIService
from sqlalchemy import func
import datetime
import logging
import traceback

logger = logging.getLogger(__name__)
stories_bp = Blueprint("stories", __name__)


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
        error_limit = data.get("error_limit", 5)  # عدد الأخطاء التي سيتم التركيز عليها

        # الحصول على أكثر أخطاء النطق شيوعًا للمستخدم
        common_errors = (
            db.session.query(
                SpeechErrorRecord.original_word,
                SpeechErrorRecord.error_category,
                func.count(SpeechErrorRecord.id).label("error_count"),
            )
            .filter_by(user_id=user_id)
            .group_by(SpeechErrorRecord.original_word, SpeechErrorRecord.error_category)
            .order_by(func.count(SpeechErrorRecord.id).desc())
            .limit(error_limit)
            .all()
        )

        # إذا لم يكن هناك أخطاء، استخدام الكلمات من الأنشطة السابقة
        if not common_errors:
            # الحصول على بعض الكلمات من أنشطة النطق السابقة كبديل
            recent_activities = (
                SpeechActivity.query.filter_by(user_id=user_id)
                .order_by(SpeechActivity.created_at.desc())
                .limit(3)
                .all()
            )

            sample_words = []
            for activity in recent_activities:
                if activity.original_text:
                    # أخذ بعض الكلمات من النص الأصلي
                    words = activity.original_text.split()
                    # اختيار كلمات عشوائية من النص
                    import random

                    sample_words.extend(random.sample(words, min(5, len(words))))

            # إزالة التكرار
            sample_words = list(set(sample_words))[:error_limit]

            # تنسيق البيانات بنفس هيكل common_errors
            common_errors = [
                type(
                    "obj",
                    (object,),
                    {
                        "original_word": word,
                        "error_category": "general",
                        "error_count": 1,
                    },
                )
                for word in sample_words
            ]

        # تحضير بيانات الأخطاء للإرسال إلى خدمة الذكاء الاصطناعي
        error_words = [
            {
                "word": error.original_word,
                "category": error.error_category,
                "count": error.error_count,
            }
            for error in common_errors
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
        error_limit = data.get("error_limit", 5)  # عدد الأخطاء التي سيتم التركيز عليها

        # الحصول على أكثر أخطاء النطق شيوعًا للمستخدم
        common_errors = (
            db.session.query(
                SpeechErrorRecord.original_word,
                SpeechErrorRecord.error_category,
                func.count(SpeechErrorRecord.id).label("error_count"),
            )
            .filter_by(user_id=user_id)
            .group_by(SpeechErrorRecord.original_word, SpeechErrorRecord.error_category)
            .order_by(func.count(SpeechErrorRecord.id).desc())
            .limit(error_limit)
            .all()
        )

        if not common_errors:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "لم يتم العثور على أخطاء نطق لهذا المستخدم",
                    }
                ),
                404,
            )

        # تحضير بيانات الأخطاء للإرسال إلى خدمة الذكاء الاصطناعي
        error_words = [error.original_word for error in common_errors]
        error_categories = [error.error_category for error in common_errors]

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

        # إعادة تنسيق النتيجة للعرض في الواجهة
        exercise_text = result.get("exercises", "")
        exercises = []

        # تقسيم النص إلى تمارين فردية
        import re

        exercise_blocks = re.split(r"\n\s*\d+[\.\)]\s*", "\n" + exercise_text)
        if len(exercise_blocks) > 1:
            exercise_blocks = exercise_blocks[1:]  # تخطي الكتلة الأولى الفارغة

            for i, block in enumerate(exercise_blocks):
                parts = block.strip().split("\n")
                if parts:
                    exercise = {
                        "id": i + 1,
                        "sentence": parts[0].strip(),
                        "tip": parts[1].strip() if len(parts) > 1 else "",
                        "drill": parts[2].strip() if len(parts) > 2 else "",
                    }
                    exercises.append(exercise)

        result["parsed_exercises"] = exercises

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error generating exercises: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@stories_bp.route("/history/<int:user_id>", methods=["GET"])
def get_story_history(user_id):
    """
    الحصول على تاريخ القصص المنشأة للمستخدم
    (يجب تنفيذها إذا تم تخزين القصص في قاعدة البيانات)
    """
    # هذه دالة وهمية حاليًا، يجب تنفيذها إذا تم إضافة تخزين القصص إلى قاعدة البيانات
    return jsonify(
        {
            "success": True,
            "message": "تم طلب تاريخ القصص للمستخدم. هذه الميزة غير منفذة بعد.",
            "user_id": user_id,
        }
    )
