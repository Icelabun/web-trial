from flask import current_app, render_template
from flask_mail import Message
from app import mail
from threading import Thread
import jwt
from datetime import datetime, timedelta

def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)

def send_email(subject, sender, recipients, text_body, html_body):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = text_body
    msg.html = html_body
    Thread(target=send_async_email, args=(current_app._get_current_object(), msg)).start()

def send_password_reset_email(user):
    token = user.get_reset_password_token()
    send_email(
        '[StudyZone] Reset Your Password',
        sender=current_app.config['MAIL_USERNAME'],
        recipients=[user.email],
        text_body=render_template('email/reset_password.txt', user=user, token=token),
        html_body=render_template('email/reset_password.html', user=user, token=token)
    )

def send_verification_email(user):
    token = jwt.encode(
        {
            'verify_email': user.email,
            'exp': datetime.utcnow() + timedelta(days=7)
        },
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    send_email(
        '[StudyZone] Verify Your Email',
        sender=current_app.config['MAIL_USERNAME'],
        recipients=[user.email],
        text_body=render_template('email/verify_email.txt', user=user, token=token),
        html_body=render_template('email/verify_email.html', user=user, token=token)
    )
