Web UI:
* Hosted on Render
* locally, run `gunicorn app:app`
* connected to Render via Github
* tests by running npx karma start

## 'Render' deployment
* python requirements
  * `poetry export -f requirements.txt --output requirements.txt`
* DB Setup
  * DB is hosted on Render
  * Had to SSH into the webserver to run initialize_db.py to set it up
  * Credentials for internal and external connections are on Render
* Modal AUTH
  * Added MODAL_TOKEN_ID and MODAL_TOKEN_SECRET to Render ENV vars

## How did I set tests up?
* npm install karma karma-jasmine karma-chrome-launcher angular-mocks --save-dev
* npx karma init