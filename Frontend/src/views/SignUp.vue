<template>
  <div class="container">
    <h1 class="logInTitle">Food Database</h1>
    <div class="logInBox">
      <h2 class="boxTitle">Sign Up</h2>
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
        <button class="button" @click="signUp">Sign Up</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('')
const password = ref('')

function signUp() {
  alert(`Signing up: ${username.value} / ${password.value}`)
}
</script>

<style scoped>
@import '../assets/credentialsStyle.css';
</style>
