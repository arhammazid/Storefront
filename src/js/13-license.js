    /**
     * =========================================================================
     * Security & License Verification Engine (Robust & Persistent)
     * =========================================================================
     */
    var _secCodes = [68, 49, 50, 73, 71, 49, 50, 73, 65, 82, 56, 57, 74, 85, 95, 79, 75];
    var _getSecKey = function() {
        return String.fromCharCode.apply(null, _secCodes);
    };

    function generateExpectedLicenseToken(id, secret) {
        if (!id) return "";
        var key = secret || _getSecKey();
        var str = String(id).trim() + String(key).trim();
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return "ARJU-" + Math.abs(hash).toString(16).toUpperCase();
    }

    function extractLicenseToken(raw) {
        if (!raw) return "";
        var str = String(raw).trim();
        if (!str || str.indexOf('MASUKKAN_TOKEN_DISINI') !== -1) return "";

        // Format standar: ARJU-XXXXX
        var match = str.match(/ARJU-[A-Za-z0-9_-]+/i);
        if (match) return match[0].toUpperCase();

        // Jika user hanya memasukkan kode hex tanpa prefix 'ARJU-'
        var hexMatch = str.match(/^[A-Fa-f0-9]{4,16}$/);
        if (hexMatch) return ("ARJU-" + hexMatch[0]).toUpperCase();

        return str.toUpperCase();
    }

    function getClientBloggerId() {
        // 1. Dari variabel global Blogger di template
        if (typeof currentBloggerId !== 'undefined' && currentBloggerId) {
            var cId = String(currentBloggerId).trim();
            if (cId && cId.indexOf('data:blog') === -1) return cId;
        }

        if (typeof window.__BLOG_ID !== 'undefined' && window.__BLOG_ID) {
            var wId = String(window.__BLOG_ID).trim();
            if (wId && wId.indexOf('data:blog') === -1) return wId;
        }

        // 2. Dari internal WidgetManager Blogger bawaan
        try {
            if (window._WidgetManager && typeof window._WidgetManager._GetAllData === 'function') {
                var wData = window._WidgetManager._GetAllData();
                if (wData && wData.blog && wData.blog.blogId) {
                    var wmId = String(wData.blog.blogId).trim();
                    if (wmId && wmId.indexOf('data:blog') === -1) return wmId;
                }
            }
        } catch(e) {}

        // 3. Dari tag RSD bawaan Blogger
        var rsd = document.querySelector('link[type="application/rsd+xml"]');
        if (rsd && rsd.href) {
            var matchRsd = rsd.href.match(/blogID=(\d+)/i);
            if (matchRsd && matchRsd[1]) return matchRsd[1];
        }

        // 4. Dari feed post bawaan Blogger
        var feed = document.querySelector('link[rel="service.post"]');
        if (feed && feed.href) {
            var matchFeed = feed.href.match(/feeds\/(\d+)\/posts/i);
            if (matchFeed && matchFeed[1]) return matchFeed[1];
        }

        return localStorage.getItem('dg_dev_test_blog_id') || '';
    }

    function verifyLicenseToken(token) {
        if (!token) return false;
        var clean = extractLicenseToken(token);
        if (!clean) return false;

        // A. Verifikasi via Hostname / Domain Blog
        var host = (window.location.hostname || '').replace(/^www\./i, '').toLowerCase();
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
            var expectedHostToken = generateExpectedLicenseToken(host);
            if (clean === expectedHostToken) return true;
        }

        // B. Verifikasi via Blogger ID
        var blogId = getClientBloggerId();
        if (blogId) {
            var expectedBlogToken = generateExpectedLicenseToken(blogId);
            if (clean === expectedBlogToken) return true;
        }

        return false;
    }

    var _persistedTokenCache = '';

    function getTataLetakWidgetToken() {
        if (_persistedTokenCache) return _persistedTokenCache;

        // 1. Periksa memory token dari inline script
        if (window.__dg_ltk) {
            var t0 = extractLicenseToken(window.__dg_ltk);
            if (t0) {
                _persistedTokenCache = t0;
                return _persistedTokenCache;
            }
        }

        // 2. Periksa elemen DOM jika masih ada
        var keyElement = document.getElementById('template-license-key');
        if (keyElement) {
            var raw = (keyElement.textContent || keyElement.innerText || '').trim();
            var t1 = extractLicenseToken(raw);
            if (t1) {
                _persistedTokenCache = t1;
                return _persistedTokenCache;
            }
        }

        // 3. Periksa section lisensi jika ada
        var sec = document.getElementById('lisensi-section');
        if (sec) {
            var rawSec = (sec.textContent || sec.innerText || '').trim();
            var t2 = extractLicenseToken(rawSec);
            if (t2) {
                _persistedTokenCache = t2;
                return _persistedTokenCache;
            }
        }

        // 4. Periksa dari cadangan penyimpanan lokal (fail-safe)
        try {
            var saved = localStorage.getItem('dg_activated_license') || '';
            if (saved) {
                var t3 = extractLicenseToken(saved);
                if (t3) {
                    _persistedTokenCache = t3;
                    return _persistedTokenCache;
                }
            }
        } catch(e) {}

        return '';
    }

    function checkTemplateLicense() {
        // Jika sudah pernah berhasil aktif, jangan pernah kunci lagi
        if (window.__isTemplateLicensed === true) {
            return true;
        }

        var popup = document.getElementById('activation-popup');
        var wrapper = document.getElementById('contentWrapper');

        var widgetToken = getTataLetakWidgetToken();
        var urlToken = '';
        try {
            urlToken = new URLSearchParams(window.location.search).get('license') || '';
        } catch(e) {}

        var isActivated = false;
        var validToken = '';

        if (widgetToken && verifyLicenseToken(widgetToken)) {
            isActivated = true;
            validToken = widgetToken;
        } else if (urlToken && verifyLicenseToken(urlToken)) {
            isActivated = true;
            validToken = urlToken;
        }

        if (isActivated) {
            window.__isTemplateLicensed = true;

            // Simpan token yang valid ke cache dan penyimpanan lokal sebagai fail-safe
            _persistedTokenCache = validToken;
            try {
                localStorage.setItem('dg_activated_license', validToken);
            } catch(e) {}

            // Sembunyikan popup aktivasi dan buka tampilan web
            if (popup) {
                popup.style.display = 'none';
            }
            if (wrapper) {
                wrapper.style.display = '';
            }
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';

            return true;
        } else {
            window.__isTemplateLicensed = false;

            if (popup) {
                popup.style.display = 'flex';
                document.documentElement.style.overflow = 'hidden';
                document.body.style.overflow = 'hidden';
            }
            if (wrapper) {
                wrapper.style.display = 'none';
            }
            return false;
        }
    }

    checkTemplateLicense();
    document.addEventListener('DOMContentLoaded', checkTemplateLicense);
