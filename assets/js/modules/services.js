// Semua logika data dan localStorage.
// DATA AWAL LAHAN
const LahanDataset = [
    {
        id: 1,
        nama: 'Sawah Blok A',
        lokasi: 'Desa Grogol, Banyuwangi',
        luas: 2.5,
        jenisTanah: 'Aluvial'
    },
    {
        id: 2,
        nama: 'Kebun Selatan',
        lokasi: 'Desa Sumberbaru, Banyuwangi',
        luas: 1.8,
        jenisTanah: 'Regosol'
    },
    {
        id: 3,
        nama: 'Lahan Perkebunan Utara',
        lokasi: 'Desa Kalibaru, Banyuwangi',
        luas: 3,
        jenisTanah: 'Latosol'
    }
];

// DATA AWAL TANAMAN
const TanamanDataset = [
    {
        id: 1,
        nama: 'Padi IR64',
        jenis: 'Pangan',
        lahanId: 1,
        tanggal: '2026-10-10'
    },
    {
        id: 2,
        nama: 'Cabai Merah',
        jenis: 'Hortikultura',
        lahanId: 2,
        tanggal: '2026-10-15'
    },
    {
        id: 3,
        nama: 'Kopi Arabika',
        jenis: 'Perkebunan',
        lahanId: 3,
        tanggal: '2026-10-20'
    }
];

const LAHAN_KEY = 'utsDataLahan';
const TANAMAN_KEY = 'utsDataTanaman';
const USER_KEY = 'utsRegisteredUser';

// HELPER
const cloneData = (data) => data.map((item) => ({ ...item }));
// reduce : ID baru = ID terbesar + 1
export const getNextId = (data) => {
    return data.reduce((max, item) => Math.max(max, item.id), 0) + 1;
};

// Amankan teks buatan pengguna sebelum dimasukkan lewat innerHTML
export const escapeHtml = (text) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text).replace(/[&<>"']/g, (char) => map[char]);
};

// LAHAN - LOAD, SAVE, RESET
export const loadLahan = () => {
    try {
        const saved = localStorage.getItem(LAHAN_KEY);
        if (saved !== null) {
            const data = JSON.parse(saved);
            if (Array.isArray(data)) {
                return data;
            }
        }
    } catch (error) {
        console.warn('[LAHAN] Gagal membaca localStorage:', error);
    }

    // Jika belum pernah ada data, gunakan data awal
    const initialData = cloneData(LahanDataset);
    saveLahan(initialData);
    return initialData;
};

export const saveLahan = (data) => {
    try {
        localStorage.setItem(LAHAN_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn('[LAHAN] Gagal menyimpan data:', error);
    }
};

export const resetLahan = () => {
    const initialData = cloneData(LahanDataset);
    saveLahan(initialData);
    return initialData;
};

//cari satu lahan berdasarkan ID
export const findLahanById = (data, id) => {
    return data.find((item) => item.id === id);
};

//hasil hapus (array baru, array asli tidak berubah)
export const removeLahanById = (data, id) => {
    return data.filter((item) => item.id !== id);
};

//pencarian nama/lokasi digabung filter jenis tanah
export const searchLahan = (data, keyword, jenisTanah) => {
    const key = keyword.trim().toLowerCase();

    return data.filter((item) => {
        const cocokKataKunci =
            key === '' ||
            item.nama.toLowerCase().includes(key) ||
            item.lokasi.toLowerCase().includes(key);

        const cocokJenis =
            jenisTanah === '' ||
            item.jenisTanah === jenisTanah;
        return cocokKataKunci && cocokJenis;
    });
};

// TANAMAN - LOAD, SAVE, RESET
export const loadTanaman = () => {
    try {
        const saved = localStorage.getItem(TANAMAN_KEY);
        if (saved !== null) {
            const data = JSON.parse(saved);
            if (Array.isArray(data)) {
                return data;
            }
        }
    } catch (error) {
        console.warn('[TANAMAN] Gagal membaca localStorage:', error);
    }

    // Jika belum pernah ada data, gunakan data awal
    const initialData = cloneData(TanamanDataset);
    saveTanaman(initialData);
    return initialData;
};

export const saveTanaman = (data) => {
    try {
        localStorage.setItem(TANAMAN_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn('[TANAMAN] Gagal menyimpan data:', error);
    }
};

export const resetTanaman = () => {
    const initialData = cloneData(TanamanDataset);
    saveTanaman(initialData);
    return initialData;
};

export const findTanamanById = (data, id) => {
    return data.find((item) => item.id === id);
};

export const removeTanamanById = (data, id) => {
    return data.filter((item) => item.id !== id);
};

// filter : hitung tanaman yang masih ditanam di sebuah lahan
// (lahan yang masih dipakai tanaman tidak boleh dihapus)
export const countTanamanByLahanId = (data, lahanId) => {
    return data.filter((item) => Number(item.lahanId) === lahanId).length;
};

export const searchTanaman = (data, keyword, jenis) => {
    const key = keyword.trim().toLowerCase();
    return data.filter((item) => {
        const cocokKataKunci =
            key === '' ||
            item.nama.toLowerCase().includes(key) ||
            item.jenis.toLowerCase().includes(key);

        const cocokJenis =
            jenis === '' ||
            item.jenis === jenis;
        return cocokKataKunci && cocokJenis;
    });
};

// reduce : total luas seluruh lahan (dibulatkan 2 desimal)
export const getTotalLuas = (data) => {
    const total = data.reduce((sum, item) => sum + Number(item.luas), 0);
    return Number(total.toFixed(2));
};

// PENGGUNA TERDAFTAR
// Disimpan di sessionStorage agar terbawa dari index.html ke halaman lai
export const saveUser = (userData) => {
    const user = {
        username: userData.username,
        email: userData.email
    };
    try {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
        console.warn('[USER] Gagal menyimpan pengguna:', error);
    }
    return user;
};

export const getUser = () => {
    try {
        const raw = sessionStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn('[USER] Gagal membaca pengguna:', error);
        return null;
    }
};