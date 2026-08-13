import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Accept 'children' as a prop
const Navbar = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Command Center' },
    { path: '/calendar', label: 'Timeline Schedule' },
    { path: '/journal', label: 'Cognitive Journal' },
    { path: '/analytics', label: 'Analytics' } // Add this line
  ];

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 w-full h-16">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Cognify Engine</h1>
        <div className="hidden md:flex gap-6 border-l pl-8 border-slate-200">
          {navLinks.map(link => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.path 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 pb-0.5' 
                  : 'text-slate-500 hover:text-indigo-500'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Render page-specific buttons (like Focus Mode) here */}
        {children} 
        
        <span className="text-sm text-slate-600">Operator: <strong>{user?.username}</strong></span>
        <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors">
          Disconnect
        </button>
      </div>
    </nav>
  );
};

export default Navbar;