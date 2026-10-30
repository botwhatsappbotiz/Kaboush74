const LOCAL_ADMIN_PASSWORD_HASH = '715c95ff1aad4ab7651363960f7e6cb12d169b56b45747f2c4e6cd43c5dd9bae';
const OWNER_EMAIL = 'K.STORE@GMAIL.COM';
const $ = id => document.getElementById(id);
let imageProcessing = Promise.resolve();
let products = [];
let settings = {};
let categories = [];
let offers = [];
let unsubscribeStore = [];
const siteDefaults = window.KABOUSH_SITE_DEFAULTS || {};

const siteContentGroups = [
  {
    title: 'هوية المتجر والواجهة الرئيسية',
    fields: [
      ['storeName', 'اسم المتجر'], ['tagline', 'وصف المتجر المختصر'],
      ['heroEyebrow', 'العبارة الصغيرة أعلى الواجهة'], ['heroImage', 'رابط صورة الواجهة'],
      ['heroTitle', 'عنوان الواجهة الرئيسية', 'textarea'],
      ['heroDescription', 'وصف الواجهة الرئيسية', 'textarea'], ['heroButton', 'نص زر الواجهة'],
      ['footerDescription', 'عبارة تذييل الصفحة', 'textarea']
    ]
  },
  {
    title: 'البحث والأقسام والمنتجات',
    fields: [
      ['searchPlaceholder', 'نص البحث التوضيحي'], ['searchButton', 'زر البحث'],
      ['categoryTitle', 'عنوان الأقسام'], ['categoryDescription', 'وصف الأقسام', 'textarea'],
      ['productTitle', 'عنوان المنتجات'], ['productDescription', 'وصف المنتجات', 'textarea'],
      ['showAllButton', 'زر عرض جميع المنتجات']
    ]
  },
  {
    title: 'التنويه والعروض',
    fields: [
      ['calloutTitle', 'عنوان التنويه'], ['calloutDescription', 'وصف التنويه', 'textarea'],
      ['calloutButton', 'زر التنويه'], ['offerTitle', 'عنوان العروض'],
      ['offerDescription', 'وصف العروض', 'textarea'], ['offerEmptyText', 'النص عند عدم وجود عروض']
    ]
  },
  {
    title: 'معلومات المتجر والخريطة',
    fields: [
      ['locationTitle', 'عنوان قسم الموقع'], ['locationDescription', 'وصف قسم الموقع', 'textarea'],
      ['locationCardTitle', 'عنوان بطاقة الموقع'], ['locationCardDescription', 'وصف بطاقة الموقع', 'textarea'],
      ['bookingCardTitle', 'عنوان بطاقة الحجز'], ['bookingCardDescription', 'وصف بطاقة الحجز', 'textarea'],
      ['shoppingCardTitle', 'عنوان بطاقة التسوق'], ['shoppingCardDescription', 'وصف بطاقة التسوق', 'textarea'],
      ['mapTitle', 'اسم الموقع على الخريطة'], ['mapLatitude', 'خط العرض'],
      ['mapLongitude', 'خط الطول'], ['mapButton', 'نص زر الاتجاهات']
    ]
  },
  {
    title: 'التواصل والتذييل',
    fields: [
      ['contactTitle', 'عنوان التواصل'], ['contactDescription', 'وصف التواصل', 'textarea'],
      ['phoneCardTitle', 'عنوان بطاقة الهاتف'], ['phoneFallback', 'النص عند عدم إضافة الهاتف'],
      ['phoneLinkLabel', 'نص زر الاتصال'], ['whatsappCardTitle', 'عنوان بطاقة واتساب'],
      ['whatsappFallback', 'النص عند عدم إضافة واتساب'], ['whatsappButtonLabel', 'نص زر واتساب'],
      ['hoursCardTitle', 'عنوان بطاقة مواعيد العمل'], ['hoursFallback', 'النص عند عدم إضافة المواعيد'],
      ['headerCartLabel', 'وصف زر الحجز في أعلى الصفحة'], ['headerContactLabel', 'وصف زر التواصل في أعلى الصفحة'],
      ['navHomeLabel', 'رابط الرئيسية'], ['navProductsLabel', 'رابط المنتجات'],
      ['navOffersLabel', 'رابط العروض'], ['navCartLabel', 'رابط قائمة الحجز'],
      ['navLocationLabel', 'رابط الموقع']
    ]
  }
];

