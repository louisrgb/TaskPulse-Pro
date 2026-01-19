
import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { TaskFrequency, UserRole } from './types.js';
import { ICONS } from './constants.js';
import { formatDateISO, getDaysOfWeek, isTaskVisibleOnDate } from './utils/dateUtils.js';
import { supabase } from './services/supabaseClient.js';

const html = htm.bind(React.createElement);

const INITIAL_USERS = [
  { id: 'admin-1', name: 'Louis (Admin)', email: 'admin@taskpulse.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Louis', role: UserRole.ADMIN, password: '123' },
  { id: 'team-3', name: 'Iedereen', email: 'iedereen@taskpulse.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team', role: UserRole.CHILD, password: '123' },
];

const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onLogin(email, password)) setError(true);
  };

  return html`
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
        <div className="flex flex-col items-center gap-6 mb-10 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-indigo-100">T</div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">TaskPulse Pro</h2>
            <p className="text-slate-500 text-sm mt-1">Gezinsplanning & Taken</p>
          </div>
        </div>
        <form onSubmit=${handleSubmit} className="space-y-5">
          <input type="email" placeholder="E-mail" className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" value=${email} onInput=${e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Wachtwoord" className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" value=${password} onInput=${e => setPassword(e.target.value)} required />
          ${error && html`<p className="text-red-500 text-xs font-bold text-center">Onjuiste gegevens.</p>`}
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-[0.98] transition-all">Inloggen</button>
        </form>
        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Admin: admin@taskpulse.com<br/>
            Pass: 123
          </p>
        </div>
      </div>
    </div>
  `;
};

