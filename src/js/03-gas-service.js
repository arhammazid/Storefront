    async function syncFastFoodStockFromSheets() {
        const gasUrl = getGoogleAppsScriptUrl();
        if (!gasUrl) return;
        try {
            const sep = gasUrl.includes('?') ? '&' : '?';
            const res = await fetch(`${gasUrl}${sep}action=get_stock`, { method: 'GET' });
            if (res.ok) {
                const json = await res.json();
                if (json && json.success && Array.isArray(json.data)) {
                    const stockMap = {};
                    json.data.forEach(item => {
                        stockMap[item.id] = item;
                    });
                    if (window.__allProducts && Array.isArray(window.__allProducts)) {
                        window.__allProducts.forEach(item => {
                            if (stockMap[item.id]) {
                                item.stock = stockMap[item.id].stock;
                                item.isOutOfStock = stockMap[item.id].isOutOfStock;
                            }
                        });
                    }
                    try {
                        const dbProds = await dbGetAll('products');
                        for (const p of dbProds) {
                            if (stockMap[p.id]) {
                                p.stock = stockMap[p.id].stock;
                                p.isOutOfStock = stockMap[p.id].isOutOfStock;
                                await dbPut('products', p);
                            }
                        }
                    } catch (dbErr) {}
                }
            }
        } catch (e) {
            console.warn('Stock sync from sheets error (offline or invalid url):', e);
        }
    }

    try {
        initSwiperFastFood();
        updateStoreOperatingHeader();
        initFlashSaleCountdown();
        syncFastFoodStockFromSheets();
    } catch (errFastFoodInit) {
        console.error('Immediate fast food init error:', errFastFoodInit);
    }

    const DB_NAME = 'digiarju_store_db';
    const DB_VERSION = 4;

    function getSellerWhatsAppNumber() {
        try {
            const el = document.getElementById('blogger-seller-whatsapp-data');
            if (el && el.textContent) {
                let num = el.textContent.trim().replace(/[^0-9]/g, '');
                if (num) {
                    if (num.startsWith('0')) {
                        num = '62' + num.slice(1);
                    }
                    SELLER_WHATSAPP_NUMBER = num;
                    return num;
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget WhatsApp:', e);
        }
        return SELLER_WHATSAPP_NUMBER ? SELLER_WHATSAPP_NUMBER.replace(/[^0-9]/g, '') : '';
    }

    const DEFAULT_SHIPPING_DESTINATIONS = [
        { id: 'radius_1', name: 'Radius 0 - 3 km (Area Terdekat Resto)', province: 'Area Resto', reg: 5000, express: 10000, cargo: 0, etd: '15-25 Menit' },
        { id: 'radius_2', name: 'Radius 3 - 6 km (Area Sekitar Kota)', province: 'Dalam Kota', reg: 10000, express: 16000, cargo: 0, etd: '25-35 Menit' },
        { id: 'radius_3', name: 'Radius 6 - 10 km (Luar Area Inti)', province: 'Luar Area Inti', reg: 15000, express: 22000, cargo: 0, etd: '35-50 Menit' },
        { id: 'radius_4', name: 'Radius > 10 km (Khusus Kurir Instan)', province: 'Pinggiran Kota', reg: 22000, express: 30000, cargo: 0, etd: '45-60 Menit' }
    ];

    let SHIPPING_DESTINATIONS = DEFAULT_SHIPPING_DESTINATIONS;
    let FREE_SHIPPING_MIN_SPEND = 100000;

    function getShippingDestinations() {
        try {
            const el = document.getElementById('blogger-shipping-widget-data');
            if (el && el.textContent) {
                const rawText = el.textContent.trim();
                if (rawText) {
                    if (rawText.startsWith('[') && rawText.endsWith(']')) {
                        const parsed = JSON.parse(rawText);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            SHIPPING_DESTINATIONS = parsed.map((item, idx) => ({
                                id: item.id || ('dest_' + idx),
                                name: item.name || item.wilayah || 'Wilayah ' + (idx + 1),
                                province: item.province || item.name || '',
                                reg: Number(item.reg || item.reguler || 0),
                                express: Number(item.express || item.kilat || 0),
                                cargo: Number(item.cargo || item.kargo || 0),
                                etd: item.etd || '2-4 Hari'
                            }));
                            return SHIPPING_DESTINATIONS;
                        }
                    }
                    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                    const list = [];
                    for (let i = 0; i < lines.length; i++) {
                        const currentLine = lines[i];
                        if (currentLine.toUpperCase().startsWith('KOORDINAT_RESTO') || currentLine.toUpperCase().startsWith('LOKASI_RESTO') || currentLine.toUpperCase().startsWith('RESTO_LOCATION')) {
                            const parts = currentLine.split('|').map(p => p.trim());
                            if (parts.length >= 3) {
                                const lat = parseFloat(parts[1]);
                                const lng = parseFloat(parts[2]);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    RESTAURANT_COORDS.lat = lat;
                                    RESTAURANT_COORDS.lng = lng;
                                    if (parts.length > 3 && parts[3]) RESTAURANT_COORDS.name = parts[3];
                                    if (parts.length > 4 && parseFloat(parts[4])) RESTAURANT_COORDS.maxRadiusKm = parseFloat(parts[4]);
                                }
                            }
                            continue;
                        }

                        if (currentLine.toUpperCase().startsWith('TARIF_PER_KM') || currentLine.toUpperCase().startsWith('KM_PRICING')) {
                            const parts = currentLine.split('|').map(p => p.trim());
                            if (parts.length >= 3) {
                                const baseFee = parseInt(parts[1].replace(/[^\d]/g, ''), 10);
                                const perKmFee = parseInt(parts[2].replace(/[^\d]/g, ''), 10);
                                const freeKm = parts.length > 3 ? parseFloat(parts[3]) : 2.0;
                                if (!isNaN(baseFee) && !isNaN(perKmFee)) {
                                    KM_PRICING_CONFIG = { baseFee, perKmFee, freeKm };
                                }
                            }
                            continue;
                        }

                        if (currentLine.toUpperCase().startsWith('GRATIS_ONGKIR_MINIMAL') || currentLine.toUpperCase().startsWith('FREE_SHIPPING_MIN')) {
                            const parts = currentLine.split('|').map(p => p.trim());
                            if (parts.length >= 2) {
                                const minSpend = parseInt(parts[1].replace(/[^\d]/g, ''), 10);
                                if (!isNaN(minSpend)) {
                                    FREE_SHIPPING_MIN_SPEND = minSpend;
                                }
                            }
                            continue;
                        }

                        const parts = currentLine.split('|').map(p => p.trim());
                        if (parts.length >= 2) {
                            const name = parts[0];
                            const reg = parseInt(parts[1].replace(/[^\d]/g, ''), 10) || 0;
                            const express = parts.length > 2 ? (parseInt(parts[2].replace(/[^\d]/g, ''), 10) || 0) : Math.round(reg * 1.5);
                            const cargo = parts.length > 3 ? (parseInt(parts[3].replace(/[^\d]/g, ''), 10) || 0) : Math.round(reg * 0.8);
                            const etd = parts.length > 4 ? parts[4] : '2-4 Hari';
                            const id = 'dest_' + i + '_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                            list.push({ id, name, province: name, reg, express, cargo, etd });
                        }
                    }
                    if (list.length > 0) {
                        SHIPPING_DESTINATIONS = list;
                        return SHIPPING_DESTINATIONS;
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget tarif ongkir:', e);
        }
        SHIPPING_DESTINATIONS = DEFAULT_SHIPPING_DESTINATIONS;
        return SHIPPING_DESTINATIONS;
    }

    const DEFAULT_PAYMENT_METHODS = [
        { name: 'QRIS (Semua E-Wallet & Bank)', desc: 'Scan barcode QRIS instan otomatis' },
        { name: 'E-Wallet (Dana / GoPay / OVO / ShopeePay)', desc: '0812-3456-7890 (a.n Admin Resto)' },
        { name: 'COD (Bayar di Tempat)', desc: 'Pembayaran tunai saat makanan diterima dari kurir' }
    ];

    let PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS;

    function getPaymentMethods() {
        try {
            const el = document.getElementById('blogger-payment-methods-data');
            if (el && el.textContent) {
                const rawText = el.textContent.trim();
                if (rawText) {
                    if (rawText.startsWith('[') && rawText.endsWith(']')) {
                        const parsed = JSON.parse(rawText);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            PAYMENT_METHODS = parsed.map((item, idx) => ({
                                name: typeof item === 'string' ? item : (item.name || item.metode || 'Metode ' + (idx + 1)),
                                desc: typeof item === 'string' ? '' : (item.desc || item.keterangan || '')
                            }));
                            return PAYMENT_METHODS;
                        }
                    }
                    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                    const list = [];
                    for (let i = 0; i < lines.length; i++) {
                        const parts = lines[i].split('|').map(p => p.trim());
                        if (parts.length >= 1 && parts[0]) {
                            list.push({
                                name: parts[0],
                                desc: parts.length > 1 ? parts[1] : ''
                            });
                        }
                    }
                    if (list.length > 0) {
                        PAYMENT_METHODS = list;
                        return PAYMENT_METHODS;
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget metode pembayaran:', e);
        }
        PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS;
        return PAYMENT_METHODS;
    }

    const DEFAULT_ADDRESS_OPTIONS = [
        'Lainnya (Tulis Manual)'
    ];

    let ADDRESS_OPTIONS = DEFAULT_ADDRESS_OPTIONS;

    function getAddressOptions() {
        try {
            const el = document.getElementById('blogger-address-options-data');
            if (el && el.textContent) {
                const rawText = el.textContent.trim();
                if (rawText) {
                    if (rawText.startsWith('[') && rawText.endsWith(']')) {
                        const parsed = JSON.parse(rawText);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            ADDRESS_OPTIONS = parsed.map(item => typeof item === 'string' ? item : (item.name || item.area || '')).filter(Boolean);
                            return ADDRESS_OPTIONS;
                        }
                    }
                    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                    if (lines.length > 0) {
                        ADDRESS_OPTIONS = lines;
                        return ADDRESS_OPTIONS;
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget opsi alamat:', e);
        }
        ADDRESS_OPTIONS = DEFAULT_ADDRESS_OPTIONS;
        return ADDRESS_OPTIONS;
    }

    function getGoogleAppsScriptUrl() {
        if (GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.startsWith('https://script.google.com/')) {
            return GOOGLE_APPS_SCRIPT_URL;
        }

        try {
            const el = document.getElementById('blogger-gas-url-data');
            if (el && el.textContent) {
                const rawContent = el.textContent;
                const lines = rawContent.split(/\r?\n/)
                    .map(l => l.trim())
                    .filter(l => l && !l.startsWith('#') && !l.startsWith('//'));

                if (lines.length > 0) {
                    const firstLine = lines[0];

                    if (/^(?:hapus|reset|clear|kosong)(?:_storage|_local)?$/i.test(firstLine)) {
                        ['majid_gas_url', 'food_gas_url', 'dg_gas_url', 'mangan_gas_url', 'mangan_cs_gas_url'].forEach(k => {
                            try { localStorage.removeItem(k); } catch (e) {}
                        });
                        GOOGLE_APPS_SCRIPT_URL = '';
                        console.info('[GAS Config] majid_gas_url pada localStorage berhasil dibersihkan via widget Tata Letak Blogger.');
                        return '';
                    }

                    let targetUrl = firstLine.replace(/^['"]|['"]$/g, '').trim();
                    if (/^[A-Za-z0-9_-]{20,}$/.test(targetUrl) && !targetUrl.startsWith('http')) {
                        targetUrl = 'https://script.google.com/macros/s/' + targetUrl + '/exec';
                    }

                    if (targetUrl.startsWith('https://script.google.com/')) {
                        GOOGLE_APPS_SCRIPT_URL = targetUrl;
                        try {
                            localStorage.setItem('majid_gas_url', targetUrl);
                            localStorage.setItem('food_gas_url', targetUrl);
                            localStorage.setItem('dg_gas_url', targetUrl);
                            localStorage.setItem('mangan_gas_url', targetUrl);
                        } catch (e) {}
                        return GOOGLE_APPS_SCRIPT_URL;
                    }
                }
            }

            const localGas = localStorage.getItem('arjugo_kurir_gas_url') || localStorage.getItem('majid_gas_url') || localStorage.getItem('food_gas_url') || localStorage.getItem('dg_gas_url') || localStorage.getItem('mangan_gas_url') || ((window.ARJUGO_CONFIG && window.ARJUGO_CONFIG.GAS_URL) ? window.ARJUGO_CONFIG.GAS_URL.trim() : '');
            if (localGas && localGas.startsWith('https://script.google.com/')) {
                GOOGLE_APPS_SCRIPT_URL = localGas;
                return GOOGLE_APPS_SCRIPT_URL;
            }
        } catch (e) {
            console.warn('[GAS Config] Error saat memproses URL backend Google Apps Script:', e);
        }

        return GOOGLE_APPS_SCRIPT_URL || '';
    }

    function syncOrderToGoogleSheets(order) {
        // Dinonaktifkan: Pesanan saat checkout sengaja tidak disimpan ke database Google Spreadsheet.
        return;
    }

    const DEFAULT_COUPONS = [];

    let PROMO_COUPONS = DEFAULT_COUPONS;
    let APPLIED_COUPON = null; 

    function getPromoCoupons() {
        try {
            const el = document.getElementById('blogger-coupons-widget-data');
            if (el && el.textContent) {
                const rawText = el.textContent.trim();
                if (rawText) {
                    if (rawText.startsWith('[') && rawText.endsWith(']')) {
                        const parsed = JSON.parse(rawText);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            PROMO_COUPONS = parsed.map(item => ({
                                code: (item.code || '').toUpperCase(),
                                type: (item.type || 'FIXED').toUpperCase(),
                                value: Number(item.value || 0),
                                minSpend: Number(item.minSpend || 0),
                                desc: item.desc || ''
                            }));
                            return PROMO_COUPONS;
                        }
                    }
                    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                    const list = [];
                    for (let i = 0; i < lines.length; i++) {
                        const parts = lines[i].split('|').map(p => p.trim());
                        if (parts.length >= 3) {
                            const code = parts[0].toUpperCase();
                            const type = parts[1].toUpperCase();
                            const value = parseFloat(parts[2].replace(/[^\d.]/g, '')) || 0;
                            const minSpend = parts.length > 3 ? (parseInt(parts[3].replace(/[^\d]/g, ''), 10) || 0) : 0;
                            const desc = parts.length > 4 ? parts[4] : '';
                            list.push({ code, type, value, minSpend, desc });
                        }
                    }
                    if (list.length > 0) {
                        PROMO_COUPONS = list;
                        return PROMO_COUPONS;
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget kupon:', e);
        }
        PROMO_COUPONS = DEFAULT_COUPONS;
        return PROMO_COUPONS;
    }

    function syncCouponsFromGAS() {
        const gasUrl = getGoogleAppsScriptUrl();
        if (!gasUrl) return;
        try {
            const sep = gasUrl.includes('?') ? '&' : '?';
            fetch(`${gasUrl}${sep}action=get_coupons`)
                .then(r => r.json())
                .then(res => {
                    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                        const nowStr = new Date().toISOString().slice(0, 10);
                        const activeList = res.data.filter(c => {
                            const isExpired = c.endDate && c.endDate < nowStr;
                            return !isExpired && c.status !== 'Nonaktif';
                        }).map(c => ({
                            code: (c.code || '').toUpperCase(),
                            type: (c.type || 'FIXED').toUpperCase(),
                            value: Number(c.value || 0),
                            minSpend: Number(c.minSpend || 0),
                            desc: c.desc || (c.type === 'PERCENT' ? `Diskon ${c.value}%` : (c.type === 'SHIPPING' ? 'Bebas Ongkir' : `Potongan ${formatRupiah(c.value)}`))
                        }));
                        if (activeList.length > 0) {
                            PROMO_COUPONS = activeList;
                        }
                    }
                })
                .catch(() => {});
        } catch (e) {}
    }

    function calculateCouponDiscount(coupon, subtotal, shippingCost) {
        if (!coupon) return 0;
        if (subtotal < (coupon.minSpend || 0)) return 0;
        if (coupon.type === 'PERCENT') {
            return Math.round((subtotal * coupon.value) / 100);
        } else if (coupon.type === 'FIXED') {
            return Math.min(coupon.value, subtotal);
        } else if (coupon.type === 'SHIPPING') {
            return Math.min(shippingCost || 0, Math.round(((shippingCost || 0) * coupon.value) / 100));
        }
        return 0;
    }

    function applyCouponCode(inputCode, subtotal, shippingCost) {
        const coupons = getPromoCoupons();
        const code = (inputCode || '').trim().toUpperCase();
        if (!code) {
            showToast('Silakan masukkan kode voucher!', '#ef4444');
            return false;
        }
        const found = coupons.find(c => c.code === code);
        if (!found) {
            showToast('Kode voucher "' + code + '" tidak ditemukan!', '#ef4444');
            return false;
        }
        if (subtotal < found.minSpend) {
            showToast('Minimal belanja untuk voucher ' + found.code + ' adalah ' + formatRupiah(found.minSpend), '#ef4444');
            return false;
        }
        const discountAmount = calculateCouponDiscount(found, subtotal, shippingCost);
        APPLIED_COUPON = { ...found, discountAmount };
        showToast('Voucher ' + found.code + ' berhasil digunakan! Diskon ' + formatRupiah(discountAmount), '#10b981');
        return true;
    }

    function removeCouponCode() {
        APPLIED_COUPON = null;
        showToast('Voucher dibatalkan', '#64748b');
    }

    function getStoreStatus() {
        const defaultStatus = { isVacation: false, vacationMsg: '', announcement: '' };
        try {
            const el = document.getElementById('blogger-store-status-widget-data');
            if (el && el.textContent) {
                const lines = el.textContent.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                for (const line of lines) {
                    const parts = line.split('|').map(p => p.trim());
                    if (parts[0].toUpperCase() === 'STATUS_LIBUR') {
                        const statusVal = parts[1] ? parts[1].toLowerCase() : 'false';
                        defaultStatus.isVacation = (statusVal === 'true' || statusVal === '1' || statusVal === 'libur' || statusVal === 'ya');
                        defaultStatus.vacationMsg = parts[2] || 'Toko sedang libur. Pesanan akan segera diproses saat toko kembali beroperasi.';
                    } else if (parts[0].toUpperCase() === 'PENGUMUMAN') {
                        defaultStatus.announcement = parts[1] || '';
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget status toko:', e);
        }
        return defaultStatus;
    }

    function renderStoreStatusBanner() {
        const container = document.getElementById('store-status-banner-container');
        if (!container) return;
        const status = getStoreStatus();
        if (status.isVacation) {
            container.innerHTML = `
                <div class="clay-card p-4 sm:p-5 store-banner-vacation flex items-center gap-3.5 shadow-md">
                    <div class="w-10 h-10 rounded-2xl bg-purple-500/20 dark:bg-purple-500/30 text-purple-600 dark:text-purple-300 flex items-center justify-center flex-shrink-0 text-2xl font-bold">🏖️</div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-extrabold text-orange-950 dark:text-orange-200">Pemberitahuan Toko Sedang Libur</h4>
                        <p class="text-xs text-orange-900/80 dark:text-purple-300/80 mt-0.5 leading-relaxed">${escapeHtml(status.vacationMsg)}</p>
                    </div>
                </div>
            `;
            container.classList.remove('hidden');
        } else if (status.announcement) {
            container.innerHTML = `
                <div class="clay-card p-4 store-banner-info flex items-center gap-3.5 shadow-md">
                    <div class="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center flex-shrink-0 text-xl font-bold">📢</div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-200 leading-snug">${escapeHtml(status.announcement)}</p>
                    </div>
                </div>
            `;
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }

    function isCurrentlyOnHomePage() {
        const staticPageWrap = document.getElementById('blogger-static-page-wrapper');
        const singleProduct = document.getElementById('blogger-single-product');
        const path = window.location.pathname || '';
        const hash = window.location.hash || '';

        if (staticPageWrap || singleProduct || path.includes('/p/') || (path.endsWith('.html') && !path.includes('index.html'))) {
            return false;
        }

        const cleanHash = hash.replace(/^#\/?/, '').split('?')[0].split('/')[0];
        if (cleanHash && cleanHash !== 'home' && cleanHash !== '') {
            return false;
        }

        return true;
    }

    let socialProofTimer = null;
    let currentSocialProofTargetUrl = null;

    function dismissSocialProof(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        const toastEl = document.getElementById('social-proof-toast');
        if (toastEl) {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.classList.add('hidden'), 500);
        }
    }

    function handleSocialProofClick(event) {
        if (event && event.target && event.target.closest('button')) return;
        if (currentSocialProofTargetUrl) {
            window.location.href = currentSocialProofTargetUrl;
        }
    }