const siteVisibilityFields = [
  ['showHero', 'الواجهة الرئيسية'],
  ['showSearch', 'البحث'],
  ['showCategories', 'الأقسام'],
  ['showProducts', 'المنتجات'],
  ['showCallout', 'التنويه'],
  ['showOffers', 'العروض'],
  ['showLocation', 'الموقع والخريطة'],
  ['showContact', 'التواصل']
];

function renderSiteContentForm() {
  const content = { ...siteDefaults, ...settings };
  $('siteContentFields').innerHTML = siteContentGroups.map(group => `
    <details class="site-content-group" open>
      <summary>${escapeHTML(group.title)}</summary>
      <div class="site-content-grid">${group.fields.map(([key, label, type]) => `
        <label class="${type === 'textarea' ? 'full-width' : ''}">${escapeHTML(label)}
          ${type === 'textarea'
            ? `<textarea data-site-content="${key}" rows="2" maxlength="300">${escapeHTML(content[key] ?? '')}</textarea>`
            : `<input data-site-content="${key}" ${key === 'mapLatitude' || key === 'mapLongitude' ? 'type="number" step="any"' : 'type="text"'} maxlength="150" value="${escapeHTML(content[key] ?? '')}">`}
        </label>`).join('')}</div>
    </details>`).join('') + `
    <fieldset class="site-content-group">
      <legend>الأقسام الظاهرة في صفحة المتجر</legend>
      <div class="site-visibility-grid">${siteVisibilityFields.map(([key, label]) => `
        <label class="site-visibility-option"><input type="checkbox" data-site-content="${key}" ${content[key] ? 'checked' : ''}>${escapeHTML(label)}</label>
      `).join('')}</div>
    </fieldset>`;
}

function renderCustomSections() {
  const sections = Array.isArray(settings.customSections) ? settings.customSections : [];
  $('customSectionList').innerHTML = sections.length
    ? sections.map(section => `<article class="custom-section-row">
        <div><strong>${escapeHTML(section.title)}</strong><p>${escapeHTML(section.description)}</p></div>
        <div class="admin-product-actions">
          <button class="button button-light" type="button" data-edit-custom-section="${escapeHTML(section.id)}">تعديل</button>
          <button class="button button-danger" type="button" data-delete-custom-section="${escapeHTML(section.id)}">حذف</button>
        </div>
      </article>`).join('')
    : '<div class="empty-state">لا توجد أقسام إضافية.</div>';
}

function resetCustomSectionForm() {
  $('customSectionForm').reset();
  $('customSectionId').value = '';
  $('saveCustomSectionButton').textContent = 'إضافة القسم';
  $('cancelCustomSectionButton').classList.add('hidden');
}

function readSiteContentForm() {
  const content = {};
  $('siteContentFields').querySelectorAll('[data-site-content]').forEach(input => {
    content[input.dataset.siteContent] = input.type === 'checkbox' ? input.checked : input.value.trim();
  });
  return content;
}

async function saveStoreSettings(updatedSettings, errorLabel) {
  const mergedSettings = { ...settings, ...updatedSettings };
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    try {
      localStorage.setItem('kaboush_settings', JSON.stringify(mergedSettings));
      settings = mergedSettings;
      return true;
    } catch {
      showToast('تعذر حفظ الإعدادات في مساحة التخزين المحلية.');
      return false;
    }
  }
  try {
    await window.KABOUSH_STORE.saveSettings(mergedSettings);
    settings = mergedSettings;
    return true;
  } catch (error) {
    showToast(`تعذر حفظ ${errorLabel} في Firebase: ${error.message}`);
    return false;
  }
}

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
  $('authDescription').textContent = 'أدخل كلمة مرور حساب الإدارة.';
  $('authForm').innerHTML = `
    <label>كلمة المرور<input id="adminPassword" type="password" autocomplete="current-password" required></label>
    <button class="button button-dark" type="submit">دخول</button>`;
  $('authForm').addEventListener('submit', authenticate);
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    $('authStatus').textContent = window.KABOUSH_STORE
      ? `${window.KABOUSH_STORE.configurationMessage} يمكنك الدخول محليًا، لكن التغييرات لن تظهر على الأجهزة الأخرى.`
      : 'تعذر تحميل Firebase. تحقق من اتصال الإنترنت وإعداد ملفات الموقع. يمكنك الدخول محليًا، لكن التغييرات لن تظهر على الأجهزة الأخرى.';
    $('authForm').querySelector('button').disabled = false;
  } else {
    $('authStatus').textContent = 'استخدم حساب الإدارة الذي أُنشئ في Firebase Authentication.';
  }
}

