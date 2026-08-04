import React from 'react';
import { Zap } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Zap className="text-indigo-600 w-6 h-6" />
        <span className="text-xl font-bold tracking-tight text-gray-900">Cognify</span>
      </div>
      <div className="text-sm font-medium text-gray-500">
        Energy State: <span className="text-green-500 bg-green-50 px-2 py-1 rounded-full">Optimal</span>
      </div>
    </nav>
  );
};

export default Navbar;