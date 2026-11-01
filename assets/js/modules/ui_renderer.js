// Semua manipulasi DOM dan tampilan
import { escapeHtml } from './services.js';
// Helper memilih elemen
export const $ = (selector) =>
    document.querySelector(selector);

// FEEDBACK
export const showFeedback = (
    selector,
    message,
    type = ''
) => {
    const box = $(selector);
    if (!box) return;
    box.textContent = message;
    box.className = message
        ? `feedback-msg ${type}`
        : 'feedback-msg';
};

// ERROR STATE PER KOLOM 
// Border merah/hijau + pesan galat tepat di bawah input
export const applyValidation = (fieldSelectors, errors, showMessages = true) => {
    Object.entries(fieldSelectors).forEach(([key, selector]) => {
        const input = $(selector);

        if (!input) return;
        const group = input.parentElement;
        const errorText = group.querySelector('.error-text');
        const message = errors[key];

        group.classList.toggle('has-error', Boolean(message));
        group.classList.toggle('has-success', !message);
        input.setAttribute('aria-invalid', String(Boolean(message)));

        if (errorText) errorText.textContent = showMessages ? (message || '') : '';
    });
};

// Hapus seluruh status validasi pada sebuah form
export const clearValidation = (formSelector) => {
    const form = $(formSelector);

    if (!form) return;
    form.querySelectorAll('.form-group').forEach((group) => {
        group.classList.remove('has-error', 'has-success');

        const errorText = group.querySelector('.error-text');
        const input = group.querySelector('input, select');

        if (errorText) errorText.textContent = '';
        if (input) input.removeAttribute('aria-invalid');
    });
};

// FORM REGISTRASI
export const getRegisterFormValues = () => ({
    username: $('#reg-username').value.trim(),
    email: $('#reg-email').value.trim(),
    password: $('#reg-password').value,
    confirmPassword: $('#reg-confirm-password').value
});

// LIVE PREVIEW LAHAN
export const getLahanFormValues = () => ({
    nama: $('#lahan-nama').value.trim(),
    lokasi: $('#lahan-lokasi').value.trim(),
    luas: parseFloat($('#lahan-luas').value),
    jenisTanah: $('#lahan-jenis-tanah').value
});

export const renderLahanPreview = () => {
    const container = $('#live-preview-lahan');

    if (!container) return;
    const data = getLahanFormValues();
    if (
        !data.nama &&
        !data.lokasi &&
        Number.isNaN(data.luas) &&
        !data.jenisTanah
    ) {
        container.textContent =
            'Belum ada data. Mulai isi form di atas.';
        container.className = 'preview-box empty';
        return;
    }

    const lines = [
        `Nama Lahan: ${data.nama || '-'}`,
        `Lokasi: ${data.lokasi || '-'}`,
        `Luas: ${
            !Number.isNaN(data.luas)
                ? `${data.luas} Hektar`
                : '-'
        }`,
        `Jenis Tanah: ${data.jenisTanah || '-'}`
    ];

    // map : tiap baris teks menjadi elemen <p>
    const paragraphs = lines.map((line) => {
        const p = document.createElement('p');
        p.textContent = line;
        return p;
    });

    container.replaceChildren(...paragraphs);
    container.className = 'preview-box';
};

// TABEL LAHAN
const buildLahanRow = (
    lahan,
    editingId,
    highlightId
) => {
    const row = document.createElement('tr');

    row.dataset.id = lahan.id;

    if (lahan.id === editingId) {
        row.classList.add('editing');
    }
    if (lahan.id === highlightId) {
        row.classList.add('row-new');
    }

    const values = [
        lahan.id,
        lahan.nama,
        lahan.lokasi,
        `${lahan.luas} Ha`,
        lahan.jenisTanah
    ];

    const cells = values.map((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        return td;
    });

    const action = document.createElement('td');
    action.className = 'action-cell';

    action.innerHTML = `
        <button type="button"
            class="btn btn-small btn-edit"
            data-action="edit"
            data-id="${lahan.id}">
            Edit
        </button>

        <button type="button"
            class="btn btn-small btn-delete"
            data-action="delete"
            data-id="${lahan.id}">
            Hapus
        </button>
    `;
    row.append(...cells, action);
    return row;
};

