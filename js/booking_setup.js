// ==========================================
// CLIENT SIDE: BOOKING LOGIC
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000";

// Global variable to stop polling if needed
let bookingPollInterval = null;

// Function 1: Book a Mechanic
// Wizard State
let bookingWizardState = {
    service_id: null,
    service_price: 0,
    payment_method: null,
    address: "",
    lat: null,
    lon: null
};

// Initialize Wizard
document.addEventListener("DOMContentLoaded", () => {
    // Should check if on wizard page (e.g. presence of step indicators)
    if (document.getElementById("service-list-container")) {
        loadServicesForWizard();
    }
});

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
    // Show target
    document.getElementById(`step-${stepNumber}`).style.display = 'block';

    // Update indicators
    document.querySelectorAll('.step').forEach((el, index) => {
        if (index + 1 === stepNumber) el.classList.add('active');
        else el.classList.remove('active');
    });
}

async function loadServicesForWizard() {
    const list = document.getElementById("service-list-container");
    try {
        const res = await fetch(`${API_BASE_URL}/services/`);
        const services = await res.json();
        list.innerHTML = "";

        services.forEach(s => {
            const btn = document.createElement("button");
            btn.className = "service-select-btn";
            btn.style.padding = "15px";
            btn.style.textAlign = "left";
            btn.style.border = "1px solid #ddd";
            btn.style.borderRadius = "8px";
            btn.style.backgroundColor = "white";
            btn.style.cursor = "pointer";
            btn.innerHTML = `<strong>${s.service_name}</strong> - $${s.base_price}<br><small>${s.description}</small>`;
            btn.onclick = () => selectService(s.service_id, s.base_price);
            list.appendChild(btn);
        });
    } catch (e) {
        list.innerHTML = "<p>Error loading services.</p>";
    }
}

function selectService(id, price) {
    bookingWizardState.service_id = id;
    bookingWizardState.service_price = price;
    console.log("Selected Service:", id);
    showStep(2);
}

function selectPayment(method) {
    bookingWizardState.payment_method = method;
    console.log("Selected Payment:", method);
    showStep(3);
}

// Helper to get location
async function detectLocation() {
    const btn = event.target; // The button clicked
    btn.innerText = "Locating...";

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        btn.innerText = "📍 Use My Current Location";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            bookingWizardState.lat = position.coords.latitude;
            bookingWizardState.lon = position.coords.longitude;
            document.getElementById("address").value = "Lat: " + position.coords.latitude.toFixed(4) + ", Lon: " + position.coords.longitude.toFixed(4);
            // Ideally reverse geocode here to get address string
            btn.innerText = "✅ Location Found";
        },
        () => {
            alert("Unable to retrieve your location");
            btn.innerText = "📍 Use My Current Location";
        }
    );
}

