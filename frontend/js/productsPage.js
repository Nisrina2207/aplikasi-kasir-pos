// aplikasi-kasir/frontend/js/productsPage.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired on productsPage.js');

    // Cek apakah pathname berakhir dengan '/products' atau '/products.html'
    if (!window.location.pathname.endsWith('/products') && !window.location.pathname.endsWith('/products.html')) {
        console.log('Not on products page, skipping products page logic.');
        return;
    }

    // --- DOM Elements ---
    const productForm = document.getElementById('productForm');
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productName');
    const productDescriptionInput = document.getElementById('productDescription');
    const productPriceInput = document.getElementById('productPrice');
    const productStockInput = document.getElementById('productStock');
    const productCategorySelect = document.getElementById('productCategory');
    const productBarcodeInput = document.getElementById('productBarcode');
    const productsTableBody = document.getElementById('productsTableBody');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const productMessageDiv = document.getElementById('productMessage');

    // --- Helper Functions ---
    function showMessage(message, type = 'info') {
        if (productMessageDiv) {
            productMessageDiv.textContent = message;
            productMessageDiv.className = `alert mt-3 alert-${type}`;
            productMessageDiv.classList.remove('d-none');
            setTimeout(() => { productMessageDiv.classList.add('d-none'); }, 5000);
        } else {
            console.warn('Element with ID "productMessage" not found. Message:', message);
            if (type === 'danger' || type === 'warning') {
                alert(message);
            }
        }
    }

    // Fetch Categories for dropdown
    async function fetchCategories() {
        try {
            // Panggil apiFetch dengan skipAuthCheck = true untuk kategori
            const response = await apiFetch('http://localhost:5000/api/categories', {}, true); // PASTIKAN true DI SINI
            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal memuat kategori: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                return;
            }
            const categories = await response.json();
            productCategorySelect.innerHTML = '<option value="">Pilih Kategori</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                productCategorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            showMessage('Terjadi kesalahan jaringan saat memuat kategori.', 'danger');
        }
    }

    // Fetch Products
    async function fetchProducts() {
        productsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Memuat produk...</td></tr>';
        try {
            // Panggil apiFetch dengan skipAuthCheck = true untuk produk
            const response = await apiFetch('http://localhost:5000/api/products', {}, true); // PASTIKAN true DI SINI
            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal memuat produk: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                productsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Gagal memuat produk.</td></tr>';
                return;
            }
            const products = await response.json();
            displayProducts(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            showMessage('Terjadi kesalahan jaringan saat memuat produk.', 'danger');
            productsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Terjadi kesalahan jaringan.</td></tr>';
        }
    }

    // Display Products
    function displayProducts(products) {
        productsTableBody.innerHTML = '';
        if (!products || products.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Tidak ada produk ditemukan.</td></tr>';
            return;
        }

        products.forEach(product => {
            const row = productsTableBody.insertRow();
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${formatRupiah(product.price)}</td>
                <td>${product.stock}</td>
                <td>${product.category_name || 'N/A'}</td>
                <td>${product.barcode || 'N/A'}</td>
                <td>
                    <button class="btn btn-warning btn-sm edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i> Hapus</button>
                </td>
            `;
        });
    }

    // Handle Form Submission (Add/Edit Product)
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const id = productIdInput.value;
        const name = productNameInput.value;
        const description = productDescriptionInput.value;
        const price = parseFloat(productPriceInput.value);
        const stock = parseInt(productStockInput.value);
        const category_id = productCategorySelect.value || null;
        const barcode = productBarcodeInput.value || null;

        const productData = { name, description, price, stock, category_id, barcode };

        try {
            let response;
            // Untuk operasi POST/PUT/DELETE, kita TIDAK skipAuthCheck karena ini operasi yang dilindungi
            if (id) {
                // Edit Product (PUT request)
                response = await apiFetch(`http://localhost:5000/api/products/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(productData)
                });
            } else {
                // Add New Product (POST request)
                response = await apiFetch('http://localhost:5000/api/products', {
                    method: 'POST',
                    body: JSON.stringify(productData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal menyimpan produk: ${errorData.message || errorData.error || 'Error tidak diketahui'}`, 'danger');
                return;
            }

            showMessage(`Produk berhasil ${id ? 'diperbarui' : 'ditambahkan'}!`, 'success');
            productForm.reset();
            productIdInput.value = '';
            cancelEditBtn.style.display = 'none';
            fetchProducts(); // Refresh product list
        } catch (error) {
            console.error('Error saving product:', error);
            showMessage('Terjadi kesalahan jaringan saat menyimpan produk.', 'danger');
        }
    });

    // Handle Edit/Delete Buttons
    productsTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.closest('button')?.dataset.id;

        if (!id) return;

        if (target.closest('.edit-btn')) {
            // Populate form for editing
            try {
                // Untuk mengambil data produk untuk diedit, kita TIDAK skipAuthCheck karena ini adalah operasi yang dilindungi admin
                const response = await apiFetch(`http://localhost:5000/api/products/${id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    showMessage(`Gagal memuat data produk untuk diedit: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                    return;
                }
                const product = await response.json();
                productIdInput.value = product.id;
                productNameInput.value = product.name;
                productDescriptionInput.value = product.description;
                productPriceInput.value = product.price;
                productStockInput.value = product.stock;
                productCategorySelect.value = product.category_id || '';
                productBarcodeInput.value = product.barcode || '';
                cancelEditBtn.style.display = 'inline-block';
            } catch (error) {
                console.error('Error fetching product for edit:', error);
                showMessage('Terjadi kesalahan jaringan saat memuat produk untuk diedit.', 'danger');
            }
        } else if (target.closest('.delete-btn')) {
            // Delete product
            if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                try {
                    // Untuk menghapus produk, kita TIDAK skipAuthCheck karena ini operasi yang dilindungi admin
                    const response = await apiFetch(`http://localhost:5000/api/products/${id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        showMessage(`Gagal menghapus produk: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                        return;
                    }

                    showMessage('Produk berhasil dihapus!', 'success');
                    fetchProducts(); // Refresh product list
                } catch (error) {
                    console.error('Error deleting product:', error);
                    showMessage('Terjadi kesalahan jaringan saat menghapus produk.', 'danger');
                }
            }
        }
    });

    cancelEditBtn.addEventListener('click', () => {
        productForm.reset();
        productIdInput.value = '';
        cancelEditBtn.style.display = 'none';
    });

    // --- Initialization ---
    fetchCategories(); // Load categories for the dropdown
    fetchProducts();   // Load products into the table
});
