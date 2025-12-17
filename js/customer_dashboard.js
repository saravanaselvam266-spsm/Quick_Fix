// Get logged-in user
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  alert("Please login first");
  window.location.href = "./login.html";
}

// --------------------
// Set username
// --------------------
document.getElementById("userName").innerText = user.name;        

// --------------------
// Load dashboard summary
// --------------------
fetch(`http://127.0.0.1:8000/users/dashboard/summary/${user.user_id}`)
  .then(res => res.json())
  .then(data => {
    document.getElementById("upcomingCount").innerText = data.upcoming;
    document.getElementById("completedCount").innerText = data.completed;
    document.getElementById("totalSpent").innerText = `₹${data.total_spent}`;
  });

// --------------------
// Load user bookings
// --------------------
fetch(`http://127.0.0.1:8000/bookings/user/${user.user_id}`)
  .then(res => res.json())
  .then(bookings => {
    const list = document.getElementById("bookingList");
    list.innerHTML = "";

    bookings.forEach(b => {
      const card = document.createElement("div");
      card.className = "booking-card";

      card.innerHTML = `
        <img src="https://via.placeholder.com/60" class="profile" />
        <div class="info">
          <h4>${b.vendor_id ? "Mechanic #" + b.vendor_id : "Searching for Mechanic..."}</h4>
          <p class="service">Service #${b.service_id}</p>
          <p class="details"> ${new Date(b.date_time).toLocaleString()}</p>
          <p class="details"> ${b.address}</p>
          <p class="price">$${b.price}</p>
        </div>
        <span class="status ${b.status}">${b.status}</span>
      `;

      list.appendChild(card);
    });
  });

// --------------------
// Logout function
// --------------------
function logout() {
  localStorage.removeItem("user");
  window.location.href = "./login.html";
}
