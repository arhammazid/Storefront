    function initPromoCouponPopup() {
        const cfg = getCustomPromoPopupConfig();
        if (!cfg.enabled) return;
        if (sessionStorage.getItem('dg_promo_popup_seen')) return;

        const delayMs = (cfg.delaySeconds > 0 ? cfg.delaySeconds : 1.5) * 1000;
        setTimeout(() => {
            showPromoCouponPopup(false);
        }, delayMs);

        document.addEventListener('mouseleave', function onMouseLeave(e) {
            if (e.clientY <= 15 && !sessionStorage.getItem('dg_promo_popup_seen')) {
                showPromoCouponPopup(false);
                document.removeEventListener('mouseleave', onMouseLeave);
            }
        });
    }

    function showPromoCouponPopup(force = false) {
        const cfg = getCustomPromoPopupConfig();
        if (!force && !cfg.enabled) return;
        if (!force && sessionStorage.getItem('dg_promo_popup_seen')) return;

        const popup = document.getElementById('promo-coupon-popup');
        const box = document.getElementById('promo-coupon-box');
        const container = document.getElementById('promo-coupons-popup-list');
        const bannerWrap = document.getElementById('promo-popup-banner-container');
        const bannerImg = document.getElementById('promo-popup-banner-img');
        const iconEl = document.getElementById('promo-popup-icon');
        const badgeEl = document.getElementById('promo-popup-badge');
        const titleEl = document.getElementById('promo-popup-title');
        const subtitleEl = document.getElementById('promo-popup-subtitle');
        const customHtmlEl = document.getElementById('promo-popup-custom-html');
        const headerBlock = document.getElementById('promo-popup-header-block');
        const actionsBlock = document.getElementById('promo-popup-actions-block');
        const ctaBtn = document.getElementById('promo-popup-cta-btn');

        if (!popup || !box) return;

        if (cfg.customHtml && customHtmlEl) {
            customHtmlEl.innerHTML = cfg.customHtml;
            customHtmlEl.classList.remove('hidden');
            if (headerBlock) headerBlock.classList.add('hidden');
            if (container) container.classList.add('hidden');
            if (actionsBlock) actionsBlock.classList.add('hidden');
        } else {
            if (customHtmlEl) customHtmlEl.classList.add('hidden');
            if (headerBlock) headerBlock.classList.remove('hidden');
            if (container) container.classList.remove('hidden');
            if (actionsBlock) actionsBlock.classList.remove('hidden');

            if (cfg.image && bannerWrap && bannerImg) {
                bannerImg.src = cfg.image;
                bannerWrap.classList.remove('hidden');
                if (iconEl) iconEl.classList.add('hidden');
            } else {
                if (bannerWrap) bannerWrap.classList.add('hidden');
                if (iconEl) iconEl.classList.remove('hidden');
            }

            if (badgeEl) badgeEl.textContent = cfg.badge;
            if (titleEl) titleEl.textContent = cfg.title;
            if (subtitleEl) subtitleEl.textContent = cfg.subtitle;

            if (ctaBtn) {
                ctaBtn.textContent = cfg.buttonText;
                ctaBtn.onclick = function() {
                    closePromoCouponPopup();
                    if (cfg.buttonLink && cfg.buttonLink !== '#katalog-produk' && !cfg.buttonLink.startsWith('#')) {
                        window.location.href = cfg.buttonLink;
                    } else {
                        useCouponAndScrollProducts();
                    }
                };
            }

            if (container) {
                let couponsToRender = [];
                if (cfg.coupons && cfg.coupons.length > 0) {
                    couponsToRender = cfg.coupons.map(c => ({
                        code: c.code,
                        badgeText: c.badge || 'Diskon',
                        desc: c.desc || (c.minSpendText ? 'Min. Belanja ' + c.minSpendText : 'Semua Pembelian')
                    }));
                } else {
                    const storeCoupons = getPromoCoupons() || [];
                    couponsToRender = storeCoupons.slice(0, 2).map(c => ({
                        code: c.code,
                        badgeText: c.type === 'PERCENT' ? '-' + c.value + '%' : (c.type === 'SHIPPING' ? 'Bebas Ongkir' : '-' + formatRupiah(c.value)),
                        desc: c.desc || (c.minSpend > 0 ? 'Min. Belanja ' + formatRupiah(c.minSpend) : 'Semua Pembelian')
                    }));
                }

                if (couponsToRender.length > 0) {
                    container.innerHTML = couponsToRender.map(c => `
                    <div class="p-3.5 rounded-2xl bg-orange-50/80 dark:bg-slate-700/50 border-2 border-dashed border-amber-400 dark:border-amber-600/60 mb-3 flex items-center justify-between gap-3 shadow-sm">
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="font-black font-mono text-sm text-purple-600 dark:text-purple-400">${escapeHtml(c.code)}</span>
                                <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-amber-600 to-red-600 text-white">${escapeHtml(c.badgeText)}</span>
                            </div>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${escapeHtml(c.desc)}</p>
                        </div>
                        <button class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white font-black text-xs shadow-sm hover:scale-105 transition-all flex-shrink-0" onclick="copyCouponCode('${escapeHtml(c.code)}')" type="button">
                            Salin Kode
                        </button>
                    </div>
                    `).join('');
                } else {
                    container.innerHTML = `
                    <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 text-center text-xs text-slate-500 mb-3">
                        Gunakan kode voucher saat checkout pesanan makanan Anda.
                    </div>`;
                }
            }
        }

        sessionStorage.setItem('dg_promo_popup_seen', 'true');
        popup.classList.remove('hidden');
        popup.classList.add('flex');
        requestAnimationFrame(() => {
            popup.classList.remove('opacity-0');
            popup.classList.add('opacity-100');
            box.classList.remove('scale-95');
            box.classList.add('scale-100');
        });
    }

    function closePromoCouponPopup() {
        const popup = document.getElementById('promo-coupon-popup');
        const box = document.getElementById('promo-coupon-box');
        if (!popup) return;
        if (box) {
            box.classList.remove('scale-100');
            box.classList.add('scale-95');
        }
        popup.classList.remove('opacity-100');
        popup.classList.add('opacity-0');
        setTimeout(() => {
            popup.classList.add('hidden');
            popup.classList.remove('flex');
        }, 300);
    }

    function copyCouponCode(code) {
        if (!code) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
                showToast('Kode kupon ' + code + ' berhasil disalin!', '#10b981');
            }).catch(() => {
                fallbackCopyText(code);
            });
        } else {
            fallbackCopyText(code);
        }
    }

    window.showPromoCouponPopup = showPromoCouponPopup;
    window.closePromoCouponPopup = closePromoCouponPopup;
    window.copyCouponCode = copyCouponCode;

    function fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Kode kupon ' + text + ' berhasil disalin!', '#10b981');
        } catch (e) {
            prompt('Salin kode kupon ini:', text);
        }
        document.body.removeChild(textArea);
    }

    function useCouponAndScrollProducts() {
        closePromoCouponPopup();
        goToHome();
    }

    let currentSelectedStar = 5;
    const starDescriptions = {
        5: '⭐⭐⭐⭐⭐ (5/5) Sangat Puas / Lezat Sekali!',
        4: '⭐⭐⭐⭐ (4/5) Puas / Makanan Enak',
        3: '⭐⭐⭐ (3/5) Cukup Baik',
        2: '⭐⭐ (2/5) Kurang Memuaskan',
        1: '⭐ (1/5) Kecewa / Perlu Perbaikan'
    };

    function handleStarClick(rating) {
        currentSelectedStar = rating;
        updateStarPickerUI(rating);
    }
    window.handleStarClick = handleStarClick;

    function updateStarPickerUI(rating) {
        const btns = document.querySelectorAll('.star-picker-btn');
        btns.forEach((btn, idx) => {
            const starVal = idx + 1;
            if (starVal <= rating) {
                btn.classList.add('text-amber-400');
                btn.classList.remove('text-slate-300', 'dark:text-slate-600');
            } else {
                btn.classList.remove('text-amber-400');
                btn.classList.add('text-slate-300', 'dark:text-slate-600');
            }
        });
        const labelEl = document.getElementById('interactive-star-label');
        if (labelEl) {
            labelEl.textContent = starDescriptions[rating] || `(${rating}/5)`;
        }
        const codeEl = document.getElementById('star-rating-code');
        if (codeEl) {
            const starsEmoji = '⭐'.repeat(rating);
            codeEl.textContent = `[Rating: ${rating}/5 ${starsEmoji}]`;
        }
    }

    function copyStarRatingCode() {
        const codeEl = document.getElementById('star-rating-code');
        const codeText = codeEl ? codeEl.textContent.trim() : `[Rating: ${currentSelectedStar}/5]`;

        navigator.clipboard.writeText(codeText).then(() => {
            const btnText = document.getElementById('btn-copy-star-text');
            const btn = document.getElementById('btn-copy-star');
            if (btnText) btnText.textContent = 'Tersalin!';
            if (btn) btn.classList.add('bg-emerald-600');

            if (typeof showToast === 'function') {
                showToast('Kode rating disalin! Silakan tempelkan di form komentar di bawah.');
            }

            setTimeout(() => {
                if (btnText) btnText.textContent = 'Salin Rating ke Komentar';
                if (btn) btn.classList.remove('bg-emerald-600');
            }, 2500);

            const cmtEditor = document.getElementById('comment-editor') || document.getElementById('blogger-comments-container');
            if (cmtEditor) {
                cmtEditor.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }).catch(() => {
            if (typeof showToast === 'function') {
                showToast('Salin kode: ' + codeText);
            }
        });
    }
    window.copyStarRatingCode = copyStarRatingCode;

    function parseAndRenderCommentStars(postId) {
        const commentBodies = document.querySelectorAll(
            '#comments .comment-body, #comments-block .comment-body, #comment-holder .comment-content, .comment-thread .comment-content, .comments-content .comment-content, .comment-block .comment-body'
        );

        let totalStars = 0;
        let ratedCount = 0;

        if (commentBodies && commentBodies.length > 0) {
            commentBodies.forEach(bodyEl => {
                if (bodyEl.getAttribute('data-star-parsed') === 'true') {
                    const prevRating = parseFloat(bodyEl.getAttribute('data-rating-val') || '0');
                    if (prevRating > 0) {
                        totalStars += prevRating;
                        ratedCount++;
                    }
                    return;
                }

                const rawText = bodyEl.textContent || '';
                let detectedRating = null;

                const bracketMatch = rawText.match(/\[\s*(?:rating|bintang|star|nilai)?\s*:\s*([1-5])(?:\s*\/\s*5)?(?:[^\]]*?)\]/i);
                const scoreMatch = rawText.match(/\[\s*([1-5])\s*\/\s*5\s*\]/i);
                const emojiMatch = rawText.match(/(⭐{1,5})/);
                const unicodeStarMatch = rawText.match(/(★{1,5})/);
                const textScoreMatch = rawText.match(/(?:rating|bintang|nilai)\s*:\s*([1-5])(?:\s*\/\s*5)?/i);

                if (bracketMatch) {
                    detectedRating = parseInt(bracketMatch[1], 10);
                } else if (scoreMatch) {
                    detectedRating = parseInt(scoreMatch[1], 10);
                } else if (emojiMatch) {
                    detectedRating = emojiMatch[1].length;
                } else if (unicodeStarMatch) {
                    detectedRating = unicodeStarMatch[1].length;
                } else if (textScoreMatch) {
                    detectedRating = parseInt(textScoreMatch[1], 10);
                }

                if (detectedRating && detectedRating >= 1 && detectedRating <= 5) {
                    bodyEl.setAttribute('data-star-parsed', 'true');
                    bodyEl.setAttribute('data-rating-val', detectedRating);

                    totalStars += detectedRating;
                    ratedCount++;

                    let starIcons = '';
                    for (let i = 1; i <= 5; i++) {
                        if (i <= detectedRating) {
                            starIcons += '<i class="fa-solid fa-star text-amber-400"></i>';
                        } else {
                            starIcons += '<i class="fa-solid fa-star text-slate-300 dark:text-slate-600"></i>';
                        }
                    }

                    const ratingLabels = {
                        5: 'Sangat Puas',
                        4: 'Puas / Lezat',
                        3: 'Cukup',
                        2: 'Kurang',
                        1: 'Kecewa'
                    };

                    const starBadge = document.createElement('div');
                    starBadge.className = 'comment-rating-badge';
                    starBadge.innerHTML = `
                        <div class="flex items-center gap-0.5 text-xs">${starIcons}</div>
                        <span class="text-slate-800 dark:text-white font-extrabold text-[11px]">${detectedRating}.0</span>
                        <span class="text-slate-400 dark:text-slate-500 font-normal text-[10px]">• ${ratingLabels[detectedRating] || 'Ulasan'}</span>
                    `;

                    let cleanHtml = bodyEl.innerHTML
                        .replace(/\[\s*(?:rating|bintang|star|nilai)?\s*:\s*[1-5](?:\s*\/\s*5)?[^\]]*?\]/gi, '')
                        .replace(/\[\s*[1-5]\s*\/\s*5\s*\]/gi, '')
                        .trim();

                    bodyEl.innerHTML = cleanHtml;
                    bodyEl.insertBefore(starBadge, bodyEl.firstChild);
                }
            });
        }

        let finalAvg = '5.0';
        if (ratedCount > 0) {
            finalAvg = (totalStars / ratedCount).toFixed(1);
        } else if (window.currentBloggerProduct && window.currentBloggerProduct.rating && Number(window.currentBloggerProduct.rating) > 0) {
            finalAvg = Number(window.currentBloggerProduct.rating).toFixed(1);
        }

        const bigScore = document.getElementById('review-score-big');
        if (bigScore) bigScore.textContent = finalAvg;

        const bigStarsWrap = document.getElementById('review-stars-big');
        if (bigStarsWrap) {
            let bigStarsHtml = '';
            const roundedAvg = Math.round(parseFloat(finalAvg));
            for (let i = 1; i <= 5; i++) {
                if (i <= roundedAvg) {
                    bigStarsHtml += '<i class="fa-solid fa-star text-amber-400"></i>';
                } else {
                    bigStarsHtml += '<i class="fa-solid fa-star text-slate-300 dark:text-slate-600"></i>';
                }
            }
            bigStarsWrap.innerHTML = bigStarsHtml;
        }

        const countSummary = document.getElementById('review-count-summary');
        if (countSummary) {
            if (ratedCount > 0) {
                countSummary.textContent = `Berdasarkan ${ratedCount} ulasan pembeli (${finalAvg} dari 5.0)`;
            } else {
                countSummary.textContent = `Berdasarkan penilaian menu (${finalAvg} dari 5.0)`;
            }
        }

        const headerRatingVal = document.getElementById('product-header-rating-val');
        if (headerRatingVal) {
            headerRatingVal.textContent = finalAvg;
        }

        if (postId && ratedCount > 0) {
            try {
                const localCache = [];
                for (let c = 0; c < ratedCount; c++) localCache.push({ rating: finalAvg });
                localStorage.setItem('dg_reviews_' + postId, JSON.stringify(localCache));
                localStorage.setItem('dg_reviews_bp_' + postId, JSON.stringify(localCache));
            } catch(e) {}
        }
    }

