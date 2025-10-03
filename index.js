 const SHOW_LOADING = false;

    const DEFAULT_ALBUMS = [
      { "name": "Club Fair 2025", "folder": "images/dev club" }
    ];

    const DEFAULT_MANIFEST = [ "images/dev club/logo copy.png" ];

    let currentManifest = [];
    let currentIndex = -1;
    let currentAlbum = null;

    const gallery = document.getElementById('gallery');
    const notice = document.getElementById('notice');
    const albumControls = document.getElementById('album-controls');
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lb-img');
    const lbCaption = document.getElementById('lb-caption');
    const lbCounter = document.getElementById('lb-counter');
    const loading = document.getElementById('loading');

    function setLoading(visible) {
      if (visible) {
        loading.style.display = 'flex';
        loading.removeAttribute('hidden');
        loading.setAttribute('aria-hidden', 'false');
      } else {
        loading.style.display = 'none';
        loading.setAttribute('hidden', '');
        loading.setAttribute('aria-hidden', 'true');
      }
    }

    async function fetchData(path, fallbackData = null) {
      try {
        console.log('Fetching:', path);
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
        return await res.json();
      } catch (error) {
        console.warn(`Could not load ${path}, using fallback data:`, error);
        return fallbackData;
      }
    }

    async function initAlbums() {
      setLoading(Boolean(SHOW_LOADING));
      notice.hidden = true;
      gallery.innerHTML = '';

      const albums = await fetchData('images/albums.json', DEFAULT_ALBUMS);

      if (!albums || albums.length === 0) {
        showError('No albums found. Please check images/albums.json.');
        return;
      }

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

      setLoading(false);

      if (albums.length > 0) {
        const firstBtn = document.querySelector('.album-button');
        if (firstBtn) firstBtn.classList.add('active');
        await loadGallery(albums[0]);
      } else {
        notice.hidden = false;
      }
    }

    async function loadGallery(album) {
      currentAlbum = album;
      setLoading(Boolean(SHOW_LOADING));
      gallery.innerHTML = '';
      notice.hidden = true;

      const manifestPath = `${album.folder}/manifest.json`;
      const imagePaths = await fetchData(manifestPath, DEFAULT_MANIFEST);

      setLoading(false);

      if (!imagePaths || imagePaths.length === 0) {
        showError(`No photos found in "${album.name}". Please update its manifest.json.`);
        return;
      }

      currentManifest = imagePaths;
      gallery.innerHTML = '';
      notice.hidden = true;

      imagePaths.forEach((src, idx) => {
        const fig = document.createElement('figure');
        fig.className = 'photo-card';
        fig.dataset.index = idx;

        const img = document.createElement('img');
        img.className = 'thumb';
        img.src = src;
        img.loading = 'lazy';
        img.decoding = 'async';

        img.onerror = function() {
          this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDI0MCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNDAiIGhlaWdodD0iMjQwIiByeD0iMTIiIGZpbGw9InJnYmEoMTY4LCA4NSwgMjQ3LCAwLjEpIi8+CjxwYXRoIGQ9Ik0xMjAgODBWMTAwTTE0MCAxMjBIMTAwTTE2MCAxNDBINzBNMTQwIDE2MEgxMDBWMTgwIiBzdHJva2U9IiNhODU1ZjciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEyMCIgcj0iMjAiIHN0cm9rZT0iI2MwODRmYyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=';
          this.alt = 'Image failed to load';
        };

        const filename = src.split('/').pop().replace(/\.(jpg|jpeg|png|gif|webp)/i, '').replace(/[-_]/g, ' ');
        img.alt = `${album.name} - ${filename}`;

        img.addEventListener('click', () => openLightbox(idx));

        fig.appendChild(img);
        gallery.appendChild(fig);
      });
      currentIndex = -1;
      updateLightbox();
      if (imagePaths.length === 0) {
        notice.hidden = false;
      }
      setLoading(false);
    }
    function showError(message) {
      gallery.innerHTML = '';
      notice.hidden = false;
      notice.innerHTML = `<div class="empty-icon">⚠️</div><p>${message}</p>`;
    }
    function openLightbox(index) {
      currentIndex = index;
      updateLightbox();
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    function updateLightbox() {
      if (currentIndex < 0 || currentIndex >= currentManifest.length) {
        lbImg.src = '';
        lbImg.alt = '';
        lbCaption.textContent = '';
        lbCounter.textContent = '';
        return;
      }
      const src = currentManifest[currentIndex];
      lbImg.src = src;
      const filename = src.split('/').pop().replace(/\.(jpg|jpeg|png|gif|webp)/i, '').replace(/[-_]/g, ' ');
      lbImg.alt = `${currentAlbum.name} - ${filename}`;
      lbCaption.textContent = filename;
      lbCounter.textContent = `${currentIndex + 1} of ${currentManifest.length}`;
    }
    function showPrev() {
      if (currentIndex > 0) {
        currentIndex--;
        updateLightbox();
      }
    }
    function showNext() {
      if (currentIndex < currentManifest.length - 1) {
        currentIndex++;
        updateLightbox();
      }
    }
    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    document.getElementById('lb-prev').addEventListener('click', showPrev);
    document.getElementById('lb-next').addEventListener('click', showNext);
    document.addEventListener('keydown', (e) => {
      if (lightbox.classList.contains('open')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
      }
    });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    window.addEventListener('load', initAlbums);