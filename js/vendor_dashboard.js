// ==========================================
// VENDOR DASHBOARD LOGIC
// ==========================================



// Get logged-in user
const user = JSON.parse(localStorage.getItem("user"));
const vendorId = user ? user.user_id : null;

if (!user) {
    alert("Please login first");
    window.location.href = "../pages/ven.login.html";
} else if (user.role !== "vendor" && user.role !== "mechanic") {
    // Basic check: if logged in as customer, do not allow access to vendor page
    alert("Access Denied: You are logged in as a Customer (" + user.name + "). Please logout and login as a Vendor account.");
    window.location.href = "../pages/user.login.html"; // Redirect to customer login or home
}

// Update Name
if (document.getElementById("vendorName")) {
    document.getElementById("vendorName").innerText = user.name;
}

// ------------------------------------------
// Function to load dashboard stats & active jobs
// ------------------------------------------
// ------------------------------------------
// Function to load dashboard stats & active jobs
// ------------------------------------------
// ------------------------------------------
// Function to load dashboard stats & active jobs
// ------------------------------------------
async function loadMechanicDashboard() {
    const jobList = document.getElementById("jobList");

    // Hardcoded location for now (Simulating vendor's current location)
    const myLat = 13.0827;
    const myLon = 80.2707;
    const radius = 50;

    try {
        if (!user.access_token) {
            console.warn("No token found");
        }

        const requestOptions = {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.access_token}`
            }
        };

        // 0. Fetch Helper Data (Services, Users) First
        const [serviceRes, userRes] = await Promise.all([
            fetch(`${API_BASE_URL}/services/`, requestOptions),
            fetch(`${API_BASE_URL}/users/`, requestOptions)
        ]);

        const services = await serviceRes.json();
        const users = await userRes.json();

        const serviceMap = {};
        if (Array.isArray(services)) services.forEach(s => serviceMap[s.service_id] = s.service_name);

        const userMap = {};
        if (Array.isArray(users)) users.forEach(u => userMap[u.user_id] = u.name);


        // 1. Fetch All Vendor Bookings (Stats & Active List)
        const bookingRes = await fetch(`${API_BASE_URL}/bookings/vendor/${vendorId}`, requestOptions);
        const allBookings = await bookingRes.json();

        let todayEarnings = 0;
        let weekEarnings = 0;
        let activeJobsCount = 0;
        let completedTodayCount = 0;
        let myActiveJobs = [];

        const todayDate = new Date().toISOString().split('T')[0];

        allBookings.forEach(b => {
            const bookingDate = new Date(b.date_time).toISOString().split('T')[0];

            if (b.status === "completed") {
                if (bookingDate === todayDate) {
                    todayEarnings += b.price;
                    completedTodayCount++;
                }
                const bDate = new Date(b.date_time);
                const now = new Date();
                const diffTime = Math.abs(now - bDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) weekEarnings += b.price;

            } else if (b.status === "accepted" || b.status === "in_progress") {
                activeJobsCount++;
                myActiveJobs.push(b);
            }
        });

        // Update Stats UI
        if (document.getElementById("todayEarnings")) document.getElementById("todayEarnings").innerText = "₹" + todayEarnings;
        if (document.getElementById("weekEarnings")) document.getElementById("weekEarnings").innerText = "₹" + weekEarnings;
        if (document.getElementById("activeJobs")) document.getElementById("activeJobs").innerText = activeJobsCount;
        if (document.getElementById("completedToday")) document.getElementById("completedToday").innerText = completedTodayCount;


        // 2. Fetch Nearby (New) Jobs
        const response = await fetch(`${API_BASE_URL}/bookings/nearby?lat=${myLat}&lon=${myLon}&radius=${radius}`, requestOptions);
        const nearbyBookings = await response.json();

        // 3. Render Both Lists to jobList Container
        jobList.innerHTML = "";

        // --- SECTION A: MY ACTIVE JOBS ---
        const activeHeader = document.createElement("h4");
        activeHeader.innerText = "My Active Jobs";
        activeHeader.style.marginTop = "0";
        activeHeader.style.color = "orange";
        jobList.appendChild(activeHeader);

        if (myActiveJobs.length === 0) {
            jobList.innerHTML += "<p style='color:#777; font-size:14px; margin-bottom:20px;'>No active jobs currently.</p>";
        } else {
            myActiveJobs.forEach(booking => {
                const card = createJobCard(booking, serviceMap, userMap, true);
                jobList.appendChild(card);
            });
        }

        // --- SECTION B: NEW REQUESTS ---
        const newHeader = document.createElement("h4");
        newHeader.innerText = "New Available Requests";
        newHeader.style.marginTop = "20px";
        newHeader.style.color = "#007bff";
        jobList.appendChild(newHeader);

        if (nearbyBookings.length === 0) {
            jobList.innerHTML += "<p style='color:#777; font-size:14px;'>No new requests nearby.</p>";
        } else {
            nearbyBookings.forEach(booking => {
                // Don't show jobs I already accepted in the 'New' list
                if (booking.vendor_id === vendorId) return;

                const card = createJobCard(booking, serviceMap, userMap, false);
                jobList.appendChild(card);
            });
        }

    } catch (error) {
        console.error("Failed to load dashboard:", error);
    }
}

// Helper to create card
function createJobCard(booking, serviceMap, userMap, isActive) {
    const card = document.createElement("div");
    card.className = "job-card";

    card.style.border = isActive ? "2px solid orange" : "1px solid #ddd";
    card.style.padding = "15px";
    card.style.marginBottom = "10px";
    card.style.borderRadius = "8px";
    card.style.backgroundColor = "#fff";
    card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

    const serviceName = serviceMap[booking.service_id] || `Service #${booking.service_id}`;
    const customerName = userMap[booking.customer_id] || `Customer #${booking.customer_id}`;

    let actionBtn = "";
    if (!isActive) {
        actionBtn = `
            <button onclick="acceptBooking(${booking.booking_id})" 
                class="accept-btn"
                style="background-color: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight:bold;">
                Accept Job
            </button>`;
    } else {
        actionBtn = `<span style="background:orange; color:white; padding:5px 10px; border-radius:15px; font-size:12px;">IN PROGRESS</span>`;
    }

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h3 style="margin:0 0 5px 0;">${serviceName}</h3> 
                <p style="margin:0 0 10px 0; color:#666;">Customer: ${customerName}</p>
                <p style="margin:5px 0;"><strong>📍 Loc:</strong> ${booking.address}</p>
                <p style="margin:5px 0;"><strong>💰 Price:</strong> $${booking.price}</p>
                <a href="https://www.google.com/maps?q=${booking.latitude},${booking.longitude}" target="_blank" 
                   style="display:inline-block; margin-top:5px; color:#007bff; text-decoration:none; font-size:14px;  padding: 8px; border-radius:10px; background-color: #2e5fdaff; color:white;" >
                   View Location
                </a>
            </div>
            ${actionBtn}
        </div>
    `;
    return card;
}

// ------------------------------------------
// Function to accept a booking
// ------------------------------------------
async function acceptBooking(bookingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/accept?vendor_id=${vendorId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${user.access_token}`
            }
        });

        if (response.ok) {
            alert("✅ Job Accepted! Check 'Active Jobs' tab.");
            // Refresh the dashboard to remove the accepted job from the list
            loadMechanicDashboard();
        } else {
            const err = await response.json();
            alert("Error: " + (err.detail || "Could not accept booking"));
        }
    } catch (error) {
        console.error("Accept failed:", error);
        alert("Something went wrong.");
    }
}

// ------------------------------------------
// Start (Run when page loads)
// ------------------------------------------
// Run immediately
loadMechanicDashboard();

// Refresh every 5 seconds to look for new jobs
setInterval(loadMechanicDashboard, 5000);

// Logout Logic
document.querySelector(".logout").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "ven.login.html";
});
