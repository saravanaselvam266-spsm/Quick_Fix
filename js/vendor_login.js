


document.querySelector(".login-btn").addEventListener("click", loginVendor);

function loginVendor() {
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
            // Check for backend error
            if (data.detail || data.error) {
                alert(data.detail || data.error);
            } else {

                // Strict Role Check for Vendor Portal
                if (data.role === "vendor" || data.role === "mechanic") {
                    alert("Login successful");

                    // Save user info
                    localStorage.setItem("user", JSON.stringify(data));

                    // Redirect to Vendor Dashboard
                    window.location.href = "./ven.db1.html";

                } else if (data.role === "customer" || data.role === "admin") {
                    // If a Customer or Admin tries to log in on the Vendor page
                    const roleName = data.role === "admin" ? "Admin" : "Customer";
                    alert(`Access Denied: You are trying to login as a ${roleName} on the Vendor Portal.`);
                    window.location.href = "./user.login.html";
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
