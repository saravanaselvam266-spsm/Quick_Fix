document.querySelector(".create-btn").addEventListener("click", createAdmin);

function createAdmin(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;

    if (!name || !email || !phone || !password) {
        alert("Please fill all required fields");
        return;
    }

    const userData = {
        name: name,
        email: email,
        phone: phone,
        password: password
        // address is optional for admin, not included in form
    };

    fetch("http://127.0.0.1:8000/users/admins", {
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
                alert("Admin account created successfully! Please login.");
                window.location.href = "admin_login.html";
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Sign up failed: " + error.message);
        });
}
