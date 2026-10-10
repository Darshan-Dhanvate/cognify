const base = '[https://cognify-backend-mnbg.onrender.com/api](https://cognify-backend-mnbg.onrender.com/api)';
async function request(path, options = {}) {
  const token = localStorage.getItem('cognify_token');
  const response = await fetch(`${base}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Request failed');
  return body;
}
export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (username, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  tasks: () => request('/tasks'),
  createTask: data => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: id => request(`/tasks/${id}`, { method: 'DELETE' }),
  journals: () => request('/journal'),
  createJournal: content => request('/journal', { method: 'POST', body: JSON.stringify({ content }) }),
  currentRisk: () => request('/burnout/current'),
  riskHistory: () => request('/burnout/history?days=30'),
  recalculate: trigger => request('/burnout/recalculate', { method: 'POST', body: JSON.stringify({ trigger }) }),
  currentIntervention: () => request('/interventions/current'),
  interventionHistory: () => request('/interventions/history?days=30'),
  respondIntervention: (id, status) => request(`/interventions/${id}/respond`, { method: 'POST', body: JSON.stringify({ status }) }),
  executeIntervention: id => request(`/interventions/${id}/execute`, { method: 'POST' }),
  recordInterventionOutcome: (id, riskAfter, note) => request(`/interventions/${id}/outcome`, { method: 'POST', body: JSON.stringify({ riskAfter, note }) }),
};
