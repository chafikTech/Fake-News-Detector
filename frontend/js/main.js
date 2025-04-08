// DOM Elements
const articleTextArea = document.getElementById('articleText');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultSection = document.getElementById('resultSection');
const resultBadge = document.getElementById('resultBadge');
const resultConfidence = document.getElementById('resultConfidence');
const probabilityBar = document.getElementById('probabilityBar');
const trueNewsBtn = document.getElementById('trueNewsBtn');
const fakeNewsBtn = document.getElementById('fakeNewsBtn');
const modelRF = document.getElementById('modelRF');
const modelLSTM = document.getElementById('modelLSTM');

console.log("helloo")

// Example texts
const trueNewsExample = `The Senate on Tuesday passed legislation to keep the federal government running into December and provide $10 billion to fight the ongoing coronavirus pandemic. The funding bill passed with bipartisan support and now advances to the House of Representatives for approval.`;

const fakeNewsExample = `BREAKING: Scientists at NASA have confirmed that the Earth is actually flat and have been hiding this information for decades. The discovery was accidentally revealed during a press conference about a new space mission.`;

// API URL (change this to your Flask server URL)
const API_URL = 'http://localhost:5000';

// Event Listeners
analyzeBtn.addEventListener('click', analyzeText);
trueNewsBtn.addEventListener('click', () => {
    articleTextArea.value = trueNewsExample;
});
fakeNewsBtn.addEventListener('click', () => {
    articleTextArea.value = fakeNewsExample;
});

// Load stats on page load
document.addEventListener('DOMContentLoaded', fetchStats);

// Functions
async function analyzeText() {
    const text = articleTextArea.value.trim();

    if (!text) {
        alert('Please enter some text to analyze.');
        return;
    }

    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="animate-pulse">Analyzing...</span>';

    try {
        const model = modelRF.checked ? 'rf' : 'lstm';
        const response = await fetch(`${API_URL}/api/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, model }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        displayResult(result);
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while analyzing the text.');
    } finally {
        // Reset button state
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Article';
    }
}

function displayResult(result) {
    // Show result section
    resultSection.classList.remove('hidden');

    // Set result badge
    if (result.prediction === 'TRUE') {
        resultBadge.textContent = 'TRUE';
        resultBadge.className = 'ml-2 px-2 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800';
    } else {
        resultBadge.textContent = 'FAKE';
        resultBadge.className = 'ml-2 px-2 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800';
    }

    // Set confidence text
    resultConfidence.textContent = `Confidence: ${(result.confidence * 100).toFixed(2)}%`;

    // Set probability bar
    const probability = result.probability * 100;
    probabilityBar.style.width = `${probability}%`;

    // Set bar color based on prediction
    if (result.prediction === 'TRUE') {
        probabilityBar.className = 'h-4 rounded-full bg-green-500';
    } else {
        probabilityBar.className = 'h-4 rounded-full bg-red-500';
    }

    // Scroll to result section
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_URL}/api/stats`);

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        updateStatistics(data);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStatistics(data) {
    // Update model performance metrics
    document.getElementById('rf-accuracy').textContent = `${(data.models.rf.accuracy * 100).toFixed(1)}%`;
    document.getElementById('rf-precision').textContent = `${(data.models.rf.precision * 100).toFixed(1)}%`;
    document.getElementById('rf-recall').textContent = `${(data.models.rf.recall * 100).toFixed(1)}%`;
    document.getElementById('rf-f1').textContent = data.models.rf.f1.toFixed(3);

    document.getElementById('lstm-accuracy').textContent = `${(data.models.lstm.accuracy * 100).toFixed(1)}%`;
    document.getElementById('lstm-precision').textContent = `${(data.models.lstm.precision * 100).toFixed(1)}%`;
    document.getElementById('lstm-recall').textContent = `${(data.models.lstm.recall * 100).toFixed(1)}%`;
    document.getElementById('lstm-f1').textContent = data.models.lstm.f1.toFixed(3);

    // Update feature chart
    createFeatureChart(data.features.names, data.features.importance);
}
