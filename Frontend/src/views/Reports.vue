<template>
  <div class="backButton" @click="goBack" title="Go Back">
    <span class="backButton-text">Back</span>
  </div>
  <div class="reports-page">
    <div class="titleBox">
      <h1>Reports Dashboard</h1>
    </div>

    <div class="content-container">
      <div class="report-card">
        <h2>📈 Weekly Cart Report</h2>
        <p>Select a Sunday to view the weekly cart activity for that week.</p>
        <div class="report-input">
          <input v-model="weekStart" type="date" />
          <button @click="getWeeklyTraffic">Get Report</button>
        </div>
        <div v-if="loading">🔄 Loading...</div>
        <div v-else-if="weeklyTraffic.total_carts !== undefined">
          <strong>Total carts:</strong> {{ weeklyTraffic.total_carts }}
        </div>
        <div v-else-if="weekStart">No data for this date.</div>
      </div>

      <div class="report-card">
        <h2>💰 Sales Report</h2>
        <p>Select a start and end date to view all sales during that period.</p>
        <div class="report-input">
          <input v-model="salesStartDate" type="date" />
          <input v-model="salesEndDate" type="date" />
          <button @click="getSalesReport">Show Sales</button>
        </div>
        <div v-if="loadingSales">🔄 Loading...</div>
        <div v-else-if="salesReport.items && salesReport.items.length">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity Sold</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in salesReport.items" :key="item.productname">
                <td>{{ item.productname }}</td>
                <td>{{ item.total_quantity }}</td>
                <td>\${{ item.total_revenue.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
          <p><strong>Total Revenue:</strong> \${{ salesReport.totalRevenue.toFixed(2) }}</p>
        </div>
        <div v-else-if="salesStartDate && salesEndDate">No sales found for this range.</div>
      </div>

    </div>
    <div class="report-card" v-if="salesReport && (salesReport.items.length || salesReport.totalRevenue)">
      <h3>🔧 Raw Sales Report Debug Data</h3>
      <pre>{{ salesReport }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const weekStart = ref('')
const weeklyTraffic = ref({})
const loading = ref(false)

const getWeeklyTraffic = async () => {
  if (!weekStart.value) return
  loading.value = true
  weeklyTraffic.value = {}
  try {
    const res = await fetch(`http://localhost:3000/analytics/weekly-traffic?start_date=${weekStart.value}`)
    const data = await res.json()
    weeklyTraffic.value = data
  } catch (err) {
    console.error('Error fetching report:', err)
  } finally {
    loading.value = false
  }
}

function goBack() {
  history.back()
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
.reports-page {
  background-color: #f5c100;
  min-height: 100vh;
  padding-bottom: 40px;
  font-family: 'Arial', sans-serif;
}

.titleBox {
  background-color: #000;
  color: gold;
  padding: 20px;
  text-align: center;
  font-weight: bold;
  font-size: 28px;
}

.content-container {
  width: 90%;
  max-width: 800px;
  margin: 30px auto;
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
  gap: 10px;
  margin-top: 10px;
  margin-bottom: 20px;
}

button {
  padding: 10px 15px;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #222;
}

.backButton {
  margin: 20px;
  cursor: pointer;
  font-weight: bold;
  color: #333;
  display: inline-block;
}

.backButton-text {
  text-decoration: underline;
}

.backButton:hover .backButton-text {
  color: #000;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #333;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f0f0f0;
}
</style>

pre {
  background: #eee;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
