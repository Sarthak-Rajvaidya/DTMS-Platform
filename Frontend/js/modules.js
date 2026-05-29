document.addEventListener('DOMContentLoaded', async function() {
    // Initialize to show all modules
    filterModules('all');

    // Attach event listeners to filter buttons
    const filterButtons = document.querySelectorAll('#moduleTabs .nav-link');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterType = this.getAttribute('data-filter');
            
            // UI: Change active tab
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            filterModules(filterType);
        });
    });

    // Attach event listeners to interactive cards
    const moduleCards = document.querySelectorAll('.module-card[data-module]');
    moduleCards.forEach(card => {
        card.addEventListener('click', function() {
            const moduleName = this.getAttribute('data-module');
            openModule(moduleName);
        });
    });

    // Sync User Data
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (user) {
        const displayName = user.name || user.user_id || "Student";
        const navUser = document.getElementById('nav-username');
        if (navUser) navUser.innerText = displayName;
    }

    if (token) {
        try {
            const response = await fetch('http://127.0.0.1:8000/dashboard/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                
                // Update Overall Progress
                const progBar = document.getElementById('overall-progress-bar');
                const progText = document.getElementById('overall-progress-text');
                if (progBar) progBar.style.width = data.overall_progress + '%';
                if (progText) progText.innerText = data.overall_progress + '%';

                // Update Individual Module Progress
                updateProgressUI(data);
            }
        } catch (err) {
            console.error("Failed to sync modules progress:", err);
        }
    }
});

/**
 * Handles the display logic for module categories
 * @param {string} type - 'all', 'earthquake', 'other', or 'upcoming'
 */
function filterModules(type) {
    const sections = {
        'all': ['earthquakeModules', 'floodModules', 'tornadoModules', 'wildfireModules', 'otherModules', 'upcomingModules'],
        'earthquake': ['earthquakeModules'],
        'flood': ['floodModules'],
        'tornado': ['tornadoModules'],
        'wildfire': ['wildfireModules'],
        'other': ['otherModules'],
        'upcoming': ['upcomingModules']
    };
    
    // Hide all sections first
    const allSectionIds = ['earthquakeModules', 'floodModules', 'tornadoModules', 'wildfireModules', 'otherModules', 'upcomingModules'];
    allSectionIds.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
    });
    
    // Show selected sections based on type
    if (sections[type]) {
        sections[type].forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'block';
        });
    }
}

/**
 * Handles navigation or alerts for specific modules
 * @param {string} moduleName 
 */
function openModule(moduleName) {
    const pages = {
        'Earthquake': 'earthquake/course-earthquake.html?module=1',
        'Flood': 'flood/course-flood.html?module=2',
        'Tornado': 'tornado/course-tornado.html?module=3',
        'Wildfire': 'wildfire/course-wildfire.html?module=4'
    };

    if (pages[moduleName]) {
        window.location.href = pages[moduleName];
    } else {
        alert(`${moduleName} module coming soon!`);
    }
}

function updateProgressUI(data) {
    console.log("Updating Modules UI with Data:", data);
    const completedCourses = data.completed_courses || {}; // Now a dictionary {name: progress}
    const drillProgress = data.drill_progress || {};
    
    const disasterMapping = {
        'earthquake': ['eq1', 'eq2', 'eq3'],
        'flood': ['flood', 'flood2', 'flood3'],
        'tornado': ['tornado', 'tornado2', 'tornado3'],
        'wildfire': ['wildfire', 'wildfire2', 'wildfire3']
    };
    
    Object.keys(disasterMapping).forEach(m => {
        const progress = completedCourses[m] || 0;
        const subIds = disasterMapping[m];
        
        const mainBar = document.getElementById(`${m}ProgressBar`);
        const mainText = document.getElementById(`${m}Progress`);
        if (mainBar) mainBar.style.width = progress + '%';
        if (mainText) mainText.innerText = Math.round(progress) + '%';

        subIds.forEach(id => {
            const bar = document.getElementById(`${id}ProgressBar`);
            const text = document.getElementById(`${id}Progress`);
            
            if (!id.endsWith('3')) {
                // Course Modules: show the shared disaster progress
                if (bar) bar.style.width = progress + '%';
                if (text) text.innerText = Math.round(progress) + '%';
            } else {
                // Practical Drill: use simulation score
                const score = drillProgress[m] || 0;
                if (bar) bar.style.width = score + '%';
                if (text) text.innerText = Math.round(score) + '%';
            }

            // Update checkmarks if course is 100%
            const card = bar?.closest('.module-card');
            if (card && progress >= 100) {
                const icons = card.querySelectorAll('.module-list i');
                icons.forEach(icon => {
                    icon.className = 'bi bi-check-circle text-success me-2';
                });
            }
        });
    });
}