console.log("script.js loaded");

const API_BASE_URL = "https://mini-project-quiz-app.onrender.com/api";

// sections
const landingSection = document.getElementById("landingSection");
const setupSection = document.getElementById("setupSection");
const quizSection = document.getElementById("quizSection");
const analyticsSection = document.getElementById("analyticsSection");

// controls
const startQuizBtn = document.getElementById("startQuizBtn");
const generateBtn = document.getElementById("generateBtn");
const submitBtn = document.getElementById("submitBtn");
const retakeBtn = document.getElementById("retakeBtn");
const homeBtn = document.getElementById("homeBtn");

// setup inputs (UPDATED IDS)
const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");
const useAICheckbox = document.getElementById("useAiToggle");

// quiz elements
const loading = document.getElementById("loading");
const quizContainer = document.getElementById("quizSection");
const questionList = document.getElementById("questionList");
const quizCategoryLabel = document.getElementById("quizCategoryLabel");
const quizDifficultyLabel = document.getElementById("quizDifficultyLabel");
const timerLabel = document.getElementById("timerLabel");

// analytics elements
const scoreSummary = document.getElementById("scoreSummary");
const timeTakenText = document.getElementById("timeTakenText");
const accuracyText = document.getElementById("accuracyText");
const reviewContainer = document.getElementById("reviewContainer");
const reviewList = document.getElementById("reviewList");

const scoreDonutCanvas = document.getElementById("scoreDonutChart");
const scoreBarCanvas = document.getElementById("scoreBarChart");
const metricCorrect = document.getElementById("metricCorrect");
const metricWrong = document.getElementById("metricWrong");
const metricTotal = document.getElementById("metricTotal");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

// theme toggle
const themeToggleBtn = document.getElementById("themeToggleBtn");

let currentQuestions = [];
let quizStartTime = null;
let timerInterval = null;
let scoreBarChartInstance = null;
let scoreDonutChartInstance = null;
let lastUserAnswers = [];

// ---------- navigation helpers ----------
function showSection(section) {
  landingSection.classList.add("hidden");
  setupSection.classList.add("hidden");
  quizSection.classList.add("hidden");
  analyticsSection.classList.add("hidden");
  section.classList.remove("hidden");
}

// landing -> setup
startQuizBtn.addEventListener("click", () => {
  showSection(setupSection);
});

// analytics -> setup
retakeBtn.addEventListener("click", () => {
  showSection(setupSection);
});

// analytics -> landing
homeBtn.addEventListener("click", () => {
  showSection(landingSection);
});

// ---------- generate quiz ----------
generateBtn.addEventListener("click", async () => {
  const category = categorySelect.value;
  const difficulty = difficultySelect.value;
  const useAI = useAICheckbox.checked;

  if (loading) loading.classList.remove("hidden");
  questionList.innerHTML = "";
  currentQuestions = [];
  clearTimer();

  try {
    const payload = {
      category: categorySelect.value,
      difficulty: difficultySelect.value,
      numQuestions: 10,
      useAI: useAI,
    };

    const response = await fetch(`${API_BASE_URL}/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch questions");
    }

    const data = await response.json();
    currentQuestions = data.questions || [];
    if (loading) loading.classList.add("hidden");

    if (currentQuestions.length === 0) {
      alert("No questions returned from backend.");
      return;
    }

    // set quiz header info
    quizCategoryLabel.textContent = `Category: ${category}`;
    quizDifficultyLabel.textContent = `Difficulty: ${capitalize(difficulty)}`;

    // render MCQs
    renderQuestions(currentQuestions);

    // show quiz full-screen section
    showSection(quizSection);

    // start timer
    quizStartTime = Date.now();
    startTimer();
  } catch (err) {
    console.error(err);
    if (loading) loading.classList.add("hidden");
    alert("Failed to fetch questions. Make sure backend is running.");
  }
});

function renderQuestions(questions) {
  questionList.innerHTML = "";

  questions.forEach((q, index) => {
    const li = document.createElement("li");

    const qText = document.createElement("p");
    qText.innerHTML = `${index + 1}. ${q.questionText}`;
    li.appendChild(qText);

    q.options.forEach((opt, optIndex) => {
      const label = document.createElement("label");
      label.className = "option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `q${index}`;
      radio.value = optIndex;

      label.appendChild(radio);
      label.appendChild(document.createTextNode(" " + opt));

      li.appendChild(label);
    });

    questionList.appendChild(li);
  });
    if (window.MathJax) {
        MathJax.typeset();
}
}

// ---------- submit quiz & analytics ----------
submitBtn.addEventListener("click", async () => {
  if (currentQuestions.length === 0) {
    alert("Please generate a quiz first.");
    return;
  }

  // collect user answers (index of selected option, or -1 if none)
  const userAnswers = currentQuestions.map((_, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    return selected ? parseInt(selected.value, 10) : -1;
  });

  // simple validation: warn if many unanswered
  const unansweredCount = userAnswers.filter((v) => v === -1).length;
  if (unansweredCount > 0) {
    const proceed = confirm(
      `You have not answered ${unansweredCount} question(s). Do you still want to submit?`
    );
    if (!proceed) return;
  }

  lastUserAnswers = userAnswers.slice(); // store for review

  const timeTakenMs = quizStartTime ? Date.now() - quizStartTime : 0;
  clearTimer();

  try {
    const payload = {
      questions: currentQuestions,
      userAnswers: userAnswers,
    };

    const response = await fetch(`${API_BASE_URL}/score-quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to score quiz");
    }

    const data = await response.json();
    console.log("Score response:", data);

    // render analytics + review
    renderAnalytics(data, timeTakenMs);

    // show analytics section
    showSection(analyticsSection);
  } catch (err) {
    console.error(err);
    alert("Failed to score quiz.");
  }
});

