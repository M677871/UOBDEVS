
const SHOW_LOADING   = false;
const BATCH_SIZE     = 24;
const MAX_DOM_NODES  = 80;
const IO_ROOT_MARGIN = '400px 0px';


let currentManifest   = [];
let currentIndex      = -1;
let currentAlbum      = null;
let nextIndexToAppend = 0;

const gallery       = document.getElementById('gallery');
const notice        = document.getElementById('notice');
const albumControls = document.getElementById('album-controls');
const lightbox      = document.getElementById('lightbox');
const lbImg         = document.getElementById('lb-img');
const lbCaption     = document.getElementById('lb-caption');
const lbCounter     = document.getElementById('lb-counter');
const loading       = document.getElementById('loading');
const dlLink        = document.getElementById('lb-dl');       // download
const backToTopBtn  = document.getElementById('back-to-top'); // back-to-top

// invisible sentinel for infinite scroll
let sentinel;

// ---------- Helpers ----------
const setLoading = (visible) => {
  if (!loading) return;
  if (visible) {
    loading.style.display = 'flex';
    loading.removeAttribute('hidden');
    loading.setAttribute('aria-hidden', 'false');
  } else {
    loading.style.display = 'none';
    loading.setAttribute('hidden', '');
    loading.setAttribute('aria-hidden', 'true');
  }
};

const fetchData = async (path, fallbackData = null) => {
  try {
    const res = await fetch(encodeURI(path)); // handle spaces in folder names
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`Could not load ${path}, using fallback data:`, error);
    return fallbackData;
  }
};

const showError = (message) => {
  if (gallery) gallery.innerHTML = '';
  if (!notice) return;
  notice.hidden = false;
  notice.innerHTML = `<div class="empty-icon">⚠️</div><p>${message}</p>`;
};

const buildAlt = (albumName, src) => {
  const filename = src.split('/').pop()
    .replace(/\.(jpg|jpeg|png|gif|webp|avif)$/i, '')
    .replace(/[-_]/g, ' ');
  return `${albumName} - ${filename}`;
};

const cullOldNodes = () => {
  if (!gallery) return;
  const cards = gallery.querySelectorAll('.photo-card');
  if (cards.length <= MAX_DOM_NODES) return;
  const excess = cards.length - MAX_DOM_NODES;
  for (let i = 0; i < excess; i++) {
    if (cards[i] && cards[i] !== sentinel) cards[i].remove();
  }
};

// ---------- IO: lazy-load thumbs ----------
let ioThumb;
const ensureThumbObserver = () => {
  if (ioThumb) return ioThumb;
  ioThumb = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const img = e.target;
      ioThumb.unobserve(img);
      const real = img.dataset.src;
      if (real) img.src = real;
    }
  }, { rootMargin: IO_ROOT_MARGIN, threshold: 0.01 });
  return ioThumb;
};

// ---------- IO: infinite scroll ----------
let ioMore;
const ensureMoreObserver = () => {
  if (ioMore) return ioMore;
  ioMore = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      appendNextBatch();
    }
  }, { rootMargin: IO_ROOT_MARGIN, threshold: 0.01 });
  return ioMore;
};

const updateBackToTopVisibility = () => {
  if (!backToTopBtn) return;
  const threshold = 600;
  if (window.scrollY > threshold) backToTopBtn.classList.add('show');
  else backToTopBtn.classList.remove('show');
};

