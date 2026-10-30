(function () {
  const config = window.KABOUSH_FIREBASE_CONFIG || {};
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'ownerUid'];
  const isConfigured = requiredKeys.every(key =>
    typeof config[key] === 'string'
    && config[key].length > 0
    && !config[key].startsWith('ADD_FIREBASE_')
  );

  if (!isConfigured || !window.firebase) {
    window.KABOUSH_STORE = {
      isConfigured: false,
      configurationMessage: !window.firebase
        ? 'تعذر تحميل مكتبة Firebase. تحقق من اتصال الإنترنت وإعدادات الموقع.'
        : 'أضف إعدادات Firebase ومعرّف حساب الإدارة إلى firebase-config.js لتفعيل المزامنة.'
    };
    return;
  }

  const { ownerUid, ...firebaseConfig } = config;
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  const productCollection = db.collection('products');
  const categoryCollection = db.collection('categories');
  const settingsRef = db.collection('store').doc('settings');
  const initializedRef = db.collection('store').doc('catalogInitialized');

  function categoryDocumentId(name) {
    return Array.from(new TextEncoder().encode(name), byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  }

  function productDocumentId(id) {
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) {
      throw new Error('كود المنتج يجب أن يحتوي على أحرف إنجليزية أو أرقام أو شرطة فقط.');
    }
    return id;
  }

  function imageReference(path) {
    return storage.ref().child(path);
  }

  async function uploadImage(productId, blob) {
    const safeId = productDocumentId(productId);
    const path = `products/${safeId}/${Date.now()}-${crypto.randomUUID()}.jpg`;
    const snapshot = await imageReference(path).put(blob, { contentType: 'image/jpeg' });
    return { url: await snapshot.ref.getDownloadURL(), path };
  }

  async function deleteImage(path) {
    if (path) await imageReference(path).delete();
  }

  async function saveProduct(oldId, product) {
    const newId = productDocumentId(product.id);
    const previous = oldId ? await productCollection.doc(productDocumentId(oldId)).get() : null;
    const batch = db.batch();
    batch.set(productCollection.doc(newId), product);
    if (product.category) {
      batch.set(categoryCollection.doc(categoryDocumentId(product.category)), { name: product.category });
    }
    if (oldId && oldId !== newId) {
      batch.delete(productCollection.doc(productDocumentId(oldId)));
    }
    await batch.commit();

    const oldImagePath = previous && previous.exists ? previous.data().imagePath : '';
    let imageCleanupFailed = false;
    if (oldImagePath && oldImagePath !== product.imagePath) {
      try {
        await deleteImage(oldImagePath);
      } catch {
        imageCleanupFailed = true;
      }
    }
    return { imageCleanupFailed };
  }

  async function removeProduct(id) {
    const ref = productCollection.doc(productDocumentId(id));
    const snapshot = await ref.get();
    await ref.delete();
    const path = snapshot.exists ? snapshot.data().imagePath : '';
    let imageCleanupFailed = false;
    if (path) {
      try {
        await deleteImage(path);
      } catch {
        imageCleanupFailed = true;
      }
    }
    return { imageCleanupFailed };
  }

  async function saveCategory(name) {
    await categoryCollection.doc(categoryDocumentId(name)).set({ name });
  }

  async function removeCategory(name) {
    await categoryCollection.doc(categoryDocumentId(name)).delete();
  }

  async function initializeCatalogIfNeeded(candidateProducts, candidateCategories, candidateSettings) {
    const marker = await initializedRef.get();
    if (marker.exists && marker.data().complete === true) return false;

    const existing = await productCollection.limit(1).get();
    const savedSettings = await settingsRef.get();
    const categoryNames = new Set([
      ...(candidateCategories || []),
      ...candidateProducts.map(product => product.category).filter(Boolean)
    ]);
    if (!existing.empty) {
      const batch = db.batch();
      for (const name of categoryNames) {
        batch.set(categoryCollection.doc(categoryDocumentId(name)), { name });
      }
      if (!savedSettings.exists && candidateSettings && Object.keys(candidateSettings).length) {
        batch.set(settingsRef, candidateSettings);
      }
      batch.set(initializedRef, { complete: true });
      await batch.commit();
      return false;
    }

    const batch = db.batch();
    for (const product of candidateProducts) {
      const { image, ...fields } = product;
      let sharedImage = image;
      let imagePath = '';
      if (typeof image === 'string' && image.startsWith('data:image/')) {
        const blob = await fetch(image).then(response => response.blob());
        const uploaded = await uploadImage(product.id, blob);
        sharedImage = uploaded.url;
        imagePath = uploaded.path;
      }
      batch.set(productCollection.doc(productDocumentId(product.id)), {
        ...fields,
        image: sharedImage,
        imagePath
      });
    }
    for (const name of categoryNames) {
      batch.set(categoryCollection.doc(categoryDocumentId(name)), { name });
    }
    if (!savedSettings.exists && candidateSettings && Object.keys(candidateSettings).length) {
      batch.set(settingsRef, candidateSettings);
    }
    batch.set(initializedRef, { complete: true });
    await batch.commit();
    return true;
  }

  window.KABOUSH_STORE = {
    isConfigured: true,
    configurationMessage: '',
    auth,
    db,
    signIn: (email, password) => auth.signInWithEmailAndPassword(email, password),
    signOut: () => auth.signOut(),
    uploadImage,
    deleteImage,
    saveProduct,
    removeProduct,
    saveCategory,
    removeCategory,
    initializeCatalogIfNeeded,
    watchProducts: (next, error) => productCollection.onSnapshot(
      snapshot => next(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      error
    ),
    watchCategories: (next, error) => categoryCollection.onSnapshot(
      snapshot => next(snapshot.docs.map(doc => doc.data().name).filter(Boolean)),
      error
    ),
    watchSettings: (next, error) => settingsRef.onSnapshot(
      snapshot => next(snapshot.exists ? snapshot.data() : {}),
      error
    ),
    saveSettings: settings => settingsRef.set(settings)
  };
})();
