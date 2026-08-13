import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';

// Navigation header for Auth pages
const AuthNav = () => (
  <div className="absolute top-4 right-4 space-x-4 z-10">
    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
      Sign In
    </Link>
    <Link to="/register" className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
      Create Account
    </Link>
  </div>
);

// Inner component so we can use the useLocation hook (which must be inside <Router>)
const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      {isAuthPage && <AuthNav />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;