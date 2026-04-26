import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import * as albumsService from '../../services/albumsService';

export default function AdminAlbumsPage() {
  const { token, logout } = useAuth();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await albumsService.getAlbums({ page: 1, limit: 200 });
      setAlbums(response.items);
    } catch (requestError) {
      if (requestError.status === 401) {
        logout();
      }
      setError(requestError.message || 'Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setEditing(null);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (editing) {
        await albumsService.updateAlbum({
          token,
          albumId: editing.id,
          payload: { title, description }
        });
      } else {
        await albumsService.createAlbum({
          token,
          payload: { title, description }
        });
      }
      clearForm();
      await load();
    } catch (requestError) {
      if (requestError.status === 401) {
        logout();
      }
      setError(requestError.message || 'Failed to save album');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setError('');

    try {
      await albumsService.deleteAlbum({ token, albumId: deleteTarget.id });
      setDeleteTarget(null);
      await load();
    } catch (requestError) {
      if (requestError.status === 401) {
        logout();
      }
      setError(requestError.message || 'Failed to delete album');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-shell admin-shell">
      <div className="row between center mb-sm">
        <h1>Album Management</h1>
        <div className="row gap-sm">
          <Link className="btn btn-ghost" to="/admin">Dashboard</Link>
          <button className="btn btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="card-grid">
        <section className="card">
          <h2>{editing ? 'Edit Album' : 'Create Album'}</h2>
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>

            <label>
              Description
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <div className="row gap-sm">
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save Album'}</button>
              {editing ? (
                <button type="button" className="btn btn-ghost" onClick={clearForm}>Cancel Edit</button>
              ) : null}
            </div>
          </form>
          {error && <p className="error-text mt-sm">{error}</p>}
        </section>

        <section className="card">
          <h2>Existing Albums</h2>
          {loading && <p>Loading...</p>}
          {!loading && albums.length === 0 && <p>No albums yet.</p>}

          <div className="list-block">
            {albums.map((album) => (
              <article key={album.id} className="list-item">
                <div>
                  <h3>{album.title}</h3>
                  <p>{album.description || 'No description'}</p>
                  <small>{album.image_count} images</small>
                </div>
                <div className="row gap-sm">
                  <Link className="btn btn-ghost" to={`/admin/albums/${album.id}/images`}>Images</Link>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setEditing(album);
                      setTitle(album.title);
                      setDescription(album.description || '');
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => setDeleteTarget(album)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete album"
        message={`Are you sure you want to delete "${deleteTarget?.title || ''}"? This will remove all images in this album.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}
