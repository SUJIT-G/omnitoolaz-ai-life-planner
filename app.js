import { auth, onAuthStateChanged, signOut } from './firebase.js';

let currentUser = null;
let currentAIResponse = "";

const logoutBtn = document.getElementById('logout-btn');
const themeToggle = document.getElementById('theme-toggle');
const toastContainer = document.getElementById('toast-container');
const generateBtn = document.getElementById('generate-btn');
const loader = document.getElementById('loader');
const outputPanel = document.getElementById('output-panel');
const aiResultElement = document.getElementById('ai-result');
const pageTitle = document.getElementById('current-page-title');

// Sidebar Navigation
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.content-section');

marked.setOptions({ breaks: true, gfm: true });

// --- AUTH STATE ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadHistory();
        if(logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        currentUser = null;
        if(logoutBtn) logoutBtn.classList.add('hidden');
    }
});

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : 'var(--accent-color)';
    toast.innerText = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Helper: Check login
function checkLoginAndRedirect(actionText) {
    if (!currentUser) {
        showToast(`${actionText} ke liye login karein! 🔒`, "error");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return false;
    }
    return true;
}

// --- GENERATE LOGIC (FIXED) ---
generateBtn?.addEventListener('click', async () => {
    // 1. Check Freemium Trial
    if (!currentUser) {
        const usedTrial = localStorage.getItem('omniFreeTrial');
        if (usedTrial === 'true') {
            showToast("Free trial khatam! Login karein. 🚀", "error");
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }
    }

    // 2. Get Correct Inputs (Using 'goalInput' from your HTML)
    const goalInput = document.getElementById('goalInput');
    const goal = goalInput ? goalInput.value.trim() : "";
    const category = document.getElementById('category-select')?.value || "General";
    const timeframe = document.getElementById('timeframe-select')?.value || "7 days";

    if (!goal) return showToast('Goal likhna zaroori hai!', 'error');

    // 3. UI Updates
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

        if (!response.ok) throw new Error('AI Server busy hai, try again.');
        
        const data = await response.json();
        
        // FIX: Ensure we use 'plan' property from worker response
        currentAIResponse = data.plan || data.response || "No response from AI.";

        loader.classList.add('hidden');
        outputPanel.classList.remove('hidden');
        
        // Render Markdown
        aiResultElement.innerHTML = marked.parse(currentAIResponse);
        
        // Mark trial as used ONLY after successful generation
        if (!currentUser) localStorage.setItem('omniFreeTrial', 'true');
        
        showToast('Plan ready hai! ✨');

    } catch (error) {
        loader.classList.add('hidden');
        showToast(error.message, 'error');
    } finally {
        generateBtn.disabled = false;
    }
});

// --- ACTIONS (LOCKED) ---
document.getElementById('copy-btn')?.addEventListener('click', () => {
    if (!checkLoginAndRedirect("Copy")) return;
    navigator.clipboard.writeText(currentAIResponse);
    showToast('Copied!');
});

document.getElementById('save-btn')?.addEventListener('click', () => {
    if (!checkLoginAndRedirect("Save")) return;

    const goal = document.getElementById('goalInput').value;
    const category = document.getElementById('category-select').value;
    
    const newPlan = {
        id: Date.now(),
        goal: goal,
        category: category,
        date: new Date().toLocaleDateString(),
        content: currentAIResponse // Storing AI text, not input text
    };

    let history = JSON.parse(localStorage.getItem('omniHistory') || '[]');
    history.push(newPlan);
    localStorage.setItem('omniHistory', JSON.stringify(history));
    
    showToast('Saved to My Plans!');
    loadHistory();
});

// History Loading (Fixed Goal Display)
function loadHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;
    
    const history = JSON.parse(localStorage.getItem('omniHistory') || '[]');
    container.innerHTML = '';

    if (history.length === 0) {
        container.innerHTML = '<p>No plans saved.</p>';
        return;
    }

    history.reverse().forEach(plan => {
        const card = document.createElement('div');
        card.className = 'history-card glass-card';
        card.innerHTML = `
            <h3>${plan.goal.substring(0, 40)}...</h3>
            <div style="display:flex; justify-content:space-between; font-size: 0.8rem; margin-top:10px;">
                <span>${plan.category}</span>
                <span>${plan.date}</span>
            </div>
        `;
        card.addEventListener('click', () => {
            // Switch to home and show result
            document.querySelector('[data-target="home"]').click();
            outputPanel.classList.remove('hidden');
            aiResultElement.innerHTML = marked.parse(plan.content);
            document.getElementById('goalInput').value = plan.goal;
        });
        container.appendChild(card);
    });
}
