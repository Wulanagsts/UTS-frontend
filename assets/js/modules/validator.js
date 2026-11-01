// Pola regex standar untuk format email (Modul 6)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Apakah seluruh kolom valid?
export const isValid = (errors) => Object.keys(errors).length === 0;

// Ambil pesan galat pertama (untuk kotak feedback)
export const getFirstError = (errors) => Object.values(errors)[0];

// Validasi Data Lahan
export const validateLahan = (data, lahanList, editingId = null) => {
    const errors = {};

    if (!data.nama) {
        errors.nama = 'Nama lahan wajib diisi!';
    } else {
        // Nama lahan tidak boleh kembar
        const duplicate = lahanList.some(
            (lahan) =>
                lahan.id !== editingId &&
                lahan.nama.toLowerCase() === data.nama.toLowerCase()
        );

        if (duplicate) {
            errors.nama = `Data lahan dengan nama "${data.nama}" sudah ada!`;
        }
    }

    if (!data.lokasi) {
        errors.lokasi = 'Lokasi lahan wajib diisi!';
    }

    if (Number.isNaN(data.luas) || data.luas <= 0) {
        errors.luas = 'Luas lahan harus berupa angka lebih dari 0!';
    }

    if (!data.jenisTanah) {
        errors.jenisTanah = 'Silakan pilih jenis tanah!';
    }

    return errors;
};

// Validasi Data Tanaman
export const validateTanaman = (data, tanamanList, editingId = null) => {
    const errors = {};

    if (!data.nama) {
        errors.nama = 'Nama tanaman wajib diisi!';
    } else if (data.lahanId) {
        // Tanaman yang sama tidak boleh didaftarkan dua kali pada lahan yang sama
        const duplicate = tanamanList.some(
            (tanaman) =>
                tanaman.id !== editingId &&
                Number(tanaman.lahanId) === data.lahanId &&
                tanaman.nama.toLowerCase() === data.nama.toLowerCase()
        );

        if (duplicate) {
            errors.nama = `Tanaman "${data.nama}" sudah terdaftar pada lahan tersebut!`;
        }
    }

    if (!data.jenis) {
        errors.jenis = 'Silakan pilih jenis tanaman!';
    }

    if (!data.lahanId) {
        errors.lahanId = 'Silakan pilih lahan tempat tanaman ditanam!';
    }

    if (!data.tanggal) {
        errors.tanggal = 'Tanggal tanam wajib diisi!';
    }

    return errors;
};

// Validasi Registrasi
export const validateRegister = (data) => {
    const errors = {};

    // Username minimal 4 karakter
    if (data.username.length < 4) {
        errors.username = 'Username minimal terdiri dari 4 karakter!';
    }

    // Format email memakai regex
    if (!EMAIL_REGEX.test(data.email)) {
        errors.email = 'Format email tidak valid (contoh: user@stikom.ac.id)!';
    }

    // Password minimal 6 karakter
    if (data.password.length < 6) {
        errors.password = 'Password minimal terdiri dari 6 karakter!';
    }

    // Konfirmasi password harus sama
    if (
        data.confirmPassword === '' ||
        data.confirmPassword !== data.password
    ) {
        errors.confirmPassword =
            'Konfirmasi password tidak cocok dengan password!';
    }

    return errors;
};