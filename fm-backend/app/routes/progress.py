from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import json
from app.models.user import User, LearningLevel, Lesson, LearningProgress
from app.db import db
import traceback
import logging

logger = logging.getLogger(__name__)
progress_bp = Blueprint("progress", __name__)


@progress_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_progress(user_id):
    """الحصول على تقدم المستخدم في جميع الدروس والمستويات"""
    logger.info(f"Fetching progress for user {user_id}")

    try:
        # التحقق من وجود المستخدم
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "المستخدم غير موجود"}), 404

        # جلب جميع المستويات للتنظيم
        levels = LearningLevel.query.order_by(LearningLevel.order).all()

        # تجهيز القالب الأساسي للنتيجة
        result = []
        for level in levels:
            # جلب تقدم المستوى (إذا وجد)
            level_progress = LearningProgress.query.filter_by(
                user_id=user_id, level_id=level.id, lesson_id=None
            ).first()

            # إذا لم يكن هناك تقدم، قم بإنشاء واحد جديد
            if not level_progress:
                logger.warning(
                    f"No progress found for user {user_id} in level {level.id}, creating new progress"
                )
                level_progress = LearningProgress(
                    user_id=user_id,
                    level_id=level.id,
                    lesson_id=None,
                    is_locked=level.order != 1,  # فقط المستوى الأول مفتوح
                    progress=0.0,  # Always start with 0%
                    learned_items="{}",
                    is_completed=False,
                    completed_at=None,
                    last_activity=datetime.utcnow(),
                )
                db.session.add(level_progress)
                try:
                    db.session.commit()
                    logger.info(
                        f"Created new progress for user {user_id} in level {level.id}"
                    )
                except Exception as e:
                    logger.error(f"Error creating progress: {str(e)}")
                    db.session.rollback()
                    return jsonify({"error": "Error creating progress"}), 500

            # Verify progress value
            if level_progress.progress is None:
                level_progress.progress = 0.0
                db.session.commit()

            level_data = {
                "level_id": level.id,
                "level_title": level.title,
                "level_progress": level_progress.progress,
                "is_locked": level_progress.is_locked,
                "is_completed": level_progress.is_completed,
                "completed_at": (
                    level_progress.completed_at.isoformat()
                    if level_progress and level_progress.completed_at
                    else None
                ),
                "learned_items": (
                    json.loads(level_progress.learned_items)
                    if level_progress and level_progress.learned_items
                    else {}
                ),
                "lessons": [],
            }

            # Log the level progress being returned
            logger.info(
                f"Level {level.id} progress for user {user_id}: {level_progress.progress}%"
            )

            # جلب دروس المستوى
            lessons = (
                Lesson.query.filter_by(level_id=level.id).order_by(Lesson.order).all()
            )

            # جلب تقدم كل درس
            for lesson in lessons:
                lesson_progress = LearningProgress.query.filter_by(
                    user_id=user_id, level_id=level.id, lesson_id=lesson.id
                ).first()

                if not lesson_progress:
                    lesson_progress = LearningProgress(
                        user_id=user_id,
                        level_id=level.id,
                        lesson_id=lesson.id,
                        is_locked=level.order != 1,
                        progress=0.0,
                        learned_items="{}",
                        is_completed=False,
                        completed_at=None,
                        last_activity=datetime.utcnow(),
                    )
                    db.session.add(lesson_progress)
                    db.session.commit()

                lesson_data = {
                    "lesson_id": lesson.id,
                    "lesson_title": lesson.title,
                    "progress": lesson_progress.progress if lesson_progress else 0,
                    "current_step": (
                        lesson_progress.current_step if lesson_progress else 0
                    ),
                    "total_steps": (
                        lesson_progress.total_steps if lesson_progress else 1
                    ),
                    "is_completed": (
                        lesson_progress.is_completed if lesson_progress else False
                    ),
                    "completed_at": (
                        lesson_progress.completed_at.isoformat()
                        if lesson_progress and lesson_progress.completed_at
                        else None
                    ),
                }

                if lesson_progress and lesson_progress.last_position:
                    try:
                        lesson_data["last_position"] = json.loads(
                            lesson_progress.last_position
                        )
                    except:
                        lesson_data["last_position"] = {}

                level_data["lessons"].append(lesson_data)

            result.append(level_data)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error in get_user_progress: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"حدث خطأ أثناء جلب التقدم: {str(e)}"}), 500


