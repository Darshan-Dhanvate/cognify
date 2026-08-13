import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [tasksRes, journalsRes] = await Promise.all([
        fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${user.token}` } }),
        fetch('/api/journal', { headers: { 'Authorization': `Bearer ${user.token}` } })
      ]);

      const tasksData = await tasksRes.json();
      const journalsData = await journalsRes.json();

      if (tasksRes.ok) setTasks(tasksData);
      if (journalsRes.ok) setJournals(journalsData.data || journalsData || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-emerald-50 text-emerald-600 font-medium">Compiling Telemetry...</div>;

  // --- DATA CALCULATIONS ---
  
  // 1. Burnout & Mood Metrics
  const latestJournal = journals.length > 0 ? journals[0] : null;
  const currentBurnoutRisk = latestJournal?.psychologicalAnalysis?.burnoutRiskPercentage || 0;
  const isAtRisk = latestJournal?.psychologicalAnalysis?.isAtRisk || false;
  
  const moodCounts = journals.reduce((acc, journal) => {
    const mood = journal.psychologicalAnalysis?.moodState;
    if (mood) acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});

  // 2. Task Velocity Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  
  const inProgressTasks = tasks.filter(t => t.status === 'In-Progress').length;
  
  // 3. Procrastination Metrics (Push Count)
  const totalPushes = tasks.reduce((acc, task) => acc + (task.pushCount || 0), 0);
  const delayedTasks = tasks.filter(t => (t.pushCount || 0) > 0).length; // FIXED

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-indigo-50/30 transition-all duration-700 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto py-10 px-4 fade-in">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Analytics</h2>
          <p className="text-emerald-600/80 font-medium mt-1">Real-time telemetry from your Analytical Engine.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* TOP ROW: Burnout Model (XGBoost/LightGBM Output) */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-teal-900/5 border border-white">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Ensemble Model Prediction</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              
              <div className="relative flex items-center justify-center w-48 h-48 rounded-full border-[12px] border-slate-100 shrink-0 shadow-inner">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="44" 
                    fill="none" 
                    stroke={isAtRisk ? '#f43f5e' : '#10b981'} 
                    strokeWidth="12" 
                    strokeDasharray="276.46" 
                    strokeDashoffset={276.46 - (276.46 * currentBurnoutRisk) / 100} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="text-center z-10">
                  <span className={`text-4xl font-black ${isAtRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {currentBurnoutRisk.toFixed(1)}%
                  </span>
                  <span className="block text-xs font-bold text-slate-400 mt-1">RISK LEVEL</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div className={`p-5 rounded-2xl border ${isAtRisk ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <h4 className={`font-bold mb-2 ${isAtRisk ? 'text-rose-800' : 'text-emerald-800'}`}>
                    {isAtRisk ? '⚠️ High Burnout Trajectory Detected' : '🌿 Sustainable Pacing'}
                  </h4>
                  <p className={`text-sm leading-relaxed ${isAtRisk ? 'text-rose-700/80' : 'text-emerald-700/80'}`}>
                    {isAtRisk 
                      ? 'Your text sentiment combined with delayed task execution indicates a high probability of cognitive fatigue. Recommendation: Enter Focus Mode and clear a small quick-task to build momentum.' 
                      : 'Your task velocity matches your cognitive load. Keep maintaining this pace.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TOP ROW: Mood Distribution */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-teal-900/5 border border-white flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Mood Distribution</h3>
            {Object.keys(moodCounts).length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">No mood data logged.</div>
            ) : (
              <div className="space-y-4 flex-1 justify-center flex flex-col">
                {Object.entries(moodCounts).map(([mood, count]) => (
                  <div key={mood} className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-slate-700 w-24">{mood}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full" 
                        style={{ width: `${(count / journals.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BOTTOM ROW: Execution Velocity */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-white">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Completion Rate</span>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-black text-slate-800">{completionRate}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-4 font-medium">{completedTasks} of {totalTasks} total tasks cleared.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-white">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Active Pipeline</span>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black text-indigo-600">{inProgressTasks}</span>
              </div>
              <p className="text-sm text-slate-600 font-medium">tasks currently tracking as <strong className="text-indigo-600">In-Progress</strong>.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-white">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Procrastination Index</span>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-5xl font-black ${totalPushes > 5 ? 'text-rose-500' : 'text-orange-500'}`}>{totalPushes}</span>
                <span className="text-sm font-bold text-slate-400 mb-1.5">total delays</span>
              </div>
              <p className="text-sm text-slate-600 font-medium">Across <strong className="text-slate-800">{delayedTasks}</strong> distinct tasks.</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;