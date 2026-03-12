// Get logged-in user from localStorage
const user = JSON.parse(localStorage.getItem("user"));

// Redirect if user not logged in
if (!user) {
  showToast(
    "Login Required",
    "Please login to access your service history",
    "info",
  );
  window.location.href = "./login.html";
}

// Show welcome message
const nameSpan = document.getElementById("userName");
if (nameSpan) nameSpan.innerText = user.name;

// Load booking history and stats
async function loadCustomerHistory() {
  try {
    // Common request config
    const options = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.access_token}`,
      },
    };

    // Fetch bookings, services and users together
    const [bookings, services, users] = await Promise.all([
      fetch(`${API_BASE_URL}/bookings/user/${user.user_id}`, options).then(
        (r) => r.json(),
      ),
      fetch(`${API_BASE_URL}/services/`, options).then((r) => r.json()),
      fetch(`${API_BASE_URL}/users/`, options).then((r) => r.json()),
    ]);

    // Convert arrays to quick lookup objects
    const serviceMap = Object.fromEntries(
      services.map((s) => [s.service_id, s.service_name]),
    );
    const userMap = Object.fromEntries(users.map((u) => [u.user_id, u]));

    // Calculate stats
    let upcoming = 0,
      completed = 0,
      spent = 0;

    bookings.forEach((b) => {
      const price = Number(b.price) || 0;
      if (b.status === "completed") {
        completed++;
        spent += price;
      } else {
        upcoming++;
      }
    });

    // Update stats in UI
    const upCount = document.getElementById("upcomingCount");
    const compCount = document.getElementById("completedCount");
    const spentText = document.getElementById("totalSpent");

    if (upCount) upCount.innerText = upcoming;
    if (compCount) compCount.innerText = completed;
    if (spentText) spentText.innerText = `₹${spent}`;

    // Get history container
    const container = document.getElementById("historyList");
    if (!container) return;

    container.innerHTML = "<h3>Service History</h3>";

    // Filter completed bookings
    const history = bookings.filter((b) => b.status === "completed");

    if (!history.length) {
      container.innerHTML += "<p>No completed services yet.</p>";
      return;
    }

    // Render each booking card
    history.forEach((b) => {
      const vendor = userMap[b.vendor_id];
      const vendorName = vendor ? vendor.name : `Mechanic #${b.vendor_id}`;
      const contact = vendor?.phone
        ? `📞 ${vendor.phone}`
        : vendor?.email
          ? `📧 ${vendor.email}`
          : "";

      const service = serviceMap[b.service_id] || `Service #${b.service_id}`;
      const rating = b.rating ? `⭐ ${b.rating}/5` : "No Rating";

      const avatarName = vendor ? vendor.name : "Mechanic";
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=007bff&color=fff`;

      const card = document.createElement("div");
      card.className = "booking-card";

      card.innerHTML = `
        <div class="left">
          <img src="${avatarUrl}">
          <div class="details">
            <h4>Mechanic: ${vendorName}</h4>
            ${contact ? `<p class="details">${contact}</p>` : ""}
            <p class="service">Service: ${service}</p>
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
    // Show error if API fails
    console.error("Error loading history:", err);
    document.getElementById("historyList").innerHTML +=
      "<p>Error loading data.</p>";
  }
}

// Start loading data
loadCustomerHistory();

// Logout user
function logout() {
  localStorage.removeItem("user");
  window.location.href = "./login.html";
}

document.querySelector(".logout")?.addEventListener("click", logout);
