// aplikasi-kasir/frontend/js/posPage.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired on posPage.js');

    if (!window.location.pathname.endsWith('/pos') && !window.location.pathname.endsWith('/pos.html')) {
        console.log('Not on pos page, skipping POS page logic.');
        return;
    }

    // --- DOM Elements ---
    const productSearchInput = document.getElementById('productSearch');
    const productListDiv = document.getElementById('productList');
    const cartItemsBody = document.getElementById('cartItems');
    const subtotalAmountInput = document.getElementById('subtotalAmount'); // Elemen baru
    const totalAmountInput = document.getElementById('totalAmount');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const paidAmountInput = document.getElementById('paidAmount');
    const changeAmountInput = document.getElementById('changeAmount');
    const completeTransactionBtn = document.getElementById('completeTransactionBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    const posMessageDiv = document.getElementById('posMessage');

    const customerNameInput = document.getElementById('customerName');
    const tableNumberInput = document.getElementById('tableNumber');

    // Elemen baru untuk Diskon dan Pajak
    const discountAmountInput = document.getElementById('discountAmount'); // Tambahkan ini
    const taxPercentageInput = document.getElementById('taxPercentage');   // Tambahkan ini
    const taxAmountInput = document.getElementById('taxAmount');           // Tambahkan ini


    // Debugging: Pastikan elemen ditemukan saat DOMContentLoaded
    console.log('Debug: posMessageDiv found?', !!posMessageDiv);
    console.log('Debug: printReceiptBtn found?', !!printReceiptBtn);
    console.log('Debug: customerNameInput found?', !!customerNameInput);
    console.log('Debug: tableNumberInput found?', !!tableNumberInput);
    console.log('Debug: discountAmountInput found?', !!discountAmountInput);
    console.log('Debug: taxPercentageInput found?', !!taxPercentageInput);
    console.log('Debug: taxAmountInput found?', !!taxAmountInput);
    console.log('Debug: subtotalAmountInput found?', !!subtotalAmountInput);


    // --- Global Variables ---
    let products = [];
    let cart = [];
    let lastTransactionData = null; // Menyimpan data transaksi terakhir untuk dicetak

    // --- Helper Functions ---
    function showMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        if (posMessageDiv) {
            posMessageDiv.textContent = message;
            posMessageDiv.className = `alert mt-3 alert-${type}`;
            posMessageDiv.classList.remove('d-none');
            setTimeout(() => { posMessageDiv.classList.add('d-none'); }, 5000);
        } else {
            console.warn('WARNING: Element with ID "posMessage" not found. Message:', message);
            if (type === 'danger' || type === 'warning') {
                alert(message);
            }
        }
    }

    // Function to fetch products from backend
    async function fetchProducts() {
        productListDiv.innerHTML = '<div class="col-12 text-center text-muted mt-3">Memuat produk...</div>';
        try {
            const response = await apiFetch('http://localhost:5000/api/products', {}, true);
            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal memuat produk: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                productListDiv.innerHTML = '<div class="col-12 text-center text-danger mt-3">Gagal memuat produk.</div>';
                return;
            }
            products = await response.json();
            displayProducts(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            showMessage('Terjadi kesalahan jaringan saat memuat produk.', 'danger');
            productListDiv.innerHTML = '<div class="col-12 text-center text-danger mt-3">Terjadi kesalahan jaringan.</div>';
        }
    }

    // Function to display products
    function displayProducts(productsToDisplay) {
        productListDiv.innerHTML = '';
        if (productsToDisplay.length === 0) {
            productListDiv.innerHTML = '<div class="col-12 text-center text-muted mt-3">Tidak ada produk ditemukan.</div>';
            return;
        }
        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'col-md-4 mb-3';
            productCard.innerHTML = `
                <div class="card product-card" data-product-id="${product.id}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">Harga: ${formatRupiah(product.price)}</p>
                        <p class="card-text">Stok: ${product.stock}</p>
                        <button class="btn btn-primary btn-sm add-to-cart-btn" data-product-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> Tambah
                        </button>
                    </div>
                </div>
            `;
            productListDiv.appendChild(productCard);
        });
    }

    // Function to add product to cart
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) {
            showMessage('Produk tidak ditemukan.', 'danger');
            return;
        }
        if (product.stock <= 0) {
            showMessage('Stok produk habis!', 'warning');
            return;
        }

        const existingCartItem = cart.find(item => item.product_id === productId);

        if (existingCartItem) {
            if (existingCartItem.quantity < product.stock) {
                existingCartItem.quantity++;
            } else {
                showMessage('Stok tidak mencukupi.', 'warning');
                return;
            }
        } else {
            cart.push({
                product_id: product.id,
                name: product.name,
                price_at_sale: product.price,
                quantity: 1
            });
        }
        updateCartDisplay();
        if (lastTransactionData && printReceiptBtn) {
            printReceiptBtn.style.display = 'none';
        }
    }

    // Function to update cart item quantity
    function updateCartItemQuantity(productId, change) {
        const cartItem = cart.find(item => item.product_id === productId);
        if (cartItem) {
            const product = products.find(p => p.id === productId);
            if (change > 0) {
                if (cartItem.quantity < product.stock) {
                    cartItem.quantity += change;
                } else {
                    showMessage('Stok tidak mencukupi.', 'warning');
                    return;
                }
            } else {
                cartItem.quantity += change;
                if (cartItem.quantity <= 0) {
                    cart = cart.filter(item => item.product_id !== productId);
                }
            }
            updateCartDisplay();
            if (lastTransactionData && printReceiptBtn) {
                printReceiptBtn.style.display = 'none';
            }
        }
    }

    // Function to remove item from cart
    function removeFromCart(productId) {
        cart = cart.filter(item => item.product_id !== productId);
        updateCartDisplay();
        if (lastTransactionData && printReceiptBtn) {
            printReceiptBtn.style.display = 'none';
        }
    }

    // Function to clear the entire cart
    function clearCart() {
        cart = [];
        updateCartDisplay();
        showMessage('Keranjang dibersihkan.', 'info');
        lastTransactionData = null;
        if (printReceiptBtn) {
            printReceiptBtn.style.display = 'none';
            console.log('Debug: printReceiptBtn hidden by clearCart.');
        }
        // Bersihkan input customer, table number, diskon, dan pajak saat keranjang dibersihkan
        if (customerNameInput) customerNameInput.value = '';
        if (tableNumberInput) tableNumberInput.value = '';
        if (discountAmountInput) discountAmountInput.value = '0'; // Reset diskon
        if (taxPercentageInput) taxPercentageInput.value = '0';   // Reset pajak
        updateTotals(); // Perbarui total setelah reset diskon/pajak
    }

    // Function to update cart display and calculate totals
    function updateCartDisplay() {
        cartItemsBody.innerHTML = '';
        let subtotal = 0; // Ini adalah subtotal bruto (sebelum diskon dan pajak)

        if (cart.length === 0) {
            cartItemsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Keranjang kosong.</td></tr>';
        } else {
            cart.forEach(item => {
                const row = cartItemsBody.insertRow();
                const itemSubtotal = item.quantity * item.price_at_sale;
                subtotal += itemSubtotal;
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary qty-decrease-btn" data-id="${item.product_id}">-</button>
                        ${item.quantity}
                        <button class="btn btn-sm btn-outline-secondary qty-increase-btn" data-id="${item.product_id}">+</button>
                    </td>
                    <td>${formatRupiah(item.price_at_sale)}</td>
                    <td>${formatRupiah(itemSubtotal)}</td>
                    <td>
                        <button class="btn btn-danger btn-sm remove-from-cart-btn" data-id="${item.product_id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
            });
        }
        subtotalAmountInput.value = formatRupiah(subtotal); // Tampilkan subtotal bruto
        updateTotals(); // Panggil updateTotals untuk menghitung total akhir
    }

    // Fungsi baru: Menghitung ulang total setelah diskon/pajak
    function updateTotals() {
        const subtotal = parseFloat(subtotalAmountInput.value.replace(/[^0-9,-]+/g, "").replace(',', '.')) || 0;
        const discount = parseFloat(discountAmountInput.value) || 0;
        const taxPercentage = parseFloat(taxPercentageInput.value) || 0;

        let totalAfterDiscount = subtotal - discount;
        if (totalAfterDiscount < 0) totalAfterDiscount = 0; // Pastikan tidak negatif

        const taxAmount = totalAfterDiscount * (taxPercentage / 100);
        const finalTotal = totalAfterDiscount + taxAmount;

        taxAmountInput.value = formatRupiah(taxAmount);
        totalAmountInput.value = formatRupiah(finalTotal);
        calculateChange(); // Hitung ulang kembalian berdasarkan total baru
    }

    // Function to calculate change
    function calculateChange() {
        const total = parseFloat(totalAmountInput.value.replace(/[^0-9,-]+/g, "").replace(',', '.')) || 0;
        const paid = parseFloat(paidAmountInput.value) || 0;
        const change = paid - total;
        changeAmountInput.value = formatRupiah(change);
        changeAmountInput.style.color = change < 0 ? 'red' : 'green';
    }

    // Function to complete the transaction
    async function completeTransaction() {
        if (cart.length === 0) {
            showMessage('Keranjang belanja kosong.', 'warning');
            return;
        }

        const subtotalAmount = parseFloat(subtotalAmountInput.value.replace(/[^0-9,-]+/g, "").replace(',', '.')) || 0;
        const discountAmount = parseFloat(discountAmountInput.value) || 0;
        const taxPercentage = parseFloat(taxPercentageInput.value) || 0;
        const taxAmount = parseFloat(taxAmountInput.value.replace(/[^0-9,-]+/g, "").replace(',', '.')) || 0;
        const totalAmount = parseFloat(totalAmountInput.value.replace(/[^0-9,-]+/g, "").replace(',', '.')) || 0; // Ini adalah total_amount final
        const paidAmount = parseFloat(paidAmountInput.value) || 0;
        const changeAmount = parseFloat(changeAmountInput.value.replace(/[^0-9,-]+/g, "").replace(',', '.')) || 0;
        const paymentMethod = paymentMethodSelect.value;
        const customerName = customerNameInput.value.trim();
        const tableNumber = tableNumberInput.value.trim();
        const cashierUsername = localStorage.getItem('username') || 'Kasir';

        if (paidAmount < totalAmount) {
            showMessage('Jumlah dibayar kurang dari total transaksi.', 'warning');
            return;
        }

        const transactionData = {
            total_amount: totalAmount, // Ini adalah total_amount final (setelah diskon dan pajak)
            paid_amount: paidAmount,
            change_amount: changeAmount,
            payment_method: paymentMethod,
            customer_name: customerName || null,
            table_number: tableNumber || null,
            discount_amount: discountAmount, // Kirim diskon
            tax_percentage: taxPercentage,   // Kirim persentase pajak
            tax_amount: taxAmount,           // Kirim jumlah pajak
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                item_price: item.price_at_sale
            }))
        };

        try {
            console.log('Debug: Attempting to send transaction data:', transactionData);
            const response = await apiFetch('http://localhost:5000/api/transactions', {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal menyelesaikan transaksi: ${errorData.message || errorData.error || 'Error tidak diketahui'}`, 'danger');
                console.error('Debug: API Response not OK:', errorData);
                return;
            }

            try {
                const result = await response.json();
                console.log('Debug: Transaction API response result (after successful fetch):', result);

                lastTransactionData = {
                    transaction: result.transaction,
                    items: cart,
                    cashier_username: cashierUsername,
                    customer_name: customerName,
                    table_number: tableNumber,
                    discount_amount: discountAmount,    // Simpan untuk struk
                    tax_percentage: taxPercentage,      // Simpan untuk struk
                    tax_amount: taxAmount               // Simpan untuk struk
                };
                console.log('Debug: lastTransactionData after setting:', lastTransactionData);

                if (printReceiptBtn) {
                    printReceiptBtn.style.display = 'block';
                    console.log('Debug: printReceiptBtn display set to block.');
                } else {
                    console.warn('WARNING: printReceiptBtn element not found when trying to display it!');
                }

                showMessage('Transaksi berhasil!', 'success');

                fetchProducts();
                paidAmountInput.value = 0;
                calculateChange();

                if (customerNameInput) customerNameInput.value = '';
                if (tableNumberInput) tableNumberInput.value = '';
                if (discountAmountInput) discountAmountInput.value = '0'; // Reset diskon
                if (taxPercentageInput) taxPercentageInput.value = '0';   // Reset pajak
                updateTotals(); // Perbarui total setelah reset diskon/pajak

            } catch (innerError) {
                console.error('Debug: Error processing transaction response or updating UI (inner catch):', innerError);
                showMessage('Terjadi kesalahan saat memproses respons transaksi atau memperbarui UI.', 'danger');
            }

        } catch (error) {
            console.error('Debug: Error completing transaction (outer catch - network/fetch error):', error);
            showMessage('Terjadi kesalahan jaringan saat menyelesaikan transaksi.', 'danger');
        }
    }

    // Fungsi untuk mencetak struk
    function printReceipt() {
        if (!lastTransactionData) {
            showMessage('Tidak ada data transaksi terakhir untuk dicetak.', 'warning');
            console.warn('Debug: printReceipt: lastTransactionData is null.');
            return;
        }
        console.log('Debug: printReceipt called with lastTransactionData:', lastTransactionData);

        const { transaction, items, cashier_username, customer_name, table_number, discount_amount, tax_percentage, tax_amount } = lastTransactionData;

        let receiptContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Struk Transaksi #${transaction.id}</title>
                <style>
                    body {
                        font-family: 'monospace', 'Courier New', monospace;
                        font-size: 12px;
                        width: 80mm; /* Lebar standar struk kasir */
                        margin: 0 auto;
                        padding: 10px;
                    }
                    .receipt-header, .receipt-footer {
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    .receipt-details, .receipt-items, .receipt-summary {
                        margin-bottom: 10px;
                    }
                    .receipt-items table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .receipt-items th, .receipt-items td {
                        padding: 2px 0;
                        text-align: left;
                    }
                    .receipt-items td:nth-child(2), .receipt-items td:nth-child(3) {
                        text-align: right;
                    }
                    .receipt-summary table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .receipt-summary td {
                        padding: 2px 0;
                        text-align: right;
                    }
                    .receipt-summary .label {
                        text-align: left;
                    }
                    .line {
                        border-top: 1px dashed #000;
                        margin: 5px 0;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <h3>APLIKASI KASIR</h3>
                    <p>Jl. Contoh No. 123, Kota Anda</p>
                    <p>Telp: (021) 12345678</p>
                </div>
                <div class="line"></div>
                <div class="receipt-details">
                    <p>Tanggal: ${new Date(transaction.created_at).toLocaleString('id-ID')}</p>
                    <p>Transaksi ID: ${transaction.id}</p>
                    <p>Kasir: ${cashier_username}</p>
                    ${customer_name ? `<p>Pelanggan: ${customer_name}</p>` : ''}
                    ${table_number ? `<p>Meja: ${table_number}</p>` : ''}
                </div>
                <div class="line"></div>
                <div class="receipt-items">
                    <table>
                        <thead>
                            <tr>
                                <th>Produk</th>
                                <th>Qty</th>
                                <th>Harga</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}x</td>
                                    <td>${formatRupiah(item.price_at_sale)}</td>
                                    <td>${formatRupiah(item.quantity * item.price_at_sale)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="line"></div>
                <div class="receipt-summary">
                    <table>
                        <tr>
                            <td class="label">Subtotal:</td>
                            <td>${formatRupiah(transaction.total_amount + discount_amount - tax_amount)}</td> <!-- Subtotal bruto dari total_amount + diskon - pajak -->
                        </tr>
                        ${discount_amount > 0 ? `
                        <tr>
                            <td class="label">Diskon:</td>
                            <td>-${formatRupiah(discount_amount)}</td>
                        </tr>` : ''}
                        ${tax_percentage > 0 ? `
                        <tr>
                            <td class="label">Pajak (${tax_percentage}%):</td>
                            <td>+${formatRupiah(tax_amount)}</td>
                        </tr>` : ''}
                        <tr>
                            <td class="label">Total:</td>
                            <td>${formatRupiah(transaction.total_amount)}</td>
                        </tr>
                        <tr>
                            <td class="label">Dibayar:</td>
                            <td>${formatRupiah(transaction.paid_amount)}</td>
                        </tr>
                        <tr>
                            <td class="label">Kembalian:</td>
                            <td>${formatRupiah(transaction.change_amount)}</td>
                        </tr>
                        <tr>
                            <td class="label">Metode Pembayaran:</td>
                            <td>${transaction.payment_method}</td>
                        </tr>
                    </table>
                </div>
                <div class="line"></div>
                <div class="receipt-footer">
                    <p>Terima Kasih Atas Kunjungan Anda!</p>
                </div>
            </body>
            </html>
        `;

        let printWindow = window.open('', '_blank');
        printWindow.document.write(receiptContent);
        printWindow.document.close();

        printWindow.onload = function() {
            printWindow.print();
            clearCart();
        };
    }

    // --- Event Listeners ---
    productSearchInput.addEventListener('keyup', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm))
        );
        displayProducts(filteredProducts);
    });

    productListDiv.addEventListener('click', (event) => {
        const addBtn = event.target.closest('.add-to-cart-btn');
        if (addBtn) {
            const productId = parseInt(addBtn.dataset.productId);
            addToCart(productId);
        }
    });

    cartItemsBody.addEventListener('click', (event) => {
        const target = event.target;
        const productId = parseInt(target.closest('button')?.dataset.id);

        if (!productId) return;

        if (target.closest('.qty-increase-btn')) {
            updateCartItemQuantity(productId, 1);
        } else if (target.closest('.qty-decrease-btn')) {
            updateCartItemQuantity(productId, -1);
        } else if (target.closest('.remove-from-cart-btn')) {
            removeFromCart(productId);
        }
    });

    paidAmountInput.addEventListener('input', calculateChange);
    completeTransactionBtn.addEventListener('click', completeTransaction);
    clearCartBtn.addEventListener('click', clearCart);

    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', printReceipt);
        console.log('Debug: printReceiptBtn event listener attached.');
    } else {
        console.warn('WARNING: printReceiptBtn element not found during event listener assignment!');
    }

    // Event listener untuk input diskon dan pajak
    if (discountAmountInput) {
        discountAmountInput.addEventListener('input', updateTotals);
    }
    if (taxPercentageInput) {
        taxPercentageInput.addEventListener('input', updateTotals);
    }


    // --- Initialization ---
    fetchProducts();
    updateCartDisplay();
});
