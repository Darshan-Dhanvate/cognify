import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { format, startOfWeek, addDays, isSameDay, startOfToday, subWeeks, addWeeks, isBefore } from 'date-fns';

const Calendar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = startOfToday();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(today, { weekStartsOn: 1 }));
  
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    if (!user || !user.token) {
      navigate('/login');
      return;
    }
    fetchTasks();
  }, [user, navigate]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${user.token}` } });
      const data = await response.json();
      if (response.ok) setTasks(data);
    } catch (error) { console.error('Error fetching tasks:', error); } finally { setLoading(false); }
  };

  // --- NEW BACKLOG ACTIONS ---
  const handleRescheduleToToday = async (task) => {
    const todayString = new Date().toISOString().split('T')[0];
    try {
      setTasks(tasks.map(t => t._id === task._id ? { ...t, scheduledDate: todayString } : t));
      await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ scheduledDate: todayString })
      });
      fetchTasks();
    } catch (error) { console.error('Error rescheduling task:', error); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Permanently delete this task?")) return;
    try {
      setTasks(tasks.filter(t => t._id !== taskId));
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } });
    } catch (error) { console.error('Error deleting task:', error); }
  };

  const getPriorityBadge = (prio) => {
    const styles = { low: 'bg-emerald-50 text-emerald-600 border-emerald-200', medium: 'bg-teal-50 text-teal-700 border-teal-200', high: 'bg-orange-50 text-orange-700 border-orange-200', critical: 'bg-rose-50 text-rose-700 border-rose-200' };
    return `text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${styles[prio] || styles.medium}`;
  };

  const overdueTasks = tasks.filter(t => {
    if (t.status === 'Completed' || t.taskType === 'strict-event') return false;
    const compareDate = t.dueDate || t.scheduledDate; 
    return compareDate && isBefore(new Date(compareDate), today);
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-emerald-50 text-emerald-600">Loading Timeline...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-indigo-50/30 transition-all duration-700 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto py-8 px-4 fade-in flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Timeline Schedule</h2>
            <p className="text-emerald-600/70 text-sm font-medium mt-1">Week of {format(currentWeekStart, 'MMMM d, yyyy')}</p>
          </div>
          <div className="flex bg-white/70 backdrop-blur-md rounded-full shadow-sm border border-emerald-100 p-1">
            <button onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} className="px-5 py-2 text-sm font-semibold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors">&larr; Prev</button>
            <button onClick={() => setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }))} className="px-5 py-2 text-sm font-bold text-teal-600 hover:bg-teal-50 rounded-full transition-colors">Today</button>
            <button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="px-5 py-2 text-sm font-semibold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors">Next &rarr;</button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 flex-1">
            {weekDays.map((day, index) => {
              const dayTasks = tasks.filter(task => {
                const mapDate = task.scheduledDate || task.dueDate;
                return mapDate && isSameDay(new Date(mapDate), day);
              });
              const isToday = isSameDay(day, today);

              return (
                <div key={index} className={`bg-white/60 backdrop-blur-md rounded-2xl border flex flex-col h-full min-h-[500px] transition-all duration-300 ${isToday ? 'border-teal-400 shadow-lg shadow-teal-900/10 ring-2 ring-teal-400/20' : 'border-emerald-100 shadow-sm hover:border-emerald-300'}`}>
                  <div className={`p-4 border-b text-center rounded-t-2xl ${isToday ? 'bg-gradient-to-r from-teal-500 to-emerald-500 border-transparent' : 'bg-white/50 border-emerald-100'}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-teal-50' : 'text-emerald-600/70'}`}>{format(day, 'EEE')}</h3>
                    <span className={`text-3xl font-black tracking-tight ${isToday ? 'text-white' : 'text-slate-700'}`}>{format(day, 'd')}</span>
                  </div>

                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {dayTasks.length === 0 ? (
                      <div className="text-center text-xs text-emerald-600/40 font-medium py-4">Clear</div>
                    ) : (
                      dayTasks.map(task => {
                        const isCompleted = task.status === 'Completed';
                        if (task.taskType === 'strict-event') {
                          return (
                            <div key={task._id} className={`p-3 rounded-xl border-l-4 text-sm transition-all shadow-sm ${isCompleted ? 'bg-indigo-50/50 border-l-indigo-200 opacity-60' : 'bg-indigo-50 border-l-indigo-500 border-y border-r border-indigo-100'}`}>
                              <h4 className={`font-bold text-indigo-900 ${isCompleted ? 'line-through decoration-indigo-300' : ''}`}>📅 {task.title}</h4>
                            </div>
                          );
                        }
                        if (task.taskType === 'quick-task') {
                          return (
                            <div key={task._id} className={`p-2 rounded-lg border text-sm transition-all flex items-center justify-between ${isCompleted ? 'bg-slate-50/50 border-slate-200 opacity-60' : 'bg-white border-emerald-100 shadow-sm'}`}>
                              <span className={`font-semibold text-slate-700 ${isCompleted ? 'line-through decoration-slate-300' : ''}`}>⚡ {task.title}</span>
                            </div>
                          );
                        }
                        return (
                          <div key={task._id} className={`p-3 rounded-xl border text-sm transition-all shadow-sm ${isCompleted ? 'bg-white/40 border-emerald-100 opacity-60' : 'bg-white border-emerald-200'}`}>
                            <h4 className={`font-bold text-slate-800 mb-2 leading-tight ${isCompleted ? 'line-through decoration-emerald-300' : ''}`}>{task.title}</h4>
                            <div className="flex justify-between items-center mt-2">
                              <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                              {task.dueDate && !isCompleted && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">DUE</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="w-full xl:w-80 bg-white/70 backdrop-blur-xl rounded-2xl border border-rose-200 shadow-lg shadow-rose-900/5 flex flex-col max-h-[600px] shrink-0">
            <div className="p-5 bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-200 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-rose-900 tracking-tight">⚠️ Backlog</h3>
                <p className="text-xs text-rose-700/70 font-medium mt-0.5">Requires Rescheduling</p>
              </div>
              <span className="bg-rose-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">{overdueTasks.length}</span>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {overdueTasks.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl block mb-2">🌿</span>
                  <p className="text-sm font-semibold text-emerald-600/70">No overdue tasks.<br/>You are perfectly aligned.</p>
                </div>
              ) : (
                overdueTasks.map(task => (
                  <div key={task._id} className="p-4 bg-white border border-rose-200 hover:border-rose-300 rounded-xl shadow-sm transition-colors group">
                    <h4 className="text-sm font-bold text-slate-800 mb-1 leading-tight">{task.title}</h4>
                    <div className="flex justify-between items-center mt-2 mb-3">
                      <p className="text-[11px] text-rose-600 font-bold">{task.dueDate ? 'Deadline Passed' : 'Target Missed'}</p>
                      <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                    </div>
                    {/* BACKLOG ACTION BUTTONS */}
                    <div className="flex gap-2 border-t border-rose-100 pt-3">
                      <button onClick={() => handleRescheduleToToday(task)} className="flex-1 bg-rose-50 text-rose-700 text-xs font-bold py-1.5 rounded-md hover:bg-rose-100 transition-colors">
                        Move to Today
                      </button>
                      <button onClick={() => handleDeleteTask(task._id)} className="bg-white text-slate-400 border border-slate-200 px-2 py-1.5 rounded-md hover:text-rose-500 hover:border-rose-200 transition-colors">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calendar;