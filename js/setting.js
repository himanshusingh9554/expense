document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
  
    window.location.href = "index.html";
    return;
  }

  const dashboardBtn = document.getElementById("dashboard");
  const reportsBtn = document.getElementById("reports");
  const settingsBtn = document.getElementById("settings");
  const logoutBtn = document.getElementById("logout");
  if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }
  if (reportsBtn) {
    reportsBtn.addEventListener("click", () => {
      window.location.href = "reports.html";
    });
  }
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      window.location.href = "setting.html";
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    });
  }
  const greetingEl = document.getElementById("user-greeting");
  if (greetingEl) {
    try {
      const response = await fetch("http://localhost:5000/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const user = await response.json();
        greetingEl.textContent = `Welcome, ${user.name}!`;
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  }

  const themeToggle = document.getElementById("theme-toggle");

  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === "true") {
    document.body.classList.add("dark-mode");
    if (themeToggle) themeToggle.checked = true;
  }

  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      if (themeToggle.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "true");
      } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "false");
      }
    });
  }

  const updateProfileBtn = document.getElementById("update-profile");
  if (updateProfileBtn) {
    updateProfileBtn.addEventListener("click", async () => {
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const newPassword = document.getElementById("password").value; 
      try {
        const response = await fetch("http://localhost:5000/api/user", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name, email, password: newPassword })
        });

        if (!response.ok) throw new Error("Failed to update profile");
        alert("Profile updated!");
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Error updating profile");
      }
    });
  }

  const uploadPicInput = document.getElementById("upload-pic");
  const profilePic = document.getElementById("profile-pic");
  const labelForPic = document.querySelector(".profile-pic-label");

  if (labelForPic && uploadPicInput) {
    labelForPic.addEventListener("click", () => {
      uploadPicInput.click();
    });

    uploadPicInput.addEventListener("change", () => {
      if (uploadPicInput.files && uploadPicInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          profilePic.src = e.target.result;
        };
        reader.readAsDataURL(uploadPicInput.files[0]);
      }
    });
  }

  const addAccountBtn = document.getElementById("add-account");
  if (addAccountBtn) {
    addAccountBtn.addEventListener("click", () => {
      const accountType = document.getElementById("account-type").value;
      const accountName = document.getElementById("account-name").value;
      if (!accountName.trim()) {
        alert("Enter an account name");
        return;
      }

      const accountList = document.getElementById("account-list");
      const li = document.createElement("li");
      li.textContent = `${accountType}: ${accountName}`;
      accountList.appendChild(li);
    });
  }
});
