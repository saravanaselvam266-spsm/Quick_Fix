document.querySelector(".login-btn").addEventListener("click", loginVendor);

function loginVendor() {
  const loginInput = document.getElementById("loginInput").value;
  const password = document.getElementById("passwordInput").value;
  const submitBtn = document.querySelector(".login-btn");

  // basic validation
  if (!loginInput || !password) {
    showToast(
      "Input Required",
      "Please enter email/phone and password",
      "error",
    );
    return;
  }

  toggleLoading(submitBtn, true);

  const loginData = {
    username: loginInput,
    password: password,
  };

  fetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  })
    .then((response) => response.json())
    .then((data) => {
      toggleLoading(submitBtn, false);
      // Check for backend error
      if (data.detail || data.error) {
        showToast("Login Error", data.detail || data.error, "error");
      } else {
        showToast("Success", "Login successful!", "success");

        // Save user info
        localStorage.setItem("user", JSON.stringify(data));

        // Redirect to Vendor Dashboard
        setTimeout(() => {
          window.location.href = "./ven.db1.html";
        }, 1000);
      }
    })
    .catch((error) => {
      toggleLoading(submitBtn, false);
      console.error("Error:", error);
      showToast("Network Error", "Login failed: " + error.message, "error");
    });
}