function renderAnalytics(result, timeTakenMs) {
  const seconds = Math.round(timeTakenMs / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeText =
    seconds === 0
      ? "Time taken: Not recorded"
      : `Time taken: ${mins} min ${secs} sec`;

  const accuracy =
    result.totalQuestions > 0
      ? (result.correctCount / result.totalQuestions) * 100
      : 0;

  scoreSummary.textContent = `You scored ${result.correctCount} out of ${
    result.totalQuestions
  } (${result.scorePercent.toFixed(2)}%).`;
  timeTakenText.textContent = timeText;
  accuracyText.textContent = `Accuracy: ${accuracy.toFixed(2)}%.`;

  metricCorrect.textContent = result.correctCount;
  metricWrong.textContent = result.wrongCount;
  metricTotal.textContent = result.totalQuestions;

  // ----- Donut chart (correct vs wrong) -----
  if (scoreDonutChartInstance) {
    scoreDonutChartInstance.destroy();
  }

  scoreDonutChartInstance = new Chart(scoreDonutCanvas, {
    type: "doughnut",
    data: {
      labels: ["Correct", "Wrong"],
      datasets: [
      {
        data: [result.correctCount, result.wrongCount],
        backgroundColor: ["#22c55e", "#f97373"],
      
        borderWidth: 6,          
        borderColor: "transparent",
        spacing: 2,              
        borderRadius: 8,         
        hoverOffset: 6
      },
      ],
    },
  options: {
    cutout: "72%",            
    animation: {
      animateScale: true
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 10,
          padding: 14,
          font: {
            size: 12
          },
        },
      },
      tooltip: {
        padding: 10,
        cornerRadius: 8
      },
    },
  },

  });

  // ----- Bar chart -----
  if (scoreBarChartInstance) {
    scoreBarChartInstance.destroy();
  }

  scoreBarChartInstance = new Chart(scoreBarCanvas, {
    type: "bar",
    data: {
      labels: ["Correct", "Wrong"],
      datasets: [
      {
        label: "Questions",
        data: [result.correctCount, result.wrongCount],
        backgroundColor: ["#4f46e5", "#6366f1"],
      
        barThickness: 20,       
        maxBarThickness: 24,    
        categoryPercentage: 0.6,
        barPercentage: 0.6,     
        borderRadius: 6         
      },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });

  // ----- build review list -----
  reviewList.innerHTML = "";
  currentQuestions.forEach((q, idx) => {
    const li = document.createElement("li");
    li.className = "review-item";

    const qText = document.createElement("div");
    qText.className = "review-question";
    qText.textContent = `${idx + 1}. ${q.questionText}`;
    li.appendChild(qText);

    const userIdx = lastUserAnswers[idx];
    const correctIdx = q.correctIndex;

    const userAns = document.createElement("div");
    userAns.className = "review-answer";

    if (userIdx === -1) {
      userAns.innerHTML = `<span class="wrong">Your answer: Not answered</span>`;
    } else if (userIdx === correctIdx) {
      userAns.innerHTML = `<span class="correct">Your answer: ${
        q.options[userIdx]
      } (Correct)</span>`;
    } else {
      userAns.innerHTML = `<span class="wrong">Your answer: ${
        q.options[userIdx]
      } (Wrong)</span>`;
    }

    const correctAns = document.createElement("div");
    correctAns.className = "review-answer";
    correctAns.innerHTML = `<span>Correct answer: <strong>${
      q.options[correctIdx]
    }</strong></span>`;

    li.appendChild(userAns);
    li.appendChild(correctAns);

    reviewList.appendChild(li);
  });

  reviewContainer.classList.remove("hidden");
}

// ---------- theme toggle ----------
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggleBtn.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    themeToggleBtn.textContent = "🌙";
  }
}

