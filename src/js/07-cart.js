    function playOrderChimeSound() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now);
            gain1.gain.setValueAtTime(0.18, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.35);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880.00, now + 0.18);
            gain2.gain.setValueAtTime(0.22, now + 0.18);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.18);
            osc2.stop(now + 0.65);
        } catch (e) {
        }
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        syncThemeIcon();
    }
    function syncThemeIcon() {
        const isDark = document.body.classList.contains('dark');
        const el = document.getElementById('theme-icon-container');
        if (el) el.innerHTML = isDark ? THEME_ICON_DARK : THEME_ICON_LIGHT;
    }

    function doSearch(inputId) {
        const el = document.getElementById(inputId);
        if (!el) return;
        const val = el.value.trim();
        if (!val) return;
        if (window.location.hostname.includes('blogspot') || window.location.hostname.includes('blogger')) {
            window.location.href = '/search?q=' + encodeURIComponent(val);
        } else {
            navigate('/search/' + encodeURIComponent(val));
        }
    }

    async function getCartWithProducts() {
        const cartRows = await dbGetAll('cart');
        const items = [];
        for (const row of cartRows) {
            let product = await dbGet('products', row.productId);
            if (!product) {
                const fallback = (window.__allProducts || []).find(x => x && (x.id === row.productId || String(x.id) === String(row.productId))) || (window.currentBloggerProduct && (window.currentBloggerProduct.id === row.productId || String(window.currentBloggerProduct.id) === String(row.productId)) ? window.currentBloggerProduct : null);
                if (fallback) {
                    product = { ...fallback };
                    try { await dbPut('products', fallback); } catch (e) {}
                }
            }
            if (product) {
                const itemProd = { ...product };
                const vp = product.variantPrices || {};
                const col = (row.color || '').trim();
                const sz = (row.size || '').trim();
                const combo1 = `${col} ${sz}`.trim().toUpperCase();
                const combo2 = `${sz} ${col}`.trim().toUpperCase();

                let chosenPrice = null;
                if (combo1 && vp[combo1]) {
                    chosenPrice = vp[combo1];
                } else if (combo2 && vp[combo2]) {
                    chosenPrice = vp[combo2];
                } else if (col && (vp[col] || vp[col.toUpperCase()] || vp[col.toLowerCase()])) {
                    chosenPrice = vp[col] || vp[col.toUpperCase()] || vp[col.toLowerCase()];
                } else if (sz && (vp[sz] || vp[sz.toUpperCase()] || vp[sz.toLowerCase()])) {
                    chosenPrice = vp[sz] || vp[sz.toUpperCase()] || vp[sz.toLowerCase()];
                }

                if (row.customPrice && row.customPrice > 0) {
                    itemProd.price = row.customPrice;
                } else if (chosenPrice && chosenPrice > 0) {
                    itemProd.price = chosenPrice;
                }

                items.push({
                    product: itemProd,
                    qty: row.qty,
                    size: row.size || '',
                    color: row.color || '',
                    note: row.note || '',
                    cartItemId: row.cartItemId || `${row.productId}__${row.size || ''}__${row.color || ''}`,
                    selected: row.selected !== false
                });
            }
        }
        return items;
    }
    async function getCartCount() {
        const cartRows = await dbGetAll('cart');
        return cartRows.reduce((sum, r) => sum + r.qty, 0);
    }
    async function updateCartBadge() {
        const count = await getCartCount();
        const newText = count > 99 ? '99+' : String(count);
        document.querySelectorAll('.cart-badge-el').forEach(el => {
            const changed = el.textContent !== newText;
            if (count > 0) {
                el.textContent = newText;
                el.classList.remove('hidden');
                if (changed) {
                    el.classList.remove('badge-bump');
                    void el.offsetWidth;
                    el.classList.add('badge-bump');
                }
            } else {
                el.classList.add('hidden');
            }
        });
        if (typeof updateFloatingCartBar === 'function') updateFloatingCartBar();
    }

    async function toggleCartItemSelection(cartItemId, isSelected) {
        const row = await dbGet('cart', cartItemId);
        if (row) {
            row.selected = isSelected !== undefined ? isSelected : (row.selected === false);
            await dbPut('cart', row);
            await renderCart();
        }
    }

    async function toggleSelectAllCart(selectAll) {
        const cartRows = await dbGetAll('cart');
        for (const row of cartRows) {
            row.selected = selectAll;
            await dbPut('cart', row);
        }
        await renderCart();
    }

    async function deleteSelectedCartItems() {
        const rows = await dbGetAll('cart');
        const selected = rows.filter(r => r.selected !== false);
        if (selected.length === 0) return;
        if (!confirm(`Hapus ${selected.length} menu yang dipilih dari keranjang?`)) return;
        for (const r of selected) {
            await dbDelete('cart', r.cartItemId);
        }
        await updateCartBadge();
        await renderCart();
    }

    async function updateFloatingCartBar() {
        const bar = document.getElementById('floating-cart-bar');
        if (!bar) return;
        const hash = (window.location.hash || '').toLowerCase();
        const path = (window.location.pathname || '').toLowerCase();
        const isCartOrCheckout = hash.includes('/cart') || hash.includes('/checkout') || path.includes('/cart') || path.includes('/checkout');
        if (isCartOrCheckout) {
            bar.classList.add('hidden', 'translate-y-20', 'opacity-0', 'pointer-events-none');
            bar.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
            return;
        }
        try {
            const items = await getCartWithProducts();
            const count = items.reduce((sum, it) => sum + it.qty, 0);
            if (count > 0) {
                const subtotal = items.reduce((sum, it) => sum + (it.product.price * it.qty), 0);
                const badge = document.getElementById('fc-badge');
                const countEl = document.getElementById('fc-items-count');
                const subtotalEl = document.getElementById('fc-subtotal');
                if (badge) badge.textContent = count > 99 ? '99+' : count;
                if (countEl) countEl.textContent = count;
                if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
                bar.classList.remove('hidden', 'translate-y-20', 'opacity-0', 'pointer-events-none');
                bar.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
            } else {
                bar.classList.add('hidden', 'translate-y-20', 'opacity-0', 'pointer-events-none');
                bar.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
            }
        } catch (e) {
            console.warn('updateFloatingCartBar error:', e);
        }
    }
    async function addToCart(productId, qty = 1, size = null, color = null, itemNote = null, customPrice = null) {
        let actualSize = size;
        let actualColor = color;
        let actualNote = itemNote;
        let actualCustomPrice = customPrice;
        if (size && typeof size === 'object') {
            actualSize = size.size || '';
            actualColor = size.spiceLevel || size.color || '';
            actualNote = [
                size.toppings && size.toppings.length ? `Topping: ${size.toppings.join(', ')}` : '',
                size.drink ? `Minuman: ${size.drink}` : '',
                size.note ? `Catatan: ${size.note}` : ''
            ].filter(Boolean).join(' • ') || size.note || '';
            actualCustomPrice = size.customPrice || null;
        }
        let product = await dbGet('products', productId);
        if (!product) {
            const fallback = (window.__allProducts || []).find(x => x && (x.id === productId || String(x.id) === String(productId))) || (currentModalProduct && (currentModalProduct.id === productId || String(currentModalProduct.id) === String(productId)) ? currentModalProduct : null) || (window.currentBloggerProduct && (window.currentBloggerProduct.id === productId || String(window.currentBloggerProduct.id) === String(productId)) ? window.currentBloggerProduct : null);
            if (fallback) {
                product = { ...fallback };
                try { await dbPut('products', fallback); } catch (e) {}
            }
        }
        if (!product) {
            showToast('Produk tidak ditemukan', '#ef4444');
            return;
        }
        const normSize = (actualSize || '').trim();
        const normColor = (actualColor || '').trim();
        const normNote = (actualNote || '').trim();
        const cartItemId = `${productId}__${normSize}__${normColor}__${normNote}`;
        const existing = await dbGet('cart', cartItemId);
        const maxStock = product.stock > 0 ? product.stock : 999;
        const newQty = Math.min((existing ? existing.qty : 0) + qty, maxStock);

        const currentCartItems = await dbGetAll('cart');
        if (currentCartItems && currentCartItems.length > 0) {
            const firstCartItem = currentCartItems[0];
            const pFirst = await dbGet('products', firstCartItem.productId) || firstCartItem;
            const currentKitchen = getProductKitchenInfo(pFirst);
            const newKitchen = getProductKitchenInfo(product);

            if (currentKitchen && newKitchen && currentKitchen.id !== newKitchen.id) {
                promptKitchenSwitchModal(currentKitchen, newKitchen, async () => {
                    await dbClear('cart');
                    await dbPut('cart', {
                        cartItemId,
                        productId,
                        qty: Math.min(qty, maxStock),
                        size: normSize,
                        color: normColor,
                        note: normNote,
                        customPrice: actualCustomPrice,
                        kitchenName: newKitchen.name || product.kitchenName || product.branchName || '',
                        kitchenId: newKitchen.id || product.kitchenId || '',
                        kitchenAddress: newKitchen.address || product.kitchenAddress || '',
                        coords: product.coords || null,
                        selected: true
                    });
                    await updateCartBadge();
                    const variantLabel = (normSize || normColor) ? ` [${[normSize, normColor].filter(Boolean).join(' / ')}]` : '';
                    showToast(`Dapur dialihkan ke ${newKitchen.name}. ${product.name}${variantLabel} ditambahkan.`, '#10b981');
                    if (window.location.hash.includes('cart') || window.location.pathname.includes('cart')) {
                        renderCart();
                    }
                });
                return;
            }
        }

        const prodKitchen = getProductKitchenInfo(product);
        await dbPut('cart', {
            cartItemId,
            productId,
            qty: newQty,
            size: normSize,
            color: normColor,
            note: normNote,
            customPrice: actualCustomPrice,
            kitchenName: (prodKitchen && prodKitchen.name) || product.kitchenName || product.branchName || '',
            kitchenId: (prodKitchen && prodKitchen.id) || product.kitchenId || '',
            kitchenAddress: (prodKitchen && prodKitchen.address) || product.kitchenAddress || '',
            coords: product.coords || null,
            selected: true
        });
        await updateCartBadge();
        const variantLabel = (normSize || normColor) ? ` [${[normSize, normColor].filter(Boolean).join(' / ')}]` : '';
        showToast(`${product.name}${variantLabel} ditambahkan ke keranjang`, '#10b981');
    }
    async function setCartQty(cartItemId, qty) {
        const item = await dbGet('cart', cartItemId);
        if (!item) return;
        const product = await dbGet('products', item.productId);
        const maxStock = product && product.stock > 0 ? product.stock : 999;
        if (qty <= 0) {
            await dbDelete('cart', cartItemId);
        } else {
            await dbPut('cart', { ...item, qty: Math.min(qty, maxStock) });
        }
        await updateCartBadge();
        renderCart();
    }
    async function removeFromCart(cartItemId) {
        await dbDelete('cart', cartItemId);
        await updateCartBadge();
        renderCart();
    }

    function productCardHTML(p) {
        const clickAction = p.url ? `window.location.href='${escapeHtml(p.url)}'` : `navigate('/product/${p.id}')`;
        const hasRating = p.rating !== undefined && p.rating !== null && Number(p.rating) > 0;
        const rating = hasRating ? Number(p.rating).toFixed(1) : null;
        const sold = p.sold || 0;
        const isFreeShipping = p.freeShipping;
        return `
        <div class="showcase-item product-card group relative p-3 sm:p-3.5 flex flex-col h-full cursor-pointer bg-white/70 dark:bg-[#182030]/60 backdrop-blur-xl rounded-[26px] border border-white/60 dark:border-slate-700/50 shadow-[6px_6px_14px_rgba(230,206,173,0.5),-6px_-6px_14px_rgba(255,255,255,0.8)] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.35),-6px_-6px_14px_rgba(255,255,255,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300" onclick="${clickAction}">
            <div class="aspect-square relative overflow-hidden rounded-[20px] bg-slate-100 dark:bg-slate-800/60 mb-3">
                <img src="${p.image}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">

                ${p.discountPercent > 0 ? `<div class="absolute bottom-2.5 left-2.5 bg-red-500/95 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm z-10 tracking-tight">-${p.discountPercent}%</div>` : ''}

                ${isFreeShipping ? `<div class="absolute top-2.5 left-2.5 bg-emerald-600/90 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-md z-10 flex items-center gap-1">🚚 Bebas Ongkir</div>` : (p.badge ? `<div class="absolute top-2.5 left-2.5 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-md z-10">${escapeHtml(p.badge)}</div>` : '')}
            </div>
            
            <div class="flex flex-col flex-grow px-1 pb-1">
                <h4 class="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 min-h-[38px] leading-snug mb-1.5 group-hover:text-purple-600 dark:hover:text-purple-400 transition-colors">${escapeHtml(p.name)}</h4>
                
                ${p.stock !== undefined && p.stock !== null ? `
                <div class="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-2">
                    <i class="fa-solid fa-box text-[10px] text-purple-600"></i>
                    <span>Stok:</span>
                    <b class="${p.stock <= 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'} font-bold">${p.stock <= 0 ? 'Habis' : p.stock + ' porsi'}</b>
                </div>` : ''}

                <div class="mt-auto">
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <div>
                            <div class="text-slate-900 dark:text-white font-black text-xl md:text-2xl leading-none tracking-tight">${formatRupiah(p.price)}</div>
                            ${p.originalPrice ? `<div class="text-xs text-slate-400 line-through font-semibold mt-1">${formatRupiah(p.originalPrice)}</div>` : ''}
                        </div>
                        <button onclick="event.stopPropagation(); addToCart('${p.id}', 1)" class="w-8 h-8 rounded-xl clay-btn-primary flex items-center justify-center text-white hover:scale-105 transition-transform flex-shrink-0" title="Tambah ke Keranjang" type="button">
                            <i class="fa-solid fa-cart-shopping text-xs pointer-events-none"></i>
                        </button>
                    </div>
                    
                    <div class="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        ${hasRating ? `
                        <span class="text-amber-400 mr-1 text-sm leading-none">★</span>
                        <span class="text-slate-700 dark:text-slate-200 font-black">${rating}</span>
                        ${sold > 0 ? '<span class="mx-2 text-slate-300 dark:text-slate-600">|</span>' : ''}
                        ` : ''}
                        ${sold > 0 ? `<span class="truncate font-medium">Terjual ${sold}</span>` : (!hasRating ? `<span class="text-slate-400 font-medium">Menu Favorit</span>` : '')}
                    </div>
                </div>
            </div>
        </div>`;
    }

    function highlightBottomNav(page) {
    }

    function renderBottomNav() {
        if (typeof updateCartBadge === 'function') {
            updateCartBadge();
        }
    }

    function openModal(html) {
        const box = document.getElementById('modalBox');
        const overlay = document.getElementById('modalOverlay');
        if (!box || !overlay) return;
        box.innerHTML = html;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    }
    function closeModal() {
        const box = document.getElementById('modalBox');
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        if (box) box.innerHTML = '';
    }

    function initPromoBannerSlider() {
        try {
            const sliderEl = document.querySelector('.promoSwiper');
            if (!sliderEl || !window.Swiper) return;
            if (sliderEl.swiper) {
                sliderEl.swiper.update();
                return;
            }
            new Swiper(sliderEl, {
                slidesPerView: 1,
                spaceBetween: 16,
                loop: true,
                autoplay: {
                    delay: 4500,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                },
                pagination: {
                    el: '.promo-swiper-pagination',
                    clickable: true,
                }
            });
        } catch (e) {
            console.warn('Gagal inisialisasi Promo Banner Slider:', e);
        }
    }

    async function renderHome() {
        const contentEl = document.getElementById('page-content');
        if (!contentEl) return;
        if (window.__bloggerOriginalHomeHTML) {
            contentEl.innerHTML = window.__bloggerOriginalHomeHTML;
            if (document.getElementById('blogger-posts-grid')) {
                await initBloggerPostsGrid();
                return;
            }
        }
        if (document.getElementById('blogger-posts-grid')) {
            await initBloggerPostsGrid();
            return;
        }
        contentEl.innerHTML = `
        <div class="neu-flat p-8 sm:p-12 text-center rounded-2xl border border-gray-100 dark:border-gray-800 my-8">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full neu-pressed flex items-center justify-center text-majidfood-red">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 class="text-base sm:text-lg font-black text-gray-800 dark:text-white mb-1">Belum Ada Menu Dipublikasikan</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Publikasikan postingan menu makanan di dashboard Blogger Anda untuk menampilkannya di sini.</p>
        </div>`;
    }

    let currentCatalogFilter = 'all';

    function setCatalogFilter(filterKey) {
        currentCatalogFilter = filterKey;
        document.querySelectorAll('.filter-chip').forEach(btn => {
            const k = btn.getAttribute('data-filter');
            if (k === filterKey) {
                btn.className = 'filter-chip chip chip-active text-xs py-1 px-3 whitespace-nowrap';
            } else {
                btn.className = 'filter-chip chip chip-inactive text-xs py-1 px-3 whitespace-nowrap';
            }
        });
        applySortCatalog();
    }

    async function renderCatalog({ categoryId = null, query = '' } = {}) {
        const [products, categories] = await Promise.all([dbGetAll('products'), dbGetAll('categories')]);
        let filtered = products;
        if (categoryId) filtered = filtered.filter(p => p.category === categoryId);
        if (query) {
            const q = query.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
        }
        const activeCat = categories.find(c => c.id === categoryId);
        const title = query ? `Hasil untuk "${escapeHtml(query)}"` : (activeCat ? escapeHtml(activeCat.name) : 'Semua Produk');

        const contentEl = document.getElementById('page-content');
        if (!contentEl) return;

        contentEl.innerHTML = `
        <section class="page-fade space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    ${(categoryId || query) ? `
                    <button onclick="if(window.history.length > 1){window.history.back();}else{navigate('/home');}" type="button" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 clay-btn hover:text-purple-600 dark:hover:text-purple-400 hover:-translate-x-0.5 transition-all shadow-sm group flex-shrink-0">
                        <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        <span>Kembali</span>
                    </button>
                    ` : ''}
                    <div>
                        <h1 class="text-2xl md:text-3xl font-heading font-black text-slate-800 dark:text-white mb-1">${title}</h1>
                        <p class="text-sm text-slate-500 font-bold" id="catalog-count">${filtered.length} produk ditemukan</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="openShippingModal()" class="px-4 py-2.5 clay-btn text-xs font-black inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <svg class="svg-icon w-3.5 h-3.5 text-purple-600" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                        <span>Cek Ongkir</span>
                    </button>
                </div>
            </div>

            <div class="flex overflow-x-auto gap-2.5 pb-2 custom-scroll">
                <button onclick="navigate('/category')" class="chip ${!categoryId ? 'chip-active' : 'chip-inactive'}">Semua</button>
                ${categories.map(c => `<button onclick="navigate('/category/${c.id}')" class="chip ${categoryId === c.id ? 'chip-active' : 'chip-inactive'}">${escapeHtml(c.name)}</button>`).join('')}
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <div class="flex overflow-x-auto gap-2 pb-1 custom-scroll items-center text-xs">
                    <span class="text-slate-400 font-bold text-[11px] uppercase mr-1">Filter:</span>
                    <button type="button" data-filter="all" onclick="setCatalogFilter('all')" class="filter-chip chip ${currentCatalogFilter === 'all' ? 'chip-active' : 'chip-inactive'} text-xs py-1 px-3 whitespace-nowrap">Semua Menu</button>
                    <button type="button" data-filter="diskon" onclick="setCatalogFilter('diskon')" class="filter-chip chip ${currentCatalogFilter === 'diskon' ? 'chip-active' : 'chip-inactive'} text-xs py-1 px-3 whitespace-nowrap">🔥 Ada Diskon</button>
                    <button type="button" data-filter="free_ongkir" onclick="setCatalogFilter('free_ongkir')" class="filter-chip chip ${currentCatalogFilter === 'free_ongkir' ? 'chip-active' : 'chip-inactive'} text-xs py-1 px-3 whitespace-nowrap">🚚 Bebas Ongkir</button>
                    <button type="button" data-filter="terlaris" onclick="setCatalogFilter('terlaris')" class="filter-chip chip ${currentCatalogFilter === 'terlaris' ? 'chip-active' : 'chip-inactive'} text-xs py-1 px-3 whitespace-nowrap">⭐ Menu Terlaris</button>
                    <button type="button" data-filter="pedas" onclick="setCatalogFilter('pedas')" class="filter-chip chip ${currentCatalogFilter === 'pedas' ? 'chip-active' : 'chip-inactive'} text-xs py-1 px-3 whitespace-nowrap">🌶️ Menu Pedas</button>
                </div>
                <div class="flex-shrink-0 self-end sm:self-auto">
                    <select id="sort-select" onchange="applySortCatalog()" class="clay-select text-xs font-bold px-3.5 py-2 text-slate-600 dark:text-slate-200">
                        <option value="relevan">Urutkan: Relevan</option>
                        <option value="murah">Harga Terendah</option>
                        <option value="mahal">Harga Tertinggi</option>
                        <option value="laris">Paling Laris</option>
                        <option value="rating">Rating Tertinggi</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6" id="catalog-grid"></div>
            <div id="catalog-empty" class="hidden text-center py-16 clay-card p-8 my-4">
                <div class="w-16 h-16 mx-auto mb-4 clay-btn flex items-center justify-center text-purple-600 rounded-full">
                    <svg class="svg-icon w-8 h-8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <h3 class="text-lg font-black text-slate-800 dark:text-white mb-2">Menu Tidak Ditemukan</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Belum ada menu yang sesuai dengan pencarian atau filter yang dipilih.</p>
                <div class="flex flex-wrap justify-center gap-3">
                    <button onclick="setCatalogFilter('all'); applySortCatalog();" class="px-5 py-2.5 clay-btn font-bold text-xs">Reset Filter</button>
                    <button onclick="goToHome()" class="px-6 py-2.5 clay-btn-primary font-bold text-xs">Kembali ke Beranda</button>
                </div>
            </div>
        </section>`;

        window.__catalogProducts = filtered;
        applySortCatalog();
    }

    function applySortCatalog() {
        const sortSel = document.getElementById('sort-select');
        const sort = sortSel ? sortSel.value : 'relevan';
        let list = [...(window.__catalogProducts || [])];

        if (currentCatalogFilter === 'diskon') {
            list = list.filter(p => (p.originalPrice && p.originalPrice > p.price) || p.badge || p.flashSale);
        } else if (currentCatalogFilter === 'free_ongkir') {
            list = list.filter(p => p.freeShipping || (FREE_SHIPPING_MIN_SPEND > 0 && p.price >= FREE_SHIPPING_MIN_SPEND));
        } else if (currentCatalogFilter === 'terlaris') {
            list = list.filter(p => (p.sold && p.sold >= 50) || (p.badge && /laris|best|favorit|promo/i.test(p.badge)));
        } else if (currentCatalogFilter === 'pedas') {
            list = list.filter(p => /pedas|geprek|mercon|sambal|rawit|balado|rica/i.test(p.name + ' ' + (p.description || '')));
        }

        if (sort === 'murah') list.sort((a, b) => a.price - b.price);
        else if (sort === 'mahal') list.sort((a, b) => b.price - a.price);
        else if (sort === 'laris') list.sort((a, b) => (b.sold || 0) - (a.sold || 0));
        else if (sort === 'rating') list.sort((a, b) => (b.rating || 5) - (a.rating || 5));

        const countEl = document.getElementById('catalog-count');
        if (countEl) countEl.textContent = `${list.length} menu ditemukan`;

        const grid = document.getElementById('catalog-grid');
        const empty = document.getElementById('catalog-empty');
        if (!grid || !empty) return;

        if (list.length === 0) {
            grid.innerHTML = '';
            empty.classList.remove('hidden');
        } else {
            empty.classList.add('hidden');
            grid.innerHTML = list.map(productCardHTML).join('');
        }
    }

    async function renderProductDetail(id) {
        const product = await dbGet('products', id);
        const container = document.getElementById('page-content');
        if (!container) return;

        if (!product) {
            container.innerHTML = `<div class="text-center py-24"><p class="text-slate-400 font-bold mb-4">Produk tidak ditemukan.</p><button onclick="navigate('/home')" class="px-8 py-3 clay-btn-primary font-bold text-sm">Kembali ke Beranda</button></div>`;
            return;
        }

        const categories = await dbGetAll('categories');
        const cat = categories.find(c => c.id === product.category);
        const related = (await dbGetAll('products')).filter(p => p.category === product.category && p.id !== product.id).slice(0, 5);

        container.innerHTML = `
        <section class="page-fade space-y-10">
            <button onclick="history.length > 1 ? history.back() : navigate('/home')" class="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400">
                <svg class="svg-icon w-4 h-4" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Kembali
            </button>

            <div class="grid md:grid-cols-2 gap-8 md:gap-12">
                <div class="clay-card p-3">
                    <div class="aspect-square rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05)]">
                        <img src="${product.image}" alt="${escapeHtml(product.name)}" class="w-full h-full object-cover">
                    </div>
                </div>

                <div class="flex flex-col">
                    ${cat ? `<a href="#/category/${cat.id}" class="text-xs font-black text-purple-600 uppercase tracking-widest mb-3">${escapeHtml(cat.name)}</a>` : ''}
                    <h1 class="text-2xl md:text-3xl font-heading font-black text-slate-800 dark:text-white mb-4 leading-snug">${escapeHtml(product.name)}</h1>

                    <div class="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 flex-wrap">
                        ${(function() {
                            const dyn = (typeof getProductDynamicRating === 'function')
                                ? getProductDynamicRating(product.id, product.rating)
                                : { rating: product.rating, hasRating: !!(product.rating && Number(product.rating) > 0), count: 0 };
                            if (dyn.hasRating) {
                                return `<div class="flex items-center gap-1">
                                    <svg class="svg-solid w-4 h-4 text-yellow-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    <span class="text-slate-700 dark:text-slate-200 font-extrabold">${dyn.rating}</span>
                                    ${dyn.count > 1 ? `<span class="text-xs text-slate-400">(${dyn.count} ulasan)</span>` : ''}
                                </div>`;
                            }
                            return `<div class="flex items-center gap-1">
                                <svg class="svg-solid w-4 h-4 text-yellow-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                <span class="text-xs text-slate-500 dark:text-slate-300 font-bold">Menu Baru</span>
                            </div>`;
                        })()}
                        ${(product.sold && Number(product.sold) > 0) ? `
                            <span class="text-slate-300 dark:text-slate-600">|</span>
                            <span>Terjual ${product.sold}</span>
                        ` : ''}
                        ${product.stock !== undefined && product.stock !== null ? `
                            <span class="text-slate-300 dark:text-slate-600">|</span>
                            <span>Stok ${product.stock <= 0 ? '<b class="text-rose-500">Habis</b>' : product.stock}</span>
                        ` : ''}
                    </div>

                    <div class="clay-card !bg-white dark:!bg-slate-800 p-5 mb-6">
                        <div class="flex items-center gap-4 flex-wrap">
                            <span class="text-3xl font-black text-purple-600">${formatRupiah(product.price)}</span>
                            ${product.originalPrice ? `<span class="text-base text-slate-400 line-through font-bold">${formatRupiah(product.originalPrice)}</span>` : ''}
                            ${product.discountPercent > 0 ? `<span class="bg-red-100 text-red-600 text-xs font-black px-3 py-1 rounded-full">Hemat ${product.discountPercent}%</span>` : ''}
                        </div>
                    </div>

                    <div class="mb-5">
                        <h3 class="font-black text-slate-800 dark:text-white mb-1.5 text-sm">Deskripsi Menu</h3>
                        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">${escapeHtml(product.description || '-')}</p>
                    </div>

                    <div class="clay-card !bg-white dark:!bg-slate-800 p-4 mb-5 space-y-3.5">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Pilihan Level Pedas:</span>
                                <span id="detail-selected-spice-label" class="text-xs font-black text-majidfood-red">Level 1 (Sedang)</span>
                            </div>
                            <div class="flex flex-wrap gap-2" id="detail-spice-wrap">
                                <button type="button" onclick="selectSpiceLevel(0, 'Level 0 (Tidak Pedas)')" class="spice-btn px-3 py-1 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">Level 0</button>
                                <button type="button" onclick="selectSpiceLevel(1, 'Level 1 (Sedang)')" class="spice-btn active px-3 py-1 rounded-full text-xs font-bold bg-majidfood-red text-white border-transparent">Level 1</button>
                                <button type="button" onclick="selectSpiceLevel(2, 'Level 2 (Pedas 🔥)')" class="spice-btn px-3 py-1 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">Level 2</button>
                                <button type="button" onclick="selectSpiceLevel(3, 'Level 3 (Super Pedas 🔥🔥)')" class="spice-btn px-3 py-1 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">Level 3</button>
                            </div>
                        </div>
                        <div>
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Catatan untuk Dapur / Resto:</span>
                            <input id="detail-kitchen-notes" type="text" class="clay-input w-full px-3.5 py-2 text-xs" placeholder="Contoh: Saus dipisah, jangan pakai bawang goreng..." />
                        </div>
                    </div>

                    ${(product.colors && product.colors.length) || (product.sizes && product.sizes.length) ? `
                    <div class="clay-card !bg-white dark:!bg-slate-800 p-4 mb-6 space-y-4">
                        ${product.colors && product.colors.length ? `
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Pilihan Rasa / Level Pedas:</span>
                                <span id="detail-selected-color-label" class="text-xs font-black text-purple-600 dark:text-purple-400">${escapeHtml(product.colors[0])}</span>
                            </div>
                            <div class="flex flex-wrap gap-2" id="detail-colors-wrap">
                                ${product.colors.map((c, idx) => `
                                <button type="button" onclick="selectDetailColor('${escapeHtml(c)}', this)" class="detail-color-pill px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${idx === 0 ? 'clay-btn-primary !text-white ring-2 ring-orange-400' : 'clay-btn text-slate-700 dark:text-slate-200'}">
                                    ${escapeHtml(c)}
                                </button>`).join('')}
                            </div>
                        </div>` : ''}

                        ${product.sizes && product.sizes.length ? `
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Pilihan Porsi / Ukuran:</span>
                                <span id="detail-selected-size-label" class="text-xs font-black text-purple-600 dark:text-purple-400">${escapeHtml(product.sizes[0])}</span>
                            </div>
                            <div class="flex flex-wrap gap-2" id="detail-sizes-wrap">
                                ${product.sizes.map((s, idx) => `
                                <button type="button" onclick="selectDetailSize('${escapeHtml(s)}', this)" class="detail-size-pill px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${idx === 0 ? 'clay-btn-primary !text-white ring-2 ring-orange-400' : 'clay-btn text-slate-700 dark:text-slate-200'}">
                                    ${escapeHtml(s)}
                                </button>`).join('')}
                            </div>
                        </div>` : ''}
                    </div>` : ''}

                    <div class="mb-6 flex items-center justify-between p-3.5 clay-btn rounded-2xl cursor-pointer" onclick="openShippingModal()">
                        <div class="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <svg class="svg-icon w-4 h-4 text-purple-600" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                            <span>Estimasi Ongkir ke Kotamu</span>
                        </div>
                        <span class="text-xs font-black text-purple-600 flex items-center gap-1">Cek Tarif <svg class="svg-icon w-3.5 h-3.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></span>
                    </div>

                    <div class="flex items-center gap-4 mb-6">
                        <span class="text-sm font-bold text-slate-600 dark:text-slate-300">Jumlah</span>
                        <div class="qty-stepper flex items-center gap-2 clay-card !bg-white dark:!bg-slate-800 p-1">
                            <button onclick="changeDetailQty(-1)" class="clay-btn">-</button>
                            <span id="detail-qty" class="w-8 text-center font-black">1</span>
                            <button onclick="changeDetailQty(1)" class="clay-btn">+</button>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-4 mb-8">
                        <button onclick="addToCartFromDetail('${product.id}')" class="flex-1 px-6 py-4 clay-btn-outline font-black text-sm" ${product.stock <= 0 ? 'disabled' : ''}>${product.stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}</button>
                        <button onclick="buyNow('${product.id}')" class="flex-1 px-6 py-4 clay-btn-primary font-black text-sm" ${product.stock <= 0 ? 'disabled' : ''}>Beli Sekarang</button>
                    </div>
                </div>
            </div>

            ${related.length ? `
            <div>
                <h2 class="text-lg md:text-xl font-heading font-extrabold text-slate-800 dark:text-white mb-6">Produk Serupa</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">${related.map(productCardHTML).join('')}</div>
            </div>` : ''}
        </section>`;

        window.__detailQty = 1;
        window.__detailProductId = product.id;
        window.__detailSelectedColor = product.colors && product.colors.length ? product.colors[0] : null;
        window.__detailSelectedSize = product.sizes && product.sizes.length ? product.sizes[0] : null;
    }

    function selectDetailColor(color, btnEl) {
        window.__detailSelectedColor = color;
        const lbl = document.getElementById('detail-selected-color-label');
        if (lbl) lbl.textContent = color;
        document.querySelectorAll('#detail-colors-wrap .detail-color-pill').forEach(b => {
            b.className = 'detail-color-pill px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all clay-btn text-slate-700 dark:text-slate-200';
        });
        btnEl.className = 'detail-color-pill px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all clay-btn-primary !text-white ring-2 ring-orange-400';
    }

    function selectDetailSize(size, btnEl) {
        window.__detailSelectedSize = size;
        const lbl = document.getElementById('detail-selected-size-label');
        if (lbl) lbl.textContent = size;
        document.querySelectorAll('#detail-sizes-wrap .detail-size-pill').forEach(b => {
            b.className = 'detail-size-pill px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all clay-btn text-slate-700 dark:text-slate-200';
        });
        btnEl.className = 'detail-size-pill px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all clay-btn-primary !text-white ring-2 ring-orange-400';
    }

    function changeDetailQty(delta) {
        window.__detailQty = Math.max(1, (window.__detailQty || 1) + delta);
        const qtyEl = document.getElementById('detail-qty');
        if (qtyEl) qtyEl.textContent = window.__detailQty;
    }

    
    window.__detailSelectedSpice = 'Level 1 (Sedang)';
    function selectSpiceLevel(lvl, label) {
        window.__detailSelectedSpice = label;
        const lblEl = document.getElementById('detail-selected-spice-label');
        if (lblEl) lblEl.textContent = label;
        document.querySelectorAll('.spice-btn').forEach((btn, idx) => {
            if (idx === lvl) {
                btn.className = 'spice-btn active px-3 py-1 rounded-full text-xs font-bold bg-majidfood-red text-white border-transparent';
            } else {
                btn.className = 'spice-btn px-3 py-1 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
            }
        });
    }

    async function addToCartFromDetail(productId) {
        const kNotes = document.getElementById('detail-kitchen-notes')?.value.trim() || '';
        const spice = window.__detailSelectedSpice || '';
        const variantText = [spice, kNotes].filter(Boolean).join(' | ');
        await addToCart(productId, window.__detailQty || 1, window.__detailSelectedSize, variantText || window.__detailSelectedColor);
    }

    async function buyNow(productId) {
        const kNotes = document.getElementById('detail-kitchen-notes')?.value.trim() || '';
        const spice = window.__detailSelectedSpice || '';
        const variantText = [spice, kNotes].filter(Boolean).join(' | ');
        await addToCart(productId, window.__detailQty || 1, window.__detailSelectedSize, variantText || window.__detailSelectedColor);
        navigate('/checkout');
    }

    async function renderCart() {
        const items = await getCartWithProducts();
        const container = document.getElementById('page-content');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
            <section class="page-fade text-center py-20">
                <div class="w-24 h-24 mx-auto mb-6 clay-card flex items-center justify-center text-slate-400">
                    <svg class="svg-icon w-10 h-10" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                </div>
                <h2 class="text-xl font-heading font-black text-slate-800 dark:text-white mb-2">Keranjang Masih Kosong</h2>
                <p class="text-sm text-slate-500 mb-6">Yuk mulai pesan menu favoritmu.</p>
                <button onclick="goToHome()" class="px-8 py-3.5 clay-btn-primary font-bold text-sm">Mulai Belanja</button>
            </section>`;
            return;
        }

        const selectedItems = items.filter(it => it.selected !== false);
        const allSelected = items.length > 0 && selectedItems.length === items.length;

        const subtotal = selectedItems.reduce((sum, it) => sum + ((it.product && it.product.price) ? it.product.price : 0) * it.qty, 0);

        const hasFoodItem = selectedItems.some(it => {
            const txt = (((it.product && it.product.category) || '') + ' ' + ((it.product && it.product.name) || '')).toLowerCase();
            return !txt.includes('minum') && !txt.includes('drink') && !txt.includes('jus') && !txt.includes('kopi') && !txt.includes('tea') && !txt.includes('es ');
        });
        const hasDrinkItem = selectedItems.some(it => {
            const txt = (((it.product && it.product.category) || '') + ' ' + ((it.product && it.product.name) || '')).toLowerCase();
            return txt.includes('minum') || txt.includes('drink') || txt.includes('jus') || txt.includes('kopi') || txt.includes('tea') || txt.includes('es ') || txt.includes('boba');
        });
        const comboDiscount = (hasFoodItem && hasDrinkItem) ? 5000 : 0;
        window.__cartComboDiscount = comboDiscount;

        const couponDiscount = APPLIED_COUPON ? calculateCouponDiscount(APPLIED_COUPON, subtotal, 0) : 0;
        const loyaltyDiscount = (window.__cartLoyaltyPointsUsed > 0) ? (window.__cartLoyaltyDiscount || 0) : 0;
        const cartFinalTotal = Math.max(0, subtotal - couponDiscount - loyaltyDiscount - comboDiscount);
        const totalItemsCount = selectedItems.reduce((sum, it) => sum + it.qty, 0);
        const allPhysicalFree = selectedItems.length > 0 && selectedItems.every(it => it.product && it.product.freeShipping);
        const qualifiesFreeShipping = allPhysicalFree || (FREE_SHIPPING_MIN_SPEND > 0 && subtotal >= FREE_SHIPPING_MIN_SPEND);

        let freeShippingBannerHTML = '';
        if (qualifiesFreeShipping && selectedItems.length > 0) {
            freeShippingBannerHTML = `
            <div class="clay-card p-4 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-3.5 mb-6">
                <span class="text-2xl flex-shrink-0">🎉</span>
                <div class="flex-grow">
                    <div class="flex items-center justify-between text-xs mb-1.5">
                        <span class="font-black text-emerald-800 dark:text-emerald-200 text-sm">Selamat! Anda Mendapatkan GRATIS ONGKIR!</span>
                        <span class="font-black text-emerald-700 dark:text-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center gap-1">🚚 Bebas Ongkir</span>
                    </div>
                    <div class="w-full bg-emerald-200 dark:bg-emerald-900/60 rounded-full h-2 overflow-hidden">
                        <div class="bg-emerald-500 h-2 rounded-full w-full"></div>
                    </div>
                </div>
            </div>`;
        } else if (FREE_SHIPPING_MIN_SPEND > 0 && selectedItems.length > 0) {
            const needed = FREE_SHIPPING_MIN_SPEND - subtotal;
            const percent = Math.min(100, Math.max(5, Math.round((subtotal / FREE_SHIPPING_MIN_SPEND) * 100)));
            freeShippingBannerHTML = `
            <div class="clay-card p-4 bg-orange-50/90 dark:bg-slate-800/80 dark:bg-orange-950/30 border border-purple-200/80 dark:border-orange-800/80 flex items-center gap-3.5 mb-6">
                <span class="text-2xl flex-shrink-0">🚚</span>
                <div class="flex-grow">
                    <div class="flex items-center justify-between text-xs mb-1.5 flex-wrap gap-1">
                        <span class="font-bold text-slate-700 dark:text-slate-200">Pesan <strong class="text-purple-600 dark:text-purple-400 font-black">${formatRupiah(needed)}</strong> lagi untuk <strong class="text-emerald-600 dark:text-emerald-400 font-black">GRATIS ONGKIR</strong>!</span>
                        <span class="font-black text-purple-600 dark:text-purple-400 text-xs">${percent}%</span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div class="bg-gradient-to-r from-orange-500 to-emerald-500 h-2 rounded-full transition-all duration-500" style="width: ${percent}%;"></div>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1 font-medium">Syarat gratis ongkir: minimal belanja ${formatRupiah(FREE_SHIPPING_MIN_SPEND)}</p>
                </div>
            </div>`;
        }

        const activeCartKitchen = items.length > 0 ? getProductKitchenInfo(items[0].product || items[0]) : null;

        container.innerHTML = `
        <section class="page-fade space-y-6 pb-28 md:pb-8">
            <div class="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
                <button onclick="goToHome()" type="button" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 clay-btn hover:text-purple-600 dark:hover:text-purple-400 hover:-translate-x-0.5 transition-all shadow-sm group" title="Kembali ke Beranda">
                    <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    <span>Kembali ke Beranda</span>
                </button>
                <h1 class="text-xl sm:text-2xl md:text-3xl font-heading font-black text-slate-800 dark:text-white">Keranjang Pesanan</h1>
            </div>
            
            ${freeShippingBannerHTML}

            ${activeCartKitchen ? `
            <div class="clay-card p-3.5 px-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-700/60 flex items-center justify-between gap-3 text-xs mb-2">
                <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-2xl flex-shrink-0">🍳</span>
                    <div class="min-w-0">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">DAPUR PENGOLAH &amp; ASAL PENGANTARAN:</span>
                        <span class="font-black text-slate-800 dark:text-white text-xs block truncate">${escapeHtml(activeCartKitchen.name)}</span>
                        ${activeCartKitchen.address ? `<span class="text-[10px] text-slate-500 dark:text-slate-400 block truncate">${escapeHtml(activeCartKitchen.address)}</span>` : ''}
                    </div>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] flex-shrink-0 shadow-sm">1 Pesanan 1 Dapur</span>
            </div>
            ` : ''}

            <div class="grid lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-4">
                    <div class="clay-card p-3.5 px-4 flex items-center justify-between">
                        <label class="flex items-center gap-2.5 cursor-pointer select-none">
                            <input type="checkbox" id="cart-select-all-cb" ${allSelected ? 'checked' : ''} onchange="toggleSelectAllCart(this.checked)" class="w-4 h-4 rounded text-purple-600 focus:ring-0 accent-purple-600 cursor-pointer">
                            <span class="text-xs font-black text-slate-800 dark:text-white">Pilih Semua Menu (${selectedItems.length}/${items.length})</span>
                        </label>
                        ${selectedItems.length > 0 ? `
                        <button type="button" onclick="deleteSelectedCartItems()" class="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
                            <span>Hapus Terpilih</span>
                        </button>
                        ` : ''}
                    </div>

                    ${items.map(it => {
                        const isItemFreeShip = it.product && it.product.freeShipping;
                        const prodPrice = (it.product && it.product.price) ? it.product.price : 0;
                        const prodImg = (it.product && it.product.image) ? it.product.image : 'https://placehold.co/100x100?text=Menu';
                        const prodName = (it.product && it.product.name) ? it.product.name : 'Menu Resto';
                        const prodId = (it.product && it.product.id) ? it.product.id : '';
                        const isChecked = it.selected !== false;
                        return `
                        <div class="clay-card p-4 flex gap-3.5 items-center ${!isChecked ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/30' : ''}">
                            <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleCartItemSelection('${escapeHtml(it.cartItemId)}', this.checked)" class="w-4 h-4 rounded text-purple-600 focus:ring-0 accent-purple-600 cursor-pointer flex-shrink-0" title="Centang menu ini untuk dibayar">
                            <img src="${prodImg}" class="w-20 h-20 rounded-2xl object-cover flex-shrink-0 cursor-pointer" onclick="${prodId ? `navigate('/product/${prodId}')` : ''}">
                            <div class="flex-grow min-w-0">
                                <h4 class="font-bold text-sm text-slate-800 dark:text-white line-clamp-1 mb-1 cursor-pointer" onclick="${prodId ? `navigate('/product/${prodId}')` : ''}">${escapeHtml(prodName)}</h4>
                                
                                <div class="flex flex-wrap items-center gap-2 mb-2">
                                    ${(it.size || it.color) ? `
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/40 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                                        ${[it.size ? 'Porsi: ' + escapeHtml(it.size) : '', it.color ? 'Rasa/Level: ' + escapeHtml(it.color) : ''].filter(Boolean).join(' • ')}
                                    </span>` : ''}

                                    ${isItemFreeShip ? `
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                        🚚 Bebas Ongkir
                                    </span>` : ''}

                                    ${it.note ? `
                                    <div class="w-full text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/60 flex items-start gap-1.5 mt-1">
                                        <span>📝</span>
                                        <span class="italic font-medium">${escapeHtml(it.note)}</span>
                                    </div>` : ''}
                                </div>

                                <p class="text-purple-600 font-black text-sm mb-3">${formatRupiah(prodPrice)}</p>
                                <div class="flex items-center gap-4">
                                    <div class="qty-stepper flex items-center gap-2 clay-btn p-1">
                                        <button type="button" onclick="setCartQty(this.getAttribute('data-id'), ${it.qty - 1})" data-id="${escapeHtml(it.cartItemId)}">-</button>
                                        <span class="w-6 text-center font-black text-sm">${it.qty}</span>
                                        <button type="button" onclick="setCartQty(this.getAttribute('data-id'), ${it.qty + 1})" data-id="${escapeHtml(it.cartItemId)}">+</button>
                                    </div>
                                    <button type="button" onclick="removeFromCart(this.getAttribute('data-id'))" data-id="${escapeHtml(it.cartItemId)}" class="text-red-400 hover:text-red-600" title="Hapus menu"><svg class="svg-icon w-4 h-4" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg></button>
                                </div>
                            </div>
                            <div class="text-right font-black text-slate-800 dark:text-white flex-shrink-0">${formatRupiah(prodPrice * it.qty)}</div>
                        </div>`;
                    }).join('')}
                </div>
                <div class="clay-card p-6 h-fit sticky top-24">
                    <h3 class="font-black text-slate-800 dark:text-white mb-4">Ringkasan Pesanan</h3>
                    <div class="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-2"><span>Subtotal Menu</span><span>${formatRupiah(subtotal)}</span></div>
                    
                    <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <span>Total Porsi Terpilih</span>
                        <span class="font-bold text-slate-700 dark:text-slate-200">${totalItemsCount} porsi</span>
                    </div>

                    <button onclick="openShippingModal()" class="w-full my-2 px-4 py-2.5 clay-btn text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2">
                        <svg class="svg-icon w-3.5 h-3.5 text-purple-600" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                        <span>Cek Estimasi Biaya Antar</span>
                    </button>

                    <div class="my-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                        <div class="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                            <span>🎟️</span><span>Kupon / Voucher Promo:</span>
                        </div>
                        ${APPLIED_COUPON ? `
                        <div class="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs">
                            <div>
                                <span class="font-extrabold text-emerald-700 dark:text-emerald-400 block">${APPLIED_COUPON.code}</span>
                                <span class="text-[10px] text-emerald-600 dark:text-emerald-300">${APPLIED_COUPON.desc || ''}</span>
                            </div>
                            <button type="button" onclick="removeCouponCode(); renderCart();" class="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1">Hapus</button>
                        </div>
                        ` : `
                        <div class="flex gap-2">
                            <input type="text" id="cart-coupon-input" placeholder="Kode kupon..." class="flex-grow px-3 py-2 clay-input text-xs uppercase font-bold text-slate-700">
                            <button type="button" onclick="const code = document.getElementById('cart-coupon-input').value; if(applyCouponCode(code, ${subtotal}, 0)) renderCart();" class="px-3.5 py-2 clay-btn-primary text-xs font-black">Pakai</button>
                        </div>
                        <p class="text-[10px] text-slate-400 mt-1.5 font-medium">Masukkan kode voucher yang berlaku dari toko</p>
                        `}
                    </div>

                    <div class="my-3.5 p-3.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-500/30 space-y-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-xl">⭐</span>
                                <div>
                                    <span class="text-xs font-black text-slate-800 dark:text-white block">Poin Loyalitas Anda</span>
                                    <span class="text-[10px] text-slate-500 dark:text-slate-400">Tersedia <strong class="text-amber-500 font-bold">${getYukFoodLoyaltyPoints()}</strong> Poin (1 Poin = Rp 500)</span>
                                </div>
                            </div>
                            <span class="text-xs font-black text-amber-600 dark:text-amber-400">${formatRupiah(getYukFoodLoyaltyPoints() * 500)}</span>
                        </div>
                        ${getYukFoodLoyaltyPoints() >= 10 ? `
                        <div class="pt-2 border-t border-amber-200/50 dark:border-amber-800/50 flex items-center justify-between gap-2">
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" id="cart-use-loyalty-pts" onchange="toggleCartLoyaltyRedemption(${subtotal})" ${window.__cartLoyaltyPointsUsed > 0 ? 'checked' : ''} class="w-4 h-4 text-majidfood-red rounded focus:ring-0 accent-purple-600">
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Gunakan Poin Loyalitas</span>
                            </label>
                            ${window.__cartLoyaltyPointsUsed > 0 ? `
                            <span class="text-xs font-black text-emerald-600 dark:text-emerald-400">-${formatRupiah(loyaltyDiscount)}</span>
                            ` : ''}
                        </div>
                        ` : `
                        <p class="text-[10px] text-slate-400 font-medium">Minimal 10 poin untuk ditukarkan potongan belanja.</p>
                        `}
                    </div>

                    ${APPLIED_COUPON && couponDiscount > 0 ? `
                    <div class="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                        <span>Diskon Kupon (${APPLIED_COUPON.code})</span>
                        <span>-${formatRupiah(couponDiscount)}</span>
                    </div>
                    ` : ''}

                    ${loyaltyDiscount > 0 ? `
                    <div class="flex justify-between text-sm text-amber-600 dark:text-amber-400 font-bold mb-2">
                        <span>Potongan Poin Loyalitas (${window.__cartLoyaltyPointsUsed} Poin)</span>
                        <span>-${formatRupiah(loyaltyDiscount)}</span>
                    </div>
                    ` : ''}

                    ${comboDiscount > 0 ? `
                    <div class="flex justify-between text-sm text-purple-600 dark:text-purple-400 font-bold mb-2 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                        <span class="flex items-center gap-1.5"><span>🍱</span><span>Paket Combo Hemat (Makanan + Minuman)</span></span>
                        <span class="font-black">-${formatRupiah(comboDiscount)}</span>
                    </div>
                    ` : ''}

                    <div class="border-t border-dashed border-slate-300/50 dark:border-slate-600/50 pt-4 flex justify-between font-black text-lg text-slate-800 dark:text-white mb-6"><span>Total Sementara</span><span class="text-purple-600 dark:text-purple-400">${formatRupiah(cartFinalTotal)}</span></div>
                    <div class="hidden md:block">
                    ${selectedItems.length > 0 ? `
                        <button onclick="window.__checkoutLoyaltyDiscount = ${loyaltyDiscount}; window.__checkoutLoyaltyPointsUsed = ${window.__cartLoyaltyPointsUsed || 0}; window.__checkoutComboDiscount = ${comboDiscount}; navigate('/checkout')" class="w-full px-6 py-4 clay-btn-primary font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all">
                            <span>Lanjut ke Pembayaran (${selectedItems.length})</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    ` : `
                        <button type="button" onclick="showToast('Pilih minimal 1 menu untuk checkout', '#ef4444')" class="w-full px-6 py-4 clay-btn text-slate-400 dark:text-slate-500 font-black text-sm cursor-not-allowed">Pilih Menu untuk Pembayaran (0)</button>
                    `}
                    </div>
                </div>
            </div>

            <div id="cart-floating-action-bar" class="md:hidden fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-[140] transition-all duration-300">
                <div class="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-purple-400/40 backdrop-blur-md pointer-events-auto hover:shadow-purple-500/25 transition-all">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="relative w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-xl">
                            <span>🛍️</span>
                            <span class="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black h-5 min-w-[20px] px-1 rounded-full border-2 border-white flex items-center justify-center">${selectedItems.length}</span>
                        </div>
                        <div class="min-w-0">
                            <div class="text-xs font-medium text-orange-100">${selectedItems.length} Menu Dipilih</div>
                            <div class="text-sm sm:text-base font-black truncate">${formatRupiah(cartFinalTotal)}</div>
                        </div>
                    </div>
                    ${selectedItems.length > 0 ? `
                    <button type="button" onclick="window.__checkoutLoyaltyDiscount = ${loyaltyDiscount}; window.__checkoutLoyaltyPointsUsed = ${window.__cartLoyaltyPointsUsed || 0}; window.__checkoutComboDiscount = ${comboDiscount}; navigate('/checkout')" class="px-4 sm:px-5 py-2.5 bg-white text-purple-600 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md flex-shrink-0 hover:bg-orange-50 active:scale-95 transition-all">
                        <span>Lanjut Pembayaran</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                    ` : `
                    <button type="button" onclick="showToast('Pilih minimal 1 menu untuk checkout', '#ef4444')" class="px-4 py-2 bg-white/40 text-white/90 rounded-xl font-black text-xs flex items-center gap-1 cursor-not-allowed">
                        <span>Pilih Menu</span>
                    </button>
                    `}
                </div>
            </div>
        </section>`;
    }

    async function renderCheckout() {
        const allItems = await getCartWithProducts();
        const items = allItems.filter(it => it.selected !== false);
        const container = document.getElementById('page-content');
        if (!container) return;

        if (items.length === 0) {
            showToast('Pilih menu yang ingin dibayar terlebih dahulu', '#ef4444');
            navigate('/cart');
            return;
        }
        const profile = await dbGet('profile', 'me');
        const subtotal = items.reduce((sum, it) => sum + ((it.product && it.product.price) ? it.product.price : 0) * it.qty, 0);

        const totalItemsCount = items.reduce((sum, it) => sum + it.qty, 0);
        const allPhysicalFree = items.length > 0 && items.every(it => it.product && it.product.freeShipping);
        const isFreeShipping = allPhysicalFree || (FREE_SHIPPING_MIN_SPEND > 0 && subtotal >= FREE_SHIPPING_MIN_SPEND);

        const dineInTable = sessionStorage.getItem('digiarju_dine_in_table') || sessionStorage.getItem('mangan_dine_in_table');
        const isDineIn = !!dineInTable;

        const hasFood = items.some(it => {
            const cat = ((it.product && it.product.category) || '').toLowerCase();
            const name = ((it.product && it.product.name) || '').toLowerCase();
            return cat.includes('makanan') || cat.includes('food') || name.includes('nasi') || name.includes('mie') || name.includes('ayam') || name.includes('bebek') || name.includes('burger');
        });
        const hasBeverage = items.some(it => {
            const cat = ((it.product && it.product.category) || '').toLowerCase();
            const name = ((it.product && it.product.name) || '').toLowerCase();
            return cat.includes('minuman') || cat.includes('drink') || cat.includes('beverage') || name.includes('es') || name.includes('teh') || name.includes('kopi') || name.includes('jus');
        });
        const comboDiscount = (hasFood && hasBeverage) ? 5000 : (window.__checkoutComboDiscount || 0);
        window.__checkoutComboDiscount = comboDiscount;

        const destinations = getShippingDestinations();
        const paymentMethods = getPaymentMethods();
        const addressOptions = getAddressOptions();
        if (profile?.mapsUrl && !currentActiveMapsPin) {
            currentActiveMapsPin = { url: profile.mapsUrl, lat: 0, lng: 0, displayAddress: '' };
        }

        const cartKitchen = items.length > 0 ? getProductKitchenInfo(items[0].product || items[0]) : null;
        const branches = getRestaurantBranches();
        const activeBranch = cartKitchen || (currentActiveMapsPin && currentActiveMapsPin.lat ? findNearestRestaurantBranch(currentActiveMapsPin.lat, currentActiveMapsPin.lng).branch : branches[0]);
        window.__checkoutSelectedBranch = activeBranch;
        const hasGpsPin = !!(currentActiveMapsPin && currentActiveMapsPin.lat);
        const initialGpsDist = hasGpsPin 
            ? calculateHaversineKm(activeBranch.lat, activeBranch.lng, currentActiveMapsPin.lat, currentActiveMapsPin.lng) 
            : 1.0;
        window.__checkoutBranchDistanceKm = initialGpsDist;

        const currentOrderType = isDineIn ? 'dine_in' : (window.__checkoutOrderType === 'pickup' ? 'pickup' : 'delivery');
        window.__checkoutOrderType = currentOrderType;
        const isPickup = currentOrderType === 'pickup';

        const initialUnitCost = (isDineIn || isPickup) ? 0 : (destinations[0] ? destinations[0].reg : 10000);
        const initialNormalFee = (isDineIn || isPickup) ? 0 : (hasGpsPin ? calculateFastFoodShippingFee(initialGpsDist) : initialUnitCost);
        const initialFee = (isFreeShipping || isDineIn || isPickup) ? 0 : initialNormalFee;

        const storeOpStatus = getRestaurantOperatingStatus();
        const isStoreClosed = !storeOpStatus.isOpen;

        window.__checkoutSubtotal = subtotal;
        window.__checkoutTotalItems = totalItemsCount;
        window.__checkoutIsFreeShipping = isFreeShipping;
        window.__checkoutNormalShippingFee = initialNormalFee;
        window.__checkoutShippingFee = initialFee;

        container.innerHTML = `
        <section class="page-fade space-y-6 pb-28 md:pb-8">
            <div class="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
                <button onclick="navigate('/cart')" type="button" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 clay-btn hover:text-purple-600 dark:hover:text-purple-400 hover:-translate-x-0.5 transition-all shadow-sm group">
                    <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    <span>Kembali ke Keranjang</span>
                </button>
                <h1 class="text-xl sm:text-2xl md:text-3xl font-heading font-black text-slate-800 dark:text-white">Checkout Pembayaran</h1>
            </div>
            ${isStoreClosed ? `
            <div class="p-4 bg-gradient-to-r from-amber-500/15 to-orange-500/15 rounded-2xl border-2 border-amber-400 dark:border-amber-600 flex items-center justify-between gap-3 text-xs shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">🌙</span>
                    <div>
                        <div class="font-black text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                            <span>DAPUR KAMI SEDANG ISTIRAHAT</span>
                            <span class="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px]">TUTUP SEMENTARA</span>
                        </div>
                        <div class="text-[11px] text-amber-800/80 dark:text-amber-300 mt-0.5">${escapeHtml(storeOpStatus.tooltip || 'Dapur kami sedang istirahat. Silakan pesan terjadwal untuk esok hari.')}</div>
                        <div class="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-1">💡 Anda tetap dapat memesan! Jadwal pengantaran otomatis dialihkan ke Pre-Order di bawah ini.</div>
                    </div>
                </div>
            </div>
            ` : ''}
            <div class="grid lg:grid-cols-3 gap-6">
                <form id="checkout-form" class="lg:col-span-2 space-y-6" onsubmit="submitCheckout(event)">
                    ${!isDineIn ? `
                    <!-- TOGGLE TIPE PEMESANAN: PESAN ANTAR VS AMBIL SENDIRI -->
                    <div class="p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-2 gap-1.5 shadow-inner">
                        <button type="button" id="tab-order-type-delivery" onclick="setCheckoutOrderType('delivery')"
                            class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all ${!isPickup ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'}">
                            <span class="text-base">🛵</span>
                            <span>Pesan Antar (Delivery)</span>
                        </button>
                        <button type="button" id="tab-order-type-pickup" onclick="setCheckoutOrderType('pickup')"
                            class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all ${isPickup ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'}">
                            <span class="text-base">🥡</span>
                            <span>Ambil Sendiri (Takeaway)</span>
                        </button>
                    </div>
                    ` : ''}

                    <div class="clay-card p-6">
                        <h3 class="font-black text-slate-800 dark:text-white mb-4" id="co-address-card-title">${isPickup ? 'Informasi Pengambilan Pesanan' : 'Alamat Pengiriman &amp; Lokasi'}</h3>
                        <div class="space-y-4">
                            ${isDineIn ? `
                            <div class="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 rounded-2xl border-2 border-amber-400 dark:border-amber-600 flex items-center justify-between gap-3 text-xs mb-3 shadow-sm">
                                <div class="flex items-center gap-3">
                                    <span class="text-3xl">🍽️</span>
                                    <div>
                                        <div class="font-black text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                                            <span>MODE MAKAN DI TEMPAT (DINE-IN)</span>
                                            <span class="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-xs">MEJA #${escapeHtml(dineInTable)}</span>
                                        </div>
                                        <div class="text-[11px] text-amber-800/80 dark:text-amber-300 mt-0.5">Pesanan langsung disiapkan dan diantar ke meja Anda di restoran. Bebas ongkir!</div>
                                    </div>
                                </div>
                                <button type="button" onclick="sessionStorage.removeItem('digiarju_dine_in_table'); sessionStorage.removeItem('mangan_dine_in_table'); renderCheckout();" class="text-[11px] font-bold text-red-500 hover:text-red-700 underline flex-shrink-0">Ganti ke Antar</button>
                            </div>
                            ` : ''}

                            <!-- KOTAK INFORMASI AMBIL SENDIRI (TAKEAWAY) -->
                            <div id="co-pickup-info-box" class="${isPickup ? '' : 'hidden'} p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/60 space-y-3 shadow-sm">
                                <div class="flex items-start justify-between gap-3">
                                    <div class="flex items-start gap-3">
                                        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl flex-shrink-0">
                                            🥡
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-2 flex-wrap">
                                                <span class="font-black text-slate-800 dark:text-white text-sm">AMBIL SENDIRI DI RESTO (TAKEAWAY)</span>
                                                <span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-[10px] border border-emerald-300 dark:border-emerald-800">Rp 0 BEBAS ONGKIR</span>
                                            </div>
                                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pesanan disiapkan langsung oleh dapur restoran kami. Anda tinggal datang mengambil tanpa biaya ongkir!</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 space-y-1.5 text-xs">
                                    <div class="flex items-center justify-between">
                                        <span class="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">Lokasi Outlet Pengambilan:</span>
                                        <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <span>⏱️ Siap dalam ~15-20 Menit</span>
                                        </span>
                                    </div>
                                    <div class="font-black text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                                        <span>📍</span><span id="co-pickup-branch-name">${escapeHtml(activeBranch.name)}</span>
                                    </div>
                                    <p class="text-[11px] text-slate-600 dark:text-slate-300" id="co-pickup-branch-addr">${escapeHtml(activeBranch.address || '')}</p>
                                    <div class="pt-1 flex items-center justify-between gap-2 flex-wrap">
                                        <a href="https://www.google.com/maps/dir/?api=1&destination=${activeBranch.lat},${activeBranch.lng}" target="_blank" class="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline">
                                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                            <span>Petunjuk Arah Google Maps</span>
                                        </a>
                                        <span class="text-[10px] text-slate-400">Tunjukkan No. Pesanan ke kasir saat tiba</span>
                                    </div>
                                </div>
                            </div>

                            <div id="co-branch-routing-display" class="${isPickup ? 'hidden' : ''} p-3.5 bg-orange-50/80 dark:bg-slate-800/90 rounded-2xl border border-purple-200/80 dark:border-slate-700 flex items-center justify-between gap-3 text-xs mb-3">
                                <div class="flex items-center gap-2.5">
                                    <span class="text-2xl flex-shrink-0">🍳</span>
                                    <div>
                                        <span class="font-bold text-slate-500 dark:text-slate-400 block text-[10px]">${cartKitchen ? 'PESANAN DIOLAH DI DAPUR CABANG:' : 'PESANAN DILAYANI CABANG TERDEKAT:'}</span>
                                        <span class="font-black text-slate-800 dark:text-white text-xs" id="co-branch-name-text">${escapeHtml(activeBranch.name)}</span>
                                        <span class="text-[10px] text-slate-400 block mt-0.5" id="co-branch-addr-text">${escapeHtml(activeBranch.address || '')} (Jarak ~<span id="co-branch-dist-text">${initialGpsDist.toFixed(1)}</span> km)</span>
                                    </div>
                                </div>
                                <span class="px-2.5 py-1 rounded-full ${cartKitchen ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'} font-black text-[10px] flex-shrink-0">${cartKitchen ? 'Kunci Dapur Menu' : 'Auto-Routing GPS'}</span>
                            </div>

                            <input required id="co-name" value="${escapeHtml(profile?.name || '')}" placeholder="Nama Pemesan / Penerima *" class="w-full px-5 py-3.5 clay-input text-sm">
                            <input required id="co-phone" value="${escapeHtml(profile?.phone || '')}" placeholder="Nomor WhatsApp / HP Pemesan *" class="w-full px-5 py-3.5 clay-input text-sm">
                            
                            <!-- SEKSI ALAMAT KHUSUS PENGIRIMAN ANTAR -->
                            <div id="co-delivery-address-section" class="${isPickup ? 'hidden' : ''} space-y-4">
                                <div>
                                    <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                                        <span>Pilih Area / Wilayah Alamat:</span>
                                        <span class="text-[10px] text-slate-400 font-normal">Opsi cepat wilayah</span>
                                    </label>
                                    <select id="co-address-dropdown" onchange="handleAddressDropdownChange(this, 'co-address')" class="w-full px-5 py-3.5 clay-select text-sm font-bold">
                                        <option value="">-- Pilih Wilayah / Area Alamat --</option>
                                        ${addressOptions.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
                                    </select>
                                </div>

                                <div>
                                    <div class="flex items-center justify-between mb-1.5">
                                        <label class="block text-xs font-bold text-slate-600 dark:text-slate-300">Alamat Lengkap Pengantaran *</label>
                                        <div class="flex items-center gap-1.5">
                                            <button type="button" onclick="detectGPSLocation('co-address', event)" class="px-2.5 py-1 clay-btn text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:text-orange-700 transition-colors" title="Deteksi titik lokasi dari GPS">
                                                <svg class="svg-icon w-3 h-3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="12 8 8 12 12 16 12 8"></polygon></svg>
                                                <span>GPS</span>
                                            </button>
                                            <button type="button" onclick="openMapsPickerModal('co-address', event)" class="px-2.5 py-1 clay-btn text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:text-emerald-700 transition-colors" title="Buka peta untuk menentukan titik alamat">
                                                <svg class="svg-icon w-3 h-3" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                <span>Pilih di Maps</span>
                                            </button>
                                        </div>
                                    </div>
                                    <textarea ${isPickup ? '' : 'required'} id="co-address" rows="3" placeholder="Alamat lengkap (nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, patokan) *" class="w-full px-5 py-3.5 clay-textarea text-sm">${escapeHtml(isDineIn ? `Makan di Tempat - Meja #${dineInTable}` : (profile?.address || ''))}</textarea>
                                    
                                    <div id="co-maps-pin-display" class="${profile?.mapsUrl ? '' : 'hidden'} mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 text-xs flex items-center justify-between gap-2">
                                        <span class="truncate flex items-center gap-1.5"><span class="flex-shrink-0">📍</span> <span id="co-maps-pin-text">${profile?.mapsUrl ? `<a href="${profile.mapsUrl}" target="_blank" class="underline font-bold">Titik Google Maps Terpasang</a>` : ''}</span></span>
                                        <button type="button" onclick="clearMapsPin('co-address')" class="text-rose-500 hover:text-rose-700 font-bold text-[11px] flex-shrink-0">Hapus Pin</button>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-1.5">
                                <div class="flex items-center justify-between">
                                    <label class="block text-xs font-bold text-slate-600 dark:text-slate-300">Catatan Khusus Dapur &amp; Alergi:</label>
                                    <span class="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Klik chip untuk tambah cepat</span>
                                </div>
                                <div class="flex flex-wrap gap-1.5">
                                    <button type="button" onclick="appendQuickKitchenNote('🌶️ Sambal Dipisah')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-purple-100 hover:border-purple-300 transition-colors">+ 🌶️ Sambal Dipisah</button>
                                    <button type="button" onclick="appendQuickKitchenNote('🌿 Tanpa Bawang')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-purple-100 hover:border-purple-300 transition-colors">+ 🌿 Tanpa Bawang</button>
                                    <button type="button" onclick="appendQuickKitchenNote('🌱 Bebas MSG')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-purple-100 hover:border-purple-300 transition-colors">+ 🌱 Bebas MSG</button>
                                    <button type="button" onclick="appendQuickKitchenNote('🥢 Tanpa Sendok Plastik')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-purple-100 hover:border-purple-300 transition-colors">+ 🥢 Bebas Plastik</button>
                                    <button type="button" onclick="appendQuickKitchenNote('🚫 Alergi Seafood')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors">+ 🚫 Alergi Seafood</button>
                                    <button type="button" onclick="appendQuickKitchenNote('🚫 Alergi Kacang')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors">+ 🚫 Alergi Kacang</button>
                                </div>
                                <textarea id="co-note" rows="2" placeholder="Catatan khusus dapur / petunjuk kurir (contoh: kurangi pedas, titip di sekuriti)" class="w-full px-5 py-3.5 clay-textarea text-sm"></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="clay-card p-6" id="co-delivery-options-card">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-black text-slate-800 dark:text-white" id="co-delivery-card-title">${isPickup ? 'Waktu &amp; Status Pengambilan' : 'Pilihan Pengantaran &amp; Biaya Antar'}</h3>
                            <span class="text-xs font-bold ${isFreeShipping ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600'}" id="co-shipping-free-badge">
                                ${isPickup ? '<span class="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center gap-1">🥡 BEBAS ONGKIR (TAKEAWAY)</span>' : (isFreeShipping ? `<span class="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center gap-1">🚚 GRATIS ONGKIR</span>` : `<svg class="svg-icon w-4 h-4" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg><span>Cek Ongkir Dinamis</span>`)}
                            </span>
                        </div>
                        
                        <div class="space-y-4">
                            <!-- BAGIAN KURIR & DESTINASI (DISEMBUNYIKAN JIKA AMBIL SENDIRI / TAKEAWAY) -->
                            <div id="co-courier-selection-wrap" class="${isPickup ? 'hidden' : ''} space-y-4">
                                <!-- SMART AUTO-HIDE: INFO GPS OTOMATIS VS DROPDOWN MANUAL FALLBACK -->
                                <div id="co-destination-gps-info-wrap" class="${hasGpsPin ? '' : 'hidden'} p-3.5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-emerald-500/10 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-between gap-3 text-xs">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm flex-shrink-0">
                                            📍
                                        </div>
                                        <div class="min-w-0">
                                            <div class="flex items-center gap-1.5 flex-wrap">
                                                <span class="font-black text-slate-800 dark:text-white text-xs">Jarak Terhitung GPS:</span>
                                                <span class="px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[10px]" id="co-gps-detected-km">~${initialGpsDist.toFixed(1)} km</span>
                                                <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">Otomatis Presisi</span>
                                            </div>
                                            <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5" id="co-gps-routing-desc">
                                                Dihitung otomatis dari Cabang <strong class="text-slate-700 dark:text-slate-200">${escapeHtml(activeBranch.name)}</strong> ke titik Pin Anda
                                            </p>
                                        </div>
                                    </div>
                                    <button type="button" onclick="openMapsPickerModal('co-address', event)" class="px-2.5 py-1.5 rounded-xl clay-btn text-[10px] font-black text-purple-600 hover:text-purple-800 transition-colors flex-shrink-0" title="Sesuaikan titik pin peta">
                                        Ubah Pin
                                    </button>
                                </div>

                                <div id="co-destination-manual-wrap" class="${hasGpsPin ? 'hidden' : ''}">
                                    <div class="flex items-center justify-between mb-1.5">
                                        <label class="block text-xs font-bold text-slate-600 dark:text-slate-300">Pilih Radius / Jarak Antar Manual *</label>
                                        <span class="text-[10px] text-slate-400 font-normal">Cadangan tanpa GPS</span>
                                    </div>
                                    <select id="co-destination" onchange="updateCheckoutShipping()" class="w-full px-5 py-3.5 clay-select text-sm font-bold">
                                        ${destinations.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('')}
                                    </select>
                                    <div class="mt-2 p-2.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/50 flex items-center justify-between gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                                        <span class="flex items-center gap-1.5">
                                            <span>💡</span><span>Ingin ongkir presisi per-km? Aktifkan titik GPS lokasi Anda:</span>
                                        </span>
                                        <button type="button" onclick="detectGPSLocation('co-address', event)" class="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-black text-[10px] hover:bg-amber-600 transition-colors flex-shrink-0 shadow-xs">
                                            Aktifkan GPS
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Pilihan Kurir Antar *</label>
                                    <select id="co-courier" onchange="updateCheckoutShipping(); handleCourierChange();" class="w-full px-5 py-3.5 clay-select text-sm font-bold">
                                        ${SHIPPING_COURIERS.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
                                    </select>
                                    
                                    <div id="co-arjugo-live-badge" class="mt-2.5 p-3 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-rose-500/10 rounded-2xl border border-orange-300/80 dark:border-orange-800/60 flex items-center justify-between gap-2.5 text-xs">
                                        <div class="flex items-center gap-2.5 min-w-0">
                                            <span class="relative flex h-2.5 w-2.5 flex-shrink-0">
                                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                                            </span>
                                            <div class="text-[11px] text-orange-950 dark:text-orange-200">
                                                <strong class="font-black text-orange-800 dark:text-orange-300">ArjuGo Radar Live GPS:</strong> Posisi kurir terpantau satelit secara live &amp; real-time setelah pesanan siap!
                                            </div>
                                        </div>
                                        <span class="px-2 py-0.5 rounded-full bg-orange-500 text-white font-black text-[9px] uppercase tracking-wider flex-shrink-0 shadow-xs">Aktif</span>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Layanan &amp; Waktu Pengantaran *</label>
                                    <select id="co-service" onchange="updateCheckoutShipping(); syncServiceRadio();" class="hidden">
                                        <option value="reg" selected>Standar (25-40 Menit)</option>
                                        <option value="express">Prioritas Hangat (15-25 Menit)</option>
                                    </select>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div id="service-card-reg" onclick="selectShippingService('reg')" class="p-3.5 rounded-2xl border-2 border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 cursor-pointer transition-all flex items-start gap-3 shadow-sm">
                                            <input type="radio" name="co-service-radio" id="service-radio-reg" checked class="accent-purple-600 w-4 h-4 mt-0.5 flex-shrink-0">
                                            <div>
                                                <span class="font-bold text-slate-800 dark:text-white text-xs block">Standar (25-40 Menit)</span>
                                                <span class="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Pengantaran reguler dapur ke alamat Anda</span>
                                            </div>
                                        </div>
                                        <div id="service-card-express" onclick="selectShippingService('express')" class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 cursor-pointer hover:border-purple-300 transition-all flex items-start gap-3">
                                            <input type="radio" name="co-service-radio" id="service-radio-express" class="accent-purple-600 w-4 h-4 mt-0.5 flex-shrink-0">
                                            <div>
                                                <div class="flex items-center gap-1.5">
                                                    <span class="font-bold text-slate-800 dark:text-white text-xs">Prioritas Hangat</span>
                                                    <span class="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[9px] font-black">+Rp 5rb</span>
                                                </div>
                                                <span class="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">15-25 Menit &#8226; Prioritas antrean masak &amp; antar</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="p-3.5 bg-orange-50/70 dark:bg-slate-800/80 rounded-2xl border border-purple-200/60 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-bold text-slate-700 dark:text-slate-300" id="co-shipping-etd">Estimasi: ${isPickup ? 'Siap Diambil di Resto (15-20 Menit)' : '25-40 Menit'}</span>
                                    <span class="text-slate-300 dark:text-slate-600">•</span>
                                    <span class="text-slate-600 dark:text-slate-300 font-bold">Total Menu: <span class="text-purple-600 font-black">${totalItemsCount} porsi</span></span>
                                </div>
                                <div class="text-right">
                                    <span class="text-slate-500 dark:text-slate-400 mr-2">Biaya Antar:</span>
                                    <span id="co-shipping-cost-display" class="${(isFreeShipping || isPickup) ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'} font-black text-sm">
                                        ${isPickup ? '<span class="text-emerald-600 font-black">Rp 0 (BEBAS ONGKIR - TAKEAWAY)</span>' : (isFreeShipping ? (initialNormalFee > 0 ? `<span class="line-through text-slate-400 mr-1 font-normal text-xs">${formatRupiah(initialNormalFee)}</span>` : '') + '<span class="text-emerald-600 font-black">Rp 0 (GRATIS ONGKIR)</span>' : formatRupiah(initialFee))}
                                    </span>
                                </div>
                            </div>

                            <div class="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-700/80">
                                <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2" id="co-delivery-timing-title">${isPickup ? 'Waktu Pengambilan di Resto *' : 'Jadwal Pengantaran Makanan *'}</label>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <label class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 ${isStoreClosed ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'cursor-pointer hover:border-purple-500 bg-white/70 dark:bg-slate-800/80'} transition-colors">
                                        <input type="radio" name="co-delivery-timing" value="now" ${isStoreClosed ? 'disabled' : 'checked'} onchange="document.getElementById('co-scheduled-time-wrap').classList.add('hidden')" class="accent-purple-600 w-4 h-4">
                                        <div class="text-xs">
                                            <span class="font-bold block text-slate-800 dark:text-white" id="co-timing-now-label">${isPickup ? '🚀 Siap Segera (Ambil 15-20 Menit)' : '🚀 Kirim Sekarang'} ${isStoreClosed ? '<span class="text-rose-500 font-normal text-[10px]">(Tutup)</span>' : ''}</span>
                                            <span class="text-[10px] text-slate-400" id="co-timing-now-desc">${isPickup ? 'Langsung dimasak &amp; siap diambil saat Anda tiba' : 'Langsung dimasak &amp; diantar (20-35 mnt)'}</span>
                                        </div>
                                    </label>
                                    <label class="flex items-center gap-2.5 p-3 rounded-xl border ${isStoreClosed ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40' : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80'} cursor-pointer hover:border-purple-500 transition-colors">
                                        <input type="radio" name="co-delivery-timing" value="scheduled" ${isStoreClosed ? 'checked' : ''} onchange="document.getElementById('co-scheduled-time-wrap').classList.remove('hidden')" class="accent-purple-600 w-4 h-4">
                                        <div class="text-xs">
                                            <span class="font-bold block text-slate-800 dark:text-white">⏰ Jadwalkan Jam (Pre-Order)</span>
                                            <span class="text-[10px] text-slate-400">Pesan untuk jam makan tertentu / esok</span>
                                        </div>
                                    </label>
                                </div>
                                <div id="co-scheduled-time-wrap" class="${isStoreClosed ? '' : 'hidden'} mt-3 p-3 bg-orange-50/70 dark:bg-slate-800/80 rounded-xl border border-purple-200 dark:border-slate-700">
                                    <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Jam Pengantaran / Pengambilan:</label>
                                    <select id="co-scheduled-time" class="w-full px-4 py-2.5 clay-select text-xs font-bold">
                                        <option value="11:30 WIB">11:30 WIB (Makan Siang Awal)</option>
                                        <option value="12:00 WIB" selected>12:00 WIB (Makan Siang)</option>
                                        <option value="12:30 WIB">12:30 WIB (Makan Siang)</option>
                                        <option value="13:00 WIB">13:00 WIB (Makan Siang)</option>
                                        <option value="17:30 WIB">17:30 WIB (Makan Sore)</option>
                                        <option value="18:30 WIB">18:30 WIB (Makan Malam)</option>
                                        <option value="19:30 WIB">19:30 WIB (Makan Malam)</option>
                                        <option value="20:00 WIB">20:00 WIB (Makan Malam)</option>
                                        <option value="Besok Siang 12:00 WIB">Pre-Order Besok Siang (12:00 WIB)</option>
                                        <option value="Besok Malam 18:30 WIB">Pre-Order Besok Malam (18:30 WIB)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="clay-card p-6">
                        <h3 class="font-black text-slate-800 dark:text-white mb-4">Metode Pembayaran</h3>
                        <div class="space-y-3">
                            ${paymentMethods.map((pm, idx) => `
                            <label class="flex items-start gap-3 p-3.5 clay-btn cursor-pointer">
                                <input type="radio" name="payment" value="${escapeHtml(pm.name)}" ${idx === 0 ? 'checked' : ''} class="accent-purple-600 w-4 h-4 mt-0.5 flex-shrink-0">
                                <div class="flex-grow min-w-0">
                                    <span class="text-sm font-bold block text-slate-800 dark:text-slate-200">${escapeHtml(pm.name)}</span>
                                    ${pm.desc ? `<span class="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">${escapeHtml(pm.desc)}</span>` : ''}
                                </div>
                            </label>
                            `).join('')}
                        </div>
                    </div>
                </form>

                <div class="clay-card p-6 h-fit sticky top-24">
                    <h3 class="font-black text-slate-800 dark:text-white mb-4">Ringkasan Pesanan</h3>
                    <div class="space-y-3 mb-4 max-h-56 overflow-y-auto custom-scroll">
                        ${items.map(it => `
                        <div class="flex justify-between items-start text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <div class="pr-2">
                                <span class="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">${escapeHtml((it.product && it.product.name) ? it.product.name : 'Menu Resto')}</span>
                                <div class="flex items-center gap-1.5 mt-0.5">
                                    ${(it.size || it.color) ? `<span class="text-[10px] text-purple-600 dark:text-purple-400 font-bold">[${[it.size ? 'Porsi: ' + escapeHtml(it.size) : '', it.color ? 'Rasa/Level: ' + escapeHtml(it.color) : ''].filter(Boolean).join(' / ')}]</span>` : ''}
                                </div>
                                <span class="text-[11px] text-slate-400">x${it.qty}</span>
                            </div>
                            <span class="flex-shrink-0 font-bold text-slate-700 dark:text-slate-300">${formatRupiah(((it.product && it.product.price) ? it.product.price : 0) * it.qty)}</span>
                        </div>`).join('')}
                    </div>

                    <div class="my-3 p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-500/30 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-xl">&#11088;</span>
                            <div>
                                <span class="text-xs font-black text-slate-800 dark:text-white block">Poin Loyalitas Anda</span>
                                <span class="text-[10px] text-slate-500 dark:text-slate-400">Tersedia <strong class="text-amber-500 font-bold" id="co-loyalty-pts-text">${getYukFoodLoyaltyPoints()}</strong> Poin</span>
                            </div>
                        </div>
                        <label class="flex items-center gap-1.5 cursor-pointer select-none">
                            <input type="checkbox" id="co-use-loyalty-points" onchange="toggleLoyaltyPointsDiscount()" class="w-4 h-4 text-majidfood-red rounded focus:ring-0" ${getYukFoodLoyaltyPoints() < 20 ? 'disabled' : ''} />
                            <span class="text-[11px] font-bold ${getYukFoodLoyaltyPoints() < 20 ? 'text-gray-400' : 'text-majidfood-red'}">Tukar 20 Poin (-Rp 10.000)</span>
                        </label>
                    </div>

                    <div class="my-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                        <div class="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                            <span>🎟️</span><span>Kupon / Voucher Diskon:</span>
                        </div>
                        ${APPLIED_COUPON ? `
                        <div class="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs">
                            <div>
                                <span class="font-extrabold text-emerald-700 dark:text-emerald-400 block">${APPLIED_COUPON.code}</span>
                                <span class="text-[10px] text-emerald-600 dark:text-emerald-300">${APPLIED_COUPON.desc || ''}</span>
                            </div>
                            <button type="button" onclick="removeCouponCode(); renderCheckout();" class="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-0.5">Hapus</button>
                        </div>
                        ` : `
                        <div class="flex gap-2">
                            <input type="text" id="co-coupon-input" placeholder="Kode kupon..." class="flex-grow px-3 py-1.5 clay-input text-xs uppercase font-bold text-slate-700">
                            <button type="button" onclick="const code = document.getElementById('co-coupon-input').value; if(applyCouponCode(code, ${subtotal}, initialFee)) renderCheckout();" class="px-3 py-1.5 clay-btn-primary text-xs font-black">Pakai</button>
                        </div>
                        `}
                    </div>

                    <div class="border-t border-dashed border-slate-300/50 dark:border-slate-600/50 pt-4 space-y-2 mb-6">
                        <div class="flex justify-between text-sm text-slate-500 dark:text-slate-400"><span>Subtotal Produk</span><span>${formatRupiah(subtotal)}</span></div>
                        <div class="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                            <span>Ongkos Kirim</span>
                            <span id="co-summary-ongkir" class="${isFreeShipping ? 'text-emerald-600 font-bold' : 'text-purple-600 font-bold'}">
                                ${isFreeShipping ? (initialNormalFee > 0 ? `<span class="line-through text-slate-400 mr-1 text-xs font-normal">${formatRupiah(initialNormalFee)}</span>` : '') + 'Rp 0 (GRATIS)' : formatRupiah(initialFee)}
                            </span>
                        </div>
                        <div id="co-summary-combo-row" class="flex justify-between text-sm text-rose-600 dark:text-rose-400 font-bold ${comboDiscount > 0 ? '' : 'hidden'}">
                            <span>Diskon Paket Combo</span>
                            <span id="co-summary-combo-val">-${formatRupiah(comboDiscount)}</span>
                        </div>
                        <div id="co-summary-coupon-row" class="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-bold ${APPLIED_COUPON ? '' : 'hidden'}">
                            <span>Diskon Voucher <span id="co-summary-coupon-code">${APPLIED_COUPON ? `(${APPLIED_COUPON.code})` : ''}</span></span>
                            <span id="co-summary-coupon-val">-${formatRupiah(APPLIED_COUPON ? calculateCouponDiscount(APPLIED_COUPON, subtotal, initialFee) : 0)}</span>
                        </div>
                        <div id="co-summary-loyalty-row" class="flex justify-between text-sm text-amber-600 dark:text-amber-400 font-bold hidden">
                            <span>Diskon Poin Loyalitas</span>
                            <span id="co-summary-loyalty-val">-Rp 0</span>
                        </div>
                        <div class="flex justify-between font-black text-lg text-slate-800 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span>Total Tagihan</span>
                            <span id="co-summary-total" class="text-purple-600 dark:text-purple-400">${formatRupiah(Math.max(0, subtotal + initialFee - comboDiscount - (APPLIED_COUPON ? calculateCouponDiscount(APPLIED_COUPON, subtotal, initialFee) : 0)))}</span>
                        </div>
                    </div>

                    <div class="hidden md:block">
                        <button type="submit" form="checkout-form" class="w-full px-6 py-4 clay-btn-primary font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all">
                            <svg class="svg-icon w-4 h-4" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                            <span>Lanjut ke Pembayaran</span>
                        </button>
                        <p class="text-[11px] text-slate-400 text-center mt-2">Pilih metode pembayaran dan konfirmasi rincian sebelum dikirim ke WhatsApp.</p>
                    </div>
                </div>
            </div>

            <div id="checkout-floating-action-bar" class="md:hidden fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-[140] transition-all duration-300">
                <div class="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-purple-400/40 backdrop-blur-md pointer-events-auto hover:shadow-purple-500/25 transition-all">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="relative w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-xl">
                            <span>💬</span>
                            <span class="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-black h-5 min-w-[20px] px-1 rounded-full border-2 border-white flex items-center justify-center">${items.length}</span>
                        </div>
                        <div class="min-w-0">
                            <div class="text-xs font-medium text-orange-100">Total Tagihan</div>
                            <div class="text-sm sm:text-base font-black truncate" id="co-floating-total">${formatRupiah(Math.max(0, subtotal + initialFee - comboDiscount - (APPLIED_COUPON ? calculateCouponDiscount(APPLIED_COUPON, subtotal, initialFee) : 0)))}</div>
                        </div>
                    </div>
                    <button type="submit" form="checkout-form" class="px-4 sm:px-5 py-2.5 bg-white text-purple-600 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md flex-shrink-0 hover:bg-orange-50 active:scale-95 transition-all">
                        <svg class="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                        <span>Lanjut Bayar</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </div>
        </section>`;
    }

    
    function toggleLoyaltyPointsDiscount() {
        const cb = document.getElementById('co-use-loyalty-points');
        const points = getYukFoodLoyaltyPoints();
        const subtotal = window.__checkoutSubtotal || 0;
        if (cb && cb.checked) {
            if (points < 10) {
                cb.checked = false;
                showToast('Poin tidak mencukupi (Minimal 10 poin)', '#ef4444');
                return;
            }
            const maxDisc = Math.floor(subtotal * 0.5);
            const usablePts = Math.min(points, Math.max(10, Math.floor(maxDisc / 500)));
            window.__checkoutLoyaltyPointsUsed = usablePts;
            window.__checkoutLoyaltyDiscount = usablePts * 500;
            showToast(`Poin loyalitas digunakan: ${usablePts} Poin (-${formatRupiah(usablePts * 500)})`, '#10b981');
        } else {
            window.__checkoutLoyaltyPointsUsed = 0;
            window.__checkoutLoyaltyDiscount = 0;
        }
        if (typeof updateCheckoutShipping === 'function') {
            updateCheckoutShipping();
        }
    }

    window.setCheckoutOrderType = function(type) {
        window.__checkoutOrderType = type;
        const tabDelivery = document.getElementById('tab-order-type-delivery');
        const tabPickup = document.getElementById('tab-order-type-pickup');
        const addressSection = document.getElementById('co-delivery-address-section');
        const branchRouting = document.getElementById('co-branch-routing-display');
        const pickupBox = document.getElementById('co-pickup-info-box');
        const addressCardTitle = document.getElementById('co-address-card-title');
        const addressInput = document.getElementById('co-address');
        const courierWrap = document.getElementById('co-courier-selection-wrap');
        const cardTitle = document.getElementById('co-delivery-card-title');
        const timingTitle = document.getElementById('co-delivery-timing-title');
        const timingNowLabel = document.getElementById('co-timing-now-label');
        const timingNowDesc = document.getElementById('co-timing-now-desc');
        const freeBadge = document.getElementById('co-shipping-free-badge');

        if (type === 'pickup') {
            if (tabPickup) {
                tabPickup.className = "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md";
            }
            if (tabDelivery) {
                tabDelivery.className = "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60";
            }
            if (pickupBox) pickupBox.classList.remove('hidden');
            if (addressSection) addressSection.classList.add('hidden');
            if (branchRouting) branchRouting.classList.add('hidden');
            if (addressCardTitle) addressCardTitle.textContent = 'Informasi Pengambilan Pesanan';
            if (addressInput) {
                addressInput.removeAttribute('required');
            }
            if (courierWrap) courierWrap.classList.add('hidden');
            if (cardTitle) cardTitle.textContent = 'Waktu & Status Pengambilan';
            if (timingTitle) timingTitle.textContent = 'Waktu Pengambilan di Resto *';
            if (timingNowLabel) timingNowLabel.textContent = '🚀 Siap Segera (Ambil 15-20 Menit)';
            if (timingNowDesc) timingNowDesc.textContent = 'Langsung dimasak & siap diambil saat Anda tiba';
            if (freeBadge) {
                freeBadge.innerHTML = '<span class="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center gap-1">🥡 BEBAS ONGKIR (TAKEAWAY)</span>';
            }
        } else {
            if (tabDelivery) {
                tabDelivery.className = "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md";
            }
            if (tabPickup) {
                tabPickup.className = "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60";
            }
            if (pickupBox) pickupBox.classList.add('hidden');
            if (addressSection) addressSection.classList.remove('hidden');
            if (branchRouting) branchRouting.classList.remove('hidden');
            if (addressCardTitle) addressCardTitle.textContent = 'Alamat Pengiriman & Lokasi';
            if (addressInput) {
                addressInput.setAttribute('required', 'required');
            }
            if (courierWrap) courierWrap.classList.remove('hidden');
            if (cardTitle) cardTitle.textContent = 'Pilihan Pengantaran & Biaya Antar';
            if (timingTitle) timingTitle.textContent = 'Jadwal Pengantaran Makanan *';
            if (timingNowLabel) timingNowLabel.textContent = '🚀 Kirim Sekarang';
            if (timingNowDesc) timingNowDesc.textContent = 'Langsung dimasak & diantar (20-35 mnt)';
            if (freeBadge) {
                const isFreeShipping = !!window.__checkoutIsFreeShipping;
                freeBadge.innerHTML = isFreeShipping 
                    ? '<span class="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center gap-1">🚚 GRATIS ONGKIR</span>'
                    : '<svg class="svg-icon w-4 h-4" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg><span>Cek Ongkir Dinamis</span>';
            }
        }
        updateCheckoutShipping();
    };

    window.selectShippingService = function(svcId) {
        const serviceEl = document.getElementById('co-service');
        if (serviceEl) serviceEl.value = svcId;
        const cardReg = document.getElementById('service-card-reg');
        const cardExpress = document.getElementById('service-card-express');
        const radioReg = document.getElementById('service-radio-reg');
        const radioExpress = document.getElementById('service-radio-express');

        if (svcId === 'express') {
            if (cardExpress) cardExpress.className = 'p-3.5 rounded-2xl border-2 border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 cursor-pointer transition-all flex items-start gap-3 shadow-sm';
            if (cardReg) cardReg.className = 'p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 cursor-pointer hover:border-purple-300 transition-all flex items-start gap-3';
            if (radioExpress) radioExpress.checked = true;
            if (radioReg) radioReg.checked = false;
        } else {
            if (cardReg) cardReg.className = 'p-3.5 rounded-2xl border-2 border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 cursor-pointer transition-all flex items-start gap-3 shadow-sm';
            if (cardExpress) cardExpress.className = 'p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 cursor-pointer hover:border-purple-300 transition-all flex items-start gap-3';
            if (radioReg) radioReg.checked = true;
            if (radioExpress) radioExpress.checked = false;
        }
        updateCheckoutShipping();
    };

    window.syncServiceRadio = function() {
        const serviceEl = document.getElementById('co-service');
        if (serviceEl) {
            window.selectShippingService(serviceEl.value);
        }
    };

    window.handleCourierChange = function() {
        const courierEl = document.getElementById('co-courier');
        const arjugoBadge = document.getElementById('co-arjugo-live-badge');
        if (courierEl && arjugoBadge) {
            if (courierEl.value === 'arjugo') {
                arjugoBadge.classList.remove('hidden');
            } else {
                arjugoBadge.classList.add('hidden');
            }
        }
        updateCheckoutShipping();
    };

    function updateCheckoutShipping() {
        const isFreeShipping = !!window.__checkoutIsFreeShipping;
        const isDineIn = !!(sessionStorage.getItem('digiarju_dine_in_table') || sessionStorage.getItem('mangan_dine_in_table'));
        const dineInTable = sessionStorage.getItem('digiarju_dine_in_table') || sessionStorage.getItem('mangan_dine_in_table') || '';
        const orderType = isDineIn ? 'dine_in' : (window.__checkoutOrderType || 'delivery');
        const isPickup = (orderType === 'pickup');

        const destId = document.getElementById('co-destination')?.value || 'jabodetabek';
        const serviceId = document.getElementById('co-service')?.value || 'reg';
        const destinations = getShippingDestinations();
        const dest = destinations.find(d => d.id === destId) || destinations[0] || { reg: 10000, express: 15000, cargo: 8000, etd: '25-40 Menit' };

        const hasGpsPin = !!(currentActiveMapsPin && currentActiveMapsPin.lat);
        const gpsWrap = document.getElementById('co-destination-gps-info-wrap');
        const manualWrap = document.getElementById('co-destination-manual-wrap');
        const gpsKmBadge = document.getElementById('co-gps-detected-km');
        const gpsRoutingDesc = document.getElementById('co-gps-routing-desc');

        if (gpsWrap && manualWrap) {
            if (hasGpsPin) {
                gpsWrap.classList.remove('hidden');
                manualWrap.classList.add('hidden');
            } else {
                gpsWrap.classList.add('hidden');
                manualWrap.classList.remove('hidden');
            }
        }

        let unitCost = dest.reg;
        let etd = '25-40 Menit';
        if (isDineIn) {
            unitCost = 0;
            etd = `Dine-In (Meja #${dineInTable})`;
        } else if (isPickup || serviceId === 'pickup') {
            unitCost = 0;
            etd = 'Siap Diambil di Resto (15-20 Menit)';
        } else if (hasGpsPin) {
            const originBranch = window.__checkoutSelectedBranch || (typeof getRestaurantBranches === 'function' ? getRestaurantBranches()[0] : RESTAURANT_COORDS);
            const originLat = originBranch.lat || RESTAURANT_COORDS.lat;
            const originLng = originBranch.lng || RESTAURANT_COORDS.lng;
            const gpsDist = calculateHaversineKm(originLat, originLng, currentActiveMapsPin.lat, currentActiveMapsPin.lng);
            const calcGpsFee = calculateFastFoodShippingFee(gpsDist);
            unitCost = (serviceId === 'express') ? (calcGpsFee + 5000) : calcGpsFee;
            etd = `${Math.round(15 + gpsDist * 3)}-${Math.round(25 + gpsDist * 4)} Menit (Jarak GPS dari ${originBranch.name || 'Dapur'} ~${gpsDist.toFixed(1)} km)`;
            window.__checkoutBranchDistanceKm = gpsDist;
            const distTextEl = document.getElementById('co-branch-dist-text');
            if (distTextEl) distTextEl.textContent = gpsDist.toFixed(1);
            if (gpsKmBadge) gpsKmBadge.textContent = `~${gpsDist.toFixed(1)} km`;
            if (gpsRoutingDesc) {
                gpsRoutingDesc.innerHTML = `Dihitung otomatis dari Cabang <strong class="text-slate-700 dark:text-slate-200">${escapeHtml(originBranch.name || 'Dapur')}</strong> ke titik Pin Anda`;
            }
        } else if (serviceId === 'express') {
            unitCost = dest.express || (dest.reg + 5000);
            etd = '15-25 Menit (Prioritas Hangat)';
        }

        const normalShippingFee = unitCost;
        const shippingFee = (isFreeShipping || isPickup || serviceId === 'pickup' || isDineIn) ? 0 : normalShippingFee;
        window.__checkoutNormalShippingFee = normalShippingFee;
        window.__checkoutShippingFee = shippingFee;

        const etdEl = document.getElementById('co-shipping-etd');
        if (etdEl) {
            etdEl.textContent = 'Estimasi: ' + etd;
        }

        const costDisplay = document.getElementById('co-shipping-cost-display');
        if (costDisplay) {
            if (isDineIn) {
                costDisplay.innerHTML = `<span class="text-amber-600 dark:text-amber-400 font-black">Rp 0 (DINE-IN)</span>`;
            } else if (isPickup) {
                costDisplay.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-black">Rp 0 (BEBAS ONGKIR - TAKEAWAY)</span>`;
            } else if (isFreeShipping) {
                costDisplay.innerHTML = `${normalShippingFee > 0 ? `<span class="line-through text-slate-400 mr-1.5 font-normal text-xs">${formatRupiah(normalShippingFee)}</span>` : ''}<span class="text-emerald-600 dark:text-emerald-400 font-black">Rp 0 (GRATIS ONGKIR)</span>`;
            } else {
                costDisplay.textContent = formatRupiah(shippingFee);
            }
        }

        const summaryOngkir = document.getElementById('co-summary-ongkir');
        if (summaryOngkir) {
            if (isDineIn) {
                summaryOngkir.innerHTML = `<span class="text-amber-600 font-bold">Rp 0 (DINE-IN)</span>`;
            } else if (isPickup) {
                summaryOngkir.innerHTML = `<span class="text-emerald-600 font-bold">Rp 0 (Takeaway)</span>`;
            } else if (isFreeShipping) {
                summaryOngkir.innerHTML = `${normalShippingFee > 0 ? `<span class="line-through text-slate-400 mr-1.5 text-xs font-normal">${formatRupiah(normalShippingFee)}</span>` : ''}<span class="text-emerald-600 font-bold">Rp 0 (GRATIS)</span>`;
            } else {
                summaryOngkir.textContent = formatRupiah(shippingFee);
            }
        }

        const subtotal = window.__checkoutSubtotal || 0;
        let couponDiscount = 0;
        if (APPLIED_COUPON) {
            couponDiscount = calculateCouponDiscount(APPLIED_COUPON, subtotal, shippingFee);
            window.__checkoutCouponDiscount = couponDiscount;
        } else {
            window.__checkoutCouponDiscount = 0;
        }

        const loyaltyDiscount = window.__checkoutLoyaltyDiscount || 0;
        const comboDiscount = window.__checkoutComboDiscount || 0;

        const couponRow = document.getElementById('co-summary-coupon-row');
        const couponVal = document.getElementById('co-summary-coupon-val');
        const couponCodeEl = document.getElementById('co-summary-coupon-code');
        if (couponRow && couponVal) {
            if (APPLIED_COUPON && couponDiscount > 0) {
                couponRow.classList.remove('hidden');
                couponVal.textContent = '-' + formatRupiah(couponDiscount);
                if (couponCodeEl) couponCodeEl.textContent = `(${APPLIED_COUPON.code})`;
            } else {
                couponRow.classList.add('hidden');
            }
        }

        const loyaltyRow = document.getElementById('co-summary-loyalty-row');
        const loyaltyVal = document.getElementById('co-summary-loyalty-val');
        if (loyaltyRow && loyaltyVal) {
            if (loyaltyDiscount > 0) {
                loyaltyRow.classList.remove('hidden');
                loyaltyVal.textContent = '-' + formatRupiah(loyaltyDiscount);
            } else {
                loyaltyRow.classList.add('hidden');
            }
        }

        const comboRow = document.getElementById('co-summary-combo-row');
        const comboVal = document.getElementById('co-summary-combo-val');
        if (comboRow && comboVal) {
            if (comboDiscount > 0) {
                comboRow.classList.remove('hidden');
                comboVal.textContent = '-' + formatRupiah(comboDiscount);
            } else {
                comboRow.classList.add('hidden');
            }
        }

        const finalCalculatedTotal = Math.max(0, subtotal + shippingFee - couponDiscount - loyaltyDiscount - comboDiscount);
        const summaryTotal = document.getElementById('co-summary-total');
        if (summaryTotal) {
            summaryTotal.textContent = formatRupiah(finalCalculatedTotal);
        }
        const floatingTotal = document.getElementById('co-floating-total');
        if (floatingTotal) {
            floatingTotal.textContent = formatRupiah(finalCalculatedTotal);
        }
    }

    async function submitCheckout(e) {
        e.preventDefault();
        const allItems = await getCartWithProducts();
        const items = allItems.filter(it => it.selected !== false);
        if (items.length === 0) {
            showToast('Pilih menu yang ingin dibayar terlebih dahulu', '#ef4444');
            navigate('/cart');
            return;
        }
        const isDineIn = !!(sessionStorage.getItem('digiarju_dine_in_table') || sessionStorage.getItem('mangan_dine_in_table'));
        const dineInTable = sessionStorage.getItem('digiarju_dine_in_table') || sessionStorage.getItem('mangan_dine_in_table') || '';
        const isFreeShipping = !!window.__checkoutIsFreeShipping;
        const orderType = isDineIn ? 'Dine-In' : ((window.__checkoutOrderType === 'pickup') ? 'Pickup' : 'Delivery');
        const isPickup = (orderType === 'Pickup');

        const name = document.getElementById('co-name') ? document.getElementById('co-name').value.trim() : '';
        const phone = document.getElementById('co-phone') ? document.getElementById('co-phone').value.trim() : '';
        let address = document.getElementById('co-address') ? document.getElementById('co-address').value.trim() : '';

        const cartKitchen = items.length > 0 ? getProductKitchenInfo(items[0].product || items[0]) : null;
        const nearestBranchInfo = (currentActiveMapsPin && currentActiveMapsPin.lat) 
            ? findNearestRestaurantBranch(currentActiveMapsPin.lat, currentActiveMapsPin.lng)
            : { branch: getRestaurantBranches()[0], distanceKm: 1.0 };
        const selectedBranch = cartKitchen || window.__checkoutSelectedBranch || nearestBranchInfo.branch;

        if (isPickup && !address) {
            address = `Ambil Sendiri di Resto: ${selectedBranch.name} (${selectedBranch.address || ''})`;
        }

        const note = document.getElementById('co-note') ? document.getElementById('co-note').value.trim() : '';
        const paymentRadio = document.querySelector('input[name="payment"]:checked');
        const payment = paymentRadio ? paymentRadio.value : 'COD (Bayar di Tempat)';

        if (!name || !phone || (!address && !isPickup)) {
            showToast('Mohon lengkapi data pemesanan', '#ef4444');
            return;
        }

        const destEl = document.getElementById('co-destination');
        const courierEl = document.getElementById('co-courier');
        const serviceEl = document.getElementById('co-service');

        let shippingDestination = destEl ? destEl.options[destEl.selectedIndex].text : 'Sekitar Resto';
        let shippingCourier = courierEl ? courierEl.options[courierEl.selectedIndex].text : 'ArjuGo Express';
        let shippingService = serviceEl ? serviceEl.options[serviceEl.selectedIndex].text : 'Standar (25-40 Menit)';
        let shippingFee = window.__checkoutShippingFee !== undefined ? window.__checkoutShippingFee : (isFreeShipping ? 0 : 10000);

        if (isDineIn) {
            shippingDestination = `Makan di Tempat (Meja #${dineInTable})`;
            shippingCourier = 'Pelayan Resto';
            shippingService = 'Dine-In';
            shippingFee = 0;
        } else if (isPickup) {
            shippingDestination = `Ambil di Resto (${selectedBranch.name})`;
            shippingCourier = 'Ambil Sendiri (Takeaway)';
            shippingService = 'Takeaway di Resto';
            shippingFee = 0;
        } else if (currentActiveMapsPin && currentActiveMapsPin.lat) {
            shippingDestination = `Rute GPS (~${branchDistKm.toFixed(1)} km dari ${selectedBranch.name})`;
        }

        const deliveryTimingType = document.querySelector('input[name="co-delivery-timing"]:checked')?.value || 'now';
        const scheduledTime = document.getElementById('co-scheduled-time')?.value || '12:00 WIB';

        const storeOp = getRestaurantOperatingStatus();
        if (!storeOp.isOpen && deliveryTimingType === 'now') {
            showToast('Dapur kami sedang istirahat. Silakan pilih opsi Jadwal Pengantaran (Pre-Order) untuk esok hari atau jam operasional berikutnya.', '#f59e0b');
            const schedRadio = document.querySelector('input[name="co-delivery-timing"][value="scheduled"]');
            if (schedRadio) {
                schedRadio.checked = true;
                const wrap = document.getElementById('co-scheduled-time-wrap');
                if (wrap) wrap.classList.remove('hidden');
                wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const deliveryTiming = isDineIn 
            ? `Dine-In (Meja #${dineInTable})` 
            : (isPickup 
                ? (deliveryTimingType === 'scheduled' ? `Jadwal Pengambilan: ${scheduledTime}` : 'Siap Segera di Resto (15-20 Menit)')
                : (deliveryTimingType === 'scheduled' ? `Jadwal Pengantaran: ${scheduledTime}` : 'Kirim Sekarang (Instan 20-35 Menit)'));

        const currentProfile = await dbGet('profile', 'me') || {};
        const mapsUrl = (currentActiveMapsPin && currentActiveMapsPin.url && !isPickup) ? currentActiveMapsPin.url : ((!isPickup && currentProfile.mapsUrl) ? currentProfile.mapsUrl : '');

        const subtotal = items.reduce((sum, it) => sum + it.product.price * it.qty, 0);
        const branchDistKm = (currentActiveMapsPin && currentActiveMapsPin.lat)
            ? calculateHaversineKm(selectedBranch.lat, selectedBranch.lng, currentActiveMapsPin.lat, currentActiveMapsPin.lng)
            : (window.__checkoutBranchDistanceKm !== undefined ? window.__checkoutBranchDistanceKm : nearestBranchInfo.distanceKm);

        const loyaltyPointsUsed = window.__checkoutLoyaltyPointsUsed || 0;
        const loyaltyDiscount = window.__checkoutLoyaltyDiscount || 0;
        const comboDiscount = window.__checkoutComboDiscount || 0;
        const couponDiscount = window.__checkoutCouponDiscount !== undefined ? window.__checkoutCouponDiscount : (APPLIED_COUPON ? calculateCouponDiscount(APPLIED_COUPON, subtotal, shippingFee) : 0);
        const couponCode = APPLIED_COUPON ? APPLIED_COUPON.code : '';
        const total = Math.max(0, subtotal + shippingFee - couponDiscount - loyaltyDiscount - comboDiscount);

        const order = {
            id: genId('ORD'),
            items: items.map(it => ({
                productId: it.product.id,
                name: it.product.name,
                image: it.product.image,
                price: it.product.price,
                qty: it.qty,
                size: it.size || '',
                color: it.color || '',
                note: it.note || '',
                type: 'makanan',
                freeShipping: !!it.product.freeShipping
            })),
            subtotal,
            shippingFee,
            shippingDestination,
            shippingCourier,
            shippingService,
            deliveryTiming,
            isFreeShipping,
            orderType,
            isDineIn,
            dineInTable,
            comboDiscount,
            loyaltyPointsUsed,
            loyaltyDiscount,
            branchId: selectedBranch.id,
            branchName: selectedBranch.name,
            branchAddress: selectedBranch.address,
            branchDistanceKm: branchDistKm,
            couponCode,
            couponDiscount,
            total,
            customer: { name, phone, address, note, mapsUrl },
            paymentMethod: payment,
            status: 'Menunggu Konfirmasi',
            createdAt: Date.now(),
            statusHistory: [{ status: 'Menunggu Konfirmasi', at: Date.now() }]
        };
        // Buka modal instruksi pembayaran terlebih dahulu (QRIS, E-Wallet, atau COD)
        // Di dalam modal terdapat tombol 'Kirim ke WhatsApp' untuk memproses & finalisasi pesanan
        openCheckoutPaymentModal(order, items);
    }