@progress_bp.route("/update", methods=["POST", "OPTIONS"])
def update_progress():
    """Update user progress with support for CORS preflight"""
    if request.method == "OPTIONS":
        # Handle CORS preflight request
        response = current_app.make_default_options_response()
        return response

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Missing progress data"}), 400

        user_id = data.get("user_id")
        level_id = data.get("level_id")
        progress_value = data.get("progress", 0)
        completed = data.get("completed", False)
        unlock_next_level = data.get("unlock_next_level", False)
        learned_items = data.get("learned_items", {})

        if not user_id or not level_id:
            return jsonify({"error": "Missing required fields"}), 400

        # Get user and their progress
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get or create level progress
        progress = LearningProgress.query.filter_by(
            user_id=user_id, level_id=level_id, lesson_id=None
        ).first()

        if not progress:
            # Create new progress record
            progress = LearningProgress(
                user_id=user_id,
                level_id=level_id,
                lesson_id=None,
                is_locked=False,
                progress=0,
                learned_items="{}",
                is_completed=False,
                completed_at=None,
            )
            db.session.add(progress)

        # Update progress
        progress.progress = progress_value
        progress.is_completed = completed
        progress.last_activity = datetime.utcnow()

        # Save learned items
        if learned_items:
            progress.learned_items = json.dumps(learned_items)

        # Handle completion
        if completed and not progress.completed_at:
            progress.completed_at = datetime.utcnow()

            # Update user achievements
            completed_levels = LearningProgress.query.filter_by(
                user_id=user_id, is_completed=True, lesson_id=None
            ).count()

            # Update user stats
            user.completed_lessons = completed_levels
            user.total_stars = completed_levels * 3  # 3 stars per level

            # Update streak
            last_activity = user.last_login or user.created_at
            if last_activity:
                time_diff = datetime.utcnow() - last_activity
                if time_diff.days <= 1:  # Within 24 hours
                    user.streak_days = (user.streak_days or 0) + 1
                else:
                    user.streak_days = 1
            else:
                user.streak_days = 1

            # Unlock next level if requested
            if unlock_next_level:
                next_level = LearningLevel.query.filter(
                    LearningLevel.order == LearningLevel.query.get(level_id).order + 1
                ).first()

                if next_level:
                    next_progress = LearningProgress.query.filter_by(
                        user_id=user_id, level_id=next_level.id, lesson_id=None
                    ).first()

                    if next_progress:
                        next_progress.is_locked = False
                    else:
                        next_progress = LearningProgress(
                            user_id=user_id,
                            level_id=next_level.id,
                            lesson_id=None,
                            is_locked=False,
                            progress=0,
                            learned_items="{}",
                            is_completed=False,
                        )
                        db.session.add(next_progress)

        # Save all changes
        db.session.commit()

        # Return updated user data
        return jsonify(
            {
                "success": True,
                "data": {
                    "user": user.to_dict(),
                    "progress": {
                        "level_id": level_id,
                        "progress": progress_value,
                        "is_completed": completed,
                        "completed_at": (
                            progress.completed_at.isoformat()
                            if progress.completed_at
                            else None
                        ),
                        "learned_items": learned_items,
                    },
                },
            }
        )

    except Exception as e:
        print(f"ERROR in update_progress: {str(e)}")
        traceback.print_exc()
        current_app.logger.error(f"Error updating progress: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to update progress"}), 500
