<template>
  <div class="container">
    <div class="titleBox">
      <div class="backButton" @click="goBack" title="Go Back">
        <span class="backButton-text">Back</span>
      </div>
      <h1 class="title">Retriever Essentials</h1>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
    </div>
    <h3 class="form-title">Add New Item</h3>
    <form @submit.prevent="submitItem">
      <div class="form-group">
        <label>Category:</label>
        <input v-model="category" placeholder="Category" required />
      </div>
      <div class="form-group">
        <label>Product Name:</label>
        <input v-model="productname" placeholder="Product Name" required />
      </div>
      <div class="form-group">
        <label>Vendor:</label>
        <input v-model="vendor" placeholder="Vendor" required />
      </div>
      <div class="form-group">
        <label>Brand Name:</label>
        <input v-model="brand_name" placeholder="Brand Name" required />
      </div>
      <div class="form-group">
        <label>Cost ($):</label>
        <input
          v-model="cost"
          placeholder="Cost ($)"
          type="number"
          step="0.01"
          required
          @blur="formatCost"
        />
      </div>
      <div class="form-group">
        <label>Quantity (items):</label>
        <input v-model.number="quantity" placeholder="Quantity" type="number" min="1" required />
      </div>
      <button type="submit">Add Item</button>
    </form>

    <button class="popup-button" @click="showUploadModal = true">📤 Upload Excel File</button>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="showUploadModal = false">
      <div class="modal-content">
        <h3>Upload Inventory File</h3>
        <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" />
        <div class="modal-buttons">
          <button @click="submitFile" :disabled="!file">Submit Upload</button>
          <button @click="showUploadModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <p v-if="responseMessage">{{ responseMessage }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const productname = ref('')
const cost = ref('')
const category = ref('')
const vendor = ref('')
const brand_name = ref('')
const quantity = ref(1)
const responseMessage = ref('')
const loggedIn = ref(false)
const file = ref(null)
const showUploadModal = ref(false)



function handleFileUpload(event) {
  file.value = event.target.files[0]
}

async function submitFile() {
  if (!file.value) return

  const formData = new FormData()
  formData.append('file', file.value)

  try {
    const res = await fetch('http://localhost:3000/upload-items', {
      method: 'POST',
      body: formData
    })

    const result = await res.json()
    responseMessage.value = `Uploaded successfully: ${result.successCount} items. Errors: ${result.errorCount}`
    file.value = null
    showUploadModal.value = false
  } catch (err) {
    responseMessage.value = 'Upload failed: ' + err.message
  }
}


function formatCost() {
  if (cost.value !== '' && !isNaN(cost.value)) {
    cost.value = parseFloat(cost.value).toFixed(2)
  }
}

function goBack() {
  history.back()
}

function logOut() {
  localStorage.removeItem('loggedIn')
  router.push('/')
}

onMounted(() => {
  loggedIn.value = localStorage.getItem('loggedIn') === 'true'
  if (!loggedIn.value) {
    router.push('/')
  }
})

async function submitItem() {
  const payload = {
    productname: productname.value,
    cost: parseFloat(cost.value),
    category: category.value,
    vendor: vendor.value,
    brand_name: brand_name.value,
    quantity: quantity.value
  }

  try {
    const res = await fetch('http://localhost:3000/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText)
    }

    const data = await res.json()
    responseMessage.value = data.message || 'Item added successfully!'
    //reset
    productname.value = '';
    cost.value = '';
    vendor.value = '';
    category.value = '';
    brand_name.value = '';
    quantity.value = 1;
  } catch (err) {
    responseMessage.value = 'Error: ' + err.message
  }
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
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
}

.title {
  margin: 0;
  font-size: 3rem;
  font-weight: bold;
}

.form-title {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 100px;
  margin-bottom: 20px;
  text-align: center;
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 500px;
  margin: 0 auto;
}

.form-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  gap: 10px;
}

label {
  flex: 1;
  font-weight: bold;
  font-size: 1.1rem;
  text-align: left;
}

input {
  flex: 2;
  padding: 10px;
  font-size: 16px;
  border-radius: 5px;
  border: 1px solid black;
}

button {
  background-color: black;
  color: white;
  font-weight: bold;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  padding: 10px;
  font-size: 16px;
}

button:hover {
  background-color: #333;
}

.responseMessage {
  margin-top: 20px;
  font-size: 1.2rem;
  color: #333;
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
.popup-button {
  background-color: green;
  color: white;
  font-weight: bold;
  border: none;
  padding: 10px 20px;
  margin-top: 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.popup-button:hover {
  background-color: darkgreen;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.modal-content h3 {
  margin-bottom: 20px;
}

.modal-content input[type="file"] {
  margin-bottom: 20px;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 20px; /* Spacing between buttons */
  margin-top: 20px;
}

</style>
