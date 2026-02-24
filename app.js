import { auth, onAuthStateChanged, signOut } from './firebase.js';

let currentUser = null;
let currentAIResponse = "";

// Selectors
const logoutBtn = document.getElementById('logout-btn');
const themeToggle = document.getElementById('theme-toggle');
const toastContainer = document.getElementById('toast-container');
const generateBtn = document.getElementById('generate-btn');
const loader = document.getElementById('loader');
const outputPanel = document.getElementById('output-panel');
const aiResultElement = document.getElementById('ai-result');
const pageTitle = document.getElementById('current-page-title');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.content-section');

marked.setOptions({ breaks: true, gfm: true });

// --- AUTH STATE ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        loadHistory();
        logoutBtn?.classList.remove('hidden');
    } else {
        logoutBtn?.classList.add('hidden');
    }
});

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'error' ? '#ff4b2b' : '#6d28d9';
    toast.innerText = message;
    toastContainer?.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- SIDEBAR NAVIGATION (NO SIGNUP LOCK) ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('data-target');

        // Sirf "My Plans" ke liye login check karenge, baaki sab open hai
        if (targetId === 'history' && !currentUser) {
            showToast("Apne purane plans dekhne ke liye Login zaroori hai! 🔒", "info");
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        // Section Switching logic
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        if(pageTitle) pageTitle.innerText = item.innerText.replace(/[🏠📁⚡⚙️]/g, '').trim();
        
        sections.forEach(s => s.classList.add('hidden'));
        const targetSection = document.getElementById(`${targetId}-section`);
        if(targetSection) targetSection.classList.remove('hidden');
    });
});

// --- WORKER AI FETCH LOGIC ---
generateBtn?.addEventListener('click', async () => {
    if (!currentUser && localStorage.getItem('omniFreeTrial') === 'true') {
        showToast("Free trial used! Please Login to generate more plans. 🚀", "error");
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }

    const goalEl = document.getElementById('goalInput') || document.getElementById('goal-input');
    const goal = goalEl?.value.trim();
    const category = document.getElementById('category-select')?.value || "General";
    const timeframe = document.getElementById('timeframe-select')?.value || "7 Days";

    // UPDATED TO ENGLISH
    if (!goal) {
        showToast('Please enter your goal first! 😊', 'error');
        return;
    }

    generateBtn.disabled = true;
    loader.classList.remove('hidden');
    outputPanel.classList.add('hidden');
    
    try {
        const workerUrl = 'https://omnitoolaz-ai-life-planner.devsujit.workers.dev/';
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal, category, timeframe })
        });

        const data = await response.json();
        
        if (!response.ok || !data.plan) {
            throw new Error(data.error || 'AI response not received.');
        }

        currentAIResponse = data.plan;
        aiResultElement.innerHTML = marked.parse(currentAIResponse);
        
        loader.classList.add('hidden');
        outputPanel.classList.remove('hidden');

        if (!currentUser) localStorage.setItem('omniFreeTrial', 'true');
        showToast('Plan generated successfully! ✨');

    } catch (error) {
        loader.classList.add('hidden');
        showToast("Error: " + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
    }
});
