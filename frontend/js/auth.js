// src/frontend/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Mencegah pengiriman form default

            const username = loginForm.username.value;
            const password = loginForm.password.value;

            loginMessage.textContent = ''; // Bersihkan pesan sebelumnya
            loginMessage.className = ''; // Bersihkan kelas sebelumnya

            try {
                // Menggunakan BASE_URL yang didefinisikan di main.js
                // Pastikan main.js dimuat sebelum auth.js di index.html
                const response = await fetch(`${BASE_URL}/auth/login`, { // Menggunakan BASE_URL
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('role', data.role);

                    loginMessage.textContent = 'Login berhasil! Mengarahkan ke dashboard...';
                    loginMessage.className = 'text-green-500'; // Warna hijau untuk sukses
                    window.location.href = 'dashboard.html'; // Arahkan ke dashboard
                } else {
                    const errorData = await response.json();
                    loginMessage.textContent = errorData.message || 'Login gagal. Periksa kredensial Anda.';
                    loginMessage.className = 'text-red-500'; // Warna merah untuk error
                }
            } catch (error) {
                console.error('Terjadi kesalahan jaringan atau server tidak dapat dijangkau:', error);
                loginMessage.textContent = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
                loginMessage.className = 'text-red-500'; // Warna merah untuk error
            }
        });
    }
});
