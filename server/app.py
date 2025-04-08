from flask import Flask, request, jsonify, render_template, send_from_directory
import pickle
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
from flask_cors import CORS
import os

# Define path to frontend
FRONTEND_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))

app = Flask(__name__, static_folder=FRONTEND_FOLDER, static_url_path='')
CORS(app)

# Download NLTK resources
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('stopwords')


# Load models
def load_models():
    with open('models/tfidf_vectorizer.pkl', 'rb') as f:
        tfidf_vectorizer = pickle.load(f)

    with open('models/rf_model.pkl', 'rb') as f:
        rf_model = pickle.load(f)

    with open('models/tokenizer.pkl', 'rb') as f:
        tokenizer = pickle.load(f)

    # Load the LSTM model
    lstm_model = tf.keras.models.load_model('models/lstm_model')

    return tfidf_vectorizer, rf_model, tokenizer, lstm_model

# Load all models
tfidf_vectorizer, rf_model, tokenizer, lstm_model = load_models()

# Text preprocessing function
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\d+', '', text)
    tokens = word_tokenize(text)
    stop_words = set(stopwords.words('english'))
    tokens = [word for word in tokens if word not in stop_words]
    stemmer = PorterStemmer()
    tokens = [stemmer.stem(word) for word in tokens]
    text = ' '.join(tokens)
    return text

# Prediction function
def predict_news(text, model_type='rf'):
    processed = preprocess_text(text)

    if model_type == 'rf':
        text_tfidf = tfidf_vectorizer.transform([processed])
        pred = rf_model.predict(text_tfidf)[0]
        prob = float(rf_model.predict_proba(text_tfidf)[0][1])

    elif model_type == 'lstm':
        max_len = 200
        text_seq = tokenizer.texts_to_sequences([processed])
        text_pad = pad_sequences(text_seq, maxlen=max_len, padding='post')
        prob = float(lstm_model.predict(text_pad)[0][0])
        pred = 1 if prob >= 0.5 else 0

    return {
        'prediction': 'TRUE' if pred == 1 else 'FAKE',
        'probability': prob,
        'confidence': prob if pred == 1 else 1 - prob
    }

# Route for the main page
@app.route('/')
def index():
    return send_from_directory(FRONTEND_FOLDER, 'index.html')

# API endpoint for predictions
@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    text = data.get('text', '')
    model_type = data.get('model', 'rf')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    result = predict_news(text, model_type)
    return jsonify(result)

# API endpoint for model statistics
@app.route('/api/stats', methods=['GET'])
def get_stats():
    # Mock statistics that would normally come from your model evaluation
    return jsonify({
        'models': {
            'rf': {
                'accuracy': 0.962,
                'precision': 0.953,
                'recall': 0.971,
                'f1': 0.962
            },
            'lstm': {
                'accuracy': 0.949,
                'precision': 0.938,
                'recall': 0.962,
                'f1': 0.95
            }
        },
        'features': {
            'names': ["fake", "breaking", "shocking", "conspiracy", "sources",
                     "claim", "allegedly", "evidence", "experts", "scientific"],
            'importance': [0.085, 0.072, 0.065, 0.061, 0.058, 0.051, 0.048, 0.045, 0.042, 0.038]
        }
    })

if __name__ == '__main__':
    app.run(debug=True)
