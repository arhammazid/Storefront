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

