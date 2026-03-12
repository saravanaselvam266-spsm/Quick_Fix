function showToast(title, message, type = "info") {
  // 1. Find or create the container for toasts
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  // 2. Create the toast element
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  // 3. Set the content
  toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
    `;

  // 4. Add to container
  container.appendChild(toast);

  // 5. Automatically remove after 3.5 seconds
  setTimeout(() => {
    toast.classList.add("fade-out");
    // Wait for animation to finish before removing
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3500);
}
