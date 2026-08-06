import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { format, startOfWeek, addDays, isSameDay, startOfToday } from 'date-fns';
import Navbar from '../components/Navbar';

const Calendar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate the 7 days of the current week starting from Monday
  const today = startOfToday();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

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
      console.error('Error fetching tasks for calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPriorityColor = (prio) => {
    const colors = {
      low: 'bg-slate-100 text-slate-700 border-slate-200',
      medium: 'bg-blue-50 text-blue-700 border-blue-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[prio] || colors.medium;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading Timeline...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <Navbar/>

      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 fade-in flex flex-col">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-slate-800">Weekly Outlook</h2>
          <p className="text-slate-500 text-sm mt-1">Map your cognitive load across the week to prevent burnout.</p>
        </div>

        {/* 7-Day Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 flex-1">
          {weekDays.map((day, index) => {
            // Find tasks that match this specific day
            const dayTasks = tasks.filter(task => {
              if (!task.targetDate) return false;
              return isSameDay(new Date(task.targetDate), day);
            });

            const isToday = isSameDay(day, today);

            return (
              <div 
                key={index} 
                className={`bg-white rounded-lg border flex flex-col h-full min-h-[400px] ${isToday ? 'border-indigo-400 shadow-md ring-1 ring-indigo-400' : 'border-slate-200 shadow-sm'}`}
              >
                {/* Day Header */}
                <div className={`p-3 border-b text-center rounded-t-lg ${isToday ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isToday ? 'text-indigo-700' : 'text-slate-500'}`}>
                    {format(day, 'EEEE')}
                  </h3>
                  <span className={`text-2xl font-light ${isToday ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Task List for the Day */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-slate-50/30">
                  {dayTasks.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 italic py-4">No tasks scheduled</div>
                  ) : (
                    dayTasks.map(task => (
                      <div 
                        key={task._id} 
                        className={`p-3 rounded-md border text-sm transition-all ${task.status === 'Completed' ? 'bg-slate-50 border-slate-200 opacity-60' : getPriorityColor(task.priority)}`}
                      >
                        <h4 className={`font-semibold mb-1 ${task.status === 'Completed' ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </h4>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                            {task.status}
                          </span>
                          {task.isOverwhelming && (
                            <span className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded border border-black/10">
                              AI Split
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Calendar;