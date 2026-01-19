
import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { TaskFrequency, UserRole } from './types.js';
import { ICONS } from './constants.js';
import { formatDateISO, getDaysOfWeek, isTaskVisibleOnDate } from './utils/dateUtils.js';
import { supabase } from './services/supabaseClient.js';

const html = htm.bind(React.createElement);

const INITIAL_USERS = [
  { id: 'admin-1', name: 'Louis (Admin)', email: 'admin@taskpulse.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Louis', role: UserRole.ADMIN, password: '123' },
  { id: 'louis-master', name: 'Louis Chauvet', email: 'louis.chauvet11.111@gmail.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Master', role: UserRole.ADMIN, password: '#Septembre5' },
  { id: 'team-all', name: 'Iedereen', email: 'iedereen@taskpulse.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team', role: UserRole.CHILD, password: '123' },
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
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] p-4">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 border border-white/50 animate-in zoom-in duration-300">
        <div className="flex flex-col items-center gap-6 mb-12 text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-bold text-4xl shadow-2xl shadow-indigo-100">T</div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">TaskPulse Pro</h2>
            <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">Beveiligde Toegang</p>
          </div>
        </div>
        <form onSubmit=${handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">E-mail</label>
            <input type="email" placeholder="jouw@email.com" className="w-full px-8 py-5 rounded-[2rem] border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all" value=${email} onInput=${e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Wachtwoord</label>
            <input type="password" placeholder="••••••••" className="w-full px-8 py-5 rounded-[2rem] border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all" value=${password} onInput=${e => setPassword(e.target.value)} required />
          </div>
          ${error && html`<p className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-2xl">Ongeldige login.</p>`}
          <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all text-lg mt-4">Inloggen</button>
        </form>
      </div>
    </div>
  `;
};

const UserManagement = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '123', role: UserRole.CHILD, avatar: '' });

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '123', role: UserRole.CHILD, avatar: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: user.password || '123', role: user.role, avatar: user.avatar || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...formData });
    } else {
      onAddUser(formData);
    }
    setIsModalOpen(false);
  };

  return html`
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Leden & Profielen</h3>
          <p className="text-slate-400 text-sm font-medium">Beheer gebruikers en profielfoto's.</p>
        </div>
        <button onClick=${openAddModal} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-3">
          <${ICONS.Plus} className="w-6 h-6" /> Nieuw Lid
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${users.map(user => html`
          <div key=${user.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                 <img src=${user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-black text-slate-800 truncate text-lg">${user.name}</p>
                <p className="text-xs text-slate-400 truncate font-medium">${user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className=${`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${user.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>${user.role}</span>
              <div className="flex gap-2">
                <button title="Bewerken" onClick=${() => openEditModal(user)} className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all">
                  <${ICONS.Pencil} className="w-5 h-5" />
                </button>
                ${user.id !== 'admin-1' && user.id !== 'louis-master' && user.id !== 'team-all' && html`
                  <button title="Verwijderen" onClick=${() => onDeleteUser(user.id)} className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                    <${ICONS.Trash} className="w-5 h-5" />
                  </button>
                `}
              </div>
            </div>
          </div>
        `)}
      </div>

      ${isModalOpen && html`
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800">${editingUser ? 'Lid Bewerken' : 'Nieuw Lid Toevoegen'}</h3>
              <button onClick=${() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-all"><${ICONS.XMark} className="w-6 h-6"/></button>
            </div>
            <form onSubmit=${handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Naam</label>
                <input type="text" className="w-full px-8 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-50" value=${formData.name} onInput=${e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Profielfoto URL</label>
                <input type="text" placeholder="https://..." className="w-full px-8 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-50" value=${formData.avatar} onInput=${e => setFormData({...formData, avatar: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">E-mail</label>
                <input type="email" className="w-full px-8 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-50" value=${formData.email} onInput=${e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Wachtwoord</label>
                <input type="text" className="w-full px-8 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-50" value=${formData.password} onInput=${e => setFormData({...formData, password: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Rol</label>
                <select className="w-full px-8 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none font-bold appearance-none" value=${formData.role} onChange=${e => setFormData({...formData, role: e.target.value})}>
                  <option value=${UserRole.CHILD}>Kind / Gebruiker</option>
                  <option value=${UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-indigo-100 mt-6 hover:bg-indigo-700 active:scale-95 transition-all">
                ${editingUser ? 'Opslaan & Synchroniseren' : 'Toevoegen aan Team'}
              </button>
            </form>
          </div>
        </div>
      `}
    </div>
  `;
};

const AdminDashboard = ({ tasks, users, onAddTask, onDeleteTask, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [formData, setFormData] = useState({ title: '', description: '', frequency: TaskFrequency.DAILY });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  return html`
    <div className="space-y-10 pb-20">
      <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 w-fit mx-auto md:mx-0 shadow-sm">
        <button onClick=${() => setActiveTab('tasks')} className=${`px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Taken</button>
        <button onClick=${() => setActiveTab('users')} className=${`px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Gebruikers</button>
      </div>

      ${activeTab === 'tasks' ? html`
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Takenbeheer</h2>
              <p className="text-slate-400 text-sm font-medium">Beheer alle dagelijkse en wekelijkse routines.</p>
            </div>
            <button onClick=${() => setIsAddingTask(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3">
              <${ICONS.Plus} className="w-6 h-6" /> Nieuwe Taak
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informatie</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Beheer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                ${tasks.map(task => html`
                  <tr key=${task.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-8">
                      <p className="font-black text-slate-800 text-lg">${task.title}</p>
                      <p className="text-sm text-slate-400 font-medium">${task.description}</p>
                      <span className="inline-block mt-3 px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase text-slate-500 tracking-wider">${task.frequency}</span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button onClick=${() => onDeleteTask(task.id)} className="p-4 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all">
                        <${ICONS.Trash} className="w-6 h-6" />
                      </button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      ` : html`
        <${UserManagement} users=${users} onAddUser=${onAddUser} onUpdateUser=${onUpdateUser} onDeleteUser=${onDeleteUser} />
      `}

      ${isAddingTask && html`
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-slate-800">Nieuwe Taak</h3>
              <button onClick=${() => setIsAddingTask(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-all"><${ICONS.XMark} className="w-6 h-6"/></button>
            </div>
            <form onSubmit=${(e) => { e.preventDefault(); onAddTask(formData); setIsAddingTask(false); setFormData({title:'', description:'', frequency:TaskFrequency.DAILY}); }} className="space-y-6">
              <input type="text" placeholder="Titel van de taak" className="w-full px-8 py-5 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-50" value=${formData.title} onInput=${e => setFormData({...formData, title: e.target.value})} required />
              <textarea placeholder="Korte beschrijving..." className="w-full px-8 py-5 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-50 min-h-[120px]" value=${formData.description} onInput=${e => setFormData({...formData, description: e.target.value})} />
              <select className="w-full px-8 py-5 rounded-2xl border border-slate-100 bg-slate-50 outline-none font-bold" value=${formData.frequency} onChange=${e => setFormData({...formData, frequency: e.target.value})}>
                ${Object.values(TaskFrequency).map(f => html`<option key=${f} value=${f}>${f}</option>`)}
              </select>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2rem] shadow-xl mt-6 hover:bg-indigo-700 transition-all">Direct Publiceren</button>
            </form>
          </div>
        </div>
      `}
    </div>
  `;
};

const UserView = ({ tasks, selectedDate, setSelectedDate, onToggle, isCompleted, currentUser }) => {
  const weekDays = useMemo(() => getDaysOfWeek(new Date(selectedDate)), [selectedDate]);
  const activeTasks = tasks.filter(t => isTaskVisibleOnDate(t, selectedDate));

  return html`
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Hoi ${currentUser.name}!</h2>
        <p className="text-slate-500 font-bold text-lg">Vandaag zijn er ${activeTasks.length} taken voor jou.</p>
      </div>

      <div className="grid grid-cols-7 gap-3 overflow-x-auto pb-4 no-scrollbar">
        ${weekDays.map(day => {
          const ds = formatDateISO(day);
          const isToday = ds === selectedDate;
          return html`
            <button key=${ds} onClick=${() => setSelectedDate(ds)} className=${`flex flex-col items-center p-5 min-w-[70px] rounded-3xl transition-all border-2 ${isToday ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'bg-white border-slate-50 text-slate-400 hover:border-indigo-100'}`}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">${day.toLocaleDateString('nl-NL', { weekday: 'short' })}</span>
              <span className="text-2xl font-black tracking-tighter">${day.getDate()}</span>
            </button>
          `;
        })}
      </div>

      <div className="space-y-4">
        ${activeTasks.length > 0 ? activeTasks.map(task => html`
          <div key=${task.id} onClick=${() => onToggle(task.id, selectedDate)} className=${`group cursor-pointer p-8 rounded-[2.5rem] border-2 transition-all flex items-center gap-8 ${isCompleted(task.id, selectedDate) ? 'bg-emerald-50/30 border-emerald-100/50 opacity-60' : 'bg-white border-slate-50 shadow-sm hover:border-indigo-200'}`}>
            <div className=${`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isCompleted(task.id, selectedDate) ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
              ${isCompleted(task.id, selectedDate) ? html`<${ICONS.Check} className="w-8 h-8" />` : html`<div className="w-4 h-4 border-4 border-current rounded-full" />`}
            </div>
            <div className="flex-1">
              <h3 className=${`text-xl font-black ${isCompleted(task.id, selectedDate) ? 'text-slate-400 line-through' : 'text-slate-800'}`}>${task.title}</h3>
              <p className="text-slate-400 font-medium mt-1">${task.description}</p>
            </div>
          </div>
        `) : html`
          <div className="bg-white rounded-[3rem] p-24 text-center border-4 border-dashed border-slate-50">
            <p className="text-slate-400 font-black text-xl">Lekker bezig! Alles is gedaan. 🎉</p>
          </div>
        `}
      </div>
    </div>
  `;
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('tp_users');
    let parsed = saved ? JSON.parse(saved) : INITIAL_USERS;
    INITIAL_USERS.forEach(iu => {
      if (!parsed.find(u => u.email.toLowerCase() === iu.email.toLowerCase())) {
        parsed.push(iu);
      }
    });
    return parsed;
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
        // Fetch Profiles (Users)
        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        if (dbProfiles && dbProfiles.length > 0) {
           const merged = [...INITIAL_USERS];
           dbProfiles.forEach(p => {
             const existingIdx = merged.findIndex(m => m.email.toLowerCase() === p.email.toLowerCase());
             if (existingIdx > -1) {
               merged[existingIdx] = { ...merged[existingIdx], ...p };
             } else {
               merged.push({ ...p, role: p.role || UserRole.CHILD });
             }
           });
           setUsers(merged);
        }

        // Fetch Tasks
        const { data: dbTasks } = await supabase.from('tasks').select('*');
        if (dbTasks && dbTasks.length > 0) {
           setTasks(dbTasks.map(t => ({...t, assignedTo: t.assigned_to, frequency: t.frequency})));
        }
        
        // Fetch Completions
        const { data: dbCompletions } = await supabase.from('completions').select('*');
        if (dbCompletions) {
           setCompletions(dbCompletions.map(c => ({...c, taskId: c.task_id})));
        }
      } catch (err) {
        console.error("Sync error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const saved = localStorage.getItem('session');
    if (saved) {
      const parsed = JSON.parse(saved);
      const exists = users.find(u => u.email.toLowerCase() === parsed.email.toLowerCase());
      if (exists) {
        setCurrentUser(exists);
        setViewMode(exists.role === UserRole.ADMIN ? 'manage' : 'daily');
      } else {
        localStorage.removeItem('session');
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('tp_tasks', JSON.stringify(tasks));
      localStorage.setItem('tp_completions', JSON.stringify(completions));
    }
  }, [tasks, completions, isLoading]);

  const handleLogin = (email, pass) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && String(u.password) === String(pass));
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

  const onAddUser = async (userData) => {
    const newUser = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`
    };
    setUsers(prev => [...prev, newUser]);
    try {
      await supabase.from('profiles').insert([{ 
        id: newUser.id,
        name: newUser.name, 
        email: newUser.email, 
        password: newUser.password, 
        role: newUser.role,
        avatar: newUser.avatar 
      }]);
    } catch (e) { console.error("Sync Error:", e); }
  };

  const onUpdateUser = async (updatedUser) => {
    const finalAvatar = updatedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${updatedUser.name}`;
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...updatedUser, avatar: finalAvatar } : u));
    
    if (currentUser?.id === updatedUser.id) {
       const sessionUser = { ...updatedUser, avatar: finalAvatar };
       setCurrentUser(sessionUser);
       localStorage.setItem('session', JSON.stringify(sessionUser));
    }
    
    try {
      await supabase.from('profiles').update({ 
        name: updatedUser.name, 
        email: updatedUser.email, 
        password: updatedUser.password, 
        role: updatedUser.role,
        avatar: finalAvatar
      }).eq('id', updatedUser.id);
    } catch (e) { console.error("Sync Error:", e); }
  };

  const onDeleteUser = async (id) => {
    if (window.confirm('Gebruiker definitief verwijderen?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (e) { console.error("Sync Error:", e); }
    }
  };

  const addTask = async (newTask) => {
    const task = { ...newTask, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), startDate: formatDateISO(new Date()), assignedTo: 'team-all' };
    setTasks(prev => [task, ...prev]);
    try {
      await supabase.from('tasks').insert([{ 
        id: task.id,
        title: task.title, 
        description: task.description, 
        assigned_to: task.assignedTo, 
        frequency: task.frequency, 
        start_date: task.startDate 
      }]);
    } catch (e) { console.error("Sync Error:", e); }
  };

  const removeTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (e) { console.error("Sync Error:", e); }
  };

  const toggleTask = async (taskId, date) => {
    if (!currentUser) return;
    const existing = completions.find(c => c.taskId === taskId && c.completedAt === date);
    if (existing) {
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
      try {
        await supabase.from('completions').delete().eq('id', existing.id);
      } catch (e) { console.error("Sync Error:", e); }
    } else {
      const completion = { id: Math.random().toString(36).substr(2, 9), taskId, completedAt: date, userId: currentUser.id };
      setCompletions(prev => [...prev, completion]);
      try {
        await supabase.from('completions').insert([{ 
          id: completion.id,
          task_id: taskId, 
          completed_at: date, 
          user_id: currentUser.id 
        }]);
      } catch (e) { console.error("Sync Error:", e); }
    }
  };

  if (isLoading) return html`
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] flex-col gap-8">
      <div className="w-16 h-16 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  `;

  if (!currentUser) return html`<${LoginView} onLogin=${handleLogin} />`;

  return html`
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      <nav className="w-full md:w-96 bg-white border-r border-slate-100 flex flex-col p-10 gap-12 z-50 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100">T</div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">TaskPulse</h1>
        </div>
        
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-4">Navigatie</p>
          <button onClick=${() => setViewMode('daily')} className=${`flex items-center gap-5 px-6 py-5 rounded-[2rem] transition-all font-black ${viewMode === 'daily' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 hover:bg-slate-50'}`}>
            <${ICONS.Calendar} className="w-6 h-6" /> Mijn Taken
          </button>
          ${currentUser.role === UserRole.ADMIN && html`
            <button onClick=${() => setViewMode('manage')} className=${`flex items-center gap-5 px-6 py-5 rounded-[2rem] transition-all font-black ${viewMode === 'manage' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <${ICONS.Layout} className="w-6 h-6" /> Beheer
            </button>
          `}
        </div>

        <div className="mt-auto pt-10 border-t border-slate-50 flex flex-col gap-6">
           <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-[2.5rem] border border-slate-100">
             <div className="w-12 h-12 bg-white rounded-full overflow-hidden shadow-xl border-2 border-white">
               <img src=${currentUser.avatar} className="w-full h-full object-cover" />
             </div>
             <div className="overflow-hidden">
               <p className="font-black text-slate-800 truncate">${currentUser.name}</p>
               <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">${currentUser.role}</p>
             </div>
           </div>
           <button onClick=${handleLogout} className="flex items-center gap-5 px-8 py-4 text-slate-400 hover:text-red-500 font-black transition-all">
             <${ICONS.Logout} className="w-6 h-6" /> Uitloggen
           </button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-16 overflow-y-auto bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto">
          ${viewMode === 'daily' && html`<${UserView} tasks=${tasks} selectedDate=${selectedDate} setSelectedDate=${setSelectedDate} onToggle=${toggleTask} isCompleted=${(tid, d) => completions.some(c => c.taskId === tid && c.completedAt === d)} currentUser=${currentUser} />`}
          ${viewMode === 'manage' && currentUser.role === UserRole.ADMIN && html`<${AdminDashboard} tasks=${tasks} users=${users} onAddTask=${addTask} onDeleteTask=${removeTask} onAddUser=${onAddUser} onUpdateUser=${onUpdateUser} onDeleteUser=${onDeleteUser} />`}
        </div>
      </main>
    </div>
  `;
};

export default App;
