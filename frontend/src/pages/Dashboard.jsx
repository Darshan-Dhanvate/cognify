import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); 
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [parentTask, setParentTask] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [isOverwhelming, setIsOverwhelming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !user.token) {
      navigate('/login');
      return;
    }
    fetchTasks();
  }, [user, navigate]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) setTasks(data);
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          title, 
          description, 
          priority,
          targetDate,
          parentTask: parentTask || null,
          isOverwhelming 
        })
      });

      const newTask = await response.json();
      if (response.ok) {
        setTasks((prev) => [...prev, newTask]);
        setTitle('');
        setDescription('');
        setPriority('medium');
        setParentTask('');
        setTargetDate(new Date().toISOString().split('T')[0]);
        setIsOverwhelming(false);
        if (activeTab === 'completed') setActiveTab('active');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
      await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) { fetchTasks(); }
  };

  const handleToggleMicroStep = async (task, stepId) => {
    const updatedSteps = task.microSteps.map(step => 
      step._id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
    );
    try {
      setTasks(tasks.map(t => t._id === task._id ? { ...t, microSteps: updatedSteps } : t));
      const response = await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ microSteps: updatedSteps })
      });
      if (response.ok) fetchTasks();
    } catch (error) { fetchTasks(); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Permanently delete this task?")) return;
    try {
      setTasks(tasks.filter(t => t._id !== taskId));
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
    } catch (error) { fetchTasks(); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-emerald-50 text-emerald-600">Loading Command Center...</div>;

  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  
  const activeTasks = tasks
    .filter(t => t.status !== 'Completed')
    .sort((a, b) => {
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const focusTask = activeTasks.length > 0 ? activeTasks[0] : null;
  const nextMicroStep = focusTask?.microSteps?.find(step => !step.isCompleted);

  const getPriorityBadge = (prio) => {
    const styles = {
      low: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      medium: 'bg-teal-50 text-teal-700 border-teal-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
    };
    return `text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${styles[prio] || styles.medium}`;
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateString);
    return target < today;
  };

  const renderTree = (parentId = null, level = 0) => {
    const children = activeTasks.filter(t => parentId ? t.parentTask === parentId : !t.parentTask);
    if (children.length === 0) return null;

    return (
      <div className={`space-y-4 ${level > 0 ? 'ml-6 border-l-2 border-emerald-100 pl-4 mt-4' : ''}`}>
        {children.map(task => (
          <div key={task._id} className="relative">
            <div className={`bg-white/80 backdrop-blur-sm p-4 rounded-xl border shadow-sm transition-all duration-300 ${isOverdue(task.targetDate) ? 'border-rose-300 bg-rose-50/50' : 'border-emerald-100 hover:border-emerald-300 hover:shadow-md'}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <input type="checkbox" onChange={() => handleToggleTaskStatus(task)} className="h-5 w-5 text-emerald-600 rounded border-emerald-300 cursor-pointer focus:ring-emerald-500 transition-colors" />
                  <div>
                    <h3 className="text-md font-medium text-slate-800">{task.title}</h3>
                    {task.targetDate && (
                      <span className={`text-xs font-medium ${isOverdue(task.targetDate) ? 'text-rose-500' : 'text-emerald-600/70'}`}>
                        {isOverdue(task.targetDate) ? '⚠️ OVERDUE: ' : 'Target: '}
                        {new Date(task.targetDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                  <button onClick={() => handleDeleteTask(task._id)} className="text-slate-300 hover:text-rose-400 transition-colors" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            </div>
            {renderTree(task._id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-indigo-50/30 transition-all duration-700">
      <Navbar>
        <button onClick={() => setIsFocusMode(!isFocusMode)} className={`text-sm font-medium px-5 py-2 rounded-full transition-all duration-300 shadow-sm ${isFocusMode ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-100'}`}>
          {isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
        </button>
      </Navbar>

      {isFocusMode ? (
        <main className="max-w-3xl mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[80vh] text-center fade-in">
          {!focusTask ? (
            <div className="text-emerald-600/60">
              <h2 className="text-4xl font-light mb-4">Sanctuary Clear</h2>
              <p className="text-lg">You have no active tasks. Enjoy the stillness.</p>
            </div>
          ) : (
            <div className="w-full">
              <span className="text-xs font-bold text-teal-600 tracking-widest uppercase mb-4 block">Current Objective</span>
              <h2 className="text-4xl font-extrabold text-slate-800 mb-12 tracking-tight">{focusTask.title}</h2>
              {nextMicroStep ? (
                <div className="bg-white/90 backdrop-blur-lg p-12 rounded-3xl shadow-2xl shadow-teal-900/5 border border-white transform transition-all hover:scale-[1.02]">
                  <span className="text-xs font-mono text-emerald-500 mb-3 block">AI Micro-Step ({nextMicroStep.timeEstimate}m)</span>
                  <p className="text-2xl text-slate-700 font-medium mb-10 leading-relaxed">{nextMicroStep.title}</p>
                  <button onClick={() => handleToggleMicroStep(focusTask, nextMicroStep._id)} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto transform hover:-translate-y-1">
                    Mark Step Complete
                  </button>
                </div>
              ) : (
                <button onClick={() => handleToggleTaskStatus(focusTask)} className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-10 py-4 rounded-full font-bold text-lg hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Finalize Objective
                </button>
              )}
            </div>
          )}
        </main>
      ) : (
        <main className="max-w-7xl mx-auto py-10 px-4 grid grid-cols-1 md:grid-cols-12 gap-10 fade-in">
          
          <div className="md:col-span-4">
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl shadow-teal-900/5 border border-white sticky top-10">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Initialize Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Objective</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Make tea" className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all shadow-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all shadow-sm">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Date</label>
                    <input type="date" required value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all shadow-sm text-slate-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent Task</label>
                  <select value={parentTask} onChange={(e) => setParentTask(e.target.value)} className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all shadow-sm">
                    <option value="">None (Root Task)</option>
                    {activeTasks.filter(t => !t.parentTask).map(t => (
                      <option key={t._id} value={t._id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Details (Optional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all shadow-sm resize-none h-20" />
                </div>

                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <input type="checkbox" id="overwhelm-flag" checked={isOverwhelming} onChange={(e) => setIsOverwhelming(e.target.checked)} className="h-5 w-5 text-teal-600 rounded border-emerald-200 focus:ring-teal-500 cursor-pointer" />
                  <label htmlFor="overwhelm-flag" className="text-sm font-semibold text-teal-800 cursor-pointer">
                    Flag as Overwhelming (Trigger AI)
                  </label>
                </div>

                <button type="submit" disabled={isSubmitting} className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm transition-all shadow-md transform hover:-translate-y-0.5 ${isSubmitting ? 'bg-emerald-300' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}>
                  {isSubmitting ? 'Processing...' : 'Engage Task'}
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-8 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-emerald-200/60 pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">The Daily Stack</h2>
                <p className="text-emerald-600/70 text-sm font-medium mt-1">Sorted by priority.</p>
              </div>
              <div className="flex gap-2 bg-white/50 p-1.5 rounded-full border border-emerald-100 shadow-sm">
                <button onClick={() => setActiveTab('active')} className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${activeTab === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}>
                  Flat List
                </button>
                <button onClick={() => setActiveTab('tree')} className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${activeTab === 'tree' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}>
                  Tree View
                </button>
                <button onClick={() => setActiveTab('completed')} className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${activeTab === 'completed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}>
                  Completed ({completedTasks.length})
                </button>
              </div>
            </div>
            
            {activeTab === 'tree' && (
               activeTasks.length === 0 ? <div className="bg-white/50 backdrop-blur-sm border border-dashed border-emerald-200 rounded-2xl p-12 text-center text-emerald-600/60 font-medium">No active tasks.</div>
               : <div className="bg-white/40 backdrop-blur-md p-8 rounded-3xl border border-white shadow-xl shadow-teal-900/5">{renderTree()}</div>
            )}

            {activeTab === 'active' && (
              activeTasks.length === 0 ? <div className="bg-white/50 backdrop-blur-sm border border-dashed border-emerald-200 rounded-2xl p-12 text-center text-emerald-600/60 font-medium">Your stack is clear.</div>
              : <div className="space-y-5">
                  {activeTasks.map((task) => (
                    <div key={task._id} className={`bg-white/80 backdrop-blur-md p-6 rounded-2xl border shadow-lg shadow-teal-900/5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${isOverdue(task.targetDate) ? 'border-rose-200 bg-rose-50/30' : 'border-white hover:border-emerald-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-4">
                          <input type="checkbox" checked={false} onChange={() => handleToggleTaskStatus(task)} className="h-6 w-6 text-emerald-500 rounded-md border-emerald-200 focus:ring-emerald-400 cursor-pointer transition-colors" />
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">{task.title}</h3>
                            {task.targetDate && (
                              <span className={`text-xs font-semibold ${isOverdue(task.targetDate) ? 'text-rose-500' : 'text-emerald-600/70'}`}>
                                {isOverdue(task.targetDate) ? '⚠️ OVERDUE: ' : 'Target: '}
                                {new Date(task.targetDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                          <button onClick={() => handleDeleteTask(task._id)} className="text-slate-300 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      </div>
                      {task.description && <p className="text-sm text-slate-600 mb-5 ml-10 leading-relaxed">{task.description}</p>}
                    </div>
                  ))}
                </div>
            )}

            {activeTab === 'completed' && (
              completedTasks.length === 0 ? <div className="bg-white/50 backdrop-blur-sm border border-dashed border-emerald-200 rounded-2xl p-12 text-center text-emerald-600/60 font-medium">No completed tasks yet.</div>
              : <div className="space-y-4">
                  {completedTasks.map((task) => (
                    <div key={task._id} className="bg-white/40 backdrop-blur-sm p-5 rounded-2xl border border-emerald-100 opacity-70 shadow-sm transition-all">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <input type="checkbox" checked={true} onChange={() => handleToggleTaskStatus(task)} className="h-5 w-5 text-emerald-500 rounded-md border-emerald-200 cursor-pointer" />
                          <h3 className="text-lg font-semibold text-slate-500 line-through decoration-emerald-300/50">{task.title}</h3>
                        </div>
                        <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
};

export default Dashboard;