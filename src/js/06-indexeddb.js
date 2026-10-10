    function openDB() {
        return new Promise((resolve, reject) => {
            try {
                if (typeof window === 'undefined' || !window.indexedDB) {
                    return reject(new Error('IndexedDB tidak didukung'));
                }
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onblocked = () => {
                    console.warn('[IndexedDB] Database upgrade terblokir oleh koneksi tab lain');
                    reject(new Error('IndexedDB terblokir'));
                };
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });

                    if (db.objectStoreNames.contains('cart')) {
                        const cartStore = req.transaction.objectStore('cart');
                        if (cartStore.keyPath !== 'cartItemId') {
                            db.deleteObjectStore('cart');
                            db.createObjectStore('cart', { keyPath: 'cartItemId' });
                        }
                    } else {
                        db.createObjectStore('cart', { keyPath: 'cartItemId' });
                    }

                    if (!db.objectStoreNames.contains('orders')) db.createObjectStore('orders', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
                    if (!db.objectStoreNames.contains('coupons')) db.createObjectStore('coupons', { keyPath: 'code' });
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('Gagal membuka IndexedDB'));
            } catch (err) {
                reject(err);
            }
        });
    }

    async function ensureDB() {
        if (!dbInstance) {
            try {
                const openPromise = openDB();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('IndexedDB timeout')), 2000));
                dbInstance = await Promise.race([openPromise, timeoutPromise]);
            } catch (e) {
                console.warn('Gagal membuka Penyimpanan:', e);
            }
        }
        return dbInstance;
    }

    function tx(storeName, mode) {
        if (!dbInstance) {
            throw new Error('Database belum siap');
        }
        return dbInstance.transaction(storeName, mode).objectStore(storeName);
    }
    async function dbGetAll(storeName) {
        try {
            await ensureDB();
            if (!dbInstance) return [];
            return await new Promise((resolve) => {
                try {
                    const req = tx(storeName, 'readonly').getAll();
                    req.onsuccess = () => resolve(req.result || []);
                    req.onerror = () => resolve([]);
                } catch (e) {
                    resolve([]);
                }
            });
        } catch (err) {
            return [];
        }
    }
    async function dbGet(storeName, key) {
        await ensureDB();
        if (!dbInstance) return null;
        return new Promise((resolve) => {
            try {
                const req = tx(storeName, 'readonly').get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    }
    async function dbPut(storeName, value) {
        await ensureDB();
        if (!dbInstance) return null;
        return new Promise((resolve) => {
            try {
                const req = tx(storeName, 'readwrite').put(value);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    }
    async function dbBulkPut(storeName, values) {
        await ensureDB();
        if (!dbInstance || !Array.isArray(values) || values.length === 0) return;
        return new Promise((resolve) => {
            try {
                const store = tx(storeName, 'readwrite');
                values.forEach(v => store.put(v));
                store.transaction.oncomplete = () => resolve();
                store.transaction.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    }
    async function dbDelete(storeName, key) {
        await ensureDB();
        if (!dbInstance) return;
        return new Promise((resolve) => {
            try {
                const req = tx(storeName, 'readwrite').delete(key);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    }
    async function dbClear(storeName) {
        await ensureDB();
        if (!dbInstance) return;
        return new Promise((resolve) => {
            try {
                const req = tx(storeName, 'readwrite').clear();
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    }

    async function seedIfEmpty() {
        const flashSetting = await dbGet('settings', 'flashSaleEndsAt');
        if (!flashSetting) {
            const endsAt = Date.now() + 3 * 24 * 60 * 60 * 1000;
            await dbPut('settings', { key: 'flashSaleEndsAt', value: endsAt });
        }
    }

    function formatBytes(bytes, decimals = 1) {
        if (!bytes || bytes <= 0) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    async function getIndexedDBStorageInfo() {
        let usageBytes = 0;
        let quotaBytes = 0;
        let percentUsed = '0.0';

        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                usageBytes = estimate.usage || 0;
                quotaBytes = estimate.quota || 0;
                if (quotaBytes > 0) {
                    percentUsed = ((usageBytes / quotaBytes) * 100).toFixed(1);
                }
            } catch (e) {
                console.warn('Storage estimate error:', e);
            }
        }

        const [products, orders, cart, categories, coupons] = await Promise.all([
            dbGetAll('products'),
            dbGetAll('orders'),
            dbGetAll('cart'),
            dbGetAll('categories'),
            dbGetAll('coupons')
        ]);

        let calculatedDataBytes = 0;
        try {
            const dump = JSON.stringify({ products, orders, cart, categories, coupons });
            calculatedDataBytes = new Blob([dump]).size;
        } catch (e) {}

        const displayUsageBytes = (usageBytes > 0) ? usageBytes : calculatedDataBytes;

        return {
            usageBytes: displayUsageBytes,
            quotaBytes: quotaBytes,
            percentUsed: (parseFloat(percentUsed) > 0) ? percentUsed : ((displayUsageBytes / (50 * 1024 * 1024)) * 100).toFixed(1),
            counts: {
                products: products.length,
                orders: orders.length,
                cart: cart.length,
                categories: categories.length,
                coupons: coupons.length
            },
            calculatedDataBytes: calculatedDataBytes
        };
    }

    async function handleClearProductsCache() {
        if (!window.confirm('Bersihkan cache produk & kategori dari Penyimpanan? Data menu akan dimuat ulang dari server saat halaman dibuka kembali.')) return;
        try {
            await dbClear('products');
            await dbClear('categories');
            window.__allProducts = [];
            showToast('Cache produk & kategori berhasil dikosongkan.', '#10b981');
            if (currentRoute()[0] === 'profile') {
                await renderProfile();
            }
        } catch (e) {
            showToast('Gagal membersihkan cache: ' + e.message, '#ef4444');
        }
    }

    async function handleClearCartOnly() {
        if (!window.confirm('Kosongkan semua menu di keranjang belanja?')) return;
        try {
            await dbClear('cart');
            await updateCartBadge();
            if (typeof updateFloatingCartBar === 'function') updateFloatingCartBar();
            showToast('Keranjang belanja berhasil dikosongkan.', '#10b981');
            if (currentRoute()[0] === 'profile') {
                await renderProfile();
            }
        } catch (e) {
            showToast('Gagal mengosongkan keranjang: ' + e.message, '#ef4444');
        }
    }

    async function handleClearOrdersLocal() {
        if (!window.confirm('Hapus seluruh riwayat pesanan lokal dari Penyimpanan Lokal? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
            await dbClear('orders');
            showToast('Riwayat pesanan lokal berhasil dihapus.', '#10b981');
            if (currentRoute()[0] === 'profile') {
                await renderProfile();
            }
        } catch (e) {
            showToast('Gagal menghapus pesanan: ' + e.message, '#ef4444');
        }
    }

    async function resetStoreData() {
        const stores = ['cart', 'orders', 'products', 'categories', 'coupons', 'profile', 'settings'];
        for (const s of stores) {
            try { await dbClear(s); } catch (e) {}
        }
        await updateCartBadge();
        if (typeof updateFloatingCartBar === 'function') updateFloatingCartBar();
        showToast('Semua data lokal Penyimpanan berhasil dibersihkan.', '#10b981');
        setTimeout(() => {
            navigate('/home');
        }, 500);
    }

    function formatRupiah(num) {
        return 'Rp ' + Math.round(Number(num) || 0).toLocaleString('id-ID');
    }
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
    }
    function formatDate(ts) {
        if (!ts) return '-';
        try {
            let d;
            if (typeof ts === 'number') {
                d = new Date(ts);
            } else if (typeof ts === 'string') {
                const clean = ts.trim().replace(' ', 'T');
                d = new Date(clean);
                if (isNaN(d.getTime())) d = new Date(ts);
            } else if (ts instanceof Date) {
                d = ts;
            } else {
                d = new Date(ts);
            }
            if (isNaN(d.getTime())) return String(ts);
            return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return String(ts || '-');
        }
    }
    function genId(prefix) {
        return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function showToast(msg, color = '#FF7A29', isLoading = false) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        let iconStr = isLoading
            ? `<svg class="w-5 h-5 animate-spin mr-2" viewBox="0 0 24 24" style="color:${color}"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`
            : `<svg class="svg-icon w-5 h-5 mr-2" viewBox="0 0 24 24" style="color:${color}"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        toast.innerHTML = `<div class="flex items-center justify-center">${iconStr} <span>${escapeHtml(msg)}</span></div>`;
        toast.classList.add('show');
        clearTimeout(window.__toastTimer);
        window.__toastTimer = setTimeout(() => toast.classList.remove('show'), isLoading ? 1500 : 2800);
    }

