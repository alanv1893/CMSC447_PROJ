<template>
  <div class="container">
    <div class="titleBox">
      <div class="backButton" @click="goBack" title="Go Back">
        <span class="backButton-text">Back</span>
      </div>
      <h1 class="title">📊 Reports Dashboard</h1>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
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
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const weekStart = ref('')
const weeklyTraffic = ref({})
const loading = ref(false)
const router = useRouter()
const loggedIn = ref(false)

onMounted(() => {
  loggedIn.value = localStorage.getItem('loggedIn') === 'true'
})

function logOut() {
  localStorage.clear()
  router.push('/')
}

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
.container {
  background-color: #f5c100;
  min-height: 100vh;
  padding: 120px 20px 60px;
  box-sizing: border-box;
}

.titleBox {
  background-color: black;
  color: #ffd700;
  width: 100%;
  height: 80px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  margin: 0;
  font-size: 3rem;
  font-weight: bold;
}

.backButton {
  position: absolute;
  top: 25px;
  left: 20px;
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

.logOutLink {
  position: absolute;
  top: 25px;
  right: 20px;
  font-size: 20px;
  white-space: nowrap;
  font-weight: bold;
  color: gold;
  cursor: pointer;
  text-decoration: underline;
}

.content-container {
  width: 90%;
  max-width: 900px;
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
  flex-wrap: wrap;
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

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

th, td {
  border: 1px solid #333;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #fde768;
}

</style>