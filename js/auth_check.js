// This script checks if a user is logged in and updates the home page UI
document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("user"));
  const mainNav = document.getElementById("main-nav");
  const authSection = document.getElementById("auth-section");

  if (user && mainNav) {
    // 1. Handle Login and Signup links (hide them if they exist)
    const loginLink = document.getElementById("login-link");
    const signupLink = document.getElementById("signup-link");
    if (loginLink) loginLink.style.display = "none";
    if (signupLink) signupLink.style.display = "none";

    // 2. Add Dashboard link based on role
    const dashboardLink = document.createElement("a");
    dashboardLink.innerText = "Dashboard";

    // Determine correct dashboard URL (handling different path levels)
    const isChildPage = window.location.pathname.includes("/pages/");
    const pathPrefix = isChildPage ? "./" : "./pages/";

    if (user.role === "customer") {
      dashboardLink.href = pathPrefix + "user.db1.html";
    } else if (user.role === "vendor" || user.role === "mechanic") {
      dashboardLink.href = pathPrefix + "ven.db1.html";
    } else if (user.role === "admin") {
      dashboardLink.href = pathPrefix + "admin_dashboard.html";
    }

    mainNav.appendChild(dashboardLink);

    // 2.5 Add Profile link
    if (user.role !== "admin") {
      const profileLink = document.createElement("a");
      profileLink.innerText = "Profile";
      profileLink.href = pathPrefix + "profile.html";
      mainNav.appendChild(profileLink);
    }

    // 3. Add Logout Button (to authSection if it exists, otherwise to mainNav)
    const logoutBtn = document.createElement("button");
    logoutBtn.innerText = "Logout";
    logoutBtn.className = "signup";
    logoutBtn.style.marginLeft = "15px";
    logoutBtn.style.background = "#ff8c00"; // Ensure visibility
    logoutBtn.style.color = "white";
    logoutBtn.style.border = "none";
    logoutBtn.style.padding = "8px 15px";
    logoutBtn.style.borderRadius = "5px";
    logoutBtn.style.cursor = "pointer";

    logoutBtn.onclick = function () {
      localStorage.removeItem("user");
      window.location.href = isChildPage ? "../index.html" : "index.html";
    };

    if (authSection) {
      authSection.appendChild(logoutBtn);
    } else {
      mainNav.appendChild(logoutBtn);
    }
  }
});
