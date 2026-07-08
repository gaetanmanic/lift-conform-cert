import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useStore } from './store/useStore';

// Lazy load components
const Login = React.lazy(() => import('./pages/Login'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const CertificateForm = React.lazy(() => import('./pages/CertificateForm'));

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: 'admin' | 'user' }) => {
  const currentUser = useStore((state) => state.currentUser);
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (role && currentUser.role !== role) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/user'} replace />;
  }
  
  return <>{children}</>;
};

function App() {
  React.useEffect(() => {
    document.title = "AMPHY THEATRE - Certificats de Conformité";
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/admin/*" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/user/*" element={
              <ProtectedRoute role="user">
                <UserDashboard />
              </ProtectedRoute>
            } />

            <Route path="/generate" element={
              <ProtectedRoute>
                <CertificateForm />
              </ProtectedRoute>
            } />

            <Route path="/edit/:id" element={
              <ProtectedRoute>
                <CertificateForm />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </React.Suspense>
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}

export default App;
