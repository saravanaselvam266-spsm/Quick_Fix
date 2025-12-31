// ----------------------
// Get logged-in user
// ----------------------
// ----------------------
// Get logged-in user
// ----------------------
const user = JSON.parse(localStorage.getItem("user"));
const API_BASE_URL = "http://127.0.0.1:8000";

if (!user) {
  alert("Please login first");
  window.location.href = "./user.login.html";
} else if (user.role === "vendor" || user.role === "mechanic") {
  alert("Access Denied: You are logged in as a Vendor (" + user.name + "). Please logout and login as a Customer account.");
  window.location.href = "ven.login.html";
}
// Admin is allowed to pass through

// ----------------------
// Set username
// ----------------------
if (document.querySelector("h1")) document.querySelector("h1").innerText = `Welcome back, ${user.name}!`;

// ----------------------
// Load Data & Calculate Stats
// ----------------------
async function loadCustomerHistory() {
  try {
    // 1. Fetch Data in Parallel
    const requestOptions = {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.access_token}`
      }
    };

    const [bookingRes, serviceRes, userRes] = await Promise.all([
      fetch(`${API_BASE_URL}/bookings/user/${user.user_id}`, requestOptions),
      fetch(`${API_BASE_URL}/services/`, requestOptions),
      fetch(`${API_BASE_URL}/users/`, requestOptions)
    ]);

    const bookings = await bookingRes.json();
    const services = await serviceRes.json();
    const users = await userRes.json();

    // Create Maps
    const serviceMap = {};
    if (Array.isArray(services)) services.forEach(s => serviceMap[s.service_id] = s.service_name);

    const userMap = {};
    if (Array.isArray(users)) users.forEach(u => userMap[u.user_id] = u);

    // 2. Calculate Stats
    let upcomingCount = 0;
    let completedCount = 0;
    let totalSpent = 0;

    bookings.forEach(b => {
      if (b.status === "completed") {
        completedCount++;
        totalSpent += b.price;
      } else {
        upcomingCount++;
      }
    });

    const upEl = document.getElementById("upcomingCount");
    const compEl = document.getElementById("completedCount");
    const spendEl = document.getElementById("totalSpent");

    if (upEl) upEl.innerText = upcomingCount;
    if (compEl) compEl.innerText = completedCount;
    if (spendEl) spendEl.innerText = `₹${totalSpent}`;

    // 3. Render Completed History
    const container = document.getElementById("historyList");
    if (!container) return;

    container.innerHTML = "<h3>Service History</h3>";

    const historyBookings = bookings.filter(b => b.status === "completed");

    if (historyBookings.length === 0) {
      container.innerHTML += "<p>No completed services yet.</p>";
      return;
    }

    historyBookings.forEach(b => {
      const card = document.createElement("div");
      card.className = "booking-card";

      // Resolve Names
      const serviceName = serviceMap[b.service_id] || `Service #${b.service_id}`;
      let vendorDisplay = "Mechanic: Unknown";
      let vendorPhoneDisplay = "";
      let vendorImg = "https://via.placeholder.com/60";

      if (b.vendor_id && userMap[b.vendor_id]) {
        const vendor = userMap[b.vendor_id];
        vendorDisplay = `Mechanic: ${vendor.name}`;
        if (vendor.phone) vendorPhoneDisplay = `<p class="details" style="color:#28a745;">📞 ${vendor.phone}</p>`;
        else if (vendor.email) vendorPhoneDisplay = `<p class="details">📧 ${vendor.email}</p>`;
      } else if (b.vendor_id) {
        vendorDisplay = `Mechanic #${b.vendor_id}`;
      }

      const rating = b.rating ? `⭐ ${b.rating}/5` : 'No Rating';

      card.innerHTML = `
                <div class="left">
                    <img src="${vendorImg}" />
                    <div class="details">
                        <h4>${vendorDisplay}</h4>
                        ${vendorPhoneDisplay}
                        <p class="service">Service: ${serviceName}</p>
                        <p class="details">📅 ${new Date(b.date_time).toLocaleString()}</p>
                        <p class="details">📍 ${b.address}</p>
                        <p class="price">Paid: ₹${b.price}</p>
                    </div>
                </div>
                <div class="right">
                    <div class="status completed">Completed</div>
                    <div class="rating" style="margin-top:10px;">${rating}</div>
                </div>
            `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading history:", err);
    const container = document.getElementById("historyList");
    if (container) container.innerHTML += "<p>Error loading data.</p>";
  }
}

// Initialize
loadCustomerHistory();

// ----------------------
// Logout
// ----------------------
document.querySelector(".logout").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "./login.html";
});
