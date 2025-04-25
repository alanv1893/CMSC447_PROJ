<template>
  <div class="container">
    <div class="titleBox">
      <div class="backButton" @click="goBack" title="Go Back">
        <span class="backButton-text">Back</span>
      </div>
      <h1 class="title">Retrievers Essentials</h1>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
    </div>

    <h3 class="bodyTitle">Pending Carts</h3>

    <div class="transactions-panel">
      <div v-if="carts.length === 0" class="empty-text">No pending carts to approve.</div>
      <div v-else class="cart-list">
        <div v-for="cart in carts" :key="cart.cart_id || cart.id" class="cart-box">
          <span class="cart-id" @click="openModal(cart)">Cart #{{ cart.cart_id || cart.id }}</span>
          <span class="cart-time">{{ formatDate(cart.created_at || cart.timestamp) }}</span>
        </div>
      </div>
    </div>

    <!-- Shows cart items -->
    <div v-if="selectedCart" class="modal-overlay">
      <div class="modal">
        <button class="close-btn" @click="selectedCart = null">✖</button>
        <h3>Cart ID: {{ selectedCart.cart_id || selectedCart.id }}</h3>
        <ul class="item-list">
          <li v-for="(item, index) in cartItems" :key="index">
            {{ item.productname }} - Qty: {{ item.quantity }}
          </li>
        </ul>
        <div class="modal-actions">
          <button class="approve-btn" @click="approveCart(selectedCart.cart_id || selectedCart.id)">✅ Approve</button>
          <button class="reject-btn" @click="rejectCart(selectedCart.cart_id || selectedCart.id)">❌ Reject</button>
        </div>
      </div>
    </div>

    <!-- Recheck and override -->
    <div v-if="overridePrompt" class="modal-overlay">
      <div class="modal">
        <button class="close-btn" @click="overridePrompt = false">✖</button>
        <h3>Recheck</h3>
        <p>{{ overrideReason }}</p>
        <input
          type="password"
          placeholder="Enter override password"
          v-model="overridePassword"
          class="override-input"
        />
        <div class="modal-actions">
          <button class="approve-btn" @click="sendApproval(overrideCartId, true)">✅ Override & Approve</button>
          <button class="reject-btn" @click="overridePrompt = false">❌ Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'

const carts = ref([])
const selectedCart = ref(null)
const cartItems = ref([])
const loggedIn = ref(false)
const overridePrompt = ref(false)
const overrideReason = ref('')
const overridePassword = ref('')
const overrideCartId = ref(null)


async function fetchCarts() {
  try {
    const res = await fetch('http://localhost:3000/carts')
    const data = await res.json()
    carts.value = data
  } catch (err) {
    console.error('Error fetching carts:', err)
  }
}

function goBack() {
  history.back()
}

async function fetchCartItems(cartId) {
  try {
    const res = await fetch(`http://localhost:3000/cart-items/${cartId}`)
    const data = await res.json()
    cartItems.value = data
  } catch (err) {
    console.error('Error fetching cart items:', err)
    cartItems.value = []
  }
}

async function approveCart(cartId) {
  try {
    const res = await fetch(`http://localhost:3000/check-inventory/${cartId}`)
    const data = await res.json()

    if (data.status === 'insufficient') {
      overrideReason.value = data.message
      overrideCartId.value = cartId
      overridePrompt.value = true
      return
    }

    await sendApproval(cartId)
  } catch (err) {
    console.error('Error checking inventory:', err)
  }
}

async function sendApproval(cartId, override = false) {
  try {
    const res = await fetch('http://localhost:3000/approve-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart_id: cartId,
        override,
        override_password: override ? overridePassword.value : null,
        override_username: override ? localStorage.getItem('username') : null
      })
    })

    if (!res.ok) {
      const msg = await res.text()
      alert('Approval failed: ' + msg)
      return
    }

    carts.value = carts.value.filter(cart => (cart.cart_id || cart.id) !== cartId)
    selectedCart.value = null
    overridePrompt.value = false
    overridePassword.value = ''
  } catch (err) {
    console.error('Error approving cart:', err)
  }
}



function rejectCart(cartId) {
  selectedCart.value = null
}

function openModal(cart) {
  selectedCart.value = cart
  fetchCartItems(cart.cart_id || cart.id)
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString()
}

onMounted(fetchCarts)
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
</script>

<style scoped>
.container {
  background-color: #f5c100;
  min-height: 100vh;
  padding: 100px 20px 20px;
  box-sizing: border-box;
}

.titleBox {
  background-color: black;
  color: #FFD700;
  width: 100vw;
  height: 80px;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0; /* Remove padding that might push content */
  margin: 0;
  overflow: hidden;
}

.title {
  font-size: 3rem;
  font-weight: bold;
  line-height: 1; /* Avoid vertical spacing inconsistencies */
  margin: 0;
  padding: 0;
}

.bodyTitle {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 80px;
  text-align: center;
}

.transactions-panel {
  max-width: 600px;
  margin: 2rem auto;
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.empty-text {
  font-style: italic;
  color: #777;
  text-align: center;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-box {
  background: #f9f9f9;
  padding: 0.75rem;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}

.cart-box:hover {
  background: #eee;
}

.cart-id {
  font-weight: bold;
  color: #007bff;
  cursor: pointer;
}

.cart-time {
  font-size: 0.9rem;
  color: #555;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 350px;
  position: relative;
  text-align: center;
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-around;
}

.approve-btn,
.reject-btn {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 5px;
  border: none;
  cursor: pointer;
}

.approve-btn {
  background-color: green;
  color: white;
}

.reject-btn {
  background-color: red;
  color: white;
}

.item-list {
  margin-top: 1rem;
  text-align: left;
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

.override-input {
  width: 100%;
  padding: 0.5rem;
  margin-top: 1rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

</style>
