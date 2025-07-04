// src/frontend/js/productsPage.js

// Pastikan fungsi apiFetch dan formatRupiah sudah di global scope main.js
// JIKA ADA DI main.js, HAPUS FUNGSI INI DARI SINI:
/*
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    console.log('API Fetch - URL:', url);
    console.log('API Fetch - Token from localStorage (productsPage):', token ? 'Token found (' + token.substring(0, 10) + '...)' : 'No token found');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.warn('API Fetch (productsPage): No token available. This request might fail if authentication is required.');
    }

    const response = await fetch(url, { ...options, headers });

    console.log('API Fetch (productsPage) - Response Status:', response.status);
    console.log('API Fetch (productsPage) - Response URL:', response.url);

    if (response.status === 401 || response.status === 403) {
        console.error('API Fetch (productsPage): Received', response.status, 'Unauthorized/Forbidden. Session expired or invalid token.');
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        localStorage.removeItem('token');
        localStorage.removeItem('username'); // Gunakan 'username' bukan 'user'
        localStorage.removeItem('role'); // Hapus juga role
        window.location.href = 'index.html';
        // Penting: Throw error atau return response agar fungsi pemanggil tahu kalau ada masalah
        throw new Error('Unauthorized or Forbidden: Token invalid or insufficient permissions.');
    }

    if (!response.ok) {
        const errorData = await response.json();
        console.error('API Fetch (productsPage): HTTP Error response:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }

    return response;
}

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}
*/
// JIKA SUDAH ADA DI main.js, HAPUS BAGIAN DI ATAS INI


