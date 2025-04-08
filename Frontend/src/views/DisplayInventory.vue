<template>
  <div class="container">
    <div class="titleBox">
      <h1 class="title">📦 Full Inventory</h1>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
    </div>

    <template v-if="inventory.length">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Product</th>
            <th>Vendor</th>
            <th>Brand</th>
            <th>Cost</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in inventory" :key="index">
            <td>{{ item.category }}</td>
            <td>{{ item.productname }}</td>
            <td>{{ item.vendor }}</td>
            <td>{{ item.brand_name }}</td>
            <td>${{ item.cost }}</td>
            <td>{{ item.quantity }}</td>
          </tr>
        </tbody>
      </table>
      <button class="export-button" @click="exportAsExcel">Download Inventory (.xlsx)</button>
    </template>
    <p v-else>Loading inventory...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'


const inventory = ref([])
const loggedIn = ref(false)

onMounted(async () => {
  loggedIn.value = localStorage.getItem('loggedIn') === 'true'
  if (!loggedIn.value) {
    router.push('/')
  }
  try {
    const res = await fetch('http://localhost:3000/full-inventory')
    inventory.value = await res.json()
  } catch (err) {
    console.error('Failed to load inventory:', err)
  }
})

function exportAsExcel() {
  fetch('http://localhost:3000/export-inventory')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory_report.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(error => {
      console.error('Export failed:', error);
    });
}
</script>

<style scoped>
:global(html, body) {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

.container {
  background-color: #f5c100;
  min-height: 100vh;
  padding: 100px 20px 20px;
  /* top, left/right, bottom */
  text-align: center;
  box-sizing: border-box;
}

.titleBox {
  background-color: black;
  color: #FFD700;
  padding: 10px 0;
  width: 100vw;
  position: absolute;
  top: 0;
  left: 0;
  text-align: center;
  box-sizing: border-box;
  height: 80px;
  /* Adjust this value to your preference */
  display: flex;
  align-items: center;
  /* Centers the text vertically */
  justify-content: center;
  /* Centers the text horizontally */
}

.title {
  margin: 0;
  font-size: 3rem;
  font-weight: bold;
}


.button-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 300px;
  margin: 30px auto;
}

table {
  margin: auto;
  border-collapse: collapse;
  background: #fff;
  width: 100%;
  /* Ensures the table uses the full width */
  table-layout: fixed;
  /* Ensures column widths are evenly distributed */
}

th,
td {
  padding: 10px;
  border: 1px solid #333;
}

th {
  background: #fde768;
}

.logOutLink {
  position: absolute;
  top: 25px;
  right: 20px;
  font-size: 20px;
  white-space: nowrap;
  font-weight: bold;
  color: gold;
}

.export-button {
  display: block;
  margin: 30px auto 0;
  padding: 12px 24px;
  background-color: #217346;
  /* Excel-like blue-green */
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.export-button:hover {
  background-color: #1a5e39;
}
</style>