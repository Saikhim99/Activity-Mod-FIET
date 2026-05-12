from flask import Flask, request, jsonify, render_template_string
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
import urllib
from flask_cors import CORS
from datetime import datetime, timedelta
import random

VERIFY_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>Verify Email - Activity Mod FIET</title>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Kanit', sans-serif; }
        body {
            background: linear-gradient(to top, #70D0F4, #CCE4ED);
            background-size: cover;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }
        .box {
            background: #FFFAFA;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 450px;
            width: 90%;
        }
        h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
        p { color: #666; font-size: 16px; margin-bottom: 30px; }
        a.btn {
            background-color: #70D0F4;
            color: #fff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            display: inline-block;
            transition: all 0.3s ease;
        }
        a.btn:hover { background-color: #55bde3; }
        .success { color: #4CAF50; font-size: 60px; margin-bottom: 20px; font-weight: bold; }
        .error { color: #F44336; font-size: 60px; margin-bottom: 20px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="box">
        <div class="{{ status_class }}">{{ icon|safe }}</div>
        <h1>{{ title }}</h1>
        <p>{{ message }}</p>
        <a href="#" onclick="window.close(); return false;" class="btn">ปิดหน้าต่างนี้</a>
    </div>
</body>
</html>
"""

app = Flask(__name__)
CORS(app)

# ==========================================
# ตั้งค่า Email (SMTP) สำหรับส่งลิงก์ยืนยันตัวตน
# ==========================================
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'activitymodfiet@gmail.com' # <--- ใส่อีเมล Gmail ของคุณ
app.config['MAIL_PASSWORD'] = 'kiljfwqdsnecfzse'    # <--- ใส่ App Password ที่ได้จาก Google 16 หลัก

mail = Mail(app)
s = URLSafeTimedSerializer('my_super_secret_key_for_fiet') # รหัสสำหรับเข้ารหัส Token
# 1. ตั้งค่าการเชื่อมต่อ SQL Server
# ==========================================
SERVER = r'.\SQLEXPRESS' 
DATABASE = 'Activity Mod FIET' # <--- เปลี่ยนเป็นชื่อ Database ของคุณ
USERNAME = 'sa' # ถ้าใช้ Windows Authentication ปล่อยว่างไว้
PASSWORD = 'P@sswOrd'

# กำหนด Connection String (เปลี่ยนมาใช้ Windows Authentication เพื่อแก้ปัญหาเชื่อมต่อ)
connection_string = f"Driver={{ODBC Driver 17 for SQL Server}};Server={SERVER};Database={DATABASE};Trusted_Connection=yes;"

params = urllib.parse.quote_plus(connection_string)
app.config['SQLALCHEMY_DATABASE_URI'] = "mssql+pyodbc:///?odbc_connect=%s" % params
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ==========================================
# 2. สร้าง Models (ตารางในฐานข้อมูลตาม SQL Server)
# ==========================================

class User(db.Model):
    __tablename__ = 'User' # ชื่อตาราง
    __table_args__ = {'schema': 'dbo'} # Schema ปกติคือ dbo
    
    ID = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.NVARCHAR(100))
    password = db.Column(db.NVARCHAR(100), nullable=True) # อิงตามที่ติ๊ก Allow Nulls ไว้ในรูป
    role = db.Column(db.NVARCHAR(50))
    is_verified = db.Column(db.Boolean, default=False) # เพิ่มสถานะยืนยันอีเมล
    email = db.Column(db.NVARCHAR(255), nullable=True)
    otp_code = db.Column(db.NVARCHAR(10), nullable=True)
    otp_expiry = db.Column(db.DATETIME, nullable=True)

class StudentUser(db.Model):
    __tablename__ = 'StudentUser'
    __table_args__ = {'schema': 'dbo'}
    
    UserID = db.Column(db.Integer, primary_key=True, autoincrement=False) # เปลี่ยนให้ตรงกับ UserID ในฐานข้อมูล
    ThaiFirstName = db.Column(db.NVARCHAR(300))
    ThaiLastName = db.Column(db.NVARCHAR(300))
    EngFirstName = db.Column(db.NVARCHAR(300))
    EngLastName = db.Column(db.NVARCHAR(300))
    School = db.Column(db.NVARCHAR(100))
    Birthday = db.Column(db.NVARCHAR(100))
    Telephone = db.Column(db.NVARCHAR(20))

class TeacherUser(db.Model):
    __tablename__ = 'TeacherUser'
    __table_args__ = {'schema': 'dbo'}
    
    UserID = db.Column(db.Integer, primary_key=True, autoincrement=False)
    FirstName = db.Column(db.NVARCHAR(300))
    LastName = db.Column(db.NVARCHAR(300))
    Major = db.Column(db.NVARCHAR(100))

# ยังไม่มีตาราง StaffUser ในฐานข้อมูล ลบโมเดลออกก่อนเพื่อไม่ให้เกิด Error

# ==========================================
# 3. สร้าง API Endpoints (สำหรับการ Login)
# ==========================================

@app.route('/login', methods=['POST'])
def login():
    # รับข้อมูลจาก Frontend
    if request.is_json:
        data = request.json
    else:
        data = request.form

    username_input = data.get('username')
    password_input = data.get('password')

    if not username_input or not password_input:
        return jsonify({'status': 'error', 'message': 'กรุณากรอก Username และ Password ให้ครบถ้วน'}), 400

    try:
        # ค้นหา User จากตาราง dbo.User
        user = User.query.filter_by(username=username_input).first()

        # สำหรับ Student รหัสผ่านใน DB อาจเป็น NULL (None)
        if user and (user.password == password_input or user.password is None):
            # ตรวจสอบว่ายืนยันอีเมลหรือยัง (เฉพาะคนที่เพิ่งสมัครและมีสถานะ False)
            if hasattr(user, 'is_verified') and user.is_verified == False:
                return jsonify({'status': 'error', 'message': 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (เช็คกล่องจดหมายของคุณ)'}), 401

            if not user.email:
                return jsonify({'status': 'error', 'message': 'บัญชีนี้ไม่มีอีเมลในระบบ ไม่สามารถส่งรหัส OTP ได้'}), 401

            # ---------------------------------------------
            # สร้าง OTP และส่งไปยังอีเมล
            # ---------------------------------------------
            otp = str(random.randint(100000, 999999))
            user.otp_code = otp
            user.otp_expiry = datetime.now() + timedelta(minutes=5)
            db.session.commit()

            msg = Message('รหัสยืนยันการเข้าสู่ระบบ (OTP)', sender=app.config['MAIL_USERNAME'], recipients=[user.email])
            msg.body = f"รหัส OTP สำหรับเข้าสู่ระบบของคุณคือ: {otp}\n\nรหัสนี้จะหมดอายุภายใน 5 นาที"
            try:
                mail.send(msg)
            except Exception as e:
                return jsonify({'status': 'error', 'message': 'ไม่สามารถส่งอีเมล OTP ได้ กรุณาลองใหม่ภายหลัง'}), 500

            return jsonify({
                'status': 'otp_required',
                'message': 'ระบบได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว',
                'data': {
                    'user_id': user.ID
                }
            }), 200
        else:
            return jsonify({'status': 'error', 'message': 'Username หรือ Password ไม่ถูกต้อง'}), 401
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Database Error: {str(e)}'}), 500

@app.route('/verify_otp', methods=['POST'])
def verify_otp():
    if request.is_json:
        data = request.json
    else:
        data = request.form

    user_id = data.get('user_id')
    otp_code = data.get('otp_code')

    if not user_id or not otp_code:
        return jsonify({'status': 'error', 'message': 'ข้อมูลไม่ครบถ้วน'}), 400

    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'status': 'error', 'message': 'ไม่พบผู้ใช้งาน'}), 404

        if user.otp_code != otp_code:
            return jsonify({'status': 'error', 'message': 'รหัส OTP ไม่ถูกต้อง'}), 401

        if not user.otp_expiry or datetime.now() > user.otp_expiry:
            return jsonify({'status': 'error', 'message': 'รหัส OTP หมดอายุแล้ว'}), 401

        # OTP ถูกต้อง ล้างค่า OTP
        user.otp_code = None
        user.otp_expiry = None
        db.session.commit()

        # ล็อกอินสำเร็จ! จะตรวจสอบ role และดึงข้อมูลเพิ่มเติมจากตารางอื่น
        user_info = None
        
        if user.role == 'student':
            student = StudentUser.query.filter_by(UserID=user.ID).first()
            if student:
                user_info = f"{student.ThaiFirstName} {student.ThaiLastName}"
        elif user.role == 'teacher':
            teacher = TeacherUser.query.filter_by(UserID=user.ID).first()
            if teacher:
                user_info = f"{teacher.FirstName} {teacher.LastName}"
        elif user.role == 'staff' or user.role == 'admin':
            pass

        return jsonify({
            'status': 'success',
            'message': 'ยืนยัน OTP สำเร็จและเข้าสู่ระบบสำเร็จ',
            'data': {
                'user_id': user.ID,
                'username': user.username,
                'role': user.role,
                'full_name': user_info
            }
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Database Error: {str(e)}'}), 500

@app.route('/api/student/profile', methods=['GET'])
def student_profile():
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({'status': 'error', 'message': 'Missing user_id'}), 400

    try:
        user = db.session.get(User, int(user_id))
        if not user:
            return jsonify({'status': 'error', 'message': 'User not found'}), 404

        student = StudentUser.query.filter_by(UserID=user.ID).first()
        if not student:
            return jsonify({'status': 'error', 'message': 'Student profile not found'}), 404

        return jsonify({
            'status': 'success',
            'data': {
                'user_id': user.ID,
                'username': user.username,
                'email': user.email,
                'full_name': f"{student.ThaiFirstName or ''} {student.ThaiLastName or ''}".strip(),
                'eng_name': f"{student.EngFirstName or ''} {student.EngLastName or ''}".strip(),
                'school': student.School,
                'birthday': student.Birthday,
                'telephone': student.Telephone
            }
        }), 200

    except ValueError:
        return jsonify({'status': 'error', 'message': 'Invalid user_id'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Database Error: {str(e)}'}), 500

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    id_card = data.get('id_card')
    email = data.get('email')

    if not id_card or not email:
        return jsonify({'status': 'error', 'message': 'ข้อมูลไม่ครบถ้วน'}), 400

    try:
        # เช็คว่ามีคนใช้ ID นี้สมัครไปแล้วหรือยัง
        existing_user = User.query.filter_by(username=id_card).first()
        if existing_user:
            return jsonify({'status': 'error', 'message': 'รหัสประจำตัวนี้ถูกใช้ลงทะเบียนแล้ว'}), 400

        # 1. บันทึกข้อมูลลงตาราง User หลักก่อน (is_verified = False)
        new_user = User(username=id_card, password=None, role='student', is_verified=False, email=email)
        db.session.add(new_user)
        db.session.commit() # เซฟเพื่อให้ได้ ID อัตโนมัติมาก่อน

        # 2. บันทึกข้อมูลลงตาราง StudentUser
        new_student = StudentUser(
            UserID=new_user.ID,
            ThaiFirstName=data.get('thai_first_name'),
            ThaiLastName=data.get('thai_last_name'),
            EngFirstName=data.get('eng_first_name', ''),
            EngLastName=data.get('eng_last_name', ''),
            School=data.get('school'),
            Birthday=data.get('birthday', ''),
            Telephone=data.get('telephone', '')
        )
        db.session.add(new_student)
        db.session.commit()

        # 3. สร้าง Token และส่ง Email
        token = s.dumps(email, salt='email-confirm')
        
        # ส่งลิงก์ไปยัง API verify พร้อมแนบ Token และ ID ของผู้ใช้
        confirm_url = f"http://127.0.0.1:5000/verify/{token}?user_id={new_user.ID}"

        msg = Message('ยืนยันการสมัครสมาชิก Activity Mod FIET', sender=app.config['MAIL_USERNAME'], recipients=[email])
        msg.body = f"สวัสดี {data.get('thai_first_name')},\n\nกรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันบัญชีของคุณ:\n{confirm_url}\n\nลิงก์นี้มีอายุ 1 ชั่วโมง"
        msg.html = f"""
        <div style="font-family: 'Kanit', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background-color: #f9f9f9; border-radius: 10px; text-align: center; border: 1px solid #eee;">
            <h2 style="color: #333;">ยืนยันการสมัครสมาชิก</h2>
            <p style="color: #555; font-size: 16px;">สวัสดีคุณ <strong>{data.get('thai_first_name')}</strong>,</p>
            <p style="color: #555; font-size: 16px;">ขอบคุณที่สมัครเข้าร่วม Activity Mod FIET กรุณาคลิกที่ปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณครับ</p>
            <div style="margin: 30px 0;">
                <a href="{confirm_url}" style="background-color: #70D0F4; color: #fff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Account</a>
            </div>
            <p style="color: #999; font-size: 12px;">* ลิงก์นี้มีอายุ 1 ชั่วโมง หากคุณไม่ได้สมัครสมาชิก กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
        </div>
        """
        
        mail.send(msg)

        return jsonify({'status': 'success', 'message': 'กรุณาเช็คอีเมลเพื่อยืนยันการสมัคร'}), 200

    except Exception as e:
        db.session.rollback() # ยกเลิกการเซฟถ้าพัง
        return jsonify({'status': 'error', 'message': f'Error: {str(e)}'}), 500

@app.route('/verify/<token>')
def verify_email(token):
    user_id = request.args.get('user_id')
    try:
        # เช็คว่า Token ถูกต้องและยังไม่หมดอายุ (3600 วิ = 1 ชั่วโมง)
        email = s.loads(token, salt='email-confirm', max_age=3600)
        
        user = User.query.get(user_id)
        if user:
            user.is_verified = True
            db.session.commit()
            return render_template_string(VERIFY_HTML_TEMPLATE, status_class="success", icon="✓", title="ยืนยันอีเมลสำเร็จ!", message="คุณสามารถปิดหน้าต่างนี้และกลับไปเข้าสู่ระบบที่หน้าเว็บได้แล้วครับ")
        else:
            return render_template_string(VERIFY_HTML_TEMPLATE, status_class="error", icon="✗", title="ไม่พบผู้ใช้งาน", message="ระบบไม่พบข้อมูลผู้ใช้งานนี้ในระบบ")

    except SignatureExpired:
        return render_template_string(VERIFY_HTML_TEMPLATE, status_class="error", icon="⏱", title="ลิงก์หมดอายุแล้ว!", message="กรุณาสมัครสมาชิกใหม่อีกครั้ง")
    except Exception as e:
        return render_template_string(VERIFY_HTML_TEMPLATE, status_class="error", icon="⚠️", title="เกิดข้อผิดพลาด", message="รหัส Token ไม่ถูกต้องหรือเกิดข้อผิดพลาดบางประการ")

@app.route('/', methods=['GET'])
def home():
    return jsonify({'status': 'online', 'message': 'API สำหรับ SQL Server กำลังทำงาน!'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
