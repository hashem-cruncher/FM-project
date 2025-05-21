from flask import Blueprint, request, jsonify
from app.services.ai_service import AIService
import base64
import logging
import traceback
import datetime

logger = logging.getLogger(__name__)
images_bp = Blueprint("images", __name__)


@images_bp.route("/generate", methods=["POST"])
def generate_image():
    """
    Generate an image based on an Arabic sentence using OpenAI's API
    """
    try:
        data = request.json or {}
        sentence = data.get("sentence")

        if not sentence:
            return (
                jsonify({"success": False, "message": "الرجاء توفير نص أو جملة"}),
                400,
            )

        # Optional parameters
        image_style = data.get("style", "cartoon")  # Default to cartoon for children
        size = data.get("size", "1024x1024")
        consistent_with_previous = data.get("consistent_with_previous", False)
        consistency_factor = float(data.get("consistency_factor", 0.5))

        # الحصول على معلومات الكيان لربط الصورة به
        entity_id = data.get("entity_id")
        entity_type = data.get("entity_type", "sentence")  # 'sentence' أو 'story'

        # Validate image style
        valid_styles = ["realistic", "cartoon", "artistic", "digital_art"]
        if image_style not in valid_styles:
            image_style = "cartoon"

        # Validate size
        valid_sizes = ["1024x1024", "512x512"]
        if size not in valid_sizes:
            size = "1024x1024"

        # Validate consistency factor
        if consistency_factor < 0.0 or consistency_factor > 1.0:
            consistency_factor = 0.5

        # Validate entity_type
        valid_entity_types = ["story", "sentence"]
        if entity_type not in valid_entity_types:
            entity_type = "sentence"

        # Generate image
        ai_service = AIService()
        result = ai_service.generate_image_for_sentence(
            sentence=sentence,
            image_style=image_style,
            size=size,
            consistent_with_previous=consistent_with_previous,
            consistency_factor=consistency_factor,
            entity_id=entity_id,
            entity_type=entity_type,
        )

        if not result.get("success"):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "فشل في إنشاء الصورة",
                        "error": result.get("error"),
                    }
                ),
                500,
            )

        # Process response for the frontend
        response = {
            "success": True,
            "message": "تم إنشاء الصورة بنجاح",
            "image_data": result.get("image_data"),
            "image_path": result.get("image_path"),
            "prompt_used": result.get("prompt_used"),
            "generated_at": result.get("generated_at"),
        }

        # إضافة الصورة إلى قاعدة البيانات
        if entity_id:
            from app.db import db
            from app.models.images import Image

            # إنشاء سجل جديد للصورة في قاعدة البيانات
            new_image = Image(
                entity_id=entity_id,
                entity_type=entity_type,
                image_path=result.get("image_path"),
                style=image_style,
                prompt=result.get("prompt_used"),
                created_at=datetime.datetime.now(),
            )

            try:
                db.session.add(new_image)
                db.session.commit()
                response["image_id"] = new_image.id
            except Exception as e:
                logger.error(f"Error saving image to database: {str(e)}")
                db.session.rollback()

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@images_bp.route("/<entity_type>/<entity_id>", methods=["GET"])
def get_entity_images(entity_type, entity_id):
    """
    Get all images associated with a specific entity (story or sentence)
    """
    try:
        # التحقق من صحة نوع الكيان
        if entity_type not in ["story", "sentence"]:
            return jsonify({"success": False, "message": "نوع الكيان غير صالح"}), 400

        from app.models.images import Image

        # البحث عن الصور المرتبطة بالكيان
        images = (
            Image.query.filter_by(entity_type=entity_type, entity_id=entity_id)
            .order_by(Image.created_at.desc())
            .all()
        )

        # تحويل النتائج إلى قائمة
        images_list = []
        for img in images:
            images_list.append(
                {
                    "id": img.id,
                    "entity_id": img.entity_id,
                    "entity_type": img.entity_type,
                    "image_path": img.image_path,
                    "style": img.style,
                    "created_at": (
                        img.created_at.isoformat() if img.created_at else None
                    ),
                }
            )

        return jsonify(
            {"success": True, "images": images_list, "count": len(images_list)}
        )

    except Exception as e:
        logger.error(f"Error fetching images: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
