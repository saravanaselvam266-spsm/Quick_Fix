// ==========================================
// BOOKING WIZARD LOGIC
// ==========================================

// Used to stop polling when mechanic accepts booking
let bookingPollInterval = null;

// Booking data stored while user moves through steps
let bookingWizardState = {
  service_id: null,
  price: 0,
  payment: null,
  address: "",
  lat: null,
  lon: null,
};

// Start wizard when page loads
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("service-list-container")) {
    loadServices();
  }
});

// Show specific wizard step
function showStep(step) {
  document
    .querySelectorAll(".wizard-step")
    .forEach((el) => (el.style.display = "none"));

  document.getElementById(`step-${step}`).style.display = "block";

  document.querySelectorAll(".step").forEach((el, i) => {
    el.classList.toggle("active", i + 1 === step);
  });
}

// ==========================================
// SERVICE SELECTION
// ==========================================

// Load services from API
async function loadServices() {
  const list = document.getElementById("service-list-container");

  try {
    const services = await fetch(`${API_BASE_URL}/services/`).then((r) =>
      r.json(),
    );

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

      btn.innerHTML = `<strong>${s.service_name}</strong> - ₹${s.base_price}
        <br><small>${s.description}</small>`;

      btn.onclick = () => selectService(s.service_id, s.base_price);

      list.appendChild(btn);
    });
  } catch {
    list.innerHTML = "<p>Error loading services</p>";
  }
}

// Save selected service
function selectService(id, price) {
  bookingWizardState.service_id = id;
  bookingWizardState.price = price;
  showStep(2);
}

// Save payment method
function selectPayment(method) {
  bookingWizardState.payment = method;
  showStep(3);
}

// ==========================================
// LOCATION DETECTION
// ==========================================

// Detect user location and convert to address
async function detectLocation() {
  const btn = document.querySelector(".locate-btn");

  btn.innerText = "Locating...";

  if (!navigator.geolocation) {
    showToast("Error", "Geolocation not supported by your browser", "error");
    btn.innerText = "📍 Use My Current Location";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      bookingWizardState.lat = latitude;
      bookingWizardState.lon = longitude;

      try {
        btn.innerText = "Fetching Address...";

        const data = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        ).then((r) => r.json());

        const addr = data.address || {};

        const cleanAddress = [
          addr.town || addr.suburb || addr.village,
          addr.city || addr.county,
          addr.state,
          addr.country,
          addr.postcode,
        ]
          .filter(Boolean)
          .join(", ");

        document.getElementById("address").value =
          cleanAddress || data.display_name;

        btn.innerText = "✅ Location Found";
      } catch {
        document.getElementById("address").value =
          `Lat: ${latitude}, Lon: ${longitude}`;

        btn.innerText = "✅ Coordinates Found";
      }
    },
    () => {
      showToast(
        "Permission Denied",
        "Please allow location access in your settings",
        "info",
      );

      btn.innerText = "📍 Use My Current Location";
    },
  );
}

// ==========================================
// FINAL BOOKING SUBMIT
// ==========================================

// Send booking to backend
async function finalSubmitBooking() {
  const address = document.getElementById("address").value;
  const btn = document.querySelector(".continue-btn");

  if (!address) {
    showToast(
      "Input Required",
      "Please enter an address or detect location",
      "error",
    );
    return;
  }

  bookingWizardState.address = address;

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user?.access_token) {
    showToast("Login Required", "Please login to book a service", "info");
    window.location.href = "./login.html";
    return;
  }

  const bookingData = {
    customer_id: user.user_id,
    service_id: bookingWizardState.service_id,
    address: bookingWizardState.address,
    latitude: bookingWizardState.lat,
    longitude: bookingWizardState.lon,
    price: bookingWizardState.price,
    status: "pending",
    vendor_id: null,
    date_time: new Date().toISOString(),
  };

  toggleLoading(btn, true);

  try {
    const res = await fetch(`${API_BASE_URL}/bookings/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.access_token}`,
      },
      body: JSON.stringify(bookingData),
    });

    if (!res.ok) throw new Error();

    const result = await res.json();

    toggleLoading(btn, false);

    showToast(
      "Booking Confirmed!",
      `Service ID: ${result.booking_id} has been created`,
      "success",
    );

    startBookingStatusPolling(result.booking_id);

    setTimeout(() => {
      window.location.href = "user.db1.html";
    }, 1500);
  } catch {
    toggleLoading(btn, false);

    showToast(
      "Booking Failed",
      "Something went wrong. Please try again.",
      "error",
    );
  }
}

// ==========================================
// CHECK IF MECHANIC ACCEPTED
// ==========================================

// Poll backend every 3 seconds
function startBookingStatusPolling(id) {
  clearInterval(bookingPollInterval);

  bookingPollInterval = setInterval(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const booking = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        headers: { Authorization: `Bearer ${user.access_token}` },
      }).then((r) => r.json());

      if (booking.status === "accepted") {
        clearInterval(bookingPollInterval);

        showToast(
          "Mechanic Found!",
          "A mechanic has accepted your booking and is on the way!",
          "success",
        );

        const btn = document.querySelector(".continue-btn");

        if (btn) {
          btn.innerText = "Mechanic Found!";
          btn.style.backgroundColor = "#28a745";
        }
      }
    } catch {
      console.error("Polling error");
    }
  }, 3000);
}
