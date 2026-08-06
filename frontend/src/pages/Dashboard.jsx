import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Tab State for organization
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  
  // New Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      console.error('Network error fetching tasks:', error);
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
        body: JSON.stringify({ title, description, isOverwhelming })
      });

      const newTask = await response.json();
      if (response.ok) {
        setTasks((prev) => [...prev, newTask]);
        setTitle('');
        setDescription('');
        setIsOverwhelming(false);
        setActiveTab('active'); // Automatically switch to active tab when creating a new task
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error('Error updating task:', error);
      fetchTasks(); 
    }
  };

  const handleToggleMicroStep = async (task, stepId) => {
    const updatedSteps = task.microSteps.map(step => 
      step._id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
    );
    try {
      setTasks(tasks.map(t => t._id === task._id ? { ...t, microSteps: updatedSteps } : t));
      const response = await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ microSteps: updatedSteps })
      });
      if (response.ok) fetchTasks();
    } catch (error) {
      console.error('Error updating step:', error);
      fetchTasks();
    }
  };

  // --- NEW: Task Deletion Logic ---
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to permanently delete this task?")) return;
    
    try {
      // Optimistic UI update
      setTasks(tasks.filter(t => t._id !== taskId));
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete');
    } catch (error) {
      console.error('Error deleting task:', error);
      fetchTasks(); // Revert on failure
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading Command Center...</div>;
  }

  // Filter tasks based on status
  const activeTasks = tasks.filter(t => t.status !== 'Completed');
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  
  // Tasks to display based on selected tab
  const displayedTasks = activeTab === 'active' ? activeTasks : completedTasks;

  // Focus Mode Variables
  const focusTask = activeTasks.length > 0 ? activeTasks[0] : null;
  const nextMicroStep = focusTask?.microSteps?.find(step => !step.isCompleted);

  return (
    <div className="min-h-screen bg-slate-50 transition-all duration-500">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">Cognify Engine</h1>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${isFocusMode ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
          </button>
          
          <span className="text-sm text-slate-600 border-l pl-6">Operator: <strong>{user?.username}</strong></span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors">
            Disconnect
          </button>
        </div>
      </nav>

      {/* --- ALIGNED FOCUS MODE UI --- */}
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
                  <button 
                    onClick={() => handleToggleMicroStep(focusTask, nextMicroStep._id)}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
                  >
                    Mark Step Complete
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleToggleTaskStatus(focusTask)}
                  className="bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Finalize Objective
                </button>
              )}
            </div>
          )}
        </main>
      ) : (
        /* --- STANDARD COMMAND CENTER UI --- */
        <main className="max-w-5xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8 fade-in">
          
          {/* Left Column: Task Creation Form */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 sticky top-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Initialize Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Objective</label>
                  <input 
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Deploy production server"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Details (Optional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none h-20"
                  />
                </div>

                <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-md border border-indigo-100">
                  <input 
                    type="checkbox" 
                    id="overwhelm-flag"
                    checked={isOverwhelming}
                    onChange={(e) => setIsOverwhelming(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="overwhelm-flag" className="text-sm font-medium text-indigo-900 cursor-pointer">
                    Flag as Overwhelming (Trigger AI)
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium text-sm transition-colors ${isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isSubmitting ? 'Processing...' : 'Engage Task'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: The Daily Stack with Tabs */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-800">The Daily Stack</h2>
              
              {/* Tab Navigation */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('active')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'active' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  Active ({activeTasks.length})
                </button>
                <button 
                  onClick={() => setActiveTab('completed')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'completed' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  Completed ({completedTasks.length})
                </button>
              </div>
            </div>
            
            {displayedTasks.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500">
                {activeTab === 'active' ? 'No active tasks. Your stack is clear.' : 'No completed tasks yet.'}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedTasks.map((task) => (
                  <div key={task._id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={task.status === 'Completed'}
                          onChange={() => handleToggleTaskStatus(task)}
                          className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <h3 className={`text-lg font-semibold ${task.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                          {task.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {task.status}
                        </span>
                        {/* Delete Button (Visible on hover) */}
                        <button 
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Permanently Delete Task"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {task.description && <p className="text-sm text-slate-600 mb-4 ml-8">{task.description}</p>}

                    {/* AI Micro-Steps Renderer (Only show if active) */}
                    {activeTab === 'active' && task.isOverwhelming && task.microSteps && task.microSteps.length > 0 && (
                      <div className="mt-4 ml-8 bg-slate-50 rounded-md p-4 border border-slate-100">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">AI Intervention Protocol</h4>
                        <div className="space-y-2">
                          {task.microSteps.map((step) => (
                            <div key={step._id} className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-md">
                              <input 
                                type="checkbox" 
                                checked={step.isCompleted}
                                onChange={() => handleToggleMicroStep(task, step._id)}
                                className="h-4 w-4 text-indigo-600 rounded border-slate-300 cursor-pointer" 
                              />
                              <span className={`text-sm flex-1 ${step.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {step.title}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">{step.timeEstimate}m</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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