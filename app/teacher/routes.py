from flask import jsonify, request
from flask_login import login_required, current_user
from app.teacher import teacher_bp
from app.models import (
    Course, Lesson, Assignment, Submission, User,
    Analytics, db
)
from functools import wraps
from sqlalchemy import func
from datetime import datetime, timedelta

def teacher_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_teacher:
            return jsonify({'error': 'Teacher access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@teacher_bp.route('/dashboard')
@login_required
@teacher_required
def dashboard():
    # Get teacher's courses
    courses = Course.query.filter_by(instructor_id=current_user.id).all()
    
    # Get total students
    total_students = db.session.query(func.count(distinct(Enrollment.student_id))).filter(
        Enrollment.course_id.in_([c.id for c in courses])
    ).scalar()
    
    # Get recent submissions
    recent_submissions = Submission.query.join(Assignment).join(Course).filter(
        Course.instructor_id == current_user.id
    ).order_by(Submission.submitted_at.desc()).limit(10).all()
    
    # Get average student performance
    avg_performance = db.session.query(
        func.avg(Analytics.performance_score)
    ).join(Course).filter(
        Course.instructor_id == current_user.id
    ).scalar()
    
    return jsonify({
        'courses': [{
            'id': course.id,
            'title': course.title,
            'student_count': len(course.enrollments),
            'assignment_count': len(course.assignments)
        } for course in courses],
        'total_students': total_students,
        'recent_submissions': [{
            'id': sub.id,
            'student': f'{sub.student.first_name} {sub.student.last_name}',
            'assignment': sub.assignment.title,
            'course': sub.assignment.course.title,
            'submitted_at': sub.submitted_at.isoformat()
        } for sub in recent_submissions],
        'avg_performance': avg_performance or 0
    })

@teacher_bp.route('/courses/<int:course_id>/students')
@login_required
@teacher_required
def course_students(course_id):
    course = Course.query.get_or_404(course_id)
    if course.instructor_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    students = User.query.join(Enrollment).filter(
        Enrollment.course_id == course_id
    ).all()
    
    return jsonify({
        'students': [{
            'id': student.id,
            'name': f'{student.first_name} {student.last_name}',
            'email': student.email,
            'progress': next(e.progress for e in student.enrollments 
                           if e.course_id == course_id),
            'joined_at': next(e.enrolled_at for e in student.enrollments 
                            if e.course_id == course_id).isoformat()
        } for student in students]
    })

@teacher_bp.route('/assignments/<int:assignment_id>/submissions')
@login_required
@teacher_required
def assignment_submissions(assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    if assignment.course.instructor_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    submissions = Submission.query.filter_by(assignment_id=assignment_id).all()
    
    return jsonify({
        'submissions': [{
            'id': sub.id,
            'student': f'{sub.student.first_name} {sub.student.last_name}',
            'content': sub.content,
            'submitted_at': sub.submitted_at.isoformat(),
            'grade': sub.grade,
            'feedback': sub.feedback
        } for sub in submissions]
    })

@teacher_bp.route('/submissions/<int:submission_id>/grade', methods=['POST'])
@login_required
@teacher_required
def grade_submission(submission_id):
    submission = Submission.query.get_or_404(submission_id)
    if submission.assignment.course.instructor_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    submission.grade = data['grade']
    submission.feedback = data.get('feedback')
    db.session.commit()
    
    return jsonify({'message': 'Submission graded successfully'})

@teacher_bp.route('/courses/<int:course_id>/analytics')
@login_required
@teacher_required
def course_analytics(course_id):
    course = Course.query.get_or_404(course_id)
    if course.instructor_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get average grades by assignment
    avg_grades = db.session.query(
        Assignment.title,
        func.avg(Submission.grade)
    ).join(Submission).filter(
        Assignment.course_id == course_id
    ).group_by(Assignment.title).all()
    
    # Get student performance distribution
    performance_dist = db.session.query(
        func.floor(Analytics.performance_score / 10) * 10,
        func.count()
    ).filter(
        Analytics.course_id == course_id
    ).group_by(func.floor(Analytics.performance_score / 10) * 10).all()
    
    # Get student engagement over time
    engagement = db.session.query(
        func.date(Analytics.timestamp),
        func.count(distinct(Analytics.user_id))
    ).filter(
        Analytics.course_id == course_id,
        Analytics.timestamp >= datetime.utcnow() - timedelta(days=30)
    ).group_by(func.date(Analytics.timestamp)).all()
    
    return jsonify({
        'assignment_grades': [{
            'assignment': title,
            'average_grade': float(avg_grade)
        } for title, avg_grade in avg_grades],
        'performance_distribution': [{
            'range': f'{int(score_range)}-{int(score_range + 9)}',
            'count': count
        } for score_range, count in performance_dist],
        'engagement': [{
            'date': date.isoformat(),
            'active_students': count
        } for date, count in engagement]
    })

@teacher_bp.route('/courses/<int:course_id>/announcements', methods=['POST'])
@login_required
@teacher_required
def create_announcement(course_id):
    course = Course.query.get_or_404(course_id)
    if course.instructor_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    announcement = Announcement(
        course_id=course_id,
        title=data['title'],
        content=data['content']
    )
    db.session.add(announcement)
    db.session.commit()
    
    # TODO: Send email notifications to enrolled students
    
    return jsonify({
        'message': 'Announcement created successfully',
        'announcement_id': announcement.id
    })
