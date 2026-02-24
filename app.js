import { auth, onAuthStateChanged, signOut } from './firebase.js';

let currentUser = null;
let currentAIResponse = "";

// --- ELEMENT SELECTORS ---
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

// --- INITIALIZATION ---
marked.setOptions({
    breaks: true,
    gfm: true
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadHistory();
        document.getElementById('logout-btn')?.classList.remove('hidden');
    } else {
        currentUser = null;
        document.getElementById('logout-btn')?.classList.add('hidden');
    }
});

// --- UTILITY FUNCTIONS ---
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : 'var(--accent-color)';
    toast.innerText = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

themeToggle?.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
});

// --- SIDEBAR NAVIGATION LOGIC ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('data-target');
        if(!targetId) return;

        // "My Plans" is locked for Guests
        if (targetId === 'history' && !currentUser) {
            showToast("Please login to view your saved plans! 🔒", "error");
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        if(pageTitle) pageTitle.innerText = item.innerText.replace(/[🏠📁⚡⚙️]/g, '').trim();

        sections.forEach(s => s.classList.add('hidden'));
        const targetSection = document.getElementById(`${targetId}-section`);
        if(targetSection) targetSection.classList.remove('hidden');
    });
});

// --- AI GENERATION LOGIC ---
generateBtn?.addEventListener('click', async () => {
    // Guest Trial Check
    if (!currentUser && localStorage.getItem('omniFreeTrial') === 'true') {
        showToast("Free trial limit reached! Please login to continue. 🚀", "error");
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }

    // Support for both common IDs (goalInput vs goal-input)
    const goalEl = document.getElementById('goalInput') || document.getElementById('goal-input');
    const goal = goalEl?.value.trim();
    const category = document.getElementById('category-select')?.value;
    const timeframe = document.getElementById('timeframe-select')?.value;

    if (!goal) return showToast('Please enter your goal first! 😊', 'error');

    generateBtn.disabled = true;
    loader.classList.remove('hidden');
    outputPanel.classList.add('hidden');
    
    try {
        const workerUrl = 'https://omnitoolz-backend.devsujit.workers.dev/';
        
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
        
        aiResultElement.innerHTML = marked.parse(currentAIResponse);
        
        if (!currentUser) localStorage.setItem('omniFreeTrial', 'true');
        showToast('Plan generated successfully!');

    } catch (error) {
        loader.classList.add('hidden');
        showToast(error.message, 'error');
    } finally {
        generateBtn.disabled = false;
    }
});

// --- OUTPUT PANEL ACTIONS ---
document.getElementById('copy-btn')?.addEventListener('click', () => {
    if(!currentAIResponse) return;
    navigator.clipboard.writeText(currentAIResponse);
    showToast('Copied to clipboard!');
});

document.getElementById('download-btn')?.addEventListener('click', () => {
    if (!currentUser) {
        showToast("Login to download PDF! 🔒", "error");
        return;
    }
    const element = document.getElementById('ai-result');
    const opt = {
        margin: 0.5,
        filename: 'OmniToolz_LifePlan.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
    showToast('Downloading PDF...');
});

document.getElementById('save-btn')?.addEventListener('click', () => {
    if (!currentUser) {
        showToast("Login to save plans! 🔒", "error");
        return;
    }
    const goalEl = document.getElementById('goalInput') || document.getElementById('goal-input');
    const category = document.getElementById('category-select').value;
    
    const newPlan = {
        id: Date.now(),
        goal: goalEl.value,
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

// --- HISTORY LOGIC ---
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
            <h3>${plan.goal.substring(0, 50)}...</h3>
            <div style="display:flex; justify-content:space-between; font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px;">
                <span>${plan.category}</span>
                <span>${plan.date}</span>
            </div>
        `;
        card.addEventListener('click', () => {
            document.querySelector('[data-target="home"]').click();
            outputPanel.classList.remove('hidden');
            aiResultElement.innerHTML = marked.parse(plan.content);
            const goalEl = document.getElementById('goalInput') || document.getElementById('goal-input');
            if(goalEl) goalEl.value = plan.goal;
            window.scrollTo({ top: outputPanel.offsetTop, behavior: 'smooth' });
        });
        container.appendChild(card);
    });
}

// --- RAZORPAY & SUBSCRIPTION LOGIC ---
async function openPayment(planType) {
    if (!currentUser) return showToast("Please login first!", "error");

    const amount = planType === 'monthly' ? 49900 : 499900;
    const planName = planType === 'monthly' ? "Pro Monthly" : "Pro Yearly";

    const options = {
        "key": "YOUR_RAZORPAY_KEY_ID", 
        "amount": amount, 
        "currency": "INR",
        "name": "OmniToolz AI",
        "description": planName,
        "image": "https://omnitoolz.in/logo.png",
        "handler": async function (response) {
            await activateProPlan(response.razorpay_payment_id, planType);
        },
        "prefill": { "email": currentUser.email },
        "theme": { "color": "#6d28d9" }
    };

    const rzp1 = new Razorpay(options);
    rzp1.open();
}

async function activateProPlan(paymentId, planType) {
    try {
        const { db, doc, updateDoc } = await import('./firebase.js');
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { 
            isPro: true,
            planType: planType,
            paymentId: paymentId,
            updatedAt: new Date().toISOString()
        });
        showToast(`Welcome to Pro! 👑`, "success");
        setTimeout(() => location.reload(), 2000);
    } catch (err) {
        showToast("Payment successful but database update failed.", "error");
    }
}

document.getElementById('monthly-pay-btn')?.addEventListener('click', () => openPayment('monthly'));
document.getElementById('yearly-pay-btn')?.addEventListener('click', () => openPayment('yearly'));

logoutBtn?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
});
