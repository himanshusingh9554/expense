document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Not logged in!");
      window.location.href = "index.html";
      return;
    }

    const startDateEl = document.getElementById("start-date");
    const endDateEl = document.getElementById("end-date");
    const filterBtn = document.getElementById("filter-btn");
    const downloadBtn = document.getElementById("download-btn");

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

    let incomeExpenseChart = null;
    let secondChart = null;

    async function fetchReports(startDate = "", endDate = "") {
      try {//13.235.74.23:http://localhost:5000/api/reports
        let url = "http://13.235.74.23/api/reports";
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

        renderIncomeExpenseChart(data);
        renderSecondChart(data);
  
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    }

    function renderIncomeExpenseChart(data) {
      const { income = 0, expenses = 0 } = data;

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
  
 
    function renderSecondChart(data) {
     
     
      const categoryData = data.categoryBreakdown || {
        Food: 200,
        Rent: 500,
        Shopping: 100
      };
  
     
      const categories = Object.keys(categoryData);
      const amounts = Object.values(categoryData);
  
     
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

    if (filterBtn) {
      filterBtn.addEventListener("click", () => {
        const startDate = startDateEl.value;
        const endDate = endDateEl.value;
        fetchReports(startDate, endDate);
      });
    }
  
    if (downloadBtn) {
      downloadBtn.addEventListener("click", downloadExpensesAsCSV);
    }
  
    async function downloadExpensesAsCSV() {
      try {
//13.235.74.23:http://localhost:5000/api/expenses?limit=999999
        const url = "http://13.235.74.23/api/expenses?limit=999999";
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const jsonData = await response.json();
        if (!jsonData.success) {
          console.error("Error fetching expenses for download:", jsonData.message);
          return;
        }
  
        const expenses = jsonData.data || [];
  
        const csvRows = [];
 
        csvRows.push(["Name", "Type", "Amount", "Category", "Date"].join(","));
  
   
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

        const blob = new Blob([csvString], { type: "text/csv" });
        const blobUrl = URL.createObjectURL(blob);
  
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "expenses.csv"; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
  
      } catch (error) {
        console.error("Error downloading expenses:", error);
      }
    }
    fetchReports();
  });
  