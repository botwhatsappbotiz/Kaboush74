KABOUSH Mobile-First Store Website
====================================

Files:
- index.html: website structure (Arabic, RTL).
- styles.css: responsive mobile-first styling.
- app.js: product catalog, category filters, cart, WhatsApp booking, store settings.
- catalog.js: shared initial demo products used by the store and admin page.
- admin.html, admin.js, admin.css: separate prototype management page for products, categories, and contact settings.
- manifest.json: basic PWA metadata.

Preview:
Open index.html in a browser. Internet access is needed for the remote product photos.

Important:
1. Initial products and prices are demo examples, not verified inventory or current store prices.
2. Enter the real WhatsApp number in admin.html. Use country code 20 and digits only, for example 201XXXXXXXXX.
3. Open admin.html to manage products, categories, and store contact details. The prototype has a preset admin password.
4. Product/settings/cart data are saved only in the current browser using localStorage. The password screen is only a prototype: visitors can bypass it or change browser data. Product and setting changes will not reach customer devices.
5. Before public launch, connect a backend/database, cloud image storage, and server-side authenticated admin access. Serve the site over HTTPS.
6. The Google Maps directions button uses the coordinates supplied in the conversation: 26.1591885, 32.7239556.

To publish:
Upload all website files to any static hosting service. For installable PWA behavior, serve through HTTPS and add icons/service worker before production.
