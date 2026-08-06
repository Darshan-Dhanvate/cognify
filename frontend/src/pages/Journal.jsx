import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Journal = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [journals, setJournals] = useState([]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.token) {
      navigate('/login');
      return;
    }
    fetchJournals();
  }, [user, navigate]);

  const fetchJournals = async () => {
    try {
      const response = await fetch('/api/journals', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) setJournals(data);
    } catch (error) {
      console.error('Error fetching journals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ content })
      });

      const newEntry = await response.json();
      if (response.ok) {
        setJournals([newEntry, ...journals]);
        setContent('');
      }
    } catch (error) {
      console.error('Error creating journal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading Cognitive Logs...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <Navbar/>

      <main className="max-w-4xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8 fade-in">
        
        {/* Left Column: Input Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 sticky top-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Log Mental State</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What is occupying your mind? Are you feeling resistance to any tasks?
                </label>
                <textarea 
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Stream of consciousness goes here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none h-48"
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2 px-4 rounded-md text-white font-medium text-sm transition-colors ${isSubmitting ? 'bg-indigo-400' : 'bg-indigo-800 hover:bg-indigo-900'}`}
              >
                {isSubmitting ? 'Encrypting Log...' : 'Commit to Log'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Historical Logs */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Psychological Archive</h2>
          
          {journals.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500">
              Your archive is empty. Begin logging to generate insights.
            </div>
          ) : (
            <div className="space-y-6">
              {journals.map((journal) => (
                <div key={journal._id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(journal.createdAt).toLocaleDateString()} • {new Date(journal.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    
                    {/* Placeholder for future ML data */}
                    {journal.psychologicalAnalysis?.moodState ? (
                       <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                         {journal.psychologicalAnalysis.moodState}
                       </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200">
                        Awaiting ML Analysis
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{journal.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Journal;