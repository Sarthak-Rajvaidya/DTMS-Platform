const API_BASE_URL = "http://127.0.0.1:8000";

async function login(user_id, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id, password })
        });

        if (response.ok) {
            const data = await response.json();
            // Store token and user_id
            localStorage.setItem("token", data.access_token);
            
            // Fetch user profile to store user info
            const userResponse = await fetch(`${API_BASE_URL}/user/me`, {
                headers: { "Authorization": `Bearer ${data.access_token}` }
            });
            const userData = await userResponse.json();
            localStorage.setItem("user", JSON.stringify(userData));
            
            return true;
        }
        return false;
    } catch (error) {
        console.error("Login error:", error);
        return false;
    }
}

async function register(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        return response.ok;
    } catch (error) {
        console.error("Registration error:", error);
        return false;
    }
}

function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // Determine path back to login
    const isSubfolder = window.location.pathname.includes('/earthquake/') || 
                       window.location.pathname.includes('/flood/') || 
                       window.location.pathname.includes('/tornado/') || 
                       window.location.pathname.includes('/wildfire/');
    
    window.location.href = isSubfolder ? "../login.html" : "login.html";
}

function getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}

function getToken() {
    return localStorage.getItem("token");
}

function checkAuth() {
    if (!getToken() && !window.location.pathname.includes("login.html") && !window.location.pathname.includes("register.html")) {
        const isSubfolder = window.location.pathname.includes('/earthquake/') || 
                           window.location.pathname.includes('/flood/') || 
                           window.location.pathname.includes('/tornado/') || 
                           window.location.pathname.includes('/wildfire/');
        
        window.location.href = isSubfolder ? "../login.html" : "login.html";
    }
}

async function submitCourseCompletion(courseName, progress = 100, viewedSections = []) {
    console.log(`Attempting to save progress for ${courseName}: ${progress}%`);
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    
    if (!token || !userJson) {
        console.error("No token or user found in localStorage");
        return;
    }

    const user = JSON.parse(userJson);
    const userId = user.user_id || user.id || user.username;

    try {
        const response = await fetch(`${API_BASE_URL}/course/submit`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                user_id: String(userId), 
                course_name: courseName,
                progress: Math.round(progress),
                viewed_sections: Array.from(viewedSections)
            })
        });

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/Frontend/login.html';
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Save failed:", errorData);
            alert("Save failed: " + (errorData.detail || JSON.stringify(errorData)));
        } else {
            console.log(`✅ Progress saved: ${courseName} ${progress}%`);
        }
    } catch (err) {
        console.error("Network error saving progress:", err);
    }
}

// Auto-run auth check
if (!window.location.pathname.includes("login.html") && !window.location.pathname.includes("register.html")) {
    checkAuth();
}
