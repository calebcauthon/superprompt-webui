import time
from flask import Flask, render_template, jsonify
app = Flask(__name__)
app.jinja_env.variable_start_string = '[['
app.jinja_env.variable_end_string = ']]'

@app.route('/')
def home():
    return render_template('home.html')


@app.route('/results')
def results():
    return render_template('results.html')

@app.route('/build', methods=['POST'])
def build():
    time.sleep(0.5)  # Simulate processing delay
    return jsonify({"status": "ok"}), 200
