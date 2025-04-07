<template>
  <div class="container">
    <h1>📦 Full Inventory</h1>

    <template v-if="inventory.length">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Cost</th>
            <th>Category</th>
            <th>Vendor</th>
            <th>Brand</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in inventory" :key="index">
            <td>{{ item.productname }}</td>
            <td>${{ item.cost }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.vendor }}</td>
            <td>{{ item.brand_name }}</td>
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

onMounted(async () => {
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
.container {
  padding: 2rem;
  background: #fffbe6;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: #ffffff;
}

th, td {
  border: 1px solid #ccc;
  padding: 12px;
  text-align: left;
}

th {
  background-color: #f5c100;
  color: #000;
  font-weight: bold;
}

tbody tr:hover {
  background-color: #fdf5c9;
}

.export-button {
  display: block;
  margin: 30px auto 0;
  padding: 12px 24px;
  background-color: #217346; /* Excel-like blue-green */
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
