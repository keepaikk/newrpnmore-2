// Admin Dashboard JS

const API_BASE = '';
let currentTab = 'leads';
let editingId = null;
let editingType = null;

// Tab switching
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById(`tab-${tab}`).classList.add('active');
      currentTab = tab;
      loadTabData(tab);
    });
  });
}

// Logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/admin/login.html';
});

// Load data per tab
async function loadTabData(tab) {
  if (tab === 'leads') return loadLeads();
  if (tab === 'blog-posts') return loadTable('blog-posts', ['title', 'category', 'author', 'date', 'published']);
  if (tab === 'car-listings') return loadTable('car-listings', ['title', 'price', 'currency', 'status', 'featured']);
  if (tab === 'property-listings') return loadTable('property-listings', ['title', 'location', 'price', 'status', 'featured']);
  if (tab === 'testimonials') return loadTable('testimonials', ['name', 'role', 'rating', 'featured']);
  if (tab === 'hero-images') return loadTable('hero-images', ['page', 'imageUrl', 'altText', 'active']);
  if (tab === 'books') return loadTable('books', ['title', 'author', 'category', 'publishedYear', 'featured']);
}

// Leads
async function loadLeads() {
  const filter = document.getElementById('lead-filter').value;
  const container = document.getElementById('leads-table-container');
  container.innerHTML = '<p>Loading...</p>';

  try {
    const types = filter === 'all' ? ['contact', 'car', 'property', 'ai'] : [filter];
    let rows = [];
    for (const t of types) {
      const res = await fetch(`/api/leads/${t}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach(item => rows.push({ ...item, _type: t }));
      }
    }

    if (!rows.length) {
      container.innerHTML = '<p>No leads found.</p>';
      return;
    }

    const headers = ['Type', 'Name', 'Details', 'Date'];
    const html = `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => {
      const date = r.createdAt ? new Date(r.createdAt).toLocaleString() : '-';
      let details = '';
      if (r._type === 'contact') details = `${r.email} · ${r.service}`;
      if (r._type === 'car') details = `${r.carModel} · ${r.budget} ${r.budgetCurrency || 'USD'}`;
      if (r._type === 'property') details = `${r.propertyInterest} · ${r.timeline}`;
      if (r._type === 'ai') details = `${r.businessName}`;
      return `<tr><td>${r._type}</td><td>${r.name}</td><td>${details}</td><td>${date}</td></tr>`;
    }).join('')}</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p class="error-message">Error loading leads: ${err.message}</p>`;
  }
}

// Generic table loader
async function loadTable(type, fields) {
  const container = document.getElementById(`${type.replace(/-/g, '-')}-table-container`);
  if (!container) return;
  container.innerHTML = '<p>Loading...</p>';
  try {
    const res = await fetch(`/api/cms/${type}`);
    if (!res.ok) throw new Error('Unauthorized or error');
    const items = await res.json();
    if (!items.length) {
      container.innerHTML = '<p>No items found.</p>';
      return;
    }
    const html = `<table><thead><tr>${fields.map(f => `<th>${formatHeader(f)}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${items.map(item => `<tr>${fields.map(f => `<td>${formatCell(item, f)}</td>`).join('')}<td class="actions"><button class="btn btn-secondary" onclick="editItem('${type}', '${item.id}')">Edit</button><button class="btn btn-danger" onclick="deleteItem('${type}', '${item.id}')">Delete</button></td></tr>`).join('')}</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p class="error-message">Error loading ${type}: ${err.message}</p>`;
  }
}

function formatHeader(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

function formatCell(item, key) {
  const val = item[key];
  if (key === 'published' || key === 'featured') return val ? 'Yes' : 'No';
  if (key === 'status') return `<span class="badge badge-${val}">${val}</span>`;
  if (key === 'content') return (val || '').substring(0, 60) + '...';
  return val || '-';
}

// Modal
function openModal(type, id = null) {
  editingId = id;
  editingType = type;
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('modal-form');
  modal.classList.add('active');
  title.textContent = id ? 'Edit' : 'Create';
  form.innerHTML = buildFormFields(type, id);
  form.onsubmit = handleFormSubmit;
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
  editingId = null;
  editingType = null;
}

function buildFormFields(type, id) {
  const fieldsMap = {
    'blog-post': [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text', required: true },
      { name: 'author', label: 'Author', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'text', required: true },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea' },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'imageUrl', label: 'Image URL', type: 'text' },
      { name: 'published', label: 'Published', type: 'select', options: ['true', 'false'] },
    ],
    'car-listing': [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'imageUrl', label: 'Image URL', type: 'text' },
      { name: 'year', label: 'Year', type: 'text' },
      { name: 'engine', label: 'Engine', type: 'text', required: true },
      { name: 'mileage', label: 'Mileage', type: 'text', required: true },
      { name: 'specs', label: 'Specs', type: 'text', required: true },
      { name: 'price', label: 'Price', type: 'text', required: true },
      { name: 'currency', label: 'Currency', type: 'select', options: ['USD', 'GHS'] },
      { name: 'priceNote', label: 'Price Note', type: 'text' },
      { name: 'shipping', label: 'Shipping', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['preorder', 'sold', 'closed'] },
      { name: 'featured', label: 'Featured', type: 'select', options: ['true', 'false'] },
    ],
    'property-listing': [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'imageUrl', label: 'Image URL', type: 'text' },
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'size', label: 'Size', type: 'text', required: true },
      { name: 'roi', label: 'ROI', type: 'text', required: true },
      { name: 'price', label: 'Price', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['available', 'sold', 'pending'] },
      { name: 'featured', label: 'Featured', type: 'select', options: ['true', 'false'] },
      { name: 'badge', label: 'Badge', type: 'text' },
    ],
    'testimonial': [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'text', label: 'Text', type: 'textarea', required: true },
      { name: 'rating', label: 'Rating', type: 'select', options: ['1', '2', '3', '4', '5'] },
      { name: 'featured', label: 'Featured', type: 'select', options: ['true', 'false'] },
    ],
    'hero-image': [
      { name: 'page', label: 'Page (e.g. index, cars, real-estate)', type: 'text', required: true },
      { name: 'imageUrl', label: 'Image URL', type: 'text', required: true },
      { name: 'altText', label: 'Alt Text', type: 'text' },
      { name: 'active', label: 'Active', type: 'select', options: ['true', 'false'] },
    ],
    'book': [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'author', label: 'Author', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'coverImageUrl', label: 'Cover Image', type: 'text' },
      { name: 'pdfUrl', label: 'PDF File', type: 'text' },
      { name: 'publishedYear', label: 'Published Year', type: 'text' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'price', label: 'Price', type: 'text' },
      { name: 'featured', label: 'Featured', type: 'select', options: ['true', 'false'] },
    ],
  };

  const fields = fieldsMap[type] || [];
  return fields.map(f => {
    if (f.name === 'imageUrl' || f.name === 'coverImageUrl') {
      return `<div class="form-group">
        <label>${f.label}</label>
        <input type="text" name="${f.name}" ${f.required ? 'required' : ''}>
        <input type="file" accept="image/*" onchange="handleImageUpload(this)" style="margin-top:6px">
        <img class="image-preview" style="display:none;margin-top:8px;max-width:200px;max-height:120px;border-radius:4px">
      </div>`;
    }
    if (f.name === 'pdfUrl') {
      return `<div class="form-group">
        <label>${f.label}</label>
        <input type="text" name="${f.name}" ${f.required ? 'required' : ''}>
        <input type="file" accept=".pdf,application/pdf" onchange="handlePdfUpload(this)" style="margin-top:6px">
        <a class="pdf-link" style="display:none;margin-top:8px;color:var(--accent)" target="_blank">View PDF</a>
      </div>`;
    }
    if (f.type === 'textarea') return `<div class="form-group"><label>${f.label}</label><textarea name="${f.name}"></textarea></div>`;
    if (f.type === 'select') return `<div class="form-group"><label>${f.label}</label><select name="${f.name}">${f.options.map(o => `<option value="${o}">${o}</option>`).join('')}</select></div>`;
    return `<div class="form-group"><label>${f.label}</label><input type="${f.type}" name="${f.name}" ${f.required ? 'required' : ''}></div>`;
  }).join('') + '<div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>';
}

