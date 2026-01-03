document.querySelector(".create-btn").addEventListener("click", createCustomer);

function createCustomer(event) {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;
  const address = document.getElementById("address").value +
    ", " + document.getElementById("city").value +
    ", " + document.getElementById("state").value;

  if (!name || !email || !phone || !password) {
    alert("Please fill all required fields");
    return;
  }

  const userData = {
    name: name,
    email: email,
    phone: phone,
    password: password, // Send as 'password', backend handles hashing
    role: "customer",
    address: address
  };

  fetch(`${API_BASE_URL}/users/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error || data.detail) {
        alert("Error: " + (data.error || data.detail));
      } else {
        alert("Account created successfully! Please login.");
        window.location.href = "login.html";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Sign up failed: " + error.message);
    });
}
