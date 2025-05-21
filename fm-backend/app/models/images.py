from app.db import db
from datetime import datetime


class Image(db.Model):
    """نموذج الصور المولدة"""

    __tablename__ = "images"

    id = db.Column(db.Integer, primary_key=True)
    entity_id = db.Column(
        db.String(255), nullable=False, index=True
    )  # معرف القصة أو الجملة
    entity_type = db.Column(
        db.String(20), nullable=False, index=True
    )  # "story" أو "sentence"
    image_path = db.Column(db.String(500), nullable=False)  # مسار الصورة المخزنة
    style = db.Column(
        db.String(50)
    )  # نمط الصورة (cartoon, realistic, artistic, digital_art)
    prompt = db.Column(db.Text)  # النص المستخدم لتوليد الصورة
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Image {self.id} - {self.entity_type} {self.entity_id}>"
