from flask import Blueprint, request, jsonify, current_app
from app.models.user import User, SpeechActivity
from app.db import db
from datetime import datetime
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
