import { createRouter, createWebHistory } from 'vue-router'
import LogIn from '../views/LogIn.vue'
import HomePage from '../views/HomePage.vue'
import SignUp from '../views/SignUp.vue'
import UserCart from '../views/UserCart.vue'
import StoreFavorites from '../views/StoreFavorites.vue'

const routes = [
  { path: '/', name: 'login', component: LogIn },
  { path: '/home', name: 'home', component: HomePage },
  { path: '/signup', name: 'signup', component: SignUp },
  { path: '/cart', name: 'cart', component: UserCart },
  { path: '/favorites', name: 'favorites', component: StoreFavorites },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
