import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Journal = () => {
  const { user } = useContext(AuthContext);
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
      // Assuming your backend has a GET route to fetch past journals
      const response = await fetch('/api/journal', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      // Handle standard array or wrapped { data: [...] } response
      if (response.ok) setJournals(data.data || data || []);
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
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ content })
      });

      const responseData = await response.json();
      
      if (response.ok) {
        // Handle the nested 'data' object from your Phase 2 spec
        const newEntry = responseData.data || responseData;
        setJournals([newEntry, ...journals]);
        setContent('');
      }
    } catch (error) {
      console.error('Error creating journal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodColor = (mood) => {
    const colors = {
      'Calm': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Focused': 'bg-blue-100 text-blue-800 border-blue-200',
      'Anxious': 'bg-orange-100 text-orange-800 border-orange-200',
      'Overwhelmed': 'bg-rose-100 text-rose-800 border-rose-200'
    };
    return colors[mood] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-emerald-50 text-emerald-600 font-medium">Loading Psychological Archive...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-indigo-50/30 transition-all duration-700 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto py-10 px-4 grid grid-cols-1 lg:grid-cols-12 gap-10 fade-in">
        
        {/* Left Column: Input Form */}
        <div className="lg:col-span-4">
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-teal-900/5 border border-white sticky top-10">
            <h2 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">Log Mental State</h2>
            <p className="text-sm text-emerald-600/80 mb-6 font-medium">Offload cognitive friction for AI analysis.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea 
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What is occupying your mind? Are you feeling resistance to any tasks?"
                  className="w-full px-4 py-4 bg-white/80 border border-emerald-100 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all shadow-sm resize-none h-56 leading-relaxed text-slate-700"
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-4 rounded-2xl text-white font-bold text-sm transition-all shadow-lg transform hover:-translate-y-0.5 ${isSubmitting ? 'bg-emerald-300 animate-pulse' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}
              >
                {isSubmitting ? 'Processing via Analytical Engine...' : 'Commit to Log'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Historical Logs & Insights */}
        <div className="lg:col-span-8">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-8 tracking-tight">Psychological Archive</h2>
          
          {journals.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-sm border border-dashed border-emerald-200 rounded-3xl p-16 text-center text-emerald-600/60 font-medium text-lg">
              Your archive is empty. Begin logging to generate insights.
            </div>
          ) : (
            <div className="space-y-8">
              {journals.map((journal) => {
                const analysis = journal.psychologicalAnalysis;
                
                return (
                  <div key={journal._id} className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-teal-900/5 transition-all hover:shadow-2xl">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(journal.createdAt).toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {analysis?.moodState && (
                        <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getMoodColor(analysis.moodState)}`}>
                          {analysis.moodState}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-base text-slate-700 whitespace-pre-wrap leading-relaxed mb-8">{journal.content}</p>

                    {/* AI Feedback Dashboard */}
                    {analysis && (
                      <div className="mt-6 pt-6 border-t border-emerald-100/60">
                        <h4 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-4">Analytical Engine Telemetry</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {/* Burnout Risk Gauge */}
                          <div className={`p-4 rounded-2xl border ${analysis.isAtRisk ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                            <span className="text-xs font-bold text-slate-500 block mb-1">Burnout Risk (Ensemble Model)</span>
                            <div className="flex items-end gap-2">
                              <span className={`text-2xl font-black ${analysis.isAtRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {analysis.burnoutRiskPercentage?.toFixed(1) || 0}%
                              </span>
                              {analysis.isAtRisk && <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-bold uppercase mb-1">Critical</span>}
                            </div>
                          </div>

                          {/* Stress Score */}
                          <div className="p-4 rounded-2xl border bg-slate-50 border-slate-100">
                            <span className="text-xs font-bold text-slate-500 block mb-1">Stress Score (NLP)</span>
                            <span className="text-2xl font-black text-slate-700">{analysis.stressScore?.toFixed(1) || 0}</span>
                            <span className="text-xs text-slate-400 font-medium ml-1">/ 100</span>
                          </div>
                        </div>

                        {/* Distortions & Reframing */}
                        {analysis.detectedDistortions?.length > 0 && (
                          <div className="mb-4">
                            <span className="text-xs font-bold text-slate-500 block mb-2">Detected Cognitive Distortions</span>
                            <div className="flex flex-wrap gap-2">
                              {analysis.detectedDistortions.map((dist, idx) => (
                                <span key={idx} className="text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-lg">
                                  {dist}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.suggestedReframing && (
                          <div className="mt-4 bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-100/50 p-5 rounded-2xl">
                            <span className="text-xs font-bold text-indigo-500 block mb-2 uppercase tracking-wider">AI Reframe Suggestion</span>
                            <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                              "{analysis.suggestedReframing}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Journal;