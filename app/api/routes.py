from flask import jsonify, request
from flask_login import login_required, current_user
from app.api import api_bp
from app.models import (
    Course, Lesson, Assignment, Submission, StudyGroup,
    StudyGroupMember, FlashcardDeck, Flashcard, Note, db
)
from app.auth.routes import token_required
from datetime import datetime
import openai
import os

# Course Management
@api_bp.route('/courses', methods=['POST'])
@token_required
def create_course(current_user):
    if not current_user.is_teacher:
        return jsonify({'error': 'Only teachers can create courses'}), 403
    
    data = request.get_json()
    course = Course(
        title=data['title'],
        description=data['description'],
        instructor_id=current_user.id,
        difficulty_level=data['difficulty_level'],
        category=data['category']
    )
    db.session.add(course)
    db.session.commit()
    
    return jsonify({
        'message': 'Course created successfully',
        'course_id': course.id
    }), 201

@api_bp.route('/courses/<int:course_id>/lessons', methods=['POST'])
@token_required
def create_lesson(current_user, course_id):
    course = Course.query.get_or_404(course_id)
    if course.instructor_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    lesson = Lesson(
        title=data['title'],
        content=data['content'],
        course_id=course_id,
        order=data['order'],
        video_url=data.get('video_url')
    )
    db.session.add(lesson)
    db.session.commit()
    
    return jsonify({
        'message': 'Lesson created successfully',
        'lesson_id': lesson.id
    }), 201

# Assignment Management
@api_bp.route('/courses/<int:course_id>/assignments', methods=['POST'])
@token_required
def create_assignment(current_user, course_id):
    course = Course.query.get_or_404(course_id)
    if course.instructor_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    assignment = Assignment(
        title=data['title'],
        description=data['description'],
        course_id=course_id,
        due_date=datetime.fromisoformat(data['due_date']),
        points=data['points']
    )
    db.session.add(assignment)
    db.session.commit()
    
    return jsonify({
        'message': 'Assignment created successfully',
        'assignment_id': assignment.id
    }), 201

@api_bp.route('/assignments/<int:assignment_id>/submit', methods=['POST'])
@token_required
def submit_assignment(current_user, assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    
    if assignment.due_date and assignment.due_date < datetime.utcnow():
        return jsonify({'error': 'Assignment is past due'}), 400
    
    data = request.get_json()
    submission = Submission(
        student_id=current_user.id,
        assignment_id=assignment_id,
        content=data['content']
    )
    db.session.add(submission)
    db.session.commit()
    
    return jsonify({
        'message': 'Assignment submitted successfully',
        'submission_id': submission.id
    }), 201

# Study Group Management
@api_bp.route('/study-groups', methods=['POST'])
@token_required
def create_study_group(current_user):
    data = request.get_json()
    group = StudyGroup(
        name=data['name'],
        description=data['description'],
        max_members=data.get('max_members', 10),
        course_id=data.get('course_id')
    )
    db.session.add(group)
    
    # Add creator as admin member
    member = StudyGroupMember(
        user_id=current_user.id,
        group_id=group.id,
        is_admin=True
    )
    db.session.add(member)
    db.session.commit()
    
    return jsonify({
        'message': 'Study group created successfully',
        'group_id': group.id
    }), 201

@api_bp.route('/study-groups/<int:group_id>/join', methods=['POST'])
@token_required
def join_study_group(current_user, group_id):
    group = StudyGroup.query.get_or_404(group_id)
    
    if len(group.members) >= group.max_members:
        return jsonify({'error': 'Group is full'}), 400
    
    if any(m.user_id == current_user.id for m in group.members):
        return jsonify({'error': 'Already a member'}), 400
    
    member = StudyGroupMember(
        user_id=current_user.id,
        group_id=group_id
    )
    db.session.add(member)
    db.session.commit()
    
    return jsonify({'message': 'Joined study group successfully'}), 200

# Flashcard Management
@api_bp.route('/flashcard-decks', methods=['POST'])
@token_required
def create_flashcard_deck(current_user):
    data = request.get_json()
    deck = FlashcardDeck(
        title=data['title'],
        description=data['description'],
        creator_id=current_user.id,
        is_public=data.get('is_public', True),
        category=data.get('category')
    )
    db.session.add(deck)
    db.session.commit()
    
    return jsonify({
        'message': 'Flashcard deck created successfully',
        'deck_id': deck.id
    }), 201

@api_bp.route('/flashcard-decks/<int:deck_id>/cards', methods=['POST'])
@token_required
def create_flashcard(current_user, deck_id):
    deck = FlashcardDeck.query.get_or_404(deck_id)
    if deck.creator_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    card = Flashcard(
        front=data['front'],
        back=data['back'],
        deck_id=deck_id,
        difficulty=data.get('difficulty', 1)
    )
    db.session.add(card)
    db.session.commit()
    
    return jsonify({
        'message': 'Flashcard created successfully',
        'card_id': card.id
    }), 201

# Note Management
@api_bp.route('/notes', methods=['POST'])
@token_required
def create_note(current_user):
    data = request.get_json()
    note = Note(
        title=data['title'],
        content=data['content'],
        user_id=current_user.id,
        is_public=data.get('is_public', False),
        course_id=data.get('course_id')
    )
    db.session.add(note)
    db.session.commit()
    
    return jsonify({
        'message': 'Note created successfully',
        'note_id': note.id
    }), 201

# AI Assistant Integration
@api_bp.route('/ai/chat', methods=['POST'])
@token_required
def chat_with_ai(current_user):
    data = request.get_json()
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful study assistant."},
                {"role": "user", "content": data['message']}
            ]
        )
        
        return jsonify({
            'message': response.choices[0].message.content
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/ai/summarize', methods=['POST'])
@token_required
def summarize_text(current_user):
    data = request.get_json()
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Summarize the following text:"},
                {"role": "user", "content": data['text']}
            ]
        )
        
        return jsonify({
            'summary': response.choices[0].message.content
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/ai/generate-flashcards', methods=['POST'])
@token_required
def generate_flashcards(current_user):
    data = request.get_json()
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Generate 5 flashcards in JSON format for the following topic:"
                },
                {"role": "user", "content": data['topic']}
            ]
        )
        
        return jsonify({
            'flashcards': response.choices[0].message.content
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
