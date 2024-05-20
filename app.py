import modal
import time
from flask import Flask, render_template, jsonify, request, redirect, url_for
from flask_login import LoginManager, login_required, UserMixin, login_user, current_user, logout_user
from libs.db_models import db, Submission, OutputDocument, SavedSetup, User
from datetime import datetime
import hashlib
import requests
import json
import os
from routes_login import login_routes

app = Flask(__name__)
app.register_blueprint(login_routes)
app.secret_key = os.getenv('FLASK_APP_SECRET_KEY', 'test')

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login_routes.login'

# User loader function
@login_manager.user_loader
def load_user(user_id):
    print(f"in load_user, user is {user_id}")
    if not user_id:
        return None
    return User.query.get(user_id)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///your-database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

app.jinja_env.variable_start_string = '[['
app.jinja_env.variable_end_string = ']]'

@app.route('/')
@login_required
def home():
    return render_template('home.html')

@app.route('/savedsetup/<int:setup_id>', methods=['DELETE'])
@login_required
def delete_saved_setup(setup_id):
    setup = SavedSetup.query.get(setup_id)
    if setup:
        if setup.user_id == current_user.id:
            db.session.delete(setup)
            db.session.commit()
            return jsonify({"message": "Setup deleted successfully"}), 200
        else:
            return jsonify({"error": "Unauthorized to delete this setup"}), 403
    else:
        return jsonify({"error": "Setup not found"}), 404

@app.route('/getSavedSetups')
@login_required
def get_saved_setups():
    setups = SavedSetup.query.filter_by(user_id=current_user.id).all()
    setups_data = [{
        'id': setup.id,
        'user_id': setup.user_id,
        'name': setup.name,
        'setup_data': json.loads(setup.setup_data),
        'timestamp': setup.timestamp.isoformat()
    } for setup in setups]
    return jsonify(setups_data)

@app.route('/savesetup', methods=['POST'])
@login_required
def save_setup():
    data = request.json
    user_id = current_user.id
    name = data.get('name', 'Default Setup Name')
    id = data.get('setup_data', {}).get('id', None)

    setup_data = json.dumps(data.get('setup_data'))
    new_setup = SavedSetup(setup_data=setup_data, user_id=user_id, name=name, timestamp=datetime.utcnow(), id=id)
    print(f"incoming id is {id}")
    if SavedSetup.query.get(id):
        existing_setup = SavedSetup.query.get(id)
        if existing_setup and existing_setup.user_id == current_user.id:
            db.session.merge(new_setup)
    else:
        print(f"id does not exist in the database")
        db.session.add(new_setup)
    db.session.commit()

    return jsonify({"message": "Setup saved successfully", "setup_id": new_setup.id}), 201

@app.route('/results/<uuid>')
def results(uuid):
    return render_template('results.html', uuid=uuid)

@app.route('/view-all')
@login_required
def view_all():
    users = User.query.filter_by(id=current_user.id).all()
    submissions = Submission.query.all()
    output_documents = OutputDocument.query.all()
    
    users_table = "<table border='1'><tr><th>ID</th><th>Username</th><th>Email</th><th>Password Hash</th><th>Is Active</th><th>Created At</th><th>Updated At</th></tr>"
    for user in users:
        users_table += f"<tr><td>{user.id}</td><td>{user.username}</td><td>{user.email}</td><td>{user.password_hash}</td><td>{user.is_active}</td><td>{user.created_at}</td><td>{user.updated_at}</td></tr>"
    users_table += "</table>"
    
    submissions_table = "<table border='1'><tr><th>ID</th><th>Description</th><th>Must Haves</th><th>Supporting Text</th><th>User ID</th><th>Timestamp</th><th>UUID</th></tr>"
    for submission in submissions:
        submissions_table += f"<tr><td>{submission.id}</td><td>{submission.description}</td><td>{submission.must_haves}</td><td>{submission.supporting_text}</td><td>{submission.user_id}</td><td>{submission.timestamp}</td><td>{submission.uuid}</td></tr>"
    submissions_table += "</table>"

    output_documents_table = "<table border='1'><tr><th>ID</th><th>Submission ID</th><th>Output</th></tr>"
    for document in output_documents:
        output_documents_table += f"<tr><td>{document.id}</td><td>{document.submission_id}</td><td>{document.output}</td></tr>"
    output_documents_table += "</table>"

    saved_setups = SavedSetup.query.filter_by(user_id=current_user.id).all()
    saved_setups_table = "<table border='1'><tr><th>ID</th><th>User ID</th><th>Name</th><th>Setup Data</th><th>Timestamp</th></tr>"
    for setup in saved_setups:
        saved_setups_table += f"<tr><td>{setup.id}</td><td>{setup.user_id}</td><td>{setup.name}</td><td>{setup.setup_data}</td><td>{setup.timestamp}</td></tr>"
    saved_setups_table += "</table>"

    return f"<h1>Users</h1>{users_table}<h1>Submissions</h1>{submissions_table}<h1>Output Documents</h1>{output_documents_table}<h1>Saved Setups</h1>{saved_setups_table}"


@app.route('/output/<uuid>')
def output_document(uuid):
    submission = Submission.query.filter_by(uuid=uuid).first()
    if submission:
        output_document = OutputDocument.query.filter_by(submission_id=submission.id).first()
        if output_document:
            return output_document.output
    else:
        return f"Bad UUID: {uuid}", 404

    return "Output document not found", 404

@app.route('/build', methods=['POST'])
@login_required
def build():
    data = request.json
    description, must_haves, supporting_text, user_id, other_outputs, template_type, selected_llm = extract_data(data)
    uuid = generate_uuid(description, must_haves, supporting_text, user_id)
    submission = create_submission(description, must_haves, supporting_text, user_id, uuid, template_type)
    create_output_document(submission.id, description, must_haves, other_outputs, supporting_text, template_type, selected_llm)
    return jsonify({"uuid": uuid}), 200

def extract_data(data):
    selected_llm = data.get('selected_llm')
    description = data.get('description_input')
    must_haves = data.get('must_haves_input')
    supporting_text = data.get('supporting_text_input')
    user_id = data.get('user_id')
    other_outputs = data.get('other_outputs')
    template_type = data.get('template_type')
    return description, must_haves, supporting_text, user_id, other_outputs, template_type, selected_llm

def generate_uuid(description, must_haves, supporting_text, user_id):
    unique_string = f"{description}{must_haves}{supporting_text}{user_id}{datetime.utcnow()}"
    return hashlib.sha256(unique_string.encode()).hexdigest()

def create_submission(description, must_haves, supporting_text, user_id, uuid, template_type):
    submission = Submission(
        #template_type=template_type,
        description=description,
        must_haves=must_haves,
        supporting_text=supporting_text,
        user_id=user_id,
        timestamp=datetime.utcnow(),
        uuid=uuid
    )
    db.session.add(submission)
    db.session.commit()
    return submission

def create_output_document(submission_id, prompt, criteria, other_outputs, supporting_text, template_type, selected_llm):
    def fetch_generated_output():
        f = modal.Function.lookup("example-get-started", "generate_document")
        
        payload = {
            "template_type": template_type,
            "prompt": prompt,
            "criteria": criteria,
            "other_outputs": other_outputs,
            "supporting_text": supporting_text,
            "selected_llm": selected_llm
        }

        return f.remote(payload)

    generated_output = fetch_generated_output()
    output_document = OutputDocument(
        submission_id=submission_id,
        output=json.dumps(generated_output)
    )

    db.session.add(output_document)
    db.session.commit()

if __name__ == "__main__":
    from flask import Flask
    app.run(debug=True, use_reloader=True)

