import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { QueueProvider } from './contexts/QueueContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TriagePage from './pages/TriagePage';
import QueuePage from './pages/QueuePage';
import DoctorPage from './pages/DoctorPage';
import NotFoundPage from './pages/NotFoundPage';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  const { currentUser } = useAuth();
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <Routes>
          <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/register" element={currentUser ? <Navigate to="/" /> : <RegisterPage />} />
          
          <Route path="/" element={
            currentUser ? (
              currentUser.role === 'DOCTOR' ? 
                <Navigate to="/doctor" /> : 
                <Navigate to="/triage" />
            ) : (
              <Navigate to="/login" />
            )
          } />
          
          <Route path="/triage" element={
            <ProtectedRoute allowedRoles={['NURSE']}>
              <QueueProvider>
                <TriagePage />
              </QueueProvider>
            </ProtectedRoute>
          } />
          
          <Route path="/queue" element={
            <ProtectedRoute>
              <QueueProvider>
                <QueuePage />
              </QueueProvider>
            </ProtectedRoute>
          } />
          
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <QueueProvider>
                <DoctorPage />
              </QueueProvider>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;