document.querySelector(".create-btn").addEventListener("click", createCustomer);

function createCustomer() {
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
    password_hash: password,
    role: "customer",
    address: address
  };

  fetch("http://127.0.0.1:8000/users/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {

        alert("Account created successfully!");
        window.location.href = "./login.html"
        console.log("Success:", data);

      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Sign up failed: " + error.message);
    });
}