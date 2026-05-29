const questions = [
    {
        q: "You feel strong shaking inside a classroom. What should you do?",
        options: [
            "Run outside immediately",
            "Drop, Cover, and Hold under a desk",
            "Stand near the windows",
            "Try to catch falling objects"
        ],
        correct: 1
    },
    {
        q: "The shaking stops. What should you do next?",
        options: [
            "Stay calm and wait for teacher instructions",
            "Rush outside immediately using stairs",
            "Run back inside to get your bag",
            "Start shouting for help"
        ],
        correct: 0
    },
    {
        q: "You are in a corridor during an earthquake. What is safest?",
        options: [
            "Stand near windows to see outside",
            "Drop, Cover, near an inner wall away from glass",
            "Use the elevator to reach the ground floor",
            "Stay near large cabinets"
        ],
        correct: 1
    },
    {
        q: "After an earthquake, what should be checked first?",
        options: [
            "Gas leaks or fire hazards",
            "Electrical switches to see if lights work",
            "Social media for updates",
            "Your parked car"
        ],
        correct: 0
    },
    {
        q: "Why should elevators not be used during earthquakes?",
        options: [
            "They might stop due to power failure or damage",
            "They are too slow for evacuation",
            "They consume too much energy",
            "The doors might open on the wrong floor"
        ],
        correct: 0
    },
    {
        q: "You are outdoors during an earthquake. What should you do?",
        options: [
            "Move to an open area away from buildings and lines",
            "Run inside the nearest building for shelter",
            "Stand under a tree or electric pole",
            "Lie down on the sidewalk near a building"
        ],
        correct: 0
    }
];

let currentQuestion = 0;
let score = 0;
let streak = 0;
let timeLeft = 10;
let timer;
let badges = [];
let isQuizEnded = false;

function startTimer() {
    if (isQuizEnded) return;
    clearInterval(timer); // Clear any existing timer first
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("time").innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeOut();
        }
    }, 1000);
}

function handleTimeOut() {
    if (isQuizEnded) return;
    streak = 0;
    document.getElementById("streak").innerText = streak;
    currentQuestion++;
    if (currentQuestion < questions.length) {
        loadQuestion();
    } else {
        endQuiz();
    }
}

function loadQuestion() {
    const q = questions[currentQuestion];
    document.getElementById("questionText").innerText = q.q;
    document.getElementById("qCount").innerText = `Q ${currentQuestion + 1}/${questions.length}`;
    document.getElementById("quizProgress").style.width = `${(currentQuestion / questions.length) * 100}%`;

    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";

    q.options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.type = "button"; // Explicitly set type to prevent form-like reloads
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(index, btn);
        optionsDiv.appendChild(btn);
    });

    timeLeft = 10;
    document.getElementById("time").innerText = timeLeft;
    startTimer();
}

async function checkAnswer(selected, btn) {
    clearInterval(timer);
    const correct = questions[currentQuestion].correct;
    const allBtns = document.querySelectorAll(".option-btn");
    
    // Disable all buttons
    allBtns.forEach(b => b.style.pointerEvents = "none");

    if (selected === correct) {
        btn.classList.add("correct");
        score += 10 + timeLeft;
        streak++;
        
        // Add streak bonus logic if needed
        if (streak >= 3) score += 5; 
    } else {
        btn.classList.add("wrong");
        allBtns[correct].classList.add("correct");
        score = Math.max(0, score - 5);
        streak = 0;
    }

    document.getElementById("score").innerText = score;
    document.getElementById("streak").innerText = streak;

    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < questions.length) {
            loadQuestion();
        } else {
            endQuiz();
        }
    }, 1200);
}

async function endQuiz() {
    if (isQuizEnded) return;
    isQuizEnded = true;
    clearInterval(timer); 
    
    document.getElementById("quizCard").classList.add("d-none");
    document.getElementById("resultCard").classList.remove("d-none");
    document.getElementById("quizProgress").style.width = "100%";

    const finalScore = score;
    document.getElementById("finalScore").innerText = finalScore;
    const rank = getRank(finalScore);
    document.getElementById("rank").innerText = rank;

    // Badges logic
    if (streak >= 5) badges.push("🔥 Streak Master");
    if (finalScore >= 80) badges.push("🛡️ Survival Expert");
    if (finalScore >= 50 && finalScore < 80) badges.push("🏅 Safety Pro");
    
    const badgeList = document.getElementById("badges");
    badgeList.innerHTML = "";
    badges.forEach(b => {
        const span = document.createElement("span");
        span.className = "badge-item";
        span.innerText = b;
        badgeList.appendChild(span);
    });

    // Submit to backend
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
        try {
            const response = await fetch("http://127.0.0.1:8000/quiz/submit", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: user.user_id,
                    score: finalScore
                })
            });
            if (response.ok) {
                console.log("Score synced to cloud!");
            }
        } catch (error) {
            console.error("Cloud sync failed:", error);
        }
    }
}

function getRank(score) {
    if (score >= 100) return "Master of Survival";
    if (score >= 70) return "Ready Responder";
    if (score >= 40) return "Trained Student";
    return "Basic Learner";
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Update Navbar Name
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && document.getElementById('navUserName')) {
        document.getElementById('navUserName').innerText = user.name || user.user_id;
    }
    
    loadQuestion();
});
