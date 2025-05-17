from flask import Blueprint, jsonify, request
from app.models.user import User, LearningLevel, LearningProgress, Lesson
from app import db
from datetime import datetime

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
