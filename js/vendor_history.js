// ==========================================
// VENDOR HISTORY LOGIC
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000";

// Get logged-in user
const user = JSON.parse(localStorage.getItem("user"));
const vendorId = user ? user.user_id : null;

if (!user) {
    alert("Please login first");
    window.location.href = "./ven.login.html";
}

// ------------------------------------------
// Function to load job history
// ------------------------------------------
// ------------------------------------------
// Function to load job history
// ------------------------------------------
async function loadVendorHistory() {
    // Set Vendor Name (Welcome Header)
    if (document.getElementById("vendorName")) {
        document.getElementById("vendorName").innerText = user.name;
    }

    const historyContainer = document.querySelector(".jobs");
    const loadingMsg = document.getElementById("loadingMsg");

    if (!historyContainer) return;

    try {
        // 1. Fetch Helper Data (Services, Users) & All Bookings
        // Using Promise.all for parallel fetching
        // JWT Proccesing 
        const requestOptions = {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.access_token}`
            }
        };

        const [serviceRes, userRes, bookingRes] = await Promise.all([
            fetch(`${API_BASE_URL}/services/`, requestOptions),
            fetch(`${API_BASE_URL}/users/`, requestOptions),
            fetch(`${API_BASE_URL}/bookings/vendor/${vendorId}`, requestOptions)
        ]);

        const services = await serviceRes.json();
        const users = await userRes.json();
        const bookings = await bookingRes.json();

        // Create Maps for easy lookup
        const serviceMap = {};
        if (Array.isArray(services)) services.forEach(s => serviceMap[s.service_id] = s.service_name);

        const userMap = {};
        if (Array.isArray(users)) users.forEach(u => userMap[u.user_id] = u.name);

        // Remove loading message
        if (loadingMsg) loadingMsg.remove();

        // 2. Calculate Stats (Client-Side)
        let todayEarnings = 0;
        let weekEarnings = 0;
        let activeJobsCount = 0;
        let completedTodayCount = 0;

        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        bookings.forEach(b => {
            const bookingDate = new Date(b.date_time).toISOString().split('T')[0];

            if (b.status === "completed") {
                // Check if it's today
                if (bookingDate === todayDate) {
                    todayEarnings += b.price;
                    completedTodayCount++;
                }

                // Simple Week Logic (Last 7 days)
                const bDate = new Date(b.date_time);
                const now = new Date();
                const diffTime = Math.abs(now - bDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) {
                    weekEarnings += b.price;
                }

            } else if (b.status === "accepted" || b.status === "in_progress") {
                activeJobsCount++;
            }
        });

        // Update Stats UI
        if (document.getElementById("todayEarnings")) document.getElementById("todayEarnings").innerText = "₹" + todayEarnings;
        if (document.getElementById("weekEarnings")) document.getElementById("weekEarnings").innerText = "₹" + weekEarnings;
        if (document.getElementById("activeJobs")) document.getElementById("activeJobs").innerText = activeJobsCount;
        if (document.getElementById("completedToday")) document.getElementById("completedToday").innerText = completedTodayCount;


        // 3. Filter & Render History (Completed Only)
        const completedJobs = bookings.filter(job => job.status === "completed");

        const header = historyContainer.querySelector("h3");
        historyContainer.innerHTML = "";
        if (header) historyContainer.appendChild(header);

        if (completedJobs.length === 0) {
            historyContainer.innerHTML += "<p>No completed job history found.</p>";
            return;
        }

        completedJobs.forEach(job => {
            const card = document.createElement("div");
            card.className = "job-card";

            const serviceName = serviceMap[job.service_id] || `Service #${job.service_id}`;
            const customerName = userMap[job.customer_id] || `Customer #${job.customer_id}`;

            card.innerHTML = `
                <div class="job-header">
                    <div>
                        <h4>${customerName}</h4>
                        <p class="job-type">${serviceName}</p>
                    </div>
                    <span class="status completed">Completed</span>
                </div>
                <p class="job-info">📍 ${job.address}</p>
                <p class="job-info">🕒 ${new Date(job.date_time).toLocaleString()}</p>
                <p class="job-info"><strong>💰 Price:</strong> $${job.price}</p>
            `;
            historyContainer.appendChild(card);
        });

    } catch (e) {
        console.error("Error loading history", e);
        if (loadingMsg) loadingMsg.innerText = "Error loading data.";
        else historyContainer.innerHTML += "<p>Error loading data.</p>";
    }
}

// ------------------------------------------
// Start
// ------------------------------------------
loadVendorHistory();

// Logout Logic
document.querySelector(".logout").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "ven.login.html";
});
