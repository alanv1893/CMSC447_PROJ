<template>
  <div class="container">
    <!-- Top Title Bar -->
    <div class="titleBox">
      <div class="backButton" @click="goBack" title="Go Back">
        <span class="backButton-text">Back</span>
      </div>
      <h1 class="title">Retriever Essentials</h1>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
    </div>

    <!-- Page Title -->
    <h3 class="form-title">📜 Past Transactions</h3>

    <!-- Scrollable list of transactions -->
    <div class="transaction-list">
      <div
        v-for="cart in transactions"
        :key="cart.id"
        class="transaction-card"
        @click="openPopup(cart.id)"
      >
        <p><strong>ID:</strong> {{ cart.id }}</p>
        <p><strong>Status:</strong> {{ cart.status }}</p>
        <p><strong>Time:</strong> {{ cart.timestamp }}</p>
      </div>
    </div>

    <!-- Popup Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closePopup">
      <div class="modal-content modal-scroll">
        <div class="modal-header">
          <h3>Transaction ID: {{ selectedCartId }}</h3>
          <button @click="closePopup" class="close-btn">✖</button>
        </div>
        <ul class="item-list">
          <li v-for="item in selectedItems" :key="item.productname">
            {{ item.productname }} — Qty: {{ item.quantity }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import router from '@/router'

const transactions = ref([])
const selectedItems = ref([])
const selectedCartId = ref(null)
const showModal = ref(false)
const loggedIn = ref(false)

function goBack() {
  history.back()
}

function logOut() {
  localStorage.removeItem('loggedIn')
  router.push('/')
}

function closePopup() {
  showModal.value = false
  selectedItems.value = []
  selectedCartId.value = null
}

function openPopup(cartId) {
  selectedCartId.value = cartId
  showModal.value = true
  fetch(`http://localhost:3000/cart-items/${cartId}`)
    .then(res => res.json())
    .then(data => {
      selectedItems.value = data
    })
    .catch(err => {
      console.error('Failed to fetch cart items:', err)
    })
}

function fetchTransactions() {
  fetch('http://localhost:3000/carts?status=completed')
    .then(res => res.json())
    .then(data => {
      transactions.value = data
    })
    .catch(err => {
      console.error('Failed to fetch transactions:', err)
    })
}

onMounted(() => {
  loggedIn.value = localStorage.getItem('loggedIn') === 'true'
  if (!loggedIn.value) {
    router.push('/')
  } else {
    fetchTransactions()
  }
})
</script>

<style scoped>
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
  margin-top: 40px;  /* Reduced from 100px */
  margin-bottom: 20px;
  text-align: center;
}

.transaction-list {
  max-width: 600px;
  margin: 0 auto;
  max-height: 60vh;
  overflow-y: auto;
}

.transaction-card {
  background-color: white;
  border: 1px solid black;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  text-align: left;
  cursor: pointer;
  transition: background 0.3s;
}

.transaction-card:hover {
  background-color: #ffe97f;
}

/* Modal Styling */
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
  padding: 20px 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  text-align: left;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  font-weight: bold;
  color: red;
  cursor: pointer;
}

.item-list {
  list-style-type: none;
  padding-left: 0;
}

.item-list li {
  padding: 10px 0;
  border-bottom: 1px solid #ddd;
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
</style>
