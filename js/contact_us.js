document.querySelector(".contact-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = this.querySelector('input[placeholder="Your Name"]').value;
  const email = this.querySelector('input[placeholder="Your Email"]').value;
  const subject = this.querySelector('input[placeholder="Subject"]').value;
  const message = this.querySelector("textarea").value;

  if (!name || !email || !subject || !message) {
    showToast("Input Required", "Please fill all fields", "info");
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    showToast("Invalid Email", "Please enter a valid email address", "error");
    return;
  }

  showToast("Success", "Your message has been sent!", "success");

  // Optional: Clear form
  this.reset();
});
