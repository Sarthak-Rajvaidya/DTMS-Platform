let currentScore = 0;

// ===============================
// CORE READINESS LOGIC
// ===============================

/**
 * Calculates the overall readiness score based on:
 * - 4 Courses (10% each = 40%)
 * - 4 Simulations (10% each = 40%)
 * - Final Quiz (20%)
 */
/**
 * Updates all UI components related to the readiness score using data from backend
 */
function updateDashboardUI(data) {
    const score = data.overall_progress || 0;
    
    // 1. Main Progress Bar (Hero Section)
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = score + '%';
        progressBar.innerText = score + '%';
        
        progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
        if (score < 30) progressBar.classList.add('bg-danger');
        else if (score < 70) progressBar.classList.add('bg-warning');
        else progressBar.classList.add('bg-success');
    }

    // 2. Readiness Percentage Text (Hero Section)
    const readinessText = document.querySelector('.text-success.fw-bold');
    if (readinessText) {
        readinessText.innerText = score + '%';
    }

    // 3. Readiness Level Label (Hero Section)
    const levelData = getReadinessLevel(score);
    const levelLabel = document.querySelector('.bi-shield-check')?.parentElement;
    if (levelLabel) {
        levelLabel.innerHTML = `<i class="bi bi-shield-check"></i> Level: <strong class="${levelData.class}">${levelData.label}</strong>`;
    }

    // 4. Update Bottom Stats Cards
    const statsCards = document.querySelectorAll('.card');
    let modulesH3, simsH3, pendingH3;
    
    statsCards.forEach(card => {
        const text = card.innerText.toLowerCase();
        if (text.includes('modules completed')) modulesH3 = card.querySelector('h3');
        if (text.includes('simulations attempted')) simsH3 = card.querySelector('h3');
        if (text.includes('pending drills')) pendingH3 = card.querySelector('h3');
    });

    const completedCourses = data.completed_courses || {};
    // Count courses that are 100% complete
    const modulesCompleted = Object.values(completedCourses).filter(p => p >= 100).length;
    
    let simsCompleted = 0;
    if (data.drill_progress) {
        Object.values(data.drill_progress).forEach(val => {
            if (val > 0) simsCompleted++;
        });
    }

    if (modulesH3) modulesH3.innerText = modulesCompleted + '/4';
    if (simsH3) simsH3.innerText = simsCompleted + '/4';
    if (pendingH3) pendingH3.innerText = (8 - (modulesCompleted + simsCompleted));

    console.log("Dashboard UI Updated with Data:", data);
}

/**
 * Determines the preparedness level based on the score
 */
function getReadinessLevel(score) {
    if (score >= 90) return { label: "Expert Elite", class: "text-primary" };
    if (score >= 75) return { label: "Highly Prepared", class: "text-success" };
    if (score >= 50) return { label: "Intermediate", class: "text-info" };
    if (score >= 25) return { label: "Basic Awareness", class: "text-warning" };
    return { label: "Beginner", class: "text-danger" };
}

// ===============================
// INITIALIZATION
// ===============================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. User Info Display (Token remains for session)
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const usernameEl = document.getElementById('username');
        if (usernameEl) usernameEl.innerText = user.name;
        
        const userRoleEl = usernameEl?.nextElementSibling;
        if (userRoleEl) userRoleEl.innerText = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }

    // 2. Fetch Data from Database (Shifted from LocalStorage)
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/dashboard/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            if (response.ok) {
                const data = await response.json();
                updateDashboardUI(data);
            }
        } catch (error) {
            console.error("Database sync failed:", error);
        }
    } else {
        window.location.href = 'login.html';
    }
});

// ===============================
// EVENT HANDLERS
// ===============================

window.startAssessment = function () {
    window.location.href = 'quiz.html';
};

window.openModule = function (moduleName) {
    const pages = {
        'Earthquake': 'earthquake/course-earthquake.html',
        'Flood': 'flood/course-flood.html',
        'Tornado': 'tornado/course-tornado.html',
        'Wildfire': 'wildfire/course-wildfire.html'
    };

    if (pages[moduleName]) {
        window.location.href = pages[moduleName];
    } else {
        alert(`${moduleName} module coming soon!`);
    }
};

window.startSimulation = function (type) {
    const simPages = {
        'earthquake': 'earthquake/simulation-earthquake.html',
        'flood': 'flood/simulation-flood.html',
        'tornado': 'tornado/simulation-tornado.html',
        'wildfire': 'wildfire/simulation-wildfire.html'
    };

    if (simPages[type]) {
        window.location.href = simPages[type];
    } else {
        alert(`${type} simulation coming soon!`);
    }
};

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

console.log('Main Readiness Engine Initialized');
