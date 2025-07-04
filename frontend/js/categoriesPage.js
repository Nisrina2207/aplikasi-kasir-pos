// aplikasi-kasir/frontend/js/categoriesPage.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired on categoriesPage.js');

    // Cek apakah pathname berakhir dengan '/categories' atau '/categories.html'
    if (!window.location.pathname.endsWith('/categories') && !window.location.pathname.endsWith('/categories.html')) {
        console.log('Not on categories page, skipping categories page logic.');
        return;
    }

    // --- DOM Elements ---
    const categoryForm = document.getElementById('categoryForm');
    const categoryIdInput = document.getElementById('categoryId');
    const categoryNameInput = document.getElementById('categoryName');
    const categoryDescriptionInput = document.getElementById('categoryDescription');
    const categoriesTableBody = document.getElementById('categoriesTableBody');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const categoryMessageDiv = document.getElementById('categoryMessage');

    // --- Helper Functions ---
    function showMessage(message, type = 'info') {
        if (categoryMessageDiv) {
            categoryMessageDiv.textContent = message;
            categoryMessageDiv.className = `alert mt-3 alert-${type}`;
            categoryMessageDiv.classList.remove('d-none');
            setTimeout(() => { categoryMessageDiv.classList.add('d-none'); }, 5000);
        } else {
            console.warn('Element with ID "categoryMessage" not found. Message:', message);
            if (type === 'danger' || type === 'warning') {
                alert(message);
            }
        }
    }

    // Fetch Categories
    async function fetchCategories() {
        categoriesTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Memuat kategori...</td></tr>';
        try {
            // Panggil apiFetch dengan skipAuthCheck = true untuk kategori
            const response = await apiFetch('http://localhost:5000/api/categories', {}, true); // PERUBAHAN DI SINI
            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal memuat kategori: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                categoriesTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Gagal memuat kategori.</td></tr>';
                return;
            }
            const categories = await response.json();
            displayCategories(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showMessage('Terjadi kesalahan jaringan saat memuat kategori.', 'danger');
            categoriesTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Terjadi kesalahan jaringan.</td></tr>';
        }
    }

    // Display Categories
    function displayCategories(categories) {
        categoriesTableBody.innerHTML = '';
        if (!categories || categories.length === 0) {
            categoriesTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Tidak ada kategori ditemukan.</td></tr>';
            return;
        }

        categories.forEach(category => {
            const row = categoriesTableBody.insertRow();
            row.innerHTML = `
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>${category.description || 'N/A'}</td>
                <td>
                    <button class="btn btn-warning btn-sm edit-btn" data-id="${category.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${category.id}"><i class="fas fa-trash"></i> Hapus</button>
                </td>
            `;
        });
    }

    // Handle Form Submission (Add/Edit Category)
    categoryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const id = categoryIdInput.value;
        const name = categoryNameInput.value;
        const description = categoryDescriptionInput.value;

        const categoryData = { name, description };

        try {
            let response;
            if (id) {
                // Edit Category (PUT request)
                response = await apiFetch(`http://localhost:5000/api/categories/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(categoryData)
                });
            } else {
                // Add New Category (POST request)
                response = await apiFetch('http://localhost:5000/api/categories', {
                    method: 'POST',
                    body: JSON.stringify(categoryData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal menyimpan kategori: ${errorData.message || errorData.error || 'Error tidak diketahui'}`, 'danger');
                return;
            }

            showMessage(`Kategori berhasil ${id ? 'diperbarui' : 'ditambahkan'}!`, 'success');
            categoryForm.reset();
            categoryIdInput.value = '';
            cancelEditBtn.style.display = 'none';
            fetchCategories(); // Refresh category list
        } catch (error) {
            console.error('Error saving category:', error);
            showMessage('Terjadi kesalahan jaringan saat menyimpan kategori.', 'danger');
        }
    });

    // Handle Edit/Delete Buttons
    categoriesTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.closest('button')?.dataset.id;

        if (!id) return;

        if (target.closest('.edit-btn')) {
            // Populate form for editing
            try {
                const response = await apiFetch(`http://localhost:5000/api/categories/${id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    showMessage(`Gagal memuat data kategori untuk diedit: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                    return;
                }
                const category = await response.json();
                categoryIdInput.value = category.id;
                categoryNameInput.value = category.name;
                categoryDescriptionInput.value = category.description || '';
                cancelEditBtn.style.display = 'inline-block';
            } catch (error) {
                console.error('Error fetching category for edit:', error);
                showMessage('Terjadi kesalahan jaringan saat memuat kategori untuk diedit.', 'danger');
            }
        } else if (target.closest('.delete-btn')) {
            // Delete category
            if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
                try {
                    const response = await apiFetch(`http://localhost:5000/api/categories/${id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        showMessage(`Gagal menghapus kategori: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                        return;
                    }

                    showMessage('Kategori berhasil dihapus!', 'success');
                    fetchCategories(); // Refresh category list
                } catch (error) {
                    console.error('Error deleting category:', error);
                    showMessage('Terjadi kesalahan jaringan saat menghapus kategori.', 'danger');
                }
            }
        }
    });

    cancelEditBtn.addEventListener('click', () => {
        categoryForm.reset();
        categoryIdInput.value = '';
        cancelEditBtn.style.display = 'none';
    });

    // --- Initialization ---
    fetchCategories(); // Initial load of categories
});
