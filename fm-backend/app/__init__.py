# app/__init__.py
import os
from flask import Flask
from flask_cors import CORS
from .db import db
from datetime import datetime

from .routes.auth import auth_bp
from .routes.learning import learning_bp
from .routes.progress import progress_bp
from .routes.speech import speech_bp


def create_app():
    app = Flask(__name__)

    # Configure CORS
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": ["http://localhost:3000"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
                "expose_headers": ["Content-Range", "X-Content-Range"],
                "max_age": 600,
            }
        },
    )

    # Security Configuration
    app.config["SECRET_KEY"] = os.getenv(
        "SECRET_KEY", "default-secret-key-change-in-production"
    )

    # Database Configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///fmm.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions
    db.init_app(app)

    with app.app_context():
        # Import models
        from .models.user import User, LearningLevel, Lesson, LearningProgress

        # Create tables if they don't exist
        db.create_all()

        # Initialize learning levels if they don't exist
        if LearningLevel.query.count() == 0:
            initial_levels = [
                {
                    "title": "الحروف الهجائية",
                    "description": "تعلم الحروف العربية وأشكالها المختلفة",
                    "order": 1,
                    "icon_name": "BookOpen",
                    "color_class": "bg-blue-100 text-blue-600",
                },
                {
                    "title": "الحركات والتشكيل",
                    "description": "تعلم الفتحة والضمة والكسرة والسكون",
                    "order": 2,
                    "icon_name": "Star",
                    "color_class": "bg-purple-100 text-purple-600",
                },
                {
                    "title": "المقاطع الصوتية",
                    "description": "تعلم نطق المقاطع الصوتية البسيطة",
                    "order": 3,
                    "icon_name": "Music",
                    "color_class": "bg-pink-100 text-pink-600",
                },
                {
                    "title": "الكلمات البسيطة",
                    "description": "تعلم قراءة وكتابة الكلمات السهلة",
                    "order": 4,
                    "icon_name": "Brain",
                    "color_class": "bg-green-100 text-green-600",
                },
                {
                    "title": "الجمل القصيرة",
                    "description": "تعلم قراءة وفهم الجمل البسيطة",
                    "order": 5,
                    "icon_name": "Book",
                    "color_class": "bg-yellow-100 text-yellow-600",
                },
                {
                    "title": "القصص القصيرة",
                    "description": "قراءة وفهم القصص القصيرة والممتعة",
                    "order": 6,
                    "icon_name": "Sparkles",
                    "color_class": "bg-orange-100 text-orange-600",
                },
            ]

            for level_data in initial_levels:
                level = LearningLevel(**level_data)
                db.session.add(level)

            try:
                db.session.commit()
                print("Initial learning levels created successfully!")
            except Exception as e:
                db.session.rollback()
                print(f"Error creating initial levels: {e}")

        # Create default user if none exists
        if User.query.count() == 0:
            default_user = User(
                username="default_user",
                email="default@example.com",
                nickname="Default User",
            )
            default_user.set_password("default123")
            db.session.add(default_user)
            try:
                db.session.commit()
                print("Default user created successfully!")

                # Create initial progress records for the default user
                # First, unlock the first level
                first_level = LearningLevel.query.filter_by(order=1).first()
                if first_level:
                    level_progress = LearningProgress(
                        user_id=default_user.id,
                        level_id=first_level.id,
                        lesson_id=None,
                        is_locked=False,
                        progress=0,
                    )
                    db.session.add(level_progress)

                    # Create progress records for each lesson in the first level
                    lessons = Lesson.query.filter_by(level_id=first_level.id).all()
                    for lesson in lessons:
                        lesson_progress = LearningProgress(
                            user_id=default_user.id,
                            level_id=first_level.id,
                            lesson_id=lesson.id,
                            is_locked=False,
                            progress=0,
                            current_step=0,
                            total_steps=1,
                            is_completed=False,
                        )
                        db.session.add(lesson_progress)

                    db.session.commit()
                    print("Initial progress records created for default user!")

            except Exception as e:
                db.session.rollback()
                print(f"Error creating default user: {e}")

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(learning_bp, url_prefix="/api/learning")
    app.register_blueprint(progress_bp, url_prefix="/api/progress")
    app.register_blueprint(speech_bp, url_prefix="/api/speech")

    @app.route("/health")
    def health_check():
        return {"status": "healthy"}, 200

    return app
