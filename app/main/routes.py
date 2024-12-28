from flask import render_template, jsonify, request, current_app
from flask_login import login_required, current_user
from app.main import main_bp
from app.models import (
    Course, Lesson, Assignment, Submission, Enrollment,
    StudyGroup, FlashcardDeck, Note, Analytics, db
)
from datetime import datetime, timedelta
import json
from sqlalchemy import func

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/dashboard')
@login_required
def dashboard():
    # Get user's courses
    if current_user.is_teacher:
        courses = Course.query.filter_by(instructor_id=current_user.id).all()
    else:
        enrollments = Enrollment.query.filter_by(student_id=current_user.id).all()
        courses = [enrollment.course for enrollment in enrollments]
    
    # Get study analytics
    analytics = Analytics.query.filter_by(
        user_id=current_user.id,
        timestamp >= datetime.utcnow() - timedelta(days=30)
    ).all()
    
    # Calculate study time and performance
    total_study_time = sum(a.study_time for a in analytics)
    avg_performance = sum(a.performance_score for a in analytics) / len(analytics) if analytics else 0
    
    # Get upcoming assignments
    if current_user.is_teacher:
        assignments = Assignment.query.join(Course).filter(
            Course.instructor_id == current_user.id,
            Assignment.due_date >= datetime.utcnow()
        ).order_by(Assignment.due_date).limit(5).all()
    else:
        assignments = Assignment.query.join(Course).join(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Assignment.due_date >= datetime.utcnow()
        ).order_by(Assignment.due_date).limit(5).all()
    
    return jsonify({
        'courses': [{
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'progress': next((e.progress for e in course.enrollments 
                            if e.student_id == current_user.id), 0)
            if not current_user.is_teacher else None
        } for course in courses],
        'analytics': {
            'total_study_time': total_study_time,
            'avg_performance': avg_performance,
            'study_sessions': len(analytics)
        },
        'upcoming_assignments': [{
            'id': assignment.id,
            'title': assignment.title,
            'course': assignment.course.title,
            'due_date': assignment.due_date.isoformat(),
            'points': assignment.points
        } for assignment in assignments]
    })

@main_bp.route('/courses')
@login_required
def courses():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category = request.args.get('category')
    difficulty = request.args.get('difficulty')
    search = request.args.get('search')
    
    query = Course.query
    
    if category:
        query = query.filter_by(category=category)
    if difficulty:
        query = query.filter_by(difficulty_level=difficulty)
    if search:
        query = query.filter(Course.title.ilike(f'%{search}%'))
    
    courses = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'courses': [{
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'instructor': {
                'id': course.instructor.id,
                'name': f'{course.instructor.first_name} {course.instructor.last_name}'
            },
            'category': course.category,
            'difficulty': course.difficulty_level,
            'enrolled_count': len(course.enrollments)
        } for course in courses.items],
        'total': courses.total,
        'pages': courses.pages,
        'current_page': courses.page
    })

@main_bp.route('/course/<int:course_id>')
@login_required
def course_details(course_id):
    course = Course.query.get_or_404(course_id)
    is_enrolled = any(e.student_id == current_user.id for e in course.enrollments)
    
    return jsonify({
        'id': course.id,
        'title': course.title,
        'description': course.description,
        'instructor': {
            'id': course.instructor.id,
            'name': f'{course.instructor.first_name} {course.instructor.last_name}'
        },
        'lessons': [{
            'id': lesson.id,
            'title': lesson.title,
            'order': lesson.order
        } for lesson in course.lessons],
        'assignments': [{
            'id': assignment.id,
            'title': assignment.title,
            'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
            'points': assignment.points
        } for assignment in course.assignments],
        'is_enrolled': is_enrolled,
        'progress': next((e.progress for e in course.enrollments 
                        if e.student_id == current_user.id), 0)
        if is_enrolled else None
    })

@main_bp.route('/study-groups')
@login_required
def study_groups():
    user_groups = StudyGroup.query.join(StudyGroupMember).filter(
        StudyGroupMember.user_id == current_user.id
    ).all()
    
    return jsonify({
        'groups': [{
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'course': group.course.title if group.course else None,
            'member_count': len(group.members),
            'max_members': group.max_members,
            'is_admin': any(m.is_admin and m.user_id == current_user.id 
                          for m in group.members)
        } for group in user_groups]
    })

@main_bp.route('/flashcards')
@login_required
def flashcards():
    user_decks = FlashcardDeck.query.filter_by(creator_id=current_user.id).all()
    public_decks = FlashcardDeck.query.filter_by(is_public=True).all()
    
    return jsonify({
        'user_decks': [{
            'id': deck.id,
            'title': deck.title,
            'description': deck.description,
            'card_count': len(deck.flashcards),
            'category': deck.category
        } for deck in user_decks],
        'public_decks': [{
            'id': deck.id,
            'title': deck.title,
            'description': deck.description,
            'creator': f'{deck.creator.first_name} {deck.creator.last_name}',
            'card_count': len(deck.flashcards),
            'category': deck.category
        } for deck in public_decks]
    })

@main_bp.route('/notes')
@login_required
def notes():
    user_notes = Note.query.filter_by(user_id=current_user.id).order_by(
        Note.updated_at.desc()
    ).all()
    
    return jsonify({
        'notes': [{
            'id': note.id,
            'title': note.title,
            'content': note.content,
            'course': note.course.title if note.course else None,
            'created_at': note.created_at.isoformat(),
            'updated_at': note.updated_at.isoformat(),
            'is_public': note.is_public
        } for note in user_notes]
    })

@main_bp.route('/analytics')
@login_required
def analytics():
    # Get study time by day
    daily_study_time = db.session.query(
        func.date(Analytics.timestamp),
        func.sum(Analytics.study_time)
    ).filter(
        Analytics.user_id == current_user.id,
        Analytics.timestamp >= datetime.utcnow() - timedelta(days=30)
    ).group_by(func.date(Analytics.timestamp)).all()
    
    # Get performance by activity type
    performance_by_type = db.session.query(
        Analytics.activity_type,
        func.avg(Analytics.performance_score)
    ).filter(
        Analytics.user_id == current_user.id,
        Analytics.timestamp >= datetime.utcnow() - timedelta(days=30)
    ).group_by(Analytics.activity_type).all()
    
    # Get study time by course
    course_study_time = db.session.query(
        Course.title,
        func.sum(Analytics.study_time)
    ).join(Analytics).filter(
        Analytics.user_id == current_user.id,
        Analytics.timestamp >= datetime.utcnow() - timedelta(days=30)
    ).group_by(Course.title).all()
    
    return jsonify({
        'daily_study_time': [{
            'date': date.isoformat(),
            'minutes': minutes
        } for date, minutes in daily_study_time],
        'performance_by_type': [{
            'type': activity_type,
            'score': score
        } for activity_type, score in performance_by_type],
        'course_study_time': [{
            'course': title,
            'minutes': minutes
        } for title, minutes in course_study_time]
    })
