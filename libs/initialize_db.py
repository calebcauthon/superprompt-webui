from flask import Flask
from db_models import db

def initialize_database():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///your-database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        print("Database initialized and tables created.")

if __name__ == "__main__":
    initialize_database()
