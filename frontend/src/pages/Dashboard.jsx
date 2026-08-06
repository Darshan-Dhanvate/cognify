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
  
  // Tab State: 'active', 'tree', or 'completed'
  const [activeTab, setActiveTab] = useState('active'); 
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [parentTask, setParentTask] = useState('');
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
          parentTask: parentTask || null,
          isOverwhelming 
        })
      });

      const newTask = await response.json();
      if (response.ok) {
        setTasks((prev) => [...prev, newTask]);
        // Reset form for frictionless "Quick Add"
        setTitle('');
        setDescription('');
        setPriority('medium');
        setParentTask('');
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading Command Center...</div>;

  const activeTasks = tasks.filter(t => t.status !== 'Completed');
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const focusTask = activeTasks.length > 0 ? activeTasks[0] : null;
  const nextMicroStep = focusTask?.microSteps?.find(step => !step.isCompleted);

  // Helper for Priority Colors
  const getPriorityBadge = (prio) => {
    const styles = {
      low: 'bg-slate-100 text-slate-600 border-slate-200',
      medium: 'bg-blue-50 text-blue-700 border-blue-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-red-50 text-red-700 border-red-200'
    };
    return `text-xs px-2 py-0.5 rounded border font-medium uppercase tracking-wider ${styles[prio] || styles.medium}`;
  };

  // --- RECURSIVE TREE RENDERER ---
  const renderTree = (parentId = null, level = 0) => {
    const children = activeTasks.filter(t => parentId ? t.parentTask === parentId : !t.parentTask);
    if (children.length === 0) return null;

    return (
      <div className={`space-y-3 ${level > 0 ? 'ml-6 border-l-2 border-slate-200 pl-4 mt-3' : ''}`}>
        {children.map(task => (
          <div key={task._id} className="relative">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    onChange={() => handleToggleTaskStatus(task)}
                    className="h-5 w-5 text-indigo-600 rounded border-slate-300 cursor-pointer"
                  />
                  <h3 className="text-md font-semibold text-slate-800">{task.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                  <button onClick={() => handleDeleteTask(task._id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
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
    <div className="min-h-screen bg-slate-50 transition-all duration-500">
      <Navbar>
        <button 
          onClick={() => setIsFocusMode(!isFocusMode)}
          className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${isFocusMode ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
        </button>
      </Navbar>

      {isFocusMode ? (
        <main className="max-w-3xl mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[80vh] text-center fade-in">
          {!focusTask ? (
            <div className="text-slate-400">
              <h2 className="text-3xl font-light mb-4">Sanctuary Clear</h2>
              <p>You have no active tasks. Enjoy the stillness.</p>
            </div>
          ) : (
            <div className="w-full">
              <span className="text-sm font-bold text-indigo-500 tracking-widest uppercase mb-4 block">Current Objective</span>
              <h2 className="text-4xl font-extrabold text-slate-800 mb-12">{focusTask.title}</h2>
              {nextMicroStep ? (
                <div className="bg-white p-10 rounded-2xl shadow-lg border border-indigo-50 transform transition-all hover:scale-105">
                  <span className="text-xs font-mono text-slate-400 mb-2 block">AI Micro-Step ({nextMicroStep.timeEstimate}m)</span>
                  <p className="text-2xl text-slate-700 font-medium mb-8">{nextMicroStep.title}</p>
                  <button onClick={() => handleToggleMicroStep(focusTask, nextMicroStep._id)} className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-colors shadow-md w-full sm:w-auto">
                    Mark Step Complete
                  </button>
                </div>
              ) : (
                <button onClick={() => handleToggleTaskStatus(focusTask)} className="bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition-colors shadow-md">
                  Finalize Objective
                </button>
              )}
            </div>
          )}
        </main>
      ) : (
        <main className="max-w-6xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-12 gap-8 fade-in">
          
          {/* Left Column: Task Creation */}
          <div className="md:col-span-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 sticky top-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Initialize Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Objective (Quick Add)</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Make tea" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Parent Task</label>
                    <select value={parentTask} onChange={(e) => setParentTask(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                      <option value="">None (Root Task)</option>
                      {activeTasks.filter(t => !t.parentTask).map(t => (
                        <option key={t._id} value={t._id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Details (Optional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none h-16" />
                </div>

                <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-md border border-indigo-100">
                  <input type="checkbox" id="overwhelm-flag" checked={isOverwhelming} onChange={(e) => setIsOverwhelming(e.target.checked)} className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                  <label htmlFor="overwhelm-flag" className="text-sm font-medium text-indigo-900 cursor-pointer">
                    Flag as Overwhelming (Trigger AI)
                  </label>
                </div>

                <button type="submit" disabled={isSubmitting} className={`w-full py-2 px-4 rounded-md text-white font-medium text-sm transition-colors ${isSubmitting ? 'bg-indigo-400' : 'bg-slate-800 hover:bg-slate-900'}`}>
                  {isSubmitting ? 'Processing...' : 'Engage Task'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Stack & Tree View */}
          <div className="md:col-span-8">
            <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-800">The Daily Stack</h2>
              <div className="flex gap-4">
                <button onClick={() => setActiveTab('active')} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'active' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  Flat List
                </button>
                <button onClick={() => setActiveTab('tree')} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'tree' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  Tree View
                </button>
                <button onClick={() => setActiveTab('completed')} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'completed' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  Completed ({completedTasks.length})
                </button>
              </div>
            </div>
            
            {/* TREE VIEW TAB */}
            {activeTab === 'tree' && (
               activeTasks.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500">No active tasks.</div>
               ) : (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  {renderTree()}
                </div>
               )
            )}

            {/* FLAT LIST TAB */}
            {activeTab === 'active' && (
              activeTasks.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500">No active tasks. Your stack is clear.</div>
              ) : (
                <div className="space-y-4">
                  {activeTasks.map((task) => (
                    <div key={task._id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={false} onChange={() => handleToggleTaskStatus(task)} className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                          <h3 className="text-lg font-semibold text-slate-800">{task.title}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                          <button onClick={() => handleDeleteTask(task._id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      </div>
                      {task.description && <p className="text-sm text-slate-600 mb-4 ml-8">{task.description}</p>}
                      {task.isOverwhelming && task.microSteps && task.microSteps.length > 0 && (
                        <div className="mt-4 ml-8 bg-slate-50 rounded-md p-4 border border-slate-100">
                          <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">AI Intervention Protocol</h4>
                          <div className="space-y-2">
                            {task.microSteps.map((step) => (
                              <div key={step._id} className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-md">
                                <input type="checkbox" checked={step.isCompleted} onChange={() => handleToggleMicroStep(task, step._id)} className="h-4 w-4 text-indigo-600 rounded border-slate-300 cursor-pointer" />
                                <span className={`text-sm flex-1 ${step.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.title}</span>
                                <span className="text-xs text-slate-400 font-mono">{step.timeEstimate}m</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* COMPLETED TAB */}
            {activeTab === 'completed' && (
              completedTasks.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500">No completed tasks yet.</div>
              ) : (
                <div className="space-y-4">
                  {completedTasks.map((task) => (
                    <div key={task._id} className="bg-white p-5 rounded-lg border border-green-200 opacity-60 shadow-sm transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={true} onChange={() => handleToggleTaskStatus(task)} className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                          <h3 className="text-lg font-semibold text-slate-500 line-through">{task.title}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                          <button onClick={() => handleDeleteTask(task._id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </main>
      )}
    </div>
  );
};

export default Dashboard;