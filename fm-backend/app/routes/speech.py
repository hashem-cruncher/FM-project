from flask import Blueprint, request, jsonify, current_app
from app.models.user import User, SpeechActivity, SpeechErrorRecord
from app.db import db
from datetime import datetime
from sqlalchemy import func
import os
import base64
import logging
import traceback

logger = logging.getLogger(__name__)
speech_bp = Blueprint("speech", __name__)


@speech_bp.route("/save", methods=["POST"])
def save_speech_activity():
    """Save speech recognition activity and optionally the audio recording"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Missing data"}), 400

        user_id = data.get("user_id")
        story_id = data.get("story_id")
        original_text = data.get("original_text")
        recognized_text = data.get("recognized_text")
        accuracy = data.get("accuracy", 0)
        audio_data = data.get("audio_data")  # Base64 encoded audio data

        if not user_id or not story_id or not original_text:
            return jsonify({"error": "Missing required fields"}), 400

        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Handle audio data if provided
        audio_file_path = None
        if audio_data:
            try:
                # Create directory if it doesn't exist
                audio_dir = os.path.join(
                    current_app.config.get("UPLOAD_FOLDER", "uploads"), "speech"
                )
                os.makedirs(audio_dir, exist_ok=True)

                # Save audio file
                file_name = f"speech_{user_id}_{story_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.wav"
                audio_file_path = os.path.join(audio_dir, file_name)

                # Remove data URL prefix if present
                if audio_data.startswith("data:audio"):
                    audio_data = audio_data.split(",")[1]

                # Decode and save
                with open(audio_file_path, "wb") as f:
                    f.write(base64.b64decode(audio_data))

                # Make path relative to app root
                audio_file_path = os.path.join("uploads", "speech", file_name)

            except Exception as e:
                logger.error(f"Error saving audio file: {str(e)}")
                audio_file_path = None

        # Create speech activity record
        speech_activity = SpeechActivity(
            user_id=user_id,
            story_id=story_id,
            original_text=original_text,
            recognized_text=recognized_text,
            accuracy=accuracy,
            audio_file_path=audio_file_path,
            created_at=datetime.utcnow(),
        )

        db.session.add(speech_activity)
        db.session.commit()

        return jsonify(
            {
                "success": True,
                "data": {
                    "activity_id": speech_activity.id,
                    "accuracy": accuracy,
                    "created_at": speech_activity.created_at.isoformat(),
                },
            }
        )

    except Exception as e:
        logger.error(f"Error saving speech activity: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Failed to save speech activity: {str(e)}"}), 500


@speech_bp.route("/history/<int:user_id>", methods=["GET"])
def get_speech_history(user_id):
    """Get speech recognition history for a user"""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get story_id filter if provided
        story_id = request.args.get("story_id")

        # Query speech activities
        query = SpeechActivity.query.filter_by(user_id=user_id)
        if story_id:
            query = query.filter_by(story_id=story_id)

        # Order by most recent first and limit to 50 records
        activities = query.order_by(SpeechActivity.created_at.desc()).limit(50).all()

        # Format response
        result = [activity.to_dict() for activity in activities]

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error getting speech history: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Failed to get speech history: {str(e)}"}), 500


@speech_bp.route("/stats/<int:user_id>", methods=["GET"])
def get_speech_stats(user_id):
    """Get speech recognition statistics for a user"""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get story_id filter if provided
        story_id = request.args.get("story_id")

        # Base query for all activities
        query = SpeechActivity.query.filter_by(user_id=user_id)
        if story_id:
            query = query.filter_by(story_id=story_id)

        # Get total activities
        total_activities = query.count()

        if total_activities == 0:
            return (
                jsonify(
                    {
                        "total_activities": 0,
                        "average_accuracy": 0,
                        "highest_accuracy": 0,
                        "improvement_trend": 0,
                        "most_recent_accuracy": 0,
                    }
                ),
                200,
            )

        # Get average accuracy
        from sqlalchemy import func

        avg_accuracy = (
            db.session.query(func.avg(SpeechActivity.accuracy))
            .filter(SpeechActivity.user_id == user_id)
            .scalar()
            or 0
        )

        # Get highest accuracy
        highest_accuracy = (
            db.session.query(func.max(SpeechActivity.accuracy))
            .filter(SpeechActivity.user_id == user_id)
            .scalar()
            or 0
        )

        # Get most recent accuracy
        most_recent = query.order_by(SpeechActivity.created_at.desc()).first()
        most_recent_accuracy = most_recent.accuracy if most_recent else 0

        # Calculate improvement trend (compare first 5 with most recent 5)
        first_activities = (
            query.order_by(SpeechActivity.created_at.asc()).limit(5).all()
        )
        recent_activities = (
            query.order_by(SpeechActivity.created_at.desc()).limit(5).all()
        )

        first_avg = (
            sum(a.accuracy for a in first_activities) / len(first_activities)
            if first_activities
            else 0
        )
        recent_avg = (
            sum(a.accuracy for a in recent_activities) / len(recent_activities)
            if recent_activities
            else 0
        )

        improvement_trend = recent_avg - first_avg

        return (
            jsonify(
                {
                    "total_activities": total_activities,
                    "average_accuracy": round(avg_accuracy, 2),
                    "highest_accuracy": round(highest_accuracy, 2),
                    "improvement_trend": round(improvement_trend, 2),
                    "most_recent_accuracy": round(most_recent_accuracy, 2),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error getting speech stats: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Failed to get speech stats: {str(e)}"}), 500


@speech_bp.route("/errors", methods=["POST"])
def record_speech_errors():
    """Record specific pronunciation errors from a speech activity."""
    try:
        data = request.json

        # Validate request data
        if not all(k in data for k in ["user_id", "activity_id", "errors"]):
            return (
                jsonify({"success": False, "message": "Missing required fields"}),
                400,
            )

        # Check if user exists
        user = User.query.get(data["user_id"])
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Check if activity exists
        activity = SpeechActivity.query.get(data["activity_id"])
        if not activity:
            return jsonify({"success": False, "message": "Activity not found"}), 404

        # Store each error record
        saved_errors = []
        for error in data["errors"]:
            if all(k in error for k in ["original_word", "spoken_word", "error_type"]):
                error_record = SpeechErrorRecord(
                    user_id=data["user_id"],
                    activity_id=data["activity_id"],
                    original_word=error["original_word"],
                    spoken_word=error["spoken_word"],
                    error_type=error["error_type"],
                    error_category=error.get("error_category"),
                )

                # Auto-classify if category not provided
                if not error_record.error_category:
                    error_record.error_category = error_record.classify_error()

                db.session.add(error_record)
                saved_errors.append(error_record)

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": f"Speech errors recorded successfully ({len(saved_errors)} errors)",
                "data": {"errors": [error.to_dict() for error in saved_errors]},
            }
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error recording speech errors: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@speech_bp.route("/errors/user/<int:user_id>", methods=["GET"])
def get_user_errors(user_id):
    """Get a user's most common pronunciation errors."""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Get optional query parameters
        limit = request.args.get("limit", 10, type=int)
        error_type = request.args.get("error_type")

        # Build query
        query = db.session.query(
            SpeechErrorRecord.original_word,
            SpeechErrorRecord.spoken_word,
            SpeechErrorRecord.error_type,
            SpeechErrorRecord.error_category,
            func.count().label("occurrence_count"),
        ).filter(SpeechErrorRecord.user_id == user_id)

        if error_type:
            query = query.filter(SpeechErrorRecord.error_type == error_type)

        result = (
            query.group_by(
                SpeechErrorRecord.original_word, SpeechErrorRecord.spoken_word
            )
            .order_by(func.count().desc())
            .limit(limit)
            .all()
        )

        # Format response
        errors = [
            {
                "original_word": r.original_word,
                "spoken_word": r.spoken_word,
                "error_type": r.error_type,
                "error_category": r.error_category,
                "count": r.occurrence_count,
            }
            for r in result
        ]

        return jsonify({"success": True, "errors": errors})

    except Exception as e:
        logger.error(f"Error getting user errors: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@speech_bp.route("/exercises/personalized/<int:user_id>", methods=["GET"])
def generate_personalized_exercises(user_id):
    """Generate personalized exercises based on user's common errors."""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Get user's common errors
        common_errors = (
            db.session.query(
                SpeechErrorRecord.original_word,
                SpeechErrorRecord.error_category,
                func.count().label("error_count"),
            )
            .filter(SpeechErrorRecord.user_id == user_id)
            .group_by(SpeechErrorRecord.original_word)
            .order_by(func.count().desc())
            .limit(10)
            .all()
        )

        if not common_errors:
            return jsonify(
                {
                    "success": True,
                    "message": "No pronunciation errors found for this user",
                    "exercises": [],
                }
            )

        # Generate exercises (in a real implementation, this could be more sophisticated)
        exercises = []
        for error in common_errors:
            # Create practice sentences containing the error word
            exercises.append(
                {
                    "word": error.original_word,
                    "category": error.error_category,
                    "frequency": error.error_count,
                    "practice_sentence": f"هذه جملة تدريبية تحتوي على كلمة {error.original_word} للتمرين عليها.",
                    # In a more advanced implementation, you'd generate proper sentences
                }
            )

        return jsonify({"success": True, "exercises": exercises})

    except Exception as e:
        logger.error(f"Error generating personalized exercises: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@speech_bp.route("/analytics/user/<int:user_id>", methods=["GET"])
def get_user_speech_analytics(user_id):
    """Get comprehensive analytics on a user's pronunciation progress."""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Get time range from query parameters
        from_date = request.args.get("from_date")
        to_date = request.args.get("to_date")

        # Base query for user's speech activities
        query = SpeechActivity.query.filter_by(user_id=user_id)

        # Apply date filters if provided
        if from_date:
            query = query.filter(SpeechActivity.created_at >= from_date)
        if to_date:
            query = query.filter(SpeechActivity.created_at <= to_date)

        # Get all activities ordered by date
        activities = query.order_by(SpeechActivity.created_at).all()

        if not activities:
            return jsonify(
                {
                    "success": True,
                    "message": "No speech activities found for this user",
                    "analytics": {
                        "accuracy_trend": [],
                        "challenging_words": [],
                        "improvement": 0,
                        "total_activities": 0,
                        "average_accuracy": 0,
                    },
                }
            )

        # Calculate accuracy trends
        accuracy_trend = [
            {
                "date": activity.created_at.strftime("%Y-%m-%d"),
                "accuracy": activity.accuracy,
                "story_id": activity.story_id,
            }
            for activity in activities
        ]

        # Get most challenging words
        error_query = db.session.query(
            SpeechErrorRecord.original_word, func.count().label("error_count")
        ).filter_by(user_id=user_id)

        if from_date:
            error_query = error_query.filter(SpeechErrorRecord.created_at >= from_date)
        if to_date:
            error_query = error_query.filter(SpeechErrorRecord.created_at <= to_date)

        challenging_words = (
            error_query.group_by(SpeechErrorRecord.original_word)
            .order_by(func.count().desc())
            .limit(10)
            .all()
        )

        # Calculate improvement metrics
        improvement = 0
        if len(activities) >= 10:
            first_five = activities[:5]
            last_five = activities[-5:]
            avg_first = sum(a.accuracy for a in first_five) / len(first_five)
            avg_last = sum(a.accuracy for a in last_five) / len(last_five)
            improvement = avg_last - avg_first

        return jsonify(
            {
                "success": True,
                "analytics": {
                    "accuracy_trend": accuracy_trend,
                    "challenging_words": [
                        {"word": w.original_word, "count": w.error_count}
                        for w in challenging_words
                    ],
                    "improvement": round(improvement, 2),
                    "total_activities": len(activities),
                    "average_accuracy": round(
                        sum(a.accuracy for a in activities) / len(activities), 2
                    ),
                },
            }
        )

    except Exception as e:
        logger.error(f"Error getting speech analytics: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