document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired on productsPage.js');
    
    // Pastikan ID ini sesuai dengan tbody di products.html
    const productTableBody = document.getElementById('productTableBody');
    const addProductForm = document.getElementById('addProductForm');
    const productMessage = document.getElementById('productMessage');
    const productCategorySelect = document.getElementById('productCategory');

    // Elemen untuk Modal Edit Produk
    const editProductModal = $('#editProductModal'); // Menggunakan jQuery untuk Bootstrap modal
    const editProductForm = document.getElementById('editProductForm');
    const editProductIdInput = document.getElementById('editProductId');
    const editProductNameInput = document.getElementById('editProductName');
    const editProductDescriptionInput = document.getElementById('editProductDescription');
    const editProductPriceInput = document.getElementById('editProductPrice');
    const editProductStockInput = document.getElementById('editProductStock');
    const editProductCategorySelect = document.getElementById('editProductCategory');
    const editProductBarcodeInput = document.getElementById('editProductBarcode');
    const editProductMessage = document.getElementById('editProductMessage');


    console.log('Elements found for productsPage:');
    console.log('  productTableBody:', productTableBody);
    console.log('  addProductForm:', addProductForm);
    console.log('  productMessage:', productMessage);
    console.log('  productCategorySelect:', productCategorySelect);
    console.log('  editProductModal (jQuery object):', editProductModal);


    // Fungsi untuk mengambil dan menampilkan produk dalam tabel
    async function fetchProducts() {
        if (!productTableBody) {
            console.error("productTableBody element not found!");
            return;
        }
        productTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Memuat produk...</td></tr>';
        try {
            const response = await apiFetch('http://localhost:5000/api/products');
            
            // apiFetch sekarang akan melempar error atau redirect, jadi response.ok sudah cukup
            if (!response.ok) { // Check response.ok setelah apiFetch
                const errorData = await response.json();
                console.error('Failed to fetch products:', errorData.message);
                productTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Gagal memuat produk: ${errorData.message || 'Error tidak diketahui'}.</td></tr>`;
                return;
            }

            const products = await response.json();

            productTableBody.innerHTML = ''; // Bersihkan tabel
            if (products.length === 0) {
                productTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada produk.</td></tr>';
                return;
            }

            products.forEach(product => {
                const row = productTableBody.insertRow();
                row.innerHTML = `
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.description || ''}</td>
                    <td>${formatRupiah(product.price)}</td>
                    <td>${product.stock}</td>
                    <td>${product.category_name || 'Tidak ada'}</td>
                    <td>
                        <button class="btn btn-warning btn-sm edit-product-btn" data-id="${product.id}">Edit</button>
                        <button class="btn btn-danger btn-sm delete-product-btn" data-id="${product.id}">Hapus</button>
                    </td>
                `;
            });
            addProductActionListeners(); // Panggil ini setelah semua produk di-render
        } catch (error) {
            console.error('Error saat fetch produk:', error);
            productTableBody.innerHTML = `<div class="col-12 text-center text-danger mt-5">Terjadi kesalahan saat memuat produk: ${error.message}. Periksa konsol untuk detail.</div>`;
        }
    }

    // Fungsi untuk menambahkan event listener ke tombol edit dan delete
    function addProductActionListeners() {
        document.querySelectorAll('.edit-product-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const productId = event.target.dataset.id;
                await populateEditModal(productId);
                editProductModal.modal('show'); // Tampilkan modal
            });
        });

        document.querySelectorAll('.delete-product-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const productId = event.target.dataset.id;
                if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                    await deleteProduct(productId);
                }
            });
        });
    }

    // Fungsi untuk mengisi form edit modal dengan data produk yang dipilih
    async function populateEditModal(productId) {
        editProductMessage.textContent = ''; // Bersihkan pesan sebelumnya
        editProductMessage.classList.remove('text-success', 'text-danger');

        try {
            // Ambil data produk berdasarkan ID
            const productResponse = await apiFetch(`http://localhost:5000/api/products/${productId}`);
            if (!productResponse.ok) {
                const errorData = await productResponse.json();
                throw new Error(errorData.message || 'Gagal mengambil data produk.');
            }
            const product = await productResponse.json();

            // Ambil daftar kategori (atau gunakan yang sudah di-cache jika memungkinkan)
            let categories = [];
            try {
                const categoryResponse = await apiFetch('http://localhost:5000/api/categories');
                if (categoryResponse.ok) {
                    categories = await categoryResponse.json();
                } else {
                    console.warn('Gagal memuat kategori untuk modal edit:', await categoryResponse.json());
                }
            } catch (catError) {
                console.error('Error fetching categories for edit modal:', catError);
            }

            // Isi form di modal
            editProductIdInput.value = product.id;
            editProductNameInput.value = product.name;
            editProductDescriptionInput.value = product.description || '';
            editProductPriceInput.value = product.price;
            editProductStockInput.value = product.stock;
            editProductBarcodeInput.value = product.barcode || '';

            editProductCategorySelect.innerHTML = '<option value="">Pilih Kategori</option>'; // Reset opsi
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                if (cat.id === product.category_id) {
                    option.selected = true; // Pilih kategori yang sesuai
                }
                editProductCategorySelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error populating edit modal:', error);
            editProductMessage.textContent = `Error: ${error.message}`;
            editProductMessage.classList.add('text-danger');
            // editProductModal.modal('hide'); // Opsional: Sembunyikan modal jika ada error fatal
            alert(`Gagal memuat data produk untuk diedit: ${error.message}`);
        }
    }

    // Fungsi untuk menghapus produk
    async function deleteProduct(productId) {
        try {
            const response = await apiFetch(`http://localhost:5000/api/products/${productId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Gagal menghapus produk.');
            }

            alert('Produk berhasil dihapus!');
            fetchProducts(); // Muat ulang daftar produk
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(`Gagal menghapus produk: ${error.message}`);
        }
    }


    // Fungsi untuk mengambil daftar kategori dari backend (untuk form tambah dan edit)
    async function fetchCategories() {
        try {
            const response = await apiFetch('http://localhost:5000/api/categories');
            if (!response.ok) {
                console.error('Failed to fetch categories:', await response.json());
                return;
            }
            const categories = await response.json();

            // Isi untuk form Tambah Produk
            if (productCategorySelect) {
                productCategorySelect.innerHTML = '<option value="">Pilih Kategori (opsional)</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    productCategorySelect.appendChild(option);
                });
            } else {
                console.warn('productCategorySelect element not found for add form.');
            }

            // Isi untuk form Edit Produk (akan dipanggil juga oleh populateEditModal)
            // Tidak perlu diisi di sini secara langsung, populateEditModal akan mengurusnya
            // agar kategori yang dipilih bisa langsung diset.

        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }


    // Event Listener untuk Formulir Tambah Produk
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const name = document.getElementById('productName').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const description = document.getElementById('productDescription').value;
            const stock = parseInt(document.getElementById('productStock').value);
            const barcode = document.getElementById('productBarcode').value;
            const category_id = productCategorySelect.value ? parseInt(productCategorySelect.value) : null;

            const newProductData = {
                name, description, price, stock, barcode, category_id
            };

            productMessage.textContent = 'Menambahkan produk...';
            productMessage.classList.remove('text-success', 'text-danger');

            try {
                const response = await apiFetch('http://localhost:5000/api/products', {
                    method: 'POST',
                    body: JSON.stringify(newProductData),
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    productMessage.textContent = errorData.error || errorData.message || 'Gagal menambahkan produk.';
                    productMessage.classList.add('text-danger');
                    console.error('Error from API (POST product):', errorData);
                    return;
                }

                const data = await response.json();
                productMessage.textContent = 'Produk berhasil ditambahkan!';
                productMessage.classList.add('text-success');
                addProductForm.reset();
                fetchProducts(); // Muat ulang daftar produk
                fetchCategories(); // Muat ulang kategori juga (jika ada perubahan)

            } catch (error) {
                productMessage.textContent = 'Terjadi kesalahan jaringan atau server tidak dapat dijangkau.';
                productMessage.classList.add('text-danger');
                console.error('Error saat submit produk:', error);
            }
        });
    } else {
        console.error('Error: addProductForm element not found! Cannot attach event listener.');
    }

    // Event Listener untuk Formulir Edit Produk
    if (editProductForm) {
        editProductForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const productId = editProductIdInput.value;
            const productName = editProductNameInput.value;
            const productDescription = editProductDescriptionInput.value;
            const productPrice = parseFloat(editProductPriceInput.value);
            const productStock = parseInt(editProductStockInput.value);
            const productBarcode = editProductBarcodeInput.value;
            const productCategoryId = editProductCategorySelect.value ? parseInt(editProductCategorySelect.value) : null;

            const updatedProductData = {
                name: productName,
                description: productDescription,
                price: productPrice,
                stock: productStock,
                barcode: productBarcode || null,
                category_id: productCategoryId
            };

            editProductMessage.textContent = 'Menyimpan perubahan...';
            editProductMessage.classList.remove('text-success', 'text-danger');

            try {
                const response = await apiFetch(`http://localhost:5000/api/products/${productId}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedProductData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || errorData.message || 'Gagal memperbarui produk.');
                }

                editProductMessage.textContent = 'Produk berhasil diperbarui!';
                editProductMessage.classList.add('text-success');

                setTimeout(() => {
                    editProductModal.modal('hide');
                    fetchProducts(); // Muat ulang daftar produk untuk menampilkan perubahan
                }, 1000);

            } catch (error) {
                console.error('Error updating product:', error);
                editProductMessage.textContent = `Error: ${error.message}`;
                editProductMessage.classList.add('text-danger');
            }
        });
    } else {
        console.error('Error: editProductForm element not found! Cannot attach event listener.');
    }


    // Panggil fungsi saat halaman produk dimuat
    fetchProducts();
    fetchCategories();
});