import { saveToken } from "./auth.js";

const authStatus = document.getElementById("authStatus");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const logoutBtn = document.getElementById("logoutBtn");

// show status if token exists
function updateStatus(msg) {
  if (authStatus) authStatus.textContent = msg || "";
}

// Login
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // get form data
  const fd = new FormData(loginForm);
  const payload = Object.fromEntries(fd.entries()); // { emailOrUsername, password }

  // make request
  try {
    const { data } = await axios.post("/api/auth/login", payload);

    // save token
    saveToken(data.token);

    // update status
    updateStatus("Authenticated");
    loginForm.reset();

    // show success
    alert("Logged in");
  } catch (err) {
    alert(err?.response?.data?.message || "Login failed");
  }
});

// Register
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // get form data
  const fd = new FormData(registerForm);
  const payload = Object.fromEntries(fd.entries()); // { username,email,password }

  // make request
  try {
    const { data } = await axios.post("/api/auth/register", payload);

    // save token
    saveToken(data.token);

    // update status
    updateStatus("Authenticated");
    registerForm.reset();

    // show success
    alert("Registered & logged in");
  } catch (err) {
    alert(err?.response?.data?.message || "Register failed");
  }
});

// Logout
logoutBtn?.addEventListener("click", () => {
  // remove token
  localStorage.removeItem("jwt");

  // update status
  updateStatus("Logged out");

  // show success
  alert("Logged out");
});
