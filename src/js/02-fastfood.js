    function openFastFoodDetailModal(itemId) {
        const all = (window.__allProducts && Array.isArray(window.__allProducts)) ? window.__allProducts : [];
        const p = all.find(item => item && (item.id === itemId || String(item.id) === String(itemId))) || window.currentBloggerProduct;
        if (!p) return;
        currentModalProduct = p;

        const cfg = getFastFoodModalConfig();
        const initialPortion = cfg.portions[0] || { name: 'Reguler', price: 0 };
        currentSelectedPortion = initialPortion.name;
        currentSelectedPortionPrice = initialPortion.price;
        const initialSpice = cfg.spices[0] || 'Level 1 (Sedang)';
        currentSelectedSpice = initialSpice;

        const dynRatingInfo = (typeof getProductDynamicRating === 'function') 
            ? getProductDynamicRating(p.id, p.rating) 
            : { rating: p.rating || null, count: 0, hasRating: !!(p.rating && Number(p.rating) > 0) };
        const rating = dynRatingInfo.hasRating ? dynRatingInfo.rating : null;
        const distance = p.distance || '1.0 km';
        const sold = Number(p.sold) || 0;
        const isSoldOut = (p.stock === 0 || p.isOutOfStock);
        const opStatus = getRestaurantOperatingStatus();

        const portionCols = Math.min(cfg.portions.length, 2);
        const spiceCols = Math.min(cfg.spices.length, 4);

        const modalHtml = `
        <div class="space-y-3.5 max-h-[85vh] overflow-y-auto custom-scroll pr-1 pb-2">
            <div class="flex justify-between items-start">
                <span class="${isSoldOut ? 'bg-rose-100 text-rose-600' : 'bg-majidfood-light text-majidfood-red'} text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    ${isSoldOut ? 'HABIS / SOLD OUT' : (p.badge || 'Pilihan Favorit')}
                </span>
                <button type="button" onclick="closeModal()" class="neu-flat w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div class="w-full aspect-[16/10] rounded-2xl overflow-hidden neu-pressed relative">
                <img src="${p.image}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-60' : ''}" />
                ${isSoldOut ? `
                    <div class="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span class="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">Stok Menu Habis</span>
                    </div>
                ` : ''}
                ${(rating || sold > 0) ? `
                    <div class="absolute bottom-2 right-2 glass-card text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
                        ${rating ? `<svg class="w-3 h-3 text-yellow-400 svg-solid" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span>${rating}${dynRatingInfo.count > 1 ? ` (${dynRatingInfo.count})` : ''}</span>` : ''}
                        ${rating && sold > 0 ? `<span class="opacity-70">•</span>` : ''}
                        ${sold > 0 ? `<span>${sold} terjual</span>` : ''}
                    </div>
                ` : `
                    <div class="absolute bottom-2 right-2 glass-card text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
                        <svg class="w-3 h-3 text-yellow-400 svg-solid" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        <span>Menu Baru</span>
                    </div>
                `}
            </div>

            ${!opStatus.isOpen ? `
                <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-2">
                    <span class="text-sm">&#9200;</span>
                    <span>Resto saat ini tutup (Buka: ${escapeHtml(opStatus.openHourStr)} - ${escapeHtml(opStatus.closeHourStr)} WIB). Pesanan diproses sebagai pre-order.</span>
                </div>
            ` : ''}

            <div>
                <div class="flex items-start justify-between gap-2">
                    <h2 class="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug">${escapeHtml(p.name)}</h2>
                    <span class="text-base sm:text-lg font-black text-majidfood-red flex-shrink-0" id="modal-calc-total-price">${formatRupiah(p.price)}</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">${escapeHtml(p.description || 'Menu cepat saji lezat dan praktis, disajikan hangat dengan bahan berkualitas.')}</p>
            </div>

            <div class="neu-flat p-2.5 rounded-xl flex items-center justify-between text-xs">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-sm">
                        <i class="fa-solid fa-kitchen-set"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="text-[10px] text-gray-400 font-semibold leading-none mb-0.5">Dapur Pengolah:</div>
                        <div class="font-extrabold text-gray-800 dark:text-white text-xs truncate">${escapeHtml(p.kitchenName || p.branchName || 'Dapur Resto Pusat')}</div>
                        ${(p.kitchenAddress) ? `<div class="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">${escapeHtml(p.kitchenAddress)}</div>` : ''}
                    </div>
                </div>
                <div class="text-right flex-shrink-0 ml-2">
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60" title="Jarak dari dapur ini ke alamat Anda">
                        <i class="fa-solid fa-location-dot text-[9px] text-amber-600"></i> ${escapeHtml(distance)}
                    </span>
                </div>
            </div>

            <div class="neu-flat p-2.5 rounded-xl flex items-center justify-between text-xs bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                        <i class="fa-solid fa-comments"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="font-extrabold text-slate-800 dark:text-white text-xs truncate">Ulasan &amp; Komentar Pembeli</div>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">Komentar &amp; review langsung di postingan Blogger</div>
                    </div>
                </div>
                <a href="${p.url || '/'}" class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex-shrink-0 flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95">
                    <span>Lihat Ulasan</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </a>
            </div>

            <div class="neu-flat p-3 rounded-xl space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-700 dark:text-gray-300">Pilihan Porsi:</span>
                    <span id="modal-selected-portion-label" class="text-xs font-black text-majidfood-red">${escapeHtml(currentSelectedPortion)}</span>
                </div>
                <div class="grid grid-cols-${portionCols} gap-2" id="modal-portion-options">
                    ${cfg.portions.map((po, idx) => `
                        <button type="button" onclick="selectModalPortion('${escapeHtml(po.name)}', ${po.price}, ${idx})" class="modal-portion-btn py-2 px-3 rounded-xl text-xs font-bold ${idx === 0 ? 'bg-majidfood-red text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'} flex justify-between items-center transition-all">
                            <span>${escapeHtml(po.name)}</span>
                            <span class="text-[10px] font-normal ${po.price > 0 ? (idx === 0 ? 'text-white' : 'text-majidfood-red font-bold') : ''}">+${formatRupiah(po.price)}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="neu-flat p-3 rounded-xl space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-700 dark:text-gray-300">Level Pedas:</span>
                    <span id="modal-selected-spice-label" class="text-xs font-black text-majidfood-red">${escapeHtml(currentSelectedSpice)}</span>
                </div>
                <div class="grid grid-cols-${spiceCols} gap-1.5" id="modal-spice-options">
                    ${cfg.spices.map((sp, idx) => `
                        <button type="button" id="spice-btn-${idx}" onclick="selectModalSpice(${idx}, '${escapeHtml(sp)}')" class="modal-spice-btn py-1.5 px-2 rounded-lg text-[10px] font-bold ${idx === 0 ? 'bg-majidfood-red text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'} transition-colors">${escapeHtml(sp.split(' ')[0] || sp)}</button>
                    `).join('')}
                </div>
            </div>

            <div class="neu-flat p-3 rounded-xl space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-700 dark:text-gray-300">Topping &amp; Tambahan:</span>
                    <span class="text-[10px] text-gray-400">Pilih ekstra favorit</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    ${cfg.toppings.map(tp => `
                        <label class="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-majidfood-red transition-colors">
                            <input type="checkbox" class="modal-topping-cb rounded text-majidfood-red focus:ring-0" value="${escapeHtml(tp.name)}" data-price="${tp.price}" onchange="updateFastFoodModalPrice()" />
                            <div class="flex flex-col min-w-0">
                                <span class="font-bold text-[11px] text-gray-800 dark:text-white truncate">${escapeHtml(tp.name)}</span>
                                <span class="text-[10px] text-majidfood-red font-bold">+${formatRupiah(tp.price)}</span>
                            </div>
                        </label>
                    `).join('')}
                </div>
            </div>

            <div class="neu-flat p-3 rounded-xl space-y-1.5">
                <label class="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span>Paket Minuman Kombo:</span>
                    <span class="text-[10px] text-gray-400 font-normal">Opsional</span>
                </label>
                <select id="modal-food-drink" onchange="updateFastFoodModalPrice()" class="w-full px-3 py-2 text-xs rounded-xl neu-pressed bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none">
                    ${cfg.drinks.map(dr => `
                        <option value="${escapeHtml(dr.name)}" data-price="${dr.price}">${escapeHtml(dr.name)} (+${formatRupiah(dr.price)})</option>
                    `).join('')}
                </select>
            </div>

            <div class="neu-flat p-3 rounded-xl space-y-1.5">
                <label class="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span>Catatan Khusus Resto / Dapur</span>
                    <span class="text-[10px] text-gray-400 font-normal">Pilih opsi cepat atau ketik</span>
                </label>
                <div class="flex flex-wrap gap-1.5 pt-0.5 pb-1">
                    <button type="button" onclick="appendCookingNote('Sambal Dipisah')" class="text-[10px] px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-purple-300 font-semibold border border-purple-200 dark:border-orange-800 transition-colors">+ 🌶️ Sambal Dipisah</button>
                    <button type="button" onclick="appendCookingNote('Tanpa Bawang')" class="text-[10px] px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-purple-300 font-semibold border border-purple-200 dark:border-orange-800 transition-colors">+ 🌿 Tanpa Bawang</button>
                    <button type="button" onclick="appendCookingNote('Tanpa MSG')" class="text-[10px] px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-purple-300 font-semibold border border-purple-200 dark:border-orange-800 transition-colors">+ 🌱 Tanpa MSG</button>
                    <button type="button" onclick="appendCookingNote('Tanpa Sendok Plastik')" class="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors">+ 🥢 Tanpa Sendok Plastik</button>
                    <button type="button" onclick="appendCookingNote('Kuah Dipisah')" class="text-[10px] px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-purple-300 font-semibold border border-purple-200 dark:border-orange-800 transition-colors">+ Kuah Dipisah</button>
                </div>
                <input type="text" id="modal-food-note" placeholder="Contoh: Saus dipisah, jangan pakai daun bawang..." class="neu-pressed w-full px-3 py-2 rounded-xl text-xs text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none" />
            </div>

            <div class="flex items-center justify-between gap-3 pt-2">
                <div class="flex items-center neu-flat rounded-full p-1">
                    <button type="button" onclick="const q = document.getElementById('modal-food-qty'); if(q.value > 1) { q.value--; updateFastFoodModalPrice(); }" class="w-7 h-7 rounded-full neu-pressed flex items-center justify-center font-bold text-gray-700 dark:text-white">-</button>
                    <input type="number" id="modal-food-qty" value="1" min="1" max="99" class="w-10 text-center font-bold text-xs bg-transparent border-none focus:outline-none" readonly />
                    <button type="button" onclick="const q = document.getElementById('modal-food-qty'); q.value++; updateFastFoodModalPrice();" class="w-7 h-7 rounded-full neu-pressed flex items-center justify-center font-bold text-gray-700 dark:text-white">+</button>
                </div>
                <div class="flex-1 flex gap-2">
                    ${isSoldOut ? `
                        <button type="button" disabled class="w-full py-2.5 px-3 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-400 font-bold text-xs cursor-not-allowed text-center">
                            Menu Sedang Habis
                        </button>
                    ` : `
                        <button type="button" onclick="handleFastFoodAddToCart('${p.id}')" class="flex-1 py-2.5 px-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-xs font-bold transition-all text-center">
                            + Keranjang
                        </button>
                        <button type="button" onclick="handleFastFoodWhatsAppOrder('${p.id}')" class="flex-1 py-2.5 px-3 rounded-full bg-majidfood-red hover:bg-red-600 text-white text-xs font-bold transition-all shadow-md text-center flex items-center justify-center gap-1">
                            <span id="modal-btn-order-text">Pesan Sekarang</span>
                        </button>
                    `}
                </div>
            </div>
        </div>
        `;
        openModal(modalHtml);
        setTimeout(updateFastFoodModalPrice, 50);
    }

    function appendCookingNote(noteText) {
        const input = document.getElementById('modal-food-note');
        if (!input) return;
        const cur = input.value.trim();
        if (!cur) {
            input.value = noteText;
        } else if (!cur.toLowerCase().includes(noteText.toLowerCase())) {
            input.value = cur + ', ' + noteText;
        }
        input.focus();
    }

    function handleFastFoodAddToCart(itemId) {
        const all = (window.__allProducts && Array.isArray(window.__allProducts)) ? window.__allProducts : [];
        const p = all.find(item => item && (item.id === itemId || String(item.id) === String(itemId))) || currentModalProduct || window.currentBloggerProduct;
        if (!p) {
            showToast('Produk tidak ditemukan', '#ef4444');
            return;
        }
        if (p.stock === 0 || p.isOutOfStock) {
            showToast('Maaf, menu ini sedang habis (Sold Out)', '#ef4444');
            return;
        }

        const qty = parseInt(document.getElementById('modal-food-qty')?.value || '1', 10);
        const note = document.getElementById('modal-food-note')?.value || '';

        const checkedToppings = Array.from(document.querySelectorAll('.modal-topping-cb:checked')).map(cb => cb.value);
        const drink = document.getElementById('modal-food-drink')?.value || '';

        let toppingsExtra = 0;
        document.querySelectorAll('.modal-topping-cb:checked').forEach(cb => toppingsExtra += Number(cb.getAttribute('data-price')) || 0);
        let drinkExtra = 0;
        const drinkSelect = document.getElementById('modal-food-drink');
        if (drinkSelect && drinkSelect.selectedIndex >= 0) {
            drinkExtra = Number(drinkSelect.options[drinkSelect.selectedIndex].getAttribute('data-price')) || 0;
        }

        const unitPrice = p.price + currentSelectedPortionPrice + toppingsExtra + drinkExtra;

        addToCart(p.id, qty, {
            size: currentSelectedPortion,
            spiceLevel: currentSelectedSpice,
            toppings: checkedToppings,
            drink: drink,
            note: note,
            customPrice: unitPrice
        });

        playOrderChimeSound();
        closeModal();
        showToast(`${p.name} (${currentSelectedPortion}) ditambahkan ke keranjang!`, '#789185');
    }

    function handleFastFoodWhatsAppOrder(itemId) {
        const all = (window.__allProducts && Array.isArray(window.__allProducts)) ? window.__allProducts : [];
        const p = all.find(item => item && (item.id === itemId || String(item.id) === String(itemId))) || currentModalProduct || window.currentBloggerProduct;
        if (!p) {
            showToast('Produk tidak ditemukan', '#ef4444');
            return;
        }
        if (p.stock === 0 || p.isOutOfStock) {
            showToast('Maaf, menu ini sedang habis (Sold Out)', '#ef4444');
            return;
        }

        const qty = parseInt(document.getElementById('modal-food-qty')?.value || '1', 10);
        const note = document.getElementById('modal-food-note')?.value || '-';
        const checkedToppings = Array.from(document.querySelectorAll('.modal-topping-cb:checked')).map(cb => cb.value);
        const drink = document.getElementById('modal-food-drink')?.value || '-';

        let toppingsExtra = 0;
        document.querySelectorAll('.modal-topping-cb:checked').forEach(cb => toppingsExtra += Number(cb.getAttribute('data-price')) || 0);
        let drinkExtra = 0;
        const drinkSelect = document.getElementById('modal-food-drink');
        if (drinkSelect && drinkSelect.selectedIndex >= 0) {
            drinkExtra = Number(drinkSelect.options[drinkSelect.selectedIndex].getAttribute('data-price')) || 0;
        }

        const unitPrice = p.price + currentSelectedPortionPrice + toppingsExtra + drinkExtra;
        const total = unitPrice * qty;

        const opStatus = getRestaurantOperatingStatus();
        const storeLabel = (window.STORE_NAME || 'Resto Food').toUpperCase();
        const headerText = opStatus.isOpen ? `PESANAN CEPAT SAJI - ${storeLabel}` : `PRE-ORDER CEPAT SAJI - ${storeLabel} (TUTUP)`;
        const divider = '━━━━━━━━━━━━━━━━━━━━';

        const optList = [
            currentSelectedPortion ? 'Porsi: ' + currentSelectedPortion : '',
            currentSelectedSpice ? 'Level: ' + currentSelectedSpice : '',
            (checkedToppings && checkedToppings.length > 0) ? 'Topping: ' + checkedToppings.join(', ') : '',
            drink ? 'Minuman: ' + drink : ''
        ].filter(Boolean).join(', ');
        const optTag = optList ? ` [${optList}]` : '';

        const tempOrderId = 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const lines = [];
        lines.push(`🍔 *${headerText}*`);
        lines.push(divider);
        lines.push('*No. Pesanan:* ' + tempOrderId);
        lines.push('*Tanggal:* ' + formatDate(Date.now()));
        lines.push('');
        lines.push('🍱 *RINCIAN MENU PESANAN:*');
        lines.push(`1. ${p.name}${optTag} (x${qty}) = ${formatRupiah(total)}`);
        if (note) lines.push('   └ Catatan: ' + note);
        if (p.kitchenName || p.branchName) lines.push('   └ Dapur Pengolah: ' + (p.kitchenName || p.branchName));
        lines.push('');
        lines.push('💰 *RINCIAN TAGIHAN:*');
        lines.push('*Subtotal:* ' + formatRupiah(total));
        lines.push(divider);
        lines.push('*TOTAL TAGIHAN: ' + formatRupiah(total) + '*');
        lines.push(divider);
        lines.push('');
        lines.push('Halo Admin, mohon info ongkos kirim & proses pesanan saya. Terima kasih! 🙏');
        const msg = lines.join('\n');

        playOrderChimeSound();
        const waUrl = `https://wa.me/${SELLER_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
        closeModal();
    }

    function isQrisPayment(method) {
        if (!method) return false;
        return method.toLowerCase().includes('qris');
    }

    function isEWalletPayment(method) {
        if (!method) return false;
        const m = method.toLowerCase();
        return m.includes('wallet') || m.includes('dana') || m.includes('gopay') || m.includes('ovo') || m.includes('shopee') || m.includes('linkaja');
    }

    function isCodPayment(method) {
        if (!method) return false;
        const m = method.toLowerCase();
        return m.includes('cod') || m.includes('bayar di tempat') || m.includes('tunai');
    }

    function getEWalletDisplayInfo(paymentMethodName) {
        const list = (typeof getPaymentMethods === 'function') ? getPaymentMethods() : (typeof PAYMENT_METHODS !== 'undefined' ? PAYMENT_METHODS : []);
        const found = list.find(pm => (pm.name || '').toLowerCase() === (paymentMethodName || '').toLowerCase())
                   || list.find(pm => isEWalletPayment(pm.name));
        
        let rawDesc = (found && found.desc) ? found.desc.trim() : '';
        let accountName = 'Admin Resto';
        let displayNumber = '';

        if (rawDesc) {
            const nameMatch = rawDesc.match(/\(a\.n\s+([^)]+)\)/i) || rawDesc.match(/a\.n\s+([^\n,|]+)/i);
            if (nameMatch) {
                accountName = nameMatch[1].trim();
            }
            const match = rawDesc.match(/(?:\+?62|0)[0-9\-\s]{7,}/);
            if (match) {
                displayNumber = match[0].trim();
            }
        }

        if (!displayNumber) {
            const sellerWa = (typeof getSellerWhatsAppNumber === 'function') ? getSellerWhatsAppNumber() : '';
            if (sellerWa) {
                let clean = sellerWa.replace(/[^0-9]/g, '');
                if (clean.startsWith('62')) clean = '0' + clean.slice(2);
                displayNumber = clean;
            } else {
                displayNumber = '0812-3456-7890';
            }
        }

        const cleanNumber = displayNumber.replace(/[^0-9]/g, '') || displayNumber;
        return {
            number: displayNumber,
            cleanNumber: cleanNumber,
            accountName: accountName
        };
    }

    function renderCheckoutPaymentModalHtml(order) {
        const method = (order.paymentMethod || '').trim();
        const totalFormatted = formatRupiah(order.total);
        let badgeText = 'PEMBAYARAN';
        let badgeBg = 'bg-purple-600';
        let modalTitle = 'Konfirmasi Pembayaran';
        let totalLabel = 'Total Tagihan Pembayaran:';
        let showCopyNominal = true;
        let bodyContent = '';
        let btnText = 'Kirim ke WhatsApp &amp; Selesaikan Pesanan';
        let btnHint = 'Pesanan akan otomatis dibuat dan diteruskan ke WhatsApp penjual.';

        if (isQrisPayment(method)) {
            badgeText = 'QRIS PAS';
            badgeBg = 'bg-majidfood-red';
            modalTitle = 'Pembayaran QRIS Instan';
            totalLabel = 'Total Tagihan QRIS:';
            btnText = 'Saya Sudah Bayar / Kirim ke WhatsApp';
            btnHint = 'Setelah scan &amp; bayar, kirimkan rincian pesanan dan bukti bayar via WhatsApp.';

            const qrisImg = localStorage.getItem('dg_qris_image') || localStorage.getItem('qris_image_url') || 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&amp;data=00020101021126580016ID.CO.SHOPEE.WWW01189360091800000000005204549953033605802ID5914YUKFOOD%20STORE6007JAKARTA61051011062070703A016304';

            bodyContent = `
            <div class="neu-flat p-4 rounded-2xl flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div class="font-bold text-xs text-gray-800 dark:text-white mb-2 tracking-wide uppercase">Scan QRIS BCA / Mandiri / BRI / GoPay / OVO / Dana / ShopeePay</div>
                <div class="w-48 h-48 bg-white p-2 rounded-xl shadow-inner border border-gray-200 flex items-center justify-center">
                    <img src="${qrisImg}" alt="QRIS Barcode" class="w-full h-full object-contain" />
                </div>
                <p class="text-[10px] text-gray-400 mt-2 font-mono">NMID: ID1020000000001 &#8226; OFFICIAL MERCHANT QRIS</p>
                <div class="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 text-left w-full space-y-1">
                    <div class="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200"><i class="fa-solid fa-circle-info text-purple-600"></i> Petunjuk Pembayaran:</div>
                    <p class="text-[10px] leading-relaxed">1. Buka aplikasi m-Banking atau E-Wallet apa saja.<br/>2. Scan barcode QRIS di atas &amp; bayar dengan nominal pas.<br/>3. Klik tombol WhatsApp di bawah untuk kirim bukti transfer.</p>
                </div>
            </div>`;
        } else if (isEWalletPayment(method)) {
            badgeText = 'TRANSFER E-WALLET';
            badgeBg = 'bg-blue-600';
            modalTitle = 'Pembayaran E-Wallet';
            totalLabel = 'Total Transfer Pas:';
            btnText = 'Saya Sudah Transfer / Kirim ke WhatsApp';
            btnHint = 'Kirimkan rincian pesanan beserta bukti transfer Anda langsung via WhatsApp.';

            const ew = getEWalletDisplayInfo(method);

            bodyContent = `
            <div class="neu-flat p-4 rounded-2xl flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-1.5 mb-2.5 flex-wrap justify-center">
                    <span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-black">Dana</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black">GoPay</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-black">OVO</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 text-[10px] font-black">ShopeePay</span>
                </div>
                <div class="w-full p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nomor Akun / HP E-Wallet:</span>
                    <div class="font-mono text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 tracking-wider select-all my-1">${escapeHtml(ew.number)}</div>
                    <span class="text-xs text-slate-600 dark:text-slate-300 font-semibold block mb-2">a.n ${escapeHtml(ew.accountName)}</span>
                    <button type="button" onclick="navigator.clipboard.writeText('${escapeHtml(ew.cleanNumber)}'); showToast('Nomor E-Wallet disalin: ${escapeHtml(ew.cleanNumber)}', '#10b981');" class="clay-btn px-4 py-2 text-xs font-black text-slate-700 dark:text-slate-200 hover:text-purple-600 inline-flex items-center gap-1.5 transition-all shadow-sm">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        <span>Salin Nomor E-Wallet</span>
                    </button>
                </div>
                <div class="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 text-left w-full space-y-1">
                    <div class="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200"><i class="fa-solid fa-circle-info text-blue-600"></i> Petunjuk Transfer:</div>
                    <p class="text-[10px] leading-relaxed">1. Salin nomor di atas &amp; buka aplikasi dompet digital Anda.<br/>2. Transfer sebesar total tagihan pas.<br/>3. Klik tombol WhatsApp di bawah untuk konfirmasi &amp; kirim bukti transfer.</p>
                </div>
            </div>`;
        } else if (isCodPayment(method)) {
            badgeText = 'BAYAR DI TEMPAT';
            badgeBg = 'bg-amber-600';
            modalTitle = 'Konfirmasi Pesanan COD';
            totalLabel = 'Total Bayar Tunai (COD):';
            showCopyNominal = false;
            btnText = 'Kirim ke WhatsApp &amp; Konfirmasi Pesanan';
            btnHint = 'Pesanan akan langsung diteruskan ke WhatsApp admin agar segera dimasak &amp; diantar kurir.';

            const custAddress = (order.customer && order.customer.address) || '-';
            const custName = (order.customer && order.customer.name) || 'Pelanggan';
            const custPhone = (order.customer && order.customer.phone) || '-';
            const timingText = order.deliveryTiming || 'Kirim Sekarang (Instan)';

            bodyContent = `
            <div class="neu-flat p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left space-y-3">
                <div class="font-bold text-xs text-gray-800 dark:text-white uppercase tracking-wide text-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    🛵 Rincian Pengantaran Pesanan COD
                </div>
                <div class="space-y-2 text-xs">
                    <div class="flex items-start gap-2.5">
                        <span class="text-sm flex-shrink-0 mt-0.5">📍</span>
                        <div class="min-w-0">
                            <span class="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">Alamat Pengantaran:</span>
                            <span class="text-slate-600 dark:text-slate-400 leading-relaxed">${escapeHtml(custAddress)}</span>
                        </div>
                    </div>
                    <div class="flex items-start gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span class="text-sm flex-shrink-0 mt-0.5">👤</span>
                        <div class="min-w-0">
                            <span class="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">Penerima &amp; WhatsApp:</span>
                            <span class="text-slate-600 dark:text-slate-400">${escapeHtml(custName)} (${escapeHtml(custPhone)})</span>
                        </div>
                    </div>
                    <div class="flex items-start gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span class="text-sm flex-shrink-0 mt-0.5">⏱️</span>
                        <div class="min-w-0">
                            <span class="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">Waktu Pengantaran:</span>
                            <span class="text-slate-600 dark:text-slate-400">${escapeHtml(timingText)}</span>
                        </div>
                    </div>
                </div>
                <div class="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-start gap-2">
                    <span class="text-base flex-shrink-0">💵</span>
                    <div>
                        <div>Harap siapkan uang pas tunai sebesar <b>${totalFormatted}</b> saat kurir tiba.</div>
                        <div class="text-[10px] text-amber-700 dark:text-amber-400 font-normal mt-0.5">Pastikan nomor WhatsApp Anda aktif agar kurir mudah berkoordinasi saat di jalan.</div>
                    </div>
                </div>
            </div>`;
        } else {
            badgeText = 'METODE PEMBAYARAN';
            badgeBg = 'bg-slate-700';
            modalTitle = `Pembayaran ${escapeHtml(method)}`;
            totalLabel = 'Total Tagihan:';
            btnText = 'Kirim ke WhatsApp &amp; Selesaikan Pesanan';
            btnHint = 'Pesanan akan otomatis dibuat dan diteruskan ke WhatsApp penjual.';

            bodyContent = `
            <div class="neu-flat p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center space-y-2">
                <div class="font-bold text-xs text-gray-800 dark:text-white uppercase tracking-wide">
                    Instruksi Pembayaran ${escapeHtml(method)}
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Silakan konfirmasi pesanan Anda ke WhatsApp admin untuk langkah pembayaran lebih lanjut.</p>
            </div>`;
        }

        return `
        <div class="space-y-4 text-center">
            <div class="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black ${badgeBg} text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">${badgeText}</span>
                    <span class="text-xs font-bold text-gray-800 dark:text-white">${modalTitle}</span>
                </div>
                <button type="button" onclick="closeModal()" class="w-7 h-7 rounded-full neu-flat flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    ✕
                </button>
            </div>

            <div class="neu-pressed p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <span class="text-[11px] text-gray-500 dark:text-gray-400 font-semibold block">${totalLabel}</span>
                <div class="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight my-1">${totalFormatted}</div>
                ${showCopyNominal ? `
                <button type="button" onclick="navigator.clipboard.writeText('${order.total}'); showToast('Nominal Rp ${order.total} berhasil disalin!', '#10b981');" class="text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:text-purple-600 underline flex items-center justify-center gap-1 mx-auto transition-colors">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span>Salin Nominal Pas</span>
                </button>
                ` : ''}
            </div>

            ${bodyContent}

            <div class="space-y-2 pt-1">
                <button type="button" id="btn-modal-send-wa" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                    <i class="fa-brands fa-whatsapp text-lg"></i>
                    <span>${btnText}</span>
                </button>
                <p class="text-[10px] text-gray-400">${btnHint}</p>
                <button type="button" onclick="closeModal()" class="w-full py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    Kembali / Ubah Pesanan
                </button>
            </div>
        </div>
        `;
    }

    function openCheckoutPaymentModal(order, rawCartItems, onProceedCallback) {
        window.__pendingOrder = order;
        const modalHtml = renderCheckoutPaymentModalHtml(order);
        openModal(modalHtml);
        setTimeout(() => {
            const btn = document.getElementById('btn-modal-send-wa');
            if (btn) {
                btn.onclick = async function() {
                    btn.disabled = true;
                    btn.classList.add('opacity-75', 'cursor-not-allowed');
                    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>Menghubungkan ke WhatsApp...</span>`;
                    try {
                        if (typeof onProceedCallback === 'function') {
                            await onProceedCallback();
                        } else if (typeof finalizeCheckoutOrder === 'function') {
                            await finalizeCheckoutOrder(order, rawCartItems);
                        }
                    } catch (err) {
                        console.error('Error saat menyelesaikan pesanan:', err);
                        showToast('Terjadi kesalahan saat memproses pesanan', '#ef4444');
                        btn.disabled = false;
                        btn.classList.remove('opacity-75', 'cursor-not-allowed');
                        btn.innerHTML = `<i class="fa-brands fa-whatsapp text-lg mr-2"></i> <span>Kirim ke WhatsApp</span>`;
                    }
                };
            }
        }, 50);
    }

    function openQrisPaymentModal(order, onProceedCallback) {
        openCheckoutPaymentModal(order, [], onProceedCallback);
    }




    function initSwiperFastFood() {
        try {
            if (typeof Swiper !== 'undefined' && document.querySelector('.mySwiper')) {
                if (window.mySwiperInstance) {
                    window.mySwiperInstance.update();
                } else {
                    window.mySwiperInstance = new Swiper('.mySwiper', {
                        loop: true,
                        autoplay: { delay: 4000, disableOnInteraction: false },
                        pagination: { el: '.swiper-pagination', clickable: true }
                    });
                }
            }
        } catch (e) {
            console.warn('Swiper fast food init error:', e);
        }
    }

