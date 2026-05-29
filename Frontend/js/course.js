/**
 * Updates the visual progress bar and text
 */
function markAsCompleted() {
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.getElementById('progress-text');
    
    progressBar.style.width = '100%';
    progressBar.classList.remove('progress-bar-striped');
    progressText.innerText = '100% Complete';
    
    alert("Congratulations! Module marked as completed.");
}

/**
 * Placeholder for Quiz redirection
 */
function startQuiz() {
    alert("Starting Quiz... (Feature coming soon)");
}

/**
 * Simple smooth scroll to top
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Active Sidebar Link Highlighting on scroll
 */
window.addEventListener('scroll', () => {
    let current = "";
    const sections = document.querySelectorAll('.section-card');
    const navItems = document.querySelectorAll('.nav-section');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 120) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href').includes(current)) {
            item.classList.add('active');
        }
    });
});