async function authenticate(event) {
  event.preventDefault();
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    try {
      if (await passwordHash($('adminPassword').value) !== LOCAL_ADMIN_PASSWORD_HASH) {
        showToast('كلمة المرور غير صحيحة.');
        return;
      }
      sessionStorage.setItem('kaboush_admin_local_authenticated', 'true');
      showLocalAdmin();
    } catch (error) {
      showToast(error.message);
    }
    return;
  }
  try {
    await window.KABOUSH_STORE.signIn(OWNER_EMAIL, $('adminPassword').value);
  } catch (error) {
    $('authStatus').textContent = `تعذر تسجيل الدخول إلى Firebase: ${error.code || error.message}`;
  }
}

async function passwordHash(password) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('يلزم فتح الموقع عبر HTTPS أو localhost لتسجيل الدخول.');
  }
  const bytes = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function showLocalAdmin() {
  products = readStorage('kaboush_products', window.KABOUSH_DEMO_PRODUCTS);
  settings = readStorage('kaboush_settings', {});
  categories = readStorage('kaboush_categories', []);
  offers = readStorage('kaboush_offers', []);
  $('authCard').classList.add('hidden');
  $('adminContent').classList.remove('hidden');
  $('adminSyncStatus').textContent = 'وضع محلي فقط — التغييرات محفوظة على هذا الجهاز ولا تتزامن مع بقية الأجهزة.';
  $('adminWhatsapp').value = settings.whatsapp || '';
  $('adminPhone').value = settings.phone || '';
  $('adminHours').value = settings.hours || '';
  renderSiteContentForm();
  renderCategories();
  renderProducts();
  renderOffers();
  renderCustomSections();
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
      window.KABOUSH_STORE.watchOffers(items => {
        offers = items;
        renderOffers();
      }, handleCloudError),
      window.KABOUSH_STORE.watchSettings(items => {
        settings = items;
        $('adminWhatsapp').value = settings.whatsapp || '';
        $('adminPhone').value = settings.phone || '';
        $('adminHours').value = settings.hours || '';
        renderSiteContentForm();
        renderCustomSections();
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
      const categoryProducts = products.filter(product => product.category === name);
      return `<div class="category-row">
        <div class="category-row-heading">
          <div class="category-row-info"><strong>${escapeHTML(name)}</strong><small>${categoryProducts.length} منتج</small></div>
        <div class="category-row-actions">
          <button class="button button-light" type="button" data-edit-category="${escapeHTML(name)}">تعديل الاسم</button>
          <button class="button button-danger" type="button" data-delete-category="${escapeHTML(name)}">حذف القسم</button>
        </div>
        </div>
        <div class="category-products">${categoryProducts.length
          ? categoryProducts.map(renderAdminProduct).join('')
          : '<p class="admin-help">لا توجد منتجات في هذا القسم.</p>'}
        </div>
      </div>`;
    }).join('')
    : '';
  const uncategorizedProducts = products.filter(product => !product.category);
  if (uncategorizedProducts.length) {
    $('categoryList').innerHTML += `<div class="category-row">
      <div class="category-row-heading"><div class="category-row-info"><strong>منتجات بلا قسم</strong><small>${uncategorizedProducts.length} منتج</small></div></div>
      <div class="category-products">${uncategorizedProducts.map(renderAdminProduct).join('')}</div>
    </div>`;
  }
  if (!names.length && !uncategorizedProducts.length) {
    $('categoryList').innerHTML = '<div class="empty-state">لا توجد أقسام أو منتجات بعد.</div>';
  }
}

function renderAdminProduct(product) {
  return `<article class="admin-product">
    <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" onerror="this.hidden=true">
    <div class="admin-product-info">
      <strong>${escapeHTML(product.name)}</strong>
      <span>${Number(product.price).toLocaleString('en-US')} ج.م</span>
      <small>الكود: ${escapeHTML(product.id)}</small>
    </div>
    <div class="admin-product-actions">
      <button class="button button-light" type="button" data-edit-product="${escapeHTML(product.id)}">تعديل</button>
      <button class="button button-danger" type="button" data-delete-product="${escapeHTML(product.id)}">حذف</button>
    </div>
  </article>`;
}

function renderProducts() {
  $('productCount').textContent = `${products.length} منتج`;
}

