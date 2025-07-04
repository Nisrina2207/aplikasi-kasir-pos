// aplikasi-kasir/frontend/js/usersPage.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired on usersPage.js');

    if (!window.location.pathname.endsWith('/users') && !window.location.pathname.endsWith('/users.html')) {
        console.log('Not on users page, skipping users page logic.');
        return;
    }

    // --- DOM Elements ---
    const usersTableBody = document.getElementById('usersTableBody');
    const userMessage = document.getElementById('userMessage');
    const addUserBtn = document.getElementById('addUserBtn');
    const userModal = document.getElementById('userModal');
    const userModalLabel = document.getElementById('userModalLabel');
    const userForm = document.getElementById('userForm');
    const userIdInput = document.getElementById('userId');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const roleSelect = document.getElementById('role');

    let currentUserId = null;

    // --- Helper Functions ---
    function showMessage(message, type = 'info') {
        if (userMessage) {
            userMessage.textContent = message;
            userMessage.className = `alert mt-3 alert-${type}`;
            userMessage.classList.remove('d-none');
            setTimeout(() => {
                userMessage.classList.add('d-none');
            }, 5000);
        } else {
            console.warn('Element with ID "userMessage" not found. Message:', message);
            if (type === 'danger' || type === 'warning') {
                alert(message);
            }
        }
    }

    async function fetchUsers() {
        usersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Memuat pengguna...</td></tr>';
        try {
            const response = await apiFetch('http://localhost:5000/api/users');
            if (!response.ok) {
                const errorData = await response.json();
                showMessage(`Gagal memuat pengguna: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                usersTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Gagal memuat pengguna.</td></tr>`;
                return;
            }
            const users = await response.json();
            console.log('Fetched users:', users);
            displayUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            showMessage('Terjadi kesalahan jaringan saat memuat pengguna.', 'danger');
            usersTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Terjadi kesalahan jaringan.</td></tr>`;
        }
    }

    function displayUsers(users) {
        usersTableBody.innerHTML = '';
        if (!users || users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada pengguna.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = usersTableBody.insertRow();
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleString('id-ID') : 'N/A'}</td>
                <td>
                    <button class="btn btn-warning btn-sm edit-btn" data-id="${user.id}"
                            data-toggle="modal" data-target="#userModal">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${user.id}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            `;
        });
    }

    async function saveUser(userData) {
        let url;
        let method;

        if (currentUserId) {
            url = `http://localhost:5000/api/users/${currentUserId}`;
            method = 'PUT';
        } else {
            // PERUBAHAN DI SINI: Untuk tambah pengguna baru, panggil /api/users/register
            url = 'http://localhost:5000/api/users/register';
            method = 'POST';
        }

        try {
            const response = await apiFetch(url, {
                method: method,
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                showMessage(errorData.message || errorData.errors && errorData.errors[0].msg || 'Gagal menyimpan pengguna.', 'danger');
                console.error('API Error:', errorData);
                return false;
            }

            showMessage(`Pengguna berhasil di${currentUserId ? 'perbarui' : 'tambahkan'}!`, 'success');
            $('#userModal').modal('hide');
            userForm.reset();
            userIdInput.value = '';
            passwordInput.setAttribute('required', 'required');
            currentUserId = null;
            fetchUsers();
            return true;

        } catch (error) {
            console.error('Error saving user:', error);
            showMessage('Terjadi kesalahan jaringan saat menyimpan pengguna.', 'danger');
            return false;
        }
    }

    async function deleteUser(userId) {
        if (!confirm('Anda yakin ingin menghapus pengguna ini?')) {
            return;
        }
        try {
            const response = await apiFetch(`http://localhost:5000/api/users/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                showMessage(errorData.message || 'Gagal menghapus pengguna.', 'danger');
                return;
            }

            showMessage('Pengguna berhasil dihapus!', 'success');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showMessage('Terjadi kesalahan jaringan saat menghapus pengguna.', 'danger');
        }
    }

    // --- Event Listeners ---
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            userModalLabel.textContent = 'Tambah Pengguna Baru';
            userForm.reset();
            userIdInput.value = '';
            passwordInput.setAttribute('required', 'required');
            currentUserId = null;
        });
    }

    userForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const userData = {
            username: usernameInput.value,
            role: roleSelect.value
        };

        if (passwordInput.value) {
            userData.password = passwordInput.value;
        } else if (!currentUserId) {
            showMessage('Password wajib untuk pengguna baru.', 'warning');
            return;
        }

        if (!userData.username || userData.username.length < 3) {
            showMessage('Username harus diisi dan minimal 3 karakter.', 'warning');
            return;
        }
        if (userData.password && userData.password.length < 6) {
            showMessage('Password minimal 6 karakter.', 'warning');
            return;
        }

        await saveUser(userData);
    });

    usersTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const userId = target.closest('button')?.dataset.id;

        if (!userId) return;

        if (target.closest('.edit-btn')) {
            userModalLabel.textContent = 'Edit Pengguna';
            currentUserId = userId;
            passwordInput.removeAttribute('required');
            passwordInput.value = '';

            try {
                const response = await apiFetch(`http://localhost:5000/api/users/${userId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    showMessage(`Gagal memuat data pengguna: ${errorData.message || 'Error tidak diketahui'}`, 'danger');
                    return;
                }
                const user = await response.json();
                userIdInput.value = user.id;
                usernameInput.value = user.username;
                roleSelect.value = user.role;

                $('#userModal').modal('show');
            } catch (error) {
                console.error('Error fetching user for edit:', error);
                showMessage('Terjadi kesalahan saat memuat data pengguna untuk diedit.', 'danger');
            }
        } else if (target.closest('.delete-btn')) {
            await deleteUser(userId);
        }
    });

    // --- Initialization ---
    fetchUsers();
});
