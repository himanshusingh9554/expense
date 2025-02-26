document.addEventListener("DOMContentLoaded", async () => {
  console.log("Dashboard JS Loaded");

  // DOM Elements
  const transactionsList = document.getElementById("transactions-list");
  const addTransactionBtn = document.getElementById("add-transaction-btn");
  const totalBalanceElement = document.getElementById("total-balance");
  const totalIncomeElement = document.getElementById("total-income");
  const totalExpenseElement = document.getElementById("total-expense");

  // Premium / user info stuff
  const premiumBanner = document.getElementById("premium-banner");
  const premiumBtn = document.getElementById("premium-btn");
  const logoutBtn = document.getElementById("logout");
  const reportsBtn = document.getElementById("reports");
  const settingsBtn = document.getElementById("settings");

  // Pagination-related
  const rowsPerPageSelect = document.getElementById("rows-per-page-select");
  const nextBtn = document.getElementById("next-page-btn");
  const prevBtn = document.getElementById("prev-page-btn");
  const pageInfoEl = document.getElementById("page-info");

  // Load token
  const token = localStorage.getItem("token");
  console.log("Token from localStorage:", token);
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  // Check Dark Mode
  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === "true") {
    document.body.classList.add("dark-mode");
  }

  // Check Payment Status
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("status");
  if (paymentStatus === "success") {
    alert("Transaction successful!");
    fetchUserName();
  } else if (paymentStatus === "failed") {
    alert("Transaction failed!");
  }

  // Sidebar Navigation
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
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

  // Pagination
  let currentPage = 1;
  let rowsPerPage = parseInt(localStorage.getItem("rowsPerPage")) || 10;

  if (rowsPerPageSelect) {
    rowsPerPageSelect.value = rowsPerPage;
    rowsPerPageSelect.addEventListener("change", () => {
      rowsPerPage = parseInt(rowsPerPageSelect.value);
      localStorage.setItem("rowsPerPage", rowsPerPage);
      currentPage = 1;
      fetchTransactions();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentPage++;
      fetchTransactions();
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        fetchTransactions();
      }
    });
  }

  // Fetch user info
  async function fetchUserName() {
    try {
      const response = await fetch("http://localhost:5000/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }
      const user = await response.json();
      console.log("User info:", user);

      const greetingEl = document.getElementById("user-greeting");
      greetingEl.textContent = `Welcome, ${user.name}!`;

      if (user.premium) {
        if (premiumBanner) premiumBanner.style.display = "block";
        if (premiumBtn) premiumBtn.style.display = "none";
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  }

  // Premium purchase
  async function goPremium() {
    try {
      if (!token) {
        alert("Please log in first.");
        return;
    }
      const response = await fetch("http://localhost:5000/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: 499 })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error("Could not create order");
      }
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Error creating premium order:", error);
      alert("Failed to start premium purchase");
    }
  }
  if (premiumBtn) {
    premiumBtn.addEventListener("click", goPremium);
  }

  // Transactions
  let transactionsData = [];

  async function fetchTransactions() {
    try {
      const url = `http://localhost:5000/api/expenses?page=${currentPage}&limit=${rowsPerPage}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Transaction response data:", data);

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error("Invalid response format from server");
      }

      transactionsData = data.data;
      renderTransactions(transactionsData);

      if (pageInfoEl) {
        pageInfoEl.textContent = `Page ${data.currentPage} of ${data.totalPages}`;
      }
      if (prevBtn) {
        prevBtn.disabled = data.currentPage <= 1;
      }
      if (nextBtn) {
        nextBtn.disabled = data.currentPage >= data.totalPages;
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }

  function renderTransactions(transactions) {
    transactionsList.innerHTML = "";
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
      if (transaction.type === "income") {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${transaction.name || "Unnamed"}</td>
        <td>₹${transaction.amount}</td>
        <td class="${transaction.type}">${transaction.type}</td>
        <td>${transaction.category || "N/A"}</td>
        <td>
          <button class="edit-btn" data-id="${transaction.id}">Edit</button>
          <button class="delete-btn" data-id="${transaction.id}">Delete</button>
        </td>
      `;
      transactionsList.appendChild(row);
    });

    totalBalanceElement.innerText = `₹${totalIncome - totalExpense}`;
    totalIncomeElement.innerText = `₹${totalIncome}`;
    totalExpenseElement.innerText = `₹${totalExpense}`;

    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", deleteTransaction);
    });
    document.querySelectorAll(".edit-btn").forEach(button => {
      button.addEventListener("click", editTransaction);
    });
  }

  if (addTransactionBtn) {
    addTransactionBtn.addEventListener("click", addTransaction);
  }
  async function addTransaction(event) {
    event.preventDefault();
    const name = document.getElementById("transaction-name").value.trim();
    const amount = parseFloat(document.getElementById("transaction-amount").value);
    const type = document.getElementById("transaction-type").value;
    const category = document.getElementById("transaction-category").value;
    const date = document.getElementById("transaction-date").value;

    if (!name || isNaN(amount) || amount <= 0 || !category || !date) {
      alert("Enter valid transaction details (including a valid date in YYYY-MM-DD).");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, amount, category, type, date })
      });
      if (!response.ok) throw new Error("Failed to add transaction");
      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  }

  async function deleteTransaction(event) {
    const transactionId = event.target.dataset.id;
    try {
      const response = await fetch(`http://localhost:5000/api/expenses/${transactionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to delete transaction");
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  }

  function editTransaction(event) {
    const transactionId = event.target.dataset.id;
    const transaction = transactionsData.find(t => t.id === transactionId);
    if (!transaction) {
      alert("Transaction not found");
      return;
    }
    const modal = document.getElementById("edit-modal");
    modal.style.display = "block";

    document.getElementById("edit-transaction-name").value = transaction.name;
    document.getElementById("edit-transaction-amount").value = transaction.amount;
    document.getElementById("edit-transaction-type").value = transaction.type;
    document.getElementById("edit-transaction-category").value = transaction.category;

    const saveBtn = document.getElementById("save-edit-btn");
    const closeBtn = document.getElementById("close-edit-btn");

    // Remove old listeners
    saveBtn.replaceWith(saveBtn.cloneNode(true));
    const newSaveBtn = document.getElementById("save-edit-btn");

    newSaveBtn.addEventListener("click", async () => {
      const updatedName = document.getElementById("edit-transaction-name").value.trim();
      const updatedAmount = parseFloat(document.getElementById("edit-transaction-amount").value);
      const updatedType = document.getElementById("edit-transaction-type").value;
      const updatedCategory = document.getElementById("edit-transaction-category").value;

      try {
        const response = await fetch(`http://localhost:5000/api/expenses/${transactionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: updatedName,
            amount: updatedAmount,
            category: updatedCategory,
            type: updatedType,
            date: transaction.date
          })
        });
        if (!response.ok) throw new Error("Failed to update transaction");
        modal.style.display = "none";
        fetchTransactions();
      } catch (error) {
        console.error("Error updating transaction:", error);
      }
    });

    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  // initial calls
  fetchUserName();
  fetchTransactions();
});
