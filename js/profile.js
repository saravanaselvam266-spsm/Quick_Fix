/**
 * Simple JavaScript to handle the profile page
 * This version supports both Customers and Mechanics/Vendors
 */

// 1. Get the current logged-in user from localStorage
let user = JSON.parse(localStorage.getItem("user"));

// 2. Check if a user is actually logged in
if (!user) {
  showToast("Login Required", "Please login to view your profile", "info");
  window.location.href = "./login.html";
}

// 3. Helper function to show data on the page
function populateUI(userData) {
  // Basic Details
  document.getElementById("fullName").innerText = userData.name || "N/A";
  document.getElementById("userEmail").innerText = userData.email || "N/A";
  document.getElementById("userPhone").innerText = userData.phone || "N/A";
  document.getElementById("userAddress").innerText =
    userData.address || "No address set";
  document.getElementById("displayUserName").innerText =
    userData.name || "User";
  document.getElementById("displayRole").innerText = userData.role || "User";

  // Dashboard Link (points to the right page based on role)
  const dashboardLink = document.getElementById("dashboardLink");
  if (userData.role === "mechanic" || userData.role === "vendor") {
    dashboardLink.href = "./ven.db1.html";
    // Show mechanic specific fields
    document.getElementById("mechanicDetails").style.display = "block";
    document.getElementById("mechanicEditDetails").style.display = "block";

    document.getElementById("userSpecialty").innerText =
      userData.specialty || "Not specified";
    document.getElementById("userExperience").innerText =
      (userData.experience_years || 0) + " years";
  } else {
    dashboardLink.href = "./user.db1.html";
  }

  // Fill the Edit inputs
  document.getElementById("editName").value = userData.name || "";
  document.getElementById("editEmail").value = userData.email || "";
  document.getElementById("editPhone").value = userData.phone || "";
  document.getElementById("editAddress").value = userData.address || "";

  // Mechanic Edit inputs
  if (document.getElementById("editSpecialty")) {
    document.getElementById("editSpecialty").value = userData.specialty || "";
    document.getElementById("editExperience").value =
      userData.experience_years || 0;
  }

  // Set profile image (Placeholder)
  const profilePic = document.getElementById("profilePic");
  profilePic.src =
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(userData.name || "User") +
    "&background=007bff&color=fff";

  // Store current data globally so we can use it in Save
  window.currentUserData = userData;
}

/**
 * Fetch fresh data from the backend
 */
async function fetchUserDetails() {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
    if (response.ok) {
      const fullUserData = await response.json();
      populateUI(fullUserData);
    } else {
      // If offline or error, use local data
      populateUI(user);
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    populateUI(user);
  }
}

fetchUserDetails();

/**
 * Toggle between Edit and View Mode
 */
function toggleEdit(isEditing) {
  document.getElementById("profileView").style.display = isEditing
    ? "none"
    : "block";
  document.getElementById("profileEdit").style.display = isEditing
    ? "block"
    : "none";
}

/**
 * Handle Save Form
 */
document
  .getElementById("editForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    // Collect data from the form
    const name = document.getElementById("editName").value;
    const email = document.getElementById("editEmail").value;
    const phone = document.getElementById("editPhone").value;
    const address = document.getElementById("editAddress").value;
    const specialty = document.getElementById("editSpecialty")?.value || "N/A";
    const experience = parseFloat(document.getElementById("editExperience")?.value) || 0;

    // Simple validation for beginners
    if (!name || !email || !phone) {
      showToast("Input Required", "Name, Email and Phone are required", "info");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      showToast("Invalid Email", "Please enter a valid email address", "error");
      return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      showToast("Invalid Phone", "Please enter a valid 10-digit phone number", "error");
      return;
    }

    if (user.role === "mechanic" || user.role === "vendor") {
      if (experience < 0 || isNaN(experience)) {
        showToast("Invalid Experience", "Please enter valid years of experience", "error");
        return;
      }
    }

    const updatedData = {
      name: name,
      email: email,
      phone: phone,
      address: address,
      role: user.role,
      specialty: specialty,
      experience_years: experience,
      rating: window.currentUserData?.rating || 0,
      availability: true,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        showToast("Success", "Profile updated successfully!", "success");

        // Update local stored name
        user.name = updatedData.name;
        localStorage.setItem("user", JSON.stringify(user));

        // Reload to show changes after toast
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        showToast(
          "Update Failed",
          "Failed to save changes. Please try again.",
          "error",
        );
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast(
        "Server Error",
        "Please ensure your backend is running.",
        "error",
      );
    }
  });

/**
 * Logout
 */
function logout() {
  localStorage.removeItem("user");
  window.location.href = "./login.html";
}
