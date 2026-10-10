    async function initBloggerSinglePost() {
        const article = document.getElementById('blogger-single-product');
        if (!article) return;

        const id = article.getAttribute('data-post-id') || ('post_' + Math.random().toString(36).substr(2, 6));
        const title = article.getAttribute('data-post-title') || document.title;
        const img = article.getAttribute('data-post-img') || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600';
        const url = article.getAttribute('data-post-url') || window.location.href;
        
        const snippetEl = document.getElementById('raw-post-snippet');
        const descBody = document.getElementById('post-description-body');
        const catEl = document.getElementById('raw-post-category');
        const categoryName = catEl ? catEl.textContent.trim() : 'Umum';
        const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');

        const rawBody = (descBody ? (descBody.innerHTML + ' ' + descBody.textContent) : '') + ' ' + (snippetEl ? snippetEl.textContent : '');

        const meta = parseBloggerProductMeta(rawBody);
        const basePrice = meta.price > 0 ? meta.price : 100000;
        const dynRatingInfo = (typeof getProductDynamicRating === 'function')
            ? getProductDynamicRating('bp_' + id, meta.rating)
            : { rating: meta.rating, hasRating: !!(meta.rating && Number(meta.rating) > 0) };
        let userOrdersList = [];
        try { if (typeof dbGetAll === 'function') userOrdersList = await dbGetAll('orders'); } catch(e){}
        const dynSold = (typeof getProductDynamicSold === 'function')
            ? getProductDynamicSold('bp_' + id, meta.sold, userOrdersList)
            : (meta.sold || 0);

        currentBloggerProduct = {
            id: 'bp_' + id,
            name: title,
            category: categoryId,
            price: basePrice,
            basePrice: basePrice,
            originalPrice: meta.originalPrice,
            discountPercent: meta.discountPercent || 0,
            stock: meta.stock,
            badge: meta.badge,
            flashSale: meta.flashSale,
            image: img,
            url: url,
            sizes: meta.sizes || [],
            colors: meta.colors || [],
            weight: meta.weight,
            type: meta.type,
            freeShipping: meta.freeShipping,
            variantPrices: meta.variantPrices || {},
            coords: meta.coords,
            branchName: meta.kitchenName || meta.branchName || '',
            kitchenName: meta.kitchenName || meta.branchName || '',
            kitchenId: meta.kitchenId || '',
            kitchenAddress: meta.kitchenAddress || '',
            rating: dynRatingInfo.hasRating ? dynRatingInfo.rating : null,
            sold: dynSold
        };

        try {
            await dbPut('products', currentBloggerProduct);
            await dbPut('categories', { id: categoryId, name: categoryName, icon: 'gem' });
        } catch (e) {
            console.warn('Could not cache product in DB:', e);
        }

        const priceDisplay = document.getElementById('post-price-display');
        if (priceDisplay) priceDisplay.textContent = formatRupiah(currentBloggerProduct.price);

        const origPriceDisplay = document.getElementById('post-original-price-display');
        if (origPriceDisplay && currentBloggerProduct.originalPrice) {
            origPriceDisplay.textContent = formatRupiah(currentBloggerProduct.originalPrice);
            origPriceDisplay.classList.remove('hidden');
        }

        const discountBadge = document.getElementById('post-discount-badge');
        if (discountBadge) {
            if (meta.discountPercent > 0) {
                discountBadge.textContent = `-${meta.discountPercent}%`;
                discountBadge.classList.remove('hidden');
            } else if (currentBloggerProduct.badge) {
                discountBadge.textContent = currentBloggerProduct.badge;
                discountBadge.classList.remove('hidden');
            }
        }

        const stockLabel = document.getElementById('post-stock-label');
        if (stockLabel) {
            if (currentBloggerProduct.stock !== undefined && currentBloggerProduct.stock !== null) {
                if (currentBloggerProduct.stock <= 0) {
                    stockLabel.textContent = 'Stok Habis';
                    stockLabel.className = 'text-rose-500 font-bold';
                } else {
                    stockLabel.textContent = `Stok Tersedia (${currentBloggerProduct.stock})`;
                }
            }
        }

        const galleryContainer = document.getElementById('post-gallery-thumbs');
        const mainImgEl = document.getElementById('post-main-image');
        if (galleryContainer && mainImgEl) {
            const images = [];
            if (img && !img.includes('1x1') && !img.includes('pixel')) images.push(img);
            if (descBody) {
                descBody.querySelectorAll('img').forEach(im => {
                    const src = im.getAttribute('src');
                    if (src && !images.includes(src) && !src.includes('1x1') && !src.includes('pixel')) {
                        images.push(src);
                    }
                });
            }
            if (images.length > 1) {
                galleryContainer.innerHTML = images.map((imSrc, idx) => `
                    <div class="gallery-thumb-item w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 bg-white dark:bg-slate-800 ${idx === 0 ? 'active border-purple-600' : 'border-slate-200 dark:border-slate-700'}" onclick="switchPostMainImage('${escapeHtml(imSrc)}', this)">
                        <img src="${imSrc}" alt="Thumbnail ${idx + 1}" class="w-full h-full object-cover">
                    </div>
                `).join('');
                galleryContainer.classList.remove('hidden');
            }
        }

        const variantsSec = document.getElementById('post-variants-section');
        const colorsWrap = document.getElementById('post-colors-wrap');
        const colorsContainer = document.getElementById('post-colors-container');
        const colorLabel = document.getElementById('post-selected-color-label');
        const sizesWrap = document.getElementById('post-sizes-wrap');
        const sizesContainer = document.getElementById('post-sizes-container');
        const sizeLabel = document.getElementById('post-selected-size-label');

        if (currentBloggerProduct.colors.length > 0 || currentBloggerProduct.sizes.length > 0) {
            if (variantsSec) variantsSec.classList.remove('hidden');

            if (currentBloggerProduct.colors.length > 0 && colorsWrap && colorsContainer) {
                colorsWrap.classList.remove('hidden');
                currentBloggerSelectedColor = currentBloggerProduct.colors[0];
                if (colorLabel) colorLabel.textContent = currentBloggerSelectedColor;
                colorsContainer.innerHTML = currentBloggerProduct.colors.map(col => {
                    const vp = currentBloggerProduct.variantPrices || {};
                    const hasVarPrice = vp[col] || vp[col.toUpperCase()] || vp[col.toLowerCase()];
                    const priceNote = hasVarPrice ? ` (${formatRupiah(hasVarPrice)})` : '';
                    return `<button type="button" class="post-color-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${col === currentBloggerSelectedColor ? 'border-purple-600 bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-sm' : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-purple-400'}" onclick="selectBloggerPostColor('${escapeHtml(col)}')">${escapeHtml(col)}${priceNote}</button>`;
                }).join('');
            } else if (colorsWrap) {
                colorsWrap.classList.add('hidden');
            }

            if (currentBloggerProduct.sizes.length > 0 && sizesWrap && sizesContainer) {
                sizesWrap.classList.remove('hidden');
                currentBloggerSelectedSize = currentBloggerProduct.sizes[0];
                if (sizeLabel) sizeLabel.textContent = currentBloggerSelectedSize;
                sizesContainer.innerHTML = currentBloggerProduct.sizes.map(sz => {
                    const vp = currentBloggerProduct.variantPrices || {};
                    const hasVarPrice = vp[sz] || vp[sz.toUpperCase()] || vp[sz.toLowerCase()];
                    const priceNote = hasVarPrice ? ` (${formatRupiah(hasVarPrice)})` : '';
                    return `<button type="button" class="post-size-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${sz === currentBloggerSelectedSize ? 'border-purple-600 bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-sm' : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-purple-400'}" onclick="selectBloggerPostSize('${escapeHtml(sz)}')">${escapeHtml(sz)}${priceNote}</button>`;
                }).join('');
            } else if (sizesWrap) {
                sizesWrap.classList.add('hidden');
            }

            updateBloggerPostPriceBySelection();
        } else if (variantsSec) {
            variantsSec.classList.add('hidden');
        }

        setupBloggerProductTabs(descBody, currentBloggerProduct, categoryName);
    }

    function switchBloggerPostTab(btnElement, targetId) {
        const tabWidget = document.getElementById('widget-deskripsi');
        if (!tabWidget) return;

        const tabBtns = tabWidget.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.remove('active', 'border-b-2', 'border-purple-600', 'font-bold');
            btn.classList.add('border-b-2', 'border-transparent', 'font-medium');
        });

        if (btnElement) {
            btnElement.classList.add('active', 'border-b-2', 'border-purple-600', 'font-bold');
            btnElement.classList.remove('border-transparent', 'font-medium');
        } else {
            tabBtns.forEach(btn => {
                const attr = btn.getAttribute('onclick') || '';
                if (attr.includes(targetId)) {
                    btn.classList.add('active', 'border-b-2', 'border-purple-600', 'font-bold');
                    btn.classList.remove('border-transparent', 'font-medium');
                }
            });
            const tabSection = document.getElementById('blogger-product-tabs-section');
            if (tabSection) {
                tabSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        const tabContents = tabWidget.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.add('hidden'));

        const activeContent = document.getElementById(targetId);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
    }
    window.switchTab = switchBloggerPostTab;

    function setupBloggerProductTabs(descBody, currentProduct, categoryName) {
        if (!descBody) return;

        const tabDeskripsi = document.getElementById('tab-deskripsi');
        const tabSpesifikasi = document.getElementById('tab-spesifikasi');
        const tabGaransi = document.getElementById('tab-garansi');
        const shortSummary = document.getElementById('post-short-summary');

        if (!tabDeskripsi || !tabSpesifikasi || !tabGaransi) return;

        let originalHTML = descBody.innerHTML || '';
        
        originalHTML = originalHTML.replace(/\[\s*(?:harga|harga_coret|coret|diskon|stok|badge|ukuran|size|sizes|warna|color|colors|flash_sale|kejar_diskon|berat|weight|jenis|tipe|type|gratis_ongkir|free_ongkir|bebas_ongkir|harga_varian|variant_price|harga_variasi)\s*:[^\]]+\]/gi, '').trim();
        
        originalHTML = originalHTML.replace(/<div[^>]*class=["']product-metadata-block["'][^>]*>[\s\S]*?<\/div>/gi, '').trim();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalHTML;

        const secDesc = tempDiv.querySelector('.product-description-section');
        const secSpecs = tempDiv.querySelector('.product-specs-section');
        const secWarranty = tempDiv.querySelector('.product-warranty-section');

        let parsedDescHTML = '';
        let parsedSpecsHTML = '';
        let parsedWarrantyHTML = '';

        if (secDesc || secSpecs || secWarranty) {
            
            if (secDesc) {
                parsedDescHTML = secDesc.innerHTML.trim();
            }
            if (secSpecs) {
                const tbl = secSpecs.querySelector('table');
                if (tbl) {
                    tbl.className = 'w-full text-left';
                    parsedSpecsHTML = tbl.outerHTML;
                } else {
                    const h3 = secSpecs.querySelector('h3');
                    if (h3) h3.remove();
                    parsedSpecsHTML = secSpecs.innerHTML.trim();
                }
            }
            if (secWarranty) {
                const h3 = secWarranty.querySelector('h3');
                if (h3) h3.remove();
                parsedWarrantyHTML = secWarranty.innerHTML.trim();
            }
        } else {
            
            const rawText = tempDiv.textContent || tempDiv.innerText || '';
            const hasSpecsText = /SPESIFIKASI\s+LENGKAP\s*:/i.test(rawText);
            const hasGaransiText = /PENGIRIMAN\s*(?:&|&amp;)?\s*GARANSI\s*:/i.test(rawText);

            if (hasSpecsText || hasGaransiText) {
                let descPart = originalHTML;
                const splitMatch = descPart.match(/SPESIFIKASI\s+LENGKAP\s*:|PENGIRIMAN\s*(?:&|&amp;)?\s*GARANSI\s*:/i);
                if (splitMatch) {
                    descPart = descPart.substring(0, splitMatch.index).trim();
                }
                if (!/<p[\s>]/i.test(descPart)) {
                    descPart = descPart.split(/\n\n+/).filter(Boolean).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
                }
                parsedDescHTML = descPart;

                const specsMatch = rawText.match(/SPESIFIKASI\s+LENGKAP\s*:([\s\S]*?)(?=PENGIRIMAN\s*(?:&|&amp;)?\s*GARANSI\s*:|$)/i);
                if (specsMatch && specsMatch[1]) {
                    const lines = specsMatch[1].split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    const rows = [];
                    lines.forEach(l => {
                        const cleanLine = l.replace(/^[•\-\*\s]+/, '');
                        const colonIdx = cleanLine.indexOf(':');
                        if (colonIdx !== -1) {
                            const k = cleanLine.substring(0, colonIdx).trim();
                            const v = cleanLine.substring(colonIdx + 1).trim();
                            if (k && v) {
                                const isBrand = /merek|brand/i.test(k);
                                rows.push(`
                                    <tr class="border-b border-slate-100 dark:border-slate-700">
                                        <th class="py-3 w-1/3 font-medium text-slate-500 dark:text-slate-400">${escapeHtml(k)}</th>
                                        <td class="py-3 ${isBrand ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-800 dark:text-white'}">${escapeHtml(v)}</td>
                                    </tr>
                                `);
                            }
                        }
                    });
                    if (rows.length > 0) {
                        parsedSpecsHTML = `<table class="w-full text-left">${rows.join('')}</table>`;
                    }
                }

                const garansiMatch = rawText.match(/PENGIRIMAN\s*(?:&|&amp;)?\s*GARANSI\s*:([\s\S]*)$/i);
                if (garansiMatch && garansiMatch[1]) {
                    const gText = garansiMatch[1];
                    const blocks = gText.split(/\n\s*\[\s*([^\]]+)\s*\]/g);
                    if (blocks.length > 1) {
                        const cards = [];
                        for (let i = 1; i < blocks.length; i += 2) {
                            const gTitle = blocks[i].trim();
                            const gContent = (blocks[i+1] || '').trim().replace(/^[•\-\*\s]+/, '').replace(/\n/g, ' ');
                            let iconClass = 'fa-truck-fast text-purple-600 dark:text-purple-400';
                            if (/original|qc|kualitas/i.test(gTitle)) {
                                iconClass = 'fa-shield-halved text-emerald-500';
                            } else if (/garansi|retur|tukar|kembali/i.test(gTitle)) {
                                iconClass = 'fa-rotate-left text-blue-500';
                            }
                            cards.push(`
                                <div class="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <h4 class="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                                        <i class="fa-solid ${iconClass}"></i> ${escapeHtml(gTitle)}
                                    </h4>
                                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${escapeHtml(gContent)}</p>
                                </div>
                            `);
                        }
                        if (cards.length > 0) {
                            parsedWarrantyHTML = cards.join('');
                        }
                    }
                }
            }
        }

        if (!parsedDescHTML) {
            parsedDescHTML = originalHTML || '<p class="text-slate-500 italic">Tidak ada deskripsi tambahan untuk produk ini.</p>';
        }

        if (!parsedSpecsHTML) {
            const specList = [];
            if (categoryName && categoryName !== 'Umum') specList.push({ k: 'Kategori Menu', v: categoryName });
            specList.push({ k: 'Kondisi Menu', v: 'Dimasak Segar (Freshly Made)' });
            specList.push({ k: 'Penyajian', v: 'Hangat & Higienis' });
            specList.push({ k: 'Kehalalan', v: '100% Halal' });
            if (currentProduct.sizes && currentProduct.sizes.length > 0) {
                specList.push({ k: 'Pilihan Porsi', v: currentProduct.sizes.join(', ') });
            }
            if (currentProduct.colors && currentProduct.colors.length > 0) {
                specList.push({ k: 'Pilihan Rasa / Level', v: currentProduct.colors.join(', ') });
            }
            if (currentProduct.freeShipping) {
                specList.push({ k: 'Bebas Ongkir', v: 'Tersedia Promo Bebas Ongkir' });
            }
            specList.push({ k: 'Estimasi Pengantaran', v: '15 - 35 Menit' });

            const rows = specList.map(item => `
                <tr class="border-b border-slate-100 dark:border-slate-700">
                    <th class="py-3 w-1/3 font-medium text-slate-500 dark:text-slate-400">${escapeHtml(item.k)}</th>
                    <td class="py-3 font-bold text-slate-800 dark:text-white">${escapeHtml(item.v)}</td>
                </tr>
            `).join('');
            parsedSpecsHTML = `<table class="w-full text-left">${rows}</table>`;
        }

        if (!parsedWarrantyHTML) {
            parsedWarrantyHTML = `
                <div class="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700">
                    <h4 class="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-fire-burner text-purple-600 dark:text-purple-400"></i> Makanan Dimasak Segar &amp; Hangat
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Setiap menu dimasak langsung setelah pesanan Anda masuk (freshly made) agar tersaji hangat, lezat, dan terjaga kualitas rasanya.</p>
                </div>
                <div class="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700">
                    <h4 class="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-shield-halved text-emerald-500"></i> 100% Halal &amp; Higienis
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Semua bahan baku bermutu tinggi, terjamin kehalalannya, dan dikemas rapi menggunakan wadah food-grade yang aman serta higienis.</p>
                </div>
                <div class="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700">
                    <h4 class="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-rotate-left text-blue-500"></i> Jaminan Kepuasan &amp; Ganti Baru
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Jika pesanan tumpah saat pengantaran, basi, atau ada menu yang tertinggal, langsung hubungi kami via WhatsApp untuk kami ganti baru atau kompensasikan.</p>
                </div>
            `;
        }

        tabDeskripsi.innerHTML = parsedDescHTML;
        tabSpesifikasi.innerHTML = parsedSpecsHTML;
        tabGaransi.innerHTML = parsedWarrantyHTML;

        if (shortSummary) {
            const tmp = document.createElement('div');
            tmp.innerHTML = parsedDescHTML;
            const plainText = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
            const snippet = plainText.length > 140 ? plainText.substring(0, 140) + '...' : plainText;
            shortSummary.textContent = snippet || 'Produk pilihan terbaik dengan kualitas terjamin dan layanan resmi.';
        }

        initProductReviews(id);
    }

    function switchPostMainImage(newSrc, thumbEl) {
        const mainImg = document.getElementById('post-main-image');
        if (mainImg) {
            mainImg.style.opacity = '0.3';
            setTimeout(() => {
                mainImg.src = newSrc;
                mainImg.style.opacity = '1';
            }, 150);
        }
        document.querySelectorAll('.gallery-thumb-item').forEach(el => {
            el.classList.remove('active', 'border-purple-600');
            el.classList.add('border-slate-200', 'dark:border-slate-700');
        });
        if (thumbEl) {
            thumbEl.classList.add('active', 'border-purple-600');
            thumbEl.classList.remove('border-slate-200', 'dark:border-slate-700');
        }
    }

    function updateBloggerPostPriceBySelection() {
        if (!currentBloggerProduct) return;
        const vp = currentBloggerProduct.variantPrices || {};
        const col = (currentBloggerSelectedColor || '').trim();
        const sz = (currentBloggerSelectedSize || '').trim();
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

        const finalPrice = (chosenPrice && chosenPrice > 0) ? chosenPrice : (currentBloggerProduct.basePrice || currentBloggerProduct.price);
        currentBloggerProduct.price = finalPrice;

        const priceDisplay = document.getElementById('post-price-display');
        if (priceDisplay) priceDisplay.textContent = formatRupiah(finalPrice);

        if (currentBloggerProduct.originalPrice && currentBloggerProduct.originalPrice > finalPrice) {
            const disc = Math.round((1 - finalPrice / currentBloggerProduct.originalPrice) * 100);
            const badgeEl = document.getElementById('post-discount-badge');
            if (badgeEl && disc > 0) {
                badgeEl.textContent = `Diskon ${disc}%`;
                badgeEl.classList.remove('hidden');
            }
        }
    }

    function selectBloggerPostColor(col) {
        currentBloggerSelectedColor = col;
        const colorLabel = document.getElementById('post-selected-color-label');
        if (colorLabel) colorLabel.textContent = col;
        document.querySelectorAll('.post-color-btn').forEach(btn => {
            if (btn.textContent.trim().startsWith(col)) {
                btn.className = 'post-color-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition-all border-purple-600 bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-sm';
            } else {
                btn.className = 'post-color-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition-all border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-purple-400';
            }
        });
        updateBloggerPostPriceBySelection();
    }

    function selectBloggerPostSize(sz) {
        currentBloggerSelectedSize = sz;
        const sizeLabel = document.getElementById('post-selected-size-label');
        if (sizeLabel) sizeLabel.textContent = sz;
        document.querySelectorAll('.post-size-btn').forEach(btn => {
            if (btn.textContent.trim().startsWith(sz)) {
                btn.className = 'post-size-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition-all border-purple-600 bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-sm';
            } else {
                btn.className = 'post-size-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition-all border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-purple-400';
            }
        });
        updateBloggerPostPriceBySelection();
    }

    function changePostDetailQty(delta) {
        currentBloggerQty = Math.max(1, (currentBloggerQty || 1) + delta);
        const qtyEl = document.getElementById('post-detail-qty');
        if (qtyEl) qtyEl.textContent = currentBloggerQty;
    }

    async function addCurrentBloggerPostToCart() {
        if (!currentBloggerProduct) return;
        await addToCart(currentBloggerProduct.id, currentBloggerQty || 1, currentBloggerSelectedSize, currentBloggerSelectedColor);
    }

    async function buyCurrentBloggerPostNow() {
        if (!currentBloggerProduct) return;
        await addToCart(currentBloggerProduct.id, currentBloggerQty || 1, currentBloggerSelectedSize, currentBloggerSelectedColor);
        if (window.location.hostname.includes('blogspot') || window.location.hostname.includes('blogger')) {
            window.location.href = '/p/checkout.html';
        } else {
            navigate('/checkout');
        }
    }

    async function initBloggerPostsGrid() {
        const grid = document.getElementById('blogger-posts-grid');
        if (!grid) return;

        const cards = grid.querySelectorAll('.blogger-post-card-wrap');
        const categoryMap = new Map();
        const bloggerProducts = [];

        if (cards.length === 0) {
            grid.innerHTML = `
            <div class="col-span-full neu-flat p-8 sm:p-12 text-center rounded-2xl border border-gray-100 dark:border-gray-800">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full neu-pressed flex items-center justify-center text-majidfood-red">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <h3 class="text-base sm:text-lg font-black text-gray-800 dark:text-white mb-1">Belum Ada Menu Dipublikasikan</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Publikasikan postingan menu makanan di dashboard Blogger Anda untuk menampilkannya di sini.</p>
            </div>`;
            window.__allProducts = [];
            return;
        }

        try {
            if (typeof dbGetAll === 'function') {
                window.__userOrdersList = await dbGetAll('orders');
            }
        } catch (e) {}

        cards.forEach(async (card, cardIdx) => {
            const snippetEl = card.querySelector('.post-raw-snippet');
            const bodyEl = card.querySelector('.post-raw-body');
            const rawBody = (bodyEl ? (bodyEl.innerHTML + ' ' + bodyEl.textContent) : '') + ' ' + (snippetEl ? snippetEl.textContent : '');
            const catEl = card.querySelector('.post-raw-category');
            const categoryName = catEl ? catEl.textContent.trim() : 'Umum';
            const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            if (categoryName && categoryName !== 'Umum') {
                categoryMap.set(categoryId, categoryName);
            }

            const meta = parseBloggerProductMeta(rawBody);
            const price = meta.price > 0 ? meta.price : 100000;
            const id = 'bp_' + (card.getAttribute('data-post-id') || Math.random().toString(36).substr(2, 6));
            const title = card.getAttribute('data-post-title') || 'Menu Resto';
            const img = card.getAttribute('data-post-img') || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600';
            const url = card.getAttribute('data-post-url') || '';

            card.setAttribute('data-orig-order', cardIdx);
            card.setAttribute('data-price', price);
            card.setAttribute('data-discount', meta.discountPercent || 0);
            card.setAttribute('data-stock', (meta.stock !== undefined && meta.stock !== null) ? meta.stock : 999);

            const priceEl = card.querySelector('.post-price-badge');
            if (priceEl) priceEl.textContent = formatRupiah(price);

            const discountBadge = card.querySelector('.post-discount-badge');
            const origPriceEl = card.querySelector('.post-original-price-display');
            if (meta.originalPrice && meta.originalPrice > price) {
                if (origPriceEl) {
                    origPriceEl.textContent = formatRupiah(meta.originalPrice);
                    origPriceEl.classList.remove('hidden');
                }
            } else if (origPriceEl) {
                origPriceEl.classList.add('hidden');
            }

            if (meta.discountPercent > 0) {
                if (discountBadge) {
                    discountBadge.textContent = `-${meta.discountPercent}%`;
                    discountBadge.classList.remove('hidden');
                }
            } else if (meta.badge && discountBadge) {
                discountBadge.textContent = meta.badge;
                discountBadge.classList.remove('hidden');
            } else if (discountBadge) {
                discountBadge.classList.add('hidden');
            }

            const stockRow = card.querySelector('.post-card-stock');
            const stockVal = card.querySelector('.post-card-stock-val');
            if (stockRow && stockVal) {
                if (meta.stock !== undefined && meta.stock !== null) {
                    if (meta.stock <= 0) {
                        stockVal.textContent = 'Stok Habis';
                        stockVal.className = 'post-card-stock-val text-rose-500 font-bold';
                    } else {
                        stockVal.textContent = `${meta.stock} buah`;
                        stockVal.className = 'post-card-stock-val text-slate-700 dark:text-slate-300 font-bold';
                    }
                    stockRow.classList.remove('hidden');
                } else {
                    stockRow.classList.add('hidden');
                }
            }

            const originLat = (meta.coords && meta.coords.lat) ? meta.coords.lat : RESTAURANT_COORDS.lat;
            const originLng = (meta.coords && meta.coords.lng) ? meta.coords.lng : RESTAURANT_COORDS.lng;
            let realDistNum = 1.0;
            if (currentActiveMapsPin && currentActiveMapsPin.lat && currentActiveMapsPin.lng) {
                realDistNum = calculateHaversineKm(originLat, originLng, currentActiveMapsPin.lat, currentActiveMapsPin.lng);
            } else {
                realDistNum = parseFloat((0.8 + (cardIdx % 4) * 0.4).toFixed(1));
            }
            const displayDist = `${realDistNum} km`;

            if (meta.coords) {
                card.setAttribute('data-prod-lat', meta.coords.lat);
                card.setAttribute('data-prod-lng', meta.coords.lng);
            }
            const activeKitchenName = meta.kitchenName || meta.branchName || '';
            if (activeKitchenName) {
                card.setAttribute('data-prod-branch', activeKitchenName);
                card.setAttribute('data-prod-kitchen', activeKitchenName);
            }
            if (meta.kitchenId) {
                card.setAttribute('data-prod-kitchen-id', meta.kitchenId);
            }
            if (meta.kitchenAddress) {
                card.setAttribute('data-prod-kitchen-address', meta.kitchenAddress);
            }
            card.setAttribute('data-distance-num', realDistNum);

            const dynRatingInfo = (typeof getProductDynamicRating === 'function')
                ? getProductDynamicRating(id, meta.rating)
                : { rating: meta.rating || null, display: meta.rating || 'Baru', count: 0, hasRating: !!(meta.rating && Number(meta.rating) > 0) };
            const dynSold = (typeof getProductDynamicSold === 'function')
                ? getProductDynamicSold(id, meta.sold, window.__userOrdersList || [])
                : (meta.sold || 0);

            const prodObj = {
                id: id,
                name: title,
                category: categoryId,
                price: price,
                basePrice: price,
                originalPrice: meta.originalPrice,
                discountPercent: meta.discountPercent || 0,
                stock: meta.stock,
                badge: meta.badge,
                flashSale: meta.flashSale,
                sizes: meta.sizes || [],
                colors: meta.colors || [],
                variantPrices: meta.variantPrices || {},
                coords: meta.coords,
                branchName: activeKitchenName,
                kitchenName: activeKitchenName,
                kitchenId: meta.kitchenId || '',
                kitchenAddress: meta.kitchenAddress || '',
                image: img,
                url: url,
                rating: dynRatingInfo.hasRating ? dynRatingInfo.rating : null,
                sold: dynSold,
                distance: displayDist
            };
            bloggerProducts.push(prodObj);

            try {
                await dbPut('products', prodObj);
                await dbPut('categories', { id: categoryId, name: categoryName, icon: 'gem' });
            } catch (e) {}

            const ratEl = card.querySelector('.post-card-rating');
            if (ratEl) {
                ratEl.textContent = dynRatingInfo.hasRating ? dynRatingInfo.rating : 'Baru';
            }
            const soldWrap = card.querySelector('.post-card-sold-wrap');
            const soldVal = card.querySelector('.post-card-sold-val');
            const soldDivider = card.querySelector('.post-card-sold-divider');
            if (dynSold > 0) {
                if (soldVal) soldVal.textContent = `Terjual ${dynSold >= 1000 ? (dynSold/1000).toFixed(1) + 'rb' : dynSold}`;
                if (soldWrap) soldWrap.classList.remove('hidden');
                if (soldDivider) soldDivider.classList.remove('hidden');
            } else {
                if (soldWrap) soldWrap.classList.add('hidden');
                if (soldDivider) soldDivider.classList.add('hidden');
            }

            const distEl = card.querySelector('.post-card-distance');
            if (distEl) {
                distEl.textContent = prodObj.distance;
                distEl.title = `Jarak pengiriman: ${prodObj.distance}`;
            }

            const etaMin = Math.max(10, Math.round(12 + realDistNum * 3));
            const etaMax = etaMin + 10;
            const etaEl = card.querySelector('.post-card-eta-val');
            if (etaEl) {
                etaEl.textContent = `${etaMin}-${etaMax} mnt`;
            }

            const kitchenBadgeEl = card.querySelector('.post-card-kitchen-badge');
            const kitchenNameEl = card.querySelector('.post-card-kitchen-name');
            const kitchenDividerEl = card.querySelector('.post-card-kitchen-divider');
            if (activeKitchenName) {
                if (kitchenNameEl) kitchenNameEl.textContent = activeKitchenName;
                if (kitchenBadgeEl) {
                    kitchenBadgeEl.classList.remove('hidden');
                    kitchenBadgeEl.classList.add('inline-flex');
                    kitchenBadgeEl.title = `Disiapkan di: ${activeKitchenName}${meta.kitchenAddress ? ' (' + meta.kitchenAddress + ')' : ''}`;
                }
                if (kitchenDividerEl) kitchenDividerEl.classList.remove('hidden');
            }

            const dietaryEl = card.querySelector('.post-dietary-badge');
            if (dietaryEl) {
                if (meta.badge && (meta.badge.toLowerCase().includes('chef') || meta.badge.toLowerCase().includes('favorit') || meta.badge.toLowerCase().includes('pedas') || meta.badge.toLowerCase().includes('halal'))) {
                    dietaryEl.textContent = meta.badge;
                    dietaryEl.classList.remove('hidden');
                } else {
                    dietaryEl.textContent = '100% Halal';
                    dietaryEl.classList.remove('hidden');
                }
            }
            const promoEl = card.querySelector('.post-promo-text');
            if (promoEl) {
                if (meta.freeShipping) promoEl.textContent = 'Gratis Ongkir';
                else if (meta.discountPercent > 0) promoEl.textContent = `Diskon ${meta.discountPercent}%`;
                else if (meta.badge) promoEl.textContent = meta.badge;
                else promoEl.textContent = 'Pilihan Favorit';
            }

            card.style.cursor = 'pointer';
            card.onclick = (e) => {
                if (e.target.closest('button')) return;
                openFastFoodDetailModal(id);
            };

            const addButtons = card.querySelectorAll('.post-quick-add-btn, .post-thumb-cart-btn');
            addButtons.forEach(btn => {
                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openFastFoodDetailModal(id);
                };
            });
        });

        if (bloggerProducts.length > 0) {
            window.__allProducts = bloggerProducts;
        }

        const chipContainer = document.getElementById('blogger-category-chips');
        if (chipContainer && categoryMap.size > 0) {
            const currentPath = window.location.pathname;
            const currentLabel = decodeURIComponent(currentPath.split('/search/label/')[1] || '').toLowerCase().trim();
            let chipsHtml = `
                <a href="/" class="px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${!currentLabel ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-sm' : 'clay-btn text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'}">
                    <i class="fa-solid fa-layer-group text-xs"></i>
                    <span>Semua Produk</span>
                </a>
            `;
            categoryMap.forEach((cName, cId) => {
                const isActive = currentLabel === cName.toLowerCase().trim();
                chipsHtml += `
                    <a href="/search/label/${encodeURIComponent(cName)}" class="px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${isActive ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-sm' : 'clay-btn text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'}">
                        <i class="fa-solid fa-tag text-[10px] text-purple-600"></i>
                        <span>${escapeHtml(cName)}</span>
                    </a>
                `;
            });
            chipContainer.innerHTML = chipsHtml;
        }

        await renderDynamicFlashSaleProducts();
    }

    function sortBloggerPostsGrid(criteria) {
        const grid = document.getElementById('blogger-posts-grid');
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll('.blogger-post-card-wrap'));
        if (cards.length === 0) return;

        cards.sort((a, b) => {
            if (criteria === 'distance-asc') {
                const da = parseFloat(a.getAttribute('data-distance-num') || 999);
                const db = parseFloat(b.getAttribute('data-distance-num') || 999);
                return da - db;
            } else if (criteria === 'price-asc') {
                const pa = parseFloat(a.getAttribute('data-price') || 0);
                const pb = parseFloat(b.getAttribute('data-price') || 0);
                return pa - pb;
            } else if (criteria === 'price-desc') {
                const pa = parseFloat(a.getAttribute('data-price') || 0);
                const pb = parseFloat(b.getAttribute('data-price') || 0);
                return pb - pa;
            } else if (criteria === 'discount-desc') {
                const da = parseFloat(a.getAttribute('data-discount') || 0);
                const db = parseFloat(b.getAttribute('data-discount') || 0);
                return db - da;
            } else if (criteria === 'stock-desc') {
                const sa = parseFloat(a.getAttribute('data-stock') || 0);
                const sb = parseFloat(b.getAttribute('data-stock') || 0);
                return sb - sa;
            } else {
                
                const oa = parseInt(a.getAttribute('data-orig-order') || 0, 10);
                const ob = parseInt(b.getAttribute('data-orig-order') || 0, 10);
                return oa - ob;
            }
        });

        cards.forEach(card => grid.appendChild(card));
    }

    let liveSearchDebounceTimer = null;

    function handleLiveSearch(query, dropdownId) {
        clearTimeout(liveSearchDebounceTimer);
        const q = (query || '').trim();
        const dropdown = document.getElementById(dropdownId);

        filterBloggerPostsGrid(q);

        if (!dropdown) return;

        if (q.length === 0) {
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            return;
        }

        liveSearchDebounceTimer = setTimeout(async () => {
            const lowerQ = q.toLowerCase();
            let matches = [];

            const domCards = document.querySelectorAll('.blogger-post-card-wrap');
            if (domCards.length > 0) {
                domCards.forEach(card => {
                    const title = card.getAttribute('data-post-title') || '';
                    const catEl = card.querySelector('.post-raw-category');
                    const cat = catEl ? catEl.textContent.trim() : '';
                    const price = card.getAttribute('data-price') || 0;
                    const img = card.getAttribute('data-post-img') || '';
                    const url = card.getAttribute('data-post-url') || '#';

                    if (title.toLowerCase().includes(lowerQ) || cat.toLowerCase().includes(lowerQ)) {
                        matches.push({
                            title: title,
                            category: cat,
                            price: parseFloat(price) || 0,
                            image: img,
                            url: url
                        });
                    }
                });
            }

            if (matches.length < 5) {
                try {
                    const allProds = await dbGetAll('products');
                    if (allProds && allProds.length > 0) {
                        allProds.forEach(p => {
                            const pName = p.name || p.title || '';
                            const pCat = p.category || '';
                            if ((pName.toLowerCase().includes(lowerQ) || pCat.toLowerCase().includes(lowerQ)) && !matches.some(m => m.title === pName)) {
                                matches.push({
                                    title: pName,
                                    category: pCat,
                                    price: p.price || 0,
                                    image: p.image || '',
                                    url: p.url || ('#product/' + p.id)
                                });
                            }
                        });
                    }
                } catch (e) {}
            }

            if (matches.length === 0) {
                dropdown.innerHTML = `
                    <div class="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        <i class="fa-solid fa-box-open text-xl mb-1 text-slate-400"></i>
                        <p>Tidak ada produk yang cocok dengan "<strong>${escapeHtml(q)}</strong>"</p>
                    </div>
                `;
                dropdown.classList.remove('hidden');
                return;
            }

            const topMatches = matches.slice(0, 6);
            let html = `
                <div class="p-2 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-80 overflow-y-auto custom-scroll">
            `;

            topMatches.forEach(item => {
                const formattedPrice = formatRupiah(item.price);
                html += `
                    <a href="${item.url}" class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30 dark:hover:bg-slate-700/60 transition-colors group">
                        <img src="${item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=150'}" alt="${escapeHtml(item.title)}" class="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-transform" />
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-purple-600 dark:hover:text-purple-400 transition-colors">${escapeHtml(item.title)}</p>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="text-[10px] font-black text-purple-600">${formattedPrice}</span>
                                ${item.category ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase">${escapeHtml(item.category)}</span>` : ''}
                            </div>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] text-slate-400 group-hover:text-purple-600 dark:hover:text-purple-400 group-hover:translate-x-0.5 transition-all"></i>
                    </a>
                `;
            });

            html += `
                </div>
                <div class="p-2.5 bg-slate-50 dark:bg-slate-700/40 border-t border-slate-100 dark:border-slate-700 text-center rounded-b-2xl">
                    <button type="button" onclick="closeLiveSearchDropdown(); scrollCatalogIntoView();" class="text-xs font-bold text-purple-600 hover:text-orange-700 dark:hover:text-purple-300 dark:text-purple-400">
                        Lihat semua hasil (${matches.length} produk) &rarr;
                    </button>
                </div>
            `;

            dropdown.innerHTML = html;
            dropdown.classList.remove('hidden');
        }, 200);
    }

    function filterBloggerPostsGrid(keyword) {
        const grid = document.getElementById('blogger-posts-grid');
        if (!grid) return;
        const banner = document.getElementById('grid-filter-status-banner');
        const keywordSpan = document.getElementById('grid-filter-keyword');
        const cards = grid.querySelectorAll('.blogger-post-card-wrap');
        if (cards.length === 0) return;

        const lower = (keyword || '').toLowerCase().trim();
        if (!lower) {
            cards.forEach(c => c.classList.remove('hidden'));
            if (banner) banner.classList.add('hidden');
            return;
        }

        let matchCount = 0;
        cards.forEach(card => {
            const title = (card.getAttribute('data-post-title') || '').toLowerCase();
            const catEl = card.querySelector('.post-raw-category');
            const cat = (catEl ? catEl.textContent : '').toLowerCase();
            const snippetEl = card.querySelector('.post-raw-snippet');
            const snippet = (snippetEl ? snippetEl.textContent : '').toLowerCase();

            if (title.includes(lower) || cat.includes(lower) || snippet.includes(lower)) {
                card.classList.remove('hidden');
                matchCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        if (banner) {
            if (keywordSpan) keywordSpan.textContent = keyword;
            banner.classList.remove('hidden');
        }
    }

    function resetCatalogSearchFilter() {
        const dInput = document.getElementById('desktop-search');
        const mInput = document.getElementById('mobile-search');
        if (dInput) dInput.value = '';
        if (mInput) mInput.value = '';
        filterBloggerPostsGrid('');
        closeLiveSearchDropdown();
    }

    function closeLiveSearchDropdown() {
        const dDropdown = document.getElementById('desktop-live-search-dropdown');
        const mDropdown = document.getElementById('mobile-live-search-dropdown');
        if (dDropdown) dDropdown.classList.add('hidden');
        if (mDropdown) mDropdown.classList.add('hidden');
    }

    function scrollCatalogIntoView() {
        const grid = document.getElementById('blogger-posts-grid') || document.getElementById('katalog');
        if (grid) grid.scrollIntoView({ behavior: 'smooth' });
    }

    document.addEventListener('click', function(e) {
        const target = e.target;
        if (!target.closest('#desktop-search-container') && !target.closest('#mobile-search-container')) {
            closeLiveSearchDropdown();
        }
    });

    function openProductLightbox(imgSrc) {
        const lightbox = document.getElementById('product-image-lightbox');
        const fullImg = document.getElementById('lightbox-full-img');
        if (!lightbox || !fullImg) return;

        let src = imgSrc;
        if (!src) {
            const mainImg = document.getElementById('post-main-image');
            if (mainImg) src = mainImg.src;
        }
        if (!src) return;

        fullImg.src = src;
        fullImg.classList.remove('scale-150', 'cursor-zoom-out');
        fullImg.classList.add('cursor-zoom-in');

        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        requestAnimationFrame(() => {
            lightbox.classList.remove('opacity-0');
            lightbox.classList.add('opacity-100');
        });
        document.body.style.overflow = 'hidden';
    }

    function closeProductLightbox() {
        const lightbox = document.getElementById('product-image-lightbox');
        if (!lightbox) return;
        lightbox.classList.remove('opacity-100');
        lightbox.classList.add('opacity-0');
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            document.body.style.overflow = '';
        }, 300);
    }

    function openPodLightbox(imgSrc, title, meta, externalUrl) {
        const lightbox = document.getElementById('pod-image-lightbox');
        const fullImg = document.getElementById('pod-lightbox-img');
        const titleEl = document.getElementById('pod-lightbox-title');
        const metaEl = document.getElementById('pod-lightbox-meta');
        const extBtn = document.getElementById('pod-lightbox-open-external');
        if (!lightbox || !fullImg) return;
        if (!imgSrc) return;

        fullImg.src = imgSrc;
        if (titleEl && title) titleEl.textContent = title;
        if (metaEl && meta) metaEl.innerHTML = meta;
        if (extBtn) {
            extBtn.href = externalUrl || imgSrc;
        }

        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        requestAnimationFrame(() => {
            lightbox.classList.remove('opacity-0');
            lightbox.classList.add('opacity-100');
        });
        document.body.style.overflow = 'hidden';
    }

    function closePodLightbox() {
        const lightbox = document.getElementById('pod-image-lightbox');
        if (!lightbox) return;
        lightbox.classList.remove('opacity-100');
        lightbox.classList.add('opacity-0');
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            document.body.style.overflow = '';
        }, 300);
    }

    function toggleLightboxZoom(imgEl) {
        if (!imgEl) return;
        if (imgEl.classList.contains('scale-150')) {
            imgEl.classList.remove('scale-150', 'cursor-zoom-out');
            imgEl.classList.add('cursor-zoom-in');
        } else {
            imgEl.classList.add('scale-150', 'cursor-zoom-out');
            imgEl.classList.remove('cursor-zoom-in');
        }
    }

    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeProductLightbox();
            closePodLightbox();
            closePromoCouponPopup();
            closeLiveSearchDropdown();
        }
    });

    function getCustomPromoPopupConfig() {
        const config = {
            enabled: true,
            title: 'Klaim Voucher Diskon Belanja!',
            subtitle: 'Gunakan kode kupon berikut saat checkout untuk menikmati potongan harga langsung:',
            badge: 'Hadiah Spesial Anda',
            image: '',
            coupons: [],
            buttonText: 'Mulai Belanja & Gunakan Kupon',
            buttonLink: '#katalog-produk',
            delaySeconds: 1.5,
            customHtml: ''
        };

        try {
            const el = document.getElementById('blogger-promo-popup-data');
            if (!el || !el.textContent) return config;
            const raw = el.textContent.trim();
            if (!raw) return config;

            if (raw.startsWith('<') && raw.includes('</div>')) {
                config.customHtml = raw;
                return config;
            }

            const lines = raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
            for (const line of lines) {
                const parts = line.split('|').map(p => p.trim());
                const key = (parts[0] || '').toUpperCase();
                if (key === 'STATUS_POPUP' || key === 'STATUS') {
                    const val = (parts[1] || '').toLowerCase();
                    config.enabled = !(val === 'nonaktif' || val === 'false' || val === '0' || val === 'off');
                } else if (key === 'JUDUL' || key === 'TITLE') {
                    if (parts[1]) config.title = parts[1];
                } else if (key === 'SUBJUDUL' || key === 'SUBTITLE' || key === 'PESAN') {
                    if (parts[1]) config.subtitle = parts[1];
                } else if (key === 'BADGE') {
                    if (parts[1]) config.badge = parts[1];
                } else if (key === 'GAMBAR' || key === 'IMAGE' || key === 'BANNER') {
                    if (parts[1]) config.image = parts[1];
                } else if (key === 'DELAY_DETIK' || key === 'DELAY') {
                    const sec = parseFloat(parts[1]);
                    if (!isNaN(sec) && sec >= 0) config.delaySeconds = sec;
                } else if (key === 'TOMBOL' || key === 'BUTTON') {
                    if (parts[1]) config.buttonText = parts[1];
                    if (parts[2]) config.buttonLink = parts[2];
                } else if (key === 'KUPON' || key === 'COUPON') {
                    if (parts[1]) {
                        config.coupons.push({
                            code: parts[1].toUpperCase(),
                            badge: parts[2] || '',
                            minSpendText: parts[3] || '',
                            desc: parts[4] || ''
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca konfigurasi popup promo kustom:', e);
        }
        return config;
    }

