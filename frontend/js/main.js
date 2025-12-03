const backendURL = "http://localhost:5000"; // change if backend runs elsewhere

// Login form handler
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    try {
      const res = await fetch(`${backendURL}/api/${role}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      document.getElementById("message").innerText = data.message || "Login success!";

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user || {}));
        window.location.href = role === "admin" ? "admin-dashboard.html" : "user-dashboard.html";
      }
    } catch (err) {
      document.getElementById("message").innerText = "⚠️ Server error!";
      console.error(err);
    }
  });
}

// Register form handler
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    try {
      const res = await fetch(`${backendURL}/api/${role}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      document.getElementById("message").innerText = data.message || "Registered successfully!";

      if (res.ok) {
        setTimeout(() => (window.location.href = "index.html"), 1500);
      }
    } catch (err) {
      document.getElementById("message").innerText = "⚠️ Server error!";
      console.error(err);
    }
  });
}
