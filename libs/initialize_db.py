from flask import Flask
from db_models import db, User

def initialize_database(uri):
    app = Flask(__name__)
    app.secret_key = 'test'
    app.config['SQLALCHEMY_DATABASE_URI'] = uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        db.drop_all()
        db.create_all()
        admin_user = User(username='admin')
        admin_user.set_password('Qwerwer5')
        db.session.add(admin_user)
        db.session.commit()
        print("Admin user created with username 'admin'.")
        print("All tables dropped and then recreated in the database.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python initialize_db.py <database_uri>")
        sys.exit(1)
    uri = sys.argv[1]
    initialize_database(uri)
