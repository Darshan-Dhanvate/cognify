import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';

// A placeholder for our main application interface
const DashboardPlaceholder = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
    <h1 className="text-3xl font-bold text-slate-800 mb-4">Cognify Command Center</h1>
    <p className="text-slate-600">Secure JWT Authentication Successful.</p>
  </div>
);

// Navigation header to easily switch between Login and Register during testing
const AuthNav = () => (
  <div className="absolute top-4 right-4 space-x-4">
    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
      Sign In
    </Link>
    <Link to="/register" className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
      Create Account
    </Link>
  </div>
);

const App = () => {
  return (
    <Router>
      {/* Renders the top navigation only on Auth pages */}
      <Routes>
        <Route path="/login" element={<AuthNav />} />
        <Route path="/register" element={<AuthNav />} />
      </Routes>

      <Routes>
        {/* Automatically redirect the root URL to the login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Dashboard Route (UI coming next) */}
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
      </Routes>
    </Router>
  );
};

export default App;