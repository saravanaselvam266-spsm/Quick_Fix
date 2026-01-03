// Get logged-in user
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  alert("Please login first");
  window.location.href = "./user.login.html";
} else if (user.role === "vendor" || user.role === "mechanic") {
  alert("Access Denied: You are logged in as a Vendor (" + user.name + "). Please logout and login as a Customer account.");
  window.location.href = "ven.login.html";
}
// Admin is allowed to pass through


// --------------------
// Set username
// --------------------
document.getElementById("userName").innerText = user.name;

// --------------------
// Load dashboard summary
// --------------------
// --------------------
// Load user bookings & Calculate Stats
// --------------------
// --------------------
// Load user bookings & Calculate Stats
// --------------------


async function loadCustomerDashboard() {
  try {
    if (!user.access_token) {
      console.warn("No access token found. Please logout and login again.");
    }

    const requestOptions = {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.access_token}`
      }
    };

    // 1. Fetch data in parallel (Bookings, Services, Users)
    const [bookingRes, serviceRes, userRes] = await Promise.all([
      fetch(`${API_BASE_URL}/bookings/user/${user.user_id}`, requestOptions),
      fetch(`${API_BASE_URL}/services/`, requestOptions),
      fetch(`${API_BASE_URL}/users/`, requestOptions)
    ]);

    const bookings = await bookingRes.json();
    const services = await serviceRes.json();
    const users = await userRes.json();

    // Create Lookups
    const serviceMap = {};
    if (Array.isArray(services)) services.forEach(s => serviceMap[s.service_id] = s.service_name);

    const userMap = {}; // Maps UserID -> User Object (Name, Phone, etc.)
    if (Array.isArray(users)) users.forEach(u => userMap[u.user_id] = u);


    // 2. Calculate Stats (Client-Side)
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

    // Update Dashboard Numbers
    document.getElementById("upcomingCount").innerText = upcomingCount;
    document.getElementById("completedCount").innerText = completedCount;
    document.getElementById("totalSpent").innerText = `₹${totalSpent}`;

    // 3. Filter & Show ONLY Active Bookings
    const list = document.getElementById("bookingList");
    list.innerHTML = "";

    const activeBookings = bookings.filter(b => b.status !== "completed");

    if (activeBookings.length === 0) {
      list.innerHTML = "<p>No active bookings found.</p>";
      // Store globally anyway
      window.allBookings = bookings;
      return;
    }

    activeBookings.forEach(b => {
      const card = document.createElement("div");
      card.className = "booking-card";

      // Resolve Names
      const serviceName = serviceMap[b.service_id] || `Service #${b.service_id}`;

      let vendorDisplay = "Searching for Mechanic...";
      let vendorPhoneDisplay = "";

      if (b.vendor_id && userMap[b.vendor_id]) {
        const vendor = userMap[b.vendor_id];
        vendorDisplay = `Mechanic: ${vendor.name}`;
        // Assuming 'phone' or 'email' is available. 
        // If phone isn't directly exposed in user object from this endpoint, we might need to rely on what's there.
        // For now, let's try to show phone if it exists, or email.
        if (vendor.phone) vendorPhoneDisplay = `<p class="details">📞 ${vendor.phone}</p>`;
        else if (vendor.email) vendorPhoneDisplay = `<p class="details">📧 ${vendor.email}</p>`;
      } else if (b.vendor_id) {
        vendorDisplay = `Mechanic #${b.vendor_id}`;
      }

      // Logic for Complete Button
      let actionButton = "";
      if (b.status === "accepted" || b.status === "in_progress") {
        actionButton = `<button class="complete-btn" onclick="markComplete(${b.booking_id})">✅ Mark Complete</button>`;
      }

      card.innerHTML = `
            <img src="https://via.placeholder.com/60" class="profile" />
            <div class="info">
              <h4>${vendorDisplay}</h4>
              ${vendorPhoneDisplay}
              <p class="service">${serviceName}</p>
              <p class="details">📅 ${new Date(b.date_time).toLocaleString()}</p>
              <p class="details">📍 ${b.address}</p>
              <p class="price">₹${b.price}</p>
            </div>
            <div class="actions">
               <span class="status ${b.status}">${b.status}</span>
               ${actionButton}
            </div>
          `;

      list.appendChild(card);
    });

    // Store bookings globally
    window.allBookings = bookings;

  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

// Initialize
loadCustomerDashboard();

// --------------------
// Mark Booking as Complete
// --------------------
function markComplete(bookingId) {
  // Find the booking object
  const booking = window.allBookings.find(b => b.booking_id === bookingId);
  if (!booking) return;

  const confirmComplete = confirm("Are you sure this service is completed?");
  if (!confirmComplete) return;

  // Prepare data for update (Backened expects full object)
  const updateData = {
    customer_id: booking.customer_id,
    vendor_id: booking.vendor_id,
    service_id: booking.service_id,
    address: booking.address,
    date_time: booking.date_time,
    status: "completed", // New Status
    price: booking.price,
    latitude: booking.latitude,
    longitude: booking.longitude
  };

  fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${user.access_token}`
    },
    body: JSON.stringify(updateData)
  })
    .then(res => res.json())
    .then(data => {
      alert("Service marked as Completed!");
      location.reload(); // Refresh to update lists
    })
    .catch(err => console.error("Error completing booking:", err));
}

// --------------------
// Logout function
// --------------------
function logout() {
  localStorage.removeItem("user");
  window.location.href = "./login.html";
}
