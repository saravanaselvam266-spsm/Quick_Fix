
document.querySelector(".login-btn").addEventListener("click", loginAdmin);

function loginAdmin(event) {
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
                // Strict Role Check for Admin
                if (data.role === "admin") {
                    alert("Login successful");
                    // Save user info
                    localStorage.setItem("user", JSON.stringify(data));
                    window.location.href = "./admin_dashboard.html";
                } else {
                    alert("Access Denied: You are not an admin. Your role is: " + data.role);
                }
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Login failed: " + error.message);
        });
}
