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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:global(html),
:global(body) {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden; /* Optional: helps remove any scrollbars */
}

/* Your existing styles */
.logInTitle {
  font-weight: bold;
  font-size: 3rem;
  text-align: center;
  color: gold;
}

.container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  margin: 0 auto;
  background-color: rgba(255, 194, 15, 255);
  height: 100vh;
  width: 100vw;
  position: relative;
}

.logInBox{
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    background-color: rgb(251, 239, 216);
    border: solid;
    border-color: black;

    border-radius: 50px;
    height: 500px;
    width: 350px;
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    padding: 20px;
}

.boxTitle{
    font-weight: bold;
    font-size: 2rem;
    text-align: center;
}

.logInInput{
    margin-top: 50px;
}

.logInText{
    text-align: left;
    font-weight: 700;
    font-size: 1.5rem;
}

.inputBox{
    border-radius: 10px;
    text-align: left;
    height: 30px;
    width: 250px;
    margin-top:5px;
}
.inputBox::placeholder {
    text-align: left; /* Keep placeholder text aligned to the left */
    padding-left: 5px;
}

.logInButton{
    margin-top: 100px; 
}

.button{
    background-color: black ;
    color: gold;
    border-radius: 10px;
    padding: 10px 20px;
    text-decoration: none;
    display: inline-block;
    cursor: pointer;
    width: 200px;
    height: 50px;
    font-size: 25px;
    text-align: center;
    font-weight: bold;
}

.button:hover{
    background-color: rgb(78, 78, 78);
    color: gold;
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

</style>