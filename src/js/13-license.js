
    const LICENSE_SECRET_KEY = "D12IG12IAR89JU_OK";

    function generateExpectedLicenseToken(id, secret) {
        if (!id) return "";
        var str = String(id).trim() + String(secret).trim();
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
        var metaId = document.querySelector('meta[name="blogger-blog-id"]');
        if (metaId && metaId.content && metaId.content.trim() && metaId.content.indexOf('data:blog') === -1) {
            return metaId.content.trim();
        }

        var helper = document.getElementById('blogger-meta-helper');
        if (helper) {
            var attrId = helper.getAttribute('data-blog-id');
            if (attrId && attrId.trim() && attrId.indexOf('data:blog') === -1) {
                return attrId.trim();
            }
            var textId = (helper.innerText || helper.textContent || '').trim();
            if (textId && textId.indexOf('data:blog') === -1) {
                return textId;
            }
        }

        if (typeof currentBloggerId !== 'undefined' && currentBloggerId && String(currentBloggerId).indexOf('data:blog') === -1) {
            return String(currentBloggerId).trim();
        }

        var rsd = document.querySelector('link[type="application/rsd+xml"]');
        if (rsd && rsd.href) {
            var matchRsd = rsd.href.match(/blogID=(\d+)/i);
            if (matchRsd && matchRsd[1]) return matchRsd[1];
        }

        var feed = document.querySelector('link[rel="service.post"]');
        if (feed && feed.href) {
            var matchFeed = feed.href.match(/feeds\/(\d+)\/posts/i);
            if (matchFeed && matchFeed[1]) return matchFeed[1];
        }

        try {
            if (window._WidgetManager && typeof window._WidgetManager._GetAllData === 'function') {
                var wData = window._WidgetManager._GetAllData();
                if (wData && wData.blog && wData.blog.blogId) {
                    return String(wData.blog.blogId).trim();
                }
            }
        } catch(e) {}

        return localStorage.getItem('dg_dev_test_blog_id') || '1234567890123456789';
    }

    function verifyLicenseToken(token) {
        if (!token) return false;
        var clean = extractLicenseToken(token);
        if (!clean) return false;

        var blogId = getClientBloggerId();
        var expectedBlogToken = generateExpectedLicenseToken(blogId, LICENSE_SECRET_KEY);
        if (clean === expectedBlogToken) return true;

        var host = (window.location.hostname || '').replace(/^www\./i, '').toLowerCase();
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
            var expectedHostToken = generateExpectedLicenseToken(host, LICENSE_SECRET_KEY);
            if (clean === expectedHostToken) return true;
        }

        return false;
    }

    function getTataLetakWidgetToken() {
        var keyElement = document.getElementById('template-license-key');
        if (keyElement) {
            var raw = (keyElement.innerText || keyElement.textContent || '').trim();
            var tok = extractLicenseToken(raw);
            if (tok) return tok;
        }

        var sec = document.getElementById('lisensi-section');
        if (sec) {
            var secTok = extractLicenseToken(sec.innerText || sec.textContent || '');
            if (secTok) return secTok;
        }

        return '';
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

        if (!isActivated) {
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
        } else {
            window.__isTemplateLicensed = true;

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