export const renderLahanTable = ({
    visible,
    total,
    editingId,
    highlightId
}) => {
    const tbody = $('#lahan-table-body');

    if (!tbody) return;

    tbody.innerHTML = '';

    if (visible.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 6;
        cell.className = 'empty-row';
        cell.textContent = 'Tidak ada data lahan yang cocok.';

        row.append(cell);
        tbody.append(row);
    } else {
        tbody.append(
            ...visible.map((lahan) =>
                buildLahanRow(
                    lahan,
                    editingId,
                    highlightId
                )
            )
        );
    }

    const summary = $('#lahan-summary');
    if (summary) {
        summary.textContent =
            `Menampilkan ${visible.length} dari ${total} data lahan.`;
    }
};

// MODE EDIT LAHAN
export const setLahanEditMode = (lahan) => {
    $('#lahan-nama').value = lahan.nama;
    $('#lahan-lokasi').value = lahan.lokasi;
    $('#lahan-luas').value = lahan.luas;
    $('#lahan-jenis-tanah').value =
        lahan.jenisTanah;

    $('#form-lahan-title').textContent =
        'Edit Data Lahan';
    $('#btn-submit-lahan').textContent =
        'Simpan Perubahan';
    $('#btn-cancel-lahan').hidden = false;
    renderLahanPreview();
    $('#lahan-nama').focus();
};

export const setLahanAddMode = () => {
    const form = $('#lahan-form');

    if (form) form.reset();
    $('#form-lahan-title').textContent =
        'Tambah Data Lahan';
    $('#btn-submit-lahan').textContent =
        'Simpan Data Lahan';
    $('#btn-cancel-lahan').hidden = true;
    renderLahanPreview();
};

// FORM TANAMAN
export const getTanamanFormValues = () => ({
    nama: $('#tanaman-nama').value.trim(),
    jenis: $('#tanaman-jenis').value,
    lahanId: Number($('#tanaman-lahan').value),
    tanggal: $('#tanaman-tanggal').value
});

// map : array lahan -> array <option>
export const renderLahanOptions = (
    lahanList,
    selectedId = ''
) => {
    const select = $('#tanaman-lahan');

    if (!select) return;
    const firstOption =
        '<option value="">-- Pilih Lahan --</option>';
    const options = lahanList
        .map(
            (lahan) => `
                <option value="${lahan.id}"
                    ${
                        Number(selectedId) === lahan.id
                            ? 'selected'
                            : ''
                    }>
                    ${escapeHtml(lahan.nama)}
                </option>
            `
        )
        .join('');
    select.innerHTML = firstOption + options;
};

export const renderTanamanPreview = (
    lahanList
) => {
    const container =
        $('#live-preview-tanaman');

    if (!container) return;

    const data = getTanamanFormValues();

    const lahan = lahanList.find(
        (item) => item.id === data.lahanId
    );

    if (
        !data.nama &&
        !data.jenis &&
        !data.lahanId &&
        !data.tanggal
    ) {
        container.textContent =
            'Belum ada data. Mulai isi form di atas.';
        container.className =
            'preview-box empty';
        return;
    }

    const lines = [
        `Nama Tanaman: ${data.nama || '-'}`,
        `Jenis: ${data.jenis || '-'}`,
        `Lahan: ${lahan ? lahan.nama : '-'}`,
        `Tanggal Tanam: ${data.tanggal || '-'}`
    ];

    const paragraphs = lines.map((line) => {
        const p = document.createElement('p');
        p.textContent = line;
        return p;
    });

    container.replaceChildren(...paragraphs);
    container.className = 'preview-box';
};

