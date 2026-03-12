const API_BASE_URL = "https://quick-fix-backend.vercel.app";

// const API_BASE_URL = "http://127.0.0.1:8000";


// Helper function to show loading state on buttons
function toggleLoading(button, isLoading, originalText = "Submit") {
  if (isLoading) {
    button.dataset.originalText = button.innerHTML; // Store original text/html
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Loading...';
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || originalText;
  }
}


