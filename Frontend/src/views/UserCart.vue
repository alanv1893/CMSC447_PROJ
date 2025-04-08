<template>
  <div class="container">
    <div class="titleBox">
      <h1 class="title">Retrievers Essentials</h1>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
    </div>

    <h3 class="bodyTitle">Create a Cart</h3>
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
          <option v-for="n in 10" :key="n" :value="Number(n)">{{ n }}</option>
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
  { category: '', product: '', quantity: '' }
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

.bodyTitle{
  font-size: 2rem;
  font-weight: bold;
  margin-top: 80px;

  text-align: center;
}
.cart-items-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cart-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.dropdown {
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid black;
  border-radius: 5px;
}

.add-button,
.create-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  border: none;
}

.add-button {
  background-color: black;
  color: #FFD700;
}

.create-button {
  background-color: black;
  color: #FFD700;
}

.success-message {
  margin-top: 1rem;
  font-weight: bold;
  color: green;
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
</style>