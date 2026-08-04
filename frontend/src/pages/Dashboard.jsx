import React, { useState } from 'react';
import axios from 'axios';
import { Brain, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [taskTitle, setTaskTitle] = useState('');
  const [isOverwhelming, setIsOverwhelming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdTask, setCreatedTask] = useState(null);
  const [error, setError] = useState('');

  const TEST_USER_ID = "6a70b10225c106f1f51b58e6"; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setLoading(true);
    setError('');
    setCreatedTask(null);

    try {
      const response = await axios.post('http://localhost:5000/api/tasks', {
        user: TEST_USER_ID,
        title: taskTitle,
        isOverwhelming: isOverwhelming
      });
      
      setCreatedTask(response.data);
      setTaskTitle('');
    } catch (err) {
      const errorMessage = err.response ? err.response.data.message : 'Failed to connect to the backend.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-indigo-600" />
          Cognify Engine
        </h1>
        <p className="text-gray-500 mt-2">What is on your mind today?</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="e.g., Write the final year project report..."
              className="w-full text-lg px-4 py-3 border-b-2 border-gray-200 focus:border-indigo-600 outline-none bg-transparent"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div 
            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer ${
              isOverwhelming ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-transparent'
            } border`}
            onClick={() => !loading && setIsOverwhelming(!isOverwhelming)}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-5 h-5 ${isOverwhelming ? 'text-amber-600' : 'text-gray-400'}`} />
              <div>
                <h3 className={`font-semibold ${isOverwhelming ? 'text-amber-900' : 'text-gray-700'}`}>
                  I feel overwhelmed by this
                </h3>
                <p className="text-sm text-gray-500">Trigger AI to break this into 5-minute steps</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
              isOverwhelming ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
            }`}>
              {isOverwhelming && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !taskTitle.trim()}
            className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${
              loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
            }`}
          >
            {loading ? (
              <React.Fragment>
                <Loader2 className="w-5 h-5 animate-spin" /> Processing Neural Request...
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Sparkles className="w-5 h-5" /> Initialize Task
              </React.Fragment>
            )}
          </button>
        </form>
      </div>

      {createdTask && createdTask.isOverwhelming && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="text-amber-500 w-5 h-5" />
            AI Deconstructed Protocol
          </h2>
          <div className="space-y-3">
            {createdTask.microSteps.map((step, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{step.title}</h4>
                  <p className="text-sm text-indigo-600 font-medium mt-1">Time Estimate: {step.timeEstimate} min</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;