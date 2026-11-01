import {
    loadLahan, saveLahan, resetLahan, findLahanById, removeLahanById, searchLahan,
    loadTanaman, saveTanaman, resetTanaman, findTanamanById, removeTanamanById,
    countTanamanByLahanId, searchTanaman,
    getNextId, getTotalLuas, saveUser, getUser
} from './modules/services.js';
import {
    validateLahan, validateTanaman, validateRegister, isValid, getFirstError
} from './modules/validator.js';
import {
    $, showFeedback, applyValidation, clearValidation, getRegisterFormValues,
    getLahanFormValues, renderLahanPreview, renderLahanTable, setLahanEditMode, setLahanAddMode,
    getTanamanFormValues, renderTanamanPreview, renderTanamanTable, setTanamanEditMode, setTanamanAddMode,
    renderDashboard, renderLahanCards, renderTanamanCards
} from './modules/ui_renderer.js';

// Menu navigasi
const initNavToggle = () => {
    const toggle = $('.nav-toggle');
    const menu = $('.nav-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('show');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
    });
};

// Halaman Registrasi
const initRegisterPage = () => {
    // Pemetaan nama kolom data -> selector input (untuk border/pesan galat per kolom)
    const REGISTER_FIELDS = {
        username: '#reg-username',
        email: '#reg-email',
        password: '#reg-password',
        confirmPassword: '#reg-confirm-password'
    };

    const form = $('#register-form');

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // cegah reload halaman

        const data = getRegisterFormValues();
        const errors = validateRegister(data);
        applyValidation(REGISTER_FIELDS, errors);

        if (!isValid(errors)) {
            console.warn('[VALIDASI] Registrasi gagal:', errors);
            return;
        }

        const newUser = saveUser({ username: data.username, email: data.email });
        console.log('[REGISTRASI] Berhasil, payload siap dikirim ke POST /api/v1/auth/register:', newUser);
        // Langsung masuk ke sistem
        window.location.href = 'dashboard.html';
    });
};

// Halaman Dashboard
const initDashboardPage = (user) => {
    const lahanList = loadLahan();
    const tanamanList = loadTanaman();
    renderDashboard(lahanList, tanamanList, getTotalLuas(lahanList), user);
    console.log(`[DASHBOARD] ${lahanList.length} lahan, ${tanamanList.length} tanaman, total luas ${getTotalLuas(lahanList)} Ha`);
};

