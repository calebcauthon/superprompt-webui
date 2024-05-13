from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(500), nullable=False)
    must_haves = db.Column(db.String(500), nullable=True)
    supporting_text = db.Column(db.String(1000), nullable=True)
    user_id = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    uuid = db.Column(db.String(64), unique=True, nullable=False)
    #template_type = db.Column(db.String(64), nullable=True)

class OutputDocument(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submission.id'), nullable=False)
    output = db.Column(db.Text, nullable=False)

class SavedSetup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    setup_data = db.Column(db.Text, nullable=False)  # JSON structure
    timestamp = db.Column(db.DateTime, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(255), nullable=False)

