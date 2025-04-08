<template>
  <div class="reports">
    <h1>Reports</h1>
    <button class="traffic-button" @click="showDatePicker = true">📊 Show Traffic Report</button>

    <div v-if="showDatePicker" class="datepicker-popup">
      <input type="date" v-model="selectedDate" />
      <button @click="fetchTrafficReport">Get Report</button>
      <button @click="showDatePicker = false">Cancel</button>
    </div>

    <div v-if="showChart" class="modal">
      <div class="modal-content">
        <h2>Traffic Report for {{ selectedDate }}</h2>
        <canvas ref="chartRef"></canvas>
        <button @click="showChart = false">Close</button>
      </div>
    </div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Title } from 'chart.js'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Title)

const showDatePicker = ref(false)
const selectedDate = ref('')
const trafficData = ref([])
const errorMessage = ref('')
const showChart = ref(false)
const chartRef = ref(null)
let chartInstance = null

function formatHour(hourStr) {
  const hour = parseInt(hourStr)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12} ${suffix}`
}

const fetchTrafficReport = async () => {
  if (!selectedDate.value) {
    errorMessage.value = 'Please select a date.'
    return
  }

  errorMessage.value = ''
  showDatePicker.value = false

  try {
    const res = await fetch(`http://localhost:3000/traffic-report?date=${selectedDate.value}`)
    if (!res.ok) throw new Error('Failed to fetch report')
    trafficData.value = await res.json()
    await nextTick(() => {
      renderChart()
      showChart.value = true
    })
  } catch (err) {
    errorMessage.value = 'Could not load traffic report.'
    console.error(err)
  }
}

const renderChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartRef.value.getContext('2d')
  const labels = trafficData.value.map(entry => formatHour(entry.hour))
  const data = trafficData.value.map(entry => entry.transactions)

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Transactions',
        data,
        backgroundColor: '#007BFF'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Hourly Transactions (Eastern Time)'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}
</script>

<style scoped>
.reports {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.traffic-button {
  background-color: #007BFF;
  color: white;
  padding: 10px 15px;
  border: none;
  cursor: pointer;
  margin-bottom: 20px;
  border-radius: 4px;
}

.traffic-button:hover {
  background-color: #0056b3;
}

.datepicker-popup {
  margin-bottom: 20px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.modal-content canvas {
  width: 100%;
  max-width: 600px;
  height: 300px;
  margin: 20px auto;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