// Halaman Kelola Lahan (data-lahan.html): Tambah, Edit, Hapus, Cari
const initLahanPage = () => {
    // Pemetaan nama kolom data -> selector input (untuk border merah/hijau per kolom)
    const LAHAN_FIELDS = {
        nama: '#lahan-nama',
        lokasi: '#lahan-lokasi',
        luas: '#lahan-luas',
        jenisTanah: '#lahan-jenis-tanah'
    };
    // State hanya hidup di dalam fungsi ini (bukan variabel global)
    let lahanList = loadLahan();
    let editingId = null;   // null = mode tambah, angka = ID lahan yang sedang diedit
    let highlightId = null; // baris yang disorot setelah ditambah/diedit

    const form = $('#lahan-form');
    const getVisible = () => searchLahan(lahanList, $('#search-lahan').value, $('#filter-jenis-tanah').value);
    const refreshTable = () => {
        renderLahanTable({ visible: getVisible(), total: lahanList.length, editingId, highlightId });
        highlightId = null;
    };

    // ---------- Mode Tambah / Edit ----------
    const enterEditMode = (id) => {
        const lahan = findLahanById(lahanList, id);
        if (!lahan) return;

        editingId = id;
        clearValidation('#lahan-form');
        setLahanEditMode(lahan);
        showFeedback('#lahan-feedback', `Mengedit lahan ID ${id}: ${lahan.nama}`, 'info');
        refreshTable();
        console.log('[EDIT] Mode edit dibuka untuk lahan:', lahan);
    };

    const exitEditMode = () => {
        editingId = null;
        clearValidation('#lahan-form');
        setLahanAddMode();
    };

    // ---------- Hapus ----------
    const handleDeleteLahan = (id) => {
        const lahan = findLahanById(lahanList, id);
        const row = $(`#lahan-table-body tr[data-id="${id}"]`);
        if (!lahan || (row && row.classList.contains('fade-out'))) return;

        // Integritas referensial: lahan yang masih dipakai tanaman tidak boleh dihapus
        const jumlahTanaman = countTanamanByLahanId(loadTanaman(), id);
        if (jumlahTanaman > 0) {
            showFeedback(
                '#lahan-feedback',
                `Lahan '${lahan.nama}' tidak bisa dihapus karena masih dipakai ${jumlahTanaman} tanaman. Hapus tanamannya terlebih dahulu.`,
                'error'
            );
            console.warn(`[HAPUS] Ditolak: lahan ID ${id} masih dipakai ${jumlahTanaman} tanaman.`);
            return;
        }

        const finishDelete = () => {
            lahanList = removeLahanById(lahanList, id);
            saveLahan(lahanList);

            if (editingId === id) exitEditMode();
            refreshTable();
            showFeedback('#lahan-feedback', `Lahan '${lahan.nama}' berhasil dihapus.`, 'success');
            console.log(`[HAPUS] Lahan ID ${id} (${lahan.nama}) dihapus. Sisa lahan: ${lahanList.length}`);
            console.table(lahanList);
        };

        if (row) {
            row.classList.add('fade-out');
            setTimeout(finishDelete, 300);
        } else {
            finishDelete();
        }
    };

    // ---------- Event ----------
    renderLahanPreview();
    refreshTable();
    console.log(`Data lahan dimuat: ${lahanList.length} lahan`);
    console.table(lahanList);

    // Live preview: event 'input' dan 'change'
    form.addEventListener('input', renderLahanPreview);
    form.addEventListener('change', renderLahanPreview);

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const data = getLahanFormValues();
        const errors = validateLahan(data, lahanList, editingId);
        applyValidation(LAHAN_FIELDS, errors, false); // pesan galat cukup di kotak feedback

        if (!isValid(errors)) {
            showFeedback('#lahan-feedback', getFirstError(errors), 'error');
            console.warn('[VALIDASI] Gagal:', errors);
            return;
        }

        let message;
        const index = lahanList.findIndex((item) => item.id === editingId);

        if (editingId !== null && index !== -1) {
            lahanList[index] = { ...lahanList[index], ...data };
            highlightId = editingId;
            message = `Lahan '${data.nama}' berhasil diperbarui.`;
            console.log('[EDIT] Lahan diperbarui:', lahanList[index]);
            exitEditMode();
        } else {
            const newLahan = { id: getNextId(lahanList), ...data };
            lahanList.push(newLahan);
            highlightId = newLahan.id;
            message = `Sukses! Lahan '${newLahan.nama}' (${newLahan.luas} Ha) tersimpan.`;
            console.log('[TAMBAH] Lahan baru ditambahkan:', newLahan);
            form.reset();
            clearValidation('#lahan-form');
            renderLahanPreview();
        }

        saveLahan(lahanList);
        refreshTable();
        showFeedback('#lahan-feedback', message, 'success');
        console.table(lahanList);
    });

    $('#btn-clear-lahan').addEventListener('click', () => {
        if (editingId !== null) {
            exitEditMode();
            refreshTable();
        } else {
            form.reset();
            clearValidation('#lahan-form');
            renderLahanPreview();
        }
        showFeedback('#lahan-feedback', '', '');
    });

    $('#btn-cancel-lahan').addEventListener('click', () => {
        exitEditMode();
        refreshTable();
        showFeedback('#lahan-feedback', 'Edit dibatalkan.', 'info');
        console.log('[EDIT] Dibatalkan.');
    });

    // Event delegation untuk semua tombol Edit/Hapus di tabel
    $('#lahan-table-body').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const id = Number(button.dataset.id);
        if (button.dataset.action === 'edit') enterEditMode(id);
        if (button.dataset.action === 'delete') handleDeleteLahan(id);
    });

    $('#search-lahan').addEventListener('input', () => {
        refreshTable();
        console.log(`[CARI] Kata kunci "${$('#search-lahan').value.trim()}" -> ${getVisible().length} lahan ditemukan`);
    });

    $('#filter-jenis-tanah').addEventListener('change', () => {
        refreshTable();
        console.log(`[FILTER] Jenis tanah "${$('#filter-jenis-tanah').value}" -> ${getVisible().length} lahan`);
    });

    // Reset mengembalikan lahan DAN tanaman agar relasinya tetap cocok
    $('#btn-reset-lahan').addEventListener('click', () => {
        lahanList = resetLahan();
        resetTanaman();
        $('#search-lahan').value = '';
        $('#filter-jenis-tanah').value = '';
        exitEditMode();
        refreshTable();
        showFeedback('#lahan-feedback', 'Data lahan dan tanaman dikembalikan ke dataset awal.', 'info');
        console.log('[RESET] Data dikembalikan ke dataset awal:', lahanList.length, 'lahan');
    });
};

