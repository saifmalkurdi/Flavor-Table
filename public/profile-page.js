import { authHeaders, getToken } from "./auth.js";

const needLogin = document.getElementById("needLogin");
const profileWrap = document.getElementById("profileWrap");
const profileForm = document.getElementById("profileForm");
const pwdForm = document.getElementById("pwdForm");

// Load profile
async function loadProfile() {
  if (!getToken()) {
    needLogin.hidden = false;
    profileWrap.hidden = true;
    return;
  }
  needLogin.hidden = true;
  profileWrap.hidden = false;

  try {
    const { data } = await axios.get("/api/users/profile", {
      headers: authHeaders(),
    });
    profileForm.elements.username.value = data.username || "";
    profileForm.elements.email.value = data.email || "";
    document.getElementById("createdAt").textContent = data.created_at
      ? new Date(data.created_at).toLocaleString()
      : "—";
  } catch (e) {
    alert(e?.response?.data?.message || "Failed to load profile");
  }
}

profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(profileForm);
  const payload = Object.fromEntries(fd.entries()); // username, email (optional)
  try {
    const { data } = await axios.put("/api/users/profile", payload, {
      headers: authHeaders(),
    });
    alert("Profile updated");
    profileForm.elements.username.value = data.username || "";
    profileForm.elements.email.value = data.email || "";
  } catch (e) {
    alert(e?.response?.data?.message || "Failed to update profile");
  }
});

pwdForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(pwdForm);
  const payload = Object.fromEntries(fd.entries()); // currentPassword, newPassword
  try {
    await axios.put("/api/users/password", payload, { headers: authHeaders() });
    alert("Password updated");
    pwdForm.reset();
  } catch (e) {
    alert(e?.response?.data?.message || "Failed to change password");
  }
});

loadProfile();
