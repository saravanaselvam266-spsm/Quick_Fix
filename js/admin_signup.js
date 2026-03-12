document.querySelector(".create-btn").addEventListener("click", createAdmin);

function createAdmin(event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;
  const submitBtn = document.querySelector(".create-btn");

  if (!name || !email || !phone || !password) {
    showToast("Input Required", "Please fill all required fields", "info");
    return;
  }

  // Simple validation for beginners
  if (!email.includes("@") || !email.includes(".")) {
    showToast("Invalid Email", "Please enter a valid email address", "error");
    return;
  }

  if (phone.length !== 10 || isNaN(phone)) {
    showToast("Invalid Phone", "Please enter a valid 10-digit phone number", "error");
    return;
  }

  if (password.length < 6) {
    showToast("Weak Password", "Password must be at least 6 characters", "error");
    return;
  }

  toggleLoading(submitBtn, true);

  const userData = {
    name: name,
    email: email,
    phone: phone,
    password: password,
    // address is optional for admin, not included in form
  };

  fetch(`${API_BASE_URL}/users/admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => response.json())
    .then((data) => {
      toggleLoading(submitBtn, false);
      if (data.error || data.detail) {
        showToast("Signup Error", data.error || data.detail, "error");
      } else {
        showToast(
          "Success",
          "Admin account created successfully! Please login.",
          "success",
        );
        setTimeout(() => {
          window.location.href = "admin_login.html";
        }, 1500);
      }
    })
    .catch((error) => {
      toggleLoading(submitBtn, false);
      console.error("Error:", error);
      showToast("Signup Failed", error.message, "error");
    });
}
