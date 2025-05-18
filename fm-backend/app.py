# fm-backend\app.py
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
from app.routes.auth import auth_bp
from app.routes.learning import learning_bp
from app.routes.progress import progress_bp
from app.routes.speech import speech_bp
from app.routes.stories import stories_bp

# Load environment variables
load_dotenv()


def create_app():
    app = Flask(__name__)

    # Configure CORS
    CORS(
        app,
        resources={
            r"/*": {
                "origins": ["http://localhost:3000"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
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

    # Upload folder for speech recordings
    app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER", "uploads")

    # Ensure upload directories exist
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "speech"), exist_ok=True)

    # Initialize extensions
    from app.db import db

    db.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(learning_bp, url_prefix="/api/learning")
    app.register_blueprint(progress_bp, url_prefix="/api/progress")
    app.register_blueprint(speech_bp, url_prefix="/api/speech")
    app.register_blueprint(stories_bp, url_prefix="/api/stories")

    # Create database tables
    with app.app_context():
        db.create_all()
        print("Database tables recreated successfully!")

        # Initialize learning levels
        from app.models.user import LearningLevel, Lesson

        if not LearningLevel.query.first():
            levels = [
                {
                    "title": "الحروف الهجائية",
                    "description": "تعلم الحروف العربية وأشكالها",
                    "order": 1,
                    "icon_name": "AlphabetIcon",
                    "color_class": "bg-primary/10",
                },
                {
                    "title": "الحركات والتشكيل",
                    "description": "تعلم الحركات وعلامات التشكيل",
                    "order": 2,
                    "icon_name": "DiacriticsIcon",
                    "color_class": "bg-secondary/10",
                },
                {
                    "title": "المقاطع الصوتية",
                    "description": "تعلم قراءة المقاطع الصوتية",
                    "order": 3,
                    "icon_name": "SyllablesIcon",
                    "color_class": "bg-accent/10",
                },
            ]

            for level_data in levels:
                level = LearningLevel(**level_data)
                db.session.add(level)

            db.session.commit()
            print("Initial learning levels created successfully!")

            # Create initial lessons for the first level (الحروف الهجائية)
            first_level = LearningLevel.query.filter_by(order=1).first()
            if first_level and not Lesson.query.first():
                lessons = [
                    {
                        "title": "حرف الألف",
                        "description": "تعلم كتابة ونطق حرف الألف",
                        "content": """# حرف الألف
- شكل الحرف: ا
- النطق: /alif/
- أمثلة: أحمد، أمل، أسد
- تمارين الكتابة والنطق""",
                        "order": 1,
                        "level_id": first_level.id,
                    },
                    {
                        "title": "حرف الباء",
                        "description": "تعلم كتابة ونطق حرف الباء",
                        "content": """# حرف الباء
- شكل الحرف: ب
- النطق: /baa/
- أمثلة: باب، بيت، بطة
- تمارين الكتابة والنطق""",
                        "order": 2,
                        "level_id": first_level.id,
                    },
                    {
                        "title": "حرف التاء",
                        "description": "تعلم كتابة ونطق حرف التاء",
                        "content": """# حرف التاء
- شكل الحرف: ت
- النطق: /taa/
- أمثلة: تمر، تين، توت
- تمارين الكتابة والنطق""",
                        "order": 3,
                        "level_id": first_level.id,
                    },
                ]

                for lesson_data in lessons:
                    lesson = Lesson(**lesson_data)
                    db.session.add(lesson)

                db.session.commit()
                print("Initial lessons created successfully!")

        # Create default user if none exists
        from app.models.user import User

        if not User.query.first():
            default_user = User(
                username="demo",
                email="demo@example.com",
                nickname="متعلم جديد",
            )
            default_user.set_password("demo123")
            db.session.add(default_user)
            db.session.commit()
            print("Default user created successfully!")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=os.getenv("FLASK_DEBUG", "1") == "1",
    )
