
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, User, JournalEntry, AiNexusChat, SupportMessage, SignalTracking

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    # This endpoint can be expanded to return more data from the 'user_dashboard' view
    return jsonify({
        "first_name": user.first_name,
        "account_equity": user.account_equity,
        "win_rate": user.win_rate,
        "pnl": user.pnl,
    }), 200

@user_bp.route('/journal', methods=['POST'])
@jwt_required()
def add_journal_entry():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    new_entry = JournalEntry(
        user_id=current_user_id,
        entry_text=data['entry_text']
    )

    db.session.add(new_entry)
    db.session.commit()

    return jsonify({"msg": "Journal entry added"}), 201

@user_bp.route('/journal', methods=['GET'])
@jwt_required()
def get_journal_entries():
    current_user_id = get_jwt_identity()
    entries = JournalEntry.query.filter_by(user_id=current_user_id).all()

    return jsonify([{"entry_text": entry.entry_text, "created_at": entry.created_at} for entry in entries]), 200


@user_bp.route('/support', methods=['POST'])
@jwt_required()
def create_support_ticket():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    new_ticket = SupportMessage(
        user_id=current_user_id,
        subject=data['subject'],
        message=data['message']
    )

    db.session.add(new_ticket)
    db.session.commit()

    return jsonify({"msg": "Support ticket created"}), 201


@user_bp.route('/support', methods=['GET'])
@jwt_required()
def get_support_tickets():
    current_user_id = get_jwt_identity()
    tickets = SupportMessage.query.filter_by(user_id=current_user_id).all()
    
    return jsonify([{
        "subject": ticket.subject,
        "message": ticket.message,
        "status": ticket.status,
        "created_at": ticket.created_at
    } for ticket in tickets]), 200

