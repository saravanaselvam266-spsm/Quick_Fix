
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

  fetch("http://127.0.0.1:8000/users/login", {
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
        alert("Login successful");

        // save user info (optional)
        localStorage.setItem("user", JSON.stringify(data));

        // redirect based on role
        if (data.role === "customer") {
          window.location.href = "./user.db1.html";
        } else if (data.role === "vendor") {
          window.location.href = "./ven.db1.html";
        }
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("Login failed: " + error.message);
    });
}

