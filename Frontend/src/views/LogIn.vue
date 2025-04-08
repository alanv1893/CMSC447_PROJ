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
import axios from 'axios' 

const username = ref('')
const password = ref('')
const router = useRouter()

// To test login I have added a user with test@umbc.edu and password is yourpassword

async function login() {
  if (!username.value || !password.value) {
    alert('Please enter both username and password.')
    return
  }

  try {
    const response = await axios.post('http://localhost:3000/login', {
      username: username.value,
      password: password.value
    })

    // If login is successful, save to localStorage and redirect
    localStorage.setItem('loggedIn', 'true')
    localStorage.setItem('userId', response.data.userId) // optional: store user ID
    alert('Login successful!')
    router.push('/home')
  } catch (error) {
    // Handle errors (invalid password, user not found, etc.)
    if (error.response && error.response.data) {
      alert(error.response.data)
    } else {
      alert('An unexpected error occurred.')
    }
  }
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
