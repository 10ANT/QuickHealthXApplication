import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout, isDoctor, isNurse } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">ER Queue System</Link>
          
          {currentUser ? (
            <div className="flex items-center space-x-6">
              {isNurse && (
                <Link to="/triage" className="hover:text-blue-200">Triage</Link>
              )}
              
              <Link to="/queue" className="hover:text-blue-200">Queue</Link>
              
              {isDoctor && (
                <Link to="/doctor" className="hover:text-blue-200">Doctor Panel</Link>
              )}
              
              <div className="flex items-center space-x-3">
                <span>
                  {currentUser.name} ({currentUser.role})
                </span>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-x-4">
              <Link to="/login" className="hover:text-blue-200">Login</Link>
              <Link to="/register" className="hover:text-blue-200">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;