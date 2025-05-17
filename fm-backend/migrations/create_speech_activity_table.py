import os
import sys
from flask import Flask

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Now we can import from app
from app.db import db
from app.models.user import SpeechActivity


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///fmm.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    return app


def run_migration():
    """Create the speech_activities table in the database."""
    app = create_app()

    with app.app_context():
        # Check if table exists
        inspector = db.inspect(db.engine)
        if "speech_activities" not in inspector.get_table_names():
            print("Creating speech_activities table...")
            # Create the table
            SpeechActivity.__table__.create(db.engine)
            print("speech_activities table created successfully!")
        else:
            print("speech_activities table already exists!")


if __name__ == "__main__":
    run_migration()
