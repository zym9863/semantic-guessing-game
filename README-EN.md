[中文](README.md)

# Semantic Guessing Game

A Chinese semantic guessing game based on Word2Vec, similar to Semantle.

## Introduction

The system randomly selects a target word. You need to find it by guessing words and receiving semantic similarity feedback. A higher similarity score indicates that your guess is semantically closer to the target word.

## Tech Stack

- **Backend**: Python Flask + Gensim Word2Vec
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Word Vectors**: Chinese pre-trained models

## Quick Start

### 1. Download Word Vector Model

Recommended Tencent AI Lab or other Chinese pre-trained word vectors:

- [Tencent AI Lab Embedding](https://ai.tencent.com/ailab/nlp/zh/embedding.html)
- [Chinese Word Vectors](https://github.com/Embedding/Chinese-Word-Vectors)

Place the model file in the `backend/model/` directory after downloading.

### 2. Install Dependencies

```bash
cd backend
uv sync
```

### 3. Configure Model Path

Edit `backend/app.py` and set `MODEL_PATH` to your model file path:

```python
MODEL_PATH = "models/your_model.bin"
```

Or set via environment variable:

```bash
set WORD2VEC_MODEL_PATH=path/to/your/model.bin
```

### 4. Start Backend Service

```bash
cd backend
uv run python app.py
```

### 5. Open Game

Open `frontend/index.html` in your browser.

## Project Structure

```
semantic guessing game/
├── backend/
│   ├── app.py           # Flask API Service
│   ├── game.py          # Core Game Logic
│   ├── pyproject.toml   # Python Project Configuration
│   └── models/          # Word Vector Model Directory
└── frontend/
    ├── index.html       # Game Page
    ├── styles.css       # Style File
    └── app.js           # Interaction Logic
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health Check |
| `/api/load-model` | POST | Load Model |
| `/api/new-game` | POST | Start New Game |
| `/api/guess` | POST | Submit Guess |
| `/api/hint` | GET | Get Hint |
| `/api/give-up` | POST | Give Up |
| `/api/history` | GET | Get History |

## License

MIT
