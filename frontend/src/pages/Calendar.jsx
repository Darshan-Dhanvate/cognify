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

  // Dynamic Time Navigation
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
      const response = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (prio) => {
    const colors = {
      low: 'bg-slate-50 border-slate-300 text-slate-700',
      medium: 'bg-blue-100 border-blue-400 text-blue-900',
      high: 'bg-orange-100 border-orange-400 text-orange-900',
      critical: 'bg-red-100 border-red-500 text-red-900 font-bold shadow-sm'
    };
    return colors[prio] || colors.medium;
  };

  // Identify Tasks older than today that are NOT completed
  const overdueTasks = tasks.filter(t => 
    t.status !== 'Completed' && t.targetDate && isBefore(new Date(t.targetDate), today)
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading Timeline...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 fade-in flex flex-col">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Timeline Schedule</h2>
            <p className="text-slate-500 text-sm mt-1">Week of {format(currentWeekStart, 'MMMM d, yyyy')}</p>
          </div>
          
          <div className="flex bg-white rounded-md shadow-sm border border-slate-200 p-1">
            <button onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded">
              &larr; Prev
            </button>
            <button onClick={() => setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }))} className="px-4 py-1.5 text-sm font-bold text-indigo-600 border-x border-slate-200 hover:bg-indigo-50">
              Today
            </button>
            <button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded">
              Next &rarr;
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Main 7-Day Calendar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 flex-1">
            {weekDays.map((day, index) => {
              const dayTasks = tasks.filter(task => task.targetDate && isSameDay(new Date(task.targetDate), day));
              const isToday = isSameDay(day, today);

              return (
                <div key={index} className={`bg-white rounded-lg border flex flex-col h-full min-h-[500px] transition-all ${isToday ? 'border-indigo-400 shadow-md ring-2 ring-indigo-400/20' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
                  <div className={`p-4 border-b text-center rounded-t-lg ${isToday ? 'bg-indigo-600 border-indigo-700' : 'bg-slate-50 border-slate-100'}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {format(day, 'EEE')}
                    </h3>
                    <span className={`text-3xl font-black ${isToday ? 'text-white' : 'text-slate-800'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-slate-50/30">
                    {dayTasks.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 italic py-4">Clear</div>
                    ) : (
                      dayTasks.map(task => (
                        <div key={task._id} className={`p-3 rounded-md border text-sm transition-all ${task.status === 'Completed' ? 'bg-slate-50 border-slate-200 opacity-50' : getPriorityColor(task.priority)}`}>
                          <h4 className={`font-semibold mb-1 ${task.status === 'Completed' ? 'line-through' : ''}`}>
                            {task.title}
                          </h4>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overdue Backlog Side Panel */}
          <div className="w-full lg:w-72 bg-white rounded-lg border border-red-200 shadow-sm flex flex-col max-h-[600px]">
            <div className="p-4 bg-red-50 border-b border-red-200 rounded-t-lg flex justify-between items-center">
              <h3 className="font-bold text-red-800 flex items-center gap-2">
                ⚠️ Backlog
              </h3>
              <span className="bg-red-200 text-red-900 text-xs font-bold px-2 py-1 rounded-full">{overdueTasks.length}</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50">
              {overdueTasks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center italic mt-10">No overdue tasks. You are perfectly on schedule.</p>
              ) : (
                overdueTasks.map(task => (
                  <div key={task._id} className="p-3 bg-white border border-red-300 rounded-md shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 mb-1">{task.title}</h4>
                    <p className="text-xs text-red-600 font-mono">Due: {new Date(task.targetDate).toLocaleDateString()}</p>
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