const UserView = ({ tasks, selectedDate, setSelectedDate, onToggle, isCompleted, currentUser }) => {
  const weekDays = useMemo(() => getDaysOfWeek(new Date(selectedDate)), [selectedDate]);
  const activeTasks = tasks.filter(t => isTaskVisibleOnDate(t, selectedDate));

  return html`
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Hoi ${currentUser.name}!</h2>
        <p className="text-slate-500 font-medium">Laten we de dag doornemen.</p>
      </div>

      <div className="grid grid-cols-7 gap-2">
        ${weekDays.map(day => {
          const ds = formatDateISO(day);
          const isToday = ds === selectedDate;
          return html`
            <button key=${ds} onClick=${() => setSelectedDate(ds)} className=${`flex flex-col items-center p-3 rounded-2xl transition-all border ${isToday ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest mb-1">${day.toLocaleDateString('nl-NL', { weekday: 'short' })}</span>
              <span className="text-xl font-bold">${day.getDate()}</span>
            </button>
          `;
        })}
      </div>

      <div className="space-y-4">
        ${activeTasks.length > 0 ? activeTasks.map(task => html`
          <div key=${task.id} onClick=${() => onToggle(task.id, selectedDate)} className=${`group cursor-pointer p-6 rounded-[2rem] border transition-all flex items-center gap-6 ${isCompleted(task.id, selectedDate) ? 'bg-emerald-50/50 border-emerald-100 opacity-70' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'}`}>
            <div className=${`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isCompleted(task.id, selectedDate) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-300'}`}>
              ${isCompleted(task.id, selectedDate) ? html`<${ICONS.Check} className="w-6 h-6" />` : html`<div className="w-3 h-3 border-2 border-current rounded-full" />`}
            </div>
            <div className="flex-1">
              <h3 className=${`text-lg font-bold ${isCompleted(task.id, selectedDate) ? 'text-slate-400 line-through' : 'text-slate-800'}`}>${task.title}</h3>
              <p className="text-sm text-slate-400">${task.description}</p>
            </div>
          </div>
        `) : html`
          <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold text-lg">Helemaal klaar voor vandaag! 🎉</p>
          </div>
        `}
      </div>
    </div>
  `;
};

const UserManagement = ({ users, onAddUser, onDeleteUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '123', role: UserRole.CHILD });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddUser(formData);
    setIsAdding(false);
    setFormData({ name: '', email: '', password: '123', role: UserRole.CHILD });
  };

  return html`
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Gebruikersbeheer</h3>
        <button onClick=${() => setIsAdding(true)} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2">
          <${ICONS.Plus} className="w-5 h-5" /> Gebruiker Toevoegen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${users.map(user => html`
          <div key=${user.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-inner">
               <img src=${user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-slate-800 truncate">${user.name}</p>
              <p className="text-xs text-slate-400 truncate">${user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                 <span className=${`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${user.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>${user.role}</span>
              </div>
            </div>
            ${user.id !== 'admin-1' && user.id !== 'team-3' && html`
              <button onClick=${() => onDeleteUser(user.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all">
                <${ICONS.Trash} className="w-4 h-4" />
              </button>
            `}
          </div>
        `)}
      </div>

      ${isAdding && html`
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800">Nieuwe Gebruiker</h3>
              <button onClick=${() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><${ICONS.XMark} className="w-6 h-6"/></button>
            </div>
            <form onSubmit=${handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Volledige Naam</label>
                <input type="text" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value=${formData.name} onInput=${e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">E-mailadres</label>
                <input type="email" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value=${formData.email} onInput=${e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Wachtwoord</label>
                <input type="password" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value=${formData.password} onInput=${e => setFormData({...formData, password: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Rol</label>
                <select className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none font-bold appearance-none" value=${formData.role} onChange=${e => setFormData({...formData, role: e.target.value})}>
                  <option value=${UserRole.CHILD}>Kind / Gebruiker</option>
                  <option value=${UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-5 rounded-2xl shadow-lg mt-4 hover:bg-emerald-600 active:scale-[0.98] transition-all">Account Aanmaken</button>
            </form>
          </div>
        </div>
      `}
    </div>
  `;
};

const AdminDashboard = ({ tasks, users, onAddTask, onDeleteTask, onAddUser, onDeleteUser }) => {
  const [formData, setFormData] = useState({ title: '', description: '', frequency: TaskFrequency.DAILY });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  return html`
    <div className="space-y-10">
      <div className="flex gap-8 border-b border-slate-100">
        <button onClick=${() => setActiveTab('tasks')} className=${`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Taken</button>
        <button onClick=${() => setActiveTab('users')} className=${`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Gebruikers</button>
      </div>

      ${activeTab === 'tasks' ? html`
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Taakbeheer</h2>
            <button onClick=${() => setIsAddingTask(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
              <${ICONS.Plus} className="w-5 h-5" /> Nieuwe Taak
            </button>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Taak informatie</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Beheer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                ${tasks.map(task => html`
                  <tr key=${task.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-800">${task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">${task.description}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black uppercase text-slate-500 tracking-wider">${task.frequency}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button onClick=${() => onDeleteTask(task.id)} className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                        <${ICONS.Trash} className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      ` : html`
        <div className="animate-in slide-in-from-bottom-2 duration-300">
           <${UserManagement} users=${users} onAddUser=${onAddUser} onDeleteUser=${onDeleteUser} />
        </div>
      `}

      ${isAddingTask && html`
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800">Taak Aanmaken</h3>
              <button onClick=${() => setIsAddingTask(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><${ICONS.XMark} className="w-6 h-6"/></button>
            </div>
            <form onSubmit=${(e) => { e.preventDefault(); onAddTask(formData); setIsAddingTask(false); setFormData({title:'', description:'', frequency:TaskFrequency.DAILY}); }} className="space-y-5">
              <input type="text" placeholder="Titel van de taak" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value=${formData.title} onInput=${e => setFormData({...formData, title: e.target.value})} required />
              <textarea placeholder="Korte beschrijving of instructies" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600 transition-all min-h-[100px]" value=${formData.description} onInput=${e => setFormData({...formData, description: e.target.value})} />
              <select className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none font-bold appearance-none" value=${formData.frequency} onChange=${e => setFormData({...formData, frequency: e.target.value})}>
                ${Object.values(TaskFrequency).map(f => html`<option key=${f} value=${f}>${f}</option>`)}
              </select>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-lg mt-4 hover:bg-indigo-700 active:scale-[0.98] transition-all">Taak Opslaan</button>
            </form>
          </div>
        </div>
      `}
    </div>
  `;
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('tp_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [viewMode, setViewMode] = useState('daily');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    localStorage.setItem('tp_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: dbTasks } = await supabase.from('tasks').select('*');
        if (dbTasks && dbTasks.length > 0) {
           setTasks(dbTasks.map(t => ({...t, assignedTo: t.assigned_to, frequency: t.frequency})));
        } else {
           // Fallback naar localStorage voor demo doeleinden
           const savedTasks = localStorage.getItem('tp_tasks');
           if (savedTasks) setTasks(JSON.parse(savedTasks));
        }
        
        const { data: dbCompletions } = await supabase.from('completions').select('*');
        if (dbCompletions) {
           setCompletions(dbCompletions.map(c => ({...c, taskId: c.task_id})));
        } else {
           const savedComps = localStorage.getItem('tp_completions');
           if (savedComps) setCompletions(JSON.parse(savedComps));
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const saved = localStorage.getItem('session');
    if (saved) {
      const parsed = JSON.parse(saved);
      const exists = users.find(u => u.id === parsed.id);
      if (exists) {
        setCurrentUser(exists);
        setViewMode(exists.role === UserRole.ADMIN ? 'manage' : 'daily');
      } else {
        localStorage.removeItem('session');
      }
    }
  }, []);

  // Sync tasks and completions to localStorage as backup
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('tp_tasks', JSON.stringify(tasks));
      localStorage.setItem('tp_completions', JSON.stringify(completions));
    }
  }, [tasks, completions, isLoading]);

  const handleLogin = (email, pass) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('session', JSON.stringify(user));
      setViewMode(user.role === UserRole.ADMIN ? 'manage' : 'daily');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('session');
  };

  const onAddUser = (userData) => {
    const newUser = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`
    };
    setUsers(prev => [...prev, newUser]);
  };

  const onDeleteUser = (id) => {
    if (window.confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const addTask = async (newTask) => {
    const task = { ...newTask, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), startDate: formatDateISO(new Date()), assignedTo: 'team-3' };
    setTasks(prev => [task, ...prev]);
    try {
      await supabase.from('tasks').insert([{ title: task.title, description: task.description, assigned_to: task.assignedTo, frequency: task.frequency, start_date: task.startDate }]);
    } catch(e) {}
  };

  const removeTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch(e) {}
  };

  const toggleTask = async (taskId, date) => {
    if (!currentUser) return;
    const existing = completions.find(c => c.taskId === taskId && c.completedAt === date);
    if (existing) {
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
      try {
        await supabase.from('completions').delete().eq('id', existing.id);
      } catch(e) {}
    } else {
      const completion = { id: Math.random().toString(36).substr(2, 9), taskId, completedAt: date, userId: currentUser.id };
      setCompletions(prev => [...prev, completion]);
      try {
        await supabase.from('completions').insert([{ task_id: taskId, completed_at: date, user_id: currentUser.id }]);
      } catch(e) {}
    }
  };

  if (isLoading) return html`
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] flex-col gap-6">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Initialiseren...</p>
    </div>
  `;

  if (!currentUser) return html`<${LoginView} onLogin=${handleLogin} />`;

  return html`
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      <nav className="w-full md:w-80 bg-white border-r border-slate-100 flex flex-col p-8 gap-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">T</div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">TaskPulse</h1>
        </div>
        
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-2">Navigation</p>
          <button onClick=${() => setViewMode('daily')} className=${`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${viewMode === 'daily' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 hover:bg-slate-50'}`}>
            <${ICONS.Calendar} className="w-5 h-5" /> Mijn Taken
          </button>
          ${currentUser.role === UserRole.ADMIN && html`
            <button onClick=${() => setViewMode('manage')} className=${`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${viewMode === 'manage' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <${ICONS.Layout} className="w-5 h-5" /> Beheer
            </button>
          `}
        </div>

        <div className="mt-auto pt-8 border-t border-slate-50 flex flex-col gap-6">
           <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
               <img src=${currentUser.avatar} className="w-full h-full object-cover" alt="" />
             </div>
             <div className="overflow-hidden">
               <p className="font-bold text-sm text-slate-800 truncate">${currentUser.name}</p>
               <p className="text-[10px] text-slate-400 uppercase font-black">${currentUser.role}</p>
             </div>
           </div>
           <button onClick=${handleLogout} className="flex items-center gap-4 px-5 py-3 text-slate-400 hover:text-red-500 font-bold transition-all">
             <${ICONS.Logout} className="w-5 h-5" /> Uitloggen
           </button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          ${viewMode === 'daily' && html`<${UserView} tasks=${tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === 'team-3')} selectedDate=${selectedDate} setSelectedDate=${setSelectedDate} onToggle=${toggleTask} isCompleted=${(tid, d) => completions.some(c => c.taskId === tid && c.completedAt === d)} currentUser=${currentUser} />`}
          ${viewMode === 'manage' && currentUser.role === UserRole.ADMIN && html`<${AdminDashboard} tasks=${tasks} users=${users} onAddTask=${addTask} onDeleteTask=${removeTask} onAddUser=${onAddUser} onDeleteUser=${onDeleteUser} />`}
        </div>
      </main>
    </div>
  `;
};

export default App;
