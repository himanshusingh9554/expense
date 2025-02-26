document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Not logged in!");
      window.location.href = "index.html";
      return;
    }
  
    // Grab elements
    const startDateEl = document.getElementById("start-date");
    const endDateEl = document.getElementById("end-date");
    const filterBtn = document.getElementById("filter-btn");
    const downloadBtn = document.getElementById("download-btn");
  
    // Sidebar navigation
    document.getElementById("dashboard").addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
    document.getElementById("reports").addEventListener("click", () => {
      window.location.href = "reports.html";
    });
    document.getElementById("settings").addEventListener("click", () => {
      window.location.href = "setting.html";
    });
    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    });
  
    // Chart references
    let incomeExpenseChart = null;
    let secondChart = null;
  
    // 1) fetchReports
    async function fetchReports(startDate = "", endDate = "") {
      try {
        let url = "http://localhost:5000/api/reports";
        const params = [];
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        if (params.length > 0) {
          url += "?" + params.join("&");
        }
  
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
  
        if (!data.success) {
          console.error("Report error:", data.message);
          return;
        }
  
        // Render the two charts
        renderIncomeExpenseChart(data);
        renderSecondChart(data);
  
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    }
  
    // 2) Render Doughnut Chart (Income vs Expense)
    function renderIncomeExpenseChart(data) {
      const { income = 0, expenses = 0 } = data;
  
      // Destroy old chart if it exists
      if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
      }
  
      const ctx = document.getElementById("income-expense-chart").getContext("2d");
      incomeExpenseChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Income", "Expenses"],
          datasets: [
            {
              data: [income, expenses],
              backgroundColor: ["green", "red"]
            }
          ]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false
        }
      });
    }
  
    // 3) Render Second Chart (e.g. bar chart with dummy category data)
    function renderSecondChart(data) {
      // For example, if your server returns data.categoryBreakdown = {Food: 300, Rent: 500, ...}
      // We'll do a quick example:
      const categoryData = data.categoryBreakdown || {
        Food: 200,
        Rent: 500,
        Shopping: 100
      };
  
      // Convert to arrays
      const categories = Object.keys(categoryData);
      const amounts = Object.values(categoryData);
  
      // Destroy old
      if (secondChart) {
        secondChart.destroy();
      }
  
      const ctx = document.getElementById("second-chart").getContext("2d");
      secondChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: categories,
          datasets: [
            {
              label: "Amount by Category",
              data: amounts,
              backgroundColor: "#007bff"
            }
          ]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  
    // 4) Filter button
    if (filterBtn) {
      filterBtn.addEventListener("click", () => {
        const startDate = startDateEl.value;
        const endDate = endDateEl.value;
        fetchReports(startDate, endDate);
      });
    }
  
    // 5) Download Expenses in CSV
    if (downloadBtn) {
      downloadBtn.addEventListener("click", downloadExpensesAsCSV);
    }
  
    async function downloadExpensesAsCSV() {
      try {
        // Fetch all user expenses from the normal expense endpoint (not the report).
        // e.g. if you have GET /api/expenses that returns { data: [...] }.
        // For no pagination, you might do /api/expenses?limit=999999 or create a new endpoint.
        const url = "http://localhost:5000/api/expenses?limit=999999";
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const jsonData = await response.json();
        if (!jsonData.success) {
          console.error("Error fetching expenses for download:", jsonData.message);
          return;
        }
  
        const expenses = jsonData.data || [];
  
        // Convert to CSV
        const csvRows = [];
        // Header
        csvRows.push(["Name", "Type", "Amount", "Category", "Date"].join(","));
  
        // Rows
        for (const exp of expenses) {
          csvRows.push([
            exp.name,
            exp.type,
            exp.amount,
            exp.category,
            exp.date
          ].join(","));
        }
  
        const csvString = csvRows.join("\n");
  
        // Create a blob & download
        const blob = new Blob([csvString], { type: "text/csv" });
        const blobUrl = URL.createObjectURL(blob);
  
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "expenses.csv"; // file name
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
  
      } catch (error) {
        console.error("Error downloading expenses:", error);
      }
    }
  
    // Initial fetch with no date range
    fetchReports();
  });
  