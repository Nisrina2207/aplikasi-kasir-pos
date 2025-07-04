// aplikasi-kasir/frontend/js/reportsPage.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired on reportsPage.js');

    if (!window.location.pathname.endsWith('/reports') && !window.location.pathname.endsWith('/reports.html')) {
        console.log('Not on reports page, skipping reports page logic.');
        return;
    }

    // --- DOM Elements ---
    const reportFilterForm = document.getElementById('reportFilterForm');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const reportMessage = document.getElementById('reportMessage');
    const reportSummaryDiv = document.getElementById('reportSummary');
    const reportDetailsTableBody = document.getElementById('reportDetailsTableBody');

    let totalTransactionsSpan;
    let totalSalesAmountBrutoSpan; // Elemen baru
    let totalDiscountAmountSpan;    // Elemen baru
    let totalTaxAmountSpan;         // Elemen baru
    let totalSalesAmountNettoSpan;  // Elemen baru (sebelumnya totalSalesAmountSpan)
    let totalPaidAmountSpan;
    let totalChangeAmountSpan;
    let topProductsList;

    function initializeReportElements() {
        totalTransactionsSpan = document.getElementById('totalTransactions');
        totalSalesAmountBrutoSpan = document.getElementById('totalSalesAmountBruto');
        totalDiscountAmountSpan = document.getElementById('totalDiscountAmount');
        totalTaxAmountSpan = document.getElementById('totalTaxAmount');
        totalSalesAmountNettoSpan = document.getElementById('totalSalesAmountNetto'); // Mengganti totalSalesAmountSpan
        totalPaidAmountSpan = document.getElementById('totalPaidAmount');
        totalChangeAmountSpan = document.getElementById('totalChangeAmount');
        topProductsList = document.getElementById('topProductsList');
    }

    // --- Helper Functions ---
    function showMessage(message, type = 'info') {
        if (reportMessage) {
            reportMessage.textContent = message;
            reportMessage.className = `alert mt-3 alert-${type}`;
            reportMessage.classList.remove('d-none');
            setTimeout(() => {
                reportMessage.classList.add('d-none');
            }, 5000);
        } else {
            console.warn('Element with ID "reportMessage" not found. Message:', message);
            if (type === 'danger' || type === 'warning') {
                alert(message);
            }
        }
    }

    async function fetchReports(startDate, endDate) {
        if (!totalTransactionsSpan) initializeReportElements();

        showMessage('Memuat laporan...', 'info');
        if (totalTransactionsSpan) totalTransactionsSpan.textContent = '...';
        if (totalSalesAmountBrutoSpan) totalSalesAmountBrutoSpan.textContent = '...';
        if (totalDiscountAmountSpan) totalDiscountAmountSpan.textContent = '...';
        if (totalTaxAmountSpan) totalTaxAmountSpan.textContent = '...';
        if (totalSalesAmountNettoSpan) totalSalesAmountNettoSpan.textContent = '...';
        if (totalPaidAmountSpan) totalPaidAmountSpan.textContent = '...';
        if (totalChangeAmountSpan) totalChangeAmountSpan.textContent = '...';
        if (topProductsList) topProductsList.innerHTML = '<li class="list-group-item text-muted">Memuat...</li>';
        reportDetailsTableBody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">Memuat detail laporan...</td></tr>'; // colspan disesuaikan


        try {
            // Fetch Sales Summary
            let salesUrl = 'http://localhost:5000/api/reports/sales';
            if (startDate && endDate) {
                salesUrl += `?startDate=${startDate}&endDate=${endDate}`;
            }
            const salesResponse = await apiFetch(salesUrl);
            if (!salesResponse.ok) {
                const errorData = await salesResponse.json();
                showMessage(`Gagal memuat ringkasan penjualan: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                reportDetailsTableBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Gagal memuat ringkasan.</td></tr>'; // colspan disesuaikan
                return;
            }
            const salesData = await salesResponse.json();
            console.log('Fetched Sales Summary:', salesData);

            if (totalTransactionsSpan) totalTransactionsSpan.textContent = salesData.total_transactions || 0;
            // PERUBAHAN DI SINI: Memperbarui tampilan ringkasan
            if (totalSalesAmountBrutoSpan) totalSalesAmountBrutoSpan.textContent = formatRupiah(parseFloat(salesData.total_sales_amount_bruto) || 0); // Asumsi backend menyediakan ini
            if (totalDiscountAmountSpan) totalDiscountAmountSpan.textContent = formatRupiah(parseFloat(salesData.total_discount_amount) || 0);
            if (totalTaxAmountSpan) totalTaxAmountSpan.textContent = formatRupiah(parseFloat(salesData.total_tax_amount) || 0);
            if (totalSalesAmountNettoSpan) totalSalesAmountNettoSpan.textContent = formatRupiah(parseFloat(salesData.total_sales_amount) || 0); // total_amount dari backend adalah netto
            if (totalPaidAmountSpan) totalPaidAmountSpan.textContent = formatRupiah(parseFloat(salesData.total_paid_amount) || 0);
            if (totalChangeAmountSpan) totalChangeAmountSpan.textContent = formatRupiah(parseFloat(salesData.total_change_amount) || 0);

            // Fetch Top Selling Products
            let topProductsUrl = 'http://localhost:5000/api/reports/top-products?limit=5';
            if (startDate && endDate) {
                topProductsUrl += `&startDate=${startDate}&endDate=${endDate}`;
            }
            const topProductsResponse = await apiFetch(topProductsUrl);
            if (!topProductsResponse.ok) {
                const errorData = await topProductsResponse.json();
                showMessage(`Gagal memuat produk terlaris: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                reportDetailsTableBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Gagal memuat produk terlaris.</td></tr>'; // colspan disesuaikan
                return;
            }
            const topProducts = await topProductsResponse.json();
            console.log('Fetched Top Products:', topProducts);
            displayTopProducts(topProducts);

            // Fetch Detailed Sales
            let detailedSalesUrl = 'http://localhost:5000/api/reports/detailed-sales';
            if (startDate && endDate) {
                detailedSalesUrl += `?startDate=${startDate}&endDate=${endDate}`;
            }
            const detailedSalesResponse = await apiFetch(detailedSalesUrl);
            if (!detailedSalesResponse.ok) {
                const errorData = await detailedSalesResponse.json();
                showMessage(`Gagal memuat detail penjualan: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                reportDetailsTableBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Gagal memuat detail penjualan.</td></tr>'; // colspan disesuaikan
                return;
            }
            const detailedSales = await detailedSalesResponse.json();
            console.log('Fetched Detailed Sales:', detailedSales);
            displayDetailedSales(detailedSales);


            showMessage('Laporan berhasil dimuat.', 'success');

        } catch (error) {
            console.error('Error fetching reports:', error);
            showMessage('Terjadi kesalahan jaringan saat memuat laporan.', 'danger');
            reportDetailsTableBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Terjadi kesalahan jaringan.</td></tr>'; // colspan disesuaikan
        }
    }

    function displayTopProducts(products) {
        if (!topProductsList) initializeReportElements();
        topProductsList.innerHTML = '';
        if (!products || products.length === 0) {
            topProductsList.innerHTML = '<li class="list-group-item text-muted">Belum ada data produk terlaris dalam periode ini.</li>';
            return;
        }
        products.forEach(product => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                ${product.name}
                <span class="badge badge-primary badge-pill">${product.total_quantity_sold}x (${formatRupiah(product.total_revenue)})</span>
            `;
            topProductsList.appendChild(li);
        });
    }

    function displayDetailedSales(sales) {
        reportDetailsTableBody.innerHTML = '';
        if (!sales || sales.length === 0) {
            reportDetailsTableBody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">Tidak ada data detail penjualan dalam periode ini.</td></tr>'; // colspan disesuaikan
            return;
        }

        sales.forEach(sale => {
            const row = reportDetailsTableBody.insertRow();
            row.innerHTML = `
                <td>${sale.id}</td>
                <td>${new Date(sale.created_at).toLocaleString()}</td>
                <td>${sale.cashier_username || 'N/A'}</td>
                <td>${sale.customer_name || 'Umum'}</td>
                <td>${sale.table_number || 'N/A'}</td>
                <td>${formatRupiah(sale.discount_amount || 0)}</td>   <!-- Tampilkan diskon -->
                <td>${(parseFloat(sale.tax_percentage) || 0).toFixed(2)}%</td> <!-- Tampilkan persentase pajak -->
                <td>${formatRupiah(sale.tax_amount || 0)}</td>       <!-- Tampilkan jumlah pajak -->
                <td>${formatRupiah(sale.total_amount)}</td>
                <td>${sale.total_items}</td>
            `;
        });
    }

    // --- Event Listeners ---
    reportFilterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        fetchReports(startDate, endDate);
    });

    // --- Initialization ---
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;

    initializeReportElements();
    fetchReports(today, today);
});
