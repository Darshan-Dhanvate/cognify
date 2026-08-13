import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const [taskType, setTaskType] = useState('deep-work'); 
  const [priority, setPriority] = useState('medium');
  const [parentTask, setParentTask] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ 
          title, description, taskType, priority, scheduledDate, 
          dueDate: dueDate || null, parentTask: parentTask || null, isOverwhelming 
        })
      });
      const newTask = await response.json();
      if (response.ok) {
        setTasks((prev) => [...prev, newTask]);
        setTitle(''); setDescription(''); setTaskType('deep-work'); setPriority('medium');
        setParentTask(''); setScheduledDate(new Date().toISOString().split('T')[0]); setDueDate('');
        setIsOverwhelming(false);
        if (activeTab === 'completed') setActiveTab('active');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTask = async (task) => {
    try {
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: 'In-Progress' } : t));
      await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ status: 'In-Progress' })
      });
    } catch (error) { fetchTasks(); }
  };

  const handleToggleTaskStatus = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    
    if (newStatus === 'Completed') {
      const hasActiveChildren = tasks.some(t => t.parentTask === task._id && t.status !== 'Completed');
      if (hasActiveChildren) {
        alert("Dependency Blocker: You must complete all subtasks before marking this parent task as complete.");
        return; 
      }
    }

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
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } });
    } catch (error) { fetchTasks(); }
  };

  const handleClearAllTasks = async () => {
    if (!window.confirm("WARNING: This will permanently wipe all tasks from your database. Are you absolutely sure?")) return;
    try {
      setTasks([]);
      await fetch(`/api/tasks/clear`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } });
    } catch (error) { fetchTasks(); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-emerald-50 text-emerald-600">Loading Sanctuary...</div>;

  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  
  const getEffectivePriority = (task) => {
    let maxWeight = priorityWeight[task.priority];
    const children = tasks.filter(t => t.parentTask === task._id && t.status !== 'Completed');
    children.forEach(child => {
      const childWeight = priorityWeight[child.priority];
      if (childWeight > maxWeight) maxWeight = childWeight;
    });
    return Object.keys(priorityWeight).find(key => priorityWeight[key] === maxWeight) || 'medium';
  };
  
  const activeTasks = tasks.filter(t => t.status !== 'Completed').sort((a, b) => {
    if (a.status === 'In-Progress' && b.status !== 'In-Progress') return -1;
    if (b.status === 'In-Progress' && a.status !== 'In-Progress') return 1;

    const aEff = getEffectivePriority(a);
    const bEff = getEffectivePriority(b);
    if (priorityWeight[aEff] !== priorityWeight[bEff]) return priorityWeight[bEff] - priorityWeight[aEff];
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const completedTasks = tasks.filter(t => t.status === 'Completed');

  const actionableTasks = activeTasks.filter(task => {
    const hasActiveChildren = activeTasks.some(child => child.parentTask === task._id);
    return !hasActiveChildren;
  });

  const focusTask = actionableTasks.length > 0 ? actionableTasks[0] : null;
  const parentOfFocus = focusTask?.parentTask ? tasks.find(t => t._id === focusTask.parentTask) : null;
  const nextMicroStep = focusTask?.microSteps?.find(step => !step.isCompleted);
  const completedMicroSteps = focusTask?.microSteps?.filter(step => step.isCompleted).length || 0;
  const totalMicroSteps = focusTask?.microSteps?.length || 0;

  const getPriorityBadge = (prio, isInherited = false) => {
    const styles = {
      low: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      medium: 'bg-teal-50 text-teal-700 border-teal-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${styles[prio]} ${isInherited ? 'ring-2 ring-rose-200 ring-offset-1' : ''}`}>
        {prio} {isInherited && '⬆️'}
      </span>
    );
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(dateString);
    return target < today;
  };

  const TaskCard = ({ task }) => {
    const effectivePriority = getEffectivePriority(task);
    const isInherited = effectivePriority !== task.priority;
    const pastDue = isOverdue(task.dueDate) || isOverdue(task.scheduledDate);
    const isInProgress = task.status === 'In-Progress';

    if (task.taskType === 'quick-task') {
      return (
        <div className={`bg-white/90 backdrop-blur-md p-4 rounded-xl border shadow-sm flex items-center justify-between hover:shadow-md transition-all ${pastDue ? 'border-rose-300' : 'border-slate-100 hover:border-emerald-200'}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">⚡</span>
            <h3 className="text-sm font-semibold text-slate-700">{task.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleToggleTaskStatus(task)} className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
              Done
            </button>
            <button onClick={() => handleDeleteTask(task._id)} className="text-slate-300 hover:text-rose-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      );
    }

    if (task.taskType === 'strict-event') {
      return (
        <div className={`bg-indigo-50/40 backdrop-blur-md p-5 rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all ${pastDue ? 'border-l-rose-500 border-rose-200' : 'border-l-indigo-500 border-indigo-100'}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <span className="text-xl">📅</span>
              <div>
                <h3 className="text-md font-bold text-indigo-900 tracking-tight">{task.title}</h3>
                <span className={`text-xs font-semibold ${pastDue ? 'text-rose-500' : 'text-indigo-600/70'}`}>
                  {task.scheduledDate && new Date(task.scheduledDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => handleToggleTaskStatus(task)} className="text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors">
                Complete
              </button>
              <button onClick={() => handleDeleteTask(task._id)} className="text-indigo-300 hover:text-rose-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // DEEP WORK CARD
    return (
      <div className={`bg-white/80 backdrop-blur-md p-6 rounded-2xl border shadow-lg shadow-teal-900/5 hover:shadow-xl transition-all duration-300 group ${pastDue ? 'border-rose-200 bg-rose-50/30' : isInProgress ? 'border-indigo-300 bg-indigo-50/30 ring-2 ring-indigo-500/10' : 'border-white hover:border-emerald-200'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-4">
            {/* Status Dot instead of Checkbox */}
            <div className="pt-1.5">
               <div className={`h-3 w-3 rounded-full shadow-sm ${isInProgress ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                {task.title}
                {task.pushCount > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 font-bold ml-1">
                    Delayed {task.pushCount}x
                  </span>
                )}
              </h3>
              <div className="flex gap-3 mt-1">
                {task.scheduledDate && <span className={`text-[11px] font-semibold ${isOverdue(task.scheduledDate) ? 'text-rose-500' : 'text-emerald-600/70'}`}>Plan: {new Date(task.scheduledDate).toLocaleDateString()}</span>}
                {task.dueDate && <span className={`text-[11px] font-bold ${isOverdue(task.dueDate) ? 'text-rose-600' : 'text-orange-500/80'}`}>DEADLINE: {new Date(task.dueDate).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              {getPriorityBadge(effectivePriority, isInherited)}
              <button onClick={() => handleDeleteTask(task._id)} className="text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </button>
            </div>
            
            {/* WORKLOAD ACTION BUTTONS */}
            <div className="flex items-center gap-2 mt-2">
              {task.status === 'Pending' && (
                <button onClick={() => handleStartTask(task)} className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-200 transition-colors border border-indigo-200 shadow-sm">
                  Start Tracking
                </button>
              )}
              {isInProgress && (
                <span className="text-[10px] bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm flex items-center gap-1.5 animate-pulse">
                  <span className="h-1.5 w-1.5 bg-white rounded-full"></span>
                  Active
                </span>
              )}
              <button onClick={() => handleToggleTaskStatus(task)} className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm">
                Mark Complete
              </button>
            </div>
          </div>
        </div>
        
        {task.description && <p className="text-sm text-slate-600 mb-4 ml-7 leading-relaxed">{task.description}</p>}
        
        {task.isOverwhelming && task.microSteps && task.microSteps.length > 0 && (
          <div className="mt-4 ml-7 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
            <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-3">AI Micro-Steps</h4>
            <div className="space-y-3">
              {task.microSteps.map((step) => (
                <div key={step._id} className="flex items-center gap-3 bg-white p-3 border border-emerald-100 rounded-lg shadow-sm">
                  {/* Custom Circle Node for Micro-steps */}
                  <button 
                    onClick={() => handleToggleMicroStep(task, step._id)} 
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${step.isCompleted ? 'bg-teal-500 border-teal-500' : 'border-slate-300 hover:border-teal-400'}`}
                  >
                    {step.isCompleted && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    )}
                  </button>
                  <span className={`text-sm flex-1 font-medium transition-colors ${step.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.title}</span>
                  <span className="text-xs text-teal-600/70 font-mono bg-teal-50 px-2 py-1 rounded-md">{step.timeEstimate}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTree = (parentId = null, level = 0) => {
    const children = activeTasks.filter(t => parentId ? t.parentTask === parentId : !t.parentTask);
    if (children.length === 0) return null;

    return (
      <div className={`space-y-4 ${level > 0 ? 'ml-6 border-l-2 border-emerald-100 pl-4 mt-4' : ''}`}>
        {children.map(task => (
          <div key={task._id} className="relative">
            <TaskCard task={task} />
            {renderTree(task._id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-all duration-700 flex flex-col ${isFocusMode ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-blue-950 to-slate-950' : 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-indigo-50/30'}`}>
      
      {!isFocusMode && (
        <Navbar>
          <button onClick={() => setIsFocusMode(true)} className="text-sm font-bold px-5 py-2 rounded-full transition-all duration-300 shadow-sm bg-white text-emerald-700 border border-emerald-100 hover:bg-emerald-50">
            Deep Dive (Focus)
          </button>
        </Navbar>
      )}

      {isFocusMode ? (
        <div className="relative flex-1 flex flex-col items-center justify-center fade-in px-4 py-10">
          <div className="absolute top-6 right-6">
            <button onClick={() => setIsFocusMode(false)} className="text-sm font-medium px-6 py-2.5 rounded-full border border-blue-500/30 text-blue-300 hover:bg-blue-900/50 hover:text-white transition-all backdrop-blur-md">
              Exit Focus Mode
            </button>
          </div>

          {!focusTask ? (
            <div className="text-blue-500/50 text-center">
              <h2 className="text-4xl font-light mb-4">Sanctuary Clear</h2>
              <p>No actionable tasks found in the queue.</p>
            </div>
          ) : (
            <div className="w-full max-w-3xl text-center">
              <span className="text-xs font-bold text-blue-400 tracking-widest uppercase mb-4 block animate-pulse">Deep Work Engaged</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">{focusTask.title}</h2>
              
              {parentOfFocus && (
                <div className="flex items-center justify-center gap-2 mt-4 mb-8">
                  <span className="text-slate-400 text-sm">Working towards:</span>
                  <span className="text-blue-200 text-sm font-semibold bg-blue-900/40 px-3 py-1 rounded-full border border-blue-700/50">{parentOfFocus.title}</span>
                </div>
              )}

              {nextMicroStep ? (
                <div className="bg-slate-800/80 backdrop-blur-lg p-10 md:p-14 rounded-3xl shadow-2xl border border-blue-500/30 mt-8 transform transition-all">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">Step {completedMicroSteps + 1} of {totalMicroSteps}</span>
                    <span className="text-xs font-mono text-blue-400 bg-blue-900/50 px-2 py-1 rounded">{nextMicroStep.timeEstimate}m Target</span>
                  </div>
                  <p className="text-2xl md:text-3xl text-blue-50 font-medium mb-12 leading-relaxed">{nextMicroStep.title}</p>
                  <button onClick={() => handleToggleMicroStep(focusTask, nextMicroStep._id)} className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] w-full sm:w-auto transform hover:-translate-y-1">
                    Complete Micro-Step
                  </button>
                </div>
              ) : (
                <div className="mt-12">
                  <button onClick={() => handleToggleTaskStatus(focusTask)} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-12 py-5 rounded-full font-extrabold text-xl hover:from-blue-400 hover:to-indigo-400 transition-all shadow-[0_0_30px_rgba(99,102,241,0.5)] transform hover:-translate-y-1">
                    Mark Task Complete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <main className="max-w-7xl mx-auto py-10 px-4 grid grid-cols-1 md:grid-cols-12 gap-10 fade-in w-full">
          
          {/* Form Setup Left Pane */}
          <div className="md:col-span-4">
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl shadow-teal-900/5 border border-white sticky top-10">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Initialize Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="flex gap-2 bg-emerald-50/50 p-1.5 rounded-xl border border-emerald-100">
                  {['deep-work', 'quick-task', 'strict-event'].map(type => (
                    <button key={type} type="button" onClick={() => setTaskType(type)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors ${taskType === type ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200' : 'text-slate-500 hover:text-emerald-600'}`}>
                      {type.replace('-', ' ')}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Objective</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={taskType === 'quick-task' ? 'e.g., Brew coffee' : 'e.g., Deploy server'} className="w-full px-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none" />
                </div>
                {taskType !== 'quick-task' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none">
                          <option value="low">Low</option><option value="medium">Medium</option>
                          <option value="high">High</option><option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Schedule Date</label>
                        <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none text-slate-600" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Hard Deadline</label>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none text-slate-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Parent Task</label>
                        <select value={parentTask} onChange={(e) => setParentTask(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none">
                          <option value="">None</option>
                          {activeTasks.filter(t => !t.parentTask && t.taskType === 'deep-work').map(t => (
                            <option key={t._id} value={t._id}>{t.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Details (Optional)</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none resize-none h-16" />
                    </div>
                  </>
                )}
                {taskType === 'deep-work' && (
                  <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                    {/* The only checkbox remaining is this form toggle, which is standard UI practice */}
                    <input type="checkbox" id="overwhelm-flag" checked={isOverwhelming} onChange={(e) => setIsOverwhelming(e.target.checked)} className="h-4 w-4 text-teal-600 rounded border-emerald-200 focus:ring-teal-500" />
                    <label htmlFor="overwhelm-flag" className="text-xs font-semibold text-teal-800 cursor-pointer">
                      Flag as Overwhelming (Trigger AI Assist)
                    </label>
                  </div>
                )}
                <button type="submit" disabled={isSubmitting} className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm transition-all shadow-md transform hover:-translate-y-0.5 mt-2 ${isSubmitting ? 'bg-emerald-300' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}>
                  {isSubmitting ? 'Processing...' : 'Engage Task'}
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-8 w-full">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 border-b border-emerald-200/60 pb-4 gap-4">
              <div>
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">The Daily Stack</h2>
                  <button onClick={handleClearAllTasks} className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-1 rounded uppercase hover:bg-red-200 transition-colors tracking-wide">
                    Clear All
                  </button>
                </div>
                <p className="text-emerald-600/70 text-sm font-medium mt-1">Smart Priority Roll-Up Active.</p>
              </div>
              <div className="flex gap-2 bg-white/50 p-1.5 rounded-full border border-emerald-100 shadow-sm flex-wrap">
                <button onClick={() => setActiveTab('active')} className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${activeTab === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>Flat List</button>
                <button onClick={() => setActiveTab('tree')} className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${activeTab === 'tree' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>Tree View</button>
                <button onClick={() => setActiveTab('completed')} className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${activeTab === 'completed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>Completed</button>
              </div>
            </div>
            
            {activeTab === 'tree' && (
               activeTasks.length === 0 ? <div className="bg-white/50 border border-dashed border-emerald-200 rounded-2xl p-12 text-center text-emerald-600/60 font-medium">Clear stack.</div>
               : <div className="bg-white/40 p-8 rounded-3xl border border-white shadow-xl shadow-teal-900/5">{renderTree()}</div>
            )}

            {activeTab === 'active' && (
              activeTasks.length === 0 ? <div className="bg-white/50 border border-dashed border-emerald-200 rounded-2xl p-12 text-center text-emerald-600/60 font-medium">Your stack is clear.</div>
              : <div className="space-y-4">{activeTasks.map((task) => <TaskCard key={task._id} task={task} />)}</div>
            )}
            
            {activeTab === 'completed' && (
              completedTasks.length === 0 ? <div className="bg-white/50 border border-dashed border-emerald-200 rounded-2xl p-12 text-center text-emerald-600/60 font-medium">No completed tasks yet.</div>
              : <div className="space-y-4">
                  {completedTasks.map((task) => (
                    <div key={task._id} className="bg-white/40 backdrop-blur-sm p-5 rounded-2xl border border-emerald-100 opacity-70 shadow-sm transition-all group">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          {/* Completed Icon Badge */}
                          <span className="text-emerald-500 bg-emerald-100 rounded-full p-1.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          </span>
                          <h3 className="text-lg font-semibold text-slate-500 line-through decoration-emerald-300/50">{task.title}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleToggleTaskStatus(task)} className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                            Reopen
                          </button>
                          <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                          <button onClick={() => handleDeleteTask(task._id)} className="text-slate-300 hover:text-rose-400 transition-colors" title="Delete Permanently">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
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