import { Navigate, Route, Routes } from 'react-router-dom';
import PublicHomePage from './pages/public/PublicHomePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminAlbumsPage from './pages/admin/AdminAlbumsPage';
import AdminAlbumImagesPage from './pages/admin/AdminAlbumImagesPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/albums"
        element={
          <ProtectedRoute>
            <AdminAlbumsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/albums/:albumId/images"
        element={
          <ProtectedRoute>
            <AdminAlbumImagesPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
