# 🧠 AI Quiz App

An interactive and visually rich **AI-powered quiz application** built with **FastAPI (Python)** for the backend and **HTML, CSS, and JavaScript** for the frontend.  
It dynamically generates multiple-choice questions using **Google Gemini API**, analyzes performance with charts, and exports a **detailed PDF report** — all in a minimal, elegant UI.

---

## 🚀 Features

- 🤖 **AI Question Generation** — Uses Google Gemini to create fresh questions on demand.
- 📶 **Offline Mode (Fallback)** — Automatically switches to preloaded question sets if AI fails.
- ⏱️ **Real-time Timer** — Tracks your quiz duration dynamically.
- 📊 **Smart Analytics Dashboard** — Displays correct vs wrong stats with colorful charts.
- 📄 **PDF Report Export** — Download your quiz report with feedback and charts.
- 🌙 **Light & Dark Theme** — Elegant theme toggle for personalized experience.
- 🧩 **Fully Responsive UI** — Designed for both desktop and mobile devices.

---

## 🏗️ Project Structure

```bash
ai-quiz-app/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── ai_service.py
│   │   ├── fallback_service.py
│   │   ├── models.py
│   │   └── preload_questions.json
│   ├── .env
│   ├── requirements.txt
│   └── README.md (this file)
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── .gitignore
└── README.md
```

🧰 Technologies Used
🖥️ Frontend
```
HTML5

CSS3 (with glassmorphism and transitions)

Vanilla JavaScript (ES6+)

Chart.js (for analytics visualization)

jsPDF (for PDF report generation)
```
⚙️ Backend
```
FastAPI (Python Web Framework)

Uvicorn (ASGI Server)

Pydantic (Data validation)

Python-dotenv (Environment variable management)

Google Generative AI SDK (google-generativeai)
```
☁️ Deployment
```
Frontend: Netlify

Backend: Render or Railway
```
⚙️ Installation & Setup Guide
1️⃣ Clone the Repository
bash
```
git clone https://github.com/your-username/ai-quiz-app.git
cd ai-quiz-app
```
2️⃣ Backend Setup (FastAPI + Gemini)
bash
```
cd backend
python -m venv venv
venv\Scripts\activate      # For Windows
# or
source venv/bin/activate   # For macOS/Linux

pip install -r requirements.txt
```
Create a .env file in the backend directory:
bash
```
GEMINI_API_KEY=your_google_gemini_api_key_here
```
Run the FastAPI server:

bash
```
uvicorn app.main:app --reload
```
The backend will start at:
➡️ http://127.0.0.1:8000

3️⃣ Frontend Setup
Navigate to the frontend folder and open the app in your browser:

bash
```
cd frontend
You can serve it locally using Python’s built-in server:
```
bash
```
python -m http.server 8001
```
Then visit:
➡️ http://127.0.0.1:8001

Make sure your backend is running first.

🔌 Environment Variables
Create a .env file in the backend with the following key:

bash
```
# backend/.env
GEMINI_API_KEY=your_gemini_api_key
```
⚠️ Note: Do not commit this .env file to GitHub.
Use .env.example for reference if needed.

🧾 API Endpoints
```
🔹 Generate Questions (POST)
URL: /api/generate-questions
```
Request:
```
typescript
Copy code
{
  "category": "Science",
  "difficulty": "medium",
  "numQuestions": 10,
  "useAI": true
}
```
Response:
```
typescript
Copy code
{
  "source": "ai",
  "questions": [
    {
      "questionText": "What is the chemical symbol for water?",
      "options": ["H2O", "O2", "CO2", "H2"],
      "correctIndex": 0
    }
  ]
}
```
🔹 Score Quiz (POST)
```
URL: /api/score-quiz
```
Request:
```
typescript
Copy code
{
  "questions": [...],
  "userAnswers": [0, 1, 2, 3]
}
```
Response:
```
typescript
Copy code
{
  "totalQuestions": 10,
  "correctCount": 7,
  "wrongCount": 3,
  "scorePercent": 70.0
}
```
📊 Analytics Dashboard

- Displays Donut Chart for correct vs wrong.

- Displays Bar Chart for performance summary.

- Lists Question Review section with:

- User answers

- Correct answers

- Visual feedback (✔️ or ❌)

- Users can also download the entire report as a PDF, which includes:

- Score summary

- Charts

- Detailed question review

📦 requirements.txt
```
txt
Copy code
fastapi==0.115.0
uvicorn[standard]==0.30.1
google-generativeai==0.8.3
pydantic==2.8.2
python-dotenv==1.0.1
requests==2.32.3
reportlab==4.2.4
Pillow==10.4.0
fastapi-cors==0.2.0
matplotlib==3.9.2
```
# 🌍 Deployment Guide
```
🚀 Frontend (Netlify)
```
```
Log in to Netlify

Click “New Site from Git”

Connect your GitHub repository

Set build directory to frontend

Deploy — your app will get a public URL like:
arduino
Copy code
https://ai-quiz-app.netlify.app
⚙️ Backend (Render)
Log in to Render

Create a new Web Service

Connect your GitHub repo

Select the /backend folder

Set:

Build Command: pip install -r requirements.txt

Start Command: uvicorn app.main:app --host 0.0.0.0 --port 10000
```
```
Add environment variable:

ini
Copy code
GEMINI_API_KEY=your_gemini_api_key
```
# 📸 Screenshots

Setup Page	Quiz Screen	Analytics Dashboard

🧠 Key Learnings
```
Integration of AI models (Gemini) into interactive apps.

Building RESTful APIs using FastAPI.

Handling async data fetches in JavaScript.

Generating dynamic PDF reports using jsPDF.

Hosting full-stack apps with Netlify + Render.
```
# 👨‍💻 Author
```
Piyush Kumar
B.Tech CSE — ABES Engineering College

Passionate about AI, innovation, and creating smart engineering solutions.
```
# 🪪 License
```
This project is licensed under the MIT License — free to use and modify.
```
# ⭐ How to Contribute
```
Fork the repository

Create a new branch: git checkout -b feature-name

Commit your changes: git commit -m "Added new feature"

Push to your fork: git push origin feature-name

Create a Pull Request
```
# 💬 Support
```
If you found this project useful, consider giving it a ⭐ on GitHub!
For any issues, open an Issue.
```


