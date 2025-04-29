<template>
  <div class="container">
    <div class="titleBox">
      <div class="backButton" @click="goBack" title="Go Back">
        <span class="backButton-text">Back</span>
      </div>
      <h1 class="title">📦 Full Inventory</h1>
      <a class="logOutLink" v-if="loggedIn" @click="logOut" href="/">Log Out</a>
    </div>

    <template v-if="inventory.length">
      <input
        v-model="searchQuery"
        type="text"
        class="search-bar"
        placeholder="Search inventory..."
      />

      <div class="filter-bar">
        <select v-model="filterCategory" class="filter-dropdown">
          <option value="">Categories</option>
          <option v-for="(cat, i) in uniqueCategories" :key="i" :value="cat">
            {{ cat }}
          </option>
        </select>

        <!-- Product -->
        <select v-model="filterProduct" class="filter-dropdown">
          <option value="">Products</option>
          <option v-for="(prod, i) in uniqueProducts" :key="i">{{ prod }}</option>
        </select>

        <!-- Vendor -->
        <select v-model="filterVendor" class="filter-dropdown">
          <option value="">Vendors</option>
          <option v-for="(ven, i) in uniqueVendors" :key="i">{{ ven }}</option>
        </select>

        <!-- Brand -->
        <select v-model="filterBrand" class="filter-dropdown">
          <option value="">Brands</option>
          <option v-for="(b, i) in uniqueBrands" :key="i">{{ b }}</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Product</th>
            <th>Vendor</th>
            <th>Brand</th>
            <th>Cost</th>
            <th>Quantity</th>
          </tr>
        </thead> 
        <tbody>
          <tr v-for="(item, index) in filteredInventory" :key="index">
            <td>{{ item.category }}</td>
            <td>{{ item.productname }}</td>
            <td>{{ item.vendor }}</td>
            <td>{{ item.brand_name }}</td>
            <td>${{ item.cost }}</td>
            <td>
              <span>{{ item.quantity }}</span>
              <div v-if="role === 'admin'" class="menu-cell" :ref="(el) => (menuRefs[index] = el)">
                <button class="menu-button" @click.stop="toggleMenu(index)">⋮</button>
                <div v-if="showMenuIndex === index" class="dropdown-menu">
                  <button @click="openModal('rename', item)">Rename</button>
                  <button @click="openModal('quantity', item)">Update Qty</button>
                  <button @click="openModal('delete', item)">Delete</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="modalType" class="modal-overlay">
        <div class="modal">
          <button class="close-btn" @click="closeModal">✖</button>
          <h3 v-if="modalType === 'rename'">Rename "{{ selectedItem.productname }}"</h3>
          <h3 v-if="modalType === 'quantity'">
            Update Quantity for "{{ selectedItem.productname }}"
          </h3>
          <h3 v-if="modalType === 'delete'">Delete "{{ selectedItem.productname }}"?</h3>

          <input
            v-if="modalType !== 'delete'"
            v-model="modalInput"
            type="text"
            class="modal-input"
            :placeholder="modalType === 'rename' ? 'New name' : 'New quantity'"
          />

          <div class="modal-actions">
            <button class="approve-btn" @click="submitModalAction">✅ Confirm</button>
            <button class="reject-btn" @click="closeModal">❌ Cancel</button>
          </div>
        </div>
      </div>

      <!-- Only show this if the user is admin -->
      <button v-if="role === 'admin'" class="export-button" @click="exportAsExcel">
        Download Inventory (.xlsx)
      </button>
    </template>

    <p v-else>Loading inventory...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const inventory = ref([])
const loggedIn = ref(false)
const role = localStorage.getItem('userRole')
const searchQuery = ref('')
const filterCategory = ref('')
const filterProduct = ref('')
const filterVendor = ref('')
const filterBrand = ref('')
const showMenuIndex = ref(null)
const selectedItem = ref(null)
const modalType = ref('')
const modalInput = ref('')
const menuRefs = ref([])


function toggleMenu(index) {
  showMenuIndex.value = showMenuIndex.value === index ? null : index
}

function openModal(type, item) {
  modalType.value = type
  selectedItem.value = item
  modalInput.value = ''
  showMenuIndex.value = null
}

function closeModal() {
  modalType.value = ''
  selectedItem.value = {}
  modalInput.value = ''
}


