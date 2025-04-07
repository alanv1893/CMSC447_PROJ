<template>
  <div class="approve-page">
    <div class="transactions-panel">
      <h2>📝 Pending Transactions</h2>
      <div v-if="carts.length === 0" class="empty-text">No pending carts to approve.</div>
      <div v-else class="cart-list">
        <div v-for="cart in carts" :key="cart.cart_id || cart.id" class="cart-box">
          <span class="cart-id" @click="openModal(cart)">Cart #{{ cart.cart_id || cart.id }}</span>
          <span class="cart-time">{{ formatDate(cart.created_at || cart.timestamp) }}</span>
        </div>
      </div>
    </div>

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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const carts = ref([])
const selectedCart = ref(null)
const cartItems = ref([])

async function fetchCarts() {
  try {
    const res = await fetch('http://localhost:3000/carts')
    const data = await res.json()
    carts.value = data
  } catch (err) {
    console.error('Error fetching carts:', err)
  }
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
    await fetch('http://localhost:3000/approve-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart_id: cartId }) // ✅ FIXED
    })

    // ✅ Remove approved cart from UI
    carts.value = carts.value.filter(cart => (cart.cart_id || cart.id) !== cartId)
    selectedCart.value = null
  } catch (err) {
    console.error('Error approving cart:', err)
  }
}


function rejectCart(cartId) {
  // Placeholder: implement reject logic if needed
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
</script>

<style scoped>
.approve-page {
  display: flex;
  justify-content: flex-end;
  padding: 2rem;
}

.transactions-panel {
  width: 400px;
  background: white;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  max-height: 80vh;
  overflow-y: auto;
}

.empty-text {
  font-style: italic;
  color: #777;
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

.approve-btn, .reject-btn {
  padding: 0.5rem 1rem;
  font-size: 1rem;
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
</style>
