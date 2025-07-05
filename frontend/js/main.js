// src/frontend/js/main.js
// Fungsi-fungsi ini didefinisikan di global scope agar bisa diakses oleh semua script halaman

// ====================================================================================
// PENTING: BASE_URL UNTUK VERCEL API ROUTES
// Karena backend sekarang di-deploy sebagai Vercel API Routes di domain yang sama,
// kita bisa menggunakan path relatif.
const BASE_URL = '/api'; 
// ====================================================================================

// Menambahkan parameter skipAuthCheck
async function apiFetch(url, options = {}, skipAuthCheck = false) {
    const token = localStorage.getItem('token');
    console.log('API Fetch - URL:', url);
    console.log('API Fetch - Token from localStorage (main.js):', token ? 'Token found (' + token.substring(0, 10) + '...)' : 'No token found');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Logika otentikasi hanya berjalan jika skipAuthCheck adalah false
    if (!skipAuthCheck) {
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.warn('API Fetch (main.js): No token available in localStorage. Redirecting to login.');
            alert('Sesi Anda telah berakhir atau Anda tidak memiliki akses. Silakan login kembali.');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            window.location.href = 'index.html';
            throw new Error('Unauthorized: No token found or token expired.');
        }
    } else {
        console.log('API Fetch (main.js): Skipping authentication check for public URL.');
    }

    try {
        const response = await fetch(url, { ...options, headers });

        console.log('API Fetch (main.js) - Response Status:', response.status);
        console.log('API Fetch (main.js) - Response URL:', response.url);

        // Hanya cek 401/403 jika otentikasi tidak dilewati
        if (!skipAuthCheck && (response.status === 401 || response.status === 403)) {
            console.error('API Fetch (main.js): Received', response.status, 'Unauthorized/Forbidden. Session expired or invalid token.');
            alert('Sesi Anda telah berakhir atau Anda tidak memiliki akses. Silakan login kembali.');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            window.location.href = 'index.html';
            throw new Error('Unauthorized or Forbidden: Token invalid or insufficient permissions.');
        }

        if (!response.ok) {
            // Jika response tidak OK, coba parse errorData jika ada
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json();
                console.error('API Fetch (main.js): HTTP Error response:', errorData);
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${response.status}`);
            } else {
                // Jika bukan JSON, baca sebagai teks
                const errorText = await response.text();
                console.error('API Fetch (main.js): HTTP Error response (text):', errorText);
                throw new Error(`HTTP error! Status: ${response.status}. Response: ${errorText.substring(0, 100)}...`);
            }
        }

        return response;
    } catch (error) {
        console.error('Network or Fetch Error in apiFetch (main.js):', error);
        // Alert hanya jika ini bukan error yang disebabkan oleh redirect 401/403 yang sudah ditangani
        if (!error.message.includes('Unauthorized') && !error.message.includes('Forbidden')) {
            alert('Terjadi masalah koneksi ke server. Silakan coba lagi nanti.');
        }
        throw error;
    }
}

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const userGreeting = document.getElementById('userGreeting');

    function updateUserGreeting() {
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role');
        if (username && userGreeting) {
            userGreeting.textContent = `Halo, ${username}! (${role || 'Pengguna'})`;
        } else if (userGreeting) {
            userGreeting.textContent = 'Halo, Pengguna!';
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            alert('Anda telah logout.');
            window.location.href = 'index.html';
        });
    }

    updateUserGreeting();
});
