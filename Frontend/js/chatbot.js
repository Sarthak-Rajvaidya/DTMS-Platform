function toggleChatbot() {
    let box = document.getElementById("chatbotBox");
    if (box) {
        box.style.display = box.style.display === "flex" ? "none" : "flex";
    }
}

async function sendMessage() {
    let input = document.getElementById("chatInput");
    if (!input) return;
    
    let message = input.value.trim();
    if (!message) return;

    let chat = document.getElementById("chatMessages");
    if (!chat) return;

    // User message
    chat.innerHTML += `<div class="userMsg">${message}</div>`;

    input.value = "";
    chat.scrollTop = chat.scrollHeight;

    try {
        const response = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        const reply = data.reply || data.error || "Sorry, I couldn't process that.";
        
        chat.innerHTML += `<div class="botMsg">${reply}</div>`;
        chat.scrollTop = chat.scrollHeight;
    } catch (error) {
        console.error("Chat error:", error);
        chat.innerHTML += `<div class="botMsg">Error connecting to assistant.</div>`;
        chat.scrollTop = chat.scrollHeight;
    }
}

// Welcome message
window.addEventListener('DOMContentLoaded', () => {
    let chat = document.getElementById("chatMessages");
    if (chat) {
        chat.innerHTML = `<div class="botMsg">👋 Welcome! Ask me about disasters or safety tips.</div>`;
    }
});
