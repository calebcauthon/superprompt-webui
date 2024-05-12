import time
from flask import Flask, render_template, jsonify, request
from libs.db_models import db, Submission, OutputDocument
from datetime import datetime
import hashlib
import requests
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///your-database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

app.jinja_env.variable_start_string = '[['
app.jinja_env.variable_end_string = ']]'

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/results/<uuid>')
def results(uuid):
    return render_template('results.html', uuid=uuid)

@app.route('/view-all')
def view_all():
    submissions = Submission.query.all()
    output_documents = OutputDocument.query.all()
    
    submissions_table = "<table border='1'><tr><th>ID</th><th>Description</th><th>Must Haves</th><th>Supporting Text</th><th>User ID</th><th>Timestamp</th><th>UUID</th></tr>"
    for submission in submissions:
        submissions_table += f"<tr><td>{submission.id}</td><td>{submission.description}</td><td>{submission.must_haves}</td><td>{submission.supporting_text}</td><td>{submission.user_id}</td><td>{submission.timestamp}</td><td>{submission.uuid}</td></tr>"
    submissions_table += "</table>"

    output_documents_table = "<table border='1'><tr><th>ID</th><th>Submission ID</th><th>Output</th></tr>"
    for document in output_documents:
        output_documents_table += f"<tr><td>{document.id}</td><td>{document.submission_id}</td><td>{document.output}</td></tr>"
    output_documents_table += "</table>"

    return f"<h1>Submissions</h1>{submissions_table}<h1>Output Documents</h1>{output_documents_table}"


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
def build():
    data = request.json
    description, must_haves, supporting_text, user_id, other_outputs = extract_data(data)
    uuid = generate_uuid(description, must_haves, supporting_text, user_id)
    submission = create_submission(description, must_haves, supporting_text, user_id, uuid)
    create_output_document(submission.id, description, must_haves, other_outputs, supporting_text)
    return jsonify({"uuid": uuid}), 200

def extract_data(data):
    description = data.get('description_input')
    must_haves = data.get('must_haves_input')
    supporting_text = data.get('supporting_text_input')
    user_id = data.get('user_id')
    other_outputs = data.get('other_outputs')
    return description, must_haves, supporting_text, user_id, other_outputs

def generate_uuid(description, must_haves, supporting_text, user_id):
    unique_string = f"{description}{must_haves}{supporting_text}{user_id}{datetime.utcnow()}"
    return hashlib.sha256(unique_string.encode()).hexdigest()

def create_submission(description, must_haves, supporting_text, user_id, uuid):
    submission = Submission(
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

def create_output_document(submission_id, prompt, criteria, other_outputs, supporting_text):
    def fetch_generated_output():
        url = "https://calebcauthon--example-get-started-generate-document-dev.modal.run"
        payload = {
            "prompt": prompt,
            "criteria": criteria,
            "other_outputs": other_outputs,
            "supporting_text": supporting_text
        }
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            return "Failed to fetch generated output"

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
