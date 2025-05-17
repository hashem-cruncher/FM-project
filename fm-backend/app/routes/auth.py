from flask import Blueprint, request, jsonify, current_app
from ..models.user import User, LearningProgress, LearningLevel, db
from datetime import datetime
import logging

auth_bp = Blueprint("auth", __name__)

# إعداد التسجيل
logger = logging.getLogger(__name__)


def validate_user_data(data):
    """التحقق من صحة بيانات المستخدم"""
    errors = []
    if not data.get("username") or len(data["username"]) < 3:
        errors.append("يجب أن يكون اسم المستخدم 3 أحرف على الأقل")
    if not data.get("password") or len(data["password"]) < 5:
        errors.append("يجب أن تكون كلمة المرور 5 أحرف على الأقل")
    if not data.get("email") or "@" not in data["email"]:
        errors.append("البريد الإلكتروني غير صالح")
    return errors


def initialize_user_progress(user_id):
    """تهيئة تقدم المستخدم للمستويات الأساسية"""
    try:
        # الحصول على جميع المستويات
        levels = LearningLevel.query.order_by(LearningLevel.order).all()
        if not levels:
            logger.error("No learning levels found in database")
            return False

        for level in levels:
            # إنشاء سجل تقدم للمستوى
            progress = LearningProgress(
                user_id=user_id,
                level_id=level.id,
                is_locked=level.id != 1,  # فتح المستوى الأول فقط
                progress=0.0,
                learned_items="{}",  # تهيئة الأحرف المتعلمة كقائمة فارغة
            )
            db.session.add(progress)
            logger.info(f"Created progress record for user {user_id}, level {level.id}")

        db.session.commit()
        return True
    except Exception as e:
        logger.error(f"Error initializing user progress: {str(e)}")
        db.session.rollback()
        return False


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        # التحقق من صحة البيانات
        validation_errors = validate_user_data(data)
        if validation_errors:
            return jsonify({"errors": validation_errors}), 400

        # التحقق من وجود اسم المستخدم
        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"error": "اسم المستخدم موجود بالفعل"}), 400

        # التحقق من وجود البريد الإلكتروني
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "البريد الإلكتروني موجود بالفعل"}), 400

        # Start a transaction
        try:
            # إنشاء مستخدم جديد
            user = User(
                username=data["username"],
                email=data["email"],
                nickname=data.get("nickname"),
                created_at=datetime.utcnow(),
                streak_days=0,
                total_stars=0,
                completed_lessons=0,
            )
            user.set_password(data["password"])
            db.session.add(user)
            db.session.flush()  # Get the user ID without committing

            # Initialize progress records
            levels = LearningLevel.query.order_by(LearningLevel.order).all()
            if not levels:
                logger.error("No learning levels found in database")
                raise Exception("No learning levels found")

            # Create progress records for each level with explicit values
            for level in levels:
                # Log the progress creation
                logger.info(
                    f"Creating progress for user {user.id}, level {level.id} (order: {level.order})"
                )

                progress = LearningProgress(
                    user_id=user.id,
                    level_id=level.id,
                    lesson_id=None,  # Explicitly set to None for level progress
                    is_locked=level.order != 1,  # Only first level is unlocked
                    progress=0.0,  # Explicitly set to 0
                    learned_items="{}",
                    is_completed=False,
                    completed_at=None,
                    last_activity=datetime.utcnow(),
                )
                db.session.add(progress)

                # Verify the progress object before commit
                logger.info(
                    f"Progress object created: locked={progress.is_locked}, progress={progress.progress}"
                )

            # Commit both user and progress records
            db.session.commit()

            # Verify the progress after commit
            first_level_progress = LearningProgress.query.filter_by(
                user_id=user.id, level_id=levels[0].id, lesson_id=None
            ).first()

            if first_level_progress:
                logger.info(
                    f"Verified first level progress: {first_level_progress.progress}%"
                )
            else:
                logger.error("Failed to create first level progress!")

            return (
                jsonify({"message": "تم إنشاء الحساب بنجاح", "user": user.to_dict()}),
                201,
            )

        except Exception as e:
            logger.error(f"Error in registration transaction: {str(e)}")
            db.session.rollback()
            return jsonify({"error": "حدث خطأ أثناء إنشاء الحساب"}), 500

    except Exception as e:
        logger.error(f"Error in registration: {str(e)}")
        return jsonify({"error": "حدث خطأ في الخادم"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        if not data or not data.get("username") or not data.get("password"):
            return jsonify({"error": "يرجى إدخال اسم المستخدم وكلمة المرور"}), 400

        user = User.query.filter_by(username=data["username"]).first()

        if user and user.check_password(data["password"]):
            # التحقق من وجود تقدم للمستخدم
            user_progress = LearningProgress.query.filter_by(user_id=user.id).first()
            if not user_progress:
                logger.warning(f"No progress found for user {user.id}, initializing...")
                if not initialize_user_progress(user.id):
                    return jsonify({"error": "حدث خطأ في تهيئة تقدم المستخدم"}), 500

            # تحديث وقت آخر تسجيل دخول
            user.last_login = datetime.utcnow()
            db.session.commit()

            logger.info(f"Successful login for user {user.username} (ID: {user.id})")
            return (
                jsonify({"message": "تم تسجيل الدخول بنجاح", "user": user.to_dict()}),
                200,
            )

        logger.warning(f"Failed login attempt for username: {data.get('username')}")
        return jsonify({"error": "اسم المستخدم أو كلمة المرور غير صحيحة"}), 401

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "حدث خطأ أثناء تسجيل الدخول"}), 500
