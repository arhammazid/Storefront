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

