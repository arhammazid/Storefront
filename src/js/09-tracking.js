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
                if (u.startsWith('http')) return u;
            }
            if (window.ARJUGO_CONFIG && window.ARJUGO_CONFIG.GAS_URL) {
                let confU = window.ARJUGO_CONFIG.GAS_URL.trim();
                if (confU) {
                    if (!confU.startsWith('http')) confU = 'https://script.google.com/macros/s/' + confU.replace(/^\/+|\/+$/g, '').replace(/\/exec$/i, '') + '/exec';
                    if (confU.startsWith('http')) return confU;
                }
            }
            const mainGas = (typeof getGoogleAppsScriptUrl === 'function') ? getGoogleAppsScriptUrl() : '';
            if (mainGas && mainGas.startsWith('http')) return mainGas.trim();
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

