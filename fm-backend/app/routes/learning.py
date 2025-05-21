from flask import Blueprint, jsonify, request
from app.models.user import (
    User,
    LearningLevel,
    LearningProgress,
    Lesson,
    CustomSentenceCategory,
)
from app import db
from datetime import datetime
import logging
import json
from app.services.ai_service import AIService

learning_bp = Blueprint("learning", __name__)


@learning_bp.route("/levels", methods=["GET"])
def get_levels():
    """Get all learning levels with progress for the current user"""
    try:
        user_id = request.args.get("user_id", type=int)
        if not user_id:
            return jsonify({"error": "يجب تحديد المستخدم"}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "المستخدم غير موجود"}), 404

        # Get all levels
        levels = LearningLevel.query.order_by(LearningLevel.order).all()

        # Get user's progress for all levels
        progress_map = {
            p.level_id: p
            for p in LearningProgress.query.filter_by(user_id=user_id).all()
        }

        # Prepare response
        response = []
        for level in levels:
            progress = progress_map.get(level.id)
            level_dict = level.to_dict()
            level_dict.update(
                {
                    "progress": progress.progress if progress else 0,
                    "is_locked": progress.is_locked if progress else (level.order > 1),
                }
            )
            response.append(level_dict)

        return jsonify(response)
    except Exception as e:
        print(f"Error in get_levels: {e}")
        return jsonify({"error": "حدث خطأ في الخادم"}), 500


@learning_bp.route("/progress/<int:level_id>", methods=["POST"])
def update_progress(level_id):
    """Update user's progress for a specific level"""
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        progress_value = data.get("progress", 0)

        if not user_id:
            return jsonify({"error": "يجب تحديد المستخدم"}), 400

        # Get or create progress record
        progress = LearningProgress.query.filter_by(
            user_id=user_id, level_id=level_id
        ).first()

        if not progress:
            progress = LearningProgress(
                user_id=user_id,
                level_id=level_id,
                is_locked=(level_id > 1),  # First level is unlocked by default
            )
            db.session.add(progress)

        # Update progress
        progress.progress = progress_value
        progress.last_activity = datetime.utcnow()

        # If level completed (progress = 100%), unlock next level
        if progress_value >= 100:
            progress.completed_at = datetime.utcnow()
            # Update user stats
            user = User.query.get(user_id)
            user.completed_lessons += 1
            user.total_stars += 3  # Award 3 stars for completing a level

            # Unlock next level
            next_level = LearningLevel.query.filter(
                LearningLevel.order > LearningLevel.query.get(level_id).order
            ).first()
            if next_level:
                next_progress = LearningProgress.query.filter_by(
                    user_id=user_id, level_id=next_level.id
                ).first()
                if not next_progress:
                    next_progress = LearningProgress(
                        user_id=user_id, level_id=next_level.id, is_locked=False
                    )
                    db.session.add(next_progress)
                else:
                    next_progress.is_locked = False

        db.session.commit()
        return jsonify(
            {"message": "تم تحديث التقدم بنجاح", "progress": progress.to_dict()}
        )
    except Exception as e:
        print(f"Error in update_progress: {e}")
        db.session.rollback()
        return jsonify({"error": "حدث خطأ في الخادم"}), 500


@learning_bp.route("/initialize/<int:user_id>", methods=["POST"])
def initialize_user_progress(user_id):
    """Initialize progress records for a new user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "المستخدم غير موجود"}), 404

        # Get all levels
        levels = LearningLevel.query.order_by(LearningLevel.order).all()

        # Create progress records for each level
        for level in levels:
            progress = LearningProgress.query.filter_by(
                user_id=user_id, level_id=level.id
            ).first()

            if not progress:
                progress = LearningProgress(
                    user_id=user_id,
                    level_id=level.id,
                    is_locked=(level.order > 1),  # First level is unlocked by default
                )
                db.session.add(progress)

        db.session.commit()
        return jsonify({"message": "تم تهيئة تقدم المستخدم بنجاح"})
    except Exception as e:
        print(f"Error in initialize_user_progress: {e}")
        db.session.rollback()
        return jsonify({"error": "حدث خطأ في الخادم"}), 500


@learning_bp.route("/lessons", methods=["GET"])
def get_lessons():
    """Get all lessons for a specific level with user's progress"""
    try:
        level_id = request.args.get("level_id", type=int)
        user_id = request.args.get("user_id", type=int)

        if not level_id or not user_id:
            return jsonify({"error": "يجب تحديد المستوى والمستخدم"}), 400

        # Get all lessons for the level
        lessons = Lesson.query.filter_by(level_id=level_id).order_by(Lesson.order).all()

        if not lessons:
            return jsonify([])

        # Get user's progress for these lessons
        progress_map = {
            p.lesson_id: p
            for p in LearningProgress.query.filter_by(
                user_id=user_id, level_id=level_id
            ).all()
        }

        # Prepare response
        response = []
        for lesson in lessons:
            progress = progress_map.get(lesson.id)
            lesson_dict = lesson.to_dict()
            lesson_dict.update(
                {
                    "progress": progress.progress if progress else 0,
                    "completed": (
                        progress.completed_at is not None if progress else False
                    ),
                }
            )
            response.append(lesson_dict)

        return jsonify(response)
    except Exception as e:
        print(f"Error in get_lessons: {e}")
        return jsonify({"error": "حدث خطأ في الخادم"}), 500