async function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const formGroup = input.closest('.form-group');
  const urlInput = formGroup.querySelector('input[type="text"]');
  const preview = formGroup.querySelector('.image-preview');

  // Show local preview immediately
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';

  // Upload to server
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    urlInput.value = data.url;
    preview.src = data.url; // switch to server URL
  } catch (err) {
    alert('Image upload failed: ' + err.message);
    preview.style.display = 'none';
  }
}

async function handlePdfUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const formGroup = input.closest('.form-group');
  const urlInput = formGroup.querySelector('input[type="text"]');
  const link = formGroup.querySelector('.pdf-link');

  // Upload to server
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/api/upload-pdf', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    urlInput.value = data.url;
    link.href = data.url;
    link.style.display = 'inline-block';
    link.textContent = 'PDF uploaded — ' + file.name;
  } catch (err) {
    alert('PDF upload failed: ' + err.message);
    if (link) link.style.display = 'none';
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = {};
  formData.forEach((val, key) => {
    if (val === 'true') payload[key] = true;
    else if (val === 'false') payload[key] = false;
    else payload[key] = val;
  });

  const url = editingId ? `/api/cms/${editingType}s/${editingId}` : `/api/cms/${editingType}s`;
  const method = editingId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Save failed');
    closeModal();
    loadTabData(currentTab);
  } catch (err) {
    alert(err.message);
  }
}

async function editItem(type, id) {
  try {
    const res = await fetch(`/api/cms/${type}/${id}`);
    if (!res.ok) throw new Error('Not found');
    const item = await res.json();
    openModal(type.replace(/s$/, '').replace(/-listings$/, '-listing'), id);
    // Populate form after modal opens
    setTimeout(() => {
      Object.entries(item).forEach(([key, val]) => {
        const input = document.querySelector(`#modal-form [name="${key}"]`);
        if (input) input.value = val;
        // Update image preview if imageUrl/coverImageUrl exists
        if ((key === 'imageUrl' || key === 'coverImageUrl') && val) {
          const preview = input?.closest('.form-group')?.querySelector('.image-preview');
          if (preview) {
            preview.src = val;
            preview.style.display = 'block';
          }
        }
        // Update PDF link if pdfUrl exists
        if (key === 'pdfUrl' && val) {
          const link = input?.closest('.form-group')?.querySelector('.pdf-link');
          if (link) {
            link.href = val;
            link.style.display = 'inline-block';
            link.textContent = 'View uploaded PDF';
          }
        }
      });
    }, 50);
  } catch (err) {
    alert(err.message);
  }
}

async function deleteItem(type, id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  try {
    const res = await fetch(`/api/cms/${type}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    loadTabData(currentTab);
  } catch (err) {
    alert(err.message);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadTabData('leads');
  document.getElementById('lead-filter')?.addEventListener('change', loadLeads);
});
