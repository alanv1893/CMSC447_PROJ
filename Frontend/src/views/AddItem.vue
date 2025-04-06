<template>
  <div class="container">
    <h1>Add New Item</h1>
    <form @submit.prevent="submitItem">
      <input v-model="productname" placeholder="Product Name" required />
      <input v-model.number="cost" placeholder="Cost" type="number" required />
      <input v-model="category" placeholder="Category" required />
      <input v-model="vendor" placeholder="Vendor" required />
      <input v-model="brand_name" placeholder="Brand Name" required />
      <input v-model.number="quantity" placeholder="Quantity" type="number" required />
      <button type="submit">Add Item</button>
    </form>
    <p v-if="responseMessage">{{ responseMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const productname = ref('')
const cost = ref(0)
const category = ref('')
const vendor = ref('')
const brand_name = ref('')
const quantity = ref(0)
const responseMessage = ref('')

async function submitItem() {
  const payload = {
    productname: productname.value,
    cost: cost.value,
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
  } catch (err) {
    responseMessage.value = 'Error: ' + err.message
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: auto;
  padding: 20px;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
input, button {
  padding: 10px;
  font-size: 16px;
}
button {
  background-color: black;
  color: white;
  font-weight: bold;
  cursor: pointer;
  border: none;
  border-radius: 5px;
}
button:hover {
  background-color: #333;
}
</style>
