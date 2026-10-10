    async function boot() {
        try {
            
            if (!checkTemplateLicense()) {
                console.warn('Boot sequence dihentikan: Lisensi template belum aktif.');
                return;
            }
            dbInstance = await openDB();
            await seedIfEmpty();
            
            await syncProductsFromBloggerFeed();
            getSellerWhatsAppNumber();
            getPaymentMethods();
            getShippingDestinations();
            await restoreSavedCustomerLocation();
            getAddressOptions();
            getPromoCoupons();
            syncCouponsFromGAS();
            renderStoreStatusBanner();
            initSocialProofNotifications();
            initPromoBannerSlider();
            initPromoCouponPopup();
            initFlashSaleCountdown();
            await renderDynamicFlashSaleProducts();
            syncWhatsAppLinks();
            renderBottomNav();
            syncThemeIcon();
            await updateCartBadge();
            await route();
        } catch (err) {
            console.error('Boot error:', err);
        }
    }

    window.addEventListener('hashchange', route);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
