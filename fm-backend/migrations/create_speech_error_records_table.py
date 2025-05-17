from app.db import db
from app.models.user import SpeechErrorRecord


def create_speech_error_records_table():
    """Create speech_error_records table for tracking specific pronunciation errors."""
    try:
        sql = """
        CREATE TABLE IF NOT EXISTS speech_error_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            activity_id INTEGER NOT NULL,
            original_word TEXT NOT NULL,
            spoken_word TEXT NOT NULL,
            error_type TEXT NOT NULL,
            error_category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (activity_id) REFERENCES speech_activities(id)
        );
        """
        db.engine.execute(sql)
        print("Speech error records table created successfully")
    except Exception as e:
        print(f"Error creating table: {e}")


if __name__ == "__main__":
    create_speech_error_records_table()
