


document.querySelector(".login-btn").addEventListener("click", loginUser);

function loginUser(event) {
  event.preventDefault();
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
      if (data.error || data.detail) {
        alert(data.error || data.detail);
      } else {
        // strict role check for Customer Portal (Case Insensitive)
        if (data.role && (data.role.toLowerCase() === "customer" || data.role.toLowerCase() === "admin")) {
          alert("Login successful");
          // save user info
          localStorage.setItem("user", JSON.stringify(data));
          window.location.href = "./user.db1.html";

        } else if (data.role === "vendor" || data.role === "mechanic") {
          alert("Access Denied: You are trying to login as a Vendor on the Customer Portal. Please use the Vendor Login page.");
          window.location.href = "./ven.login.html";
        } else {
          console.log("Role mismatch. Expected 'customer', got:", data.role);
          alert("Login successful but Access Denied.\n\nYour account role is: '" + data.role + "'.\nPlease use the correct portal.");
        }
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("Login failed: " + error.message);
    });
}

