// ==========================================================
// MODULE: 01-config.js
// ==========================================================
    window.onerror = function(msg, url, line, col, err) {
        console.error("PAGE_JS_ERROR:", msg, "at line", line, "col", col, err);
        var d = document.createElement('div');
        d.id = 'debug-js-error';
        d.style.display = 'none';
        d.textContent = 'PAGE_JS_ERROR: ' + msg + ' at line ' + line + ' col ' + col;
        if (document.body) document.body.appendChild(d);
    };
    var uri = window.location.toString();
    if (uri.indexOf("?m=1") > 0) {
        var clean_uri = uri.substring(0, uri.indexOf("?m=1"));
        window.history.replaceState({}, document.title, clean_uri);
    } else if (uri.indexOf("&m=1") > 0) {
        var clean_uri = uri.substring(0, uri.indexOf("&m=1"));
        window.history.replaceState({}, document.title, clean_uri);
    }

if (!window.STORE_NAME) {
    window.STORE_NAME = (typeof STORE_NAME !== 'undefined' && STORE_NAME) ? STORE_NAME : 'Digiarju Resto & Food';
}

function syncStoreBrandNameUI() {
    try {
        if (window.STORE_NAME) {
            document.querySelectorAll('.store-brand-name').forEach(function(el) {
                el.textContent = window.STORE_NAME;
            });
        }
    } catch(e) {}
}

document.addEventListener('DOMContentLoaded', syncStoreBrandNameUI);

let SELLER_WHATSAPP_NUMBER = '';

    var GOOGLE_APPS_SCRIPT_URL = '';
    function currentRoute() {
        let hash = window.location.hash || '#/home';
        hash = hash.replace(/^#/, '');
        if (!hash.startsWith('/')) hash = '/' + hash;
        return hash.split('/').filter(Boolean);
    }
    function navigate(path) {
        if (!path || path === '/home' || path === 'home' || path === '/') {
            if (window.location.pathname !== '/' && !window.location.pathname.endsWith('/index.html')) {
                window.location.href = '/';
                return;
            }
            if (window.location.hash) {
                window.location.hash = '';
            }
            route();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const pagePathMap = {
            'cart': '/p/cart.html',
            'checkout': '/p/checkout.html',
            'orders': '/p/orders.html',
            'profile': '/p/profile.html',
            'lacak': '/p/lacak.html'
        };

        const cleanKey = String(path).toLowerCase().trim().replace(/^#\/?/, '').replace(/^\//, '');
        const baseKey = cleanKey.split('?')[0].split('#')[0];
        const queryPart = String(path).includes('?') ? String(path).substring(String(path).indexOf('?')) : '';
        if (pagePathMap[baseKey]) {
            const targetUrl = pagePathMap[baseKey] + queryPart;
            if (window.location.pathname.toLowerCase().endsWith(pagePathMap[baseKey].toLowerCase())) {
                if (queryPart && window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', targetUrl);
                }
                route();
                return;
            }
            window.location.href = targetUrl;
            return;
        }

        if (baseKey.startsWith('order/') || baseKey.startsWith('lacak/')) {
            const parts = cleanKey.split('/');
            if (parts[1]) {
                const orderIdVal = parts[1].split('?')[0].split('#')[0];
                const targetUrl = '/p/lacak.html?orderId=' + encodeURIComponent(orderIdVal);
                if (window.location.pathname.toLowerCase().endsWith('/p/lacak.html')) {
                    if (window.history && window.history.replaceState) {
                        window.history.replaceState(null, '', targetUrl);
                    }
                    route();
                    return;
                }
                window.location.href = targetUrl;
                return;
            }
        }

        if (String(path).includes('/p/')) {
            window.location.href = path;
            return;
        }

        const isStaticPage = window.location.pathname && window.location.pathname.includes('/p/');
        if (isStaticPage) {
            window.location.href = '/#' + (path.startsWith('/') ? path : '/' + path);
            return;
        }
        const targetHash = '#' + (path.startsWith('/') ? path : '/' + path);
        if (window.location.hash === targetHash) {
            route();
        } else {
            window.location.hash = targetHash;
        }
    }



    let currentSelectedSpice = 'Level 1 (Sedang)';
    function selectModalSpice(level, label) {
        currentSelectedSpice = label;
        document.querySelectorAll('.modal-spice-btn').forEach(b => {
            b.classList.remove('bg-majidfood-red', 'text-white');
            b.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
        });
        const activeBtn = document.getElementById('spice-btn-' + level);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
            activeBtn.classList.add('bg-majidfood-red', 'text-white');
        }
        const lbl = document.getElementById('modal-selected-spice-label');
        if (lbl) lbl.textContent = label;
    }


    let RESTAURANT_COORDS = { lat: -6.2088, lng: 106.8456, name: 'Dapur Pusat Digiarju', maxRadiusKm: 25.0 };
    let RESTAURANT_BRANCHES = [
        { id: 'pusat', name: 'Dapur Digiarju Pusat (Kota)', lat: -6.2088, lng: 106.8456, address: 'Jl. Sudirman No. 12', phone: '0812-3456-7890', maxRadiusKm: 25.0 },
        { id: 'barat', name: 'Dapur Digiarju Cabang Barat', lat: -6.1683, lng: 106.7588, address: 'Jl. Puri Indah Raya No. 8', phone: '0812-3456-7891', maxRadiusKm: 20.0 },
        { id: 'selatan', name: 'Dapur Digiarju Cabang Selatan', lat: -6.2615, lng: 106.8106, address: 'Jl. Kemang Raya No. 24', phone: '0812-3456-7892', maxRadiusKm: 20.0 },
        { id: 'timur', name: 'Dapur Digiarju Cabang Timur', lat: -6.2250, lng: 106.9004, address: 'Jl. Pemuda No. 15', phone: '0812-3456-7893', maxRadiusKm: 20.0 }
    ];

    function getRestaurantBranches() {
        try {
            const el = document.getElementById('blogger-restaurant-branches-data');
            if (el && el.textContent) {
                const raw = el.textContent.trim();
                if (raw) {
                    if (raw.startsWith('[') && raw.endsWith(']')) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            return parsed.map((b, idx) => ({
                                id: b.id || ('branch_' + idx),
                                name: b.name || b.nama || 'Cabang ' + (idx + 1),
                                lat: parseFloat(b.lat || b.latitude || -6.2088),
                                lng: parseFloat(b.lng || b.longitude || 106.8456),
                                address: b.address || b.alamat || '',
                                phone: b.phone || b.noHp || b.wa || '',
                                maxRadiusKm: parseFloat(b.maxRadiusKm || b.radius || 20.0)
                            }));
                        }
                    }

                    const lines = raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                    const list = [];
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];
                        if (line.toUpperCase().startsWith('CABANG |') || line.toUpperCase().startsWith('BRANCH |')) {
                            line = line.substring(line.indexOf('|') + 1).trim();
                        }
                        const parts = line.split('|').map(p => p.trim());
                        if (parts.length >= 3) {
                            let id, name, lat, lng, address = '', phone = '', maxRadiusKm = 20.0;
                            if (!isNaN(parseFloat(parts[1])) && !isNaN(parseFloat(parts[2]))) {
                                id = 'branch_' + (i + 1);
                                name = parts[0];
                                lat = parseFloat(parts[1]);
                                lng = parseFloat(parts[2]);
                                address = parts[3] || '';
                                phone = parts[4] || '';
                                maxRadiusKm = parts[5] ? parseFloat(parts[5]) : 20.0;
                            } else if (parts.length >= 4 && !isNaN(parseFloat(parts[2])) && !isNaN(parseFloat(parts[3]))) {
                                id = parts[0];
                                name = parts[1];
                                lat = parseFloat(parts[2]);
                                lng = parseFloat(parts[3]);
                                address = parts[4] || '';
                                phone = parts[5] || '';
                                maxRadiusKm = parts[6] ? parseFloat(parts[6]) : 20.0;
                            }

                            if (!isNaN(lat) && !isNaN(lng)) {
                                list.push({
                                    id: id || ('branch_' + (i + 1)),
                                    name: name || ('Cabang ' + (i + 1)),
                                    lat,
                                    lng,
                                    address,
                                    phone,
                                    maxRadiusKm: isNaN(maxRadiusKm) ? 20.0 : maxRadiusKm
                                });
                            }
                        }
                    }
                    if (list.length > 0) return list;
                }
            }
        } catch (e) {
            console.warn('Gagal membaca data cabang dari widget tata letak:', e);
        }

        const stored = localStorage.getItem('digiarju_store_branches') || localStorage.getItem('mangan_store_branches');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {}
        }
        return RESTAURANT_BRANCHES;
    }

    function findNearestRestaurantBranch(customerLat, customerLng) {
        const branches = getRestaurantBranches();
        if (!customerLat || !customerLng) return { branch: branches[0], distanceKm: 1.0 };
        let best = branches[0];
        let minD = 999999;
        branches.forEach(b => {
            const d = calculateHaversineKm(b.lat, b.lng, customerLat, customerLng);
            if (d < minD) {
                minD = d;
                best = b;
            }
        });
        return { branch: best, distanceKm: minD };
    }

    function getProductKitchenInfo(p) {
        if (!p) return null;
        const branches = getRestaurantBranches();
        const defaultBranch = branches[0] || { id: 'pusat', name: 'Dapur Digiarju Pusat (Kota)', lat: -6.2088, lng: 106.8456, address: 'Jl. Sudirman No. 12', phone: '0812-3456-7890', maxRadiusKm: 25.0 };
        
        const rawId = String(p.kitchenId || p.branchId || '').trim();
        const rawName = String(p.kitchenName || p.branchName || '').trim();
        
        if (rawId) {
            const found = branches.find(b => b.id.toLowerCase() === rawId.toLowerCase());
            if (found) return found;
        }
        if (rawName) {
            const found = branches.find(b => b.name.toLowerCase().includes(rawName.toLowerCase()) || rawName.toLowerCase().includes(b.name.toLowerCase()));
            if (found) return found;
            return {
                id: rawId || ('branch_' + rawName.toLowerCase().replace(/[^a-z0-9]/g, '_')),
                name: rawName,
                lat: (p.coords && p.coords.lat) ? p.coords.lat : defaultBranch.lat,
                lng: (p.coords && p.coords.lng) ? p.coords.lng : defaultBranch.lng,
                address: p.kitchenAddress || defaultBranch.address || '',
                phone: defaultBranch.phone || '',
                maxRadiusKm: defaultBranch.maxRadiusKm || 20.0
            };
        }
        return defaultBranch;
    }


    function promptKitchenSwitchModal(currentKitchen, newKitchen, onConfirm) {
        const modalHtml = `
        <div class="clay-card p-6 max-w-md w-full mx-auto text-left relative overflow-hidden">
            <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl mb-4 border border-amber-500/20">
                🍳
            </div>
            <h3 class="text-base font-black text-slate-900 dark:text-white mb-1.5">Ganti Dapur Resto?</h3>
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Keranjang Anda saat ini berisi menu dari <b class="text-amber-600 dark:text-amber-400 font-extrabold">${escapeHtml(currentKitchen.name)}</b>.
                <br><br>
                Satu pesanan hanya dapat diolah &amp; dikirim dari <b>satu dapur pengolah</b> agar patokan biaya ongkir akurat dan makanan diantar tepat waktu.
                <br><br>
                Jika Anda memilih menu dari <b class="text-purple-600 dark:text-purple-400 font-extrabold">${escapeHtml(newKitchen.name)}</b>, isi keranjang sebelumnya akan dikosongkan.
            </p>
            <div class="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onclick="closeModal()" class="flex-1 py-3 px-4 rounded-xl clay-btn text-xs font-bold text-slate-600 dark:text-slate-300">
                    Batal
                </button>
                <button type="button" id="btn-confirm-kitchen-switch" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-md shadow-amber-500/25 transition-all">
                    Ganti Dapur Baru
                </button>
            </div>
        </div>
        `;
        openModal(modalHtml);
        setTimeout(() => {
            const btn = document.getElementById('btn-confirm-kitchen-switch');
            if (btn) {
                btn.onclick = () => {
                    closeModal();
                    if (typeof onConfirm === 'function') onConfirm();
                };
            }
        }, 50);
    }

    let KM_PRICING_CONFIG = { baseFee: 4000, perKmFee: 2500, freeKm: 2.0 };

    function calculateHaversineKm(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 1.0;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.max(0.4, parseFloat((R * c).toFixed(1)));
    }

    function calculateFastFoodShippingFee(distKm) {
        const freeKm = (KM_PRICING_CONFIG && KM_PRICING_CONFIG.freeKm !== undefined) ? KM_PRICING_CONFIG.freeKm : 2.0;
        const baseFee = (KM_PRICING_CONFIG && KM_PRICING_CONFIG.baseFee !== undefined) ? KM_PRICING_CONFIG.baseFee : 4000;
        const perKm = (KM_PRICING_CONFIG && KM_PRICING_CONFIG.perKmFee !== undefined) ? KM_PRICING_CONFIG.perKmFee : 2500;
        if (distKm <= freeKm) return 0;
        return baseFee + Math.round((distKm - freeKm) * perKm);
    }

    function getFastFoodModalConfig() {
        const el = document.getElementById('blogger-fastfood-modal-data');
        const defaultCfg = {
            portions: [
                { name: 'Reguler', price: 0 },
                { name: 'Jumbo Porsi', price: 6000 }
            ],
            spices: [
                'Level 0 (Tidak Pedas)',
                'Level 1 (Sedang)',
                'Level 2 (Pedas)',
                'Level 3 (Ekstra Pedas)'
            ],
            toppings: [
                { name: 'Ekstra Keju', price: 4000 },
                { name: 'Tambah Telur', price: 5000 },
                { name: 'Tambah Nasi', price: 4000 },
                { name: 'Ekstra Sambal', price: 3000 }
            ],
            drinks: [
                { name: 'Tanpa Minuman', price: 0 },
                { name: 'Es Teh Manis Jumbo', price: 4000 },
                { name: 'Lemon Tea Segar Dingin', price: 6000 },
                { name: 'Air Mineral Dingin', price: 3000 }
            ],
            operating: {
                openHour: 9.0,
                closeHour: 22.0,
                openStr: '09:00',
                closeStr: '22:00',
                openText: 'Resto Buka • Siap Antar',
                closeText: 'Resto Tutup • Buka Pk 09:00'
            }
        };

        if (!el || !el.textContent.trim()) return defaultCfg;

        const raw = el.textContent.trim();
        const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
        let section = '';
        const cfg = {
            portions: [],
            spices: [],
            toppings: [],
            drinks: [],
            operating: { ...defaultCfg.operating }
        };

        lines.forEach(line => {
            if (line.startsWith('[') && line.endsWith(']')) {
                section = line.slice(1, -1).toUpperCase();
                return;
            }
            const parts = line.split('|').map(s => s.trim());
            if (section === 'PORSI' && parts[0]) {
                cfg.portions.push({
                    name: parts[0],
                    price: parseInt(parts[1] || '0', 10) || 0
                });
            } else if (section === 'LEVEL_PEDAS' && parts[0]) {
                cfg.spices.push(parts[0]);
            } else if (section === 'TOPPING' && parts[0]) {
                cfg.toppings.push({
                    name: parts[0],
                    price: parseInt(parts[1] || '0', 10) || 0
                });
            } else if (section === 'MINUMAN' && parts[0]) {
                cfg.drinks.push({
                    name: parts[0],
                    price: parseInt(parts[1] || '0', 10) || 0
                });
            } else if (section === 'JAM_OPERASIONAL' && parts.length >= 2) {
                const parseTime = (str) => {
                    const [h, m] = str.split(':').map(Number);
                    return (h || 0) + ((m || 0) / 60);
                };
                cfg.operating = {
                    openHour: parseTime(parts[0]),
                    closeHour: parseTime(parts[1]),
                    openStr: parts[0],
                    closeStr: parts[1],
                    openText: parts[2] || 'Resto Buka • Siap Antar',
                    closeText: parts[3] || ('Resto Tutup • Buka Pk ' + parts[0])
                };
            }
        });

        if (cfg.portions.length === 0) cfg.portions = defaultCfg.portions;
        if (cfg.spices.length === 0) cfg.spices = defaultCfg.spices;
        if (cfg.toppings.length === 0) cfg.toppings = defaultCfg.toppings;
        if (cfg.drinks.length === 0) cfg.drinks = defaultCfg.drinks;

        return cfg;
    }

    function getRestaurantOperatingStatus() {
        try {
            const rawSched = localStorage.getItem('digiarju_store_schedule') || localStorage.getItem('mangan_store_schedule') || localStorage.getItem('dg_store_schedule_settings');
            if (rawSched) {
                const s = JSON.parse(rawSched);
                if (s.statusMode === 'open') {
                    return {
                        isOpen: true,
                        openHourStr: s.openTime || '09:00',
                        closeHourStr: s.closeTime || '22:00',
                        text: 'Resto Buka • Siap Antar',
                        tooltip: `Buka: ${s.openTime || '09:00'} - ${s.closeTime || '22:00'} WIB (Bisa Pesan Sekarang)`
                    };
                }
                if (s.statusMode === 'closed') {
                    return {
                        isOpen: false,
                        openHourStr: s.openTime || '09:00',
                        closeHourStr: s.closeTime || '22:00',
                        text: 'Dapur Istirahat • Tutup Sementara',
                        tooltip: s.closedMsg || 'Dapur kami sedang istirahat. Silakan pesan terjadwal untuk esok hari.'
                    };
                }
                if (s.statusMode === 'auto' && s.openTime && s.closeTime) {
                    const [oH, oM] = s.openTime.split(':').map(Number);
                    const [cH, cM] = s.closeTime.split(':').map(Number);
                    const openDec = (oH || 0) + ((oM || 0) / 60);
                    const closeDec = (cH || 0) + ((cM || 0) / 60);
                    const now = new Date();
                    const currentDec = now.getHours() + (now.getMinutes() / 60);
                    const isOpen = (currentDec >= openDec && currentDec < closeDec);
                    return {
                        isOpen,
                        openHourStr: s.openTime,
                        closeHourStr: s.closeTime,
                        text: isOpen ? 'Resto Buka • Siap Antar' : ('Resto Tutup • Buka Pk ' + s.openTime),
                        tooltip: isOpen ? `Buka: ${s.openTime} - ${s.closeTime} WIB (Bisa Pesan Sekarang)` : (s.closedMsg || `Jam Operasional: ${s.openTime} - ${s.closeTime} WIB`)
                    };
                }
            }
        } catch(e) {}

        const cfg = getFastFoodModalConfig();
        const op = cfg.operating;
        const now = new Date();
        const hours = now.getHours() + (now.getMinutes() / 60);
        const isOpen = (hours >= op.openHour && hours < op.closeHour);
        return {
            isOpen,
            openHourStr: op.openStr,
            closeHourStr: op.closeStr,
            text: isOpen ? op.openText : op.closeText,
            tooltip: isOpen ? `Buka: ${op.openStr} - ${op.closeStr} WIB (Bisa Pesan Sekarang)` : `Jam Operasional: ${op.openStr} - ${op.closeStr} WIB`
        };
    }

    function updateStoreOperatingHeader() {
        const st = getRestaurantOperatingStatus();
        const badge = document.getElementById('store-operating-badge');
        const dot = document.getElementById('store-operating-dot');
        const text = document.getElementById('store-operating-text');
        if (!badge || !text) return;
        if (st.isOpen) {
            badge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border transition-all bg-gojek-green/10 text-gojek-green border-gojek-green/20';
            if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-gojek-green animate-pulse';
            text.textContent = st.text;
        } else {
            badge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border transition-all bg-rose-500/10 text-rose-500 border-rose-500/20';
            if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-rose-500';
            text.textContent = st.text;
        }
        badge.title = st.tooltip;
    }


    function getYukFoodLoyaltyPoints() {
        const stored = localStorage.getItem('yukfood_loyalty_points');
        if (stored === null) {
            localStorage.setItem('yukfood_loyalty_points', '50');
            return 50;
        }
        return parseInt(stored, 10) || 0;
    }

    function saveYukFoodLoyaltyPoints(pts) {
        localStorage.setItem('yukfood_loyalty_points', String(Math.max(0, pts)));
    }

    window.__cartLoyaltyPointsUsed = 0;
    window.__cartLoyaltyDiscount = 0;
    window.__checkoutLoyaltyPointsUsed = 0;
    window.__checkoutLoyaltyDiscount = 0;

    function toggleCartLoyaltyRedemption(subtotal) {
        const cb = document.getElementById('cart-use-loyalty-pts');
        const points = getYukFoodLoyaltyPoints();
        if (cb && cb.checked) {
            if (points < 10) {
                cb.checked = false;
                showToast('Poin tidak mencukupi (Minimal 10 poin)', '#ef4444');
                return;
            }
            const maxDisc = Math.floor(subtotal * 0.5);
            const usablePts = Math.min(points, Math.max(10, Math.floor(maxDisc / 500)));
            window.__cartLoyaltyPointsUsed = usablePts;
            window.__cartLoyaltyDiscount = usablePts * 500;
            window.__checkoutLoyaltyPointsUsed = usablePts;
            window.__checkoutLoyaltyDiscount = usablePts * 500;
            showToast(`Poin loyalitas digunakan: ${usablePts} Poin (-${formatRupiah(usablePts * 500)})`, '#10b981');
        } else {
            window.__cartLoyaltyPointsUsed = 0;
            window.__cartLoyaltyDiscount = 0;
            window.__checkoutLoyaltyPointsUsed = 0;
            window.__checkoutLoyaltyDiscount = 0;
        }
        renderCart();
    }

    function getProductDynamicRating(prodId, metaRating) {
        let localReviews = [];
        if (prodId) {
            try {
                const stored = localStorage.getItem('dg_reviews_' + prodId);
                if (stored) localReviews = JSON.parse(stored);
            } catch (e) {}
        }
        if (Array.isArray(localReviews) && localReviews.length > 0) {
            const sum = localReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
            const avg = (sum / localReviews.length).toFixed(1);
            return {
                rating: avg,
                display: avg,
                count: localReviews.length,
                hasRating: true,
                isNew: false
            };
        }
        if (metaRating && Number(metaRating) > 0) {
            const rVal = Number(metaRating).toFixed(1);
            return {
                rating: rVal,
                display: rVal,
                count: 1,
                hasRating: true,
                isNew: false
            };
        }
        return {
            rating: null,
            display: 'Baru',
            count: 0,
            hasRating: false,
            isNew: true
        };
    }

    function getProductDynamicSold(prodId, metaSold, ordersList) {
        let baseSold = (metaSold !== undefined && metaSold !== null && !isNaN(metaSold)) ? parseInt(metaSold, 10) : 0;
        if (Array.isArray(ordersList) && prodId) {
            ordersList.forEach(order => {
                if (order && Array.isArray(order.items)) {
                    order.items.forEach(it => {
                        const itId = it.productId || it.id;
                        if (itId === prodId) {
                            baseSold += (it.qty || 1);
                        }
                    });
                }
            });
        }
        return baseSold;
    }

    let currentModalProduct = null;
    let currentSelectedPortion = 'Reguler';
    let currentSelectedPortionPrice = 0;

    function selectModalPortion(portionName, extraPrice, btnIdx) {
        currentSelectedPortion = portionName;
        currentSelectedPortionPrice = extraPrice;
        const lbl = document.getElementById('modal-selected-portion-label');
        if (lbl) lbl.textContent = portionName;

        const allPortionBtns = document.querySelectorAll('.modal-portion-btn');
        allPortionBtns.forEach((btn, idx) => {
            if (idx === btnIdx) {
                btn.className = "modal-portion-btn py-2 px-3 rounded-xl text-xs font-bold bg-majidfood-red text-white flex justify-between items-center transition-all shadow-sm";
            } else {
                btn.className = "modal-portion-btn py-2 px-3 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex justify-between items-center transition-all";
            }
        });
        updateFastFoodModalPrice();
    }

    function updateFastFoodModalPrice() {
        if (!currentModalProduct) return;
        const basePrice = Number(currentModalProduct.price) || 0;
        const portionExtra = currentSelectedPortionPrice || 0;

        let toppingsExtra = 0;
        const checkedToppings = document.querySelectorAll('.modal-topping-cb:checked');
        checkedToppings.forEach(cb => {
            toppingsExtra += Number(cb.getAttribute('data-price')) || 0;
        });

        const drinkSelect = document.getElementById('modal-food-drink');
        let drinkExtra = 0;
        if (drinkSelect && drinkSelect.selectedIndex >= 0) {
            const opt = drinkSelect.options[drinkSelect.selectedIndex];
            drinkExtra = Number(opt.getAttribute('data-price')) || 0;
        }

        const qtyInput = document.getElementById('modal-food-qty');
        const qty = parseInt(qtyInput?.value || '1', 10);

        const unitTotal = basePrice + portionExtra + toppingsExtra + drinkExtra;
        const grandTotal = unitTotal * qty;

        const totalLabel = document.getElementById('modal-calc-total-price');
        if (totalLabel) totalLabel.textContent = formatRupiah(grandTotal);

        const btnOrder = document.getElementById('modal-btn-order-text');
        if (btnOrder) btnOrder.textContent = `Pesan (${formatRupiah(grandTotal)})`;
    }



