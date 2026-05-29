document.addEventListener('DOMContentLoaded', async () => {
    let viewedSections = new Set();
    let totalSections = 7;
    const courseName = 'tornado';

    // 1. Fetch existing progress
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
                    updateProgress(false); // Don't sync back immediately
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
        window.location.href = '../wildfire/course-wildfire.html';
    };

    window.checkTorQuiz = function() {
        const q1 = document.querySelector('input[name="tq1"]:checked');
        const q2 = document.querySelector('input[name="tq2"]:checked');
        
        if (!q1 || !q2) return alert("Please answer all questions!");

        let score = 0;
        if (q1.value === "exit") score++;
        if (q2.value === "lowest") score++;

        const resultDiv = document.getElementById('quizResult');
        if (score === 2) {
            resultDiv.innerHTML = '<div class="alert alert-success">🎉 Excellent! You know your tornado safety.</div>';
            markSectionViewed('section7');
        } else {
            resultDiv.innerHTML = `<div class="alert alert-warning">📚 Score: ${score}/2. Review the shelter sections!</div>`;
        }
    };

    // Scroll tracking
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

    console.log('Tornado Safety Module Initialized with Persistence');
});