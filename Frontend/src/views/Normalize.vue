<template>
  <div class="normalize-dashboard">
    <aside class="sidebar">
      <h2>Categories</h2>
      <ul>
        <li v-for="cat in categories" :key="cat"
            :class="{ active: cat === currentCategory }"
            @click="selectCategory(cat)">
          {{ cat }}
        </li>
      </ul>
    </aside>
    <section class="main">
      <h1>Normalize Dashboard</h1>
      <div class="operation-selector">
        <label for="operation">Operation:</label>
        <select id="operation" v-model="currentOp">
          <option v-for="op in operations[currentCategory]" :key="op.value" :value="op.value">
            {{ op.label }}
          </option>
        </select>
      </div>
      <form v-if="currentOp && formSchemas[currentOp].length" @submit.prevent="submit">
        <div v-for="field in formSchemas[currentOp]" :key="field.name" class="form-field">
          <label :for="field.name">{{ field.label }}:</label>
          <input
            :id="field.name"
            :type="field.type"
            v-model="formData[field.name]"
            :required="field.required !== false"
          />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Processing...' : 'Submit' }}
        </button>
      </form>
      <div v-else-if="currentOp">
        <button @click="submit" :disabled="loading">
          {{ loading ? 'Processing...' : 'Run' }}
        </button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="result" class="result">
        <h2>Result</h2>
        <table v-if="Array.isArray(result) && result.length">
          <thead>
            <tr>
              <th v-for="key in tableKeys" :key="key">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in result" :key="idx">
              <td v-for="key in tableKeys" :key="key">{{ row[key] }}</td>
            </tr>
          </tbody>
        </table>
        <pre v-else>{{ JSON.stringify(result, null, 2) }}</pre>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Normalize',
  data() {
    const formSchemas = {
      'rename-item': [
        { name: 'oldName', label: 'Old Name', type: 'text' },
        { name: 'newName', label: 'New Name', type: 'text' }
      ],
      'rename-vendor': [
        { name: 'oldVendor', label: 'Old Vendor', type: 'text' },
        { name: 'newVendor', label: 'New Vendor', type: 'text' }
      ],
      'rename-category': [
        { name: 'oldCategory', label: 'Old Category', type: 'text' },
        { name: 'newCategory', label: 'New Category', type: 'text' }
      ],
      'rename-brand': [
        { name: 'oldBrand', label: 'Old Brand', type: 'text' },
        { name: 'newBrand', label: 'New Brand', type: 'text' }
      ],
      'merge-categories': [
        { name: 'sourceCategory', label: 'Source Category', type: 'text' },
        { name: 'targetCategory', label: 'Target Category', type: 'text' }
      ],
      'merge-vendors': [
        { name: 'sourceVendor', label: 'Source Vendor', type: 'text' },
        { name: 'targetVendor', label: 'Target Vendor', type: 'text' }
      ],
      'merge-brands': [
        { name: 'sourceBrand', label: 'Source Brand', type: 'text' },
        { name: 'targetBrand', label: 'Target Brand', type: 'text' }
      ],
      'merge-duplicate-items': [
        { name: 'itemId1', label: 'Item ID 1', type: 'text' },
        { name: 'itemId2', label: 'Item ID 2', type: 'text' }
      ],
      'delete-unused-item': [
        { name: 'itemId', label: 'Item ID', type: 'text' }
      ],
      'delete-unused-reference': [
        { name: 'referenceType', label: 'Reference Type (vendor/category/brand)', type: 'text' },
        { name: 'referenceId', label: 'Reference ID', type: 'text' }
      ],
      'update-item-cost': [
        { name: 'itemId', label: 'Item ID', type: 'text' },
        { name: 'newCost', label: 'New Cost', type: 'number' }
      ],
      'update-inventory-quantity': [
        { name: 'itemId', label: 'Item ID', type: 'text' },
        { name: 'newQuantity', label: 'New Quantity', type: 'number' }
      ],
      'remove-item-and-inventory': [
        { name: 'itemId', label: 'Item ID', type: 'text' }
      ],
      'reassign-item-details': [
        { name: 'itemId', label: 'Item ID', type: 'text' },
        { name: 'newVendor', label: 'New Vendor', type: 'text' },
        { name: 'newCategory', label: 'New Category', type: 'text' },
        { name: 'newBrand', label: 'New Brand', type: 'text' }
      ],
      'flag-low-stock': []
    };
    const operations = {
      Rename: [
        { label: 'Rename Item', value: 'rename-item' },
        { label: 'Rename Vendor', value: 'rename-vendor' },
        { label: 'Rename Category', value: 'rename-category' },
        { label: 'Rename Brand', value: 'rename-brand' }
      ],
      Merge: [
        { label: 'Merge Categories', value: 'merge-categories' },
        { label: 'Merge Vendors', value: 'merge-vendors' },
        { label: 'Merge Brands', value: 'merge-brands' },
        { label: 'Merge Duplicate Items', value: 'merge-duplicate-items' }
      ],
      Delete: [
        { label: 'Delete Unused Item', value: 'delete-unused-item' },
        { label: 'Delete Unused Reference', value: 'delete-unused-reference' },
        { label: 'Remove Item And Inventory', value: 'remove-item-and-inventory' }
      ],
      Update: [
        { label: 'Update Item Cost', value: 'update-item-cost' },
        { label: 'Update Inventory Quantity', value: 'update-inventory-quantity' }
      ],
      Reassign: [
        { label: 'Reassign Item Details', value: 'reassign-item-details' }
      ],
      Flag: [
        { label: 'Flag Low Stock', value: 'flag-low-stock' }
      ]
    };
    const cats = Object.keys(operations);
    const initialCat = cats[0];
    return {
      formSchemas,
      operations,
      currentCategory: initialCat,
      currentOp: operations[initialCat][0].value,
      formData: {},
      result: null,
      loading: false,
      error: null
    };
  },
  computed: {
    categories() {
      return Object.keys(this.operations);
    },
    tableKeys() {
      return Array.isArray(this.result) && this.result.length
        ? Object.keys(this.result[0])
        : [];
    }
  },
  watch: {
    currentOp() {
      this.initFormData();
      this.result = null;
      this.error = null;
    }
  },
  mounted() {
    this.initFormData();
  },
  methods: {
    selectCategory(cat) {
      this.currentCategory = cat;
      this.currentOp = this.operations[cat][0].value;
    },
    initFormData() {
      this.formData = {};
      const schema = this.formSchemas[this.currentOp] || [];
      schema.forEach(field => {
        this.formData[field.name] = '';
      });
    },
    async submit() {
      this.loading = true;
      this.error = null;
      this.result = null;
      try {
        let res;
        if (this.currentOp === 'flag-low-stock') {
          res = await axios.get(`/normalize/${this.currentOp}`);
        } else {
          res = await axios.post(`/normalize/${this.currentOp}`, this.formData);
        }
        this.result = res.data;
      } catch (e) {
        this.error = e.response?.data || e.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.normalize-dashboard {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
}
.sidebar {
  width: 200px;
  border-right: 1px solid #ccc;
  padding: 1rem;
}
.sidebar ul {
  list-style: none;
  padding: 0;
}
.sidebar li {
  padding: 0.5rem;
  cursor: pointer;
}
.sidebar li.active {
  font-weight: bold;
  background: #f0f0f0;
}
.main {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}
.operation-selector {
  margin-bottom: 1rem;
}
.form-field {
  margin-bottom: 0.75rem;
}
.form-field label {
  display: block;
  margin-bottom: 0.25rem;
}
.error {
  color: red;
  margin-top: 1rem;
}
.result {
  margin-top: 1rem;
}
.result table {
  width: 100%;
  border-collapse: collapse;
}
.result th,
.result td {
  border: 1px solid #ccc;
  padding: 0.5rem;
}
</style>
