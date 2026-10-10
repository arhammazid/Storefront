    function initSocialProofNotifications() {
        if (socialProofTimer) clearInterval(socialProofTimer);
        if (!isCurrentlyOnHomePage()) return;
        setTimeout(triggerRandomSocialProof, 3500);
        socialProofTimer = setInterval(triggerRandomSocialProof, 24000);
    }

    async function triggerRandomSocialProof() {
        if (!isCurrentlyOnHomePage()) {
            dismissSocialProof();
            return;
        }
        const toastEl = document.getElementById('social-proof-toast');
        if (!toastEl) return;

        let productName = null;
        let productImg = null;
        currentSocialProofTargetUrl = null;

        const domCards = document.querySelectorAll('.blogger-post-card-wrap');
        if (domCards.length > 0) {
            const randomCard = domCards[Math.floor(Math.random() * domCards.length)];
            const t = randomCard.getAttribute('data-post-title');
            const img = randomCard.getAttribute('data-post-img');
            const u = randomCard.getAttribute('data-post-url');
            if (t) productName = t;
            if (img) productImg = img;
            if (u) currentSocialProofTargetUrl = u;
        } else {
            try {
                const prods = await dbGetAll('products');
                if (prods && prods.length > 0) {
                    const randomProd = prods[Math.floor(Math.random() * prods.length)];
                    productName = randomProd.name || randomProd.title || null;
                    if (randomProd.image) productImg = randomProd.image;
                    if (randomProd.url) currentSocialProofTargetUrl = randomProd.url;
                }
            } catch (e) {}
        }

        if (!productName || !productImg) return;

        let buyerName = null;
        let buyerCity = null;
        try {
            const orders = await dbGetAll('orders');
            if (orders && orders.length > 0) {
                const randomOrder = orders[Math.floor(Math.random() * orders.length)];
                if (randomOrder && randomOrder.customer && randomOrder.customer.name) {
                    const parts = randomOrder.customer.name.trim().split(' ');
                    buyerName = parts[0] + (parts.length > 1 ? ' ' + parts[1].charAt(0).toUpperCase() + '.' : '');
                }
                if (randomOrder && randomOrder.shippingDestination) {
                    buyerCity = randomOrder.shippingDestination.split('(')[0].trim();
                }
            }
        } catch (e) {}

        if (!buyerName) return;

        const randomName = buyerName;
        const randomCity = buyerCity || 'Indonesia';
        const randomTime = 'Baru saja';

        const titleEl = document.getElementById('sp-buyer-title');
        const prodEl = document.getElementById('sp-product-name');
        const imgEl = document.getElementById('sp-product-img');
        const metaEl = document.getElementById('sp-time-location');

        if (titleEl) titleEl.textContent = randomName + ' baru saja memesan';
        if (prodEl) prodEl.textContent = productName;
        if (imgEl) imgEl.src = productImg;
        if (metaEl) metaEl.innerHTML = randomTime + ' &#8226; ' + randomCity;

        toastEl.classList.remove('hidden');
        void toastEl.offsetWidth;
        toastEl.classList.add('show');

        setTimeout(() => {
            if (toastEl && toastEl.classList.contains('show')) {
                toastEl.classList.remove('show');
                setTimeout(() => toastEl.classList.add('hidden'), 500);
            }
        }, 6000);
    }

    function directBuyWhatsApp(product) {
        const prod = product || currentBloggerProduct;
        if (!prod) {
            showToast('Data produk belum siap', '#ef4444');
            return;
        }
        const sellerWa = getSellerWhatsAppNumber();
        if (!sellerWa) {
            showToast('Nomor WhatsApp Penjual belum dikonfigurasi!', '#ef4444');
            return;
        }
        const qty = parseInt(document.getElementById('post-detail-qty')?.textContent || '1', 10) || 1;
        const color = currentBloggerSelectedColor || '';
        const size = currentBloggerSelectedSize || '';
        const price = prod.price || 0;
        const total = price * qty;
        const spice = window.__detailSelectedSpice || '';
        const kNotes = document.getElementById('detail-kitchen-notes')?.value.trim() || '';
        const storeLabel = (window.STORE_NAME || 'WarungKu Food & Drink').toUpperCase();
        const divider = '━━━━━━━━━━━━━━━━━━━━';
        const optList = [
            size ? 'Porsi/Ukuran: ' + size : '',
            spice ? 'Level: ' + spice : '',
            color ? 'Varian: ' + color : ''
        ].filter(Boolean).join(', ');
        const optTag = optList ? ` [${optList}]` : '';

        const tempOrderId = 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const lines = [];
        lines.push(`🍔 *PESANAN BARU - ${storeLabel}*`);
        lines.push(divider);
        lines.push('*No. Pesanan:* ' + tempOrderId);
        lines.push('*Tanggal:* ' + formatDate(Date.now()));
        lines.push('');
        lines.push('🍱 *RINCIAN MENU PESANAN:*');
        lines.push(`1. ${prod.name || prod.title}${optTag} (x${qty}) = ${formatRupiah(total)}`);
        if (kNotes) lines.push('   └ Catatan: ' + kNotes);
        lines.push('');
        lines.push('💰 *RINCIAN TAGIHAN:*');
        lines.push('*Subtotal:* ' + formatRupiah(total));
        lines.push(divider);
        lines.push('*TOTAL TAGIHAN: ' + formatRupiah(total) + '*');
        lines.push(divider);
        lines.push('');
        lines.push('Halo Admin, mohon info estimasi ongkir & proses pesanan saya ya. Terima kasih! 🙏');
        const msg = lines.join('\n');
        
        const waUrl = `https://wa.me/${sellerWa}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    }

    function inquireProductWhatsApp(product) {
        const prod = product || currentBloggerProduct;
        if (!prod) {
            showToast('Data produk belum siap', '#ef4444');
            return;
        }
        const sellerWa = getSellerWhatsAppNumber();
        if (!sellerWa) {
            showToast('Nomor WhatsApp Penjual belum dikonfigurasi!', '#ef4444');
            return;
        }
        const color = currentBloggerSelectedColor || '';
        const size = currentBloggerSelectedSize || '';

        const storeName = window.STORE_NAME || 'WarungKu';
        let msg = `Halo CS / Admin ${storeName}, saya ingin bertanya tentang menu:\n\n`;
        msg += `*${prod.name || prod.title}*\n`;
        if (prod.price) msg += `Harga: ${formatRupiah(prod.price)}\n`;
        if (color) msg += `Pilihan Rasa / Level: ${color}\n`;
        if (size) msg += `Porsi / Ukuran: ${size}\n`;
        msg += `Link Menu: ${window.location.href}\n\n`;
        msg += `Apakah menu ini masih tersedia dan bisa diantar sekarang? Terima kasih!`;

        const waUrl = `https://wa.me/${sellerWa}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    }

    let currentActiveMapsPin = null;
    let mapPickerInstance = null;
    let mapPickerMarker = null;
    let tempPickerLocation = null;

    function handleAddressDropdownChange(selectEl, targetTextareaId) {
        const val = selectEl.value;
        if (!val || val === 'Lainnya (Tulis Manual)') return;
        const textarea = document.getElementById(targetTextareaId);
        if (!textarea) return;
        const currentVal = textarea.value.trim();
        if (!currentVal) {
            textarea.value = val + ' - ';
            textarea.focus();
        } else if (!currentVal.includes(val)) {
            textarea.value = val + ', ' + currentVal;
        }
    }

    function appendQuickKitchenNote(val, targetTextareaId = 'co-note') {
        const textarea = document.getElementById(targetTextareaId);
        if (!textarea) return;
        const currentVal = textarea.value.trim();
        if (!currentVal) {
            textarea.value = val;
        } else if (!currentVal.includes(val)) {
            textarea.value = currentVal + ', ' + val;
        }
        textarea.focus();
    }

    function detectGPSLocation(targetTextareaId, ev) {
        if (ev) {
            try {
                ev.preventDefault();
                ev.stopPropagation();
            } catch (e) {}
        }
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
        const initialScrollY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;

        if (!navigator.geolocation) {
            showToast('Browser Anda tidak mendukung geolokasi GPS', '#ef4444');
            return;
        }
        showToast('Mencari titik lokasi GPS...', '#8814f5');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const mapsUrl = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
                let addressText = '';
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                    if (res.ok) {
                        const data = await res.json();
                        addressText = data.display_name || '';
                    }
                } catch (err) {
                    console.warn('Reverse geocode error:', err);
                }
                applyMapsPin(targetTextareaId, lat, lng, mapsUrl, addressText);
                showToast('Lokasi GPS berhasil terdeteksi!', '#10b981');
                requestAnimationFrame(() => {
                    window.scrollTo({ top: initialScrollY, behavior: 'instant' });
                });
            },
            (err) => {
                console.warn('GPS error:', err);
                showToast('Gagal mendeteksi GPS. Pastikan izin lokasi aktif.', '#ef4444');
                requestAnimationFrame(() => {
                    window.scrollTo({ top: initialScrollY, behavior: 'instant' });
                });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    function updateHeaderDeliveryAddress(address, lat, lng) {
        if (!address && !lat) return;
        const display = address || (lat ? `Titik Lokasi (${lat.toFixed(4)}, ${lng.toFixed(4)})` : 'Lokasi Terpilih');
        
        const headerMobile = document.getElementById('header-selected-address-text');
        if (headerMobile) headerMobile.textContent = display;

        const headerDesktop = document.getElementById('header-desktop-address-text');
        if (headerDesktop) headerDesktop.textContent = display;

        if (lat && lng) {
            const d = calculateHaversineKm(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, lat, lng);
            const fee = calculateFastFoodShippingFee(d);
            window.__currentCustomerDistanceKm = d;
            window.__checkoutShippingFee = fee;

            const distBadge = document.getElementById('header-delivery-distance-badge');
            if (distBadge) {
                distBadge.textContent = `${d} km`;
                distBadge.title = `Jarak dari Resto: ${d} km (Ongkir: ${fee === 0 ? 'Gratis' : formatRupiah(fee)})`;
            }
            updateProductCardsDistance(lat, lng);
        }
    }

    function applyMapsPin(targetTextareaId, lat, lng, mapsUrl, addressText) {
        currentActiveMapsPin = { lat, lng, url: mapsUrl, displayAddress: addressText };
        try {
            localStorage.setItem('dg_customer_location', JSON.stringify(currentActiveMapsPin));
        } catch (e) {}

        try {
            if (typeof dbGet === 'function' && typeof dbPut === 'function') {
                dbGet('profile', 'me').then(prof => {
                    const p = prof || { id: 'me' };
                    if (addressText && (!p.address || targetTextareaId === 'pf-address' || !targetTextareaId)) {
                        p.address = addressText;
                    }
                    if (mapsUrl) p.mapsUrl = mapsUrl;
                    p.coords = { lat, lng };
                    dbPut('profile', p);
                }).catch(() => {});
            }
        } catch (e) {}

        const textarea = document.getElementById(targetTextareaId);
        if (textarea && addressText && !textarea.value.trim()) {
            textarea.value = addressText;
        }
        const pinDisplay = document.getElementById(targetTextareaId === 'co-address' ? 'co-maps-pin-display' : 'pf-maps-pin-display');
        const pinText = document.getElementById(targetTextareaId === 'co-address' ? 'co-maps-pin-text' : 'pf-maps-pin-text');
        
        const distKm = calculateHaversineKm(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, lat, lng);
        const fastFoodFee = calculateFastFoodShippingFee(distKm);
        window.__currentCustomerDistanceKm = distKm;
        window.__checkoutShippingFee = fastFoodFee;

        updateHeaderDeliveryAddress(addressText, lat, lng);

        if (pinDisplay && pinText) {
            pinText.innerHTML = `<a href="${mapsUrl}" target="_blank" class="underline font-bold">Titik Google Maps: ${lat.toFixed(5)}, ${lng.toFixed(5)}</a> <span class="text-majidfood-red font-bold">(${distKm} km dari resto)</span>${addressText ? ' - ' + escapeHtml(addressText.substring(0, 30)) + '...' : ''}`;
            pinDisplay.classList.remove('hidden');
        }

        if (typeof updateCheckoutShipping === 'function') {
            updateCheckoutShipping();
        }
    }

    function updateProductCardsDistance(customerLat, customerLng) {
        if (!customerLat || !customerLng) return;
        document.querySelectorAll('#blogger-posts-grid .post-card-item').forEach(card => {
            const distEl = card.querySelector('.post-card-distance');
            if (!distEl) return;
            const pLat = parseFloat(card.getAttribute('data-prod-lat')) || RESTAURANT_COORDS.lat;
            const pLng = parseFloat(card.getAttribute('data-prod-lng')) || RESTAURANT_COORDS.lng;
            const d = calculateHaversineKm(pLat, pLng, customerLat, customerLng);
            const estMin = Math.round(15 + d * 3);
            distEl.textContent = `${d} km`;
            distEl.title = `Jarak: ${d} km • Estimasi Antar: ${estMin} menit`;
        });
    }

    async function restoreSavedCustomerLocation() {
        try {
            let savedPin = null;
            const raw = localStorage.getItem('dg_customer_location');
            if (raw) {
                try { savedPin = JSON.parse(raw); } catch (e) {}
            }

            let profile = null;
            try {
                if (typeof dbGet === 'function') {
                    profile = await dbGet('profile', 'me');
                }
            } catch (e) {}

            const activeAddr = (savedPin && savedPin.displayAddress) || (profile && profile.address) || '';
            const lat = (savedPin && savedPin.lat) ? savedPin.lat : ((profile && profile.coords && profile.coords.lat) ? profile.coords.lat : null);
            const lng = (savedPin && savedPin.lng) ? savedPin.lng : ((profile && profile.coords && profile.coords.lng) ? profile.coords.lng : null);
            const mapsUrl = (savedPin && savedPin.url) || (profile && profile.mapsUrl) || '';

            if (lat && lng) {
                currentActiveMapsPin = { lat, lng, url: mapsUrl, displayAddress: activeAddr };
                const d = calculateHaversineKm(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, lat, lng);
                const fee = calculateFastFoodShippingFee(d);
                window.__currentCustomerDistanceKm = d;
                window.__checkoutShippingFee = fee;
                updateHeaderDeliveryAddress(activeAddr, lat, lng);
            } else if (activeAddr) {
                currentActiveMapsPin = { lat: RESTAURANT_COORDS.lat, lng: RESTAURANT_COORDS.lng, url: mapsUrl, displayAddress: activeAddr };
                updateHeaderDeliveryAddress(activeAddr, null, null);
            }
        } catch (e) {}
    }

    async function clearMapsPin(targetTextareaId) {
        currentActiveMapsPin = null;
        try { localStorage.removeItem('dg_customer_location'); } catch (e) {}
        try {
            if (typeof dbGet === 'function' && typeof dbPut === 'function') {
                const prof = await dbGet('profile', 'me');
                if (prof) {
                    prof.mapsUrl = '';
                    prof.coords = null;
                    await dbPut('profile', prof);
                }
            }
        } catch (e) {}
        const pinDisplay = document.getElementById(targetTextareaId === 'co-address' ? 'co-maps-pin-display' : 'pf-maps-pin-display');
        if (pinDisplay) pinDisplay.classList.add('hidden');
        showToast('Titik lokasi maps dihapus', '#64748b');
        if (typeof updateCheckoutShipping === 'function') {
            updateCheckoutShipping();
        }
    }

