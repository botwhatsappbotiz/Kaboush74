const ADMIN_PASSWORD_HASH = '715c95ff1aad4ab7651363960f7e6cb12d169b56b45747f2c4e6cd43c5dd9bae';
const SESSION_KEY = 'kaboush_admin_authenticated';
const $ = id => document.getElementById(id);
let products = readStorage('kaboush_products', window.KABOUSH_DEMO_PRODUCTS);
let settings = readStorage('kaboush_settings', {});
let categories = readStorage('kaboush_categories', []);

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function showToast(message) {
  const element = $('toast');
  element.textContent = message;
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 2600);
}

async function passwordHash(password) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('يلزم فتح لوحة الإدارة عبر HTTPS أو localhost لتفعيل تسجيل الدخول.');
  }
  const bytes = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function renderAuth() {
  $('authTitle').textContent = 'دخول صاحب المتجر';
  $('authDescription').textContent = 'أدخل كلمة مرور لوحة الإدارة.';
  $('authForm').innerHTML = `
    <label>كلمة المرور<input id="adminPassword" type="password" autocomplete="current-password" required></label>
    <button class="button button-dark" type="submit">دخول</button>`;
  $('authForm').addEventListener('submit', authenticate);
}

async function authenticate(event) {
  event.preventDefault();
  const password = $('adminPassword').value;
  try {
    const hash = await passwordHash(password);
    if (hash !== ADMIN_PASSWORD_HASH) {
      showToast('كلمة المرور غير صحيحة.');
      return;
    }
    sessionStorage.setItem(SESSION_KEY, 'true');
    showAdmin();
  } catch (error) {
    showToast(error.message);
  }
}

function showAdmin() {
  $('authCard').classList.add('hidden');
  $('adminContent').classList.remove('hidden');
  $('adminWhatsapp').value = settings.whatsapp || '';
  $('adminPhone').value = settings.phone || '';
  $('adminHours').value = settings.hours || '';
  renderCategories();
  renderProducts();
}

function allCategories() {
  return [...new Set([...categories, ...products.map(product => product.category)].filter(Boolean))];
}

function persistCategories() {
  categories = allCategories();
  localStorage.setItem('kaboush_categories', JSON.stringify(categories));
}

function renderCategories() {
  const names = allCategories();
  $('pCategory').innerHTML = names.map(name =>
    `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`
  ).join('');
  $('categoryList').innerHTML = names.length
    ? names.map(name => {
      const inUse = products.some(product => product.category === name);
      return `<div class="category-row"><span>${escapeHTML(name)}</span><button class="button button-light" type="button" data-delete-category="${escapeHTML(name)}" ${inUse ? 'disabled title="انقل أو احذف المنتجات التابعة للقسم أولًا"' : ''}>حذف القسم</button></div>`;
    }).join('')
    : '<div class="empty-state">لا توجد أقسام بعد.</div>';
}

function renderProducts() {
  $('productCount').textContent = `${products.length} منتج`;
  $('adminProductList').innerHTML = products.length
    ? products.map(product => `<article class="admin-product">
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}">
        <div class="admin-product-info">
          <strong>${escapeHTML(product.name)}</strong>
          <span>${escapeHTML(product.category)} · ${Number(product.price).toLocaleString('en-US')} ج.م</span>
          <small>الكود: ${escapeHTML(product.id)}</small>
        </div>
        <div class="admin-product-actions">
          <button class="button button-light" type="button" data-edit-product="${escapeHTML(product.id)}">تعديل</button>
          <button class="button button-danger" type="button" data-delete-product="${escapeHTML(product.id)}">حذف</button>
        </div>
      </article>`).join('')
    : '<div class="empty-state">لا توجد منتجات.</div>';
}

function resetProductForm() {
  $('productForm').reset();
  $('productId').value = '';
  $('productFormTitle').textContent = 'إضافة منتج';
  $('saveProductButton').textContent = 'إضافة المنتج';
  $('cancelEditButton').classList.add('hidden');
}

function editProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  if (!allCategories().includes(product.category)) {
    categories.push(product.category);
    persistCategories();
  }
  renderCategories();
  $('productId').value = product.id;
  $('pName').value = product.name;
  $('pPrice').value = product.price;
  $('pCategory').value = product.category;
  $('pCode').value = product.id;
  $('pImage').value = product.image;
  $('pDesc').value = product.desc || '';
  $('productFormTitle').textContent = 'تعديل المنتج';
  $('saveProductButton').textContent = 'حفظ التعديلات';
  $('cancelEditButton').classList.remove('hidden');
  $('productFormTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function validImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

$('settingsForm').addEventListener('submit', event => {
  event.preventDefault();
  settings = {
    whatsapp: $('adminWhatsapp').value.trim(),
    phone: $('adminPhone').value.trim(),
    hours: $('adminHours').value.trim()
  };
  localStorage.setItem('kaboush_settings', JSON.stringify(settings));
  showToast('تم حفظ بيانات التواصل.');
});

$('productForm').addEventListener('submit', event => {
  event.preventDefault();
  const oldId = $('productId').value;
  const id = $('pCode').value.trim() || oldId || `KB${Date.now().toString().slice(-8)}`;
  const duplicate = products.some(product => product.id === id && product.id !== oldId);
  if (duplicate) {
    showToast('كود المنتج مستخدم بالفعل؛ اختر كودًا آخر.');
    return;
  }
  const price = Number($('pPrice').value);
  if (!Number.isFinite(price) || price < 0 || !validImageUrl($('pImage').value.trim())) {
    showToast('تحقق من السعر ورابط الصورة؛ يجب أن يبدأ الرابط بـ http:// أو https://.');
    return;
  }
  const product = {
    id,
    name: $('pName').value.trim(),
    price,
    category: $('pCategory').value,
    image: $('pImage').value.trim(),
    desc: $('pDesc').value.trim(),
    sizes: oldId ? (products.find(item => item.id === oldId).sizes || ['M', 'L', 'XL']) : ['M', 'L', 'XL'],
    colors: oldId ? (products.find(item => item.id === oldId).colors || ['أسود', 'أبيض']) : ['أسود', 'أبيض']
  };
  if (oldId) {
    products = products.map(item => item.id === oldId ? product : item);
    if (oldId !== id) {
      const cart = readStorage('kaboush_cart', []);
      cart.forEach(item => { if (item.id === oldId) item.id = id; });
      localStorage.setItem('kaboush_cart', JSON.stringify(cart));
    }
    showToast('تم تحديث المنتج.');
  } else {
    products.unshift(product);
    showToast('تمت إضافة المنتج.');
  }
  localStorage.setItem('kaboush_products', JSON.stringify(products));
  persistCategories();
  resetProductForm();
  renderCategories();
  renderProducts();
});

$('cancelEditButton').addEventListener('click', resetProductForm);

$('categoryForm').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('categoryName').value.trim();
  if (!name || name === 'الكل') {
    showToast('أدخل اسم قسم صالحًا.');
    return;
  }
  if (allCategories().some(category => category.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    showToast('هذا القسم موجود بالفعل.');
    return;
  }
  categories.push(name);
  persistCategories();
  $('categoryForm').reset();
  renderCategories();
  showToast('تمت إضافة القسم.');
});

$('categoryList').addEventListener('click', event => {
  const button = event.target.closest('[data-delete-category]');
  if (!button) return;
  const name = button.dataset.deleteCategory;
  if (products.some(product => product.category === name)) {
    showToast('انقل المنتجات التابعة لهذا القسم أو احذفها أولًا.');
    return;
  }
  if (!window.confirm(`هل تريد حذف قسم "${name}"؟`)) return;
  categories = categories.filter(category => category !== name);
  persistCategories();
  renderCategories();
});

$('adminProductList').addEventListener('click', event => {
  const editButton = event.target.closest('[data-edit-product]');
  if (editButton) {
    editProduct(editButton.dataset.editProduct);
    return;
  }
  const deleteButton = event.target.closest('[data-delete-product]');
  if (!deleteButton) return;
  const id = deleteButton.dataset.deleteProduct;
  const product = products.find(item => item.id === id);
  if (!product || !window.confirm(`هل تريد حذف المنتج "${product.name}"؟`)) return;
  products = products.filter(item => item.id !== id);
  const cart = readStorage('kaboush_cart', []);
  localStorage.setItem('kaboush_cart', JSON.stringify(cart.filter(item => item.id !== id)));
  localStorage.setItem('kaboush_products', JSON.stringify(products));
  persistCategories();
  renderCategories();
  renderProducts();
  showToast('تم حذف المنتج.');
});

$('logoutButton').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.reload();
});

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

if (sessionStorage.getItem(SESSION_KEY) === 'true') {
  showAdmin();
} else {
  renderAuth();
}
