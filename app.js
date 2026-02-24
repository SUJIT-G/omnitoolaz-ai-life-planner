import { auth, onAuthStateChanged, signOut } from './firebase.js';

let currentUser = null;
let currentAIResponse = "";

// Element Selectors with Safety Checks
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

// --- AUTH LOGIC ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadHistory();
        logoutBtn?.classList.remove('hidden');
    } else {
        currentUser = null;
        logoutBtn?.classList.add('hidden');
    }
});

logoutBtn?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html'; // Dashboard/Home par hi rakhega
});

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : 'var(--accent-color)';
    toast.innerText = message;
    toastContainer?.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Helper: Action Security
function checkAccess(action) {
    if (!currentUser) {
        showToast(`${action} ke liye Login karein! 🔒`, "error");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return false;
    }
    return true;
}

// --- SIDEBAR NAV FIX ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        const targetId = item.getAttribute('data-target');
        
        // Lock My Plans for non-logged users
        if (targetId === 'history' && !currentUser) {
            e.preventDefault();
            return checkAccess("My Plans dekhne");
        }

        e.preventDefault();
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        if(pageTitle) pageTitle.innerText = item.innerText.replace(/[🏠📁⚡⚙️]/g, '').trim();
        sections.forEach(s => s.classList.add('hidden'));
        document.getElementById(`${targetId}-section`)?.classList.remove('hidden');
    });
});

// --- GENERATE LOGIC ---
generateBtn?.addEventListener('click', async () => {
    // 1 Free Trial Check
    if (!currentUser && localStorage.getItem('omniFreeTrial') === 'true') {
        return checkAccess("Naya plan banane");
    }

    // ID Fallback: 'goalInput' (Screenshot wala) ya 'goal-input' (Old code wala)
    const goalEl = document.getElementById('goalInput') || document.getElementById('goal-input');
    const goal = goalEl?.value.trim();
    const category = document.getElementById('category-select')?.value;
    const timeframe = document.getElementById('timeframe-select')?.value;

    if (!goal) return showToast('Please enter a goal.', 'error');

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

        if (!response.ok) throw new Error('AI not responding. Check Worker.');
        
        const data = await response.json();
        currentAIResponse = data.plan;

        loader.classList.add('hidden');
        outputPanel.classList.remove('hidden');
        aiResultElement.innerHTML = marked.parse(currentAIResponse);
        
        // Mark trial used
        if (!currentUser) localStorage.setItem('omniFreeTrial', 'true');
        showToast('Plan generated!');

    } catch (error) {
        loader.classList.add('hidden');
        showToast(error.message, 'error');
    } finally {
        generateBtn.disabled = false;
    }
});

// --- LOCKED ACTIONS ---
document.getElementById('copy-btn')?.addEventListener('click', () => {
    if (checkAccess("Copy karne")) {
        navigator.clipboard.writeText(currentAIResponse);
        showToast('Copied!');
    }
});

document.getElementById('save-btn')?.addEventListener('click', () => {
    if (!checkAccess("Save karne")) return;
    // ... rest of your save logic
});

// Load History function same rahegi