function renderOffers() {
  $('adminOfferList').innerHTML = offers.length
    ? offers.map(offer => `<article class="admin-offer">
        <div class="admin-offer-info">
          <strong>${escapeHTML(offer.title)}</strong>
          <span>${escapeHTML(offer.description)}</span>
          <small>${offer.discount ? `خصم ${Number(offer.discount)}٪` : 'عرض خاص'}${offer.endDate ? ` · صالح حتى ${escapeHTML(offer.endDate)}` : ''}</small>
        </div>
        <button class="button button-danger" type="button" data-delete-offer="${escapeHTML(offer.id)}">حذف العرض</button>
      </article>`).join('')
    : '<div class="empty-state">لا توجد عروض مضافة.</div>';
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
  if (await saveStoreSettings(updatedSettings, 'بيانات التواصل')) {
    showToast(window.KABOUSH_STORE && window.KABOUSH_STORE.isConfigured
      ? 'تم حفظ بيانات التواصل ومزامنتها.'
      : 'تم حفظ بيانات التواصل على هذا الجهاز فقط.');
  }
});

$('siteContentForm').addEventListener('submit', async event => {
  event.preventDefault();
  const updatedContent = readSiteContentForm();
  let heroImageUrl;
  try {
    heroImageUrl = new URL(updatedContent.heroImage);
  } catch {
    showToast('أدخل رابط صورة صحيحًا للواجهة الرئيسية.');
    return;
  }
  if (!['https:', 'http:'].includes(heroImageUrl.protocol)
    || !updatedContent.mapLatitude || !updatedContent.mapLongitude) {
    showToast('أدخل رابط صورة يبدأ بـ http أو https وإحداثيات صحيحة للموقع.');
    return;
  }
  const latitude = Number(updatedContent.mapLatitude);
  const longitude = Number(updatedContent.mapLongitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    showToast('أدخل إحداثيات صحيحة: خط العرض من -90 إلى 90 وخط الطول من -180 إلى 180.');
    return;
  }
  if (await saveStoreSettings(updatedContent, 'محتوى صفحة المتجر')) {
    renderSiteContentForm();
    showToast(window.KABOUSH_STORE && window.KABOUSH_STORE.isConfigured
      ? 'تم حفظ محتوى الصفحة ومزامنته مع المتجر.'
      : 'تم حفظ محتوى الصفحة على هذا الجهاز فقط.');
  }
});

$('customSectionForm').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('customSectionId').value || `section-${Date.now()}-${crypto.randomUUID()}`;
  const section = {
    id,
    title: $('customSectionTitle').value.trim(),
    description: $('customSectionDescription').value.trim()
  };
  const sections = Array.isArray(settings.customSections) ? settings.customSections : [];
  const updatedSections = $('customSectionId').value
    ? sections.map(item => item.id === id ? section : item)
    : [section, ...sections];
  if (await saveStoreSettings({ customSections: updatedSections }, 'القسم الإضافي')) {
    settings.customSections = updatedSections;
    resetCustomSectionForm();
    renderCustomSections();
    showToast(window.KABOUSH_STORE && window.KABOUSH_STORE.isConfigured
      ? 'تم حفظ القسم الإضافي ومزامنته.'
      : 'تم حفظ القسم الإضافي على هذا الجهاز فقط.');
  }
});

$('cancelCustomSectionButton').addEventListener('click', resetCustomSectionForm);

