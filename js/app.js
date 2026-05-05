// ==========================================
// BASE DE DATOS IndexedDB
// ==========================================

const DB_NAME = 'LauroStudyDB';
const DB_VERSION = 2;
let db = null;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains('studyData')) {
                database.createObjectStore('studyData', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('photoFiles')) {
                database.createObjectStore('photoFiles', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('recordings')) {
                const recordingsStore = database.createObjectStore('recordings', { keyPath: 'recordingId' });
                recordingsStore.createIndex('pasajeId', 'pasajeId', { unique: false });
            }
            if (!database.objectStoreNames.contains('videos')) {
                const videosStore = database.createObjectStore('videos', { keyPath: 'videoId' });
                videosStore.createIndex('pasajeId', 'pasajeId', { unique: false });
            }
        };
    });
}

function saveStudyDataToDB(index, data) {
    if (!db) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['studyData'], 'readwrite');
        const store = transaction.objectStore('studyData');
        const request = store.put({ id: index, ...data });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function loadStudyDataFromDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['studyData'], 'readonly');
        const store = transaction.objectStore('studyData');
        const request = store.getAll();
        request.onsuccess = () => {
            const data = {};
            request.result.forEach(item => {
                data[item.id] = {
                    completed: item.completed || false,
                    completedDate: item.completedDate || null,
                    notes: item.notes || ''
                };
            });
            resolve(data);
        };
        request.onerror = () => reject(request.error);
    });
}

function saveRecordingToDB(pasajeId, audioBlob, name = null) {
    if (!db) return Promise.resolve();
    return new Promise(async (resolve, reject) => {
        const existingRecordings = await getRecordingsForPasaje(pasajeId);
        const takeNumber = existingRecordings.length + 1;

        const recording = {
            recordingId: `${pasajeId}_${Date.now()}`,
            pasajeId: pasajeId,
            name: name || `Toma ${takeNumber}`,
            date: new Date().toISOString(),
            audio: audioBlob
        };

        const transaction = db.transaction(['recordings'], 'readwrite');
        const store = transaction.objectStore('recordings');
        const request = store.put(recording);
        request.onsuccess = () => resolve(recording);
        request.onerror = () => reject(request.error);
    });
}

function getRecordingsForPasaje(pasajeId) {
    if (!db) return Promise.resolve([]);
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recordings'], 'readonly');
        const store = transaction.objectStore('recordings');
        const index = store.index('pasajeId');
        const request = index.getAll(pasajeId);
        request.onsuccess = () => {
            const recordings = request.result.sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );
            resolve(recordings);
        };
        request.onerror = () => reject(request.error);
    });
}

function deleteRecordingFromDB(recordingId) {
    if (!db) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recordings'], 'readwrite');
        const store = transaction.objectStore('recordings');
        const request = store.delete(recordingId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function getAllRecordingsFromDB() {
    if (!db) return Promise.resolve([]);
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recordings'], 'readonly');
        const store = transaction.objectStore('recordings');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function savePhotoToDB(index, photoBlob) {
    if (!db) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['photoFiles'], 'readwrite');
        const store = transaction.objectStore('photoFiles');
        const request = store.put({ id: index, photo: photoBlob });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function loadPhotoFromDB(index) {
    if (!db) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['photoFiles'], 'readonly');
        const store = transaction.objectStore('photoFiles');
        const request = store.get(index);
        request.onsuccess = () => resolve(request.result?.photo || null);
        request.onerror = () => reject(request.error);
    });
}

function deletePhotoFromDB(index) {
    if (!db) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['photoFiles'], 'readwrite');
        const store = transaction.objectStore('photoFiles');
        const request = store.delete(index);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function getAllPhotosFromDB() {
    if (!db) return Promise.resolve([]);
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['photoFiles'], 'readonly');
        const store = transaction.objectStore('photoFiles');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ==========================================
// EXPORTAR / IMPORTAR
// ==========================================