// TABEL TANAMAN
export const renderTanamanTable = ({
    visible,
    total,
    lahanList,
    editingId,
    highlightId
}) => {
    const tbody = $('#tanaman-table-body');

    if (!tbody) return;
    tbody.innerHTML = '';
    if (visible.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 6;
        cell.className = 'empty-row';
        cell.textContent =
            'Tidak ada data tanaman yang cocok.';

        row.append(cell);
        tbody.append(row);
    } else {
        const rows = visible.map((tanaman) => {
            const row = document.createElement('tr');

            row.dataset.id = tanaman.id;
            if (tanaman.id === editingId) {
                row.classList.add('editing');
            }
            if (tanaman.id === highlightId) {
                row.classList.add('row-new');
            }

            const lahan = lahanList.find(
                (item) =>
                    item.id === Number(tanaman.lahanId)
            );
            const values = [
                tanaman.id,
                tanaman.nama,
                tanaman.jenis,
                lahan
                    ? lahan.nama
                    : 'Lahan tidak ditemukan',
                tanaman.tanggal
            ];

            const cells = values.map((value) => {
                const td = document.createElement('td');
                td.textContent = value;
                return td;
            });

            const action =
                document.createElement('td');

            action.className = 'action-cell';

            action.innerHTML = `
                <button type="button"
                    class="btn btn-small btn-edit"
                    data-action="edit"
                    data-id="${tanaman.id}">
                    Edit
                </button>

                <button type="button"
                    class="btn btn-small btn-delete"
                    data-action="delete"
                    data-id="${tanaman.id}">
                    Hapus
                </button>
            `;
            row.append(...cells, action);
            return row;
        });
        tbody.append(...rows);
    }

    const summary = $('#tanaman-summary');
    if (summary) {
        summary.textContent =
            `Menampilkan ${visible.length} dari ${total} data tanaman.`;
    }
};

// MODE EDIT TANAMAN
export const setTanamanEditMode = (
    tanaman,
    lahanList
) => {
    $('#tanaman-nama').value =
        tanaman.nama;
    $('#tanaman-jenis').value =
        tanaman.jenis;
    renderLahanOptions(
        lahanList,
        tanaman.lahanId
    );

    $('#tanaman-tanggal').value =
        tanaman.tanggal;
    $('#form-tanaman-title').textContent =
        'Edit Data Tanaman';
    $('#btn-submit-tanaman').textContent =
        'Simpan Perubahan';
    $('#btn-cancel-tanaman').hidden = false;
    renderTanamanPreview(lahanList);
    $('#tanaman-nama').focus();
};

export const setTanamanAddMode = (
    lahanList
) => {
    const form = $('#tanaman-form');

    if (form) form.reset();
    renderLahanOptions(lahanList);
    $('#form-tanaman-title').textContent =
        'Tambah Data Tanaman';
    $('#btn-submit-tanaman').textContent =
        'Simpan Data Tanaman';
    $('#btn-cancel-tanaman').hidden = true;
    renderTanamanPreview(lahanList);
};

// DASHBOARD
export const renderDashboard = (
    lahanList,
    tanamanList,
    totalLuas,
    user = null
) => {
    const totalLahan =
        $('#stat-total-lahan');

    const totalLuasElement =
        $('#stat-total-luas');

    const totalTanaman =
        $('#stat-total-tanaman');

    if (totalLahan) {
        totalLahan.textContent =
            lahanList.length;
    }
    if (totalLuasElement) {
        totalLuasElement.textContent =
            `${totalLuas} Ha`;
    }
    if (totalTanaman) {
        totalTanaman.textContent =
            tanamanList.length;
    }

    const welcome = $('#welcome-text');
    if (welcome) {
        welcome.textContent = user
            ? `Selamat datang, @${user.username}! Berikut ringkasan data lahan dan tanaman Anda.`
            : 'Selamat datang di Sistem Manajemen Data Lahan dan Tanaman.';
    }
};
// FOTO KARTU
const FOTO_PATH = 'assets/img/';
const FOTO_LAHAN = {
    Aluvial: 'lahan-aluvial.jpg',
    Regosol: 'lahan-regosol.jpg',
    Latosol: 'lahan-latosol.jpg',
    Andosol: 'lahan-andosol.jpg',
    Grumosol: 'lahan-grumosol.jpg'
};
const FOTO_TANAMAN = {
    Pangan: 'tanaman-pangan.jpg',
    Hortikultura: 'tanaman-hortikultura.jpg',
    Perkebunan: 'tanaman-perkebunan.jpg',
    Palawija: 'tanaman-palawija.jpg'
};

