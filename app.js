import { auth, onAuthStateChanged, signOut } from './firebase.js';

// State & Elements
let currentUser = null;
let currentAIResponse = "";

const logoutBtn = document.getElementById('logout-btn');
const themeToggle = document.getElementById('theme-toggle');
const toastContainer = document.getElementById('toast-container');
const generateBtn = document.getElementById('generate-btn');
const loader = document.getElementById('loader');
const outputPanel = document.getElementById('output-panel');
const aiResultElement = document.getElementById('ai-result');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.content-section');

// Ensure Auth before letting user stay on dashboard
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        currentUser = user;
        loadHistory();
    }
});

// Logout
logoutBtn?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
});

// Toast System
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : 'var(--primary-color)';
    toast.innerText = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Theme Toggle
themeToggle?.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    themeToggle.innerText = newTheme === 'dark' ? '☀️ Toggle Theme' : '🌙 Toggle Theme';
});

// Navigation Logic
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('data-target');
        if(!targetId) return;

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        sections.forEach(s => s.classList.add('hidden'));
        document.getElementById(`${targetId}-section`).classList.remove('hidden');
    });
});

// Typing Animation
async function typeResponse(text, element) {
    element.innerHTML = '';
    element.classList.add('typing-cursor');
    for (let i = 0; i < text.length; i++) {
        element.innerHTML += text.charAt(i);
        await new Promise(r => setTimeout(r, 10)); // Speed of typing
    }
    element.classList.remove('typing-cursor');
}

// Call Cloudflare Worker AI API
generateBtn?.addEventListener('click', async () => {
    const goal = document.getElementById('goal-input').value.trim();
    const category = document.getElementById('category-select').value;
    const timeframe = document.getElementById('timeframe-select').value;

    if (!goal) return showToast('Please enter a goal.', 'error');

    generateBtn.disabled = true;
    loader.classList.remove('hidden');
    outputPanel.classList.add('hidden');
    
    try {
        // REPLACE THIS URL WITH YOUR DEPLOYED WORKER URL
        const workerUrl = 'https://omnitoolaz-ai-life-planner.devsujit.workers.dev/';
        
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal, category, timeframe })
        });

        if (!response.ok) throw new Error('Failed to generate plan.');
        
        const data = await response.json();
        currentAIResponse = data.plan;

        loader.classList.add('hidden');
        outputPanel.classList.remove('hidden');
        
        // Start typing animation
        await typeResponse(currentAIResponse, aiResultElement);
        showToast('Plan generated successfully!');

    } catch (error) {
        loader.classList.add('hidden');
        showToast(error.message, 'error');
    } finally {
        generateBtn.disabled = false;
    }
});

// Output Panel Actions
document.getElementById('copy-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(currentAIResponse);
    showToast('Copied to clipboard!');
});

document.getElementById('download-btn')?.addEventListener('click', () => {
    const element = document.getElementById('ai-result');
    const opt = {
        margin: 1,
        filename: 'LifePlan.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
    showToast('Downloading PDF...');
});

document.getElementById('save-btn')?.addEventListener('click', () => {
    const goal = document.getElementById('goal-input').value;
    const category = document.getElementById('category-select').value;
    
    const newPlan = {
        id: Date.now(),
        goal,
        category,
        date: new Date().toLocaleDateString(),
        content: currentAIResponse
    };

    let history = JSON.parse(localStorage.getItem('omniHistory') || '[]');
    history.push(newPlan);
    localStorage.setItem('omniHistory', JSON.stringify(history));
    
    showToast('Saved to My Plans!');
    loadHistory();
});

// Load History from localStorage
function loadHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;
    
    const history = JSON.parse(localStorage.getItem('omniHistory') || '[]');
    container.innerHTML = '';

    if (history.length === 0) {
        container.innerHTML = '<p>No saved plans yet.</p>';
        return;
    }

    history.reverse().forEach(plan => {
        const card = document.createElement('div');
        card.className = 'history-card glass-card';
        card.innerHTML = `
            <h3>${plan.goal}</h3>
            <div class="history-meta">
                <span>📁 ${plan.category}</span>
                <span>🕒 ${plan.date}</span>
            </div>
        `;
        card.addEventListener('click', () => {
            // View historical plan
            document.querySelector('[data-target="home"]').click();
            outputPanel.classList.remove('hidden');
            aiResultElement.innerHTML = plan.content;
            document.getElementById('goal-input').value = plan.goal;
            document.getElementById('category-select').value = plan.category;
            window.scrollTo({ top: outputPanel.offsetTop, behavior: 'smooth' });
        });
        container.appendChild(card);
    });
}
