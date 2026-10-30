const $ = id => document.getElementById(id);
let imageProcessing = Promise.resolve();
let products = [];
let settings = {};
let categories = [];
let unsubscribeStore = [];

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

function renderAuth() {
  $('authTitle').textContent = 'دخول صاحب المتجر';
  $('authDescription').textContent = 'سجّل الدخول إلى حساب الإدارة في Firebase.';
  $('authForm').innerHTML = `
    <label>البريد الإلكتروني<input id="adminEmail" type="email" autocomplete="username" required></label>
    <label>كلمة المرور<input id="adminPassword" type="password" autocomplete="current-password" required></label>
    <button class="button button-dark" type="submit">دخول</button>`;
  $('authForm').addEventListener('submit', authenticate);
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    $('authStatus').textContent = window.KABOUSH_STORE
      ? window.KABOUSH_STORE.configurationMessage
      : 'تعذر تحميل Firebase. تحقق من اتصال الإنترنت وإعداد ملفات الموقع.';
    $('authForm').querySelector('button').disabled = true;
  } else {
    $('authStatus').textContent = 'استخدم حساب الإدارة الذي أُنشئ في Firebase Authentication.';
  }
}

async function authenticate(event) {
  event.preventDefault();
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    showToast('أكمل إعداد Firebase أولًا.');
    return;
  }
  try {
    await window.KABOUSH_STORE.signIn($('adminEmail').value.trim(), $('adminPassword').value);
  } catch (error) {
    $('authStatus').textContent = `تعذر تسجيل الدخول إلى Firebase: ${error.code || error.message}`;
  }
}

async function showAdmin(user) {
  if (user.uid !== window.KABOUSH_FIREBASE_CONFIG.ownerUid) {
    $('authStatus').textContent = 'هذا الحساب غير مصرح له بإدارة المتجر.';
    await window.KABOUSH_STORE.signOut();
    return;
  }
  $('authCard').classList.add('hidden');
  $('adminContent').classList.remove('hidden');
  $('adminSyncStatus').textContent = `تم تسجيل الدخول: ${user.email || 'حساب الإدارة'} · جارٍ تحميل بيانات المتجر`;
  try {
    const savedProducts = readStorage('kaboush_products', window.KABOUSH_DEMO_PRODUCTS);
    const savedCategories = readStorage('kaboush_categories', []);
    const savedSettings = readStorage('kaboush_settings', {});
    const wasSeeded = await window.KABOUSH_STORE.initializeCatalogIfNeeded(
      savedProducts,
      savedCategories,
      savedSettings
    );
    if (wasSeeded) showToast('تم نقل الكتالوج إلى Firebase ليظهر على جميع الأجهزة.');
    unsubscribeStore.forEach(unsubscribe => unsubscribe());
    unsubscribeStore = [
      window.KABOUSH_STORE.watchProducts(items => {
        products = items;
        renderCategories();
        renderProducts();
      }, handleCloudError),
      window.KABOUSH_STORE.watchCategories(items => {
        categories = items;
        renderCategories();
      }, handleCloudError),
      window.KABOUSH_STORE.watchSettings(items => {
        settings = items;
        $('adminWhatsapp').value = settings.whatsapp || '';
        $('adminPhone').value = settings.phone || '';
        $('adminHours').value = settings.hours || '';
      }, handleCloudError)
    ];
    $('adminSyncStatus').textContent = 'متصل بقاعدة Firebase · التغييرات تتزامن مع جميع الأجهزة';
  } catch (error) {
    $('adminSyncStatus').textContent = 'تعذر تحميل قاعدة البيانات. راجع إعداد Firebase وقواعد الأمان.';
    showToast(`فشل تحميل بيانات المتجر من Firebase: ${error.message}`);
  }
}

function handleCloudError(error) {
  $('adminSyncStatus').textContent = 'انقطع الاتصال بقاعدة البيانات. تحقق من قواعد Firebase والإنترنت.';
  showToast(error.message || 'تعذر مزامنة بيانات المتجر.');
}

function allCategories() {
  return [...new Set([...categories, ...products.map(product => product.category)].filter(Boolean))];
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
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" onerror="this.hidden=true">
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
  $('pImageFile').value = '';
  $('imagePreview').src = '';
  $('imagePreview').classList.add('hidden');
  $('imageStatus').textContent = '';
  updateImageChoice();
  $('productFormTitle').textContent = 'إضافة منتج';
  $('saveProductButton').textContent = 'إضافة المنتج';
  $('cancelEditButton').classList.add('hidden');
}

function editProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  renderCategories();
  $('productId').value = product.id;
  $('pName').value = product.name;
  $('pPrice').value = product.price;
  $('pCategory').value = product.category;
  $('pCode').value = product.id;
  $('pImage').value = product.image;
  showImagePreview(product.image);
  $('pDesc').value = product.desc || '';
  $('productFormTitle').textContent = 'تعديل المنتج';
  $('saveProductButton').textContent = 'حفظ التعديلات';
  $('cancelEditButton').classList.remove('hidden');
  $('productFormTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function validImageUrl(value) {
  if (/^data:image\//i.test(value)) {
    return /^data:image\/(?:jpeg|png|webp|gif);base64,[a-z0-9+/]+=*$/i.test(value)
      && value.length <= 1_500_000;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

$('productForm').addEventListener('change', async event => {
  if (event.target.name === 'imageSource') {
    updateImageChoice();
    return;
  }
  if (event.target.id !== 'pImageFile') return;
  const file = event.target.files[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    event.target.value = '';
    $('imageStatus').textContent = 'اختر صورة بصيغة JPG أو PNG أو WebP أو GIF.';
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    event.target.value = '';
    $('imageStatus').textContent = 'حجم الصورة أكبر من 10 ميجابايت.';
    return;
  }
  imageProcessing = compressImage(file).then(dataUrl => {
    $('pImage').value = dataUrl;
    showImagePreview(dataUrl);
    $('imageStatus').textContent = 'تم تجهيز الصورة. احفظ المنتج لتظهر في المتجر على هذا المتصفح.';
  }).catch(error => {
    event.target.value = '';
    $('imageStatus').textContent = error.message || 'تعذر قراءة الصورة.';
  });
});

$('pImage').addEventListener('input', () => {
  const value = $('pImage').value.trim();
  if (/^(https?:\/\/|data:image\/)/i.test(value)) showImagePreview(value);
  else {
    $('imagePreview').classList.add('hidden');
    $('imageStatus').textContent = '';
  }
});

function updateImageChoice() {
  const uploading = document.querySelector('input[name="imageSource"]:checked').value === 'upload';
  $('imageUrlField').classList.toggle('hidden', uploading);
  $('imageUploadField').classList.toggle('hidden', !uploading);
  $('pImage').required = !uploading;
  $('pImageFile').required = uploading && !$('productId').value;
}

function showImagePreview(source) {
  const preview = $('imagePreview');
  preview.onload = () => {
    preview.classList.remove('hidden');
    $('imageStatus').textContent = 'معاينة الصورة جاهزة.';
  };
  preview.onerror = () => {
    preview.classList.add('hidden');
    $('imageStatus').textContent = 'تعذر تحميل الصورة. تحقق من الرابط أو اختر ملف صورة صالحًا.';
  };
  preview.src = source;
}

async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.78));
  if (!blob) throw new Error('تعذر تجهيز الصورة. جرّب ملفًا بصيغة JPG أو PNG.');
  if (blob.size > 900 * 1024) throw new Error('تعذر ضغط الصورة إلى حجم مناسب. اختر صورة أصغر.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة من الجهاز.'));
    reader.readAsDataURL(blob);
  });
}

function verifyImageSource(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.src = '';
      reject(new Error('انتهت مهلة تحميل الصورة. تحقق من الرابط وحاول مرة أخرى.'));
    }, 10000);
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('تعذر تحميل الصورة. استخدم رابط الصورة المباشر أو اختر ملفًا صالحًا.'));
    };
    image.src = source;
  });
}

$('settingsForm').addEventListener('submit', async event => {
  event.preventDefault();
  const updatedSettings = {
    whatsapp: $('adminWhatsapp').value.trim(),
    phone: $('adminPhone').value.trim(),
    hours: $('adminHours').value.trim()
  };
  try {
    await window.KABOUSH_STORE.saveSettings(updatedSettings);
    showToast('تم حفظ بيانات التواصل ومزامنتها.');
  } catch (error) {
    showToast(`تعذر حفظ بيانات التواصل: ${error.message}`);
  }
});

