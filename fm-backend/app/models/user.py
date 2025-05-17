# fm-backend\app\models\user.py
import json
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from app.db import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))  # Changed to be nullable initially
    nickname = db.Column(db.String(80))
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    streak_days = db.Column(db.Integer, default=0)
    total_stars = db.Column(db.Integer, default=0)
    completed_lessons = db.Column(db.Integer, default=0)

    # Relationships
    progress = db.relationship(
        "LearningProgress", back_populates="user", lazy="dynamic"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "nickname": self.nickname,
            "email": self.email,
            "streak_days": self.streak_days,
            "total_stars": self.total_stars,
            "completed_lessons": self.completed_lessons,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }


class LearningLevel(db.Model):
    __tablename__ = "learning_levels"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    order = db.Column(db.Integer, nullable=False)  # For ordering levels
    icon_name = db.Column(
        db.String(50), nullable=False
    )  # Store icon name from frontend
    color_class = db.Column(db.String(50), nullable=False)  # Store Tailwind color class

    # Relationships
    progress = db.relationship(
        "LearningProgress", back_populates="level", lazy="dynamic"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "order": self.order,
            "icon_name": self.icon_name,
            "color_class": self.color_class,
        }


class Lesson(db.Model):
    __tablename__ = "lessons"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text, nullable=False)  # Lesson content in markdown/HTML
    order = db.Column(db.Integer, nullable=False)  # For ordering lessons within a level
    level_id = db.Column(
        db.Integer, db.ForeignKey("learning_levels.id"), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    level = db.relationship(
        "LearningLevel", backref=db.backref("lessons", lazy="dynamic")
    )
    progress = db.relationship(
        "LearningProgress", back_populates="lesson", lazy="dynamic"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "content": self.content,
            "order": self.order,
            "level_id": self.level_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def get_steps(self):
        """
        تقسيم محتوى الدرس إلى خطوات منفصلة.
        هذه طريقة بسيطة، يمكن تحسينها حسب شكل المحتوى.
        """
        if not self.content:
            return []

        # تقسيم المحتوى بناءً على العناوين الكبيرة
        # يمكن تغيير هذه الطريقة حسب طريقة تنظيم المحتوى
        steps = []
        import re

        sections = re.split(r"# ", self.content)

        for i, section in enumerate(sections):
            if i == 0 and not section:  # تخطي القسم الفارغ الأول إذا بدأ المحتوى بعنوان
                continue

            steps.append({"id": i, "content": "# " + section if i > 0 else section})

        return steps

    def to_dict(self, include_steps=False):
        result = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "content": self.content,
            "order": self.order,
            "level_id": self.level_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_steps:
            result["steps"] = self.get_steps()
            result["total_steps"] = len(result["steps"])

        return result


class LearningProgress(db.Model):
    __tablename__ = "learning_progress"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    level_id = db.Column(
        db.Integer, db.ForeignKey("learning_levels.id"), nullable=False
    )
    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id"), nullable=True)
    progress = db.Column(db.Float, default=0.0)  # Progress percentage
    is_locked = db.Column(db.Boolean, default=True)
    completed_at = db.Column(db.DateTime)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)

    # إضافة الحقول الجديدة هنا
    last_position = db.Column(
        db.Text, nullable=True
    )  # JSON string to store position data
    current_step = db.Column(db.Integer, default=0)  # Current step in the lesson
    total_steps = db.Column(db.Integer, default=0)  # Total steps in the lesson
    is_completed = db.Column(
        db.Boolean, default=False
    )  # Whether the lesson is completed
    learned_items = db.Column(
        db.Text, nullable=True
    )  # JSON string to store learned letters/items

    # Relationships
    user = db.relationship("User", back_populates="progress")
    level = db.relationship("LearningLevel", back_populates="progress")
    lesson = db.relationship("Lesson", back_populates="progress")

    def to_dict(self):
        result = {
            "id": self.id,
            "user_id": self.user_id,
            "level_id": self.level_id,
            "lesson_id": self.lesson_id,
            "progress": self.progress,
            "is_locked": self.is_locked,
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
            "last_activity": (
                self.last_activity.isoformat() if self.last_activity else None
            ),
            "current_step": self.current_step,
            "total_steps": self.total_steps,
            "is_completed": self.is_completed,
        }

        # إضافة last_position إذا كان موجوداً
        if self.last_position:
            try:
                result["last_position"] = json.loads(self.last_position)
            except:
                result["last_position"] = {}

        # إضافة learned_items إذا كان موجوداً
        if self.learned_items:
            try:
                result["learned_items"] = json.loads(self.learned_items)
            except:
                result["learned_items"] = {}

        return result


class SpeechActivity(db.Model):
    __tablename__ = "speech_activities"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    story_id = db.Column(
        db.String(100), nullable=False
    )  # ID of the story being practiced
    original_text = db.Column(db.Text, nullable=False)  # The text being read
    recognized_text = db.Column(
        db.Text, nullable=True
    )  # The text recognized by the speech API
    accuracy = db.Column(db.Float, default=0.0)  # Recognition accuracy percentage
    audio_file_path = db.Column(
        db.String(255), nullable=True
    )  # Path to the stored audio file (if saved)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship back to user
    user = db.relationship(
        "User", backref=db.backref("speech_activities", lazy="dynamic")
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "story_id": self.story_id,
            "original_text": self.original_text,
            "recognized_text": self.recognized_text,
            "accuracy": self.accuracy,
            "audio_file_path": self.audio_file_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
