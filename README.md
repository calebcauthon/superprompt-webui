Web UI:
* Hosted on Render
* locally, run `gunicorn app:app`
* connected to Render via Github
* tests by running npx karma start

## 'Render' deployment
* requirements
  * `poetry export -f requirements.txt --output requirements.txt`

## How did I set tests up?
* npm install karma karma-jasmine karma-chrome-launcher angular-mocks --save-dev
* npx karma init