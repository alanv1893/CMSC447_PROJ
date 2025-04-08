import { createRouter, createWebHistory } from 'vue-router'
import LogIn from '../views/LogIn.vue'
import HomePage from '../views/HomePage.vue'
import UserCart from '../views/UserCart.vue'
import StoreFavorites from '../views/StoreFavorites.vue'
import AddItem from '../views/AddItem.vue'
import ApproveTransactions from '../views/ApproveTransactions.vue'
import DisplayInventory from '../views/DisplayInventory.vue'
import Reports from '../views/Reports.vue'

const routes = [
  { path: '/', name: 'login', component: LogIn },
  { path: '/home', name: 'home', component: HomePage },
  { path: '/cart', name: 'cart', component: UserCart },
  { path: '/favorites', name: 'favorites', component: StoreFavorites },
  { path: '/add-item', name: 'add-item', component: AddItem },
  { path: '/inventory', name: 'DisplayInventory', component: DisplayInventory },
  { path: '/approve-transactions', name: 'approve-transactions', component: ApproveTransactions },
  { path: '/reports', name: 'reports', component: Reports },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