$('customSectionList').addEventListener('click', async event => {
  const editButton = event.target.closest('[data-edit-custom-section]');
  if (editButton) {
    const section = (settings.customSections || []).find(item => item.id === editButton.dataset.editCustomSection);
    if (!section) return;
    $('customSectionId').value = section.id;
    $('customSectionTitle').value = section.title;
    $('customSectionDescription').value = section.description;
    $('saveCustomSectionButton').textContent = 'حفظ التعديلات';
    $('cancelCustomSectionButton').classList.remove('hidden');
    $('customSectionTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const deleteButton = event.target.closest('[data-delete-custom-section]');
  if (!deleteButton) return;
  const sections = Array.isArray(settings.customSections) ? settings.customSections : [];
  const section = sections.find(item => item.id === deleteButton.dataset.deleteCustomSection);
  if (!section || !window.confirm(`هل تريد حذف القسم "${section.title}"؟`)) return;
  const updatedSections = sections.filter(item => item.id !== section.id);
  if (await saveStoreSettings({ customSections: updatedSections }, 'القسم الإضافي')) {
    settings.customSections = updatedSections;
    renderCustomSections();
    showToast(window.KABOUSH_STORE && window.KABOUSH_STORE.isConfigured
      ? 'تم حذف القسم الإضافي من المتجر.'
      : 'تم حذف القسم الإضافي من هذا الجهاز.');
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
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    const updatedProducts = oldId
      ? products.map(item => item.id === oldId ? product : item)
      : [product, ...products];
    try {
      localStorage.setItem('kaboush_products', JSON.stringify(updatedProducts));
      products = updatedProducts;
      categories = [...new Set([...categories, product.category].filter(Boolean))];
      localStorage.setItem('kaboush_categories', JSON.stringify(categories));
      showToast(oldId ? 'تم تحديث المنتج على هذا الجهاز فقط.' : 'تمت إضافة المنتج على هذا الجهاز فقط.');
      resetProductForm();
      renderCategories();
      renderProducts();
    } catch {
      showToast('تعذر حفظ المنتج محليًا؛ مساحة المتصفح غير كافية.');
    }
    return;
  }
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
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    categories = [...categories, name];
    try {
      localStorage.setItem('kaboush_categories', JSON.stringify(categories));
      $('categoryForm').reset();
      renderCategories();
      showToast('تمت إضافة القسم على هذا الجهاز فقط.');
    } catch {
      showToast('تعذر حفظ القسم في مساحة التخزين المحلية.');
    }
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
  const editProductButton = event.target.closest('[data-edit-product]');
  if (editProductButton) {
    editProduct(editProductButton.dataset.editProduct);
    return;
  }
  const deleteProductButton = event.target.closest('[data-delete-product]');
  if (deleteProductButton) {
    await removeAdminProduct(deleteProductButton.dataset.deleteProduct);
    return;
  }
  const editButton = event.target.closest('[data-edit-category]');
  if (editButton) {
    const oldName = editButton.dataset.editCategory;
    const newName = window.prompt('اكتب اسم القسم الجديد:', oldName);
    if (newName === null) return;
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName.length > 50 || trimmedName === 'الكل') {
      showToast('أدخل اسم قسم صالحًا.');
      return;
    }
    if (trimmedName === oldName) return;
    if (allCategories().some(category =>
      category !== oldName && category.toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
    )) {
      showToast('يوجد قسم آخر بهذا الاسم بالفعل.');
      return;
    }
    const editingProductFromCategory = products.some(product =>
      product.id === $('productId').value && product.category === oldName
    );
    const updatedProducts = products.map(product =>
      product.category === oldName ? { ...product, category: trimmedName } : product
    );
    if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
      const updatedCategories = categories.map(category => category === oldName ? trimmedName : category);
      try {
        localStorage.setItem('kaboush_products', JSON.stringify(updatedProducts));
        localStorage.setItem('kaboush_categories', JSON.stringify(updatedCategories));
        products = updatedProducts;
        categories = updatedCategories;
        renderCategories();
        renderProducts();
        if (editingProductFromCategory) $('pCategory').value = trimmedName;
        showToast('تم تعديل اسم القسم والمنتجات التابعة له على هذا الجهاز فقط.');
      } catch {
        showToast('تعذر حفظ تعديل القسم في مساحة التخزين المحلية.');
      }
      return;
    }
    try {
      await window.KABOUSH_STORE.renameCategory(
        oldName,
        trimmedName,
        products.filter(product => product.category === oldName).map(product => product.id)
      );
      products = updatedProducts;
      categories = categories.map(category => category === oldName ? trimmedName : category);
      renderCategories();
      renderProducts();
      if (editingProductFromCategory) $('pCategory').value = trimmedName;
      showToast('تم تعديل اسم القسم وتحديث المنتجات التابعة له.');
    } catch (error) {
      showToast(`تعذر تعديل القسم في Firebase: ${error.message}`);
    }
    return;
  }
  const button = event.target.closest('[data-delete-category]');
  if (!button) return;
  const name = button.dataset.deleteCategory;
  if (products.some(product => product.category === name)) {
    showToast('انقل المنتجات التابعة لهذا القسم أو احذفها أولًا.');
    return;
  }
  if (!window.confirm(`هل تريد حذف قسم "${name}"؟`)) return;
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    categories = categories.filter(category => category !== name);
    try {
      localStorage.setItem('kaboush_categories', JSON.stringify(categories));
      renderCategories();
      showToast('تم حذف القسم من هذا الجهاز فقط.');
    } catch {
      showToast('تعذر تحديث الأقسام المحلية.');
    }
    return;
  }
  try {
    await window.KABOUSH_STORE.removeCategory(name);
    categories = categories.filter(category => category !== name);
    renderCategories();
    showToast('تم حذف القسم من المتجر.');
  } catch (error) {
    showToast(`تعذر حذف القسم من Firebase: ${error.message}`);
  }
});

