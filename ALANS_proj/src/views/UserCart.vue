<template>
  <div class="container">
    <div class="titleBox">
      <h1 class="title">Retrievers Essentials</h1>
      <a class="logInLink" v-if="!loggedIn" href="/">Log In</a>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
    </div>
    <div>
      <!-- Add cart content here later -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loggedIn = ref(false)

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
@import '../assets/cartStyle.css';
</style>
