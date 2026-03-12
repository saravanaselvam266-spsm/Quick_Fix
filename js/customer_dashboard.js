// ==========================================
// USER DASHBOARD LOGIC
// ==========================================

// Get logged-in user from localStorage
const user = JSON.parse(localStorage.getItem("user"));

// Redirect if user not logged in
if (!user) {
  showToast("Login Required", "Please login to access your dashboard", "info");
  window.location.href = "./user.login.html";
  
}

// Show username on dashboard
document.getElementById("userName").innerText = user.name;


async function loadCustomerDashboard() {
  try {
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

    // Create quick lookup maps
    const serviceMap = Object.fromEntries(
      services.map((s) => [s.service_id, s.service_name]),
    );

    const userMap = Object.fromEntries(users.map((u) => [u.user_id, u]));

    // Calculate dashboard stats
    let upcoming = 0,
      completed = 0,
      spent = 0;

    bookings.forEach((b) => {
      if (b.status === "completed") {
        completed++;
        spent += b.price;
      } else {
        upcoming++;
      }
    });

    // Update stat cards
    document.getElementById("upcomingCount").innerText = upcoming;
    document.getElementById("completedCount").innerText = completed;
    document.getElementById("totalSpent").innerText = `₹${spent}`;

    // Render active bookings
    const list = document.getElementById("bookingList");
    list.innerHTML = "";

    const activeBookings = bookings.filter((b) => b.status !== "completed");

    if (!activeBookings.length) {
      list.innerHTML = "<p>No active bookings found.</p>";
      window.allBookings = bookings;
      return;
    }

    activeBookings.forEach((b) => {
      const vendor = userMap[b.vendor_id];

      const vendorName = vendor
        ? `Mechanic: ${vendor.name}`
        : b.vendor_id
          ? `Mechanic #${b.vendor_id}`
          : "Searching for Mechanic...";

      const contact = vendor?.phone
        ? `📞 ${vendor.phone}`
        : vendor?.email
          ? `📧 ${vendor.email}`
          : "";

      const serviceName =
        serviceMap[b.service_id] || `Service #${b.service_id}`;

      const actionBtn =
        b.status === "accepted" || b.status === "in_progress"
          ? `<button class="complete-btn" onclick="markComplete(${b.booking_id}, this)">✅ Mark Complete</button>`
          : "";

      const avatarName = vendor ? vendor.name : "Mechanic";
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=007bff&color=fff`;
      const card = document.createElement("div");
      card.className = "booking-card";

      card.innerHTML = `
        <img src="${avatarUrl}" class="profile" />

        <div class="info">
          <h4>${vendorName}</h4>
          ${contact ? `<p class="details">${contact}</p>` : ""}
          <p class="service">${serviceName}</p>
          <p class="details">📅 ${new Date(b.date_time).toLocaleString()}</p>
          <p class="details">📍 ${b.address}</p>
          <p class="price">₹${b.price}</p>
        </div>

        <div class="actions">
          <span class="status ${b.status}">${b.status}</span>
          ${actionBtn}
        </div>
      `;

      list.appendChild(card);
    });

    // Store bookings globally for later updates
    window.allBookings = bookings;
  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

// Initialize dashboard
loadCustomerDashboard();

// ==========================================
// MARK BOOKING AS COMPLETED
// ==========================================

function markComplete(id, btn) {
  const booking = window.allBookings.find((b) => b.booking_id === id);
  if (!booking) return;

  if (!confirm("Are you sure this service is completed?")) return;

  toggleLoading(btn, true);

  const updateData = {
    ...booking,
    status: "completed",
  };

  fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.access_token}`,
    },
    body: JSON.stringify(updateData),
  })
    .then(() => {
      showToast("Success", "Service marked as completed!", "success");
      setTimeout(() => {
        location.reload();
      }, 1000);
    })
    .catch((err) => {
      console.error(err);
      toggleLoading(btn, false);
      showToast("Update Failed", "Failed to update booking status", "error");
    });
}

// ==========================================
// LOGOUT USER
// ==========================================

function logout() {
  localStorage.removeItem("user");
  window.location.href = "./login.html";
}
