document.addEventListener("DOMContentLoaded", async () => {
  const transactionsList = document.getElementById("transactions-list");
  const addTransactionBtn = document.getElementById("add-transaction-btn");
  const totalBalanceElement = document.getElementById("total-balance");
  const totalIncomeElement = document.getElementById("total-income");
  const totalExpenseElement = document.getElementById("total-expense");
  const premiumBtn = document.getElementById("premium-btn");
  const logoutBtn = document.getElementById("logout");
  const reportsBtn = document.getElementById("reports");
  const settingsBtn = document.getElementById("settings");
  const premiumMessageEl = document.getElementById("premium-message");
  const rowsPerPageSelect = document.getElementById("rows-per-page-select");
  const nextBtn = document.getElementById("next-page-btn");
  const prevBtn = document.getElementById("prev-page-btn");
  const pageInfoEl = document.getElementById("page-info");
  const premiumFeaturesEl = document.getElementById("premium-features"); 
  const filterSelect = document.getElementById("filter-select");
  const downloadBtn = document.getElementById("download-btn");


  let currentUser = null;


  const token = localStorage.getItem("token");
  console.log("Token from localStorage:", token);
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === "true") {
    document.body.classList.add("dark-mode");
  }

  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("status");
  const returnedOrderId = params.get("order_id");

  if (paymentStatus === "success" && returnedOrderId) {
    alert("Transaction successful!");
    verifyPayment(returnedOrderId);
    fetchUserName(); 
  } else if (paymentStatus === "failed") {
    alert("Transaction failed!");
  }
  console.log("returnedOrderId:", returnedOrderId);

  async function verifyPayment(orderId) {
    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/verifyPayment?order_id=${orderId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      console.log("verifyPayment response:", data);

      if (data.success) {
        alert("Payment verified! You are now premium.");
      } else {
        alert("Payment not verified or failed: " + data.message);
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    });
  }

  if (reportsBtn) {
    reportsBtn.addEventListener("click", () => {
      if (!currentUser || !currentUser.premium) {
        alert("You need to be a Premium user to access the Reports page. Please buy Premium!");
        return;
      }

      window.location.href = "reports.html";
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      window.location.href = "setting.html";
    });
  }


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


  async function fetchUserName() {
    try {
      const response = await fetch("http://localhost:5000/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }
      const user = await response.json();
      currentUser = user; 

      console.log("User info:", user);

      const greetingEl = document.getElementById("user-greeting");
      greetingEl.textContent = `Welcome, ${user.name}`;

    
      if (user.premium) {
        if (premiumBtn) premiumBtn.style.display = "none";
        if (premiumMessageEl) premiumMessageEl.style.display = "inline-block";
        if (premiumFeaturesEl) premiumFeaturesEl.style.display = "block";
        if (downloadBtn) downloadBtn.disabled = false;
      } else {
        if (premiumBtn) premiumBtn.style.display = "inline-block";
        if (premiumMessageEl) premiumMessageEl.style.display = "none";
        if (premiumFeaturesEl) premiumFeaturesEl.style.display = "none";
        if (downloadBtn) downloadBtn.disabled = true;
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  }

 
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

      if (!data.success || !data.payment_session_id) {
        throw new Error("Could not create order");
      }

      const cashfree = Cashfree({ mode: "sandbox" });
      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self"
      });
    } catch (error) {
      console.error("Error creating premium order:", error);
      alert("Failed to start premium purchase");
    }
  }

  if (premiumBtn) {
    premiumBtn.addEventListener("click", goPremium);
  }

  async function downloadExpenses() {
    try {
      const response = await fetch("http://localhost:5000/api/expenses/download", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to download expenses");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "expenses.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error downloading expenses:", error);
    }
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadExpenses);
  }

  let transactionsData = [];
  async function fetchTransactions(filter = "all") {
    try {
      const url = `http://localhost:5000/api/expenses?page=${currentPage}&limit=${rowsPerPage}&filter=${filter}`;
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
      if (filterSelect) {
        fetchTransactions(filterSelect.value);
      } else {
        fetchTransactions();
      }
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
      if (filterSelect) {
        fetchTransactions(filterSelect.value);
      } else {
        fetchTransactions();
      }
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
        if (filterSelect) {
          fetchTransactions(filterSelect.value);
        } else {
          fetchTransactions();
        }
      } catch (error) {
        console.error("Error updating transaction:", error);
      }
    });

    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  fetchUserName();
  fetchTransactions();
});
