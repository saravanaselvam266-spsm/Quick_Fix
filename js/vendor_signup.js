
// select the button
document.querySelector(".submit-btn").addEventListener("click", vendorSignup);

function vendorSignup(event) {
  event.preventDefault(); // stop page reload

  // get input values
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const experience = document.getElementById("experience").value;
   const address =
    document.getElementById("address").value +
    ", " +
    document.getElementById("city").value +
    ", " +
    document.getElementById("state").value;
  const password = document.getElementById("password").value;

  // get selected specialties
  const checkedBoxes = document.querySelectorAll(".specialty:checked");
  let specialties = [];

  checkedBoxes.forEach(box => {
    specialties.push(box.value);
  });

  // basic validation
  if (!name || !email || !phone || !experience || !password) {
    alert("Please fill all required fields");
    return;
  }

  // create data object
  const vendorData = {
    name: name,
    email: email,
    phone: phone,
    password_hash: password,
    address: address + ", " + city + ", " + state,
    specialty: specialties.join(", "),
    experience_year: Number(experience),
    availability: true
  };

  // send data to backend
  fetch("http://127.0.0.1:8000/users/vendors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(vendorData)
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
      } else {
        alert("Vendor account created successfully!");
        window.location.href = "./ven.login.html";
      }
    })
    .catch(error => {
      console.error(error);
      alert("Server error");
    });
}

