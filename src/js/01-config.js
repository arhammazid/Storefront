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

