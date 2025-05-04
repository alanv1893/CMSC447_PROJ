<template>
  <div class="container">
    <div class="titleBox">
      <h1 class="title">Welcome, {{ role ? role.charAt(0).toUpperCase() + role.slice(1) : '' }}</h1>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
    </div>

    <div class="button-group">
      <!-- Inventory: All roles -->
      <RouterLink to="/home/inventory" class="item-link">📋 View Inventory</RouterLink>

      <!-- Reports: Admin only -->
      <RouterLink v-if="role === 'admin'" to="/home/reports" class="item-link">📊 Run Reports</RouterLink>

      <!-- Add Items: Admin only -->
      <RouterLink v-if="role === 'admin'" to="/home/add-item" class="item-link">➕ Add Items</RouterLink>

      <!-- User Cart: All roles -->
      <RouterLink to="/home/cart" class="item-link">🛒 Create Cart</RouterLink>

      <!-- Approve Transactions: Admin and Cashier -->
      <RouterLink v-if="role === 'admin' || role === 'cashier'" to="/home/approve-transactions" class="item-link">✅ Approve Transactions</RouterLink>

      <RouterLink v-if="role === 'admin'" to="/home/past-transactions" class="item-link">📜 Past Transactions</RouterLink>
    </div>
  </div>
</template>


<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loggedIn = ref(false)
const role = localStorage.getItem('userRole')

function logOut() {
  localStorage.removeItem('loggedIn')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userId')
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
:global(html, body) {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

.container {
  background-color: #f5c100;
  min-height: 100vh;
  padding: 100px 20px 20px; /* top, left/right, bottom */
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
  height: 80px; /* Adjust this value to your preference */
  display: flex;
  align-items: center; /* Centers the text vertically */
  justify-content: center; /* Centers the text horizontally */
}

.title {
  margin: 0;
  font-size: 3rem;
  font-weight: bold;
}

.item-link {
  display: inline-block;
  margin: 20px 0;
  background: #000;
  color: #fff;
  padding: 15px 30px;
  text-decoration: none;
  font-weight: bold;
  border-radius: 8px;
  font-size: 1.25rem;
}

.item-link:hover {
  background: #333;
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
}

th,
td {
  padding: 10px;
  border: 1px solid #333;
}

th {
  background: #fff2cc;
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