// Susun elemen <figure> berisi foto dan keterangannya
const buildFigure = (berkas, alt, keterangan) => `
    <figure class="card-figure">
        <img src="${FOTO_PATH}${berkas}"
            alt="${escapeHtml(alt)}"
            width="400" height="240"
            loading="lazy">
        <figcaption>${escapeHtml(keterangan)}</figcaption>
    </figure>
`;

// KARTU LAHAN
export const renderLahanCards = (
    lahanList
) => {
    const container =
        $('#lahan-container');

    const empty =
        $('#lahan-card-empty');

    if (!container) return;
    container.innerHTML = '';
    if (lahanList.length === 0) {
        if (empty) empty.hidden = false;
        return;
    }
    if (empty) empty.hidden = true;

    const cards = lahanList.map((lahan) => {
        const card =
            document.createElement('article');

        card.className =
            'data-card dynamic-item';

        card.dataset.id = lahan.id;

        card.innerHTML = `
            ${buildFigure(
                FOTO_LAHAN[lahan.jenisTanah] || FOTO_LAHAN.Aluvial,
                `Ilustrasi lahan ${lahan.nama}`,
                `Tanah ${lahan.jenisTanah}`
            )}
            <h3>${escapeHtml(lahan.nama)}</h3>
            <p><strong>Lokasi:</strong> ${escapeHtml(lahan.lokasi)}</p>
            <p><strong>Luas:</strong> ${lahan.luas} Ha</p>
            <p><strong>Jenis Tanah:</strong> ${escapeHtml(lahan.jenisTanah)}</p>
            <div class="card-actions">
                <button type="button"
                    class="btn btn-delete"
                    data-action="delete"
                    data-id="${lahan.id}">
                    Hapus Lahan
                </button>
            </div>
        `;
        return card;
    });
    container.append(...cards);
};

// KARTU TANAMAN
export const renderTanamanCards = (
    tanamanList,
    lahanList
) => {
    const container =
        $('#tanaman-container');

    const empty =
        $('#tanaman-card-empty');

    if (!container) return;
    container.innerHTML = '';

    if (tanamanList.length === 0) {
        if (empty) empty.hidden = false;
        return;
    }
    if (empty) empty.hidden = true;

    const cards = tanamanList.map((tanaman) => {
        const lahan = lahanList.find(
            (item) =>
                item.id === Number(tanaman.lahanId)
        );
        const card =
            document.createElement('article');

        card.className =
            'data-card dynamic-item';

        card.dataset.id = tanaman.id;

        card.innerHTML = `
            ${buildFigure(
                FOTO_TANAMAN[tanaman.jenis] || FOTO_TANAMAN.Pangan,
                `Ilustrasi tanaman ${tanaman.nama}`,
                `Tanaman ${tanaman.jenis}`
            )}
            <h3>${escapeHtml(tanaman.nama)}</h3>
            <p><strong>Jenis:</strong> ${escapeHtml(tanaman.jenis)}</p>
            <p><strong>Lahan:</strong> ${
                lahan
                    ? escapeHtml(lahan.nama)
                    : 'Tidak ditemukan'
            }</p>
            <p><strong>Tanggal Tanam:</strong> ${escapeHtml(tanaman.tanggal)}</p>
            <div class="card-actions">
                <button type="button"
                    class="btn btn-delete"
                    data-action="delete"
                    data-id="${tanaman.id}">
                    Hapus Tanaman
                </button>
            </div>
        `;
        return card;
    });
    container.append(...cards);
};