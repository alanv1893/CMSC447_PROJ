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

        <select v-model="filterProduct" class="filter-dropdown">
          <option value="">Products</option>
          <option v-for="(prod, i) in uniqueProducts" :key="i">{{ prod }}</option>
        </select>

        <select v-model="filterVendor" class="filter-dropdown">
          <option value="">Vendors</option>
          <option v-for="(ven, i) in uniqueVendors" :key="i">{{ ven }}</option>
        </select>

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
                  <button @click="openModal('edit', item)">Edit</button>
                  <button @click="openModal('merge-select', item)">Merge</button>
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

          <h3 v-if="modalType === 'edit'">Edit Item Details: "{{ selectedItem.productname }}"</h3>
          <h3 v-if="modalType === 'merge-select'">Merge "{{ selectedItem.productname }}" Into...</h3>
          <h3 v-if="modalType === 'delete'">Delete "{{ selectedItem.productname }}"?</h3>

          <!-- Edit Form -->
          <div v-if="modalType === 'edit'">
            <label><strong>Product Name</strong>
              <input v-model="editForm.productname" type="text" class="modal-input" />
            </label>
            <label><strong>Cost</strong>
              <input v-model="editForm.cost" type="number" step="0.01" class="modal-input" />
            </label>
            <label><strong>Category</strong>
              <input v-model="editForm.category" type="text" class="modal-input" />
            </label>
            <label><strong>Vendor</strong>
              <input v-model="editForm.vendor" type="text" class="modal-input" />
            </label>
            <label><strong>Brand</strong>
              <input v-model="editForm.brand_name" type="text" class="modal-input" />
            </label>
            <label><strong>Quantity</strong>
              <input v-model.number="editForm.quantity" type="number" class="modal-input" />
            </label>
          </div>

          <!-- Merge Select Step -->
          <div v-if="modalType === 'merge-select'">
            <select v-model="mergeTarget" class="modal-input">
              <option disabled value="">Select item</option>
              <option
                v-for="item in inventory.filter(i => i.productname !== selectedItem.productname)"
                :key="item.productname"
                :value="item.productname"
              >
                {{ item.productname }}
              </option>
            </select>
          </div>

          <!-- Action Buttons -->
          <div class="modal-actions">
            <button
              v-if="modalType === 'merge-select'"
              class="approve-btn"
              :disabled="!mergeTarget"
              @click="submitModalAction"
            >✅ Confirm</button>

            <button
              v-if="modalType === 'edit' || modalType === 'delete'"
              class="approve-btn"
              @click="submitModalAction"
            >
              ✅ Confirm
            </button>

            <button class="reject-btn" @click="closeModal">❌ Cancel</button>
          </div>
        </div>
      </div>

      <button v-if="role === 'admin'" class="export-button" @click="exportAsExcel">
        Download Inventory (.xlsx)
      </button>
    </template>

    <p v-else>Loading inventory...</p>

    <!-- ✅ Merge success popup -->
    <div v-if="mergeSuccessPopup" class="merge-popup">
      <span>Merge Successful!</span>
      <button class="close-popup" @click="mergeSuccessPopup = false">✖</button>
    </div>
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
const mergeTarget = ref('')
const mergeSuccessPopup = ref(false)

const editForm = ref({
  productname: '',
  cost: 0,
  category: '',
  vendor: '',
  brand_name: '',
  quantity: 0
})

function toggleMenu(index) {
  showMenuIndex.value = showMenuIndex.value === index ? null : index
}

function openModal(type, item) {
  modalType.value = type
  selectedItem.value = item
  showMenuIndex.value = null

  if (type === 'edit') {
    editForm.value = {
      productname: item.productname,
      cost: item.cost,
      category: item.category,
      vendor: item.vendor,
      brand_name: item.brand_name,
      quantity: item.quantity
    }
  }
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

  if (modalType.value === 'edit') {
    endpoint = '/normalize/update-full-item'
    body = {
      oldName: selectedItem.value.productname,
      productname: editForm.value.productname,
      cost: editForm.value.cost,
      category: editForm.value.category,
      vendor: editForm.value.vendor,
      brand: editForm.value.brand_name,
      quantity: editForm.value.quantity
    }
  } else if (modalType.value === 'merge-select') {
    endpoint = '/normalize/merge-duplicate-items'
    body = {
      keepItem: mergeTarget.value,
      removeItem: selectedItem.value.productname,
      productname: mergeTarget.value,
      cost: selectedItem.value.cost,
      category: selectedItem.value.category,
      vendor: selectedItem.value.vendor,
      brand_name: selectedItem.value.brand_name
    }
  } else if (modalType.value === 'delete') {
    endpoint = '/normalize/remove-item-and-inventory'
    body = { itemName: name }
  }

  try {
    const res = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!res.ok) throw new Error(await res.text())
      if (modalType.value === 'merge-select') {
        mergeSuccessPopup.value = true
        setTimeout(() => {
          mergeSuccessPopup.value = false
        }, 5000)
      }

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

const filteredInventory = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return inventory.value.filter((item) => {
    const matchesSearch =
      item.category?.toLowerCase().includes(q) ||
      item.productname?.toLowerCase().includes(q) ||
      item.vendor?.toLowerCase().includes(q) ||
      item.brand_name?.toLowerCase().includes(q)

    const matchesCategory = !filterCategory.value || item.category === filterCategory.value
    const matchesProduct = !filterProduct.value || item.productname === filterProduct.value
    const matchesVendor = !filterVendor.value || item.vendor === filterVendor.value
    const matchesBrand = !filterBrand.value || item.brand_name === filterBrand.value

    return matchesSearch && matchesCategory && matchesProduct && matchesVendor && matchesBrand
  })
})

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
  height: 100%;
  overflow-y: auto;
}

:global(body) {
  overflow-y: auto !important;
}

.container {
  background-color: #f5c100;
  min-height: 100vh;
  padding: 120px 20px 60px;
  box-sizing: border-box;
}

.titleBox {
  background-color: black;
  color: #ffd700;
  width: 100%;
  height: 80px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
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
  max-width: 500px;
  width: 90%;
  margin: 0 auto;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: stretch; /* ensures labels stretch full width */
}

.modal-input {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.25rem;
  margin-bottom: 1rem;
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

label {
  display: block;
  text-align: left;
  width: 100%;
  margin-bottom: 1rem;
}

label strong {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: bold;
}

.merge-popup {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border: 1px solid #ccc;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: bold;
}

.close-popup {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
}
</style>