const initAlbums = async () => {
  setLoading(Boolean(SHOW_LOADING));
  if (notice) notice.hidden = true;
  if (gallery) gallery.innerHTML = '';

  const albums = await fetchData('images/albums.json', [
    { "name": "Club Fair 2025", "folder": "images/dev club" }
  ]);

  if (!albums || albums.length === 0) {
    showError('No albums found. Please check images/albums.json.');
    return;
  }

  if (albumControls) {
    albumControls.innerHTML = '';
    albums.forEach(album => {
      const button = document.createElement('button');
      button.className = 'album-button';
      button.textContent = album.name;

      const dot = document.createElement('span');
      dot.className = 'dot';
      button.prepend(dot);

      button.addEventListener('click', () => {
        document.querySelectorAll('.album-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        loadGallery(album);
      });

      albumControls.appendChild(button);
    });
  }

  setLoading(false);

  const firstBtn = document.querySelector('.album-button');
  if (firstBtn) firstBtn.classList.add('active');
  if (albums[0]) await loadGallery(albums[0]);
};

// ---------- Gallery (infinite scroll + lazy + DOM cap) ----------
const loadGallery = async (album) => {
  // NEW: free previous observers so they don't stack
  ioThumb?.disconnect();
  ioMore?.disconnect();

  currentAlbum = album;
  setLoading(Boolean(SHOW_LOADING));
  if (gallery) gallery.innerHTML = '';
  if (notice) notice.hidden = true;

  currentManifest = [];
  currentIndex = -1;
  nextIndexToAppend = 0;

  if (sentinel && sentinel.isConnected) sentinel.remove();
  sentinel = document.createElement('div');
  sentinel.className = 'scroll-sentinel';
  sentinel.setAttribute('aria-hidden', 'true');

  ensureThumbObserver();
  ensureMoreObserver();

  
  const manifestPath = `${album.folder}/manifest.json`;
  const list = await fetchData(manifestPath, [ "images/dev club/logo copy.png" ]);
  setLoading(false);

  if (!list || list.length === 0) {
    showError(`No photos found in "${album.name}". Please update its manifest.json.`);
    return;
  }

  currentManifest = list.map(item => {
    const full = (typeof item === 'string' && item.includes('/')) ? item : `${album.folder}/${item}`;
    return full;
  });

 
  appendNextBatch();

  if (gallery) {
    gallery.appendChild(sentinel);
    ensureMoreObserver().observe(sentinel);
  }
};

const appendNextBatch = () => {
  if (!gallery) return;
  if (nextIndexToAppend >= currentManifest.length) return;

  const end = Math.min(nextIndexToAppend + BATCH_SIZE, currentManifest.length);
  const frag = document.createDocumentFragment();

  for (let idx = nextIndexToAppend; idx < end; idx++) {
    const src = currentManifest[idx];

    const fig = document.createElement('figure');
    fig.className = 'photo-card';
    fig.dataset.index = idx;

    const img = document.createElement('img');
    img.className = 'thumb';
    img.alt = buildAlt(currentAlbum.name, src);
    img.loading = 'lazy';
    img.decoding = 'async';

    img.dataset.src = encodeURI(src);
    img.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22180%22></svg>';

    img.onerror = function () {
      this.removeAttribute('data-src'); // avoid retry loops
      this.alt = 'Image failed to load';
    };

    img.addEventListener('click', () => openLightbox(idx));

    fig.appendChild(img);
    frag.appendChild(fig);

    ensureThumbObserver().observe(img);
  }

  if (sentinel && sentinel.parentNode === gallery) {
    gallery.insertBefore(frag, sentinel);
  } else {
    gallery.appendChild(frag);
  }

  nextIndexToAppend = end;
  cullOldNodes();
};

const openLightbox = (index) => {
  currentIndex = index;
  updateLightbox();
  if (!lightbox) return;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  if (lbImg) lbImg.src = '';
};

const updateLightbox = () => {
  if (currentIndex < 0 || currentIndex >= currentManifest.length) {
    if (lbImg) { lbImg.src = ''; lbImg.alt = ''; }
    if (lbCaption) lbCaption.textContent = '';
    if (lbCounter) lbCounter.textContent = '';
    if (dlLink) {
      dlLink.removeAttribute('href');
      dlLink.removeAttribute('download');
      dlLink.setAttribute('aria-disabled','true');
      dlLink.title = 'Download';
    }
    return;
  }

  const src = currentManifest[currentIndex];
  const safeSrc = encodeURI(src);

  if (lbImg) lbImg.src = safeSrc;

  const filenameText = src.split('/').pop().replace(/\.(jpg|jpeg|png|gif|webp|avif)$/i, '').replace(/[-_]/g, ' ');
  if (lbImg) lbImg.alt = `${currentAlbum.name} - ${filenameText}`;
  if (lbCaption) lbCaption.textContent = filenameText;
  if (lbCounter) lbCounter.textContent = `${currentIndex + 1} of ${currentManifest.length}`;

  if (dlLink) {
    const originalName = src.split('/').pop();
    dlLink.href = safeSrc;
    dlLink.setAttribute('download', originalName);
    dlLink.setAttribute('aria-disabled','false');
    dlLink.title = `Download ${originalName}`;
  }
};

const showPrev = () => { if (currentIndex > 0) { currentIndex--; updateLightbox(); } };
const showNext = () => { if (currentIndex < currentManifest.length - 1) { currentIndex++; updateLightbox(); } };

document.getElementById('lb-close')?.addEventListener('click', closeLightbox);
document.getElementById('lb-prev')?.addEventListener('click', showPrev);
document.getElementById('lb-next')?.addEventListener('click', showNext);

document.addEventListener('keydown', (e) => {
  if (!lightbox?.classList.contains('open')) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') closeLightbox();
  if (k === 'arrowleft') showPrev();
  if (k === 'arrowright') showNext();
  if (k === 'd' && dlLink && dlLink.getAttribute('aria-disabled') === 'false') dlLink.click();
});

lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

dlLink?.addEventListener('click', (e) => {
  if (dlLink.getAttribute('aria-disabled') === 'true' || !dlLink.href || dlLink.href === '#') {
    e.preventDefault();
    e.stopPropagation();
  }
});

// ---------- Back-to-top ----------
const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

backToTopBtn?.addEventListener('click', () => {
  if (prefersReduced) window.scrollTo(0, 0);
  else window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
updateBackToTopVisibility();

// ---------- Bootstrap ----------
window.addEventListener('load', initAlbums);
