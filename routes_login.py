from flask import Blueprint, jsonify, render_template, request, redirect, url_for
from flask_login import login_required, current_user, login_user, logout_user
from flask_sqlalchemy import SQLAlchemy
from libs.db_models import db, User

# Create a Blueprint
login_routes = Blueprint('login_routes', __name__)

# Define a route
@login_routes.route('/login', methods=['GET'])
def login():
    return render_template('login.html')

@login_routes.route('/profile')
@login_required
def profile():
    return render_template('profile.html', user=current_user)

@login_routes.route('/save_profile', methods=['POST'])
@login_required
def save_profile():
    user_data = request.json
    user = current_user
    if 'username' in user_data:
        user.username = user_data['username']
    if 'email' in user_data:
        user.email = user_data['email']
    if 'password' in user_data:
        user.set_password(user_data['password'])
    db.session.commit()
    return jsonify({"message": "Profile updated successfully"}), 200

@login_routes.route('/login', methods=['POST'])
def login_post():
    data = request.get_json()
    username = data['username']
    password = data['password']
    user = User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password):
        response = jsonify({"error": "Invalid username or password"})
        response.status_code = 401
        return response
    login_user(user)
    return jsonify({"message": "Logged in successfully"}), 200

@login_routes.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login_routes.login'))