@learning_bp.route("/lesson/<int:lesson_id>", methods=["GET"])
def get_lesson(lesson_id):
    """Get a specific lesson with user's progress"""
    try:
        user_id = request.args.get("user_id", type=int)
        if not user_id:
            return jsonify({"error": "يجب تحديد المستخدم"}), 400

        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            return jsonify({"error": "الدرس غير موجود"}), 404

        # Get user's progress for this lesson
        progress = LearningProgress.query.filter_by(
            user_id=user_id, lesson_id=lesson_id
        ).first()

        # Prepare response
        lesson_dict = lesson.to_dict()
        lesson_dict.update(
            {
                "progress": progress.progress if progress else 0,
                "completed": progress.completed_at is not None if progress else False,
            }
        )

        return jsonify(lesson_dict)
    except Exception as e:
        print(f"Error in get_lesson: {e}")
        return jsonify({"error": "حدث خطأ في الخادم"}), 500


@learning_bp.route("/generate-section-exercises", methods=["POST"])
def generate_section_exercises():
    """توليد تمارين مخصصة لقسم محدد من أقسام تعلم الجمل"""
    try:
        data = request.json

        if not data:
            return jsonify({"success": False, "message": "البيانات مفقودة"}), 400

        section_title = data.get("section_title")
        section_sentences = data.get("sentences", [])

        if not section_title or not section_sentences or len(section_sentences) < 3:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "يرجى توفير عنوان القسم وعلى الأقل 3 جمل",
                    }
                ),
                400,
            )

        # إنشاء خدمة الذكاء الاصطناعي
        ai_service = AIService()

        # توليد التمارين باستخدام النموذج اللغوي
        result = ai_service.generate_section_exercises(
            section_title=section_title, sentences=section_sentences
        )

        if not result.get("success"):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "فشل في توليد التمارين",
                        "error": result.get("error"),
                    }
                ),
                500,
            )

        return jsonify(result)

    except Exception as e:
        logging.error(f"خطأ في توليد تمارين القسم: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@learning_bp.route("/generate-sentence-category", methods=["POST"])
def generate_sentence_category():
    """إنشاء فئة جديدة من الجمل باستخدام نماذج اللغة الكبيرة (LLM)"""
    try:
        data = request.json

        if not data:
            return jsonify({"success": False, "message": "البيانات مفقودة"}), 400

        # استخراج البيانات من الطلب
        category_name = data.get("category_name")  # اختياري
        difficulty_level = data.get("difficulty_level", "beginner")
        num_sentences = data.get("num_sentences", 5)
        user_id = data.get("user_id")

        if not user_id:
            return (
                jsonify({"success": False, "message": "يجب تحديد هوية المستخدم"}),
                400,
            )

        # التحقق من صحة البيانات
        if num_sentences < 3 or num_sentences > 10:
            return (
                jsonify(
                    {"success": False, "message": "عدد الجمل يجب أن يكون بين 3 و 10"}
                ),
                400,
            )

        # إنشاء خدمة الذكاء الاصطناعي
        ai_service = AIService()

        # توليد فئة الجمل باستخدام النموذج اللغوي
        result = ai_service.generate_sentence_category(
            category_name=category_name,
            difficulty_level=difficulty_level,
            num_sentences=num_sentences,
        )

        if not result["success"]:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": result.get("error", "حدث خطأ أثناء إنشاء فئة الجمل"),
                    }
                ),
                500,
            )

        # حفظ الفئة في قاعدة البيانات
        category_data = result["category"]

        # فحص إذا كانت الفئة موجودة مسبقًا
        existing_category = CustomSentenceCategory.query.filter_by(
            user_id=user_id, category_id=category_data["id"]
        ).first()

        if existing_category:
            # تحديث الفئة الموجودة
            existing_category.title = category_data["title"]
            existing_category.description = category_data["description"]
            existing_category.icon = category_data["icon"]
            existing_category.content = json.dumps(category_data["sentences"])
        else:
            # إنشاء فئة جديدة
            new_category = CustomSentenceCategory(
                user_id=user_id,
                category_id=category_data["id"],
                title=category_data["title"],
                description=category_data["description"],
                icon=category_data["icon"],
                content=json.dumps(category_data["sentences"]),
            )
            db.session.add(new_category)

        db.session.commit()

        # إعادة البيانات للمستخدم
        return jsonify(result), 200

    except Exception as e:
        print(f"Error in generate_sentence_category: {str(e)}")
        db.session.rollback()
        return (
            jsonify({"success": False, "message": f"حدث خطأ في الخادم: {str(e)}"}),
            500,
        )


@learning_bp.route("/custom-sentence-categories/<int:user_id>", methods=["GET"])
def get_custom_sentence_categories(user_id):
    """الحصول على فئات الجمل المخصصة للمستخدم"""
    try:
        # التحقق من وجود المستخدم
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "المستخدم غير موجود"}), 404

        # استرجاع فئات الجمل المخصصة
        categories = CustomSentenceCategory.query.filter_by(user_id=user_id).all()

        # تحويل الفئات إلى قائمة من القواميس
        categories_list = [category.to_dict() for category in categories]

        return jsonify({"success": True, "categories": categories_list}), 200

    except Exception as e:
        print(f"Error in get_custom_sentence_categories: {str(e)}")
        return (
            jsonify({"success": False, "message": f"حدث خطأ في الخادم: {str(e)}"}),
            500,
        )