// ==========================================================
// MODULE: 02-fastfood.js
// ==========================================================
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



// ==========================================================
// MODULE: 03-gas-service.js
// ==========================================================
    async function syncFastFoodStockFromSheets() {
        const gasUrl = getGoogleAppsScriptUrl();
        if (!gasUrl) return;
        try {
            const sep = gasUrl.includes('?') ? '&' : '?';
            const res = await fetch(`${gasUrl}${sep}action=get_stock`, { method: 'GET' });
            if (res.ok) {
                const json = await res.json();
                if (json && json.success && Array.isArray(json.data)) {
                    const stockMap = {};
                    json.data.forEach(item => {
                        stockMap[item.id] = item;
                    });
                    if (window.__allProducts && Array.isArray(window.__allProducts)) {
                        window.__allProducts.forEach(item => {
                            if (stockMap[item.id]) {
                                item.stock = stockMap[item.id].stock;
                                item.isOutOfStock = stockMap[item.id].isOutOfStock;
                            }
                        });
                    }
                    try {
                        const dbProds = await dbGetAll('products');
                        for (const p of dbProds) {
                            if (stockMap[p.id]) {
                                p.stock = stockMap[p.id].stock;
                                p.isOutOfStock = stockMap[p.id].isOutOfStock;
                                await dbPut('products', p);
                            }
                        }
                    } catch (dbErr) {}
                }
            }
        } catch (e) {
            console.warn('Stock sync from sheets error (offline or invalid url):', e);
        }
    }

    try {
        initSwiperFastFood();
        updateStoreOperatingHeader();
        initFlashSaleCountdown();
        syncFastFoodStockFromSheets();
    } catch (errFastFoodInit) {
        console.error('Immediate fast food init error:', errFastFoodInit);
    }

    const DB_NAME = 'digiarju_store_db';
    const DB_VERSION = 4;

    function getSellerWhatsAppNumber() {
        try {
            const el = document.getElementById('blogger-seller-whatsapp-data');
            if (el && el.textContent) {
                let num = el.textContent.trim().replace(/[^0-9]/g, '');
                if (num) {
                    if (num.startsWith('0')) {
                        num = '62' + num.slice(1);
                    }
                    SELLER_WHATSAPP_NUMBER = num;
                    return num;
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget WhatsApp:', e);
        }
        return SELLER_WHATSAPP_NUMBER ? SELLER_WHATSAPP_NUMBER.replace(/[^0-9]/g, '') : '';
    }

    const DEFAULT_SHIPPING_DESTINATIONS = [
        { id: 'radius_1', name: 'Radius 0 - 3 km (Area Terdekat Resto)', province: 'Area Resto', reg: 5000, express: 10000, cargo: 0, etd: '15-25 Menit' },
        { id: 'radius_2', name: 'Radius 3 - 6 km (Area Sekitar Kota)', province: 'Dalam Kota', reg: 10000, express: 16000, cargo: 0, etd: '25-35 Menit' },
        { id: 'radius_3', name: 'Radius 6 - 10 km (Luar Area Inti)', province: 'Luar Area Inti', reg: 15000, express: 22000, cargo: 0, etd: '35-50 Menit' },
        { id: 'radius_4', name: 'Radius > 10 km (Khusus Kurir Instan)', province: 'Pinggiran Kota', reg: 22000, express: 30000, cargo: 0, etd: '45-60 Menit' }
    ];

    let SHIPPING_DESTINATIONS = DEFAULT_SHIPPING_DESTINATIONS;
    let FREE_SHIPPING_MIN_SPEND = 100000;

    function getShippingDestinations() {
        try {
            const el = document.getElementById('blogger-shipping-widget-data');
            if (el && el.textContent) {
                const rawText = el.textContent.trim();
                if (rawText) {
                    if (rawText.startsWith('[') && rawText.endsWith(']')) {
                        const parsed = JSON.parse(rawText);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            SHIPPING_DESTINATIONS = parsed.map((item, idx) => ({
                                id: item.id || ('dest_' + idx),
                                name: item.name || item.wilayah || 'Wilayah ' + (idx + 1),
                                province: item.province || item.name || '',
                                reg: Number(item.reg || item.reguler || 0),
                                express: Number(item.express || item.kilat || 0),
                                cargo: Number(item.cargo || item.kargo || 0),
                                etd: item.etd || '2-4 Hari'
                            }));
                            return SHIPPING_DESTINATIONS;
                        }
                    }
                    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                    const list = [];
                    for (let i = 0; i < lines.length; i++) {
                        const currentLine = lines[i];
                        if (currentLine.toUpperCase().startsWith('KOORDINAT_RESTO') || currentLine.toUpperCase().startsWith('LOKASI_RESTO') || currentLine.toUpperCase().startsWith('RESTO_LOCATION')) {
                            const parts = currentLine.split('|').map(p => p.trim());
                            if (parts.length >= 3) {
                                const lat = parseFloat(parts[1]);
                                const lng = parseFloat(parts[2]);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    RESTAURANT_COORDS.lat = lat;
                                    RESTAURANT_COORDS.lng = lng;
                                    if (parts.length > 3 && parts[3]) RESTAURANT_COORDS.name = parts[3];
                                    if (parts.length > 4 && parseFloat(parts[4])) RESTAURANT_COORDS.maxRadiusKm = parseFloat(parts[4]);
                                }
                            }
                            continue;
                        }

                        if (currentLine.toUpperCase().startsWith('TARIF_PER_KM') || currentLine.toUpperCase().startsWith('KM_PRICING')) {
                            const parts = currentLine.split('|').map(p => p.trim());
                            if (parts.length >= 3) {
                                const baseFee = parseInt(parts[1].replace(/[^\d]/g, ''), 10);
                                const perKmFee = parseInt(parts[2].replace(/[^\d]/g, ''), 10);
                                const freeKm = parts.length > 3 ? parseFloat(parts[3]) : 2.0;
                                if (!isNaN(baseFee) && !isNaN(perKmFee)) {
                                    KM_PRICING_CONFIG = { baseFee, perKmFee, freeKm };
                                }
                            }
                            continue;
                        }

                        if (currentLine.toUpperCase().startsWith('GRATIS_ONGKIR_MINIMAL') || currentLine.toUpperCase().startsWith('FREE_SHIPPING_MIN')) {
                            const parts = currentLine.split('|').map(p => p.trim());
                            if (parts.length >= 2) {
                                const minSpend = parseInt(parts[1].replace(/[^\d]/g, ''), 10);
                                if (!isNaN(minSpend)) {
                                    FREE_SHIPPING_MIN_SPEND = minSpend;
                                }
                            }
                            continue;
                        }

                        const parts = currentLine.split('|').map(p => p.trim());
                        if (parts.length >= 2) {
                            const name = parts[0];
                            const reg = parseInt(parts[1].replace(/[^\d]/g, ''), 10) || 0;
                            const express = parts.length > 2 ? (parseInt(parts[2].replace(/[^\d]/g, ''), 10) || 0) : Math.round(reg * 1.5);
                            const cargo = parts.length > 3 ? (parseInt(parts[3].replace(/[^\d]/g, ''), 10) || 0) : Math.round(reg * 0.8);
                            const etd = parts.length > 4 ? parts[4] : '2-4 Hari';
                            const id = 'dest_' + i + '_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                            list.push({ id, name, province: name, reg, express, cargo, etd });
                        }
                    }
                    if (list.length > 0) {
                        SHIPPING_DESTINATIONS = list;
                        return SHIPPING_DESTINATIONS;
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget tarif ongkir:', e);
        }
        SHIPPING_DESTINATIONS = DEFAULT_SHIPPING_DESTINATIONS;
        return SHIPPING_DESTINATIONS;
    }

    const DEFAULT_PAYMENT_METHODS = [
        { name: 'QRIS (Semua E-Wallet & Bank)', desc: 'Scan barcode QRIS instan otomatis' },
        { name: 'E-Wallet (Dana / GoPay / OVO / ShopeePay)', desc: '0812-3456-7890 (a.n Admin Resto)' },
        { name: 'COD (Bayar di Tempat)', desc: 'Pembayaran tunai saat makanan diterima dari kurir' }
    ];

    let PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS;

    function getPaymentMethods() {
        try {
            const el = document.getElementById('blogger-payment-methods-data');
            if (el && el.textContent) {
                const rawText = el.textContent.trim();
                if (rawText) {
                    if (rawText.startsWith('[') && rawText.endsWith(']')) {
                        const parsed = JSON.parse(rawText);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            PAYMENT_METHODS = parsed.map((item, idx) => ({
                                name: typeof item === 'string' ? item : (item.name || item.metode || 'Metode ' + (idx + 1)),
                                desc: typeof item === 'string' ? '' : (item.desc || item.keterangan || '')
                            }));
                            return PAYMENT_METHODS;
                        }
                    }
                    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                    const list = [];
                    for (let i = 0; i < lines.length; i++) {
                        const parts = lines[i].split('|').map(p => p.trim());
                        if (parts.length >= 1 && parts[0]) {
                            list.push({
                                name: parts[0],
                                desc: parts.length > 1 ? parts[1] : ''
                            });
                        }
                    }
                    if (list.length > 0) {
                        PAYMENT_METHODS = list;
                        return PAYMENT_METHODS;
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget metode pembayaran:', e);
        }
        PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS;
        return PAYMENT_METHODS;
    }

    const DEFAULT_ADDRESS_OPTIONS = [
        'Lainnya (Tulis Manual)'
    ];

    let ADDRESS_OPTIONS = DEFAULT_ADDRESS_OPTIONS;

    function getAddressOptions() {
        try {
            const el = document.getElementById('blogger-address-options-data');
            if (el && el.textContent) {
                const rawText = el.textContent.trim();
                if (rawText) {
                    if (rawText.startsWith('[') && rawText.endsWith(']')) {
                        const parsed = JSON.parse(rawText);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            ADDRESS_OPTIONS = parsed.map(item => typeof item === 'string' ? item : (item.name || item.area || '')).filter(Boolean);
                            return ADDRESS_OPTIONS;
                        }
                    }
                    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                    if (lines.length > 0) {
                        ADDRESS_OPTIONS = lines;
                        return ADDRESS_OPTIONS;
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget opsi alamat:', e);
        }
        ADDRESS_OPTIONS = DEFAULT_ADDRESS_OPTIONS;
        return ADDRESS_OPTIONS;
    }

    function getGoogleAppsScriptUrl() {
        if (GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.startsWith('https://script.google.com/')) {
            return GOOGLE_APPS_SCRIPT_URL;
        }

        try {
            const el = document.getElementById('blogger-gas-url-data');
            if (el && el.textContent) {
                const rawContent = el.textContent;
                const lines = rawContent.split(/\r?\n/)
                    .map(l => l.trim())
                    .filter(l => l && !l.startsWith('#') && !l.startsWith('//'));

                if (lines.length > 0) {
                    const firstLine = lines[0];

                    if (/^(?:hapus|reset|clear|kosong)(?:_storage|_local)?$/i.test(firstLine)) {
                        ['majid_gas_url', 'food_gas_url', 'dg_gas_url', 'mangan_gas_url', 'mangan_cs_gas_url'].forEach(k => {
                            try { localStorage.removeItem(k); } catch (e) {}
                        });
                        GOOGLE_APPS_SCRIPT_URL = '';
                        console.info('[GAS Config] majid_gas_url pada localStorage berhasil dibersihkan via widget Tata Letak Blogger.');
                        return '';
                    }

                    let targetUrl = firstLine.replace(/^['"]|['"]$/g, '').trim();
                    if (/^[A-Za-z0-9_-]{20,}$/.test(targetUrl) && !targetUrl.startsWith('http')) {
                        targetUrl = 'https://script.google.com/macros/s/' + targetUrl + '/exec';
                    }

                    if (targetUrl.startsWith('https://script.google.com/')) {
                        GOOGLE_APPS_SCRIPT_URL = targetUrl;
                        try {
                            localStorage.setItem('majid_gas_url', targetUrl);
                            localStorage.setItem('food_gas_url', targetUrl);
                            localStorage.setItem('dg_gas_url', targetUrl);
                            localStorage.setItem('mangan_gas_url', targetUrl);
                        } catch (e) {}
                        return GOOGLE_APPS_SCRIPT_URL;
                    }
                }
            }

            const localGas = localStorage.getItem('arjugo_kurir_gas_url') || localStorage.getItem('majid_gas_url') || localStorage.getItem('food_gas_url') || localStorage.getItem('dg_gas_url') || localStorage.getItem('mangan_gas_url') || ((window.ARJUGO_CONFIG && window.ARJUGO_CONFIG.GAS_URL) ? window.ARJUGO_CONFIG.GAS_URL.trim() : '');
            if (localGas && localGas.startsWith('https://script.google.com/')) {
                GOOGLE_APPS_SCRIPT_URL = localGas;
                return GOOGLE_APPS_SCRIPT_URL;
            }
        } catch (e) {
            console.warn('[GAS Config] Error saat memproses URL backend Google Apps Script:', e);
        }

        return GOOGLE_APPS_SCRIPT_URL || '';
    }

    function syncOrderToGoogleSheets(order) {
        // Dinonaktifkan: Pesanan saat checkout sengaja tidak disimpan ke database Google Spreadsheet.
        return;
    }

    const DEFAULT_COUPONS = [];

    let PROMO_COUPONS = DEFAULT_COUPONS;
    let APPLIED_COUPON = null; 

    function getPromoCoupons() {
        try {
            const el = document.getElementById('blogger-coupons-widget-data');
            if (el && el.textContent) {
                const rawText = el.textContent.trim();
                if (rawText) {
                    if (rawText.startsWith('[') && rawText.endsWith(']')) {
                        const parsed = JSON.parse(rawText);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            PROMO_COUPONS = parsed.map(item => ({
                                code: (item.code || '').toUpperCase(),
                                type: (item.type || 'FIXED').toUpperCase(),
                                value: Number(item.value || 0),
                                minSpend: Number(item.minSpend || 0),
                                desc: item.desc || ''
                            }));
                            return PROMO_COUPONS;
                        }
                    }
                    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                    const list = [];
                    for (let i = 0; i < lines.length; i++) {
                        const parts = lines[i].split('|').map(p => p.trim());
                        if (parts.length >= 3) {
                            const code = parts[0].toUpperCase();
                            const type = parts[1].toUpperCase();
                            const value = parseFloat(parts[2].replace(/[^\d.]/g, '')) || 0;
                            const minSpend = parts.length > 3 ? (parseInt(parts[3].replace(/[^\d]/g, ''), 10) || 0) : 0;
                            const desc = parts.length > 4 ? parts[4] : '';
                            list.push({ code, type, value, minSpend, desc });
                        }
                    }
                    if (list.length > 0) {
                        PROMO_COUPONS = list;
                        return PROMO_COUPONS;
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget kupon:', e);
        }
        PROMO_COUPONS = DEFAULT_COUPONS;
        return PROMO_COUPONS;
    }

    function syncCouponsFromGAS() {
        const gasUrl = getGoogleAppsScriptUrl();
        if (!gasUrl) return;
        try {
            const sep = gasUrl.includes('?') ? '&' : '?';
            fetch(`${gasUrl}${sep}action=get_coupons`)
                .then(r => r.json())
                .then(res => {
                    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                        const nowStr = new Date().toISOString().slice(0, 10);
                        const activeList = res.data.filter(c => {
                            const isExpired = c.endDate && c.endDate < nowStr;
                            return !isExpired && c.status !== 'Nonaktif';
                        }).map(c => ({
                            code: (c.code || '').toUpperCase(),
                            type: (c.type || 'FIXED').toUpperCase(),
                            value: Number(c.value || 0),
                            minSpend: Number(c.minSpend || 0),
                            desc: c.desc || (c.type === 'PERCENT' ? `Diskon ${c.value}%` : (c.type === 'SHIPPING' ? 'Bebas Ongkir' : `Potongan ${formatRupiah(c.value)}`))
                        }));
                        if (activeList.length > 0) {
                            PROMO_COUPONS = activeList;
                        }
                    }
                })
                .catch(() => {});
        } catch (e) {}
    }

    function calculateCouponDiscount(coupon, subtotal, shippingCost) {
        if (!coupon) return 0;
        if (subtotal < (coupon.minSpend || 0)) return 0;
        if (coupon.type === 'PERCENT') {
            return Math.round((subtotal * coupon.value) / 100);
        } else if (coupon.type === 'FIXED') {
            return Math.min(coupon.value, subtotal);
        } else if (coupon.type === 'SHIPPING') {
            return Math.min(shippingCost || 0, Math.round(((shippingCost || 0) * coupon.value) / 100));
        }
        return 0;
    }

    function applyCouponCode(inputCode, subtotal, shippingCost) {
        const coupons = getPromoCoupons();
        const code = (inputCode || '').trim().toUpperCase();
        if (!code) {
            showToast('Silakan masukkan kode voucher!', '#ef4444');
            return false;
        }
        const found = coupons.find(c => c.code === code);
        if (!found) {
            showToast('Kode voucher "' + code + '" tidak ditemukan!', '#ef4444');
            return false;
        }
        if (subtotal < found.minSpend) {
            showToast('Minimal belanja untuk voucher ' + found.code + ' adalah ' + formatRupiah(found.minSpend), '#ef4444');
            return false;
        }
        const discountAmount = calculateCouponDiscount(found, subtotal, shippingCost);
        APPLIED_COUPON = { ...found, discountAmount };
        showToast('Voucher ' + found.code + ' berhasil digunakan! Diskon ' + formatRupiah(discountAmount), '#10b981');
        return true;
    }

    function removeCouponCode() {
        APPLIED_COUPON = null;
        showToast('Voucher dibatalkan', '#64748b');
    }

    function getStoreStatus() {
        const defaultStatus = { isVacation: false, vacationMsg: '', announcement: '' };
        try {
            const el = document.getElementById('blogger-store-status-widget-data');
            if (el && el.textContent) {
                const lines = el.textContent.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
                for (const line of lines) {
                    const parts = line.split('|').map(p => p.trim());
                    if (parts[0].toUpperCase() === 'STATUS_LIBUR') {
                        const statusVal = parts[1] ? parts[1].toLowerCase() : 'false';
                        defaultStatus.isVacation = (statusVal === 'true' || statusVal === '1' || statusVal === 'libur' || statusVal === 'ya');
                        defaultStatus.vacationMsg = parts[2] || 'Toko sedang libur. Pesanan akan segera diproses saat toko kembali beroperasi.';
                    } else if (parts[0].toUpperCase() === 'PENGUMUMAN') {
                        defaultStatus.announcement = parts[1] || '';
                    }
                }
            }
        } catch (e) {
            console.warn('Gagal membaca widget status toko:', e);
        }
        return defaultStatus;
    }

    function renderStoreStatusBanner() {
        const container = document.getElementById('store-status-banner-container');
        if (!container) return;
        const status = getStoreStatus();
        if (status.isVacation) {
            container.innerHTML = `
                <div class="clay-card p-4 sm:p-5 store-banner-vacation flex items-center gap-3.5 shadow-md">
                    <div class="w-10 h-10 rounded-2xl bg-purple-500/20 dark:bg-purple-500/30 text-purple-600 dark:text-purple-300 flex items-center justify-center flex-shrink-0 text-2xl font-bold">🏖️</div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-extrabold text-orange-950 dark:text-orange-200">Pemberitahuan Toko Sedang Libur</h4>
                        <p class="text-xs text-orange-900/80 dark:text-purple-300/80 mt-0.5 leading-relaxed">${escapeHtml(status.vacationMsg)}</p>
                    </div>
                </div>
            `;
            container.classList.remove('hidden');
        } else if (status.announcement) {
            container.innerHTML = `
                <div class="clay-card p-4 store-banner-info flex items-center gap-3.5 shadow-md">
                    <div class="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center flex-shrink-0 text-xl font-bold">📢</div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-200 leading-snug">${escapeHtml(status.announcement)}</p>
                    </div>
                </div>
            `;
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }

    function isCurrentlyOnHomePage() {
        const staticPageWrap = document.getElementById('blogger-static-page-wrapper');
        const singleProduct = document.getElementById('blogger-single-product');
        const path = window.location.pathname || '';
        const hash = window.location.hash || '';

        if (staticPageWrap || singleProduct || path.includes('/p/') || (path.endsWith('.html') && !path.includes('index.html'))) {
            return false;
        }

        const cleanHash = hash.replace(/^#\/?/, '').split('?')[0].split('/')[0];
        if (cleanHash && cleanHash !== 'home' && cleanHash !== '') {
            return false;
        }

        return true;
    }

    let socialProofTimer = null;
    let currentSocialProofTargetUrl = null;

    function dismissSocialProof(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        const toastEl = document.getElementById('social-proof-toast');
        if (toastEl) {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.classList.add('hidden'), 500);
        }
    }

    function handleSocialProofClick(event) {
        if (event && event.target && event.target.closest('button')) return;
        if (currentSocialProofTargetUrl) {
            window.location.href = currentSocialProofTargetUrl;
        }
    }



// ==========================================================
// MODULE: 04-social-proof.js
// ==========================================================
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



// ==========================================================
// MODULE: 05-maps-location.js
// ==========================================================
    async function openDeliveryLocationModal() {
        let profile = null;
        try {
            if (typeof dbGet === 'function') {
                profile = await dbGet('profile', 'me');
            }
        } catch (e) {}

        const activeAddr = (currentActiveMapsPin && currentActiveMapsPin.displayAddress) || (profile && profile.address) || '';
        const lat = currentActiveMapsPin ? currentActiveMapsPin.lat : RESTAURANT_COORDS.lat;
        const lng = currentActiveMapsPin ? currentActiveMapsPin.lng : RESTAURANT_COORDS.lng;
        const distKm = currentActiveMapsPin ? calculateHaversineKm(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, lat, lng) : 0;
        const fee = distKm ? calculateFastFoodShippingFee(distKm) : 0;
        const hasProfileAddress = !!(profile && profile.address && profile.address.trim());

        const html = `
        <div class="space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800">
                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-sm shadow-md shadow-purple-500/20">
                        <i class="fa-solid fa-location-dot"></i>
                    </div>
                    <div>
                        <h3 class="font-heading font-black text-sm sm:text-base text-slate-800 dark:text-white">Lokasi Pengantaran</h3>
                        <p class="text-[11px] text-slate-400">Sinkronisasi alamat dengan profil akun &amp; kurir toko</p>
                    </div>
                </div>
                <button type="button" onclick="closeModal()" class="w-8 h-8 clay-btn flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div class="flex items-center justify-between text-xs">
                    <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Alamat Pengantaran Aktif:
                    </span>
                    ${distKm > 0 ? `<span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900">${distKm} km • Ongkir ${fee === 0 ? 'Gratis' : formatRupiah(fee)}</span>` : ''}
                </div>
                <div class="text-xs sm:text-sm font-bold text-slate-800 dark:text-white line-clamp-2">
                    ${escapeHtml(activeAddr || 'Belum menentukan alamat pengantaran')}
                </div>
                ${(currentActiveMapsPin && currentActiveMapsPin.url) ? `<div class="text-[11px]"><a href="${currentActiveMapsPin.url}" target="_blank" class="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"><i class="fa-solid fa-map-pin"></i> Lihat Titik Google Maps Terpasang</a></div>` : ''}
            </div>

            ${hasProfileAddress ? `
            <div class="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/60 space-y-2">
                <div class="flex items-center justify-between text-xs">
                    <span class="font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <i class="fa-solid fa-id-badge"></i> Alamat di Profil Akun Saya:
                    </span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Tersimpan</span>
                </div>
                <p class="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">${escapeHtml(profile.address)}</p>
                <div class="flex flex-wrap items-center gap-2 pt-1">
                    <button type="button" onclick="applyProfileAddressToDelivery('${escapeHtml(profile.address).replace(/'/g, "\\'")}')" class="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-check"></i> Gunakan Alamat Profil Ini
                    </button>
                    <button type="button" onclick="closeModal(); navigate('/profile');" class="px-3.5 py-1.5 rounded-xl clay-btn text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors flex items-center gap-1.5">
                        <i class="fa-solid fa-pen-to-square"></i> Kelola di Halaman Profil
                    </button>
                </div>
            </div>
            ` : `
            <div class="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
                <div class="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <i class="fa-solid fa-triangle-exclamation"></i> Alamat belum tersimpan di Profil
                </div>
                <p class="text-[11px] text-slate-600 dark:text-slate-300">Lengkapi data diri dan alamat di halaman Profil agar pesanan selalu terhubung langsung dengan lokasi Anda.</p>
                <button type="button" onclick="closeModal(); navigate('/profile');" class="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
                    <i class="fa-solid fa-user-plus"></i> Lengkapi Alamat di Profil
                </button>
            </div>
            `}

            <div class="space-y-2 pt-1">
                <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Opsi Penentuan Lokasi:</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button type="button" onclick="closeModal(); detectGPSLocation('pf-address');" class="p-3 rounded-xl clay-btn text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all text-left">
                        <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center flex-shrink-0">
                            <i class="fa-solid fa-location-crosshairs text-purple-600"></i>
                        </div>
                        <div>
                            <div class="font-bold text-slate-800 dark:text-white">Deteksi GPS Saya</div>
                            <div class="text-[10px] font-normal text-slate-400">Titik otomatis dari perangkat</div>
                        </div>
                    </button>
                    <button type="button" onclick="closeModal(); openMapsPickerModal('pf-address');" class="p-3 rounded-xl clay-btn text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all text-left">
                        <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0">
                            <i class="fa-solid fa-map-location-dot text-emerald-600"></i>
                        </div>
                        <div>
                            <div class="font-bold text-slate-800 dark:text-white">Pilih Titik di Peta</div>
                            <div class="text-[10px] font-normal text-slate-400">Geser pin peta akurat</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
        `;

        openModal(html);
    }

    async function applyProfileAddressToDelivery(addr) {
        let profile = null;
        try {
            if (typeof dbGet === 'function') {
                profile = await dbGet('profile', 'me');
            }
        } catch (e) {}

        const finalAddr = addr || (profile && profile.address) || '';
        if (!finalAddr) {
            showToast('Alamat profil belum diisi. Silakan lengkapi di halaman Profil.', '#f59e0b');
            return;
        }

        const lat = (profile && profile.coords && profile.coords.lat) ? profile.coords.lat : (currentActiveMapsPin ? currentActiveMapsPin.lat : RESTAURANT_COORDS.lat);
        const lng = (profile && profile.coords && profile.coords.lng) ? profile.coords.lng : (currentActiveMapsPin ? currentActiveMapsPin.lng : RESTAURANT_COORDS.lng);
        const mapsUrl = (profile && profile.mapsUrl) || (currentActiveMapsPin ? currentActiveMapsPin.url : `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`);

        applyMapsPin('pf-address', lat, lng, mapsUrl, finalAddr);
        closeModal();
        showToast('Alamat profil berhasil diterapkan sebagai lokasi antar!', '#10b981');
    }

    window.openDeliveryLocationModal = openDeliveryLocationModal;
    window.applyProfileAddressToDelivery = applyProfileAddressToDelivery;

    function openMapsPickerModal(targetTextareaId) {
        const defaultLat = currentActiveMapsPin ? currentActiveMapsPin.lat : -6.2088;
        const defaultLng = currentActiveMapsPin ? currentActiveMapsPin.lng : 106.8456;
        tempPickerLocation = { lat: defaultLat, lng: defaultLng, address: '' };

        const html = `
        <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <svg class="svg-icon w-4 h-4" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div>
                    <h3 class="font-heading font-black text-sm sm:text-base text-slate-800 dark:text-white">Pilih Titik Lokasi via Maps</h3>
                    <p class="text-[10px] sm:text-[11px] text-slate-400 font-bold">Geser pin merah atau klik peta ke titik alamat pengiriman</p>
                </div>
            </div>
            <button onclick="closeModal()" class="w-8 h-8 clay-btn flex items-center justify-center"><svg class="svg-icon w-4 h-4" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>

        <div class="space-y-2.5">
            <div class="flex gap-2">
                <input id="modal-map-search" type="text" onkeydown="if(event.key==='Enter'){event.preventDefault();searchModalMapLocation();}" placeholder="Cari nama jalan, perumahan, atau gedung..." class="flex-grow px-3.5 py-2.5 clay-input text-xs font-bold">
                <button type="button" onclick="searchModalMapLocation()" class="px-3.5 py-2.5 clay-btn text-xs font-bold flex-shrink-0">Cari</button>
                <button type="button" onclick="detectGPSModalMap()" class="px-3 py-2.5 clay-btn text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 flex-shrink-0" title="Deteksi GPS">
                    <svg class="svg-icon w-3.5 h-3.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="12 8 8 12 12 16 12 8"></polygon></svg>
                    <span class="hidden sm:inline">GPS</span>
                </button>
            </div>

            <div id="modal-leaflet-map" style="height: 270px; width: 100%; border-radius: 1rem; position: relative; z-index: 5;" class="overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100"></div>

            <div class="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-0.5">
                    <span>📍 Koordinat:</span>
                    <span id="modal-map-coords" class="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">${defaultLat.toFixed(5)}, ${defaultLng.toFixed(5)}</span>
                </div>
                <p id="modal-map-address-preview" class="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">Mengambil info alamat lokasi...</p>
            </div>

            <div class="flex justify-end gap-2 pt-1">
                <button type="button" onclick="closeModal()" class="px-4 py-2.5 clay-btn text-xs font-bold">Batal</button>
                <button type="button" onclick="confirmMapModalSelection('${targetTextareaId}')" class="px-5 py-2.5 clay-btn-primary text-xs font-black">Pasang Titik Ini</button>
            </div>
        </div>
        `;

        openModal(html);

        setTimeout(() => {
            initLeafletMap(defaultLat, defaultLng);
        }, 150);
    }

    function initLeafletMap(initLat, initLng) {
        if (typeof L === 'undefined') {
            const container = document.getElementById('modal-leaflet-map');
            if (container) {
                container.innerHTML = `<div class="flex items-center justify-center h-full text-slate-400 text-xs font-bold p-4 text-center">Modul peta sedang dimuat atau koneksi offline. Anda tetap dapat menggunakan tombol GPS.</div>`;
            }
            return;
        }
        try {
            if (mapPickerInstance) {
                try { mapPickerInstance.remove(); } catch (err) {}
                mapPickerInstance = null;
            }
            mapPickerInstance = L.map('modal-leaflet-map', {
                zoomControl: true
            }).setView([initLat, initLng], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19
            }).addTo(mapPickerInstance);

            mapPickerMarker = L.marker([initLat, initLng], {
                draggable: true
            }).addTo(mapPickerInstance);

            mapPickerMarker.on('dragend', function() {
                const pos = mapPickerMarker.getLatLng();
                onModalLocationChanged(pos.lat, pos.lng);
            });

            mapPickerInstance.on('click', function(e) {
                mapPickerMarker.setLatLng(e.latlng);
                onModalLocationChanged(e.latlng.lat, e.latlng.lng);
            });

            setTimeout(() => {
                if (mapPickerInstance) mapPickerInstance.invalidateSize();
            }, 300);

            onModalLocationChanged(initLat, initLng);
        } catch (e) {
            console.error('Leaflet init error:', e);
        }
    }

    async function onModalLocationChanged(lat, lng) {
        tempPickerLocation = { lat, lng, address: '' };
        const coordsEl = document.getElementById('modal-map-coords');
        const addrEl = document.getElementById('modal-map-address-preview');
        if (coordsEl) coordsEl.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (addrEl) addrEl.textContent = 'Mencari alamat...';

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            if (res.ok) {
                const data = await res.json();
                tempPickerLocation.address = data.display_name || '';
                if (addrEl) addrEl.textContent = tempPickerLocation.address || 'Titik koordinat berhasil dipilih';
            }
        } catch (e) {
            if (addrEl) addrEl.textContent = 'Koordinat: ' + lat.toFixed(5) + ', ' + lng.toFixed(5);
        }
    }

    async function searchModalMapLocation() {
        const query = (document.getElementById('modal-map-search')?.value || '').trim();
        if (!query) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=1`);
            if (res.ok) {
                const list = await res.json();
                if (list && list.length > 0) {
                    const item = list[0];
                    const lat = parseFloat(item.lat);
                    const lng = parseFloat(item.lon);
                    if (mapPickerInstance && mapPickerMarker) {
                        mapPickerInstance.setView([lat, lng], 16);
                        mapPickerMarker.setLatLng([lat, lng]);
                        onModalLocationChanged(lat, lng);
                    }
                } else {
                    showToast('Lokasi tidak ditemukan', '#ef4444');
                }
            }
        } catch (e) {
            console.warn('Search location error:', e);
        }
    }

    function detectGPSModalMap() {
        if (!navigator.geolocation) {
            showToast('GPS tidak didukung oleh browser', '#ef4444');
            return;
        }
        showToast('Mendeteksi GPS...', '#8814f5');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                if (mapPickerInstance && mapPickerMarker) {
                    mapPickerInstance.setView([lat, lng], 16);
                    mapPickerMarker.setLatLng([lat, lng]);
                    onModalLocationChanged(lat, lng);
                }
                showToast('GPS berhasil terdeteksi!', '#10b981');
            },
            (err) => {
                console.warn('GPS error:', err);
                showToast('Gagal mendeteksi GPS perangkat', '#ef4444');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    function confirmMapModalSelection(targetTextareaId) {
        if (!tempPickerLocation) {
            closeModal();
            return;
        }
        const lat = tempPickerLocation.lat;
        const lng = tempPickerLocation.lng;
        const mapsUrl = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
        applyMapsPin(targetTextareaId, lat, lng, mapsUrl, tempPickerLocation.address);
        closeModal();
        showToast('Titik lokasi berhasil dipasang!', '#10b981');
    }

    const SHIPPING_COURIERS = [
        { id: 'arjugo', name: 'ArjuGo Express (Radar Live GPS)', code: 'ARJUGO', badge: 'Radar Satelit Live' },
        { id: 'resto', name: 'Kurir Resto / Toko', code: 'RESTO' },
        { id: 'ojol', name: 'GoSend / GrabExpress (Instan)', code: 'OJOL' }
    ];

    const SHIPPING_SERVICES = [
        { id: 'reg', name: 'Pengantaran Standar (25-40 Menit)' },
        { id: 'express', name: 'Prioritas Hangat (15-25 Menit)' }
    ];



    const THEME_ICON_LIGHT = `<svg class="svg-icon w-6 h-6" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const THEME_ICON_DARK = `<svg class="svg-icon w-6 h-6" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;


    let dbInstance = null;



// ==========================================================
// MODULE: 06-indexeddb.js
// ==========================================================
    function openDB() {
        return new Promise((resolve, reject) => {
            try {
                if (typeof window === 'undefined' || !window.indexedDB) {
                    return reject(new Error('IndexedDB tidak didukung'));
                }
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onblocked = () => {
                    console.warn('[IndexedDB] Database upgrade terblokir oleh koneksi tab lain');
                    reject(new Error('IndexedDB terblokir'));
                };
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });

                    if (db.objectStoreNames.contains('cart')) {
                        const cartStore = req.transaction.objectStore('cart');
                        if (cartStore.keyPath !== 'cartItemId') {
                            db.deleteObjectStore('cart');
                            db.createObjectStore('cart', { keyPath: 'cartItemId' });
                        }
                    } else {
                        db.createObjectStore('cart', { keyPath: 'cartItemId' });
                    }

                    if (!db.objectStoreNames.contains('orders')) db.createObjectStore('orders', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
                    if (!db.objectStoreNames.contains('coupons')) db.createObjectStore('coupons', { keyPath: 'code' });
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('Gagal membuka IndexedDB'));
            } catch (err) {
                reject(err);
            }
        });
    }

    async function ensureDB() {
        if (!dbInstance) {
            try {
                const openPromise = openDB();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('IndexedDB timeout')), 2000));
                dbInstance = await Promise.race([openPromise, timeoutPromise]);
            } catch (e) {
                console.warn('Gagal membuka Penyimpanan:', e);
            }
        }
        return dbInstance;
    }

    function tx(storeName, mode) {
        if (!dbInstance) {
            throw new Error('Database belum siap');
        }
        return dbInstance.transaction(storeName, mode).objectStore(storeName);
    }
    async function dbGetAll(storeName) {
        try {
            await ensureDB();
            if (!dbInstance) return [];
            return await new Promise((resolve) => {
                try {
                    const req = tx(storeName, 'readonly').getAll();
                    req.onsuccess = () => resolve(req.result || []);
                    req.onerror = () => resolve([]);
                } catch (e) {
                    resolve([]);
                }
            });
        } catch (err) {
            return [];
        }
    }
    async function dbGet(storeName, key) {
        await ensureDB();
        if (!dbInstance) return null;
        return new Promise((resolve) => {
            try {
                const req = tx(storeName, 'readonly').get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    }
    async function dbPut(storeName, value) {
        await ensureDB();
        if (!dbInstance) return null;
        return new Promise((resolve) => {
            try {
                const req = tx(storeName, 'readwrite').put(value);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    }
    async function dbBulkPut(storeName, values) {
        await ensureDB();
        if (!dbInstance || !Array.isArray(values) || values.length === 0) return;
        return new Promise((resolve) => {
            try {
                const store = tx(storeName, 'readwrite');
                values.forEach(v => store.put(v));
                store.transaction.oncomplete = () => resolve();
                store.transaction.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    }
    async function dbDelete(storeName, key) {
        await ensureDB();
        if (!dbInstance) return;
        return new Promise((resolve) => {
            try {
                const req = tx(storeName, 'readwrite').delete(key);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    }
    async function dbClear(storeName) {
        await ensureDB();
        if (!dbInstance) return;
        return new Promise((resolve) => {
            try {
                const req = tx(storeName, 'readwrite').clear();
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    }

    async function seedIfEmpty() {
        const flashSetting = await dbGet('settings', 'flashSaleEndsAt');
        if (!flashSetting) {
            const endsAt = Date.now() + 3 * 24 * 60 * 60 * 1000;
            await dbPut('settings', { key: 'flashSaleEndsAt', value: endsAt });
        }
    }

    function formatBytes(bytes, decimals = 1) {
        if (!bytes || bytes <= 0) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    async function getIndexedDBStorageInfo() {
        let usageBytes = 0;
        let quotaBytes = 0;
        let percentUsed = '0.0';

        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                usageBytes = estimate.usage || 0;
                quotaBytes = estimate.quota || 0;
                if (quotaBytes > 0) {
                    percentUsed = ((usageBytes / quotaBytes) * 100).toFixed(1);
                }
            } catch (e) {
                console.warn('Storage estimate error:', e);
            }
        }

        const [products, orders, cart, categories, coupons] = await Promise.all([
            dbGetAll('products'),
            dbGetAll('orders'),
            dbGetAll('cart'),
            dbGetAll('categories'),
            dbGetAll('coupons')
        ]);

        let calculatedDataBytes = 0;
        try {
            const dump = JSON.stringify({ products, orders, cart, categories, coupons });
            calculatedDataBytes = new Blob([dump]).size;
        } catch (e) {}

        const displayUsageBytes = (usageBytes > 0) ? usageBytes : calculatedDataBytes;

        return {
            usageBytes: displayUsageBytes,
            quotaBytes: quotaBytes,
            percentUsed: (parseFloat(percentUsed) > 0) ? percentUsed : ((displayUsageBytes / (50 * 1024 * 1024)) * 100).toFixed(1),
            counts: {
                products: products.length,
                orders: orders.length,
                cart: cart.length,
                categories: categories.length,
                coupons: coupons.length
            },
            calculatedDataBytes: calculatedDataBytes
        };
    }

    async function handleClearProductsCache() {
        if (!window.confirm('Bersihkan cache produk & kategori dari Penyimpanan? Data menu akan dimuat ulang dari server saat halaman dibuka kembali.')) return;
        try {
            await dbClear('products');
            await dbClear('categories');
            window.__allProducts = [];
            showToast('Cache produk & kategori berhasil dikosongkan.', '#10b981');
            if (currentRoute()[0] === 'profile') {
                await renderProfile();
            }
        } catch (e) {
            showToast('Gagal membersihkan cache: ' + e.message, '#ef4444');
        }
    }

    async function handleClearCartOnly() {
        if (!window.confirm('Kosongkan semua menu di keranjang belanja?')) return;
        try {
            await dbClear('cart');
            await updateCartBadge();
            if (typeof updateFloatingCartBar === 'function') updateFloatingCartBar();
            showToast('Keranjang belanja berhasil dikosongkan.', '#10b981');
            if (currentRoute()[0] === 'profile') {
                await renderProfile();
            }
        } catch (e) {
            showToast('Gagal mengosongkan keranjang: ' + e.message, '#ef4444');
        }
    }

    async function handleClearOrdersLocal() {
        if (!window.confirm('Hapus seluruh riwayat pesanan lokal dari Penyimpanan Lokal? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
            await dbClear('orders');
            showToast('Riwayat pesanan lokal berhasil dihapus.', '#10b981');
            if (currentRoute()[0] === 'profile') {
                await renderProfile();
            }
        } catch (e) {
            showToast('Gagal menghapus pesanan: ' + e.message, '#ef4444');
        }
    }

    async function resetStoreData() {
        const stores = ['cart', 'orders', 'products', 'categories', 'coupons', 'profile', 'settings'];
        for (const s of stores) {
            try { await dbClear(s); } catch (e) {}
        }
        await updateCartBadge();
        if (typeof updateFloatingCartBar === 'function') updateFloatingCartBar();
        showToast('Semua data lokal Penyimpanan berhasil dibersihkan.', '#10b981');
        setTimeout(() => {
            navigate('/home');
        }, 500);
    }

    function formatRupiah(num) {
        return 'Rp ' + Math.round(Number(num) || 0).toLocaleString('id-ID');
    }
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
    }
    function formatDate(ts) {
        if (!ts) return '-';
        try {
            let d;
            if (typeof ts === 'number') {
                d = new Date(ts);
            } else if (typeof ts === 'string') {
                const clean = ts.trim().replace(' ', 'T');
                d = new Date(clean);
                if (isNaN(d.getTime())) d = new Date(ts);
            } else if (ts instanceof Date) {
                d = ts;
            } else {
                d = new Date(ts);
            }
            if (isNaN(d.getTime())) return String(ts);
            return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return String(ts || '-');
        }
    }
    function genId(prefix) {
        return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function showToast(msg, color = '#FF7A29', isLoading = false) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        let iconStr = isLoading
            ? `<svg class="w-5 h-5 animate-spin mr-2" viewBox="0 0 24 24" style="color:${color}"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`
            : `<svg class="svg-icon w-5 h-5 mr-2" viewBox="0 0 24 24" style="color:${color}"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        toast.innerHTML = `<div class="flex items-center justify-center">${iconStr} <span>${escapeHtml(msg)}</span></div>`;
        toast.classList.add('show');
        clearTimeout(window.__toastTimer);
        window.__toastTimer = setTimeout(() => toast.classList.remove('show'), isLoading ? 1500 : 2800);
    }



// ==========================================================
// MODULE: 07-cart.js
// ==========================================================
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



// ==========================================================
// MODULE: 08-checkout.js
// ==========================================================
    async function finalizeCheckoutOrder(order, items) {
        closeModal();

        // 1. Simpan pesanan ke database lokal (IndexedDB) agar dapat dilacak di halaman /p/lacak.html
        await dbPut('orders', order);

        // CATATAN PENTING: syncOrderToGoogleSheets(order) sengaja TIDAK dipanggil di sini!
        // Dengan ini, pesanan checkout TIDAK disimpan ke database Google Spreadsheet.

        // 2. Kurangi stok produk secara lokal
        for (const it of order.items) {
            const p = await dbGet('products', it.productId);
            if (p) {
                p.stock = Math.max(0, p.stock - it.qty);
                p.sold = (p.sold || 0) + it.qty;
                await dbPut('products', p);
            }
        }

        // 3. Simpan data profil pemesan
        await dbPut('profile', {
            id: 'me',
            name: order.customer.name,
            phone: order.customer.phone,
            address: order.customer.address,
            mapsUrl: (order.customer && order.customer.mapsUrl) || ''
        });

        // 4. Hapus item yang dipesan dari keranjang belanja
        for (const it of (items || [])) {
            if (it.cartItemId) {
                await dbDelete('cart', it.cartItemId);
            }
        }
        await updateCartBadge();

        // 5. Perbarui poin loyalitas & reset diskon checkout
        const loyaltyUsed = order.loyaltyPointsUsed || (window.__checkoutLoyaltyDiscount > 0 ? Math.floor(window.__checkoutLoyaltyDiscount / 500) : 0);
        const earnedPts = Math.floor(order.subtotal / 10000);
        const curPts = getYukFoodLoyaltyPoints();
        const newPts = Math.max(0, curPts - loyaltyUsed + earnedPts);
        saveYukFoodLoyaltyPoints(newPts);

        APPLIED_COUPON = null;
        window.__checkoutLoyaltyDiscount = 0;
        window.__cartLoyaltyPointsUsed = 0;
        window.__cartLoyaltyDiscount = 0;
        window.__checkoutLoyaltyPointsUsed = 0;
        window.__checkoutComboDiscount = 0;

        // 6. Mainkan nada pesanan
        playOrderChimeSound();

        // 7. Buka WhatsApp penjual dengan format struk rincian pesanan
        const waNumber = getSellerWhatsAppNumber();
        const text = encodeURIComponent(buildReceiptText(order));
        const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${text}` : `https://wa.me/?text=${text}`;
        window.open(waUrl, '_blank');

        showToast(`Pesanan #${order.id} berhasil dibuat! (+${earnedPts} Poin didapatkan)`, '#10b981');
        navigate('/p/lacak.html?orderId=' + encodeURIComponent(order.id));
    }

    function buildReceiptText(order) {
        const storeName = (window.STORE_NAME || 'WarungKu Food & Drink').toUpperCase();
        const divider = '━━━━━━━━━━━━━━━━━━━━';
        const lines = [];

        lines.push(`🍔 *PESANAN BARU - ${storeName}*`);
        lines.push(divider);
        lines.push('*No. Pesanan:* ' + order.id);
        lines.push('*Tanggal:* ' + formatDate(order.createdAt || Date.now()));
        const branchName = order.branchName || (order.branch && order.branch.name) || (typeof getRestaurantBranches === 'function' ? getRestaurantBranches()[0]?.name : 'Dapur Resto Pusat');
        lines.push('*Cabang Dapur:* ' + branchName);
        if (order.isDineIn) {
            lines.push('🍽️ *TIPE: MAKAN DI TEMPAT (DINE-IN - MEJA #' + (order.dineInTable || '-') + ')*');
        } else if (order.orderType === 'Pickup') {
            lines.push('🥡 *TIPE: AMBIL SENDIRI DI RESTO (TAKEAWAY)*');
        } else {
            lines.push('🛵 *TIPE: PESAN ANTAR (DELIVERY)*');
        }

        lines.push('');
        lines.push('👤 *DATA PEMESAN:*');
        lines.push('*Nama:* ' + (order.customer ? order.customer.name : 'Pelanggan'));
        lines.push('*No. WhatsApp:* ' + (order.customer ? order.customer.phone : '-'));
        if (order.orderType === 'Pickup') {
            lines.push('*Titik Pengambilan:* ' + (order.branchAddress ? `${branchName} (${order.branchAddress})` : branchName));
            lines.push('*Layanan:* Ambil Sendiri (Takeaway Resto - Bebas Ongkir)');
        } else if (order.isDineIn) {
            lines.push('*Lokasi:* Santap di Restoran (Meja #' + (order.dineInTable || '-') + ')');
            lines.push('*Alamat Pengiriman:* ' + (order.customer ? order.customer.address : '-'));
            if (order.shippingDestination) {
                lines.push('*Rute / Wilayah:* ' + order.shippingDestination);
            }
            const courierText = (order.shippingCourier || 'Kurir Resto') + (order.shippingService ? ' - ' + order.shippingService : ' - Reguler');
            lines.push('*Kurir:* ' + courierText);
        }
        lines.push('*Metode Pembayaran:* ' + order.paymentMethod);
        if (order.customer && order.customer.mapsUrl && order.orderType !== 'Pickup') {
            lines.push('*Titik Google Maps:* ' + order.customer.mapsUrl);
        }
        if (order.deliveryTiming) {
            lines.push(order.orderType === 'Pickup' ? ('*Estimasi Pengambilan:* ' + order.deliveryTiming) : ('*Waktu Kirim:* ' + order.deliveryTiming));
        }

        lines.push('');
        lines.push('🍱 *RINCIAN MENU PESANAN:*');
        (order.items || []).forEach((it, i) => {
            const varArr = [];
            if (it.size) varArr.push('Porsi: ' + it.size);
            if (it.color) {
                const cVal = it.color.replace(/^level\s*/i, '');
                varArr.push('Level: ' + cVal);
            }
            if (it.topping) varArr.push('Topping: ' + it.topping);
            const varTag = varArr.length ? ` [${varArr.join(', ')}]` : '';
            lines.push(`${i + 1}. ${it.name}${varTag} (x${it.qty}) = ${formatRupiah(it.price * it.qty)}`);
            if (it.note && it.note.trim()) {
                lines.push('   └ Catatan: ' + it.note.trim());
            }
        });

        lines.push('');
        lines.push('💰 *RINCIAN TAGIHAN:*');
        lines.push('*Subtotal:* ' + formatRupiah(order.subtotal));
        const ongkirReceiptText = order.isDineIn 
            ? 'Rp 0 (Dine-In)' 
            : (order.orderType === 'Pickup' 
                ? 'Rp 0 (Takeaway Resto)' 
                : (order.isFreeShipping ? 'Rp 0 (Gratis Ongkir)' : formatRupiah(order.shippingFee || 0)));
        lines.push('*Ongkir:* ' + ongkirReceiptText);
        const totalDiscount = (order.comboDiscount || 0) + ((order.couponCode && order.couponDiscount) ? order.couponDiscount : (order.loyaltyDiscount || 0));
        if (totalDiscount > 0) {
            lines.push('*Diskon:* -' + formatRupiah(totalDiscount));
        }
        lines.push(divider);
        lines.push('*TOTAL TAGIHAN: ' + formatRupiah(order.total) + '*');
        lines.push(divider);

        if (order.customer && order.customer.note && order.customer.note.trim()) {
            lines.push('');
            lines.push('*Catatan Khusus:* ' + order.customer.note.trim());
        }

        try {
            const originUrl = window.location.origin || '';
            if (originUrl && originUrl.startsWith('http')) {
                const trackingLink = `${originUrl}/p/lacak.html?orderId=${encodeURIComponent(order.id)}`;
                lines.push('');
                lines.push('🔍 *Lacak Status Pesanan:* ' + trackingLink);
            }
        } catch (e) {}

        lines.push('');
        lines.push('Halo Admin, mohon segera konfirmasi dan proses pesanan saya ya. Terima kasih! 🙏');
        return lines.join('\n');
    }

    async function downloadReceiptPDF(orderId) {
        let order = (window.__pendingOrder && window.__pendingOrder.id === orderId) ? window.__pendingOrder : null;
        if (!order) {
            order = await dbGet('orders', orderId);
        }
        if (!order) {
            showToast('Struk pesanan tidak ditemukan', '#ef4444');
            return;
        }
        if (!window.jspdf) {
            showToast('Modul PDF gagal dimuat, cek koneksi internet', '#ef4444');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a5' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 15;
        const rightX = pageWidth - marginX;
        let y = 16;

        const drawDivider = () => {
            doc.setLineDashPattern([1, 1], 0);
            doc.line(marginX, y, rightX, y);
            doc.setLineDashPattern([], 0);
            y += 6;
        };
        const rowLR = (left, right, bold = false) => {
            doc.setFont('courier', bold ? 'bold' : 'normal');
            doc.text(left, marginX, y);
            doc.text(right, rightX - doc.getTextWidth(right), y);
            y += 5.5;
        };

        const storeNameForPdf = window.STORE_NAME || 'WarungKu Food & Drink';
        doc.setFont('courier', 'bold');
        doc.setFontSize(14);
        doc.text(storeNameForPdf, pageWidth / 2, y, { align: 'center' });
        y += 6;

        doc.setFont('courier', 'normal');
        doc.setFontSize(9);
        doc.text('No. Pesanan: ' + order.id, pageWidth / 2, y, { align: 'center' });
        y += 4.5;
        doc.text('Tanggal: ' + formatDate(order.createdAt), pageWidth / 2, y, { align: 'center' });
        y += 6;
        drawDivider();

        doc.setFontSize(9);
        order.items.forEach(it => {
            const varStr = [it.size ? 'Porsi: ' + it.size : '', it.color ? 'Rasa: ' + it.color : ''].filter(Boolean).join(', ');
            const titleLine = it.name + (varStr ? ' (' + varStr + ')' : '') + ' x' + it.qty;
            const nameLines = doc.splitTextToSize(titleLine, pageWidth - 2 * marginX - 30);
            doc.setFont('courier', 'normal');
            doc.text(nameLines, marginX, y);
            const priceStr = formatRupiah(it.price * it.qty);
            doc.text(priceStr, rightX - doc.getTextWidth(priceStr), y);
            y += nameLines.length * 5;
        });
        y += 1;
        drawDivider();

        rowLR('Subtotal', formatRupiah(order.subtotal));
        if (order.couponCode && order.couponDiscount) {
            rowLR('Voucher (' + order.couponCode + ')', '-' + formatRupiah(order.couponDiscount));
        }
        const pdfOngkirLabel = order.orderType === 'Pickup' ? 'Takeaway Resto' : (order.isDineIn ? 'Dine-In' : ('Biaya Antar (' + (order.shippingCourier || 'Kurir Resto') + ')'));
        const pdfOngkirVal = (order.orderType === 'Pickup' || order.isDineIn || order.isFreeShipping) ? 'Rp 0 (GRATIS)' : formatRupiah(order.shippingFee || 0);
        rowLR(pdfOngkirLabel, pdfOngkirVal);
        y += 1;
        rowLR('TOTAL', formatRupiah(order.total), true);
        y += 1;
        drawDivider();

        doc.setFont('courier', 'bold');
        doc.text(order.customer.name, marginX, y);
        y += 5;
        doc.setFont('courier', 'normal');
        doc.text(order.customer.phone, marginX, y);
        y += 5;
        const addrLines = doc.splitTextToSize(order.customer.address, pageWidth - 2 * marginX);
        doc.text(addrLines, marginX, y);
        y += addrLines.length * 5;
        if (order.shippingDestination) {
            doc.text('Tujuan: ' + order.shippingDestination, marginX, y);
            y += 5;
        }
        if (order.customer.note) {
            doc.text(doc.splitTextToSize('Catatan: ' + order.customer.note, pageWidth - 2 * marginX), marginX, y);
            y += 5;
        }
        doc.text('Pembayaran: ' + order.paymentMethod, marginX, y);
        y += 8;

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Terima kasih telah berbelanja di ' + storeNameForPdf, pageWidth / 2, y, { align: 'center' });

        doc.save('Struk-' + order.id + '.pdf');
        showToast('Struk PDF berhasil diunduh', '#10b981');
    }


    async function renderOrders() {
        const orders = (await dbGetAll('orders')).sort((a, b) => b.createdAt - a.createdAt);
        const container = document.getElementById('page-content');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
            <section class="page-fade text-center py-20">
                <div class="w-24 h-24 mx-auto mb-6 clay-card flex items-center justify-center text-slate-400"><svg class="svg-icon w-10 h-10" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path><rect x="9" y="3" width="6" height="4" rx="1"></rect></svg></div>
                <h2 class="text-xl font-heading font-black text-slate-800 dark:text-white mb-2">Belum Ada Pesanan</h2>
                <p class="text-sm text-slate-500 mb-6">Riwayat pesananmu akan muncul di sini.</p>
                <button onclick="goToHome()" class="px-8 py-3.5 clay-btn-primary font-bold text-sm">Mulai Belanja</button>
            </section>`;
            return;
        }
        container.innerHTML = `
        <section class="page-fade space-y-6">
            <div class="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
                <button onclick="if(window.history.length > 1){window.history.back();}else{navigate('/home');}" type="button" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 clay-btn hover:text-purple-600 dark:hover:text-purple-400 hover:-translate-x-0.5 transition-all shadow-sm group">
                    <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    <span>Kembali</span>
                </button>
                <div class="text-right">
                    <h1 class="text-xl sm:text-2xl font-heading font-black text-slate-800 dark:text-white">Pesanan Saya</h1>
                    <p class="text-[11px] text-slate-400">Riwayat belanja &amp; pemantauan kurir</p>
                </div>
            </div>

            <div class="clay-card p-4 sm:p-5 bg-gradient-to-r from-purple-50/70 to-indigo-50/50 dark:from-purple-950/20 dark:to-slate-900/40">
                <p class="text-xs font-black text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <span>🔍</span><span>Punya No. Pesanan / Resi? Lacak Progres Masak &amp; Kurir:</span>
                </p>
                <form onsubmit="event.preventDefault(); trackOrderByInput();" class="relative flex">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400 pointer-events-none">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input id="track-order-input" type="text" placeholder="Masukkan No. Pesanan (ORD-xxxx) atau Resi ArjuGo (ARJ-xxxx)..." class="w-full pl-11 pr-24 py-3 clay-input text-xs sm:text-sm font-bold">
                    <button type="submit" class="absolute right-1.5 top-1.5 bottom-1.5 px-4 sm:px-5 clay-btn-primary font-bold text-xs flex items-center gap-1 shadow-sm">
                        <span>Lacak</span>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </form>
            </div>

            <div class="space-y-4">
                ${orders.map(o => {
                    const oItems = Array.isArray(o.items) ? o.items : [];
                    const isDone = o.status === 'Selesai';
                    const isArjuGo = !!((o.trackingNumber && String(o.trackingNumber).startsWith('ARJ-')) || (o.kurirId === 'ArjuGo Express'));
                    return `
                <div class="clay-card p-5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-all group" onclick="navigate('/p/lacak.html?orderId=${encodeURIComponent(o.id)}')">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="font-mono font-black text-purple-600 dark:text-purple-400 text-sm group-hover:underline block">#${o.id}</span>
                            <p class="text-xs text-slate-400">${formatDate(o.createdAt || Date.now())} &bull; ${escapeHtml(o.paymentMethod || 'WhatsApp')}</p>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="status-badge status-${o.status || 'Diproses'}">${o.status || 'Diproses'}</span>
                            ${isArjuGo ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">🛵 ArjuGo: ${escapeHtml(o.trackingNumber || 'Express')}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-2 mb-3 overflow-hidden">
                        ${oItems.slice(0, 4).map(it => `<img src="${(it && it.image) ? it.image : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600'}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0" title="${escapeHtml((it && it.name) || '')}">`).join('')}
                        ${oItems.length > 4 ? `<span class="text-xs font-bold text-slate-400 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">+${oItems.length - 4}</span>` : ''}
                    </div>
                    <div class="flex flex-wrap justify-between items-center border-t border-dashed border-slate-200 dark:border-slate-700/60 pt-3 gap-2">
                        <span class="text-xs text-slate-500 dark:text-slate-400 font-bold">${oItems.length} menu dipesan &bull; <strong class="text-slate-800 dark:text-white font-mono">${formatRupiah(o.total || 0)}</strong></span>
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                <span>🛵</span>
                                <span>Lacak Status Live</span>
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </span>
                            ${isDone ? `
                                <button onclick="event.stopPropagation(); downloadReceiptPDF('${o.id}')" class="px-2.5 py-1.5 clay-btn text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1" title="Cetak Struk (PDF)">
                                    <svg class="svg-icon w-3.5 h-3.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>`;
                }).join('')}
            </div>
        </section>`;
    }



// ==========================================================
// MODULE: 09-tracking.js
// ==========================================================
    async function trackOrderByInput() {
        const raw = document.getElementById('track-order-input').value.trim();
        if (!raw) { showToast('Masukkan No. Pesanan terlebih dahulu', '#ef4444'); return; }
        if (window.location.pathname.toLowerCase().includes('/p/lacak')) {
            executeLacakSearch(raw);
        } else {
            window.location.href = '/p/lacak.html?orderId=' + encodeURIComponent(raw);
        }
    }

    async function renderLacakPage(initialQuery) {
        const container = document.getElementById('page-content');
        if (!container) return;

        let query = initialQuery || '';
        if (!query) {
            try {
                const sp = new URLSearchParams(window.location.search);
                query = sp.get('orderId') || sp.get('order') || sp.get('track') || sp.get('query') || sp.get('no') || sp.get('resi') || sp.get('id') || '';
            } catch (e) {}
        }
        if (!query) {
            const hashParts = currentRoute();
            if (hashParts[0] === 'lacak' && hashParts[1]) {
                query = decodeURIComponent(hashParts[1]);
            }
        }

        container.innerHTML = `
        <section class="page-fade space-y-6 max-w-3xl mx-auto">
            <div class="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
                <button onclick="if(window.history.length > 1){window.history.back();}else{navigate('/home');}" type="button" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 clay-btn hover:text-purple-600 dark:hover:text-purple-400 hover:-translate-x-0.5 transition-all shadow-sm group">
                    <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    <span>Kembali</span>
                </button>
                <div class="text-right">
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[11px] font-extrabold border border-purple-500/20">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Live Tracking Google Cloud &amp; ArjuGo</span>
                    </div>
                </div>
            </div>

            <div class="clay-card p-6 md:p-8 text-center relative overflow-hidden bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-950/20">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                </div>
                <h1 class="text-2xl md:text-3xl font-heading font-black text-slate-800 dark:text-white mb-2">Lacak Pesanan Kuliner</h1>
                <p class="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                    Pantau tahapan masak di dapur, verifikasi resto, dan status perjalanan kurir secara akurat &amp; real-time.
                </p>

                <form onsubmit="event.preventDefault(); submitLacakSearch();" class="relative max-w-xl mx-auto">
                    <div class="relative flex items-center">
                        <div class="absolute left-4 text-purple-600 dark:text-purple-400 pointer-events-none">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input id="lacak-input-field" type="text" value="${escapeHtml(query)}" placeholder="Ketik No. Pesanan (ORD-xxxx), Resi ArjuGo (ARJ-xxxx), atau No. WhatsApp..." class="w-full pl-11 pr-28 py-3.5 text-xs sm:text-sm font-bold clay-input transition-all">
                        <button type="submit" id="lacak-btn-submit" class="absolute right-1.5 top-1.5 bottom-1.5 px-5 sm:px-6 clay-btn-primary font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md">
                            <span>Lacak</span>
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                    <div class="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        <span class="text-amber-500">💡</span>
                        <span>Gunakan No. Pesanan (ORD-...), No. Resi ArjuGo (ARJ-...), atau Nomor WhatsApp saat pemesanan</span>
                    </div>
                </form>
            </div>

            <div id="lacak-result-container" class="space-y-6"></div>
        </section>`;

        if (query && query.trim()) {
            executeLacakSearch(query.trim());
        } else {
            renderLacakRecentOrders();
        }
    }

    async function submitLacakSearch() {
        const inp = document.getElementById('lacak-input-field');
        if (!inp) return;
        const val = inp.value.trim();
        if (!val) {
            showToast('Silakan masukkan No. Pesanan atau No. WhatsApp', '#ef4444');
            return;
        }
        executeLacakSearch(val);
    }

    async function renderLacakRecentOrders() {
        const cont = document.getElementById('lacak-result-container');
        if (!cont) return;
        try {
            const dbPromise = dbGetAll('orders');
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 1200));
            const rawOrders = (await Promise.race([dbPromise, timeoutPromise])) || [];
            const localOrders = (Array.isArray(rawOrders) ? rawOrders : []).filter(Boolean).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

            if (localOrders.length === 0) {
                cont.innerHTML = `
                <div class="clay-card p-8 text-center space-y-4">
                    <div class="w-14 h-14 mx-auto bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-2xl flex items-center justify-center text-2xl">
                        📦
                    </div>
                    <h3 class="text-base font-black text-slate-800 dark:text-white">Belum Ada Riwayat Pelacakan</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Masukkan No. Pesanan yang Anda terima saat memesan di kolom pencarian di atas untuk memeriksa status hidangan Anda secara langsung.
                    </p>
                </div>`;
                return;
            }

            cont.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <span>🕒</span>
                        <span>Pesanan Terakhir di Perangkat Ini</span>
                    </h3>
                    <span class="text-xs text-slate-400 font-bold">${localOrders.length} Pesanan</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${localOrders.slice(0, 4).map(o => {
                        if (!o) return '';
                        const orderIdSafe = escapeHtml(String(o.id || ''));
                        const stClass = getLacakStatusBadgeClass(o.status || 'Diproses');
                        const itCount = Array.isArray(o.items) ? o.items.length : 1;
                        const isArjuGo = !!((o.trackingNumber && String(o.trackingNumber).startsWith('ARJ-')) || (o.kurirId === 'ArjuGo Express'));
                        return `
                        <div class="clay-card p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group" onclick="document.getElementById('lacak-input-field').value='${orderIdSafe}'; executeLacakSearch('${orderIdSafe}');">
                            <div class="flex items-start justify-between mb-2">
                                <div>
                                    <span class="font-mono font-bold text-xs text-purple-600 dark:text-purple-400 group-hover:underline block">#${orderIdSafe}</span>
                                    <span class="text-[10px] text-slate-400">${escapeHtml(formatDate(o.createdAt || Date.now()))}</span>
                                </div>
                                <div class="flex flex-col items-end gap-1">
                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${stClass}">${escapeHtml(String(o.status || 'Diproses'))}</span>
                                    ${isArjuGo ? `<span class="text-[9px] font-bold text-violet-600 dark:text-violet-400">🛵 ${escapeHtml(o.trackingNumber || 'ArjuGo')}</span>` : ''}
                                </div>
                            </div>
                            <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <span class="text-slate-500 dark:text-slate-400 font-medium">${itCount} Menu &bull; ${formatRupiah(o.total || 0)}</span>
                                <span class="text-purple-600 dark:text-purple-400 font-bold text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                    <span>Lacak</span>
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        } catch (err) {
            console.error('[Lacak] Gagal merender pesanan lokal:', err);
        }
    }

    function getLacakStatusBadgeClass(st) {
        if (st === 'Selesai') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700';
        if (st === 'Dikirim' || st === 'Diantar' || st === 'Dalam Pengantaran') return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700';
        if (st === 'Siap di Counter' || st === 'Siap Diantar' || st === 'Menunggu Kurir') return 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-300 dark:border-teal-700';
        if (st === 'Dimasak' || st === 'Sedang Dimasak') return 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-700';
        if (st === 'Dibatalkan') return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700';
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700';
    }

    function getCourierBackendGasUrl() {
        try {
            let u = localStorage.getItem('arjugo_kurir_gas_url') || localStorage.getItem('arjugo_mitra_gas_url') || localStorage.getItem('mangan_kurir_gas_url') || localStorage.getItem('kurir_gas_url');
            if (u) {
                u = u.trim();
                if (!u.startsWith('http')) {
                    u = 'https://script.google.com/macros/s/' + u.replace(/^\/+|\/+$/g, '').replace(/\/exec$/i, '') + '/exec';
                }
                if (u.startsWith('https://script.google.com/')) return u;
            }
            if (window.ARJUGO_CONFIG && window.ARJUGO_CONFIG.GAS_URL) {
                let confU = window.ARJUGO_CONFIG.GAS_URL.trim();
                if (confU) {
                    if (!confU.startsWith('http')) confU = 'https://script.google.com/macros/s/' + confU.replace(/^\/+|\/+$/g, '').replace(/\/exec$/i, '') + '/exec';
                    if (confU.startsWith('https://script.google.com/')) return confU;
                }
            }
            const mainGas = (typeof getGoogleAppsScriptUrl === 'function') ? getGoogleAppsScriptUrl() : '';
            if (mainGas && mainGas.startsWith('https://script.google.com/')) return mainGas.trim();
        } catch(e) {}
        return '';
    }

    async function fetchArjuGoTracking(resiOrOrderId) {
        if (!resiOrOrderId) return null;
        const courierGas = getCourierBackendGasUrl();
        if (!courierGas) return null;
        try {
            const sep = courierGas.includes('?') ? '&' : '?';
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 7000);
            const res = await fetch(`${courierGas}${sep}action=track_order&orderId=${encodeURIComponent(resiOrOrderId)}&_=${Date.now()}`, { signal: controller.signal });
            clearTimeout(tid);
            if (res.ok) {
                const j = await res.json();
                if (j && j.success) {
                    return j;
                }
            }
        } catch (e) {
            console.warn('[Lacak ArjuGo] Gagal mengambil data pelacakan:', e);
        }
        return null;
    }

    async function fetchDedicatedCourierGps(orderId) {
        const courierGas = getCourierBackendGasUrl();
        if (!courierGas || !orderId) return null;
        try {
            const sep = courierGas.includes('?') ? '&' : '?';
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(`${courierGas}${sep}action=track_order&orderId=${encodeURIComponent(orderId)}&_=${Date.now()}`, { signal: controller.signal });
            clearTimeout(tid);
            if (res.ok) {
                const j = await res.json();
                if (j && j.success && j.coords && isFinite(j.coords.lat) && isFinite(j.coords.lng)) {
                    return j.coords;
                }
            }
        } catch (e) {}
        try {
            const sep = courierGas.includes('?') ? '&' : '?';
            const controller2 = new AbortController();
            const tid2 = setTimeout(() => controller2.abort(), 5000);
            const res2 = await fetch(`${courierGas}${sep}action=get_courier_location&orderId=${encodeURIComponent(orderId)}&_=${Date.now()}`, { signal: controller2.signal });
            clearTimeout(tid2);
            if (res2.ok) {
                const j2 = await res2.json();
                if (j2 && j2.success && j2.coords && isFinite(j2.coords.lat) && isFinite(j2.coords.lng)) {
                    return j2.coords;
                }
            }
        } catch (e) {}
        return null;
    }

    function parseOrderPodData(order) {
        if (!order) return null;
        let photoUrl = order.podPhoto || '';
        let podTimestamp = order.podTimestamp || '';
        let podStore = order.storeName || '';
        let podNoteText = '';

        const notes = String(order.notes || (order.customer && order.customer.note) || '');

        const podRegex = /\[POD(?:\s*\(([^)]+)\))?:\s*(?:Selesai\s*)?([^|\]]+?)(?:\|\s*Foto:\s*([^\]]+))?\]/i;
        const match = notes.match(podRegex);

        if (match) {
            if (match[1]) podStore = match[1].trim();
            if (match[2]) podTimestamp = match[2].trim();
            if (match[3] && !photoUrl) photoUrl = match[3].trim();
            podNoteText = match[0];
        } else {
            const fotoMatch = notes.match(/Foto:\s*(https?:\/\/[^\s\]]+)/i);
            if (fotoMatch && !photoUrl) {
                photoUrl = fotoMatch[1].trim();
            }
        }

        if (!photoUrl && !podTimestamp && !order.podPhoto && order.status !== 'Selesai') {
            return null;
        }

        let displayImageUrl = photoUrl;
        let driveFileId = '';
        if (photoUrl && photoUrl.includes('drive.google.com')) {
            const idMatch = photoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            const dMatch = photoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (idMatch) driveFileId = idMatch[1];
            else if (dMatch) driveFileId = dMatch[1];

            if (driveFileId) {
                displayImageUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`;
            }
        }

        return {
            hasPhoto: !!photoUrl,
            photoUrl: displayImageUrl,
            originalUrl: photoUrl,
            driveFileId: driveFileId,
            timestamp: podTimestamp,
            store: podStore,
            noteText: podNoteText
        };
    }

    function updateCourierLiveMarkerSmoothly(coords, order) {
        if (!coords || !window.__orderCourierMarker || !window.__orderLiveGpsMap) return;
        const newLat = parseFloat(coords.lat);
        const newLng = parseFloat(coords.lng);
        if (isNaN(newLat) || isNaN(newLng)) return;

        window.__orderCourierMarker.setLatLng([newLat, newLng]);

        let custLat = null, custLng = null;
        if (order.customer && order.customer.mapsUrl) {
            const urlMatch = order.customer.mapsUrl.match(/q=([-\d.]+),([-\d.]+)/);
            if (urlMatch) {
                custLat = parseFloat(urlMatch[1]);
                custLng = parseFloat(urlMatch[2]);
            }
        }
        if (custLat === null) {
            const branches = getRestaurantBranches();
            const branch = (branches && branches[0]) || { lat: -6.2088, lng: 106.8456 };
            custLat = branch.lat - 0.015;
            custLng = branch.lng + 0.018;
        }

        const distToCustomer = calculateHaversineKm(newLat, newLng, custLat, custLng);
        const estMinutes = Math.max(2, Math.round(distToCustomer * 3.5));
        const etaEl = document.getElementById('live-gps-eta-text');
        if (etaEl) {
            const st = order.status || '';
            if (st === 'Diproses') {
                etaEl.innerHTML = `📝 Pesanan diterima resto (menunggu antrean dapur)`;
            } else if (st === 'Dimasak' || st === 'Sedang Dimasak') {
                etaEl.innerHTML = `🍳 Sedang dimasak di dapur (${distToCustomer.toFixed(1)} km ke lokasi)`;
            } else if (st === 'Siap di Counter' || st === 'Siap Diantar' || st === 'Menunggu Kurir') {
                etaEl.innerHTML = `🛵 Makanan siap di counter, menunggu penjemputan kurir`;
            } else if (st === 'Selesai') {
                etaEl.innerHTML = `✨ Makanan telah tiba di alamat tujuan!`;
            } else {
                if (distToCustomer <= 0.25 && (st === 'Dikirim' || st === 'Diantar' || st === 'Dalam Pengantaran') && !window.__orderArrivalChimePlayed) {
                    window.__orderArrivalChimePlayed = true;
                    playCourierArrivalChime();
                    etaEl.innerHTML = `🔔 <b class="text-emerald-600 dark:text-emerald-400">Kurir sudah tiba di depan rumah!</b> (${(distToCustomer * 1000).toFixed(0)}m)`;
                    showToast('🔔 Kurir sudah tiba di depan rumah Anda!', '#10b981');
                } else {
                    etaEl.innerHTML = `🛵 Kurir bergerak menuju alamat (~${estMinutes} mnt, ${distToCustomer.toFixed(1)} km)`;
                }
            }
        }
    }

    let __lacakPollingInterval = null;

    function stopLacakLivePolling() {
        if (__lacakPollingInterval) {
            clearInterval(__lacakPollingInterval);
            __lacakPollingInterval = null;
        }
    }

    function startLacakLivePolling(orderId) {
        stopLacakLivePolling();
        if (!orderId) return;
        __lacakPollingInterval = setInterval(() => {
            const currentPath = window.location.pathname.toLowerCase();
            const cont = document.getElementById('lacak-result-container');
            if (!cont || (!currentPath.includes('/p/lacak') && !/[?&](orderId|order|resi|id|track|query)=/i.test(window.location.search))) {
                stopLacakLivePolling();
                return;
            }
            refreshLacakOrderStatus(orderId, true);
        }, 12000);
    }

    async function refreshLacakOrderStatus(orderId, isSilent = false) {
        if (!orderId) return;
        const cleanId = String(orderId).replace(/^[#\s]+|[#\s]+$/g, '').trim().toUpperCase();
        const icon = document.getElementById('icon-refresh-lacak');
        if (icon) icon.classList.add('fa-spin');

        // Jika nomor yang dilacak adalah resi ArjuGo (ARJ-xxxx)
        if (cleanId.startsWith('ARJ-')) {
            try {
                const arjData = await fetchArjuGoTracking(cleanId);
                if (arjData && arjData.success && arjData.order) {
                    const ao = arjData.order;
                    let localOrders = [];
                    try {
                        const dbPromise = dbGetAll('orders');
                        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 1200));
                        localOrders = (await Promise.race([dbPromise, timeoutPromise])) || [];
                    } catch(e) {}
                    const existing = localOrders.find(o => String(o.id || '').toUpperCase() === cleanId || String(o.trackingNumber || '').toUpperCase() === cleanId);

                    const prevStatus = existing ? existing.status : null;
                    const newStatus = String(ao.status || 'Menunggu Kurir');

                    const updatedOrder = {
                        id: String(existing ? existing.id : ao.orderId),
                        trackingNumber: String(ao.orderId || cleanId),
                        kurirId: 'ArjuGo Express',
                        dateDisplay: existing ? existing.dateDisplay : formatDate(Date.now()),
                        createdAt: existing ? existing.createdAt : Date.now(),
                        customer: {
                            name: String(ao.receiver || (existing && existing.customer ? existing.customer.name : 'Pelanggan')),
                            phone: String(ao.receiverPhone || (existing && existing.customer ? existing.customer.phone : '')),
                            address: String(ao.address || (existing && existing.customer ? existing.customer.address : '')),
                            note: String(ao.notes || (existing && existing.customer ? existing.customer.note : ''))
                        },
                        items: (existing && existing.items) ? existing.items : [],
                        itemsSummary: String(existing && existing.itemsSummary ? existing.itemsSummary : ([ao.itemType, ao.service].filter(Boolean).join(' • '))),
                        subtotal: Number(existing ? existing.subtotal : (ao.codAmount || 0)),
                        shippingFee: Number(existing ? existing.shippingFee : 0),
                        couponDiscount: Number(existing ? existing.couponDiscount : 0),
                        total: Number(existing ? existing.total : (ao.codAmount || 0)),
                        paymentMethod: String(existing ? existing.paymentMethod : (ao.paymentMethod || 'ArjuGo Express')),
                        status: newStatus,
                        courier: ao.courierName ? { name: ao.courierName, phone: ao.courierPhone || '' } : (existing ? existing.courier : null),
                        courierCoords: (arjData.coords && isFinite(arjData.coords.lat)) ? arjData.coords : (existing ? existing.courierCoords : null),
                        storeName: String(ao.mitraName || (existing ? existing.storeName : '')),
                        podPhoto: ao.podPhoto || (existing ? existing.podPhoto : null),
                        podTimestamp: ao.podTimestamp || (existing ? existing.podTimestamp : null),
                        notes: String(ao.notes || (existing ? existing.notes : '')),
                        statusHistory: (existing && existing.statusHistory && existing.statusHistory.length) ? existing.statusHistory : ((arjData.history || []).map(h => ({ status: h.status, at: h.time })))
                    };

                    if (updatedOrder.courierCoords && updatedOrder.courierCoords.lat && updatedOrder.courierCoords.lng) {
                        try {
                            localStorage.setItem('majid_courier_gps_' + updatedOrder.id, JSON.stringify(updatedOrder.courierCoords));
                            localStorage.setItem('digiarju_courier_gps_' + updatedOrder.id, JSON.stringify(updatedOrder.courierCoords));
                        } catch(e) {}
                    }

                    if (!updatedOrder.statusHistory.some(h => h.status === updatedOrder.status)) {
                        updatedOrder.statusHistory.push({ status: updatedOrder.status, at: Date.now() });
                    }

                    try { await dbPut('orders', updatedOrder); } catch (e) {}

                    if (prevStatus !== newStatus || !isSilent) {
                        renderLacakOrderDetail(updatedOrder);
                        if (prevStatus && prevStatus !== newStatus) {
                            showToast(`🔔 Status Paket ArjuGo #${cleanId}: ${newStatus}`, '#10b981');
                        } else if (!isSilent) {
                            showToast('Status ArjuGo berhasil diperbarui!', '#10b981');
                        }
                    } else if (updatedOrder.courierCoords && window.__orderCourierMarker && window.__orderLiveGpsMap) {
                        updateCourierLiveMarkerSmoothly(updatedOrder.courierCoords, updatedOrder);
                    }
                    return;
                } else if (!isSilent) {
                    showToast((arjData && arjData.message) || 'Resi ArjuGo tidak ditemukan.', '#ef4444');
                    return;
                }
            } catch (err) {
                if (!isSilent) showToast('Gagal menyinkronkan data resi ArjuGo.', '#ef4444');
                return;
            } finally {
                if (icon) icon.classList.remove('fa-spin');
            }
        }

        const gasUrl = getGoogleAppsScriptUrl();
        if (!gasUrl) {
            if (icon) icon.classList.remove('fa-spin');
            if (!isSilent) showToast('Backend belum terhubung. Periksa majid_gas_url di Tata Letak.', '#ef4444');
            return;
        }

        try {
            const sep = gasUrl.includes('?') ? '&' : '?';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(`${gasUrl}${sep}action=track_order&orderId=${encodeURIComponent(cleanId)}&query=${encodeURIComponent(cleanId)}&_=${Date.now()}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const json = await res.json();

            if (json && json.success && json.data) {
                const d = json.data;

                // Sinkronkan update kurir dari ArjuGo jika order memiliki resi ArjuGo
                let arjData = null;
                if (d.trackingNumber && d.trackingNumber.startsWith('ARJ-')) {
                    try {
                        arjData = await fetchArjuGoTracking(d.trackingNumber);
                    } catch(e) {}
                }

                if (!d.courierCoords || !d.courierCoords.lat) {
                    if (arjData && arjData.coords && isFinite(arjData.coords.lat)) {
                        d.courierCoords = arjData.coords;
                    } else {
                        const dedicatedCoords = await fetchDedicatedCourierGps(d.trackingNumber || cleanId);
                        if (dedicatedCoords) {
                            d.courierCoords = dedicatedCoords;
                        }
                    }
                }

                let localOrders = [];
                try {
                    const dbPromise = dbGetAll('orders');
                    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 1200));
                    localOrders = (await Promise.race([dbPromise, timeoutPromise])) || [];
                } catch(e) {}
                const existing = localOrders.find(o => String(o.id || '').toUpperCase() === cleanId);

                const prevStatus = existing ? existing.status : null;
                let newStatus = String(d.status || 'Diproses');

                if (arjData && arjData.order && arjData.order.status && arjData.order.status !== 'Menunggu Kurir') {
                    newStatus = arjData.order.status;
                }

                const updatedOrder = {
                    id: String(d.orderId || cleanId),
                    dateDisplay: String(d.date || (existing ? existing.dateDisplay : '')),
                    createdAt: existing ? existing.createdAt : Date.now(),
                    customer: {
                        name: String(d.name || (existing && existing.customer ? existing.customer.name : 'Pelanggan')),
                        phone: String(d.phone || (existing && existing.customer ? existing.customer.phone : '')),
                        address: String(d.address || (existing && existing.customer ? existing.customer.address : '')),
                        note: String(d.notes || (existing && existing.customer ? existing.customer.note : ''))
                    },
                    items: (existing && existing.items && existing.items.length) ? existing.items : [],
                    itemsSummary: String(d.itemsSummary || (existing ? existing.itemsSummary : '')),
                    subtotal: Number(d.subtotal) || (existing ? existing.subtotal : 0),
                    shippingFee: Number(d.shippingFee) || (existing ? existing.shippingFee : 0),
                    couponDiscount: Number(d.discount) || (existing ? existing.couponDiscount : 0),
                    total: Number(d.total) || (existing ? existing.total : 0),
                    paymentMethod: String(d.paymentMethod || (existing ? existing.paymentMethod : 'WhatsApp')),
                    status: newStatus,
                    trackingNumber: String(d.trackingNumber || (existing ? existing.trackingNumber : '')),
                    kurirId: String((arjData && arjData.order && arjData.order.courierName) ? 'ArjuGo Express' : (d.kurirId || (existing ? existing.kurirId : ''))),
                    courier: (arjData && arjData.order && arjData.order.courierName) ? { name: arjData.order.courierName, phone: arjData.order.courierPhone || '' } : (d.courier || (existing ? existing.courier : null)),
                    courierCoords: d.courierCoords || (existing ? existing.courierCoords : null),
                    storeId: d.storeId || (existing ? existing.storeId : ''),
                    storeName: d.storeName || (existing ? existing.storeName : ''),
                    storeAddress: d.storeAddress || (existing ? existing.storeAddress : ''),
                    storeColor: d.storeColor || (existing ? existing.storeColor : ''),
                    podPhoto: (arjData && arjData.order && arjData.order.podPhoto) ? arjData.order.podPhoto : (d.podPhoto || (existing ? existing.podPhoto : null)),
                    podTimestamp: (arjData && arjData.order && arjData.order.podTimestamp) ? arjData.order.podTimestamp : (d.podTimestamp || (existing ? existing.podTimestamp : null)),
                    notes: String(d.notes || (existing ? existing.notes : '')),
                    statusHistory: (existing && existing.statusHistory) ? existing.statusHistory : []
                };

                if (d.courierCoords && d.courierCoords.lat && d.courierCoords.lng) {
                    try {
                        localStorage.setItem('majid_courier_gps_' + d.orderId, JSON.stringify(d.courierCoords));
                        localStorage.setItem('digiarju_courier_gps_' + d.orderId, JSON.stringify(d.courierCoords));
                        localStorage.setItem('mangan_courier_gps_' + d.orderId, JSON.stringify(d.courierCoords));
                    } catch(e) {}
                }

                if (!updatedOrder.statusHistory.some(h => h.status === updatedOrder.status)) {
                    updatedOrder.statusHistory.push({ status: updatedOrder.status, at: Date.now() });
                }

                try { await dbPut('orders', updatedOrder); } catch (e) {}

                if (prevStatus !== newStatus || !isSilent) {
                    renderLacakOrderDetail(updatedOrder);
                    if (prevStatus && prevStatus !== newStatus) {
                        showToast(`🔔 Status Pesanan #${cleanId}: ${newStatus}`, '#10b981');
                    } else if (!isSilent) {
                        showToast('Status pesanan berhasil diperbarui!', '#10b981');
                    }
                } else if (d.courierCoords && window.__orderCourierMarker && window.__orderLiveGpsMap) {
                    updateCourierLiveMarkerSmoothly(d.courierCoords, updatedOrder);
                }
            } else if (!isSilent) {
                showToast((json && json.message) || 'Pesanan tidak ditemukan di Google Sheets.', '#ef4444');
            }
        } catch (err) {
            if (!isSilent) showToast('Gagal menyinkronkan status pesanan dari server.', '#ef4444');
        } finally {
            if (icon) icon.classList.remove('fa-spin');
        }
    }

    async function executeLacakSearch(rawQuery) {
        stopLacakLivePolling();
        const cont = document.getElementById('lacak-result-container');
        if (!cont) return;
        const query = (rawQuery || '').trim();
        if (!query) return;

        const cleanId = query.replace(/^[#\s]+|[#\s]+$/g, '').trim().toUpperCase();
        const cleanDigits = query.replace(/[^0-9]/g, '');

        const inp = document.getElementById('lacak-input-field');
        if (inp && inp.value !== query) inp.value = query;

        try {
            if (window.history && window.history.replaceState) {
                const targetPath = (window.location.pathname && window.location.pathname.includes('/p/lacak')) ? window.location.pathname : '/p/lacak.html';
                const newUrl = targetPath + '?orderId=' + encodeURIComponent(cleanId);
                window.history.replaceState({ orderId: cleanId }, '', newUrl);
            }
        } catch (e) {}

        try {
            let matchedOrder = null;

            // 1. Cek penyimpanan lokal IndexedDB
            try {
                const dbPromise = dbGetAll('orders');
                const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 1200));
                const localOrders = (await Promise.race([dbPromise, timeoutPromise])) || [];
                matchedOrder = localOrders.find(o => {
                    if (!o) return false;
                    const rowId = String(o.id || '').trim().toUpperCase().replace(/^#+/, '');
                    const rowTracking = String(o.trackingNumber || '').trim().toUpperCase();
                    const rowPhone = String((o.customer && o.customer.phone) || '').replace(/[^0-9]/g, '');
                    if (rowId === cleanId) return true;
                    if (rowTracking === cleanId) return true;
                    if (cleanId.length >= 4 && (rowId.endsWith(cleanId) || rowTracking.endsWith(cleanId))) return true;
                    if (cleanDigits.length >= 8 && (rowPhone.endsWith(cleanDigits) || cleanDigits.endsWith(rowPhone) || rowPhone.slice(-8) === cleanDigits.slice(-8))) return true;
                    return false;
                });
            } catch (e) {
                console.warn('[Lacak] Gagal membaca pesanan lokal:', e);
            }

            if (matchedOrder) {
                if (!matchedOrder.courierCoords) {
                    const storedGps = localStorage.getItem('majid_courier_gps_' + matchedOrder.id) || localStorage.getItem('mangan_courier_gps_' + matchedOrder.id);
                    if (storedGps) {
                        try { matchedOrder.courierCoords = JSON.parse(storedGps); } catch(e) {}
                    }
                }
                renderLacakOrderDetail(matchedOrder);
                startLacakLivePolling(matchedOrder.id);
                refreshLacakOrderStatus(matchedOrder.id, true);
                return;
            }

            cont.innerHTML = `
            <div class="clay-card p-10 text-center space-y-4">
                <div class="w-12 h-12 mx-auto rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
                <h3 class="text-sm font-black text-slate-800 dark:text-white">Menghubungkan ke Server Cloud &amp; Kurir...</h3>
                <p class="text-xs text-slate-400">Mengecek nomor tracking "${escapeHtml(cleanId)}" pada server database &amp; armada pengantar.</p>
            </div>`;

            // 2. Jika input adalah Resi ArjuGo (ARJ-xxxx), cari langsung ke backend ArjuGo
            if (cleanId.startsWith('ARJ-')) {
                try {
                    const arjData = await fetchArjuGoTracking(cleanId);
                    if (arjData && arjData.success && arjData.order) {
                        const ao = arjData.order;
                        const onlineOrder = {
                            id: String(ao.orderId || cleanId),
                            trackingNumber: String(ao.orderId || cleanId),
                            kurirId: 'ArjuGo Express',
                            dateDisplay: formatDate(Date.now()),
                            createdAt: Date.now(),
                            customer: {
                                name: String(ao.receiver || 'Pelanggan'),
                                phone: String(ao.receiverPhone || ''),
                                address: String(ao.address || ''),
                                note: String(ao.notes || '')
                            },
                            items: [],
                            itemsSummary: String([ao.itemType, ao.service].filter(Boolean).join(' • ') || 'Paket Pengantaran ArjuGo'),
                            subtotal: Number(ao.codAmount || 0),
                            shippingFee: 0,
                            couponDiscount: 0,
                            total: Number(ao.codAmount || 0),
                            paymentMethod: String(ao.paymentMethod || 'ArjuGo Express'),
                            status: String(ao.status || 'Menunggu Kurir'),
                            courier: ao.courierName ? { name: ao.courierName, phone: ao.courierPhone || '' } : null,
                            courierCoords: (arjData.coords && isFinite(arjData.coords.lat)) ? arjData.coords : null,
                            storeName: String(ao.mitraName || 'Mitra Toko'),
                            podPhoto: ao.podPhoto || null,
                            podTimestamp: ao.podTimestamp || null,
                            notes: String(ao.notes || ''),
                            statusHistory: (arjData.history || []).map(h => ({ status: h.status, at: h.time }))
                        };
                        if (!onlineOrder.statusHistory.length) {
                            onlineOrder.statusHistory.push({ status: onlineOrder.status, at: Date.now() });
                        }
                        try { await dbPut('orders', onlineOrder); } catch (e) {}
                        matchedOrder = onlineOrder;
                    }
                } catch(e) {
                    console.warn('[Lacak] Gagal cari resi ArjuGo online:', e);
                }
            }

            // 3. Jika belum ketemu, cari ke backend resto utama (ArjuMart / Google Apps Script)
            const gasUrl = getGoogleAppsScriptUrl();
            const gasConnected = !!gasUrl;

            if (!matchedOrder && gasUrl) {
                try {
                    const sep = gasUrl.includes('?') ? '&' : '?';
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);
                    const fetchUrl = `${gasUrl}${sep}action=track_order&orderId=${encodeURIComponent(cleanId)}&query=${encodeURIComponent(cleanId)}&_=${Date.now()}`;
                    const res = await fetch(fetchUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const json = await res.json();
                        if (json && json.success && json.data) {
                            const d = json.data;

                            // Jika order memiliki resi ArjuGo, sinkronkan data kurir dari ArjuGo
                            let arjData = null;
                            if (d.trackingNumber && d.trackingNumber.startsWith('ARJ-')) {
                                try {
                                    arjData = await fetchArjuGoTracking(d.trackingNumber);
                                } catch(e) {}
                            }

                            if (!d.courierCoords || !d.courierCoords.lat) {
                                if (arjData && arjData.coords && isFinite(arjData.coords.lat)) {
                                    d.courierCoords = arjData.coords;
                                } else {
                                    const dedicatedCoords = await fetchDedicatedCourierGps(d.trackingNumber || cleanId);
                                    if (dedicatedCoords) {
                                        d.courierCoords = dedicatedCoords;
                                    }
                                }
                            }

                            let onlineStatus = String(d.status || 'Diproses');
                            if (arjData && arjData.order && arjData.order.status && arjData.order.status !== 'Menunggu Kurir') {
                                onlineStatus = arjData.order.status;
                            }

                            const onlineOrder = {
                                id: String(d.orderId || cleanId),
                                dateDisplay: String(d.date || ''),
                                createdAt: Date.now(),
                                customer: {
                                    name: String(d.name || 'Pelanggan'),
                                    phone: String(d.phone || ''),
                                    address: String(d.address || ''),
                                    note: String(d.notes || '')
                                },
                                items: [],
                                itemsSummary: String(d.itemsSummary || ''),
                                subtotal: Number(d.subtotal) || 0,
                                shippingFee: Number(d.shippingFee) || 0,
                                couponDiscount: Number(d.discount) || 0,
                                total: Number(d.total) || 0,
                                paymentMethod: String(d.paymentMethod || 'WhatsApp'),
                                status: onlineStatus,
                                trackingNumber: String(d.trackingNumber || ''),
                                kurirId: String((arjData && arjData.order && arjData.order.courierName) ? 'ArjuGo Express' : (d.kurirId || '')),
                                courier: (arjData && arjData.order && arjData.order.courierName) ? { name: arjData.order.courierName, phone: arjData.order.courierPhone || '' } : (d.courier || null),
                                courierCoords: d.courierCoords || null,
                                storeId: d.storeId || '',
                                storeName: d.storeName || '',
                                storeAddress: d.storeAddress || '',
                                storeColor: d.storeColor || '',
                                podPhoto: (arjData && arjData.order && arjData.order.podPhoto) ? arjData.order.podPhoto : (d.podPhoto || null),
                                podTimestamp: (arjData && arjData.order && arjData.order.podTimestamp) ? arjData.order.podTimestamp : (d.podTimestamp || null),
                                notes: String(d.notes || ''),
                                statusHistory: [{ status: onlineStatus, at: Date.now() }]
                            };

                            if (d.courierCoords && d.courierCoords.lat && d.courierCoords.lng) {
                                try {
                                    localStorage.setItem('majid_courier_gps_' + onlineOrder.id, JSON.stringify(d.courierCoords));
                                    localStorage.setItem('digiarju_courier_gps_' + onlineOrder.id, JSON.stringify(d.courierCoords));
                                    localStorage.setItem('mangan_courier_gps_' + onlineOrder.id, JSON.stringify(d.courierCoords));
                                } catch(e) {}
                            }

                            try { await dbPut('orders', onlineOrder); } catch (e) {}
                            matchedOrder = onlineOrder;
                        }
                    }
                } catch (err) {
                    console.warn('[Lacak] Pelacakan online GAS belum berhasil / offline:', err);
                }
            }

            // 4. Fallback: jika belum ketemu dan belum mencoba ArjuGo, coba query ArjuGo
            if (!matchedOrder && !cleanId.startsWith('ARJ-')) {
                try {
                    const fallbackArju = await fetchArjuGoTracking(cleanId);
                    if (fallbackArju && fallbackArju.success && fallbackArju.order) {
                        const ao = fallbackArju.order;
                        matchedOrder = {
                            id: String(ao.orderId || cleanId),
                            trackingNumber: String(ao.orderId || cleanId),
                            kurirId: 'ArjuGo Express',
                            dateDisplay: formatDate(Date.now()),
                            createdAt: Date.now(),
                            customer: {
                                name: String(ao.receiver || 'Pelanggan'),
                                phone: String(ao.receiverPhone || ''),
                                address: String(ao.address || ''),
                                note: String(ao.notes || '')
                            },
                            items: [],
                            itemsSummary: String([ao.itemType, ao.service].filter(Boolean).join(' • ') || 'Paket Pengantaran ArjuGo'),
                            subtotal: Number(ao.codAmount || 0),
                            shippingFee: 0,
                            couponDiscount: 0,
                            total: Number(ao.codAmount || 0),
                            paymentMethod: String(ao.paymentMethod || 'ArjuGo Express'),
                            status: String(ao.status || 'Menunggu Kurir'),
                            courier: ao.courierName ? { name: ao.courierName, phone: ao.courierPhone || '' } : null,
                            courierCoords: (fallbackArju.coords && isFinite(fallbackArju.coords.lat)) ? fallbackArju.coords : null,
                            storeName: String(ao.mitraName || 'Mitra Toko'),
                            podPhoto: ao.podPhoto || null,
                            podTimestamp: ao.podTimestamp || null,
                            notes: String(ao.notes || ''),
                            statusHistory: (fallbackArju.history || []).map(h => ({ status: h.status, at: h.time }))
                        };
                        try { await dbPut('orders', matchedOrder); } catch (e) {}
                    }
                } catch(e) {}
            }

            if (!matchedOrder) {
                cont.innerHTML = `
                <div class="clay-card p-8 md:p-10 text-center space-y-4">
                    <div class="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-3xl">
                        🔍
                    </div>
                    <h3 class="text-lg font-black text-slate-800 dark:text-white">Pesanan Tidak Ditemukan</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        Data nomor <strong>"${escapeHtml(cleanId)}"</strong> belum tercatat di sistem toko maupun armada ArjuGo.
                    </p>

                    ${!gasConnected ? `
                    <div class="p-3.5 max-w-md mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-left text-xs text-amber-800 dark:text-amber-300 space-y-1.5 border border-amber-300/60 dark:border-amber-800/60">
                        <p class="font-black flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>Backend Server Belum Dihubungkan:</span>
                        </p>
                        <p class="leading-relaxed text-[11px]">
                            ID Deployment backend Google Apps Script belum disetel di Tata Letak Blogger (Widget No. 9) atau URL ArjuGo di penyimpanan perangkat.
                        </p>
                    </div>` : ''}

                    <div class="p-4 max-w-md mx-auto rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-left text-xs text-slate-600 dark:text-slate-300 space-y-2 border border-slate-200/60 dark:border-slate-700/60">
                        <p class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <span>💡</span><span>Tips Pencarian Pelacakan:</span>
                        </p>
                        <ul class="list-disc pl-4 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <li><b>No. Pesanan Toko:</b> Diawali dengan <code>ORD-</code> (contoh: <b>ORD-202610-001</b>).</li>
                            <li><b>No. Resi Kurir ArjuGo:</b> Diawali dengan <code>ARJ-</code> (contoh: <b>ARJ-261008-0001</b>).</li>
                            <li><b>Nomor WhatsApp:</b> Masukkan minimal 8 digit nomor ponsel yang Anda gunakan saat memesan.</li>
                        </ul>
                    </div>
                    <div class="pt-2 flex flex-wrap items-center justify-center gap-3">
                        <button type="button" onclick="document.getElementById('lacak-input-field').focus();" class="px-5 py-2.5 clay-btn text-xs font-bold text-slate-700 dark:text-slate-300">
                            Cari Nomor Lain
                        </button>
                        <a href="https://wa.me/${getSellerWhatsAppNumber()}?text=${encodeURIComponent('Halo Admin, saya ingin menanyakan status pesanan/resi saya: ' + cleanId)}" target="_blank" class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-1.5">
                            <i class="fa-brands fa-whatsapp text-sm"></i>
                            <span>Hubungi CS WhatsApp</span>
                        </a>
                    </div>
                </div>`;
                return;
            }

            renderLacakOrderDetail(matchedOrder);
            startLacakLivePolling(matchedOrder.id);
        } catch (err) {
            console.error('[Lacak] Gagal mengeksekusi pelacakan pesanan:', err);
            cont.innerHTML = `
            <div class="clay-card p-8 md:p-10 text-center space-y-4">
                <div class="w-16 h-16 mx-auto bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center text-3xl">⚠️</div>
                <h3 class="text-base font-black text-slate-800 dark:text-white">Gagal Menghubungkan ke Server</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Tidak dapat menghubungkan ke server pelacakan saat ini. Periksa koneksi internet Anda atau coba beberapa saat lagi.
                </p>
                <div class="pt-2 flex items-center justify-center gap-3">
                    <button type="button" onclick="executeLacakSearch('${escapeHtml(cleanId)}')" class="px-5 py-2.5 clay-btn-primary text-xs font-bold shadow-md">
                        Coba Lagi
                    </button>
                    <a href="https://wa.me/${getSellerWhatsAppNumber()}?text=${encodeURIComponent('Halo Admin, saya kesulitan melacak status pesanan #' + cleanId)}" target="_blank" class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5">
                        <i class="fa-brands fa-whatsapp"></i>
                        <span>Tanya Admin WA</span>
                    </a>
                </div>
            </div>`;
        }
    }

    function renderLacakOrderDetail(order) {
        if (!order) return;
        const cont = document.getElementById('lacak-result-container');
        if (!cont) return;

        try {
            const status = String(order.status || 'Diproses').trim();
            const stBadgeClass = getLacakStatusBadgeClass(status);
            const cust = (typeof order.customer === 'object' && order.customer !== null) ? order.customer : {};
            const custPhone = String(cust.phone || '').trim();
            const custPhoneClean = custPhone.replace(/[^0-9]/g, '');
            const custName = String(cust.name || 'Pelanggan').trim();
            const custAddress = String(cust.address || 'Alamat tidak terlampir').trim();
            const custNote = cust.note ? String(cust.note).trim() : '';

            const isArjuGo = !!((order.trackingNumber && String(order.trackingNumber).startsWith('ARJ-')) || (order.kurirId === 'ArjuGo Express') || String(order.id || '').startsWith('ARJ-'));
            const resiArjuGo = (order.trackingNumber && String(order.trackingNumber).startsWith('ARJ-')) ? String(order.trackingNumber) : (String(order.id || '').startsWith('ARJ-') ? String(order.id) : '');

            let currentStep = 1;
            if (status === 'Dimasak' || status === 'Sedang Dimasak') currentStep = 2;
            else if (status === 'Siap di Counter' || status === 'Siap Diantar' || status === 'Menunggu Kurir') currentStep = 2.5;
            else if (status === 'Dikirim' || status === 'Diantar' || status === 'Dalam Pengantaran') currentStep = 3;
            else if (status === 'Selesai') currentStep = 4;
            else if (status === 'Dibatalkan') currentStep = -1;

            const courierObj = (order.courier && typeof order.courier === 'object') ? order.courier : null;
            const courierName = (courierObj && courierObj.name) ? courierObj.name : (isArjuGo ? (resiArjuGo ? 'Mitra Kurir ArjuGo' : 'ArjuGo Express') : (order.trackingNumber || 'Kurir Toko Resmi'));
            const courierPhoneClean = (courierObj && courierObj.phone) ? String(courierObj.phone).replace(/[^0-9]/g, '') : '';
            const storeName = order.storeName || '';

            let step3Title = isArjuGo ? 'Diantar ArjuGo Express' : 'Dalam Pengantaran';
            let step3Desc = 'Kurir bergerak menuju alamat Anda';
            if (currentStep === 2.5) {
                step3Title = isArjuGo ? 'Menunggu Kurir ArjuGo' : 'Menunggu Kurir';
                step3Desc = isArjuGo ? 'Makanan siap di counter, menunggu kurir ArjuGo menjemput pesanan' : 'Makanan siap di counter, menunggu kurir menjemput pesanan';
            } else if (currentStep === 3) {
                step3Desc = isArjuGo 
                    ? `Kurir ArjuGo (${escapeHtml(String(courierName))}) meluncur ke alamat tujuan`
                    : `Kurir (${escapeHtml(String(courierName))}) meluncur ke alamat tujuan`;
            }

            const stepsDefinition = [
                {
                    num: 1,
                    title: 'Pesanan Diterima',
                    desc: 'Resto menerima tiket pesanan Anda',
                    icon: '📝'
                },
                {
                    num: 2,
                    title: 'Sedang Dimasak',
                    desc: 'Chef dapur meracik makanan segar & hangat',
                    icon: '🍳'
                },
                {
                    num: 3,
                    title: step3Title,
                    desc: step3Desc,
                    icon: '🛵'
                },
                {
                    num: 4,
                    title: 'Pesanan Selesai',
                    desc: 'Makanan telah diserahkan dengan bukti serah terima (POD)',
                    icon: '✨'
                }
            ];

            let stepperHtml = '';
            if (currentStep === -1) {
                stepperHtml = `
                <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center gap-3 text-rose-700 dark:text-rose-400">
                    <span class="text-2xl">❌</span>
                    <div>
                        <h4 class="font-black text-sm">Pesanan Dibatalkan</h4>
                        <p class="text-xs text-rose-600 dark:text-rose-400/80">Pesanan ini telah dibatalkan oleh pihak resto atau atas permintaan pembeli.</p>
                    </div>
                </div>`;
            } else {
                stepperHtml = `
                <div class="relative py-2">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        ${stepsDefinition.map((s) => {
                            const isDone = (currentStep === 2.5 && s.num <= 2) || (s.num < Math.floor(currentStep));
                            const isCurrent = (currentStep === 2.5 && s.num === 3) || (s.num === currentStep);
                            let stateBox = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700';
                            let stateText = 'text-slate-400';
                            let stateBadge = '';

                            if (isDone) {
                                stateBox = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 dark:border-emerald-700';
                                stateText = 'text-slate-800 dark:text-white font-black';
                                stateBadge = '<span class="text-[10px] text-emerald-600 font-bold">✓ Selesai</span>';
                            } else if (isCurrent) {
                                if (currentStep === 2.5) {
                                    stateBox = isArjuGo
                                        ? 'bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500 text-violet-600 ring-2 ring-violet-500/30'
                                        : 'bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border-teal-500 text-teal-600 ring-2 ring-teal-500/30';
                                    stateText = isArjuGo ? 'text-violet-600 dark:text-violet-400 font-black' : 'text-teal-600 dark:text-teal-400 font-black';
                                    stateBadge = isArjuGo
                                        ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-violet-600 text-white animate-pulse">Menunggu Kurir ArjuGo</span>'
                                        : '<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-teal-600 text-white animate-pulse">Siap Di Counter</span>';
                                } else {
                                    stateBox = 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500 text-purple-600 ring-2 ring-purple-500/30';
                                    stateText = 'text-purple-600 dark:text-purple-400 font-black';
                                    stateBadge = '<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-600 text-white animate-pulse">Sedang Proses</span>';
                                }
                            }

                            return `
                            <div class="p-3.5 rounded-2xl border ${stateBox} transition-all flex flex-col justify-between">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xl">${s.icon}</span>
                                    ${stateBadge}
                                </div>
                                <div>
                                    <h4 class="text-xs ${stateText} mb-0.5">${s.title}</h4>
                                    <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">${s.desc}</p>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            }

            let itemsHtml = '';
            if (Array.isArray(order.items) && order.items.length > 0) {
                itemsHtml = order.items.map(it => {
                    if (!it) return '';
                    const itName = typeof it === 'object' ? (it.name || 'Menu Resto') : String(it);
                    const itPrice = typeof it === 'object' ? (Number(it.price) || 0) : 0;
                    const itQty = typeof it === 'object' ? (Number(it.qty) || 1) : 1;
                    const itImg = (typeof it === 'object' && it.image) ? it.image : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200';
                    const itVariant = (typeof it === 'object' && (it.size || it.color)) ? `[${[it.size, it.color].filter(Boolean).join(', ')}]` : '';
                    return `
                    <div class="flex items-center justify-between py-2 border-b border-dashed border-slate-200/60 dark:border-slate-700/60 text-xs">
                        <div class="flex items-center gap-2.5">
                            <img src="${itImg}" class="w-9 h-9 rounded-xl object-cover flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200';" />
                            <div>
                                <p class="font-black text-slate-800 dark:text-white leading-tight">${escapeHtml(itName)}</p>
                                <span class="text-[11px] text-slate-400">${itQty}x @ ${formatRupiah(itPrice)} ${escapeHtml(itVariant)}</span>
                            </div>
                        </div>
                        <span class="font-black font-mono text-slate-800 dark:text-white">${formatRupiah(itQty * itPrice)}</span>
                    </div>`;
                }).join('');
            } else if (order.itemsSummary) {
                const summaryStr = String(order.itemsSummary || '');
                const rawParts = summaryStr.split(/;\s*|\n+/).filter(Boolean);
                itemsHtml = rawParts.map(p => `
                    <div class="py-1.5 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800">
                        <span class="font-medium">${escapeHtml(p)}</span>
                    </div>
                `).join('');
            } else {
                itemsHtml = '<p class="text-xs text-slate-400 italic py-2">Rincian menu tidak terlampir</p>';
            }

            const cleanOrderId = escapeHtml(String(order.id || ''));
            const dateStr = order.dateDisplay || formatDate(order.createdAt || Date.now());
            const paymentStr = escapeHtml(String(order.paymentMethod || 'WhatsApp'));
            const podData = parseOrderPodData(order);

            cont.innerHTML = `
            <div class="space-y-6">
                <div class="clay-card p-6 space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <div class="flex items-center gap-2">
                                <h2 class="font-mono text-lg font-black text-slate-800 dark:text-white">#${cleanOrderId}</h2>
                                <button type="button" onclick="navigator.clipboard.writeText('${cleanOrderId}'); showToast('No. Pesanan disalin!', '#10b981');" class="text-slate-400 hover:text-purple-600 text-xs" title="Salin No. Pesanan">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                                ${storeName ? `
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 inline-flex items-center gap-1">
                                    <i class="fa-solid fa-store text-[9px]"></i>
                                    <span>${escapeHtml(storeName)}</span>
                                </span>` : ''}
                            </div>
                            <p class="text-xs text-slate-400 mt-0.5">${escapeHtml(dateStr)} &bull; Metode: <strong class="text-slate-600 dark:text-slate-300 font-bold">${paymentStr}</strong></p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="refreshLacakOrderStatus('${cleanOrderId}')" id="btn-refresh-lacak" class="px-3 py-1.5 rounded-xl clay-btn text-xs font-bold text-purple-600 dark:text-purple-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm" title="Periksa pembaruan status terbaru dari dapur & kurir">
                                <i class="fa-solid fa-arrows-rotate text-[11px]" id="icon-refresh-lacak"></i>
                                <span>Perbarui Status</span>
                            </button>
                            <span class="px-3 py-1 rounded-full text-xs font-black ${stBadgeClass}">
                                ${escapeHtml(status)}
                            </span>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <span>Status Progres Pesanan</span>
                        </h3>
                        ${stepperHtml}
                    </div>
                </div>

                ${(isArjuGo && resiArjuGo) ? `
                <div class="clay-card p-4 sm:p-5 bg-gradient-to-r from-violet-50/80 via-purple-50/60 to-indigo-50/70 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-indigo-950/30 border-2 border-violet-500/30 space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md shadow-violet-500/30 flex-shrink-0">
                                A
                            </div>
                            <div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-black text-slate-800 dark:text-white text-sm">Pengantaran ArjuGo Express</span>
                                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white shadow-sm">
                                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        <span>Radar Live</span>
                                    </span>
                                </div>
                                <div class="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    <span>No. Resi:</span>
                                    <strong class="font-mono text-violet-600 dark:text-violet-400 font-black text-sm">${escapeHtml(resiArjuGo)}</strong>
                                    <button type="button" onclick="navigator.clipboard.writeText('${escapeHtml(resiArjuGo)}'); showToast('No. Resi ArjuGo disalin!', '#10b981');" class="text-slate-400 hover:text-violet-600 transition-colors" title="Salin No. Resi">
                                        <i class="fa-regular fa-copy text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <a href="ArjuGo/track.html?id=${encodeURIComponent(resiArjuGo)}" target="_blank" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-md shadow-violet-500/30 transition-all group">
                                <span>🛵 Buka Live Radar GPS ArjuGo</span>
                                <i class="fa-solid fa-arrow-up-right-from-square text-[10px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                            </a>
                        </div>
                    </div>
                    <div class="pt-2 border-t border-violet-200/60 dark:border-violet-800/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
                        <span class="flex items-center gap-1.5">
                            <span class="text-violet-600 dark:text-violet-400 font-bold">ℹ️ Info Pengantaran:</span>
                            <span>${currentStep === 2.5 ? 'Resto telah memanggil armada ArjuGo. Kurir sedang ditugaskan menuju counter.' : (currentStep === 3 ? 'Kurir ArjuGo sedang dalam perjalanan ke alamat tujuan Anda.' : (currentStep === 4 ? 'Paket kuliner telah sukses diserahkan ke tangan penerima.' : 'Pesanan sedang dipersiapkan pihak resto.'))}</span>
                        </span>
                        ${courierObj && courierObj.name ? `<span class="hidden sm:inline font-bold text-slate-700 dark:text-slate-200">Kurir: ${escapeHtml(courierObj.name)}</span>` : ''}
                    </div>
                </div>` : ''}

                ${status !== 'Dibatalkan' ? `
                <div class="clay-card p-6 space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h4 class="font-black text-slate-800 dark:text-white text-xs flex items-center gap-2">
                                <span class="w-2.5 h-2.5 rounded-full ${status === 'Dikirim' || status === 'Diantar' || status === 'Dalam Pengantaran' ? 'bg-blue-500 animate-ping' : (status === 'Selesai' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse')}"></span>
                                <span>Live GPS Tracking Kurir</span>
                            </h4>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">Pantau perjalanan armada pengantar menuju alamat Anda secara akurat</p>
                        </div>
                        <span id="live-gps-eta-text" class="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                            🛵 Menghubungkan GPS Kurir...
                        </span>
                    </div>

                    <div id="order-live-gps-map" style="height: 270px; width: 100%; border-radius: 1rem;" class="border border-slate-200 dark:border-slate-800 shadow-inner"></div>

                    <div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">🛵</span>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="font-black text-slate-800 dark:text-white text-sm">${escapeHtml(String(courierName))}</span>
                                    <span class="text-[10px] px-2 py-0.5 rounded-full ${isArjuGo ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700' : 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60'} font-bold border">
                                        ${isArjuGo ? '🛵 Mitra Kurir ArjuGo' : 'Armada Resmi'}
                                    </span>
                                </div>
                                <span class="text-[11px] text-slate-400">
                                    ${storeName ? `Dapur Pengirim: <strong class="text-slate-600 dark:text-slate-300">${escapeHtml(storeName)}</strong> &bull; ` : ''}
                                    Status: <strong class="text-purple-600 dark:text-purple-400 font-bold">${escapeHtml(status)}</strong>
                                </span>
                            </div>
                        </div>

                        ${courierPhoneClean ? `
                        <div class="flex items-center gap-2">
                            <a href="https://wa.me/${courierPhoneClean}?text=${encodeURIComponent('Halo Mas ' + courierName + ', saya pelanggan pemesan nomor #' + cleanOrderId + ', ingin konfirmasi pengantaran.')}" target="_blank" class="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition-all">
                                <i class="fa-brands fa-whatsapp text-sm"></i>
                                <span>Hubungi Kurir WA</span>
                            </a>
                        </div>` : ''}
                    </div>
                </div>` : ''}

                ${(status === 'Selesai' || (podData && (podData.hasPhoto || podData.timestamp))) ? `
                <div class="clay-card p-5 space-y-3.5 border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                    <div class="flex items-center justify-between pb-2 border-b border-emerald-200/50 dark:border-emerald-800/50">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm shadow-sm font-black">
                                <i class="fa-solid fa-camera"></i>
                            </div>
                            <div>
                                <h3 class="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Bukti Pengantaran (POD)</h3>
                                <p class="text-[10px] text-slate-400">Verifikasi serah terima paket hidangan ke pelanggan</p>
                            </div>
                        </div>
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 inline-flex items-center gap-1">
                            <i class="fa-solid fa-circle-check text-[9px]"></i>
                            <span>✓ Terverifikasi Kurir</span>
                        </span>
                    </div>

                    ${podData && podData.hasPhoto ? `
                    <div class="flex flex-col sm:flex-row items-center gap-4 pt-1">
                        <div class="relative group cursor-pointer flex-shrink-0" onclick="openPodLightbox('${escapeHtml(podData.photoUrl)}', 'Bukti Pengantaran #${cleanOrderId}', 'Waktu: ${escapeHtml(podData.timestamp || dateStr)} &bull; ${escapeHtml(podData.store || storeName || 'Dapur Resto')}', '${escapeHtml(podData.originalUrl || '')}')">
                            <img src="${escapeHtml(podData.photoUrl)}" class="w-32 h-32 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-400/50 shadow-md group-hover:scale-105 group-hover:shadow-lg transition-all" alt="Foto Bukti Serah Terima" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200';" />
                            <div class="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                <i class="fa-solid fa-magnifying-glass-plus"></i>
                                <span>Perbesar</span>
                            </div>
                        </div>
                        <div class="space-y-1.5 text-xs text-left w-full">
                            <div class="flex items-center gap-2">
                                <span class="text-slate-400 text-[11px]">Waktu Serah Terima:</span>
                                <strong class="text-slate-800 dark:text-white font-mono">${escapeHtml(podData.timestamp || dateStr)}</strong>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-slate-400 text-[11px]">Armada Pengantar:</span>
                                <strong class="text-slate-800 dark:text-white">${escapeHtml(courierName)}</strong>
                            </div>
                            ${(podData.store || storeName) ? `
                            <div class="flex items-center gap-2">
                                <span class="text-slate-400 text-[11px]">Dapur Toko / Hub:</span>
                                <span class="text-purple-600 dark:text-purple-400 font-bold">${escapeHtml(podData.store || storeName)}</span>
                            </div>` : ''}
                            <div class="pt-1.5 flex items-center gap-2">
                                <button type="button" onclick="openPodLightbox('${escapeHtml(podData.photoUrl)}', 'Bukti Pengantaran #${cleanOrderId}', 'Waktu: ${escapeHtml(podData.timestamp || dateStr)} &bull; ${escapeHtml(podData.store || storeName || 'Dapur Resto')}', '${escapeHtml(podData.originalUrl || '')}')" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-sm transition-all">
                                    <i class="fa-solid fa-camera"></i>
                                    <span>Lihat Foto Bukti Lengkap</span>
                                </button>
                            </div>
                        </div>
                    </div>` : `
                    <div class="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                        <span class="text-2xl">🤝</span>
                        <div>
                            <p class="font-bold">Pesanan telah diserahkan langsung ke tangan pemesan.</p>
                            <p class="text-[11px] text-emerald-600 dark:text-emerald-400">Pengantaran tuntas oleh armada kurir ${escapeHtml(courierName)} pada ${escapeHtml(podData ? (podData.timestamp || dateStr) : dateStr)}.</p>
                        </div>
                    </div>`}
                </div>` : ''}

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="clay-card p-5 space-y-3">
                        <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <i class="fa-solid fa-location-dot text-purple-600"></i>
                            <span>Tujuan Pengantaran</span>
                        </h3>
                        <div class="space-y-2 text-xs">
                            <div>
                                <span class="text-slate-400 block text-[10px]">Nama Pemesan:</span>
                                <strong class="text-slate-800 dark:text-white font-bold text-sm">${escapeHtml(custName)}</strong>
                            </div>
                            <div>
                                <span class="text-slate-400 block text-[10px]">Kontak WhatsApp:</span>
                                <a href="https://wa.me/${custPhoneClean}" target="_blank" class="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                                    <i class="fa-brands fa-whatsapp"></i> ${escapeHtml(custPhone || '-')}
                                </a>
                            </div>
                            <div>
                                <span class="text-slate-400 block text-[10px]">Alamat Lengkap:</span>
                                <p class="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">${escapeHtml(custAddress)}</p>
                            </div>
                            ${custNote ? `
                            <div>
                                <span class="text-slate-400 block text-[10px]">Catatan Khusus:</span>
                                <p class="italic text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/50 text-[11px]">${escapeHtml(custNote)}</p>
                            </div>` : ''}
                        </div>
                    </div>

                    <div class="clay-card p-5 space-y-3 flex flex-col justify-between">
                        <div>
                            <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                <i class="fa-solid fa-utensils text-purple-600"></i>
                                <span>Menu yang Dipesan</span>
                            </h3>
                            <div class="max-h-44 overflow-y-auto custom-scroll pr-1 space-y-1">
                                ${itemsHtml}
                            </div>
                        </div>

                        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                            <div class="flex justify-between text-slate-500"><span>Subtotal:</span><span class="font-mono font-bold">${formatRupiah(order.subtotal || 0)}</span></div>
                            <div class="flex justify-between text-slate-500"><span>Ongkos Kirim:</span><span class="font-mono font-bold">${formatRupiah(order.shippingFee || 0)}</span></div>
                            ${order.couponDiscount ? `<div class="flex justify-between text-emerald-600 font-bold"><span>Diskon Kupon:</span><span class="font-mono">-${formatRupiah(order.couponDiscount)}</span></div>` : ''}
                            <div class="flex justify-between items-center text-sm font-black text-slate-800 dark:text-white pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                                <span>Total Pembayaran:</span>
                                <span class="font-mono text-purple-600 dark:text-purple-400 text-base">${formatRupiah(order.total || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <a href="https://wa.me/${getSellerWhatsAppNumber()}?text=${encodeURIComponent('Halo Admin resto, saya ingin konfirmasi/tanya status pesanan saya *#' + cleanOrderId + '* atas nama ' + custName)}" target="_blank" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors">
                        <i class="fa-brands fa-whatsapp text-sm"></i>
                        <span>Chat Toko via WA</span>
                    </a>
                    <button type="button" onclick="navigate('/home')" class="px-5 py-2.5 clay-btn-primary font-bold text-xs shadow-md">
                        <span>Pesan Menu Baru</span>
                    </button>
                </div>
            </div>`;

            if (status !== 'Dibatalkan' && document.getElementById('order-live-gps-map')) {
                setTimeout(() => {
                    try {
                        initOrderLiveGPSTracking(order);
                    } catch (mapErr) {
                        console.warn('[Lacak] Gagal inisialisasi peta GPS:', mapErr);
                    }
                }, 100);
            }
        } catch (err) {
            console.error('[Lacak] Gagal merender rincian pesanan:', err);
            cont.innerHTML = `
            <div class="clay-card p-8 md:p-10 text-center space-y-4">
                <div class="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-3xl">⚠️</div>
                <h3 class="text-base font-black text-slate-800 dark:text-white">Terjadi Kesalahan Menampilkan Pesanan</h3>
                <p class="text-xs text-slate-400 max-w-sm mx-auto">Format data pesanan tidak sesuai atau terjadi kendala peramban.</p>
                <button type="button" onclick="executeLacakSearch('${escapeHtml(String(order.id || ''))}')" class="px-5 py-2.5 clay-btn-primary text-xs font-bold shadow-md">Muat Ulang Pesanan</button>
            </div>`;
        }
    }

    async function renderProfile() {
        const profile = await dbGet('profile', 'me');
        const orderCount = (await dbGetAll('orders')).length;
        const addressOptions = getAddressOptions();
        const storageInfo = await getIndexedDBStorageInfo();
        if (profile?.mapsUrl && !currentActiveMapsPin) {
            currentActiveMapsPin = { url: profile.mapsUrl, lat: 0, lng: 0, displayAddress: '' };
        }
        const container = document.getElementById('page-content');
        container.innerHTML = `
        <section class="page-fade space-y-6 max-w-2xl mx-auto">
            <div class="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
                <button onclick="if(window.history.length > 1){window.history.back();}else{navigate('/home');}" type="button" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 clay-btn hover:text-purple-600 dark:hover:text-purple-400 hover:-translate-x-0.5 transition-all shadow-sm group">
                    <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    <span>Kembali</span>
                </button>
                <h1 class="text-xl sm:text-2xl md:text-3xl font-heading font-black text-slate-800 dark:text-white">Akun Saya</h1>
            </div>

            <div class="clay-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-black text-slate-800 dark:text-white">Data Diri</h3>
                    <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200/60 dark:border-emerald-800/60">
                        <i class="fa-solid fa-shield-halved text-[9px]"></i> Verifikasi Akun Pembeli
                    </span>
                </div>
                <form onsubmit="saveProfile(event)" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                            <span>Nama Lengkap <span class="text-rose-500 font-extrabold">*</span></span>
                            <span class="text-[10px] text-slate-400 font-normal">Identitas penerima pesanan</span>
                        </label>
                        <input id="pf-name" value="${escapeHtml(profile?.name || '')}" placeholder="Contoh: Budi Santoso" class="w-full px-5 py-3.5 clay-input text-sm font-bold" required>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                            <span>Nomor HP / WhatsApp <span class="text-rose-500 font-extrabold">* (Wajib Diisi)</span></span>
                            <span class="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Kontak Pengantaran</span>
                        </label>
                        <input id="pf-phone" type="tel" value="${escapeHtml(profile?.phone || '')}" placeholder="Contoh: 081234567890" class="w-full px-5 py-3.5 clay-input text-sm font-mono font-bold" required>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                            Nomor WhatsApp aktif digunakan oleh kurir resto untuk konfirmasi pengantaran dan notifikasi status pesanan Anda.
                        </p>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                            <span>Pilih Area / Wilayah Alamat:</span>
                            <span class="text-[10px] text-slate-400 font-normal">Opsi cepat wilayah</span>
                        </label>
                        <select id="pf-address-dropdown" onchange="handleAddressDropdownChange(this, 'pf-address')" class="w-full px-5 py-3.5 clay-select text-sm font-bold">
                            <option value="">-- Pilih Wilayah / Area Alamat --</option>
                            ${addressOptions.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
                        </select>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-truck-fast text-purple-600"></i>
                                <span>Alamat Pengantaran Utama (Lokasi Antar)</span>
                            </label>
                            <div class="flex items-center gap-1.5">
                                <button type="button" onclick="detectGPSLocation('pf-address')" class="px-2.5 py-1 clay-btn text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:text-orange-700 transition-colors" title="Deteksi titik lokasi dari GPS">
                                    <svg class="svg-icon w-3 h-3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="12 8 8 12 12 16 12 8"></polygon></svg>
                                    <span>GPS</span>
                                </button>
                                <button type="button" onclick="openMapsPickerModal('pf-address')" class="px-2.5 py-1 clay-btn text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:text-emerald-700 transition-colors" title="Buka peta untuk menentukan titik alamat">
                                    <svg class="svg-icon w-3 h-3" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    <span>Pilih di Maps</span>
                                </button>
                            </div>
                        </div>
                        <textarea id="pf-address" rows="3" placeholder="Masukkan alamat lengkap pengantaran (nama jalan, nomor rumah, RT/RW, patokan)" class="w-full px-5 py-3.5 clay-textarea text-sm">${escapeHtml(profile?.address || currentActiveMapsPin?.displayAddress || '')}</textarea>
                        
                        <div id="pf-maps-pin-display" class="${(profile?.mapsUrl || currentActiveMapsPin?.url) ? '' : 'hidden'} mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 text-xs flex items-center justify-between gap-2">
                            <span class="truncate flex items-center gap-1.5"><span class="flex-shrink-0">📍</span> <span id="pf-maps-pin-text">${(profile?.mapsUrl || currentActiveMapsPin?.url) ? `<a href="${profile?.mapsUrl || currentActiveMapsPin?.url}" target="_blank" class="underline font-bold">Titik Google Maps Terpasang</a>` : ''}</span></span>
                            <button type="button" onclick="clearMapsPin('pf-address')" class="text-rose-500 hover:text-rose-700 font-bold text-[11px] flex-shrink-0">Hapus Pin</button>
                        </div>
                        <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                            <i class="fa-solid fa-circle-check text-emerald-500"></i> Alamat ini otomatis tersinkronisasi dengan opsi Lokasi Antar di Beranda toko.
                        </p>
                    </div>

                    <button type="submit" class="w-full px-6 py-3.5 clay-btn-primary font-black text-sm shadow-md">Simpan Data Diri</button>
                </form>
            </div>

            <div class="clay-card p-2">
                <a href="/p/orders.html" class="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors">
                    <div class="flex items-center gap-4">
                        <div class="w-11 h-11 clay-btn flex items-center justify-center text-purple-600"><svg class="svg-icon w-5 h-5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path><rect x="9" y="3" width="6" height="4" rx="1"></rect></svg></div>
                        <span class="font-bold text-sm text-slate-700 dark:text-slate-200">Pesanan Saya</span>
                    </div>
                    <span class="flex items-center gap-2 text-slate-400"><span class="text-xs font-black">${orderCount}</span><svg class="svg-icon w-4 h-4" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></span>
                </a>
                <button onclick="toggleDarkMode()" class="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors">
                    <div class="flex items-center gap-4">
                        <div class="w-11 h-11 clay-btn flex items-center justify-center text-purple-600"><svg class="svg-icon w-5 h-5" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></div>
                        <span class="font-bold text-sm text-slate-700 dark:text-slate-200">Mode Gelap</span>
                    </div>
                    <svg class="svg-icon w-4 h-4 text-slate-400" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>

            <div class="clay-card p-6 space-y-5">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg shadow-sm">
                            <i class="fa-solid fa-hard-drive"></i>
                        </div>
                        <div>
                            <h3 class="font-black text-slate-800 dark:text-white text-sm">Kapasitas Penyimpanan</h3>
                            <p class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Penyimpanan basis data offline di browser perangkat</p>
                        </div>
                    </div>
                    <span class="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60 shadow-sm flex items-center gap-1.5 flex-shrink-0">
                        <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span>${storageInfo.percentUsed}% Terpakai</span>
                    </span>
                </div>

                <div class="space-y-2 p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div class="flex justify-between items-center text-xs">
                        <span class="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <span class="text-slate-400">Ukuran Terpakai:</span>
                            <span class="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">${formatBytes(storageInfo.usageBytes)}</span>
                        </span>
                        <span class="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span class="text-slate-400">Total Kuota:</span>
                            <span class="text-slate-700 dark:text-slate-200 font-extrabold">${storageInfo.quotaBytes > 0 ? formatBytes(storageInfo.quotaBytes) : 'Fleksibel'}</span>
                        </span>
                    </div>

                    <div class="w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-full h-3.5 overflow-hidden p-0.5 shadow-inner">
                        <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" style="width: ${Math.max(1, Math.min(100, parseFloat(storageInfo.percentUsed) || 1))}%"></div>
                    </div>

                    <div class="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500">
                        <span>Estimasi Data Riil: <b>${formatBytes(storageInfo.calculatedDataBytes)}</b></span>
                        <span>Database: <b>digiarju_store_db (v4)</b></span>
                    </div>
                </div>

                <div>
                    <span class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">Rincian Data Tersimpan:</span>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div class="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-center">
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Produk / Menu</div>
                            <div class="text-base font-black text-slate-800 dark:text-white mt-0.5">${storageInfo.counts.products} <span class="text-[10px] font-medium text-slate-400">item</span></div>
                        </div>
                        <div class="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-center">
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pesanan</div>
                            <div class="text-base font-black text-slate-800 dark:text-white mt-0.5">${storageInfo.counts.orders} <span class="text-[10px] font-medium text-slate-400">order</span></div>
                        </div>
                        <div class="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-center">
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Keranjang</div>
                            <div class="text-base font-black text-slate-800 dark:text-white mt-0.5">${storageInfo.counts.cart} <span class="text-[10px] font-medium text-slate-400">item</span></div>
                        </div>
                        <div class="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-center">
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kategori &amp; Kupon</div>
                            <div class="text-base font-black text-slate-800 dark:text-white mt-0.5">${storageInfo.counts.categories + storageInfo.counts.coupons} <span class="text-[10px] font-medium text-slate-400">data</span></div>
                        </div>
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
                    <div class="flex items-center justify-between">
                        <label class="block text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                            <i class="fa-solid fa-broom text-amber-500"></i>
                            <span>Penghapusan Penyimpanan Data:</span>
                        </label>
                        <span class="text-[10px] text-slate-400 font-normal">Kelola ruang memori</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button type="button" onclick="handleClearProductsCache()" class="clay-btn text-xs font-bold py-2.5 px-3 flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm">
                            <i class="fa-solid fa-rotate text-xs text-indigo-500"></i>
                            <span>Bersihkan Cache Menu</span>
                        </button>
                        <button type="button" onclick="handleClearCartOnly()" class="clay-btn text-xs font-bold py-2.5 px-3 flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-all shadow-sm">
                            <i class="fa-solid fa-cart-arrow-down text-xs text-amber-500"></i>
                            <span>Kosongkan Keranjang</span>
                        </button>
                        <button type="button" onclick="handleClearOrdersLocal()" class="clay-btn text-xs font-bold py-2.5 px-3 flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm">
                            <i class="fa-solid fa-file-invoice text-xs text-rose-500"></i>
                            <span>Hapus Pesanan Lokal</span>
                        </button>
                        <button type="button" onclick="confirmResetStore()" class="clay-btn text-xs font-bold py-2.5 px-3 flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50 transition-all shadow-sm">
                            <i class="fa-solid fa-trash-can text-xs text-rose-600"></i>
                            <span>Reset Total Penyimpanan</span>
                        </button>
                    </div>

                    <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-amber-500/5 dark:bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                        <i class="fa-solid fa-circle-info text-amber-500 mr-1"></i> <strong>Catatan:</strong> Menghapus cache menu akan memperbarui daftar menu saat Anda kembali ke beranda. Opsi "Reset Total Penyimpanan" akan mengosongkan seluruh database toko di browser ini.
                    </p>
                </div>
            </div>
        </section>`;
    }
    async function saveProfile(e) {
        e.preventDefault();
        const name = document.getElementById('pf-name').value.trim();
        const phone = document.getElementById('pf-phone').value.trim();
        const address = document.getElementById('pf-address').value.trim();

        if (!name) {
            showToast('Nama Lengkap wajib diisi!', '#ef4444');
            document.getElementById('pf-name').focus();
            return;
        }

        if (!phone) {
            showToast('Nomor HP / WhatsApp wajib diisi untuk verifikasi!', '#ef4444');
            document.getElementById('pf-phone').focus();
            return;
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 9 || cleanPhone.length > 15) {
            showToast('Nomor HP tidak valid! Masukkan minimal 9-15 digit nomor HP aktif.', '#ef4444');
            document.getElementById('pf-phone').focus();
            return;
        }

        const currentProfile = await dbGet('profile', 'me') || {};
        const profile = {
            id: 'me',
            name: name,
            phone: phone,
            address: address,
            mapsUrl: (currentActiveMapsPin && currentActiveMapsPin.url) ? currentActiveMapsPin.url : (currentProfile.mapsUrl || ''),
            coords: (currentActiveMapsPin && currentActiveMapsPin.lat) ? { lat: currentActiveMapsPin.lat, lng: currentActiveMapsPin.lng } : (currentProfile.coords || null)
        };
        await dbPut('profile', profile);

        if (!currentActiveMapsPin) {
            currentActiveMapsPin = { lat: RESTAURANT_COORDS.lat, lng: RESTAURANT_COORDS.lng, url: profile.mapsUrl || '', displayAddress: address };
        } else {
            currentActiveMapsPin.displayAddress = address;
            if (profile.mapsUrl) currentActiveMapsPin.url = profile.mapsUrl;
        }
        try {
            localStorage.setItem('dg_customer_location', JSON.stringify(currentActiveMapsPin));
        } catch (err) {}
        updateHeaderDeliveryAddress(address, currentActiveMapsPin.lat, currentActiveMapsPin.lng);

        showToast('Profil & Lokasi Pengantaran berhasil disimpan!', '#10b981');
    }
    function confirmResetStore() {
        if (window.confirm('Reset total seluruh data Penyimpanan (produk, kategori, keranjang, pesanan, kupon)? Tindakan ini akan mengosongkan seluruh basis data lokal perangkat ini dan tidak dapat dibatalkan.')) {
            resetStoreData();
        }
    }


    window.__orderLiveGpsMap = null;
    window.__orderCourierMarker = null;
    window.__orderCourierAnimInterval = null;

    function initOrderLiveGPSTracking(order) {
        const mapContainer = document.getElementById('order-live-gps-map');
        if (!mapContainer) return;

        if (typeof L === 'undefined') {
            setTimeout(() => initOrderLiveGPSTracking(order), 300);
            return;
        }

        if (window.__orderLiveGpsMap) {
            try { window.__orderLiveGpsMap.remove(); } catch(e) {}
            window.__orderLiveGpsMap = null;
        }
        if (window.__orderCourierAnimInterval) {
            clearInterval(window.__orderCourierAnimInterval);
            window.__orderCourierAnimInterval = null;
        }

        const status = order.status || 'Diproses';
        const branches = getRestaurantBranches();
        let branch = (branches && branches.find(b => b.id === order.branchId)) || (branches && branches[0]) || { lat: -6.2088, lng: 106.8456, name: 'Dapur Digiarju Pusat', address: 'Dapur Pusat' };
        const restoLat = branch.lat;
        const restoLng = branch.lng;

        let custLat = restoLat - 0.015;
        let custLng = restoLng + 0.018;

        if (order.customer && order.customer.mapsUrl) {
            const urlMatch = order.customer.mapsUrl.match(/q=([-\d.]+),([-\d.]+)/);
            if (urlMatch) {
                custLat = parseFloat(urlMatch[1]) || custLat;
                custLng = parseFloat(urlMatch[2]) || custLng;
            }
        }

        const storedCourierPos = localStorage.getItem('majid_courier_gps_' + order.id) || localStorage.getItem('digiarju_courier_gps_' + order.id) || localStorage.getItem('mangan_courier_gps_' + order.id);
        let courierLat, courierLng;

        if (order.courierCoords && order.courierCoords.lat && order.courierCoords.lng) {
            courierLat = parseFloat(order.courierCoords.lat);
            courierLng = parseFloat(order.courierCoords.lng);
        } else if (storedCourierPos) {
            try {
                const pos = JSON.parse(storedCourierPos);
                courierLat = parseFloat(pos.lat);
                courierLng = parseFloat(pos.lng);
            } catch (e) {}
        }

        if (!courierLat || !courierLng) {
            if (status === 'Diproses' || status === 'Dimasak' || status === 'Sedang Dimasak' || status === 'Siap di Counter' || status === 'Siap Diantar' || status === 'Menunggu Kurir') {
                courierLat = restoLat;
                courierLng = restoLng;
            } else if (status === 'Selesai') {
                courierLat = custLat;
                courierLng = custLng;
            } else {
                courierLat = restoLat + (custLat - restoLat) * 0.45;
                courierLng = restoLng + (custLng - restoLng) * 0.45;
            }
        }

        const map = L.map('order-live-gps-map').setView([courierLat, courierLng], 14);
        window.__orderLiveGpsMap = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap Digiarju'
        }).addTo(map);

        const restoIcon = L.divIcon({
            html: '<div style="background: linear-gradient(135deg, #7c3aed, #6366f1); color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 4px 12px rgba(124,58,237,0.45); border:2px solid #fff;">&#127978;</div>',
            className: '',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });

        const custIcon = L.divIcon({
            html: '<div style="background:#10b981; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 4px 10px rgba(16,185,129,0.4); border:2px solid #fff;">&#127968;</div>',
            className: '',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });

        const courierIcon = L.divIcon({
            html: '<div style="background:#2563eb; color:#fff; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 4px 12px rgba(37,99,235,0.5); border:3px solid #fff;">&#128757;</div>',
            className: '',
            iconSize: [38, 38],
            iconAnchor: [19, 19]
        });

        const restoTitle = order.storeName || branch.name || 'Dapur Resto Digiarju';
        const restoAddress = order.storeAddress || branch.address || 'Titik Dapur Pengirim';
        L.marker([restoLat, restoLng], { icon: restoIcon }).addTo(map)
            .bindPopup(`<b>${escapeHtml(restoTitle)}</b><br><small>${escapeHtml(restoAddress)}</small>`);

        L.marker([custLat, custLng], { icon: custIcon }).addTo(map)
            .bindPopup(`<b>Lokasi Pengantaran</b><br><small>${escapeHtml(order.customer ? order.customer.name : 'Pelanggan')}</small>`);

        const isArjuGo = !!((order.trackingNumber && String(order.trackingNumber).startsWith('ARJ-')) || (order.kurirId === 'ArjuGo Express') || String(order.id || '').startsWith('ARJ-'));
        const courierObj = (order.courier && typeof order.courier === 'object') ? order.courier : null;
        const courierName = (courierObj && courierObj.name) ? courierObj.name : (isArjuGo ? (order.trackingNumber ? `Mitra Kurir ArjuGo (${order.trackingNumber})` : 'ArjuGo Express') : (order.trackingNumber || 'Kurir Toko Resmi'));

        let courierPopupText = isArjuGo
            ? `<b>🛵 Kurir ArjuGo Express (${escapeHtml(courierName)})</b><br><small>Sedang mengantar pesanan ke alamat tujuan</small>`
            : `<b>Kurir Resto (${escapeHtml(courierName)})</b><br><small>Sedang mengantar pesanan ke alamat tujuan</small>`;
        if (status === 'Diproses' || status === 'Dimasak' || status === 'Sedang Dimasak') {
            courierPopupText = isArjuGo ? `<b>🛵 Kurir ArjuGo</b><br><small>Menunggu makanan selesai dimasak di counter</small>` : `<b>Kurir Resto</b><br><small>Standby di dapur, menunggu makanan selesai dimasak</small>`;
        } else if (status === 'Siap di Counter' || status === 'Siap Diantar' || status === 'Menunggu Kurir') {
            courierPopupText = isArjuGo ? `<b>🛵 Kurir ArjuGo</b><br><small>Menuju counter resto untuk menjemput pesanan</small>` : `<b>Kurir Resto</b><br><small>Makanan siap di counter, menunggu penjemputan armada</small>`;
        } else if (status === 'Selesai') {
            courierPopupText = isArjuGo ? `<b>🛵 Kurir ArjuGo</b><br><small>Tiba di lokasi &amp; serah terima sukses (POD)</small>` : `<b>Kurir Resto</b><br><small>Tiba di lokasi &amp; serah terima tuntas (POD)</small>`;
        }

        const courierMarker = L.marker([courierLat, courierLng], { icon: courierIcon }).addTo(map)
            .bindPopup(courierPopupText);
        window.__orderCourierMarker = courierMarker;

        const routeCoords = [[restoLat, restoLng], [courierLat, courierLng], [custLat, custLng]];
        L.polyline(routeCoords, { color: '#7c3aed', weight: 4, dashArray: '6, 8', opacity: 0.8 }).addTo(map);

        const bounds = L.latLngBounds([[restoLat, restoLng], [custLat, custLng], [courierLat, courierLng]]);
        map.fitBounds(bounds, { padding: [40, 40] });

        const distToCustomer = calculateHaversineKm(courierLat, courierLng, custLat, custLng);
        const estMinutes = Math.max(3, Math.round(distToCustomer * 3.5));
        const etaEl = document.getElementById('live-gps-eta-text');
        if (etaEl) {
            if (status === 'Diproses') {
                etaEl.innerHTML = `📝 Pesanan diterima resto (menunggu antrean dapur)`;
            } else if (status === 'Dimasak' || status === 'Sedang Dimasak') {
                etaEl.innerHTML = `🍳 Sedang dimasak di dapur (${distToCustomer.toFixed(1)} km ke lokasi)`;
            } else if (status === 'Siap di Counter' || status === 'Siap Diantar' || status === 'Menunggu Kurir') {
                etaEl.innerHTML = isArjuGo ? `🛵 Makanan siap di counter, menunggu penjemputan kurir ArjuGo` : `🛵 Makanan siap di counter, menunggu penjemputan kurir`;
            } else if (status === 'Selesai') {
                etaEl.innerHTML = `✨ Makanan telah tiba di alamat tujuan!`;
            } else {
                if (distToCustomer <= 0.25 && (status === 'Dikirim' || status === 'Diantar' || status === 'Dalam Pengantaran') && !window.__orderArrivalChimePlayed) {
                    window.__orderArrivalChimePlayed = true;
                    playCourierArrivalChime();
                    etaEl.innerHTML = `🔔 <b class="text-emerald-600 dark:text-emerald-400">Kurir sudah tiba di depan rumah!</b> (${(distToCustomer * 1000).toFixed(0)}m)`;
                    showToast('🔔 Kurir sudah tiba di depan rumah Anda!', '#10b981');
                } else {
                    etaEl.innerHTML = `🛵 Kurir dalam perjalanan (~${estMinutes} mnt, ${distToCustomer.toFixed(1)} km)`;
                }
            }
        }
    }

    function playCourierArrivalChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.12);
                gain.gain.setValueAtTime(0.25, now + i * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.12);
                osc.stop(now + i * 0.12 + 0.35);
            });
        } catch (e) {}
    }

    function goToHome() {
        navigate('home');
    }

    function parseBloggerProductMeta(rawBody) {
        if (!rawBody) return { price: 0, originalPrice: null, stock: null, badge: null, flashSale: false, sizes: [], colors: [], weight: 250, type: 'makanan', freeShipping: false, discountPercent: 0, variantPrices: {}, coords: null, branchName: '', kitchenName: '', kitchenId: '', kitchenAddress: '' };
        const rawContent = String(rawBody);
        const cleanText = rawContent.replace(/<[^>]*>/g, ' ');

        let price = 0;
        const hargaBracket = cleanText.match(/\[\s*harga\s*:\s*([0-9.]+)\s*\]/i) || cleanText.match(/harga\s*:\s*Rp?\s*([0-9.]+)/i);
        const hargaHtml = rawContent.match(/id=["']product-price["'][^>]*>\s*Rp?\s*([0-9.]+)/i);
        if (hargaBracket) {
            price = parseFloat(hargaBracket[1].replace(/\./g, '')) || 0;
        } else if (hargaHtml) {
            price = parseFloat(hargaHtml[1].replace(/\./g, '')) || 0;
        }

        let originalPrice = null;
        const coretBracket = cleanText.match(/\[\s*(?:harga_coret|coret|harga_asli|original_price)\s*:\s*([0-9.]+)\s*\]/i);
        const coretHtml = rawContent.match(/id=["']product-strike-price["'][^>]*>\s*Rp?\s*([0-9.]+)/i);
        const coretText = cleanText.match(/(?:harga\s+coret|harga\s+asli|harga\s+normal)\s*:\s*Rp?\s*([0-9.]+)/i);
        if (coretBracket) {
            originalPrice = parseFloat(coretBracket[1].replace(/\./g, '')) || null;
        } else if (coretHtml) {
            originalPrice = parseFloat(coretHtml[1].replace(/\./g, '')) || null;
        } else if (coretText) {
            originalPrice = parseFloat(coretText[1].replace(/\./g, '')) || null;
        }

        let stock = null;
        const stokBracket = cleanText.match(/\[\s*(?:stok|stock)\s*:\s*([0-9]+)\s*\]/i);
        const stokHtml = rawContent.match(/id=["']product-stock["'][^>]*>\s*([0-9]+)/i);
        const stokText = cleanText.match(/(?:sisa\s+stok|stok\s+tersedia|stok|stock)\s*:\s*([0-9]+)/i);
        if (stokBracket) {
            stock = parseInt(stokBracket[1], 10);
        } else if (stokHtml) {
            stock = parseInt(stokHtml[1], 10);
        } else if (stokText) {
            stock = parseInt(stokText[1], 10);
        }

        let discountPercent = 0;
        const discBracket = cleanText.match(/\[\s*diskon\s*:\s*([0-9]+)%\s*\]/i);
        const discHtml = rawContent.match(/id=["']discount-badge["'][^>]*>\s*Diskon\s*([0-9]+)%/i);
        const discText = cleanText.match(/Diskon\s*([0-9]+)%/i);
        if (discBracket) {
            discountPercent = parseInt(discBracket[1], 10);
        } else if (discHtml) {
            discountPercent = parseInt(discHtml[1], 10);
        } else if (discText) {
            discountPercent = parseInt(discText[1], 10);
        }

        if (!discountPercent && originalPrice && price && originalPrice > price) {
            discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
        }

        const badgeBracket = cleanText.match(/\[\s*badge\s*:\s*([^\]]+)\]/i);
        const badgeHtml = rawContent.match(/id=["']product-badge["'][^>]*>\s*([^<]+)/i);
        let badge = badgeBracket ? badgeBracket[1].trim() : (badgeHtml ? badgeHtml[1].trim() : null);
        if (!badge && discountPercent > 0) {
            badge = `Diskon ${discountPercent}%`;
        }

        const flashSaleMatch = cleanText.match(/\[\s*(?:flash_sale|kejar_diskon|flashsale)\s*:\s*(true|1|ya)\s*\]/i)
            || rawContent.match(/id=["']btn-flash-sale["'][^>]*class=["'][^"']*bg-amber/i);
        const flashSale = !!flashSaleMatch;

        const ukuranMatch = cleanText.match(/\[\s*(?:ukuran|size|sizes|porsi)\s*:\s*([^\]]+)\]/i);
        let sizes = [];
        if (ukuranMatch) {
            sizes = ukuranMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        } else {
            const sizePills = rawContent.match(/class=["'][^"']*size-name[^"']*["'][^>]*>([^<]+)/gi);
            if (sizePills) {
                sizes = sizePills.map(s => s.replace(/<[^>]*>/g, '').replace(/class=[^>]+>/i, '').trim()).filter(Boolean);
            }
        }

        const warnaMatch = cleanText.match(/\[\s*(?:warna|color|colours|colors|level|rasa|pedas|topping)\s*:\s*([^\]]+)\]/i);
        let colors = [];
        if (warnaMatch) {
            colors = warnaMatch[1].split(',').map(c => c.trim()).filter(Boolean);
        } else {
            const colorPills = rawContent.match(/class=["'][^"']*color-name[^"']*["'][^>]*>([^<]+)/gi);
            if (colorPills) {
                colors = colorPills.map(c => c.replace(/<[^>]*>/g, '').replace(/class=[^>]+>/i, '').trim()).filter(Boolean);
            }
        }

        const variantPricesMatch = cleanText.match(/\[\s*(?:harga_varian|variant_price|harga_variasi)\s*:\s*([^\]]+)\]/i);
        let variantPrices = {};
        if (variantPricesMatch) {
            const pairs = variantPricesMatch[1].split(',').map(p => p.trim());
            for (const pair of pairs) {
                const parts = pair.split('=').map(s => s.trim());
                if (parts.length >= 2 && parts[0] && parts[1]) {
                    const num = parseFloat(parts[1].replace(/\./g, '')) || 0;
                    if (num > 0) {
                        const k = parts[0].trim();
                        variantPrices[k] = num;
                        variantPrices[k.toUpperCase()] = num;
                        variantPrices[k.toLowerCase()] = num;
                    }
                }
            }
        }

        const beratMatch = cleanText.match(/\[\s*(?:berat|weight)\s*:\s*([0-9.,]+)\s*(kg|g|gram|ons)?\s*\]/i);
        const freeShippingMatch = cleanText.match(/\[\s*(?:gratis_ongkir|free_ongkir|ongkir_gratis|bebas_ongkir)\s*:\s*(true|1|ya)\s*\]/i);

        let weight = 350;
        if (beratMatch) {
            const num = parseFloat(beratMatch[1].replace(/,/g, '.')) || 350;
            const unit = (beratMatch[2] || 'g').toLowerCase();
            if (unit === 'kg') weight = Math.round(num * 1000);
            else if (unit === 'ons') weight = Math.round(num * 100);
            else weight = Math.round(num);
        }

        const type = 'makanan';
        const freeShipping = !!freeShippingMatch || (cleanText.includes('bebas ongkir') || cleanText.includes('gratis ongkir'));

        const lokasiBracket = cleanText.match(/\[\s*(?:lokasi|koordinat|coords|cabang_koordinat|dapur_koordinat|lokasi_dapur)\s*:\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\]/i);
        let coords = null;
        if (lokasiBracket) {
            const pLat = parseFloat(lokasiBracket[1]);
            const pLng = parseFloat(lokasiBracket[2]);
            if (!isNaN(pLat) && !isNaN(pLng)) {
                coords = { lat: pLat, lng: pLng };
            }
        }
        const dapurBracket = cleanText.match(/\[\s*(?:dapur|nama_dapur|kitchen|cabang)\s*:\s*([^\]]+)\]/i);
        const kitchenName = dapurBracket ? dapurBracket[1].trim() : '';
        const branchName = kitchenName;

        const idDapurBracket = cleanText.match(/\[\s*(?:id_dapur|dapur_id|kitchen_id|kitchen_username|id_cabang)\s*:\s*([^\]]+)\]/i);
        const kitchenId = idDapurBracket ? idDapurBracket[1].trim() : '';

        const alamatDapurBracket = cleanText.match(/\[\s*(?:alamat_dapur|lokasi_dapur_teks|kitchen_address|alamat)\s*:\s*([^\]]+)\]/i);
        const kitchenAddress = alamatDapurBracket ? alamatDapurBracket[1].trim() : '';

        const ratingBracket = cleanText.match(/\[\s*(?:rating|bintang|nilai)\s*:\s*([0-9.]+)\s*\]/i);
        const ratingHtml = rawContent.match(/id=["']product-rating["'][^>]*>\s*([0-9.]+)/i);
        let rating = null;
        if (ratingBracket) {
            rating = parseFloat(ratingBracket[1]) || null;
        } else if (ratingHtml) {
            rating = parseFloat(ratingHtml[1]) || null;
        }

        const soldBracket = cleanText.match(/\[\s*(?:terjual|sold|sales)\s*:\s*([0-9]+)\s*\]/i);
        const soldHtml = rawContent.match(/id=["']product-sold["'][^>]*>\s*([0-9]+)/i);
        let sold = 0;
        if (soldBracket) {
            sold = parseInt(soldBracket[1], 10) || 0;
        } else if (soldHtml) {
            sold = parseInt(soldHtml[1], 10) || 0;
        }

        const hppBracket = cleanText.match(/\[\s*(?:hpp|modal|cost|cogs)\s*:\s*([0-9.]+)\s*\]/i);
        const hppHtml = rawContent.match(/id=["']product-hpp["'][^>]*>\s*Rp?\s*([0-9.]+)/i);
        let hpp = null;
        if (hppBracket) {
            hpp = parseFloat(hppBracket[1].replace(/\./g, '')) || null;
        } else if (hppHtml) {
            hpp = parseFloat(hppHtml[1].replace(/\./g, '')) || null;
        }

        return { price, originalPrice, discountPercent, stock, badge, flashSale, sizes, colors, weight, type, freeShipping, variantPrices, coords, branchName, kitchenName, kitchenId, kitchenAddress, rating, sold, hpp };
    }

    let currentBloggerProduct = null;
    let currentBloggerQty = 1;
    let currentBloggerSelectedColor = null;
    let currentBloggerSelectedSize = null;



// ==========================================================
// MODULE: 10-blogger-catalog.js
// ==========================================================
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



// ==========================================================
// MODULE: 11-promo-coupons.js
// ==========================================================
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



// ==========================================================
// MODULE: 12-shipping-reviews.js
// ==========================================================
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


// ==========================================================
// MODULE: 13-license.js
// ==========================================================

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



// ==========================================================
// MODULE: 14-boot.js
// ==========================================================
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
