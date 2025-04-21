<template>
  <div class="reports">
    <h1>📈 Reports Dashboard</h1>
    <p>Select a report below to generate:</p>
 
    <div class="report-buttons">
      <button @click="activeReport = 'popular'">📦 Popular Items by Category</button>
      <button @click="activeReport = 'vendor'">🚚 Vendor Frequency</button>
      <button @click="activeReport = 'daily'">📅 Daily Cart Counts</button>
      <button @click="activeReport = 'brand'">🏷️ Brand Demand Over Time</button>
    </div>
 
    <div class="report-preview">
      <template v-if="activeReport === 'popular'">
        <h2>Popular Items by Category</h2>
        <input v-model="category" placeholder="Enter category" />
        <input v-model.number="limit" type="number" placeholder="Limit" />
        <button @click="getPopularItems">Get Report</button>
        <ul>
          <li v-for="row in popularItems" :key="row.productname">{{ row.productname }} — {{ row.total_ordered }}</li>
        </ul>
      </template>
 
      <template v-if="activeReport === 'vendor'">
        <h2>Vendor Order Frequency</h2>
        <input v-model="vendor" placeholder="Enter vendor name" />
        <input v-model="vendorStart" type="date" />
        <input v-model="vendorEnd" type="date" />
        <button @click="getVendorFrequency">Get Report</button>
        <div v-if="vendorReport">
          <p>Orders: {{ vendorReport.num_orders }}</p>
          <p>Units: {{ vendorReport.total_units }}</p>
        </div>
      </template>
 
      <template v-if="activeReport === 'daily'">
        <h2>Daily Cart Counts</h2>
        <input v-model="dailyStart" type="date" />
        <input v-model="dailyEnd" type="date" />
        <button @click="getDailyCarts">Get Report</button>
        <ul>
          <li v-for="row in dailyCarts" :key="row.day">{{ row.day }} — {{ row.cart_count }}</li>
        </ul>
      </template>
 
      <template v-if="activeReport === 'brand'">
        <h2>Brand Demand Over Time</h2>
        <input v-model="brand" placeholder="Enter brand" />
        <select v-model="interval">
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
        <button @click="getBrandDemand">Get Report</button>
        <ul>
          <li v-for="row in brandDemand" :key="row.period">{{ row.period }} — {{ row.total_units }}</li>
        </ul>
      </template>
 
      <p v-if="!activeReport" class="placeholder">Report preview will be displayed here after selection.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeReport = ref(null)

// Popular Items
const category = ref('')
const limit = ref(10)
const popularItems = ref([])
const getPopularItems = async () => {
  const res = await fetch(`/analytics/popular-items/${category.value}?limit=${limit.value}`)
  popularItems.value = await res.json()
}

// Vendor Frequency
const vendor = ref('')
const vendorStart = ref('')
const vendorEnd = ref('')
const vendorReport = ref(null)
const getVendorFrequency = async () => {
  const res = await fetch(`/analytics/vendor-frequency?vendor=${vendor.value}&start_date=${vendorStart.value}&end_date=${vendorEnd.value}`)
  vendorReport.value = await res.json()
}

// Daily Carts
const dailyStart = ref('')
const dailyEnd = ref('')
const dailyCarts = ref([])
const getDailyCarts = async () => {
  const res = await fetch(`/analytics/daily-carts?start_date=${dailyStart.value}&end_date=${dailyEnd.value}`)
  dailyCarts.value = await res.json()
}

// Brand Demand
const brand = ref('')
const interval = ref('month')
const brandDemand = ref([])
const getBrandDemand = async () => {
  const res = await fetch(`/analytics/brand-demand?brand=${brand.value}&interval=${interval.value}`)
  brandDemand.value = await res.json()
}
</script>

<style scoped>
.reports {
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  margin-bottom: 10px;
}

.report-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  background-color: #444;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

button:hover {
  background-color: #222;
}

.report-preview {
  border: 2px dashed #ccc;
  padding: 20px;
  min-height: 150px;
  background-color: #f9f9f9;
}

.placeholder {
  color: #999;
  text-align: center;
}
</style>
