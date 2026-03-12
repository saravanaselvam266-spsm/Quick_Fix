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
  const submitBtn = document.querySelector(".submit-btn");

  // get selected specialties
  const checkedBoxes = document.querySelectorAll(".specialty:checked");
  let specialties = [];

  checkedBoxes.forEach((box) => {
    specialties.push(box.value);
  });

  // basic validation
  if (!name || !email || !phone || !experience || !password) {
    showToast("Input Required", "Please fill all required fields", "info");
    return;
  }

  toggleLoading(submitBtn, true);

  // create data object
  const vendorData = {
    name: name,
    email: email,
    phone: phone,
    password: password,
    address: address,
    specialty: specialties.join(", "),
    experience_years: Number(experience),
    availability: true,
  };

  // send data to backend
  fetch(`${API_BASE_URL}/users/vendors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vendorData),
  })
    .then((response) => response.json())
    .then((data) => {
      toggleLoading(submitBtn, false);
      if (data.error) {
        showToast("Signup Error", data.error, "error");
      } else {
        showToast(
          "Success",
          "Vendor account created successfully! Please login.",
          "success",
        );
        setTimeout(() => {
          window.location.href = "./ven.login.html";
        }, 1500);
      }
    })
    .catch((error) => {
      toggleLoading(submitBtn, false);
      console.error(error);
      showToast("Signup Failed", error.message, "error");
    });
}
