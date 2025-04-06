<template>
  <div class="container">
    <div class="titleBox">
      <h1 class="title">Retrievers Essentials</h1>
      <a class="logInLink" v-if="!loggedIn" href="/">Log In</a>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
    </div>
    <div v-if="!transactionComplete" class="cart-items-container">
      <div class="cart-item" v-for="(item, index) in items" :key="index">
        <select v-model="item.category" class="dropdown">
          <option disabled value="">Select Category</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <select v-model="item.product" class="dropdown">
          <option disabled value="">Select Product</option>
          <option v-for="prod in productsByCategory[item.category] || []" :key="prod.id" :value="prod.productname">{{ prod.productname }}</option>
        </select>

        <select v-model="item.quantity" class="dropdown">
          <option disabled value="">Quantity</option>
          <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <button @click="addItem" class="add-button">➕ Add Another Item</button>
      <button @click="createTransaction" class="create-button">🧾 Create Transaction</button>
    </div>
    <div v-else class="cart-items-container">
      <p class="success-message">✅ Your cart ID is: {{ cartId }}</p>
      <RouterLink to="/home" class="create-button">🏠 Return Home</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()
const loggedIn = ref(false)
const items = ref([
  { category: '', product: '', quantity: null }
])
const cartId = ref(null)
const transactionComplete = ref(false)
const categories = ref([])
const productsByCategory = ref({})

function logOut() {
  localStorage.removeItem('loggedIn')
  router.push('/')
}

function addItem() {
  items.value.push({ category: '', product: '', quantity: null })
}

async function createTransaction() {
  try {
    const cartRes = await fetch('http://localhost:3000/carts', {
      method: 'POST'
    })
    const cartData = await cartRes.json()
    cartId.value = cartData.cart_id

    for (const item of items.value) {
      await fetch('http://localhost:3000/cart-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: cartId.value,
          productname: item.product,
          quantity: item.quantity
        })
      })
    }

    transactionComplete.value = true
  } catch (error) {
    console.error('Transaction failed:', error)
  }
}

onMounted(async () => {
  loggedIn.value = localStorage.getItem('loggedIn') === 'true'
  if (!loggedIn.value) {
    router.push('/')
  }

  try {
    const categoryRes = await fetch('http://localhost:3000/categories')
    const categoryData = await categoryRes.json()
    categories.value = categoryData

    for (const category of categories.value) {
      const itemRes = await fetch(`http://localhost:3000/items/category/${category}`)
      const itemData = await itemRes.json()
      productsByCategory.value[category] = itemData
    }
  } catch (err) {
    console.error('Error fetching categories/items:', err)
  }
})
</script>

<style scoped>
@import '../assets/cartStyle.css';

.cart-items-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.cart-item {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.dropdown {
  padding: 0.5rem;
  font-size: 1rem;
}

.add-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #ffc800;
  color: black;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.create-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.success-message {
  margin-top: 1rem;
  font-weight: bold;
  color: green;
}
</style>
