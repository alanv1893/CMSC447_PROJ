<template>
  <div class="container">
    <div class="titleBox">
      <h1 class="logInTitle">Retrievers Essentials</h1>
    </div>
    <div class="logInBox">
      <h2 class="boxTitle">Log In</h2>
      <div class="logInInput">
        <p class="logInText">Username</p>
        <input class="inputBox" type="text" v-model="username" placeholder="Enter your username" />
      </div>
      <div class="logInInput">
        <p class="logInText">Password</p>
        <input
          class="inputBox"
          type="password"
          v-model="password"
          placeholder="Enter your password"
        />
      </div>
      <div class="logInButton">
        <button class="button" @click="login">Log In</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const dummyLogin = 'user123'
const dummyPassword = 'password'
const router = useRouter()

function login() {
  if (!username.value || !password.value) {
    alert('Please enter both username and password.')
    return
  }
  if (username.value !== dummyLogin || password.value !== dummyPassword) {
    alert('Invalid username or password.')
    return
  }
  localStorage.setItem('loggedIn', 'true')
  router.push('/home')
}

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login()
  })
})
</script>

<style scoped>
@import '../assets/credentialsStyle.css';
</style>
