import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import * as albumsService from '../../services/albumsService';
import * as imagesService from '../../services/imagesService';

export default function AdminAlbumImagesPage() {
  const { albumId } = useParams();
  const { token, logout } = useAuth();

  const [album, setAlbum] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [albumResponse, imagesResponse] = await Promise.all([
        albumsService.getAlbumById(albumId),
        albumsService.getAlbumImages({ albumId, page: 1, limit: 200 })
      ]);

      setAlbum(albumResponse.item);
      setImages(imagesResponse.items);
    } catch (requestError) {
      if (requestError.status === 401) {
        logout();
      }
      setError(requestError.message || 'Failed to load album images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [albumId]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setError('');
    setProgressText(`Uploading ${files.length} file(s)...`);

    try {
      await imagesService.uploadImagesToAlbum({ token, albumId, files });
      setProgressText('Upload complete');
      await load();
    } catch (requestError) {
      if (requestError.status === 401) {
        logout();
      }
      setError(requestError.message || 'Failed to upload images');
      setProgressText('');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteTarget) return;
    setUploading(true);

    try {
      await imagesService.deleteImage({ token, imageId: deleteTarget.id });
      setImages((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (requestError) {
      if (requestError.status === 401) {
        logout();
      }
      setError(requestError.message || 'Failed to delete image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-shell admin-shell">
      <div className="row between center mb-sm">
        <div>
          <p className="eyebrow">Album Images</p>
          <h1>{album?.title || 'Album'}</h1>
        </div>
        <div className="row gap-sm">
          <Link className="btn btn-ghost" to="/admin/albums">Back</Link>
          <button className="btn btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </div>

      <section className="card mb-sm">
        <h2>Upload Images</h2>
        <p>Allowed formats: jpg, jpeg, png, webp</p>
        <input type="file" accept=".jpg,.jpeg,.png,.webp,image/*" multiple onChange={handleUpload} disabled={uploading} />
        {progressText && <p className="muted mt-sm">{progressText}</p>}
        {error && <p className="error-text mt-sm">{error}</p>}
      </section>

      <section className="card">
        <h2>Images</h2>
        {loading && <p>Loading images...</p>}
        {!loading && images.length === 0 && <p>No images yet.</p>}

        <div className="gallery-grid admin-gallery">
          {images.map((image) => (
            <article className="image-admin-card" key={image.id}>
              <img src={image.thumbnailUrl} alt={image.original_filename} loading="lazy" />
              <div className="row between center mt-sm">
                <small title={image.original_filename}>{image.original_filename}</small>
                <button className="btn btn-danger btn-xs" onClick={() => setDeleteTarget(image)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete image"
        message={`Delete image "${deleteTarget?.original_filename || ''}" from this album?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteImage}
        busy={uploading}
      />
    </div>
  );
}
