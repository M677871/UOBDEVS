import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardPage() {
  const auth = useAuth();

  return (
    <div className="page-shell admin-shell">
      <div className="card">
        <div className="row between center">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>Welcome, {auth.user?.username}</h1>
          </div>
          <button className="btn btn-ghost" onClick={auth.logout}>Sign out</button>
        </div>

        <div className="card-grid mt-md">
          <Link className="card action-card" to="/admin/albums">
            <h3>Manage Albums</h3>
            <p>Create albums, edit metadata, and delete albums.</p>
          </Link>

          <Link className="card action-card" to="/">
            <h3>Open Public Site</h3>
            <p>View the public gallery experience.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
