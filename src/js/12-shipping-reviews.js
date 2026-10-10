    function initProductReviews(postId) {
        updateStarPickerUI(5);
        parseAndRenderCommentStars(postId);

        setTimeout(() => parseAndRenderCommentStars(postId), 1000);
        setTimeout(() => parseAndRenderCommentStars(postId), 2500);
        setTimeout(() => parseAndRenderCommentStars(postId), 5000);

        const cmtContainer = document.getElementById('blogger-comments-container');
        if (cmtContainer && window.MutationObserver) {
            try {
                const observer = new MutationObserver(() => {
                    parseAndRenderCommentStars(postId);
                });
                observer.observe(cmtContainer, { childList: true, subtree: true });
            } catch(e) {}
        }
    }

    async function syncProductsFromBloggerFeed() {
        try {
            const feedUrl = '/feeds/posts/default?alt=json&max-results=150';
            const res = await fetch(feedUrl);
            if (!res.ok) return;
            const data = await res.json();
            const entries = data && data.feed && data.feed.entry;
            if (!entries || !Array.isArray(entries) || entries.length === 0) return;

            const syncedProducts = [];
            const syncedCategoriesMap = new Map();

            entries.forEach((entry, idx) => {
                const rawId = (entry.id && entry.id.$t) || ('post_' + idx);
                const postId = 'bp_' + (rawId.split('post-')[1] || rawId.replace(/[^a-zA-Z0-9]/g, '_'));
                const title = (entry.title && entry.title.$t) || 'Produk Toko';

                let postUrl = '';
                if (Array.isArray(entry.link)) {
                    const altLink = entry.link.find(l => l.rel === 'alternate');
                    if (altLink) postUrl = altLink.href;
                }

                const contentHtml = (entry.content && entry.content.$t) || (entry.summary && entry.summary.$t) || '';
                const meta = parseBloggerProductMeta(contentHtml);

                let image = '';
                if (entry.media$thumbnail && entry.media$thumbnail.url) {
                    image = entry.media$thumbnail.url.replace(/\/s[0-9]+(-c)?\//, '/s600/');
                } else {
                    const imgMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
                    if (imgMatch) image = imgMatch[1];
                }
                if (!image) {
                    image = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600';
                }

                let categoryId = 'umum';
                let categoryName = 'Umum';
                if (Array.isArray(entry.category) && entry.category.length > 0) {
                    const firstCat = entry.category[0].term || 'Umum';
                    categoryName = firstCat;
                    categoryId = firstCat.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    
                    let catIcon = 'food';
                    const cLower = categoryName.toLowerCase();
                    if (/minum|kopi|coffee|tea|jus|boba|es|beverage/i.test(cLower)) catIcon = 'drink';
                    else if (/snack|cemilan|roti|kue|dessert|jajanan|gorengan/i.test(cLower)) catIcon = 'snack';
                    else if (/sehat|salad|sayur|buah|vegan/i.test(cLower)) catIcon = 'healthy';
                    else if (/terlaris|favorit|populer|best/i.test(cLower)) catIcon = 'star';
                    else if (/diskon|promo|hemat/i.test(cLower)) catIcon = 'promo';
                    else catIcon = 'food';

                    if (!syncedCategoriesMap.has(categoryId)) {
                        syncedCategoriesMap.set(categoryId, {
                            id: categoryId,
                            name: categoryName,
                            icon: catIcon
                        });
                    }
                }

                const price = meta.price > 0 ? meta.price : 100000;
                const originalPrice = meta.originalPrice;
                let discountPercent = 0;
                if (originalPrice && originalPrice > price) {
                    discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
                }

                const cleanDesc = contentHtml.replace(/<[^>]*>/g, ' ').replace(/\[\s*(?:harga|harga_coret|coret|diskon|stok|badge|flash_sale|kejar_diskon|berat|weight|jenis|tipe|type|gratis_ongkir|free_ongkir|bebas_ongkir|ukuran|size|sizes|warna|color|colors|dapur|nama_dapur|kitchen|cabang|id_dapur|dapur_id|kitchen_id|lokasi|koordinat|coords|cabang_koordinat|dapur_koordinat|alamat_dapur|lokasi_dapur|kitchen_address|alamat|rating|bintang|nilai|terjual|sold|sales|hpp|modal|cost|cogs)\s*:[^\]]+\]/gi, '').trim().substring(0, 300);

                const dynRatingInfo = (typeof getProductDynamicRating === 'function')
                    ? getProductDynamicRating(postId, meta.rating)
                    : { rating: meta.rating, hasRating: !!(meta.rating && Number(meta.rating) > 0) };
                const dynSold = (typeof getProductDynamicSold === 'function')
                    ? getProductDynamicSold(postId, meta.sold, window.__userOrdersList || [])
                    : (meta.sold || 0);

                syncedProducts.push({
                    id: postId,
                    name: title,
                    category: categoryId,
                    price: price,
                    originalPrice: originalPrice,
                    discountPercent: discountPercent,
                    stock: meta.stock,
                    sold: dynSold,
                    rating: dynRatingInfo.hasRating ? dynRatingInfo.rating : null,
                    image: image,
                    flashSale: meta.flashSale || (discountPercent >= 20),
                    soldPercent: 0,
                    badge: meta.badge || (discountPercent > 0 ? `Diskon ${discountPercent}%` : null),
                    description: cleanDesc,
                    sizes: meta.sizes || [],
                    colors: meta.colors || [],
                    variantPrices: meta.variantPrices || {},
                    coords: meta.coords,
                    branchName: meta.kitchenName || meta.branchName || '',
                    kitchenName: meta.kitchenName || meta.branchName || '',
                    kitchenId: meta.kitchenId || '',
                    kitchenAddress: meta.kitchenAddress || '',
                    weight: meta.weight,
                    type: meta.type,
                    freeShipping: meta.freeShipping,
                    url: postUrl
                });
            });

            if (syncedProducts.length > 0) {
                const allExisting = await dbGetAll('products');
                
                for (const old of allExisting) {
                    if (old.id && old.id.startsWith('p') && !old.id.startsWith('bp_') && !old.id.startsWith('cp_') && !old.isManual) {
                        await dbDelete('products', old.id);
                    }
                }

                await dbBulkPut('products', syncedProducts);

                if (syncedCategoriesMap.size > 0) {
                    const catList = Array.from(syncedCategoriesMap.values());
                    await dbBulkPut('categories', catList);
                }
                await renderDynamicFlashSaleProducts();
                console.log(`[Blogger Sync] Sinkronisasi ${syncedProducts.length} produk dinamis berhasil.`);
            }
        } catch (e) {
            console.warn('[Blogger Sync] Tidak dapat menyinkronkan feed (offline/local preview mode):', e);
        }
    }

    function calculateShippingRates(destId, weightKg = 1) {
        const destinations = getShippingDestinations();
        const dest = destinations.find(d => d.id === destId) || destinations[0] || { reg: 10000, express: 18000, cargo: 8000, etd: '1-3 Hari', name: 'Standard' };
        const weight = Math.max(1, Math.ceil(weightKg || 1));
        const courierRates = [];

        SHIPPING_COURIERS.forEach(c => {
            SHIPPING_SERVICES.forEach(s => {
                let fee = dest.reg;
                let etd = '25-40 Menit';

                if (c.id === 'pickup' || s.id === 'pickup') {
                    fee = 0;
                    etd = 'Siap Diambil (15 Menit)';
                } else if (s.id === 'express' || c.id === 'ojol') {
                    fee = dest.express || (dest.reg + 5000);
                    etd = '15-25 Menit (Prioritas Hangat)';
                }

                courierRates.push({
                    courierId: c.id,
                    courierName: c.name,
                    courierCode: c.code,
                    serviceId: s.id,
                    serviceName: s.name,
                    cost: fee,
                    etd: etd,
                    destinationName: dest.name
                });
            });
        });

        return { dest, weight, rates: courierRates };
    }

    let currentCalcFilterCourier = 'all';

    function openShippingModal(defaultDestId = null) {
        const destinations = getShippingDestinations();
        const initialDest = defaultDestId || (destinations[0] ? destinations[0].id : '');
        const html = `
        <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-200 dark:border-slate-700/60">
            <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold">
                    <svg class="svg-icon w-5 h-5" viewBox="0 0 24 24"><rect height="13" rx="2" width="15" x="1" y="3"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
                <div>
                    <h3 class="font-heading font-black text-lg text-slate-800 dark:text-white leading-tight">Cek Ongkos Kirim</h3>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Tarif statis estimasi kurir seluruh Indonesia</p>
                </div>
            </div>
            <button onclick="closeModal()" class="w-8 h-8 clay-btn flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <svg class="svg-icon w-4 h-4" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="sm:col-span-2">
                    <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Wilayah / Kota Tujuan</label>
                    <select id="modal-calc-dest" onchange="updateModalShippingResults()" class="w-full px-3.5 py-2.5 clay-input text-xs font-bold text-slate-800 dark:text-white">
                        ${destinations.map(d => `<option value="${d.id}" ${d.id === initialDest ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Berat Paket</label>
                    <div class="relative">
                        <input id="modal-calc-weight" type="number" min="1" max="100" value="1" oninput="updateModalShippingResults()" class="w-full px-3.5 py-2.5 pr-10 clay-input text-xs font-bold text-slate-800 dark:text-white">
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">Kg</span>
                    </div>
                </div>
            </div>

            <div>
                <span class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Pilih Ekspedisi:</span>
                <div class="flex flex-wrap gap-1.5">
                    <button type="button" class="calc-courier-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition-all border-purple-600 bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-sm" data-courier="all" onclick="filterModalCourier('all')">Semua</button>
                    ${SHIPPING_COURIERS.map(c => `
                        <button type="button" class="calc-courier-btn px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all hover:border-purple-400" data-courier="${c.id}" onclick="filterModalCourier('${c.id}')">${c.code}</button>
                    `).join('')}
                </div>
            </div>

            <div class="pt-2">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Pilihan Layanan & Tarif:</span>
                    <span id="modal-calc-info-weight" class="text-[11px] font-bold text-purple-600 dark:text-purple-400">1 Kg</span>
                </div>
                <div id="modal-shipping-results" class="space-y-2 max-h-[260px] overflow-y-auto custom-scroll pr-1">
                </div>
            </div>

            <div class="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <svg class="svg-icon w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>Tarif di atas merupakan tarif antar/ongkir acuan. Ongkir final otomatis dihitung saat proses checkout pemesanan.</span>
            </div>
        </div>`;

        openModal(html);
        currentCalcFilterCourier = 'all';
        updateModalShippingResults();
    }

    function filterModalCourier(courierId) {
        currentCalcFilterCourier = courierId;
        document.querySelectorAll('.calc-courier-btn').forEach(btn => {
            if (btn.getAttribute('data-courier') === courierId) {
                btn.className = 'calc-courier-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition-all border-purple-600 bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-sm';
            } else {
                btn.className = 'calc-courier-btn px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all hover:border-purple-400';
            }
        });
        updateModalShippingResults();
    }

    function updateModalShippingResults() {
        const destSelect = document.getElementById('modal-calc-dest');
        const weightInput = document.getElementById('modal-calc-weight');
        const container = document.getElementById('modal-shipping-results');
        const weightInfo = document.getElementById('modal-calc-info-weight');
        if (!destSelect || !weightInput || !container) return;

        const destId = destSelect.value;
        const weight = Math.max(1, parseInt(weightInput.value, 10) || 1);
        if (weightInfo) weightInfo.textContent = `${weight} Kg (Dibulatkan)`;

        const calc = calculateShippingRates(destId, weight);
        let rates = calc.rates;
        if (currentCalcFilterCourier !== 'all') {
            rates = rates.filter(r => r.courierId === currentCalcFilterCourier);
        }

        if (rates.length === 0) {
            container.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs font-bold">Tidak ada layanan kurir yang sesuai.</div>';
            return;
        }

        container.innerHTML = rates.map(r => `
            <div class="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-600/50 transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 font-black text-xs flex items-center justify-center flex-shrink-0">
                        ${escapeHtml(r.courierCode)}
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-black text-xs text-slate-800 dark:text-white">${escapeHtml(r.courierName)}</span>
                            <span class="text-[10px] px-2 py-0.5 rounded-md font-bold ${r.serviceId === 'express' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' : (r.serviceId === 'cargo' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400')}">${escapeHtml(r.serviceName)}</span>
                        </div>
                        <span class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <svg class="svg-icon w-3 h-3 text-slate-400" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            Estimasi: ${escapeHtml(r.etd)}
                        </span>
                    </div>
                </div>
                <div class="text-right">
                    <span class="font-heading font-black text-sm text-purple-600 dark:text-purple-400">${formatRupiah(r.cost)}</span>
                    <span class="block text-[10px] text-slate-400">Total ${weight} kg</span>
                </div>
            </div>
        `).join('');
    }

    async function route() {
        await ensureDB();
        const path = window.location.pathname.toLowerCase();
        const hashParts = currentRoute();
        const hashPage = (hashParts[0] || '').toLowerCase();

        let urlOrderId = '';
        try {
            const sp = new URLSearchParams(window.location.search);
            urlOrderId = (sp.get('orderId') || sp.get('order') || sp.get('track') || sp.get('query') || sp.get('no') || sp.get('resi') || sp.get('id') || '').trim();
            const urlTable = (sp.get('table') || sp.get('meja') || '').trim();
            const urlMode = (sp.get('mode') || '').trim();
            if (urlTable || urlMode === 'dine_in') {
                sessionStorage.setItem('digiarju_dine_in_table', urlTable || '01');
                window.__currentDineInTable = urlTable || '01';
            }
        } catch (e) {}

        let pageTarget = '';
        const staticPageWrap = document.getElementById('blogger-static-page-wrapper');
        const staticBody = document.getElementById('static-page-content');
        const rawPageText = staticBody ? staticBody.textContent.toLowerCase() : '';
        const pageTitle = (staticPageWrap ? (staticPageWrap.getAttribute('data-page-title') || '') : document.title).toLowerCase();

        if (urlOrderId) {
            pageTarget = 'lacak';
        } else if (hashPage && hashPage !== 'home') {
            pageTarget = hashPage;
        } else if (document.querySelector('[data-store-page="cart"]') || rawPageText.includes('[store:cart]') || rawPageText.includes('[cart]') || rawPageText.includes('[store:keranjang]') || rawPageText.includes('[keranjang]') || path.includes('/p/cart') || path.includes('/cart.html') || path.includes('/p/keranjang') || pageTitle.includes('keranjang') || pageTitle.includes('cart')) {
            pageTarget = 'cart';
        } else if (document.querySelector('[data-store-page="checkout"]') || rawPageText.includes('[store:checkout]') || rawPageText.includes('[checkout]') || rawPageText.includes('[store:bayar]') || rawPageText.includes('[bayar]') || path.includes('/p/checkout') || path.includes('/checkout.html') || path.includes('/p/bayar') || pageTitle.includes('checkout') || pageTitle.includes('pembayaran')) {
            pageTarget = 'checkout';
        } else if (document.querySelector('[data-store-page="lacak"]') || rawPageText.includes('[store:lacak]') || rawPageText.includes('[lacak]') || path.includes('/p/lacak') || path.includes('/lacak.html') || pageTitle.includes('lacak')) {
            pageTarget = 'lacak';
        } else if (document.querySelector('[data-store-page="orders"]') || rawPageText.includes('[store:orders]') || rawPageText.includes('[orders]') || rawPageText.includes('[store:pesanan]') || rawPageText.includes('[pesanan]') || path.includes('/p/orders') || path.includes('/orders.html') || path.includes('/p/pesanan') || pageTitle.includes('pesanan')) {
            pageTarget = 'orders';
        } else if (document.querySelector('[data-store-page="wishlist"]') || rawPageText.includes('[store:wishlist]') || rawPageText.includes('[wishlist]') || rawPageText.includes('[store:favorit]') || rawPageText.includes('[favorit]') || path.includes('/p/wishlist') || path.includes('/wishlist.html') || path.includes('/p/favorit') || pageTitle.includes('favorit') || pageTitle.includes('wishlist')) {
            navigate('/home');
            return;
        } else if (document.querySelector('[data-store-page="profile"]') || rawPageText.includes('[store:profile]') || rawPageText.includes('[profile]') || rawPageText.includes('[store:profil]') || rawPageText.includes('[profil]') || rawPageText.includes('[store:akun]') || rawPageText.includes('[akun]') || path.includes('/p/profile') || path.includes('/profile.html') || path.includes('/p/akun') || pageTitle.includes('profil') || pageTitle.includes('akun')) {
            pageTarget = 'profile';
        } else if (document.querySelector('[data-store-page="category"]') || rawPageText.includes('[store:category]') || rawPageText.includes('[category]') || rawPageText.includes('[store:kategori]') || rawPageText.includes('[kategori]') || path.includes('/p/category') || path.includes('/category.html') || path.includes('/p/kategori')) {
            pageTarget = 'category';
        } else if (path.includes('/p/ongkir') || path.includes('/ongkir.html') || path.includes('/p/tarif-ongkir') || hashPage === 'ongkir') {
            navigate('/home');
            return;
        }

        const isPostUrl = (path.length > 5 && path.endsWith('.html') && !path.includes('/p/'));
        const isSingleProduct = isPostUrl || hashPage === 'product' || !!document.getElementById('blogger-single-product');
        const isHome = (!pageTarget || pageTarget === 'home') && !staticPageWrap && !path.includes('/p/') && !isPostUrl && !document.getElementById('blogger-single-product');

        const ffWidgets = ['promo-banner-slider-wrapper'];
        ffWidgets.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = isHome ? '' : 'none';
        });

        const pageContentEl = document.getElementById('page-content');
        if (pageContentEl) {
            pageContentEl.style.display = '';
        }

        updateStoreOperatingHeader();
        renderStoreStatusBanner();

        const singleProdEl = document.getElementById('blogger-single-product');
        if (singleProdEl) {
            if (isSingleProduct && !pageTarget) {
                singleProdEl.style.display = '';
                await initBloggerSinglePost();
                highlightBottomNav('product');
                return;
            } else {
                singleProdEl.style.display = 'none';
            }
        }

        if (isHome) {
            if (!window.__bloggerOriginalHomeHTML && document.getElementById('blogger-posts-grid') && pageContentEl) {
                window.__bloggerOriginalHomeHTML = pageContentEl.innerHTML;
            } else if (window.__bloggerOriginalHomeHTML && pageContentEl && !document.getElementById('blogger-posts-grid')) {
                pageContentEl.innerHTML = window.__bloggerOriginalHomeHTML;
            }

            initSwiperFastFood();
            initFlashSaleCountdown();

            if (document.getElementById('blogger-posts-grid')) {
                await initBloggerPostsGrid();
            } else if (!staticPageWrap && !isSingleProduct) {
                await renderHome();
            }
            highlightBottomNav('home');
            initSocialProofNotifications();
            if (typeof updateFloatingCartBar === 'function') updateFloatingCartBar();
            return;
        }

        dismissSocialProof();
        if (typeof socialProofTimer !== 'undefined' && socialProofTimer) {
            clearInterval(socialProofTimer);
            socialProofTimer = null;
        }

        highlightBottomNav(pageTarget || 'home');

        try {
            if (pageTarget === 'cart') await renderCart();
            else if (pageTarget === 'checkout') await renderCheckout();
            else if (pageTarget === 'orders') await renderOrders();
            else if (pageTarget === 'lacak' || pageTarget === 'order') await renderLacakPage(urlOrderId || hashParts[1] || null);
            else if (pageTarget === 'profile') await renderProfile();
            else if (pageTarget === 'category') await renderCatalog({ categoryId: hashParts[1] || null });
            else if (pageTarget === 'search') await renderCatalog({ query: decodeURIComponent(hashParts[1] || '') });
            else if (pageTarget === 'product') await renderProductDetail(hashParts[1]);
            else if (staticPageWrap) highlightBottomNav('page');
        } catch (err) {
            console.error('Route rendering error:', err);
            const el = document.getElementById('page-content');
            if (el) {
                el.innerHTML = `
                <div class="clay-card p-8 md:p-12 text-center max-w-lg mx-auto my-12 space-y-4">
                    <div class="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center font-black text-2xl">⚠️</div>
                    <h2 class="text-xl font-black text-slate-800 dark:text-white">Sedang Menyiapkan Halaman</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Terjadi sedikit kendala saat memuat data. Silakan muat ulang atau kembali ke menu utama.</p>
                    <div class="pt-2 flex items-center justify-center gap-3">
                        <button onclick="window.location.reload()" class="px-5 py-2.5 clay-btn text-xs font-bold text-slate-700 dark:text-slate-300">Muat Ulang</button>
                        <button onclick="navigate('/home')" class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-sm">Ke Beranda</button>
                    </div>
                </div>`;
            }
        }

        const cw = document.getElementById('contentWrapper');
        if (cw) cw.scrollTo({ top: 0, behavior: 'instant' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof updateFloatingCartBar === 'function') updateFloatingCartBar();
    }

    function initFlashSaleCountdown() {
        try {
            const timerWrap = document.getElementById('flash-sale-countdown-timer');
            if (!timerWrap) return;

            const hEl = document.getElementById('fs-hours');
            const mEl = document.getElementById('fs-minutes');
            const sEl = document.getElementById('fs-seconds');
            if (!hEl || !mEl || !sEl) return;

            let targetTime = parseInt(localStorage.getItem('dg_fs_end_time') || '0', 10);
            const now = Date.now();
            if (!targetTime || targetTime <= now) {
                targetTime = now + (4 * 3600 + 28 * 60 + 50) * 1000;
                localStorage.setItem('dg_fs_end_time', targetTime.toString());
            }

            function updateTimer() {
                const diff = targetTime - Date.now();
                if (diff <= 0) {
                    targetTime = Date.now() + 6 * 3600 * 1000;
                    localStorage.setItem('dg_fs_end_time', targetTime.toString());
                    return;
                }
                const hrs = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);

                hEl.textContent = String(hrs).padStart(2, '0');
                mEl.textContent = String(mins).padStart(2, '0');
                sEl.textContent = String(secs).padStart(2, '0');
            }

            updateTimer();
            if (window._fsInterval) clearInterval(window._fsInterval);
            window._fsInterval = setInterval(updateTimer, 1000);
        } catch (e) {
            console.warn('Flash sale timer error:', e);
        }
    }

    async function renderDynamicFlashSaleProducts() {
        const gridEl = document.getElementById('flash-sale-products-grid');
        const wrapEl = document.getElementById('flash-sale-wrapper');
        if (!gridEl) return;

        try {
            let allProducts = (window.__allProducts && window.__allProducts.length > 0) ? window.__allProducts : await dbGetAll('products');
            if (!allProducts || allProducts.length === 0) {
                if (wrapEl) {
                    wrapEl.style.display = 'none';
                    wrapEl.removeAttribute('data-has-products');
                }
                return;
            }

            let flashProducts = allProducts.filter(p => p && p.flashSale);

            if (flashProducts.length === 0) {
                flashProducts = allProducts.filter(p => {
                    if (!p) return false;
                    if (p.discountPercent && p.discountPercent > 0) return true;
                    if (p.originalPrice && p.originalPrice > p.price) return true;
                    return false;
                });
            }

            if (flashProducts.length === 0 && allProducts.length > 0) {
                flashProducts = allProducts.slice(0, 4);
            }

            if (flashProducts.length === 0) {
                if (wrapEl) {
                    wrapEl.style.display = 'none';
                    wrapEl.removeAttribute('data-has-products');
                }
                return;
            }

            const itemsToRender = flashProducts.slice(0, 8);
            gridEl.innerHTML = itemsToRender.map(prod => {
                const hasOrig = prod.originalPrice && prod.originalPrice > prod.price;
                const actualSold = Number(prod.sold) || 0;
                const remainingStock = (prod.stock !== undefined && prod.stock !== null) ? prod.stock : null;
                let soldPct = 0;
                if (actualSold > 0) {
                    if (remainingStock !== null && (actualSold + remainingStock) > 0) {
                        soldPct = Math.min(100, Math.max(5, Math.round((actualSold / (actualSold + remainingStock)) * 100)));
                    } else {
                        soldPct = Math.min(100, Math.max(5, actualSold));
                    }
                } else if (prod.soldPercent) {
                    soldPct = prod.soldPercent;
                }
                const safeImg = prod.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600';

                return `
                <div class="flash-sale-card neu-flat bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-red-100 dark:border-red-950/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group min-w-[170px] sm:min-w-0 snap-start flex-shrink-0">
                    <div onclick="openFastFoodDetailModal('${escapeHtml(prod.id)}')" class="block relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-gray-100 dark:bg-gray-800 cursor-pointer">
                        <img src="${escapeHtml(safeImg)}" alt="${escapeHtml(prod.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"/>
                        <span class="absolute top-2 left-2 bg-majidfood-red text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md">${escapeHtml(discBadge)}</span>
                        <span class="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-yellow-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1">⚡ Flash Deal</span>
                    </div>
                    <div class="space-y-1">
                        <div onclick="openFastFoodDetailModal('${escapeHtml(prod.id)}')" class="cursor-pointer">
                            <h4 class="text-xs sm:text-sm font-black text-gray-800 dark:text-white line-clamp-1 group-hover:text-majidfood-red transition-colors">${escapeHtml(prod.name)}</h4>
                        </div>
                        <div class="flex items-baseline gap-1.5">
                            <span class="text-xs sm:text-base font-black text-majidfood-red dark:text-red-400">${formatRupiah(prod.price)}</span>
                            ${hasOrig ? `<span class="text-[10px] sm:text-xs text-gray-400 line-through font-bold">${formatRupiah(prod.originalPrice)}</span>` : ''}
                        </div>
                        <div class="pt-1">
                            <div class="flex justify-between text-[9px] sm:text-[10px] font-extrabold text-gray-500 dark:text-gray-400 mb-1">
                                <span>${actualSold > 0 ? `Terjual ${actualSold} (${soldPct}%)` : '<span class="text-emerald-600 dark:text-emerald-400">Promo Baru</span>'}</span>
                                <span class="text-majidfood-red font-bold">${remainingStock !== null ? (remainingStock <= 0 ? 'Habis' : 'Sisa ' + remainingStock + ' porsi') : 'Tersedia'}</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div class="bg-gradient-to-r from-amber-500 to-red-600 h-full rounded-full" style="width: ${soldPct}%;"></div>
                            </div>
                        </div>
                    </div>
                    <button type="button" onclick="openFastFoodDetailModal('${escapeHtml(prod.id)}')" class="mt-3 w-full py-2 px-3 bg-majidfood-red hover:bg-red-600 text-white font-black text-xs rounded-xl text-center flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14"/></svg>
                        <span>+ Pesan Promo</span>
                    </button>
                </div>`;
            }).join('');

            if (wrapEl) {
                wrapEl.setAttribute('data-has-products', 'true');
                if (typeof isCurrentlyOnHomePage === 'function' && isCurrentlyOnHomePage()) {
                    wrapEl.style.display = '';
                }
            }
        } catch (err) {
            console.warn('Gagal render produk Flash Sale:', err);
        }
    }

    function syncWhatsAppLinks() {
        try {
            const num = getSellerWhatsAppNumber();
            if (!num) return;
            document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a => {
                const currentHref = a.getAttribute('href');
                if (currentHref === 'https://wa.me/' || currentHref === 'https://wa.me') {
                    a.href = `https://wa.me/${num}?text=${encodeURIComponent('Halo Admin, saya ingin bertanya seputar menu/toko...')}`;
                }
            });
        } catch (e) {
            console.warn('Gagal sinkronisasi link WhatsApp CS:', e);
        }
    }
