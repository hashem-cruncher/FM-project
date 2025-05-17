from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import json
from app.models.user import User, LearningLevel, Lesson, LearningProgress
from app.db import db
import traceback
import logging

logger = logging.getLogger(__name__)
progress_bp = Blueprint("progress", __name__, url_prefix="/api/progress")


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


@progress_bp.route("/update", methods=["POST"])
def update_progress():
    """Update user's progress for a specific level"""
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "Missing data"}), 400

        user_id = data.get("user_id")
        level_id = data.get("level_id")
        progress_value = data.get("progress", 0)
        completed = data.get("completed", False)
        unlock_next_level = data.get("unlock_next_level", False)
        learned_items = data.get("learned_items")

        if not user_id or not level_id:
            return (
                jsonify({"success": False, "message": "Missing required fields"}),
                400,
            )

        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Get the level progress record
        level_progress = LearningProgress.query.filter_by(
            user_id=user_id,
            level_id=level_id,
            lesson_id=None,  # Level record has no lesson_id
        ).first()

        # If no record exists, create one
        if not level_progress:
            level_progress = LearningProgress(
                user_id=user_id,
                level_id=level_id,
                lesson_id=None,
                progress=0,
                is_locked=False,  # Assuming this is unlocked since we're updating it
            )
            db.session.add(level_progress)

        # Update progress
        level_progress.progress = progress_value

        # Mark as completed if specified
        if completed:
            level_progress.is_completed = True
            level_progress.completed_at = datetime.utcnow()

        # Store learned items if provided
        if learned_items is not None:
            if isinstance(learned_items, dict):
                level_progress.learned_items = json.dumps(learned_items)
            else:
                level_progress.learned_items = learned_items

        # Unlock next level if specified
        if unlock_next_level:
            # Find the next level by order
            current_level = LearningLevel.query.get(level_id)
            if current_level:
                next_level = (
                    LearningLevel.query.filter(
                        LearningLevel.order > current_level.order
                    )
                    .order_by(LearningLevel.order)
                    .first()
                )

                if next_level:
                    # Check if a progress record exists for the next level
                    next_level_progress = LearningProgress.query.filter_by(
                        user_id=user_id, level_id=next_level.id, lesson_id=None
                    ).first()

                    if next_level_progress:
                        next_level_progress.is_locked = False
                    else:
                        # Create a new progress record for the next level
                        new_progress = LearningProgress(
                            user_id=user_id,
                            level_id=next_level.id,
                            lesson_id=None,
                            progress=0,
                            is_locked=False,
                        )
                        db.session.add(new_progress)

        db.session.commit()

        # Update user's star count when completing a level
        if completed:
            user.total_stars += 1
            user.completed_lessons += 1
            db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Progress updated successfully",
                "data": {"progress": level_progress.to_dict(), "user": user.to_dict()},
            }
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating progress: {str(e)}")
        traceback.print_exc()
        return (
            jsonify(
                {"success": False, "message": f"Failed to update progress: {str(e)}"}
            ),
            500,
        )


@progress_bp.route("/level/<int:level_id>/user/<int:user_id>", methods=["GET"])
def get_level_progress(level_id, user_id):
    """Get user's progress for a specific level"""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get level progress record
        level_progress = LearningProgress.query.filter_by(
            user_id=user_id, level_id=level_id, lesson_id=None
        ).first()

        if not level_progress:
            return jsonify({"error": "Progress record not found"}), 404

        return jsonify(level_progress.to_dict())

    except Exception as e:
        logger.error(f"Error getting level progress: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Failed to get level progress: {str(e)}"}), 500


@progress_bp.route("/lesson/<int:lesson_id>/user/<int:user_id>", methods=["GET"])
def get_lesson_progress(lesson_id, user_id):
    """Get user's progress for a specific lesson"""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get lesson progress record
        lesson_progress = LearningProgress.query.filter_by(
            user_id=user_id, lesson_id=lesson_id
        ).first()

        if not lesson_progress:
            return jsonify({"error": "Progress record not found"}), 404

        return jsonify(lesson_progress.to_dict())

    except Exception as e:
        logger.error(f"Error getting lesson progress: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Failed to get lesson progress: {str(e)}"}), 500


@progress_bp.route("/lesson/update", methods=["POST"])
def update_lesson_progress():
    """Update user's progress for a specific lesson"""
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "Missing data"}), 400

        user_id = data.get("user_id")
        level_id = data.get("level_id")
        lesson_id = data.get("lesson_id")
        progress_value = data.get("progress", 0)
        completed = data.get("completed", False)
        current_step = data.get("current_step")
        total_steps = data.get("total_steps")
        last_position = data.get("last_position")

        if not user_id or not level_id or not lesson_id:
            return (
                jsonify({"success": False, "message": "Missing required fields"}),
                400,
            )

        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Get the lesson progress record
        lesson_progress = LearningProgress.query.filter_by(
            user_id=user_id, level_id=level_id, lesson_id=lesson_id
        ).first()

        # If no record exists, create one
        if not lesson_progress:
            lesson_progress = LearningProgress(
                user_id=user_id,
                level_id=level_id,
                lesson_id=lesson_id,
                progress=0,
                is_locked=False,
            )
            db.session.add(lesson_progress)

        # Update progress fields
        lesson_progress.progress = progress_value

        if current_step is not None:
            lesson_progress.current_step = current_step

        if total_steps is not None:
            lesson_progress.total_steps = total_steps

        if last_position is not None:
            if isinstance(last_position, dict):
                lesson_progress.last_position = json.dumps(last_position)
            else:
                lesson_progress.last_position = last_position

        # Mark as completed if specified
        if completed:
            lesson_progress.is_completed = True
            lesson_progress.completed_at = datetime.utcnow()

        db.session.commit()

        # Update level progress
        level_progress = LearningProgress.query.filter_by(
            user_id=user_id, level_id=level_id, lesson_id=None
        ).first()

        if level_progress:
            # Calculate percentage of completed lessons in this level
            total_lessons = (
                db.session.query(db.func.count())
                .select_from(Lesson)
                .filter_by(level_id=level_id)
                .scalar()
                or 1
            )
            completed_lessons = (
                db.session.query(db.func.count())
                .select_from(LearningProgress)
                .filter_by(user_id=user_id, level_id=level_id, is_completed=True)
                .filter(LearningProgress.lesson_id.isnot(None))
                .scalar()
                or 0
            )

            level_progress.progress = (completed_lessons / total_lessons) * 100

            # Check if all lessons are completed
            if completed_lessons == total_lessons:
                level_progress.is_completed = True
                level_progress.completed_at = datetime.utcnow()
                user.total_stars += 1
                user.completed_lessons += 1

            db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Lesson progress updated successfully",
                "data": {"progress": lesson_progress.to_dict(), "user": user.to_dict()},
            }
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating lesson progress: {str(e)}")
        traceback.print_exc()
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Failed to update lesson progress: {str(e)}",
                }
            ),
            500,
        )