// Halaman Kelola Tanaman (data-tanaman.html): Tambah, Edit, Hapus, Cari
const initTanamanPage = () => {
    // Pemetaan nama kolom data -> selector input (untuk border merah/hijau per kolom)
    const TANAMAN_FIELDS = {
        nama: '#tanaman-nama',
        jenis: '#tanaman-jenis',
        lahanId: '#tanaman-lahan',
        tanggal: '#tanaman-tanggal'
    };

    let lahanList = loadLahan();
    let tanamanList = loadTanaman();
    let editingId = null;
    let highlightId = null;

    const form = $('#tanaman-form');

    const getVisible = () => searchTanaman(tanamanList, $('#search-tanaman').value, $('#filter-jenis').value);

    const refreshTable = () => {
        renderTanamanTable({ visible: getVisible(), total: tanamanList.length, lahanList, editingId, highlightId });
        highlightId = null;
    };

    // ---------- Mode Tambah / Edit ----------
    const enterEditMode = (id) => {
        const tanaman = findTanamanById(tanamanList, id);
        if (!tanaman) return;

        editingId = id;
        clearValidation('#tanaman-form');
        setTanamanEditMode(tanaman, lahanList);
        showFeedback('#tanaman-feedback', `Mengedit tanaman ID ${id}: ${tanaman.nama}`, 'info');
        refreshTable();
        console.log('[EDIT] Mode edit dibuka untuk tanaman:', tanaman);
    };

    const exitEditMode = () => {
        editingId = null;
        clearValidation('#tanaman-form');
        setTanamanAddMode(lahanList);
    };

    // ---------- Hapus ----------
    const handleDeleteTanaman = (id) => {
        const tanaman = findTanamanById(tanamanList, id);
        const row = $(`#tanaman-table-body tr[data-id="${id}"]`);
        if (!tanaman || (row && row.classList.contains('fade-out'))) return;

        const finishDelete = () => {
            tanamanList = removeTanamanById(tanamanList, id);
            saveTanaman(tanamanList);
            if (editingId === id) exitEditMode();
            refreshTable();
            showFeedback('#tanaman-feedback', `Tanaman '${tanaman.nama}' berhasil dihapus.`, 'success');
            console.log(`[HAPUS] Tanaman ID ${id} (${tanaman.nama}) dihapus. Sisa tanaman: ${tanamanList.length}`);
            console.table(tanamanList);
        };

        if (row) {
            row.classList.add('fade-out');
            setTimeout(finishDelete, 300);
        } else {
            finishDelete();
        }
    };

    // ---------- Event ----------
    setTanamanAddMode(lahanList); // isi dropdown lahan + preview awal
    refreshTable();
    console.log(`Data tanaman dimuat: ${tanamanList.length} tanaman`);
    console.table(tanamanList);

    form.addEventListener('input', () => renderTanamanPreview(lahanList));
    form.addEventListener('change', () => renderTanamanPreview(lahanList));

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const data = getTanamanFormValues();
        const errors = validateTanaman(data, tanamanList, editingId);
        applyValidation(TANAMAN_FIELDS, errors, false); // pesan galat cukup di kotak feedback

        if (!isValid(errors)) {
            showFeedback('#tanaman-feedback', getFirstError(errors), 'error');
            console.warn('[VALIDASI] Gagal:', errors);
            return;
        }

        let message;
        const index = tanamanList.findIndex((item) => item.id === editingId);

        if (editingId !== null && index !== -1) {
            tanamanList[index] = { ...tanamanList[index], ...data };
            highlightId = editingId;
            message = `Tanaman '${data.nama}' berhasil diperbarui.`;
            console.log('[EDIT] Tanaman diperbarui:', tanamanList[index]);
            exitEditMode();
        } else {
            const newTanaman = { id: getNextId(tanamanList), ...data };
            tanamanList.push(newTanaman);
            highlightId = newTanaman.id;
            message = `Sukses! Tanaman '${newTanaman.nama}' tersimpan.`;
            console.log('[TAMBAH] Tanaman baru ditambahkan:', newTanaman);
            form.reset();
            clearValidation('#tanaman-form');
            renderTanamanPreview(lahanList);
        }

        saveTanaman(tanamanList);
        refreshTable();
        showFeedback('#tanaman-feedback', message, 'success');
        console.table(tanamanList);
    });

    $('#btn-clear-tanaman').addEventListener('click', () => {
        if (editingId !== null) {
            exitEditMode();
            refreshTable();
        } else {
            form.reset();
            clearValidation('#tanaman-form');
            renderTanamanPreview(lahanList);
        }
        showFeedback('#tanaman-feedback', '', '');
    });

    $('#btn-cancel-tanaman').addEventListener('click', () => {
        exitEditMode();
        refreshTable();
        showFeedback('#tanaman-feedback', 'Edit dibatalkan.', 'info');
        console.log('[EDIT] Dibatalkan.');
    });

    // Event delegation untuk semua tombol Edit/Hapus di tabel
    $('#tanaman-table-body').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const id = Number(button.dataset.id);
        if (button.dataset.action === 'edit') enterEditMode(id);
        if (button.dataset.action === 'delete') handleDeleteTanaman(id);
    });

    $('#search-tanaman').addEventListener('input', () => {
        refreshTable();
        console.log(`[CARI] Kata kunci "${$('#search-tanaman').value.trim()}" -> ${getVisible().length} tanaman ditemukan`);
    });

    $('#filter-jenis').addEventListener('change', () => {
        refreshTable();
        console.log(`[FILTER] Jenis "${$('#filter-jenis').value}" -> ${getVisible().length} tanaman`);
    });

    // Reset mengembalikan lahan DAN tanaman agar relasinya tetap cocok
    $('#btn-reset-tanaman').addEventListener('click', () => {
        lahanList = resetLahan();
        tanamanList = resetTanaman();
        $('#search-tanaman').value = '';
        $('#filter-jenis').value = '';
        exitEditMode();
        refreshTable();
        showFeedback('#tanaman-feedback', 'Data lahan dan tanaman dikembalikan ke dataset awal.', 'info');
        console.log('[RESET] Data dikembalikan ke dataset awal:', tanamanList.length, 'tanaman');
    });
};