async function exportData() {
    try {
        const studyData = await loadStudyDataFromDB();
        const recordings = await getAllRecordingsFromDB();
        const photos = await getAllPhotosFromDB();
        const videos = await getAllVideosFromDB();

        const recordingsBase64 = await Promise.all(
            recordings.map(async (item) => {
                if (item.audio instanceof Blob) {
                    const base64 = await blobToBase64(item.audio);
                    return { ...item, audio: base64 };
                }
                return item;
            })
        );

        const photosBase64 = await Promise.all(
            photos.map(async (item) => {
                if (item.photo instanceof Blob) {
                    const base64 = await blobToBase64(item.photo);
                    return { id: item.id, photo: base64 };
                }
                return item;
            })
        );

        const videosBase64 = await Promise.all(
            videos.map(async (item) => {
                if (item.video instanceof Blob) {
                    const base64 = await blobToBase64(item.video);
                    return { ...item, video: base64 };
                }
                return item;
            })
        );

        const exportObj = {
            version: 2,
            exportDate: new Date().toISOString(),
            studyData,
            recordings: recordingsBase64,
            photoFiles: photosBase64,
            videoFiles: videosBase64
        };

        const json = JSON.stringify(exportObj);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `lauro-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        showNotification('Backup exportado correctamente', 'success');
    } catch (error) {
        console.error('Error exportando:', error);
        showNotification('Error al exportar', 'error');
    }
}

async function importData(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version || !data.studyData) {
            throw new Error('Formato de archivo inválido');
        }

        for (const [index, item] of Object.entries(data.studyData)) {
            await saveStudyDataToDB(parseInt(index), item);
        }

        if (data.recordings) {
            for (const item of data.recordings) {
                if (item.audio) {
                    const blob = base64ToBlob(item.audio);
                    const recording = {
                        recordingId: item.recordingId,
                        pasajeId: item.pasajeId,
                        name: item.name,
                        date: item.date,
                        audio: blob
                    };
                    const transaction = db.transaction(['recordings'], 'readwrite');
                    const store = transaction.objectStore('recordings');
                    await new Promise((resolve, reject) => {
                        const request = store.put(recording);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                }
            }
        }

        if (data.photoFiles) {
            for (const item of data.photoFiles) {
                if (item.photo) {
                    const blob = base64ToBlob(item.photo);
                    await savePhotoToDB(item.id, blob);
                }
            }
        }

        if (data.videoFiles) {
            for (const item of data.videoFiles) {
                if (item.video) {
                    const blob = base64ToBlob(item.video);
                    const transaction = db.transaction(['videos'], 'readwrite');
                    const store = transaction.objectStore('videos');
                    await new Promise((resolve, reject) => {
                        const request = store.put({ ...item, video: blob });
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                }
            }
        }

        studyData = await loadStudyDataFromDB();
        buildSidebar();
        loadPasaje(currentPasaje);
        updateProgress();

        showNotification('Backup importado correctamente', 'success');
    } catch (error) {
        console.error('Error importando:', error);
        showNotification('Error al importar: ' + error.message, 'error');
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function base64ToBlob(base64) {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// VIDEOS IndexedDB
// ==========================================

function saveVideoToDB(pasajeId, videoBlob, name = null) {
    if (!db) return Promise.resolve();
    return new Promise(async (resolve, reject) => {
        const existing = await getVideosForPasaje(pasajeId);
        const takeNumber = existing.length + 1;
        const video = {
            videoId: `${pasajeId}_v_${Date.now()}`,
            pasajeId,
            name: name || `Vídeo ${takeNumber}`,
            date: new Date().toISOString(),
            video: videoBlob
        };
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        const request = store.put(video);
        request.onsuccess = () => resolve(video);
        request.onerror = () => reject(request.error);
    });
}

function getVideosForPasaje(pasajeId) {
    if (!db) return Promise.resolve([]);
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        const index = store.index('pasajeId');
        const request = index.getAll(pasajeId);
        request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.date) - new Date(a.date)));
        request.onerror = () => reject(request.error);
    });
}

function deleteVideoFromDB(videoId) {
    if (!db) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        const request = store.delete(videoId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function getAllVideosFromDB() {
    if (!db) return Promise.resolve([]);
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ==========================================
// GRABADOR DE AUDIO
// ==========================================

let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimer = null;

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/mp4';

        mediaRecorder = new MediaRecorder(stream, { mimeType });
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(track => track.stop());
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            await saveRecordingToDB(currentPasaje, audioBlob);

            elements.audioOptions.style.display = 'flex';
            elements.recorderActive.style.display = 'none';
            await renderRecordingsList(currentPasaje);
            showNotification('Grabación guardada', 'success');
        };

        mediaRecorder.start();
        recordingStartTime = Date.now();
        elements.audioOptions.style.display = 'none';
        elements.recorderActive.style.display = 'flex';
        recordingTimer = setInterval(updateRecordingTime, 1000);
        updateRecordingTime();

    } catch (error) {
        console.error('Error al acceder al micrófono:', error);
        if (error.name === 'NotAllowedError') {
            showNotification('Permiso de micrófono denegado', 'error');
        } else {
            showNotification('Error al iniciar grabación', 'error');
        }
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(recordingTimer);
    }
}

function updateRecordingTime() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    elements.recTime.textContent = `${minutes}:${seconds}`;
}

// ==========================================
// GRABADOR DE VÍDEO
// ==========================================

let videoRecorder = null;
let videoChunks = [];
let videoStartTime = null;
let videoTimer = null;

async function startVideoRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        elements.webcamPreview.srcObject = stream;

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : MediaRecorder.isTypeSupported('video/webm')
                ? 'video/webm'
                : 'video/mp4';

        videoRecorder = new MediaRecorder(stream, { mimeType });
        videoChunks = [];

        videoRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) videoChunks.push(e.data);
        };

        videoRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            elements.webcamPreview.srcObject = null;
            const videoBlob = new Blob(videoChunks, { type: mimeType });
            await saveVideoToDB(currentPasaje, videoBlob);
            elements.audioOptions.style.display = 'flex';
            elements.videoRecorderActive.style.display = 'none';
            await renderVideosList(currentPasaje);
            showNotification('Vídeo guardado', 'success');
        };

        videoRecorder.start();
        videoStartTime = Date.now();
        elements.audioOptions.style.display = 'none';
        elements.videoRecorderActive.style.display = 'flex';
        videoTimer = setInterval(updateVideoTime, 1000);
        updateVideoTime();

    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        if (error.name === 'NotAllowedError') {
            showNotification('Permiso de cámara denegado', 'error');
        } else {
            showNotification('Error al iniciar grabación de vídeo', 'error');
        }
    }
}

function stopVideoRecording() {
    if (videoRecorder && videoRecorder.state !== 'inactive') {
        videoRecorder.stop();
        clearInterval(videoTimer);
    }
}

function updateVideoTime() {
    const elapsed = Math.floor((Date.now() - videoStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    elements.recVideoTime.textContent = `${minutes}:${seconds}`;
}

// ==========================================
// LISTA DE VÍDEOS
// ==========================================

async function renderVideosList(pasajeId) {
    const videos = await getVideosForPasaje(pasajeId);
    const container = elements.videosList;

    if (videos.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = videos.map(rec => {
        const date = new Date(rec.date).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        return `
            <div class="recording-item video-item" data-video-id="${rec.videoId}">
                <span class="recording-icon">🎬</span>
                <div class="recording-info">
                    <div class="recording-name">${rec.name}</div>
                    <div class="recording-date">${date}</div>
                </div>
                <div class="recording-actions">
                    <button class="play-btn play-video-btn" data-video-id="${rec.videoId}" title="Reproducir">▶</button>
                    <button class="delete-recording-btn delete-video-btn" data-video-id="${rec.videoId}" title="Eliminar">✕</button>
                </div>
            </div>
            <div class="video-player-container" id="player_${rec.videoId}" style="display:none;">
                <video class="video-playback" controls></video>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.play-video-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await playVideo(e.currentTarget.dataset.videoId, e.currentTarget);
        });
    });

    container.querySelectorAll('.delete-video-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const videoId = e.currentTarget.dataset.videoId;
            if (confirm('¿Eliminar este vídeo?')) {
                await deleteVideoFromDB(videoId);
                await renderVideosList(pasajeId);
                showNotification('Vídeo eliminado', 'info');
            }
        });
    });
}

