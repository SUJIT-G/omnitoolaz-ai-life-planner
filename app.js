// OmniToolz AI Life Planner - app.js

// ===== Worker URL =====
const WORKER_URL = "https://omnitoolaz-ai-life-planner.devsujit.workers.dev/";


// ===== Generate Plan Button Function =====
async function generatePlan() {

    const goal = document.getElementById("goal").value;
    const days = document.getElementById("days").value;

    if (!goal) {
        alert("Please enter your goal");
        return;
    }

    document.getElementById("result").innerHTML = "Generating AI Plan... ⏳";

    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                goal: goal,
                days: days || 7
            })
        });

        const data = await response.json();

        document.getElementById("result").innerHTML =
            `<h3>Your AI Life Plan</h3><p>${data.plan || data.result}</p>`;

    } catch (error) {
        document.getElementById("result").innerHTML =
            "❌ Error connecting AI worker. Check worker URL.";
        console.log(error);
    }
}


// ===== Logout Function =====
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "index.html";
    });
}


// ===== Check Login =====
firebase.auth().onAuthStateChanged((user) => {
    if (!user && window.location.pathname.includes("dashboard.html")) {
        window.location.href = "index.html";
    }
});
