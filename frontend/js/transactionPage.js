document.addEventListener('DOMContentLoaded', () => {
    // Memastikan kode ini hanya berjalan di transactions.html
    if (window.location.pathname.includes('transactions.html')) {
        const transactionsTableBody = document.getElementById('transactionsTableBody');
        const transactionDetailModalBody = document.getElementById('transactionDetailModalBody');

        async function fetchTransactions() {
            transactionsTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted mt-3">Memuat transaksi...</td></tr>';
            try {
                const response = await apiFetch('http://localhost:5000/api/transactions'); // Gunakan apiFetch
                // Cek apakah response sukses sebelum parsing JSON
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch transactions');
                }
                const data = await response.json(); //

                transactionsTableBody.innerHTML = ''; // Bersihkan loader
                if (data.length === 0) {
                    transactionsTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted mt-3">Belum ada transaksi.</td></tr>';
                    return;
                }
                data.forEach(transaction => {
                    const row = `
                        <tr>
                            <td>${transaction.id}</td>
                            <td>${transaction.user_username || 'N/A'}</td>
                            <td>${formatRupiah(transaction.total_amount)}</td>
                            <td>${formatRupiah(transaction.paid_amount)}</td>
                            <td>${formatRupiah(transaction.change_amount)}</td>
                            <td>${transaction.payment_method}</td>
                            <td>${new Date(transaction.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                            <td>
                                <button class="btn btn-sm btn-info view-detail-btn" data-bs-toggle="modal" data-bs-target="#transactionDetailModal" data-transaction-id="${transaction.id}">Detail</button>
                            </td>
                        </tr>
                    `;
                    transactionsTableBody.innerHTML += row;
                });
                // Inisialisasi event listener untuk tombol detail setelah tabel terisi
                initTransactionDetailModalListeners();
            } catch (error) {
                transactionsTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger mt-3">Terjadi kesalahan: ${error.message}. Periksa konsol untuk detail.</td></tr>`;
                console.error('Error saat fetch transaksi:', error);
            }
        }

        async function initTransactionDetailModalListeners() {
            const detailButtons = document.querySelectorAll('.view-detail-btn');
            detailButtons.forEach(button => {
                button.addEventListener('click', async () => {
                    const transactionId = button.dataset.transactionId;
                    transactionDetailModalBody.innerHTML = '<p class="text-center">Memuat detail...</p>';
                    try {
                        const response = await apiFetch(`http://localhost:5000/api/transactions/${transactionId}`);
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Failed to fetch transaction detail');
                        }
                        const data = await response.json();

                        let itemsHtml = data.items.map(item => `
                            <li>${item.product_name} (${item.quantity}x) - ${formatRupiah(item.item_price)}</li>
                        `).join('');

                        transactionDetailModalBody.innerHTML = `
                            <p><strong>ID Transaksi:</strong> ${data.id}</p>
                            <p><strong>Kasir:</strong> ${data.user_username || 'N/A'}</p>
                            <p><strong>Total:</strong> ${formatRupiah(data.total_amount)}</p>
                            <p><strong>Dibayar:</strong> ${formatRupiah(data.paid_amount)}</p>
                            <p><strong>Kembalian:</strong> ${formatRupiah(data.change_amount)}</p>
                            <p><strong>Metode Pembayaran:</strong> ${data.payment_method}</p>
                            <p><strong>Tanggal:</strong> ${new Date(data.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}</p>
                            <h6>Item:</h6>
                            <ul>${itemsHtml}</ul>
                        `;
                    } catch (error) {
                        transactionDetailModalBody.innerHTML = `<p class="text-danger">Terjadi kesalahan: ${error.message}. Periksa konsol.</p>`;
                        console.error('Error saat fetch detail transaksi:', error);
                    }
                });
            });
        }
        
        fetchTransactions(); // Panggil fungsi saat halaman dimuat
    }
});