async function playVideo(videoId, button) {
    const playerContainer = document.getElementById(`player_${videoId}`);
    const videoEl = playerContainer.querySelector('video');
    const isOpen = playerContainer.style.display !== 'none';

    // Cerrar todos los players abiertos
    document.querySelectorAll('.video-player-container').forEach(el => {
        el.style.display = 'none';
        el.querySelector('video').src = '';
    });
    document.querySelectorAll('.play-video-btn').forEach(b => b.textContent = '▶');

    if (isOpen) return;

    const videos = await getVideosForPasaje(currentPasaje);
    const rec = videos.find(v => v.videoId === videoId);
    if (!rec) return;

    const url = URL.createObjectURL(rec.video);
    videoEl.src = url;
    videoEl.onended = () => URL.revokeObjectURL(url);
    playerContainer.style.display = 'block';
    button.textContent = '⏹';
    videoEl.play();
}

// ==========================================
// LISTA DE GRABACIONES
// ==========================================

let currentlyPlayingAudio = null;
let currentlyPlayingButton = null;

async function renderRecordingsList(pasajeId) {
    const recordings = await getRecordingsForPasaje(pasajeId);
    const container = elements.recordingsList;

    if (recordings.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = recordings.map(rec => {
        const date = new Date(rec.date).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        return `
            <div class="recording-item" data-recording-id="${rec.recordingId}">
                <span class="recording-icon">🎵</span>
                <div class="recording-info">
                    <div class="recording-name">${rec.name}</div>
                    <div class="recording-date">${date}</div>
                </div>
                <div class="recording-actions">
                    <button class="play-btn" data-recording-id="${rec.recordingId}" title="Reproducir">▶</button>
                    <button class="delete-recording-btn" data-recording-id="${rec.recordingId}" title="Eliminar">✕</button>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await playRecording(e.currentTarget.dataset.recordingId, e.currentTarget);
        });
    });

    container.querySelectorAll('.delete-recording-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const recordingId = e.currentTarget.dataset.recordingId;
            if (confirm('¿Eliminar esta grabación?')) {
                await deleteRecordingFromDB(recordingId);
                await renderRecordingsList(pasajeId);
                showNotification('Grabación eliminada', 'info');
            }
        });
    });
}

async function playRecording(recordingId, button) {
    if (currentlyPlayingAudio) {
        currentlyPlayingAudio.pause();
        currentlyPlayingAudio = null;
        if (currentlyPlayingButton) {
            currentlyPlayingButton.textContent = '▶';
            currentlyPlayingButton.classList.remove('playing');
            currentlyPlayingButton.closest('.recording-item').classList.remove('playing');
        }
        if (currentlyPlayingButton === button) {
            currentlyPlayingButton = null;
            return;
        }
    }

    const recordings = await getRecordingsForPasaje(currentPasaje);
    const recording = recordings.find(r => r.recordingId === recordingId);

    if (!recording || !recording.audio) {
        showNotification('Error al cargar la grabación', 'error');
        return;
    }

    const audioUrl = URL.createObjectURL(recording.audio);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
        button.textContent = '▶';
        button.classList.remove('playing');
        button.closest('.recording-item').classList.remove('playing');
        currentlyPlayingAudio = null;
        currentlyPlayingButton = null;
        URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
        showNotification('Error al reproducir', 'error');
        button.textContent = '▶';
        button.classList.remove('playing');
        button.closest('.recording-item').classList.remove('playing');
        currentlyPlayingAudio = null;
        currentlyPlayingButton = null;
    };

    currentlyPlayingAudio = audio;
    currentlyPlayingButton = button;
    button.textContent = '⏸';
    button.classList.add('playing');
    button.closest('.recording-item').classList.add('playing');
    audio.play();
}

// ==========================================
// APLICACIÓN PRINCIPAL
// ==========================================

let currentPasaje = 0;
let studyData = {};
const elements = {};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        elements.sidebar = document.getElementById('sidebar');
        elements.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        elements.progressFill = document.getElementById('progressFill');
        elements.progressText = document.getElementById('progressText');
        elements.pasajeTitulo = document.getElementById('pasajeTitulo');
        elements.pasajeCompases = document.getElementById('pasajeCompases');
        elements.manuscriptImg = document.getElementById('manuscriptImg');
        elements.pasajeDescripcion = document.getElementById('pasajeDescripcion');
        elements.completedCheckbox = document.getElementById('completedCheckbox');
        elements.dateCompleted = document.getElementById('dateCompleted');
        elements.notesTextarea = document.getElementById('notesTextarea');
        elements.autosaveIndicator = document.getElementById('autosaveIndicator');
        elements.audioOptions = document.getElementById('audioOptions');
        elements.recordBtn = document.getElementById('recordBtn');
        elements.uploadBtn = document.getElementById('uploadBtn');
        elements.audioInput = document.getElementById('audioInput');
        elements.recorderActive = document.getElementById('recorderActive');
        elements.recTime = document.getElementById('recTime');
        elements.stopBtn = document.getElementById('stopBtn');
        elements.recordingsList = document.getElementById('recordingsList');
        elements.recordVideoBtn = document.getElementById('recordVideoBtn');
        elements.videoRecorderActive = document.getElementById('videoRecorderActive');
        elements.webcamPreview = document.getElementById('webcamPreview');
        elements.recVideoTime = document.getElementById('recVideoTime');
        elements.stopVideoBtn = document.getElementById('stopVideoBtn');
        elements.videosList = document.getElementById('videosList');
        elements.photoUploadArea = document.getElementById('photoUploadArea');
        elements.photoUploadBtn = document.getElementById('photoUploadBtn');
        elements.photoInput = document.getElementById('photoInput');
        elements.photoPreviewContainer = document.getElementById('photoPreviewContainer');
        elements.photoPreview = document.getElementById('photoPreview');
        elements.removePhotoBtn = document.getElementById('removePhotoBtn');
        elements.prevBtn = document.getElementById('prevBtn');
        elements.nextBtn = document.getElementById('nextBtn');
        elements.exportBtn = document.getElementById('exportBtn');
        elements.importBtn = document.getElementById('importBtn');
        elements.importInput = document.getElementById('importInput');

        try {
            await initDB();
            studyData = await loadStudyDataFromDB();
        } catch (dbError) {
            console.warn('IndexedDB no disponible, modo sin persistencia:', dbError);
            db = null;
        }

        for (let i = 0; i < PASAJES.length; i++) {
            if (!studyData[i]) {
                studyData[i] = { completed: false, completedDate: null, notes: '' };
            }
        }

        buildSidebar();
        loadPasaje(currentPasaje);
        setupEventListeners();
        setupMobileOverlay();
        setupScoreFullscreen();
        setupMetronome();
        updateProgress();

    } catch (error) {
        console.error('Error inicializando app:', error);
    }
});

function buildSidebar() {
    const sections = {
        'section-seccion-a': [],
        'section-seccion-b': [],
        'section-seccion-c': [],
        'section-seccion-coda': []
    };

    PASAJES.forEach((p, index) => {
        const sectionId = `section-${p.seccion}`;
        if (sections[sectionId]) {
            sections[sectionId].push({ ...p, index });
        }
    });

    Object.keys(sections).forEach(sectionId => {
        const container = document.getElementById(sectionId);
        if (container) {
            container.innerHTML = sections[sectionId].map(p => `
                <div class="variation-item ${studyData[p.index]?.completed ? 'completed' : ''}"
                     data-index="${p.index}">
                    <span class="item-check">${studyData[p.index]?.completed ? '✓' : '○'}</span>
                    <span class="item-number">${p.numero}</span>
                    <span class="item-title">${p.titulo}</span>
                </div>
            `).join('');
        }
    });

    document.querySelectorAll('.variation-item').forEach(item => {
        item.addEventListener('click', () => {
            loadPasaje(parseInt(item.dataset.index));
            closeMobileMenu();
        });
    });

    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            const sectionId = header.dataset.section;
            const items = document.getElementById(`section-${sectionId}`);
            const icon = header.querySelector('.section-icon');
            items.classList.toggle('collapsed');
            icon.textContent = items.classList.contains('collapsed') ? '▶' : '▼';
        });
    });
}

async function loadPasaje(index) {
    currentPasaje = index;
    const pasaje = PASAJES[index];
    const data = studyData[index] || {};

    elements.pasajeTitulo.textContent = pasaje.titulo;
    elements.pasajeCompases.textContent = `cc. ${pasaje.compases}`;
    elements.manuscriptImg.src = pasaje.imagen;
    elements.manuscriptImg.alt = `Partitura – ${pasaje.titulo}`;
    elements.pasajeDescripcion.textContent = pasaje.texto;
    elements.pasajeDescripcion.closest('.description-section').style.display =
        pasaje.texto ? 'block' : 'none';

    elements.completedCheckbox.checked = data.completed || false;
    elements.dateCompleted.textContent = data.completedDate
        ? `Completado: ${data.completedDate}`
        : '';

    elements.notesTextarea.value = data.notes || '';

    if (currentlyPlayingAudio) {
        currentlyPlayingAudio.pause();
        currentlyPlayingAudio = null;
        currentlyPlayingButton = null;
    }

    elements.audioOptions.style.display = 'flex';
    elements.recorderActive.style.display = 'none';
    elements.videoRecorderActive.style.display = 'none';
    await renderRecordingsList(index);
    await renderVideosList(index);

    const photoBlob = await loadPhotoFromDB(index);
    if (photoBlob) {
        const photoUrl = URL.createObjectURL(photoBlob);
        elements.photoUploadArea.style.display = 'none';
        elements.photoPreviewContainer.style.display = 'block';
        elements.photoPreview.src = photoUrl;
    } else {
        elements.photoUploadArea.style.display = 'block';
        elements.photoPreviewContainer.style.display = 'none';
        elements.photoPreview.src = '';
    }

    document.querySelectorAll('.variation-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.index) === index) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    elements.prevBtn.disabled = index === 0;
    elements.nextBtn.disabled = index === PASAJES.length - 1;

    expandSection(pasaje.seccion);
}

function expandSection(seccion) {
    const sectionItems = document.getElementById(`section-${seccion}`);
    const sectionHeader = document.querySelector(`[data-section="${seccion}"]`);
    if (sectionItems && sectionItems.classList.contains('collapsed')) {
        sectionItems.classList.remove('collapsed');
        const icon = sectionHeader.querySelector('.section-icon');
        icon.textContent = '▼';
    }
}

function setupEventListeners() {
    elements.prevBtn.addEventListener('click', () => {
        if (currentPasaje > 0) loadPasaje(currentPasaje - 1);
    });
    elements.nextBtn.addEventListener('click', () => {
        if (currentPasaje < PASAJES.length - 1) loadPasaje(currentPasaje + 1);
    });

    elements.completedCheckbox.addEventListener('change', async (e) => {
        studyData[currentPasaje].completed = e.target.checked;
        studyData[currentPasaje].completedDate = e.target.checked
            ? new Date().toLocaleDateString('es-ES')
            : null;
        elements.dateCompleted.textContent = studyData[currentPasaje].completedDate
            ? `Completado: ${studyData[currentPasaje].completedDate}`
            : '';
        await saveStudyDataToDB(currentPasaje, studyData[currentPasaje]);
        updateSidebarItem(currentPasaje);
        updateProgress();
    });

    let notesTimeout;
    elements.notesTextarea.addEventListener('input', () => {
        elements.autosaveIndicator.textContent = 'Guardando…';
        elements.autosaveIndicator.className = 'autosave-indicator saving';
        clearTimeout(notesTimeout);
        notesTimeout = setTimeout(async () => {
            studyData[currentPasaje].notes = elements.notesTextarea.value;
            await saveStudyDataToDB(currentPasaje, studyData[currentPasaje]);
            elements.autosaveIndicator.textContent = 'Guardado ✓';
            elements.autosaveIndicator.className = 'autosave-indicator saved';
            setTimeout(() => {
                elements.autosaveIndicator.textContent = 'Guardado automático';
                elements.autosaveIndicator.className = 'autosave-indicator';
            }, 2000);
        }, 500);
    });

    elements.recordBtn.addEventListener('click', startRecording);
    elements.stopBtn.addEventListener('click', stopRecording);
    elements.recordVideoBtn.addEventListener('click', startVideoRecording);
    elements.stopVideoBtn.addEventListener('click', stopVideoRecording);

    elements.uploadBtn.addEventListener('click', () => elements.audioInput.click());
    elements.audioInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await saveRecordingToDB(currentPasaje, file);
            await renderRecordingsList(currentPasaje);
            elements.audioInput.value = '';
            showNotification('Audio guardado', 'success');
        }
    });

    elements.photoUploadBtn.addEventListener('click', () => elements.photoInput.click());
    elements.photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await savePhotoToDB(currentPasaje, file);
            const photoUrl = URL.createObjectURL(file);
            elements.photoUploadArea.style.display = 'none';
            elements.photoPreviewContainer.style.display = 'block';
            elements.photoPreview.src = photoUrl;
            showNotification('Foto guardada', 'success');
        }
    });

    elements.removePhotoBtn.addEventListener('click', async () => {
        if (confirm('¿Eliminar esta foto?')) {
            await deletePhotoFromDB(currentPasaje);
            elements.photoUploadArea.style.display = 'block';
            elements.photoPreviewContainer.style.display = 'none';
            elements.photoPreview.src = '';
            elements.photoInput.value = '';
            showNotification('Foto eliminada', 'info');
        }
    });

    elements.exportBtn.addEventListener('click', exportData);
    elements.importBtn.addEventListener('click', () => elements.importInput.click());
    elements.importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (confirm('¿Importar backup? Esto sobrescribirá los datos actuales.')) {
                importData(file);
            }
        }
        e.target.value = '';
    });

    elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'ArrowLeft' && currentPasaje > 0) loadPasaje(currentPasaje - 1);
        else if (e.key === 'ArrowRight' && currentPasaje < PASAJES.length - 1) loadPasaje(currentPasaje + 1);
    });
}

function updateSidebarItem(index) {
    const item = document.querySelector(`.variation-item[data-index="${index}"]`);
    if (item) {
        const isCompleted = studyData[index]?.completed;
        item.classList.toggle('completed', isCompleted);
        item.querySelector('.item-check').textContent = isCompleted ? '✓' : '○';
    }
}

function updateProgress() {
    const completed = Object.values(studyData).filter(d => d.completed).length;
    const total = PASAJES.length;
    const percentage = (completed / total) * 100;
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = `${completed}/${total} completados`;
}

let overlay = null;

function toggleMobileMenu() {
    elements.sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active', elements.sidebar.classList.contains('open'));
}

function closeMobileMenu() {
    elements.sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

function setupMobileOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closeMobileMenu);
}

// ==========================================
// FULLSCREEN SCORE
// ==========================================

function setupScoreFullscreen() {
    const img = document.getElementById('manuscriptImg');
    const overlayEl = document.getElementById('scoreOverlay');
    const overlayImg = document.getElementById('scoreOverlayImg');

    img.addEventListener('click', () => {
        if (!img.src) return;
        overlayImg.src = img.src;
        overlayEl.classList.add('open');
    });

    overlayEl.addEventListener('click', () => {
        overlayEl.classList.remove('open');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') overlayEl.classList.remove('open');
    });
}

// ==========================================
// METRONOME
// ==========================================

let metroCtx = null;
let metroInterval = null;
let metroBpm = 140;
let metroRunning = false;

function setupMetronome() {
    const slider = document.getElementById('metroSlider');
    const bpmDisplay = document.getElementById('metroBpm');
    const btn = document.getElementById('metroBtn');
    const beat = document.getElementById('metroBeat');
    const presets = document.querySelectorAll('.metro-preset');

    slider.addEventListener('input', () => {
        metroBpm = parseInt(slider.value);
        bpmDisplay.textContent = metroBpm;
        updateActivePreset();
        if (metroRunning) restartMetronome();
    });

    presets.forEach(p => {
        p.addEventListener('click', () => {
            metroBpm = parseInt(p.dataset.bpm);
            slider.value = metroBpm;
            bpmDisplay.textContent = metroBpm;
            updateActivePreset();
            if (metroRunning) restartMetronome();
        });
    });

    btn.addEventListener('click', () => {
        if (metroRunning) {
            stopMetronome();
        } else {
            startMetronome();
        }
    });

    function tick() {
        // Click sonoro con Web Audio API
        if (!metroCtx) metroCtx = new (window.AudioContext || window.webkitAudioContext)();

        const osc = metroCtx.createOscillator();
        const gain = metroCtx.createGain();
        osc.connect(gain);
        gain.connect(metroCtx.destination);
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.4, metroCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, metroCtx.currentTime + 0.05);
        osc.start(metroCtx.currentTime);
        osc.stop(metroCtx.currentTime + 0.05);

        // Flash visual
        beat.classList.add('on');
        setTimeout(() => beat.classList.remove('on'), 80);
    }

    function startMetronome() {
        metroRunning = true;
        btn.textContent = '■ Parar';
        btn.classList.add('running');
        tick();
        metroInterval = setInterval(tick, (60 / metroBpm) * 1000);
    }

    function stopMetronome() {
        metroRunning = false;
        clearInterval(metroInterval);
        btn.textContent = '▶ Iniciar';
        btn.classList.remove('running');
    }

    function restartMetronome() {
        clearInterval(metroInterval);
        metroInterval = setInterval(tick, (60 / metroBpm) * 1000);
    }

    function updateActivePreset() {
        presets.forEach(p => {
            p.classList.toggle('active', parseInt(p.dataset.bpm) === metroBpm);
        });
    }
}
