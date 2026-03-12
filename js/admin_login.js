document.querySelector(".login-btn").addEventListener("click", loginAdmin);

function loginAdmin(event) {
  event.preventDefault();

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
      if (data.error || data.detail) {
        showToast("Login Error", data.error || data.detail, "error");
      } else {
        showToast("Success", "Login successful!", "success");
        // Save user info
        localStorage.setItem("user", JSON.stringify(data));

        setTimeout(() => {
          window.location.href = "./admin_dashboard.html";
        }, 1000);
      }
    })
    .catch((error) => {
      toggleLoading(submitBtn, false);
      console.error("Error:", error);
      showToast("Network Error", "Login failed: " + error.message, "error");
    });
}
