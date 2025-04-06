<template>
  <div class="container">
    <div class="titleBox">
      <h1 class="title">Welcome, Admin</h1>
    </div>

    <div class="button-group">
      <RouterLink to="/reports" class="item-link">📊 Run Reports</RouterLink>
      <RouterLink to="/add-item" class="item-link">➕ Add or Review Items</RouterLink>
      <RouterLink to="/cart" class="item-link">🛒 View User Cart</RouterLink>
      <RouterLink to="/Approve-transactions" class="item-link">✅ Approve Transactions</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loggedIn = ref(false)
const items = ref([
  { name: 'Apple', price: '$1.00', quantity: 10 },
  { name: 'Banana', price: '$0.50', quantity: 5 },
  { name: 'Cherry', price: '$2.00', quantity: 20 },
  { name: 'Orange', price: '$1.50', quantity: 8 },
  { name: 'Grapes', price: '$2.00', quantity: 15 }
])

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
  padding: 20px;
  text-align: center;
}

.titleBox {
  background-color: #222;
  color: #ffc800;
  padding: 10px;
}

.title {
  margin: 0;
  font-size: 32px;
  font-weight: bold;
}

.item-link {
  display: inline-block;
  margin: 20px 0;
  background: #000;
  color: #fff;
  padding: 10px 20px;
  text-decoration: none;
  font-weight: bold;
  border-radius: 5px;
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

th, td {
  padding: 10px;
  border: 1px solid #333;
}

th {
  background: #fff2cc;
}
</style>
