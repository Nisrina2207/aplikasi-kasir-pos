// aplikasi-kasir/frontend/js/transactionsPage.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired on transactionsPage.js');

    if (!window.location.pathname.endsWith('/transactions') && !window.location.pathname.endsWith('/transactions.html')) {
        console.log('Not on transactions page, skipping transactions page logic.');
        return;
    }

    // --- DOM Elements ---
    const transactionsTableBody = document.getElementById('transactionsTableBody');
    const transactionDetailModal = document.getElementById('transactionDetailModal');
    const modalTransactionId = document.getElementById('modalTransactionId');
    const modalTransactionDate = document.getElementById('modalTransactionDate');
    const modalCashier = document.getElementById('modalCashier');
    const modalTotalAmount = document.getElementById('modalTotalAmount');
    const modalPaidAmount = document.getElementById('modalPaidAmount');
    const modalChangeAmount = document.getElementById('modalChangeAmount');
    const modalPaymentMethod = document.getElementById('modalPaymentMethod');
    const modalTransactionItems = document.getElementById('modalTransactionItems');
    const transactionMessage = document.getElementById('transactionMessage');

    const filterTransactionsForm = document.getElementById('filterTransactionsForm');
    const filterStartDateInput = document.getElementById('filterStartDate');
    const filterEndDateInput = document.getElementById('filterEndDate');
    const deleteByDateBtn = document.getElementById('deleteByDateBtn');

    const modalCustomerName = document.getElementById('modalCustomerName');
    const modalTableNumber = document.getElementById('modalTableNumber');

    // Elemen baru untuk modal detail
    const modalDiscountAmount = document.getElementById('modalDiscountAmount'); // Tambahkan ini
    const modalTaxPercentage = document.getElementById('modalTaxPercentage');   // Tambahkan ini
    const modalTaxAmount = document.getElementById('modalTaxAmount');           // Tambahkan ini


    // --- Helper Functions ---
    function showMessage(message, type = 'info') {
        if (transactionMessage) {
            transactionMessage.textContent = message;
            transactionMessage.className = `alert mt-3 alert-${type}`;
            transactionMessage.classList.remove('d-none');
            setTimeout(() => { transactionMessage.classList.add('d-none'); }, 5000);
        } else {
            console.warn('Element with ID "transactionMessage" not found. Message:', message);
            if (type === 'danger' || type === 'warning') {
                alert(message);
            }
        }
    }

    // Function to fetch all transactions with optional date filter
    async function fetchTransactions(startDate = null, endDate = null) {
        transactionsTableBody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">Memuat transaksi...</td></tr>'; // colspan disesuaikan
        let url = 'http://localhost:5000/api/transactions';
        const params = new URLSearchParams();

        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        try {
            const response = await apiFetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal memuat transaksi: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                transactionsTableBody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Gagal memuat transaksi.</td></tr>'; // colspan disesuaikan
                return;
            }
            const transactions = await response.json();
            console.log('Fetched transactions:', transactions);
            displayTransactions(transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showMessage('Terjadi kesalahan jaringan saat memuat transaksi.', 'danger');
            transactionsTableBody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Terjadi kesalahan jaringan.</td></tr>'; // colspan disesuaikan
        }
    }

    // Function to display transactions in the table
    function displayTransactions(transactions) {
        transactionsTableBody.innerHTML = '';
        if (!transactions || transactions.length === 0) {
            transactionsTableBody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">Tidak ada transaksi ditemukan.</td></tr>'; // colspan disesuaikan
            return;
        }

        transactions.forEach(transaction => {
            const row = transactionsTableBody.insertRow();
            row.innerHTML = `
                <td>${transaction.id}</td>
                <td>${new Date(transaction.created_at).toLocaleString()}</td>
                <td>${transaction.cashier_username || 'N/A'}</td>
                <td>${transaction.customer_name || 'Umum'}</td>
                <td>${transaction.table_number || 'N/A'}</td>
                <td>${formatRupiah(transaction.discount_amount || 0)}</td>   <!-- Tampilkan diskon -->
                <td>${(parseFloat(transaction.tax_percentage) || 0).toFixed(2)}%</td> <!-- Tampilkan persentase pajak -->
                <td>${formatRupiah(transaction.total_amount)}</td>
                <td>${formatRupiah(transaction.paid_amount)}</td>
                <td>${formatRupiah(transaction.change_amount)}</td>
                <td>
                    <button class="btn btn-info btn-sm view-detail-btn" data-id="${transaction.id}">
                        <i class="fas fa-eye"></i> Detail
                    </button>
                    <button class="btn btn-danger btn-sm delete-transaction-btn" data-id="${transaction.id}" ${localStorage.getItem('role') !== 'admin' ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            `;
        });
    }

    // Function to fetch and display transaction details in modal
    async function showTransactionDetail(transactionId) {
        try {
            const response = await apiFetch(`http://localhost:5000/api/transactions/${transactionId}`);
            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal memuat detail transaksi: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                return;
            }
            const transaction = await response.json();

            modalTransactionId.textContent = transaction.id;
            modalTransactionDate.textContent = new Date(transaction.created_at).toLocaleString();
            modalCashier.textContent = transaction.cashier_username || 'N/A';
            modalTotalAmount.textContent = formatRupiah(transaction.total_amount);
            modalPaidAmount.textContent = formatRupiah(transaction.paid_amount);
            modalChangeAmount.textContent = formatRupiah(transaction.change_amount);
            modalPaymentMethod.textContent = transaction.payment_method;
            modalCustomerName.textContent = transaction.customer_name || 'Umum';
            modalTableNumber.textContent = transaction.table_number || 'N/A';
            modalDiscountAmount.textContent = formatRupiah(transaction.discount_amount || 0);    // Isi diskon
            modalTaxPercentage.textContent = (parseFloat(transaction.tax_percentage) || 0).toFixed(2) + '%'; // Isi persentase pajak
            modalTaxAmount.textContent = formatRupiah(transaction.tax_amount || 0);            // Isi jumlah pajak

            modalTransactionItems.innerHTML = '';
            if (transaction.items && transaction.items.length > 0) {
                transaction.items.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item';
                    listItem.textContent = `${item.product_name} (x${item.quantity}) - ${formatRupiah(item.item_price)} = ${formatRupiah(item.quantity * item.item_price)}`;
                    modalTransactionItems.appendChild(listItem);
                });
            } else {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item text-muted';
                listItem.textContent = 'Tidak ada item transaksi.';
                modalTransactionItems.appendChild(listItem);
            }

            $('#transactionDetailModal').modal('show');

        } catch (error) {
            console.error('Error fetching transaction detail:', error);
            showMessage('Terjadi kesalahan jaringan saat memuat detail transaksi.', 'danger');
        }
    }

    // Function to delete a single transaction
    async function deleteTransaction(transactionId) {
        if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        try {
            const response = await apiFetch(`http://localhost:5000/api/transactions/${transactionId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal menghapus transaksi: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                return;
            }

            showMessage('Transaksi berhasil dihapus.', 'success');
            fetchTransactions(filterStartDateInput.value, filterEndDateInput.value); // Refresh the list with current filter
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showMessage('Terjadi kesalahan jaringan saat menghapus transaksi.', 'danger');
        }
    }

    // Function to delete transactions by date range
    async function deleteTransactionsByDate() {
        const startDate = filterStartDateInput.value;
        const endDate = filterEndDateInput.value;

        if (!startDate || !endDate) {
            showMessage('Pilih rentang tanggal untuk menghapus transaksi.', 'warning');
            return;
        }

        const confirmMessage = `Apakah Anda yakin ingin menghapus SEMUA transaksi antara ${startDate} dan ${endDate}? Tindakan ini tidak dapat dibatalkan.`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await apiFetch(`http://localhost:5000/api/transactions/by-date`, {
                method: 'DELETE',
                body: JSON.stringify({ startDate, endDate })
            });

            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal menghapus transaksi berdasarkan tanggal: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                return;
            }

            showMessage('Transaksi dalam rentang tanggal tersebut berhasil dihapus.', 'success');
            fetchTransactions(filterStartDateInput.value, filterEndDateInput.value); // Refresh the list
        } catch (error) {
            console.error('Error deleting transactions by date:', error);
            showMessage('Terjadi kesalahan jaringan saat menghapus transaksi berdasarkan tanggal.', 'danger');
        }
    }

    // --- Event Listeners ---
    transactionsTableBody.addEventListener('click', (event) => {
        const target = event.target;
        const transactionId = target.closest('button')?.dataset.id;

        if (!transactionId) return;

        if (target.closest('.view-detail-btn')) {
            showTransactionDetail(transactionId);
        } else if (target.closest('.delete-transaction-btn')) {
            deleteTransaction(transactionId);
        }
    });

    filterTransactionsForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const startDate = filterStartDateInput.value;
        const endDate = filterEndDateInput.value;
        fetchTransactions(startDate, endDate);
    });

    deleteByDateBtn.addEventListener('click', deleteTransactionsByDate);

    // --- Initialization ---
    const today = new Date().toISOString().split('T')[0];
    filterStartDateInput.value = today;
    filterEndDateInput.value = today;

    if (localStorage.getItem('role') === 'admin') {
        deleteByDateBtn.removeAttribute('disabled');
    }

    fetchTransactions(today, today);
});
