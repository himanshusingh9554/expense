document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("auth-form");
    const nameField = document.getElementById("name");
    const emailField = document.getElementById("email");
    const passwordField = document.getElementById("password");
    const authButton = document.getElementById("auth-button");
    const toggleText = document.getElementById("toggle-signup");

    let isSignup = false;

    toggleText.addEventListener("click", function () {
        isSignup = !isSignup;
        if (isSignup) {
            nameField.style.display = "block"; 
            authButton.textContent = "Sign Up";
            toggleText.innerHTML = "Already have an account? <span>Login</span>";
        } else {
            nameField.style.display = "none"; 
            authButton.textContent = "Login";
            toggleText.innerHTML = "Don't have an account? <span>Sign up</span>";
        }
    });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const url = isSignup ? "http://127.0.0.1:5000/api/auth/signup" : "http://127.0.0.1:5000/api/auth/login";

        const userData = {
            email: emailField.value,
            password: passwordField.value
        };
        if (isSignup) userData.name = nameField.value;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            if (response.ok && data.token) {
                localStorage.setItem("token", data.token);
                window.location.href = "dashboard.html";
            } else {
                alert(data.message || "Authentication failed");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });
});
