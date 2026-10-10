    /**
     * =========================================================================
     * Security & License Verification Engine
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
        var match = str.match(/ARJU-[A-Za-z0-9_-]+/i);
        return match ? match[0].toUpperCase() : "";
    }

    function getClientBloggerId() {
        // 1. Periksa dari internal WidgetManager Blogger bawaan
        try {
            if (window._WidgetManager && typeof window._WidgetManager._GetAllData === 'function') {
                var wData = window._WidgetManager._GetAllData();
                if (wData && wData.blog && wData.blog.blogId) {
                    return String(wData.blog.blogId).trim();
                }
            }
        } catch(e) {}

        // 2. Periksa dari tag RSD bawaan Blogger
        var rsd = document.querySelector('link[type="application/rsd+xml"]');
        if (rsd && rsd.href) {
            var matchRsd = rsd.href.match(/blogID=(\d+)/i);
            if (matchRsd && matchRsd[1]) return matchRsd[1];
        }

        // 3. Periksa dari feed post bawaan Blogger
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

        // A. Verifikasi via Hostname / Domain (Rekomendasi Utama)
        var host = (window.location.hostname || '').replace(/^www\./i, '').toLowerCase();
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
            var expectedHostToken = generateExpectedLicenseToken(host);
            if (clean === expectedHostToken) return true;
        }

        // B. Verifikasi via Blogger ID (Internal)
        var blogId = getClientBloggerId();
        if (blogId) {
            var expectedBlogToken = generateExpectedLicenseToken(blogId);
            if (clean === expectedBlogToken) return true;
        }

        return false;
    }

    function getTataLetakWidgetToken() {
        var tok = '';

        // 1. Ambil dari memory token yang diselamatkan sebelum DOM dihapus
        if (window.__dg_ltk) {
            tok = extractLicenseToken(window.__dg_ltk);
            try { delete window.__dg_ltk; } catch(e) { window.__dg_ltk = null; }
        }

        // 2. Jika masih ada elemen di DOM, ambil dan segera musnahkan (self-destruct)
        if (!tok) {
            var keyElement = document.getElementById('template-license-key');
            if (keyElement) {
                var raw = (keyElement.innerText || keyElement.textContent || '').trim();
                tok = extractLicenseToken(raw);
                try { keyElement.parentNode.removeChild(keyElement); } catch(e) {}
            }
        }

        // 3. Fallback jika ada di container widget
        if (!tok) {
            var sec = document.getElementById('lisensi-section');
            if (sec) {
                tok = extractLicenseToken(sec.innerText || sec.textContent || '');
            }
        }

        return tok;
    }

    function checkTemplateLicense() {
        var popup = document.getElementById('activation-popup');
        var wrapper = document.getElementById('contentWrapper');

        try {
            localStorage.removeItem('template_license_key');
        } catch(e) {}

        var widgetToken = getTataLetakWidgetToken();
        var urlToken = '';
        try {
            urlToken = new URLSearchParams(window.location.search).get('license') || '';
        } catch(e) {}

        var isActivated = false;
        if (verifyLicenseToken(widgetToken)) {
            isActivated = true;
        } else if (urlToken && verifyLicenseToken(urlToken)) {
            isActivated = true;
        }

        // Kunci status lisensi dengan Object.defineProperty agar tidak bisa diubah via DevTools Console
        try {
            Object.defineProperty(window, '__isTemplateLicensed', {
                value: isActivated,
                writable: false,
                configurable: false
            });
        } catch(e) {
            window.__isTemplateLicensed = isActivated;
        }

        if (!isActivated) {
            if (popup) {
                popup.style.display = 'flex';
                document.documentElement.style.overflow = 'hidden';
                document.body.style.overflow = 'hidden';
            }
            if (wrapper) {
                wrapper.style.display = 'none';
            }
            return false;
        } else {
            if (popup) {
                popup.style.display = 'none';
            }
            if (wrapper) {
                wrapper.style.display = '';
            }
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            return true;
        }
    }

    checkTemplateLicense();
    document.addEventListener('DOMContentLoaded', checkTemplateLicense);
