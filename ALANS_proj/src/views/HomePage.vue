<template>
  <div class="container">
    <div class="titleBox">
      <h1 class="title">Retrievers Essentials</h1>
      <a class="logInLink" v-if="!loggedIn" href="/">Log In</a>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
    </div>
    <table id="data-table">
      <thead>
        <tr>
          <th class="name">Name</th>
          <th class="price">Price</th>
          <th class="quantity">Quantity</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in testData" :key="index">
          <td>{{ item.Name }}</td>
          <td class="priceRow">{{ item.Price }}</td>
          <td class="priceRow">{{ item.Quantity }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loggedIn = ref(false)

const testData = ref([
  { Name: 'Apple', Quantity: 10, Price: '$1.00' },
  { Name: 'Banana', Quantity: 5, Price: '$0.50' },
  { Name: 'Cherry', Quantity: 20, Price: '$2.00' },
  { Name: 'Orange', Quantity: 8, Price: '$1.50' },
  { Name: 'Grapes', Quantity: 15, Price: '$2.00' },
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
@import '../assets/homeStyle.css';
</style>
