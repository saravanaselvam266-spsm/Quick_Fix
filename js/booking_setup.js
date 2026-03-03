// ==========================================
// CLIENT SIDE: BOOKING LOGIC
// ==========================================

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
  lon: null,
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
  document
    .querySelectorAll(".wizard-step")
    .forEach((el) => (el.style.display = "none"));
  // Show target
  document.getElementById(`step-${stepNumber}`).style.display = "block";

  // Update indicators
  document.querySelectorAll(".step").forEach((el, index) => {
    if (index + 1 === stepNumber) el.classList.add("active");
    else el.classList.remove("active");
  });
}

async function loadServicesForWizard() {
  const list = document.getElementById("service-list-container");
  try {
    const res = await fetch(`${API_BASE_URL}/services/`);
    const services = await res.json();
    list.innerHTML = "";

    services.forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "service-select-btn";
      btn.style.padding = "15px";
      btn.style.textAlign = "left";
      btn.style.border = "1px solid #ddd";
      btn.style.borderRadius = "8px";
      btn.style.backgroundColor = "white";
      btn.style.cursor = "pointer";
      btn.innerHTML = `<strong>${s.service_name}</strong> - ₹${s.base_price}<br><small>${s.description}</small>`;
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
  const btn = document.querySelector(".locate-btn"); // More reliable way to get the button
  btn.innerText = "Locating...";

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by this browser.");
    btn.innerText = "📍 Use My Current Location";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Save coordinates to our state
      bookingWizardState.lat = lat;
      bookingWizardState.lon = lon;

      try {
        // Now, let's convert these numbers (Lat/Lon) into a real address!
        // We use a free service called Nominatim (OpenStreetMap)
        btn.innerText = "Fetching Address...";

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        );
        const data = await response.json();

        if (data && data.address) {
          // Extract only the parts we need from the address object
          const addr = data.address;
          const town = addr.town || addr.suburb || addr.village || "";
          const city = addr.city || addr.county || addr.municipality || "";
          const state = addr.state || "";
          const country = addr.country || "";
          const pincode = addr.postcode || "";

          // Put them together in a clean format, skipping any empty ones
          const cleanAddress = [town, city, state, country, pincode]
            .filter((part) => part.trim() !== "")
            .join(", ");

          // Update the input field with our nice short address
          document.getElementById("address").value = cleanAddress;
          btn.innerText = "✅ Location Found";
        } else {
          // Fallback if no specific address components found
          document.getElementById("address").value = data.display_name || `Lat: ${lat}, Lon: ${lon}`;
          btn.innerText = "✅ Location Found";
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        document.getElementById("address").value = `Lat: ${lat}, Lon: ${lon}`;
        btn.innerText = "✅ Coordinates Found";
      }
    },
    () => {
      alert(
        "Unable to retrieve your location. Please check your browser permissions.",
      );
      btn.innerText = "📍 Use My Current Location";
    },
  );
}

async function finalSubmitBooking() {
  const addressInput = document.getElementById("address").value;
  const submitBtn = document.querySelector(".continue-btn");

  // --- BEGINNER VALIDATION ---
  if (!addressInput) {
    alert("Please enter an address or detect location.");
    return;
  }

  // Check if the address has at least town/city, state, and pincode (approx 3 parts)
  const addressParts = addressInput.split(",");
  if (addressParts.length < 3) {
    alert("Address is too short! Please include City, State, and Pincode.");
    return;
  }
  // --- END VALIDATION ---
  bookingWizardState.address = addressInput;

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.access_token) {
    alert("You must be logged in to book a service.");
    window.location.href = "./login.html";
    return;
  }
  const activeUser = user;

  const bookingData = {
    customer_id: activeUser.user_id,
    service_id: bookingWizardState.service_id,
    address: bookingWizardState.address,
    latitude: bookingWizardState.lat, // Fallback if typed manual
    longitude: bookingWizardState.lon,
    price: bookingWizardState.service_price,
    status: "pending",
    vendor_id: null,
    date_time: new Date().toISOString(),
    // could add payment method to DB model if needed, but not in current schema
  };

  toggleLoading(submitBtn, true);

  try {
    const response = await fetch(`${API_BASE_URL}/bookings/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeUser.access_token}`,
      },
      body: JSON.stringify(bookingData),
    });

    if (response.ok) {
      const result = await response.json();
      // Don't remove loading if we are navigating away, but alerts block execution so...
      toggleLoading(submitBtn, false);
      alert(
        `Booking Confirmed! ID: ${result.booking_id}\nPayment: ${bookingWizardState.payment_method}`,
      );
      startBookingStatusPolling(result.booking_id);
      // Maybe redirect to dashboard?
      window.location.href = "user.db1.html";
    } else {
      toggleLoading(submitBtn, false);
      const err = await response.json();
      alert("Error: " + JSON.stringify(err));
    }
  } catch (e) {
    toggleLoading(submitBtn, false);
    console.error(e);
    alert("Booking failed");
  }
}

// Function to check if a mechanic accepted
function startBookingStatusPolling(bookingId) {
  if (bookingPollInterval) clearInterval(bookingPollInterval);

  bookingPollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).access_token}`,
        },
      });
      const booking = await res.json();

      if (booking.status === "accepted") {
        clearInterval(bookingPollInterval);
        alert(
          `Good news! Your mechanic is on the way.\nVendor ID: ${booking.vendor_id}`,
        );

        // Update UI
        const btn = document.querySelector(".continue-btn");
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
// CLIENT SIDE: BOOKING LOGIC
// ==========================================
// (Kept for Customer Booking Wizard)

// ... (Vendor logic moved to vendor_dashboard.js and vendor_history.js) ...
