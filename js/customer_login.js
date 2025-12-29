
const API_BASE_URL = "http://127.0.0.1:8000";

document.querySelector(".login-btn").addEventListener("click", loginUser);

function loginUser() {
  const loginInput = document.getElementById("loginInput").value;
  const password = document.getElementById("passwordInput").value;

  // basic validation
  if (!loginInput || !password) {
    alert("Please enter email/phone and password");
    return;
  }

  const loginData = {
    username: loginInput,
    password: password
  };

  fetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(loginData)
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
      } else {
        // strict role check for Customer Portal
        if (data.role === "customer") {
          alert("Login successful");
          // save user info
          localStorage.setItem("user", JSON.stringify(data));
          window.location.href = "./user.db1.html";

        } else if (data.role === "vendor" || data.role === "mechanic") {
          alert("Access Denied: You are trying to login as a Vendor on the Customer Portal. Please use the Vendor Login page.");
          window.location.href = "./ven.login.html";
        } else {
          alert("Login failed: Unauthorized role.");
        }
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("Login failed: " + error.message);
    });
}