$('productForm').addEventListener('submit', async event => {
  event.preventDefault();
  await imageProcessing;
  const oldId = $('productId').value;
  const id = $('pCode').value.trim() || oldId || `KB${Date.now().toString().slice(-8)}`;
  const duplicate = products.some(product => product.id === id && product.id !== oldId);
  if (duplicate) {
    showToast('كود المنتج مستخدم بالفعل؛ اختر كودًا آخر.');
    return;
  }
  const price = Number($('pPrice').value);
  const image = $('pImage').value.trim();
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) {
    showToast('كود المنتج يجب أن يحتوي على أحرف إنجليزية أو أرقام أو شرطة فقط.');
    return;
  }
  if (!Number.isFinite(price) || price < 0 || !validImageUrl(image)) {
    showToast('أدخل سعرًا صحيحًا ورابط صورة صالحًا أو اختر ملف صورة.');
    return;
  }
  try {
    await verifyImageSource(image);
  } catch (error) {
    $('imageStatus').textContent = error.message;
    showToast(error.message);
    return;
  }
  const existingProduct = oldId ? products.find(item => item.id === oldId) : null;
  const product = {
    id,
    name: $('pName').value.trim(),
    price,
    category: $('pCategory').value,
    image,
    imagePath: existingProduct && existingProduct.image === image ? (existingProduct.imagePath || '') : '',
    desc: $('pDesc').value.trim(),
    sizes: oldId ? (products.find(item => item.id === oldId).sizes || ['M', 'L', 'XL']) : ['M', 'L', 'XL'],
    colors: oldId ? (products.find(item => item.id === oldId).colors || ['أسود', 'أبيض']) : ['أسود', 'أبيض']
  };
  let uploadedImagePath = '';
  if (image.startsWith('data:image/')) {
    try {
      const blob = await fetch(image).then(response => response.blob());
      const uploaded = await window.KABOUSH_STORE.uploadImage(id, blob);
      product.image = uploaded.url;
      product.imagePath = uploaded.path;
      uploadedImagePath = uploaded.path;
    } catch (error) {
      showToast(`تعذر رفع الصورة إلى Firebase Storage: ${error.message}`);
      return;
    }
  }
  try {
    const result = await window.KABOUSH_STORE.saveProduct(oldId, product);
    if (oldId && oldId !== id) {
      const cart = readStorage('kaboush_cart', []);
      cart.forEach(item => { if (item.id === oldId) item.id = id; });
      localStorage.setItem('kaboush_cart', JSON.stringify(cart));
    }
    if (result.imageCleanupFailed) {
      showToast('تم حفظ المنتج، لكن تعذر حذف الصورة القديمة من التخزين.');
    } else {
      showToast(oldId ? 'تم تحديث المنتج ومزامنته.' : 'تمت إضافة المنتج ومزامنته.');
    }
  } catch (error) {
    if (uploadedImagePath) {
      try {
        await window.KABOUSH_STORE.deleteImage(uploadedImagePath);
      } catch {
        showToast('فشل حفظ المنتج وتعذر تنظيف الصورة المرفوعة. احذف الملف من Firebase Storage.');
        return;
      }
    }
    showToast(`تعذر حفظ المنتج في Firebase: ${error.message}`);
    return;
  }
  resetProductForm();
});

$('cancelEditButton').addEventListener('click', resetProductForm);

$('categoryForm').addEventListener('submit', async event => {
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
  try {
    await window.KABOUSH_STORE.saveCategory(name);
    categories = [...categories, name];
    $('categoryForm').reset();
    renderCategories();
    showToast('تمت إضافة القسم ومزامنته.');
  } catch (error) {
    showToast(`تعذر حفظ القسم في Firebase: ${error.message}`);
  }
});

$('categoryList').addEventListener('click', async event => {
  const button = event.target.closest('[data-delete-category]');
  if (!button) return;
  const name = button.dataset.deleteCategory;
  if (products.some(product => product.category === name)) {
    showToast('انقل المنتجات التابعة لهذا القسم أو احذفها أولًا.');
    return;
  }
  if (!window.confirm(`هل تريد حذف قسم "${name}"؟`)) return;
  try {
    await window.KABOUSH_STORE.removeCategory(name);
    categories = categories.filter(category => category !== name);
    renderCategories();
    showToast('تم حذف القسم من المتجر.');
  } catch (error) {
    showToast(`تعذر حذف القسم من Firebase: ${error.message}`);
  }
});

$('adminProductList').addEventListener('click', async event => {
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
  try {
    const result = await window.KABOUSH_STORE.removeProduct(id);
    products = products.filter(item => item.id !== id);
    const cart = readStorage('kaboush_cart', []);
    localStorage.setItem('kaboush_cart', JSON.stringify(cart.filter(item => item.id !== id)));
    renderCategories();
    renderProducts();
    showToast(result.imageCleanupFailed
      ? 'تم حذف المنتج، لكن تعذر حذف صورته من Firebase Storage.'
      : 'تم حذف المنتج من المتجر.');
  } catch (error) {
    showToast(`تعذر حذف المنتج من Firebase: ${error.message}`);
  }
});

$('logoutButton').addEventListener('click', async () => {
  unsubscribeStore.forEach(unsubscribe => unsubscribe());
  try {
    await window.KABOUSH_STORE.signOut();
  } catch (error) {
    showToast(`تعذر تسجيل الخروج: ${error.message}`);
  }
});

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
  renderAuth();
} else {
  renderAuth();
  window.KABOUSH_STORE.auth.onAuthStateChanged(user => {
    if (user) showAdmin(user);
    else {
      unsubscribeStore.forEach(unsubscribe => unsubscribe());
      unsubscribeStore = [];
      $('adminContent').classList.add('hidden');
      $('authCard').classList.remove('hidden');
    }
  }, handleCloudError);
}
updateImageChoice();
