from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, current_user, login_required
from app.auth import auth_bp
from app.models import User, db
from app.auth.forms import LoginForm, RegistrationForm, ResetPasswordRequestForm, ResetPasswordForm
from app.auth.email import send_password_reset_email, send_verification_email
from app import bcrypt
from datetime import datetime
import jwt
from functools import wraps
import json

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.args.get('token')
        if not token:
            token = request.headers.get('Authorization')
            if token and token.startswith('Bearer '):
                token = token.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        data = request.get_json()
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['firstName'],
            last_name=data['lastName'],
            is_teacher=data.get('isTeacher', False)
        )
        user.set_password(data['password'])
        
        # Add user to database
        db.session.add(user)
        db.session.commit()
        
        # Send verification email
        send_verification_email(user)
        
        return jsonify({
            'message': 'Registration successful! Please check your email to verify your account.',
            'user_id': user.id
        }), 201
    
    return render_template('auth/register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            if not user.is_verified:
                return jsonify({'error': 'Please verify your email first'}), 401
            
            login_user(user, remember=data.get('remember', False))
            
            # Generate token
            token = jwt.encode(
                {'user_id': user.id, 'exp': datetime.utcnow() + timedelta(days=1)},
                app.config['SECRET_KEY'],
                algorithm='HS256'
            )
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_teacher': user.is_teacher
                }
            }), 200
        
        return jsonify({'error': 'Invalid email or password'}), 401
    
    return render_template('auth/login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/verify/<token>')
def verify_email(token):
    try:
        email = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])['verify_email']
        user = User.query.filter_by(email=email).first()
        if user:
            user.is_verified = True
            db.session.commit()
            flash('Your email has been verified! You can now log in.', 'success')
            return redirect(url_for('auth.login'))
    except:
        flash('The verification link is invalid or has expired.', 'error')
    
    return redirect(url_for('main.index'))

@auth_bp.route('/reset-password-request', methods=['GET', 'POST'])
def reset_password_request():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        if user:
            send_password_reset_email(user)
        return jsonify({
            'message': 'Check your email for instructions to reset your password'
        }), 200
    
    return render_template('auth/reset_password_request.html')

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    user = User.verify_reset_password_token(token)
    if not user:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        data = request.get_json()
        user.set_password(data['password'])
        db.session.commit()
        return jsonify({'message': 'Your password has been reset'}), 200
    
    return render_template('auth/reset_password.html')

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json()
    if not current_user.check_password(data['old_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    current_user.set_password(data['new_password'])
    db.session.commit()
    return jsonify({'message': 'Password updated successfully'}), 200

@auth_bp.route('/profile', methods=['GET', 'PUT'])
@login_required
def profile():
    if request.method == 'PUT':
        data = request.get_json()
        current_user.username = data.get('username', current_user.username)
        current_user.first_name = data.get('firstName', current_user.first_name)
        current_user.last_name = data.get('lastName', current_user.last_name)
        
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                current_user.profile_image = filename
        
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'username': current_user.username,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'profile_image': current_user.profile_image
            }
        }), 200
    
    return jsonify({
        'username': current_user.username,
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'email': current_user.email,
        'profile_image': current_user.profile_image,
        'is_teacher': current_user.is_teacher,
        'created_at': current_user.created_at.isoformat()
    })
