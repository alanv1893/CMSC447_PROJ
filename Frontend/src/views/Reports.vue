<template>
  <div class="page-container">
    <header class="header-bar">
      <div class="nav-buttons">
        <div class="nav-left">
          <div class="backButton" @click="goBack" title="Go Back">
            <span class="backButton-text">Back</span>
          </div>
        </div>
        <div class="nav-right">
          <div class="logoutButton" @click="logout" title="Logout">
            <span class="logoutButton-text">Log Out</span>
          </div>
        </div>
      </div>
      <h1>Reports Dashboard</h1>
    </header>
    <div class="reports-page">
      <div class="content-container">

        <div class="report-card">
          <div class="titleBox">
            <h2>Sales Reports</h2>
            <p>Select a start and end date to view all sales during that period.</p>
            <div class="report-input">
              <input v-model="salesStartDate" type="date" />
              <input v-model="salesEndDate" type="date" />
              <button @click="getSalesReport">Show Sales</button>
            </div>
          </div>
          <div v-if="loadingSales">🔄 Loading...</div>
          <div v-else-if="salesReport.items && salesReport.items.length">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in salesReport.items" :key="item.productname">
                  <td>{{ item.productname }}</td>
                  <td>{{ item.total_quantity }}</td>
                  <td>${{ item.total_revenue.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
            <p><strong>Total Cost:</strong> ${{ salesReport.totalRevenue.toFixed(2) }}</p>
          </div>
          <div v-else-if="salesStartDate && salesEndDate">No sales found for this range.</div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

function goBack() {
  history.back()
}

function logout() {
  window.location.href = '/login'
}

const salesStartDate = ref('')
const salesEndDate = ref('')
const salesReport = ref({ items: [], totalRevenue: 0 })
const loadingSales = ref(false)

const getSalesReport = async () => {
  if (!salesStartDate.value || !salesEndDate.value) return
  loadingSales.value = true
  salesReport.value = { items: [], totalRevenue: 0 }
  try {
    const res = await fetch(`http://localhost:3000/analytics/sales-report?start_date=${salesStartDate.value}&end_date=${salesEndDate.value}`)
    const data = await res.json()
    salesReport.value = {
      items: Array.isArray(data.items) ? data.items : [],
      totalRevenue: data.totalRevenue || 0
    }
  } catch (err) {
    console.error('Error fetching sales report:', err)
  } finally {
    loadingSales.value = false
  }
}
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Updated title bar styles to match Approve Transactions */
.header-bar {
  background-color: black;
  color: #FFD700;
  width: 100vw;
  height: 80px;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  overflow: hidden;
  z-index: 10;
}

.header-bar h1 {
  font-size: 3rem;
  font-weight: bold;
  margin: 0;
  padding: 0;
  font-family: 'Arial', sans-serif;
}

.nav-buttons {
  position: absolute;
  top: 25px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  box-sizing: border-box;
  z-index: 11;
}

.nav-left,
.nav-right {
  display: flex;
  align-items: center;
}

.backButton {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.backButton-text {
  color: gold;
  font-size: 1.2rem;
  font-weight: bold;
  text-decoration: underline;
}

.logoutButton {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logoutButton-text {
  color: gold;
  font-size: 1.2rem;
  font-weight: bold;
  text-decoration: underline;
}

/* Main report container */
.reports-page {
  background-color: #f5c100;
  min-height: 100vh;
  padding-top: 100px; /* Space for fixed header */
  padding-bottom: 40px;
  font-family: 'Arial', sans-serif;
}

.content-container {
  width: 90%;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.report-card {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #333;
}

.report-input {
  display: flex;
  gap: 15px;
  justify-content: flex-start;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 20px;
}

.report-input input[type="date"] {
  padding: 4px 8px;
  border: 2px solid #ccc;
  border-radius: 5px;
  font-size: 13px;
  font-family: 'Arial', sans-serif;
  background-color: white;
  color: #333;
  outline: none;
  width: 80px;
}

.report-input input[type="date"]:focus {
  border-color: #000;
}

button {
  padding: 10px 15px;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Arial', sans-serif;
}

button:hover {
  background-color: #222;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #333;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f0f0f0;
}

pre {
  background: #eee;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

body,
input,
button {
  font-family: 'Arial', sans-serif;
}
</style>