async function finalSubmitBooking() {
    const addressInput = document.getElementById("address").value;
    if (!addressInput) {
        alert("Please enter an address or detect location.");
        return;
    }
    bookingWizardState.address = addressInput;

    const user = JSON.parse(localStorage.getItem("user"));
    const activeUser = user || { user_id: 1, name: "Demo User" };

    const bookingData = {
        customer_id: activeUser.user_id,
        service_id: bookingWizardState.service_id,
        address: bookingWizardState.address,
        latitude: bookingWizardState.lat || 13.0827, // Fallback if typed manual
        longitude: bookingWizardState.lon || 80.2707,
        price: bookingWizardState.service_price,
        status: "pending",
        vendor_id: null,
        date_time: new Date().toISOString()
        // could add payment method to DB model if needed, but not in current schema
    };

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingData)
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Booking Confirmed! ID: ${result.booking_id}\nPayment: ${bookingWizardState.payment_method}`);
            startBookingStatusPolling(result.booking_id);
            // Maybe redirect to dashboard?
            window.location.href = "user.db1.html";
        } else {
            const err = await response.json();
            alert("Error: " + JSON.stringify(err));
        }
    } catch (e) {
        console.error(e);
        alert("Booking failed");
    }
}

// Function to check if a mechanic accepted
function startBookingStatusPolling(bookingId) {
    if (bookingPollInterval) clearInterval(bookingPollInterval);

    bookingPollInterval = setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
            const booking = await res.json();

            if (booking.status === "accepted") {
                clearInterval(bookingPollInterval);
                alert(`Good news! Your mechanic is on the way.\nVendor ID: ${booking.vendor_id}`);

                // Update UI
                const btn = document.querySelector('.continue-btn');
                if (btn) {
                    btn.innerText = "Mechanic Found!";
                    btn.style.backgroundColor = "#28a745"; // Green
                }

                // Optional: Redirect to confirmation page
                // window.location.href = "confirm.html";
            }
        } catch (e) {
            console.error("Polling error", e);
        }
    }, 3000); // Check every 3 seconds
}


// ==========================================
// VENDOR SIDE: DASHBOARD LOGIC
// ==========================================

let mechanicPollInterval = null;

async function loadMechanicDashboard() {
    const jobList = document.getElementById("jobList");
    const myLat = 13.0827;
    const myLon = 80.2707;
    const radius = 50;

    // Function to fetch jobs
    const fetchJobs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/nearby?lat=${myLat}&lon=${myLon}&radius=${radius}`);
            const bookings = await response.json();

            // Only update if we have new data or clean state (simple approach: wipe and redraw)
            // Ideally diff the list, but for now redraw is fine.
            jobList.innerHTML = "";

            if (bookings.length === 0) {
                jobList.innerHTML = "<p>No nearby jobs found. Scanning...</p>";
                return;
            }

            bookings.forEach(booking => {
                const card = document.createElement("div");
                card.className = "job-card";
                card.style.border = "1px solid #ddd";
                card.style.padding = "15px";
                card.style.marginBottom = "10px";
                card.style.borderRadius = "8px";
                card.style.backgroundColor = "#fff";
                card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin:0 0 10px 0;">Request #${booking.booking_id}</h3>
                            <p style="margin:5px 0;"><strong>📍 Loc:</strong> ${booking.address}</p>
                            <p style="margin:5px 0;"><strong>💰 Price:</strong> $${booking.price}</p>
                            <a href="https://www.google.com/maps?q=${booking.latitude},${booking.longitude}" target="_blank" 
                               style="display:inline-block; margin-top:5px; color:#007bff; text-decoration:none; font-size:14px;">
                               🗺️ View Location
                            </a>
                        </div>
                        <button onclick="acceptBooking(${booking.booking_id})" 
                            style="background-color: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight:bold;">
                            Accept
                        </button>
                    </div>
                `;
                jobList.appendChild(card);
            });

            // Notification logic (sound or visual) could go here

        } catch (error) {
            console.error("Failed to load jobs:", error);
            // jobList.innerHTML = "<p>Error loading jobs.</p>";
        }
    };

    // Initial fetch
    fetchJobs();

    // Start polling every 5 seconds if not already started
    if (!mechanicPollInterval) {
        mechanicPollInterval = setInterval(fetchJobs, 5000);
    }
}

async function acceptBooking(bookingId) {
    const user = JSON.parse(localStorage.getItem("user"));
    const vendorId = user ? user.user_id : 123; // Fallback for demo

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/accept?vendor_id=${vendorId}`, {
            method: "PUT"
        });

        if (response.ok) {
            alert("✅ Job Accepted!");
            // loadMechanicDashboard(); // Refresh immediately handled by interval usually, but can call explicitly
            loadMechanicDashboard();
        } else {
            const err = await response.json();
            alert("Error: " + err.detail);
        }
    } catch (error) {
        console.error("Accept failed:", error);
    }
}

// Function to load vendor job history (ven.db2.html)
// Function to load vendor job history (ven.db2.html)
async function loadVendorHistory() {
    const user = JSON.parse(localStorage.getItem("user"));
    const vendorId = user ? user.user_id : 123;
    const historyContainer = document.querySelector(".jobs"); // Section to append to

    if (!historyContainer) return; // Not on the history page

    // 1. Load Summary Stats (Today's earnings, etc.)
    try {
        const statRes = await fetch(`${API_BASE_URL}/users/vendor/stats/${vendorId}`);
        if (statRes.ok) {
            const stats = await statRes.json();
            document.getElementById("todayEarnings").textContent = "$" + (stats.today_earnings || 0);
            document.getElementById("weekEarnings").textContent = "$" + (stats.week_earnings || 0);
            document.getElementById("activeJobs").textContent = stats.active_jobs || 0;
            document.getElementById("completedToday").textContent = stats.completed_today || 0;
        }
    } catch (e) {
        console.warn("Could not load stats", e);
    }

    // 2. Load Job History
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/vendor/${vendorId}`);
        if (!response.ok) throw new Error("Could not fetch history");

        const bookings = await response.json();

        // Clear existing static cards (keeping the header)
        const header = historyContainer.querySelector("h3");
        historyContainer.innerHTML = "";
        if (header) historyContainer.appendChild(header);

        if (bookings.length === 0) {
            historyContainer.innerHTML += "<p>No job history found.</p>";
            return;
        }

        bookings.forEach(job => {
            const card = document.createElement("div");
            card.className = "job-card";
            card.innerHTML = `
                <div class="job-header">
                    <div>
                        <h4>Customer #${job.customer_id}</h4>
                        <p class="job-type">Service ID: ${job.service_id}</p>
                    </div>
                    <span class="status ${job.status}">${job.status}</span>
                </div>
                <p class="job-info">📍 ${job.address}</p>
                <p class="job-info">🕒 ${new Date(job.date_time).toLocaleString()}</p>
                <p class="job-info"><strong>💰 Price:</strong> $${job.price}</p>
                ${job.latitude ? `<a href="https://www.google.com/maps?q=${job.latitude},${job.longitude}" target="_blank" style="color:#007bff; text-decoration:none;">🗺️ Map</a>` : ''}
            `;
            historyContainer.appendChild(card);
        });

    } catch (e) {
        console.error("Error loading history", e);
        historyContainer.innerHTML += "<p>Error loading data.</p>";
    }
}

// Auto-run if on the history page
if (document.querySelector(".jobs")) {
    document.addEventListener("DOMContentLoaded", loadVendorHistory);
}
