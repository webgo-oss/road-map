# Road-Map AI

Road-Map AI is an AI-powered learning platform that generates structured learning roadmaps and AI-generated educational videos for any topic.

The project combines OpenAI, Flask, Manim, Node.js, and Three.js to create an interactive AI learning experience.

---

# Features

- AI-generated learning roadmaps
- Beginner, Intermediate, and Advanced learning levels
- AI educational video generation
- Automatic text-to-speech narration
- Animated videos using Manim
- Full-stack frontend + backend architecture
- Fast Flask APIs
- Dynamic roadmap generation
- Clean project structure
- 3D frontend integration using Three.js

---

# Tech Stack

## Frontend

- HTML
- CSS
- JavaScript
- EJS
- Node.js
- Express.js
- Three.js

## Backend

- Python
- Flask
- OpenAI API
- Manim
- gTTS
- Pydub

## Database & Authentication

- MySQL
- Express Session
- bcryptjs

---

# Project Structure

```plaintext
road-map/
│
├── node_frontend/
│   ├── public/
│   │   └── video_api/
│   │
│   ├── views/
│   │   ├── index.ejs
│   │   ├── dashboard.ejs
│   │   ├── form.ejs
│   │   ├── auth.ejs
│   │   └── about.ejs
│   │
│   ├── .env
│   ├── app.js
│   ├── package.json
│   └── ...
│
├── python_api/
│   ├── .env
│   ├── app.py
│   ├── video_api.py
│   └── ...
│
├── .gitignore
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/webgo-oss/road-map.git
cd road-map
```

---

# Frontend Setup

## Install Dependencies

```bash
cd node_frontend
npm install
```

---

# Frontend Environment Variables

Inside `node_frontend/`

Create:

```plaintext
.env
```

Example:

```env
PORT=3000
SESSION_SECRET=your_session_secret
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=roadmap_ai
```

---

# Run Frontend Server

```bash
node app.js
```

Frontend runs on:

```plaintext
http://localhost:3000
```

---

# Python Backend Setup

## Install Python Dependencies

```bash
pip install flask flask-cors openai python-dotenv manim gtts pydub
```

---

# Python API Environment Variables

Inside `python_api/`

Create:

```plaintext
.env
```

Add:

```env
OPENAI_API_KEY=your_openai_api_key
```

---

# Run AI Roadmap API

```bash
python app.py
```

Runs on:

```plaintext
http://localhost:7000
```

---

# Run Video Generation API

```bash
python video_api.py
```

Runs on:

```plaintext
http://localhost:7001
```

---

# AI Roadmap Generation

The platform generates structured topic roadmaps using OpenAI.

Example:

```plaintext
Topic: Machine Learning
Level: Intermediate
```

Example Output:

```plaintext
1. Python Basics
2. NumPy
3. Pandas
4. Data Visualization
5. Machine Learning Fundamentals
6. Neural Networks
7. Deep Learning
...
```

---

# AI Video Generation

Roadmap topics can automatically be converted into educational videos.

Features:

- AI narration
- Animated subtitles
- MP4 export
- Automatic synchronization
- Topic-based scenes

Generated videos are stored in:

```plaintext
node_frontend/public/video_api/
```

---