// Halaman Kartu Lahan & Tanaman (card.html): render kartu, hapus kartu
const initCardPage = () => {
    let lahanList = loadLahan();
    let tanamanList = loadTanaman();

    const refreshCards = () => {
        renderLahanCards(lahanList);
        renderTanamanCards(tanamanList, lahanList);
    };

    // Hapus kartu: fade-out dulu, baru data dihapus dan kartu dirender ulang
    const removeCardWithFade = (selector, onRemoved) => {
        const card = $(selector);
        if (!card || card.classList.contains('fade-out')) return;

        card.classList.add('fade-out');
        setTimeout(onRemoved, 300);
    };

    const handleDeleteLahan = (id) => {
        const lahan = findLahanById(lahanList, id);
        if (!lahan) return;

        // Integritas referensial: lahan yang masih dipakai tanaman tidak boleh dihapus
        const jumlahTanaman = countTanamanByLahanId(tanamanList, id);
        if (jumlahTanaman > 0) {
            showFeedback(
                '#card-feedback',
                `Lahan '${lahan.nama}' tidak bisa dihapus karena masih dipakai ${jumlahTanaman} tanaman. Hapus tanamannya terlebih dahulu.`,
                'error'
            );
            console.warn(`[HAPUS] Ditolak: lahan ID ${id} masih dipakai ${jumlahTanaman} tanaman.`);
            return;
        }

        removeCardWithFade(`#lahan-container article[data-id="${id}"]`, () => {
            lahanList = removeLahanById(lahanList, id);
            saveLahan(lahanList);
            refreshCards();
            showFeedback('#card-feedback', `Lahan '${lahan.nama}' berhasil dihapus.`, 'success');
            console.log(`Elemen lahan dengan ID ${id} (${lahan.nama}) berhasil dihapus dari antarmuka.`);
            console.log(`[DATA] Sisa lahan: ${lahanList.length}`);
        });
    };

    const handleDeleteTanaman = (id) => {
        const tanaman = findTanamanById(tanamanList, id);
        if (!tanaman) return;

        removeCardWithFade(`#tanaman-container article[data-id="${id}"]`, () => {
            tanamanList = removeTanamanById(tanamanList, id);
            saveTanaman(tanamanList);
            refreshCards();
            showFeedback('#card-feedback', `Tanaman '${tanaman.nama}' berhasil dihapus.`, 'success');
            console.log(`Elemen tanaman dengan ID ${id} (${tanaman.nama}) berhasil dihapus dari antarmuka.`);
            console.log(`[DATA] Sisa tanaman: ${tanamanList.length}`);
        });
    };

    refreshCards();
    console.log(`[RENDER] ${lahanList.length} kartu lahan dan ${tanamanList.length} kartu tanaman ditampilkan.`);

    // Event delegation untuk tombol pada kartu (kartu dibuat dinamis)
    $('#lahan-container').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        if (button.dataset.action === 'delete') handleDeleteLahan(Number(button.dataset.id));
    });

    $('#tanaman-container').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        if (button.dataset.action === 'delete') handleDeleteTanaman(Number(button.dataset.id));
    });
};

