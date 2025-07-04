// file: aplikasi-kasir/frontend/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('loginMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Mencegah reload halaman

            const username = usernameInput.value;
            const password = passwordInput.value;

            loginMessage.textContent = ''; // Clear previous messages
            loginMessage.classList.remove('text-success', 'text-danger'); // Clear classes

            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });
                
                const data = await response.json(); // Ambil data JSON terlepas dari status response

                if (response.ok) {
                    // --- PERBAIKAN UTAMA DI SINI ---
                    localStorage.setItem('token', data.token); // KEY HARUS 'token'
                    localStorage.setItem('username', data.user.username); // Simpan username secara terpisah
                    localStorage.setItem('role', data.user.role);       // Simpan role secara terpisah
                    
                    // Bersihkan key lama yang tidak konsisten jika ada
                    localStorage.removeItem('user'); // Hapus key 'user' yang menyimpan objek JSON
                    localStorage.removeItem('jwToken'); // Hapus key 'jwToken' jika pernah ada
                    // --- AKHIR PERBAIKAN UTAMA ---

                    loginMessage.textContent = 'Login berhasil! Mengalihkan...';
                    loginMessage.classList.add('text-success');
                    window.location.href = 'dashboard.html'; // Atau 'products.html'
                } else {
                    loginMessage.textContent = data.message || 'Login gagal. Silakan coba lagi.';
                    loginMessage.classList.add('text-danger');
                    console.error('Login failed response:', data);
                }
            } catch (error) {
                console.error('Terjadi kesalahan jaringan atau server tidak dapat dijangkau:', error);
                loginMessage.textContent = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
                loginMessage.classList.add('text-danger');
            }
        });
    } else {
        console.error('Error: loginForm element not found in auth.js!');
    }
});