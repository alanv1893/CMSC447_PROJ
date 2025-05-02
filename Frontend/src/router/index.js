import { createRouter, createWebHistory } from 'vue-router'
// Views
import LogIn from '../views/LogIn.vue'
import HomePage from '../views/HomePage.vue'
import UserCart from '../views/UserCart.vue'
import StoreFavorites from '../views/StoreFavorites.vue'
import AddItem from '../views/AddItem.vue'
import ApproveTransactions from '../views/ApproveTransactions.vue'
import DisplayInventory from '../views/DisplayInventory.vue'
import Reports from '../views/Reports.vue'
// Layouts
import MainLayout from '../layouts/Layout.vue'


const routes = [
  { path: '/', name: 'login', component: LogIn },

  {
    path: '/home',
    component: MainLayout,
    children: [
      { path: '', name: 'home', component: HomePage },
      { path: 'cart', name: 'cart', component: UserCart },
      { path: 'favorites', name: 'favorites', component: StoreFavorites },
      { path: 'add-item', name: 'add-item', component: AddItem },
      { path: 'inventory', name: 'DisplayInventory', component: DisplayInventory },
      { path: 'approve-transactions', name: 'approve-transactions', component: ApproveTransactions },
      { path: 'reports', name: 'reports', component: Reports },
      { path: 'normalize', name: 'normalize', component: Normalize },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Router guard to block access if not logged in
router.beforeEach((to, from, next) => {
  const role = localStorage.getItem('userRole')
  const isLoggedIn = localStorage.getItem('loggedIn') === 'true'

  if (to.path !== '/' && !isLoggedIn) {
    return next('/')
  }

  next()
})

export default router