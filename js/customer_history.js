// ----------------------
// Get logged-in user
// ----------------------
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  alert("Please login first");
  window.location.href = "./login.html";
}

// ----------------------
// Set username
// ----------------------
document.querySelector("h1").innerText = `Welcome back, ${user.name}!`;

// ----------------------
// Load dashboard summary
// ----------------------
fetch(`http://127.0.0.1:8000/users/dashboard/summary/${user.user_id}`)
  .then(res => res.json())
  .then(data => {
    document.querySelector(".stat-box:nth-child(1) h2").innerText = data.upcoming;
    document.querySelector(".stat-box:nth-child(2) h2").innerText = data.completed;
    document.querySelector(".stat-box:nth-child(3) h2").innerText = `₹${data.total_spent}`;
  });

// ----------------------
// Load service history
// ----------------------
fetch(`http://127.0.0.1:8000/bookings/user/${user.user_id}/history`)
  .then(res => res.json())
  .then(bookings => {
    const container = document.querySelector(".bookings");
    container.innerHTML = "<h3>Service History</h3>";

    bookings.forEach(b => {
      const card = document.createElement("div");
      card.className = "booking-card";

      card.innerHTML = `
        <div class="left">
          <img src="https://via.placeholder.com/60" />
          <div class="details">
            <h4>${b.vendor_name}</h4>
            <p class="service">${b.service_name}</p>
            <p>📅 ${new Date(b.date_time).toLocaleString()}</p>
            <p>📍 ${b.address}</p>
            <p class="price">$${b.price}</p>
          </div>
        </div>
        <div class="right">
          <div class="status completed">Completed</div>
          <div class="rating">⭐ ${b.rating}/5</div>
        </div>
      `;

      container.appendChild(card);
    });
  });

// ----------------------
// Logout
// ----------------------
document.querySelector(".logout").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "./login.html";
});
