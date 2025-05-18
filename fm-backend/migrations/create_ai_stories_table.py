import os
import sys
from datetime import datetime

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.db import db
from app.models.user import AIGeneratedStory

app = create_app()


def create_ai_stories_table():
    """
    Create the ai_generated_stories table in the database
    """
    with app.app_context():
        db.create_all()
        print("AI Stories table created successfully")


if __name__ == "__main__":
    create_ai_stories_table()