// Load saved theme
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

// On click toggle
themeToggleBtn.addEventListener("click", () => {
  const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(newTheme);
  localStorage.setItem("theme", newTheme);
});

// ---------- timer helpers ----------
function startTimer() {
  updateTimerLabel(0);
  timerInterval = setInterval(() => {
    if (!quizStartTime) return;
    const diff = Date.now() - quizStartTime;
    updateTimerLabel(diff);
  }, 1000);
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerLabel.textContent = "";
}

function updateTimerLabel(ms) {
  const totalSec = Math.floor(ms / 1000);
  const mins = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const secs = String(totalSec % 60).padStart(2, "0");
  timerLabel.textContent = `Time: ${mins}:${secs}`;
}

// ---------- util ----------
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------- Download analytics as PDF (safe download) ----------
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener("click", () => {
    console.log("Download PDF clicked");

    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("PDF library not loaded. Check jspdf script tag.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = 16;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Quiz Report", pageWidth / 2, y, { align: "center" });
    y += 8;

    // Summary
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(scoreSummary.textContent || "", 14, y);
    y += 6;
    doc.text(timeTakenText.textContent || "", 14, y);
    y += 6;
    doc.text(accuracyText.textContent || "", 14, y);
    y += 10;

    // Charts
    const chartHeight = 55;
    const chartWidth = (pageWidth - 14 * 2 - 8) / 2;

    if (scoreDonutChartInstance) {
      const donutImg = scoreDonutChartInstance.toBase64Image();
      doc.addImage(donutImg, "PNG", 14, y, chartWidth, chartHeight);
    }
    if (scoreBarChartInstance) {
      const barImg = scoreBarChartInstance.toBase64Image();
      doc.addImage(barImg, "PNG", 14 + chartWidth + 8, y, chartWidth, chartHeight);
    }

    y += chartHeight + 10;
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 16;
    }

    // Question review
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Question Review", 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const marginLeft = 14;
    const contentWidth = pageWidth - marginLeft * 2;

    currentQuestions.forEach((q, index) => {
      const questionText = `${index + 1}. ${q.questionText}`;
      const userIdx = lastUserAnswers[index];
      const correctIdx = q.correctIndex;

      const yourAnswer = userIdx === -1 ? "Not answered" : q.options[userIdx];
      const correctAnswer = q.options[correctIdx];
      const status =
        userIdx === -1
          ? "Not answered"
          : userIdx === correctIdx
          ? "Correct"
          : "Wrong";

      const questionLines = doc.splitTextToSize(questionText, contentWidth);
      const neededHeight = questionLines.length * 4 + 12;

      if (y + neededHeight > pageHeight - 20) {
        doc.addPage();
        y = 16;
      }

      doc.text(questionLines, marginLeft, y);
      y += questionLines.length * 4;

      doc.text(
        `Your answer: ${yourAnswer} (${status})`,
        marginLeft + 4,
        y
      );
      y += 4;

      doc.text(`Correct answer: ${correctAnswer}`, marginLeft + 4, y);
      y += 6;
    });

    // Instead of saving directly, make it open in browser as Blob
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "quiz-report.pdf";
    link.click();

    // Cleanup
    URL.revokeObjectURL(pdfUrl);
  });
}