function handleClickOutside(event) {
  const clickedInsideAnyMenu = menuRefs.value.some((el) =>
    el?.contains(event.target)
  )

  if (!clickedInsideAnyMenu) {
    showMenuIndex.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

async function submitModalAction() {
  const name = selectedItem.value.productname
  let endpoint = ''
  let body = {}

  if (modalType.value === 'rename') {
    endpoint = '/normalize/rename-item'
    body = { oldName: name, newName: modalInput.value }
  } else if (modalType.value === 'quantity') {
    endpoint = '/normalize/update-inventory-quantity'
    body = { itemName: name, newQty: Math.max(0, parseInt(modalInput.value)) }
  } else if (modalType.value === 'delete') {
    endpoint = '/normalize/remove-item-and-inventory'
    body = { itemName: name }
  }

  try {
    const res = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(await res.text())
    await reloadInventory()
    closeModal()
  } catch (err) {
    console.error('Normalize action failed:', err)
  }
}

async function reloadInventory() {
  const res = await fetch('http://localhost:3000/full-inventory')
  inventory.value = await res.json()
}

//  category dropdown values
const uniqueCategories = computed(() => {
  return [...new Set(inventory.value.map((i) => i.category))].filter(Boolean)
})
const uniqueProducts = computed(() => {
  return [...new Set(inventory.value.map((i) => i.productname))].filter(Boolean)
})

const uniqueVendors = computed(() => {
  return [...new Set(inventory.value.map((i) => i.vendor))].filter(Boolean)
})

const uniqueBrands = computed(() => {
  return [...new Set(inventory.value.map((i) => i.brand_name))].filter(Boolean)
})

// filter logic
const filteredInventory = computed(() => {
  return inventory.value.filter((item) => {
    const q = searchQuery.value.toLowerCase()

    const matchesSearch =
      item.category?.toLowerCase().includes(q) ||
      item.productname?.toLowerCase().includes(q) ||
      item.vendor?.toLowerCase().includes(q) ||
      item.brand_name?.toLowerCase().includes(q)

    const matchesCategory = filterCategory.value === '' || item.category === filterCategory.value
    const matchesProduct = filterProduct.value === '' || item.productname === filterProduct.value
    const matchesVendor = filterVendor.value === '' || item.vendor === filterVendor.value
    const matchesBrand = filterBrand.value === '' || item.brand_name === filterBrand.value

    return matchesSearch && matchesCategory && matchesProduct && matchesVendor && matchesBrand
  })
})

// fetch + login check
onMounted(async () => {
  loggedIn.value = localStorage.getItem('loggedIn') === 'true'
  if (!loggedIn.value) {
    router.push('/')
    return
  }

  try {
    const res = await fetch('http://localhost:3000/full-inventory')
    if (!res.ok) throw new Error('Network error')
    const data = await res.json()
    inventory.value = data
  } catch (err) {
    console.error('Failed to load inventory:', err)
  }
})

// Navigation + Download
function goBack() {
  history.back()
}

function logOut() {
  localStorage.clear()
  router.push('/')
}

function exportAsExcel() {
  fetch('http://localhost:3000/export-inventory')
    .then((response) => {
      if (!response.ok) throw new Error('Export error')
      return response.blob()
    })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'inventory_report.xlsx')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
    .catch((err) => {
      console.error('Export failed:', err)
    })
}
</script>

<style scoped>
:global(html, body) {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

.container {
  background-color: #f5c100;
  min-height: 100vh;
  padding: 100px 20px 20px;
  text-align: center;
  box-sizing: border-box;
}

.titleBox {
  background-color: black;
  color: #ffd700;
  padding: 10px 0;
  width: 100vw;
  position: absolute;
  top: 0;
  left: 0;
  text-align: center;
  box-sizing: border-box;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  margin: 0;
  font-size: 3rem;
  font-weight: bold;
}

table {
  margin: 0 auto;
  border-collapse: collapse;
  background: #fff;
  width: 95%;
  table-layout: fixed;
}

th,
td {
  padding: 10px;
  border: 1px solid #333;
}

th {
  background: #fde768;
}

td:last-child {
  position: relative;
  text-align: center;
  vertical-align: middle; /* Add this to vertically center content */
}

td:last-child span {
  display: inline-block;
  vertical-align: middle;
}

.menu-cell {
  display: inline-block;
  vertical-align: middle;
  left: 40%;
}

.logOutLink {
  position: absolute;
  top: 25px;
  right: 20px;
  font-size: 20px;
  white-space: nowrap;
  font-weight: bold;
  color: gold;
}

.export-button {
  display: block;
  margin: 30px auto 0;
  padding: 12px 24px;
  background-color: #217346;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.export-button:hover {
  background-color: #1a5e39;
}

.backButton {
  position: absolute;
  top: 25px;
  left: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.backButton-text {
  color: gold;
  font-size: 1.2rem;
  font-weight: bold;
  text-decoration: underline;
}

.search-bar {
  width: 60%;
  max-width: 500px;
  padding: 10px;
  margin: 20px auto;
  display: block;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  margin: 20px 0 10px 0;
  padding-left: 40px; /* 👈 matches left edge of table */
}

.filter-dropdown {
  padding: 8px 12px;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  min-width: 150px;
}

.menu-cell {
  position: relative;
  text-align: center;
}

.menu-button {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  width: 100%;
  height: 100%;
  padding: 12px 0;
  color: #333;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border: 1px solid #ccc;
  z-index: 10;
  min-width: 140px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
}

.dropdown-menu button {
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.95rem;
}

.dropdown-menu button:hover {
  background: #fde768;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  min-width: 300px;
  position: relative;
  text-align: center;
}

.modal-input {
  width: 100%;
  padding: 0.5rem;
  margin-top: 1rem;
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-around;
}

.approve-btn,
.reject-btn {
  padding: 0.5rem 1rem;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.approve-btn {
  background: green;
  color: white;
}

.reject-btn {
  background: red;
  color: white;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}
</style>