$('offerForm').addEventListener('submit', async event => {
  event.preventDefault();
  const title = $('offerTitle').value.trim();
  const description = $('offerDescription').value.trim();
  const discountValue = $('offerDiscount').value;
  const discount = discountValue ? Number(discountValue) : null;
  const endDate = $('offerEndDate').value;
  if (!title || !description || (discount !== null && (!Number.isInteger(discount) || discount < 1 || discount > 100))) {
    showToast('أدخل عنوانًا وتفاصيل صحيحة، واجعل نسبة الخصم بين 1 و100.');
    return;
  }
  const offer = {
    id: `offer-${Date.now()}-${crypto.randomUUID()}`,
    title,
    description,
    discount,
    endDate
  };
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    try {
      offers = [offer, ...offers];
      localStorage.setItem('kaboush_offers', JSON.stringify(offers));
      $('offerForm').reset();
      renderOffers();
      showToast('تمت إضافة العرض على هذا الجهاز فقط.');
    } catch {
      offers = offers.filter(item => item.id !== offer.id);
      showToast('تعذر حفظ العرض في مساحة التخزين المحلية.');
    }
    return;
  }
  try {
    await window.KABOUSH_STORE.saveOffer(offer);
    $('offerForm').reset();
    showToast('تمت إضافة العرض ومزامنته.');
  } catch (error) {
    showToast(`تعذر حفظ العرض في Firebase: ${error.message}`);
  }
});

$('adminOfferList').addEventListener('click', async event => {
  const button = event.target.closest('[data-delete-offer]');
  if (!button) return;
  const id = button.dataset.deleteOffer;
  const offer = offers.find(item => item.id === id);
  if (!offer || !window.confirm(`هل تريد حذف العرض "${offer.title}"؟`)) return;
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    const updatedOffers = offers.filter(item => item.id !== id);
    try {
      localStorage.setItem('kaboush_offers', JSON.stringify(updatedOffers));
      offers = updatedOffers;
      renderOffers();
      showToast('تم حذف العرض من هذا الجهاز فقط.');
    } catch {
      showToast('تعذر تحديث العروض المحلية.');
    }
    return;
  }
  try {
    await window.KABOUSH_STORE.removeOffer(id);
    offers = offers.filter(item => item.id !== id);
    renderOffers();
    showToast('تم حذف العرض من المتجر.');
  } catch (error) {
    showToast(`تعذر حذف العرض من Firebase: ${error.message}`);
  }
});

async function removeAdminProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product || !window.confirm(`هل تريد حذف المنتج "${product.name}"؟`)) return;
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    products = products.filter(item => item.id !== id);
    try {
      localStorage.setItem('kaboush_products', JSON.stringify(products));
      categories = allCategories();
      localStorage.setItem('kaboush_categories', JSON.stringify(categories));
      const localCart = readStorage('kaboush_cart', []);
      localStorage.setItem('kaboush_cart', JSON.stringify(localCart.filter(item => item.id !== id)));
      renderCategories();
      renderProducts();
      showToast('تم حذف المنتج من هذا الجهاز فقط.');
    } catch {
      showToast('تعذر تحديث بيانات المنتجات المحلية.');
    }
    return;
  }
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
}

$('logoutButton').addEventListener('click', async () => {
  if (!window.KABOUSH_STORE || !window.KABOUSH_STORE.isConfigured) {
    sessionStorage.removeItem('kaboush_admin_local_authenticated');
    window.location.reload();
    return;
  }
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
  if (sessionStorage.getItem('kaboush_admin_local_authenticated') === 'true') {
    showLocalAdmin();
  }
} else {
  renderAuth();
  window.KABOUSH_STORE.auth.onAuthStateChanged(user => {
    if (user) showAdmin(user);
    else {
      unsubscribeStore.forEach(unsubscribe => unsubscribe());
      unsubscribeStore = [];
      $('adminContent').classList.add('hidden');
      $('authCard').classList.remove('hidden');
      renderAuth();
    }
  }, handleCloudError);
}
updateImageChoice();
