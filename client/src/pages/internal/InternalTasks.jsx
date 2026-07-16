import { useState, useEffect } from 'react';
import useInternalAuth, { internalFetch } from '../../hooks/useInternalAuth';

export default function InternalTasks() {
  const { employee } = useInternalAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('mine');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const query = filter === 'mine' ? '?mine=true' : filter === 'all' ? '' : `?status=${filter}`;
    internalFetch(`/tasks${query}`).then(d => { setTasks(d || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    internalFetch('/employees').then(d => setEmployees(d || [])).catch(() => {});
  }, []);

  const updateStatus = async (id, status) => {
    await internalFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  };

  const create = async () => {
    if (!title.trim()) return;
    await internalFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: title.trim(), priority, assignedTo: assignee ? [assignee] : [] }),
    });
    setTitle('');
    setShowForm(false);
    load();
  };

  if (loading) return <div className="internal-loader"><div className="internal-spinner" /></div>;
  const isCEO = employee?.role?.name === 'CEO';

  return (
    <div>
      <div className="internal-page-header">
        <h2 className="internal-page-title">Tasks</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select className="internal-select sm" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="mine">My Tasks</option>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          {isCEO && <button className="internal-btn primary sm" onClick={() => setShowForm(!showForm)}>+ New Task</button>}
        </div>
      </div>
      {showForm && (
        <div className="internal-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input className="internal-input" style={{ flex: 1, minWidth: '200px' }} value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
            <select className="internal-select sm" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
            <select className="internal-select sm" value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">Assign to...</option>
              {employees.filter(e => e._id !== employee?._id).map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
            <button className="internal-btn primary sm" onClick={create}>Create</button>
          </div>
        </div>
      )}
      <div className="internal-card">
        {tasks.map(t => (
          <div key={t._id} className="internal-task-row">
            <span className={`internal-task-priority ${t.priority}`} />
            <div style={{ flex: 1 }}>
              <p className="internal-task-title">{t.title}</p>
              <p className="internal-task-meta">
                {t.assignedTo?.map(a => a.name).join(', ') || 'Unassigned'} · {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'}
              </p>
            </div>
            <span className={`internal-badge ${t.status}`}>{t.status}</span>
            {t.status !== 'completed' && (
              <select className="internal-select sm" value="" onChange={e => { if (e.target.value) updateStatus(t._id, e.target.value); }}>
                <option value="">Update</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Complete</option>
                <option value="needs_help">Need Help</option>
              </select>
            )}
          </div>
        ))}
        {tasks.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-dark)' }}>No tasks found</p>}
      </div>
    </div>
  );
}