// Inisialisasi: jalankan halaman yang sedang dibuka
document.addEventListener('DOMContentLoaded', () => {
    // Metadata aplikasi dan target backend (Modul 1)
    const appContext = {
        appName: 'Sistem Manajemen Data Lahan dan Tanaman',
        institution: 'STIKOM PGRI Banyuwangi',
        courseName: 'Dasar Pemrograman Frontend',
        courseCode: 'KK112104',
        targetBackendApi: 'http://127.0.0.1:5000/api/v1',
        isClientReady: true
    };

    console.log('=== Aplikasi Modular Diinisialisasi ===');
    console.log(`Aplikasi  : ${appContext.appName}`);
    console.log(`Institusi : ${appContext.institution}`);
    console.log(`Modul MK  : ${appContext.courseName} (${appContext.courseCode})`);
    console.log(`Target API: ${appContext.targetBackendApi}`);

    initNavToggle();

    // Halaman registrasi tidak memerlukan login
    if ($('#register-form')) {
        initRegisterPage();
        return;
    }
    // Penjaga akses: belum registrasi -> kembali ke halaman depan
    const user = getUser();
    if (!user) {
        window.location.replace('index.html');
        return;
    }
    console.log(`Pengguna aktif: ${user.username}`);
    if ($('#dashboard')) initDashboardPage(user);       // dashboard.html
    if ($('#lahan-form')) initLahanPage();              // data-lahan.html
    if ($('#tanaman-form')) initTanamanPage();          // data-tanaman.html
    if ($('#lahan-container')) initCardPage();          // card.html

    if (appContext.isClientReady) console.log('Client UI siap digunakan.');
});