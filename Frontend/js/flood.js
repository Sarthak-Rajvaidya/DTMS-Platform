document.addEventListener('DOMContentLoaded', async () => {
    let viewedSections = new Set();
    let totalSections = 8;
    const courseName = 'flood';

    // Fetch existing progress
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/course/progress/${courseName}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.viewed_sections) {
                    data.viewed_sections.forEach(s => viewedSections.add(s));
                    updateProgress(false);
                }
            }
        } catch (err) {
            console.error("Failed to fetch initial progress:", err);
        }
    }

    function markSectionViewed(sectionId) {
        if (!viewedSections.has(sectionId)) {
            viewedSections.add(sectionId);
            updateProgress(true);
        }
    }

    function updateProgress(shouldSync = true) {
        let progress = (viewedSections.size / totalSections) * 100;
        const bar = document.getElementById('progressBar');
        const text = document.getElementById('progressText');
        
        if (bar) bar.style.width = progress + '%';
        if (text) text.innerText = Math.round(progress) + '%';
        
        if (shouldSync) {
            submitCourseCompletion(courseName, progress, Array.from(viewedSections));
        }
    }

    window.markCompleted = async function() {
        for (let i = 1; i <= totalSections; i++) {
            viewedSections.add('section' + i);
        }
        updateProgress(true);
        window.location.href = '../tornado/course-tornado.html';
    };

    window.checkQuiz = function() {
        let q1 = document.querySelector('input[name="q1"]:checked');
        let q2 = document.querySelector('input[name="q2"]:checked');
        let q3 = document.querySelector('input[name="q3"]:checked');
        
        let score = 0;
        if (q1 && q1.value === '6') score++;
        if (q2 && q2.value === 'flash') score++;
        if (q3 && q3.value === 'window') score++;
        
        let resultDiv = document.getElementById('quizResult');
        if (score === 3) {
            resultDiv.innerHTML = '<div class="alert alert-success">🎉 Perfect! You\'re flood-ready!</div>';
            markSectionViewed('section8');
        } else {
            resultDiv.innerHTML = `<div class="alert alert-warning">📚 Score: ${score}/3. Review the sections again!</div>`;
        }
    };

    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.section-card');
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100 && rect.bottom > 100) {
                markSectionViewed(section.id);
            }
        });
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });
        
        document.querySelectorAll('.nav-section').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    console.log('Flood Safety Module Initialized with Persistence');
});