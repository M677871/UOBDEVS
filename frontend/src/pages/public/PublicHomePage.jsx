import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as albumsService from '../../services/albumsService';
import ImageLightbox from '../../components/ImageLightbox';

const PAGE_SIZE = 24;

export default function PublicHomePage() {
  const [albums, setAlbums] = useState([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [albumsError, setAlbumsError] = useState('');

  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState('');

  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setAlbumsLoading(true);
      setAlbumsError('');
      try {
        const response = await albumsService.getAlbums({ page: 1, limit: 50 });
        if (!active) return;
        setAlbums(response.items);
        const first = response.items[0];
        if (first) {
          setSelectedAlbumId(first.id);
        }
      } catch (error) {
        if (!active) return;
        setAlbumsError(error.message || 'Failed to load albums');
      } finally {
        if (active) {
          setAlbumsLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAlbumId) {
      return;
    }

    setImages([]);
    setPage(1);
    setHasMore(false);
    setImagesError('');

    let active = true;

    const run = async () => {
      setImagesLoading(true);
      try {
        const response = await albumsService.getAlbumImages({
          albumId: selectedAlbumId,
          page: 1,
          limit: PAGE_SIZE
        });
        if (!active) return;
        setImages(response.items);
        setHasMore(response.items.length < response.pagination.total);
        setPage(2);
      } catch (error) {
        if (!active) return;
        setImagesError(error.message || 'Failed to load images');
      } finally {
        if (active) {
          setImagesLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [selectedAlbumId]);

  useEffect(() => {
    if (!hasMore || imagesLoading) {
      return;
    }

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '300px 0px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, imagesLoading, page, selectedAlbumId]);

  const loadMore = async () => {
    if (!selectedAlbumId || imagesLoading || !hasMore) {
      return;
    }

    setImagesLoading(true);
    try {
      const response = await albumsService.getAlbumImages({
        albumId: selectedAlbumId,
        page,
        limit: PAGE_SIZE
      });
      setImages((prev) => [...prev, ...response.items]);
      const nextTotalLoaded = images.length + response.items.length;
      setHasMore(nextTotalLoaded < response.pagination.total);
      setPage((prev) => prev + 1);
    } catch (error) {
      setImagesError(error.message || 'Failed to load more images');
    } finally {
      setImagesLoading(false);
    }
  };

  const selectedAlbum = useMemo(
    () => albums.find((album) => album.id === selectedAlbumId) || null,
    [albums, selectedAlbumId]
  );

  return (
    <div className="page-shell">
      <header className="site-header-bar">
        <div className="brand-row">
          <img src="/logo.jpeg" alt="UOBDEVS Club Logo" className="brand-logo" />
          <div>
            <p className="eyebrow">University of Balamand</p>
            <h2 className="brand-title">UOBDEVS</h2>
          </div>
        </div>
        <Link to="/admin/login" className="btn btn-primary admin-login-btn">
          Admin Login
        </Link>
      </header>

      <header className="hero">
        <div>
          <p className="eyebrow">University of Balamand</p>
          <h1>UOBDEVS Photo Archive</h1>
          <p className="hero-copy">Moments, events, and projects from the UOBDEVS community.</p>
        </div>
        <div className="hero-badge">Public Gallery</div>
      </header>

      <main className="grid-layout">
        <aside className="card sidebar">
          <h2>Albums</h2>
          {albumsLoading && <p>Loading albums...</p>}
          {albumsError && <p className="error-text">{albumsError}</p>}
          <div className="album-list">
            {albums.map((album) => (
              <button
                key={album.id}
                className={`album-pill ${selectedAlbumId === album.id ? 'active' : ''}`}
                onClick={() => setSelectedAlbumId(album.id)}
              >
                <span>{album.title}</span>
                <small>{album.image_count} photos</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="card">
          <div className="row between center mb-sm">
            <div>
              <h2>{selectedAlbum?.title || 'Gallery'}</h2>
              {selectedAlbum?.description ? <p>{selectedAlbum.description}</p> : null}
            </div>
          </div>

          {imagesError && <p className="error-text">{imagesError}</p>}
          {!imagesLoading && images.length === 0 && <p>No images in this album yet.</p>}

          <div className="gallery-grid">
            {images.map((image, index) => (
              <button key={image.id} className="image-card" onClick={() => setLightboxIndex(index)}>
                <img src={image.thumbnailUrl} alt={image.original_filename} loading="lazy" decoding="async" />
              </button>
            ))}
          </div>

          <div ref={sentinelRef} className="sentinel" />
          {imagesLoading && <p>Loading images...</p>}
          {!hasMore && images.length > 0 && <p className="muted">End of album.</p>}
        </section>
      </main>

      {lightboxIndex >= 0 ? (
        <ImageLightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(-1)} />
      ) : null}

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand-block">
            <img src="/logo.jpeg" alt="UOBDEVS Club Logo" className="footer-logo" />
            <div>
              <h3>UOBDEVS</h3>
              <p>Developers Club • University of Balamand</p>
            </div>
          </div>

          <div className="footer-links">
            <a href="https://www.instagram.com/uobdevs?igsh=MWlyeWIxNGRwbjBxeg==" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://chat.whatsapp.com/GvpMk7Dn7HS5KDaSYxPXTW" target="_blank" rel="noreferrer">
              WhatsApp Community
            </a>
            <Link to="/admin/login">Admin Login</Link>
          </div>
        </div>
        <p className="footer-note">Designed and developed by UOBDEVS.</p>
      </footer>
    </div>
  );
}
