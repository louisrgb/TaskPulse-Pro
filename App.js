
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

const LoginView = ({ onLogin, syncError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onLogin(email, password)) setError(true);
  };

  return html`
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-white/50 animate-in zoom-in duration-300">
        <div className="flex flex-col items-center gap-6 mb-10 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-indigo-100">T</div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">TaskPulse</h2>
            <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-widest">Familie Dashboard</p>
          </div>
        </div>

        ${syncError && html`
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-800 text-xs font-medium">
             <div className="mt-0.5">⚠️</div>
             <p>Verbindingsfout met cloud. Controleer de database instellingen.</p>
          </div>
        `}

        <form onSubmit=${handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <input type="email" placeholder="E-mail" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all" value=${email} onInput=${e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <input type="password" placeholder="Wachtwoord" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all" value=${password} onInput=${e => setPassword(e.target.value)} required />
          </div>
          ${error && html`<p className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl">Inloggegevens onjuist.</p>`}
          <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all text-lg mt-2">Inloggen</button>
        </form>
      </div>
    </div>
  `;
};

const UserView = ({ tasks, selectedDate, setSelectedDate, onToggle, isCompleted, currentUser }) => {
  const weekDays = useMemo(() => getDaysOfWeek(new Date(selectedDate)), [selectedDate]);
  const activeTasks = tasks.filter(t => isTaskVisibleOnDate(t, selectedDate));

  const shiftWeek = (direction) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (direction * 7));
    setSelectedDate(formatDateISO(d));
  };

  return html`
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hoi ${currentUser.name}!</h2>
        <p className="text-slate-400 font-bold text-sm">
          ${activeTasks.length === 0 ? 'Geen taken voor deze dag.' : `Nog ${activeTasks.filter(t => !isCompleted(t.id, selectedDate)).length} taken te gaan vandaag.`}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Deze Week</h3>
           <div className="flex items-center gap-2">
             <button onClick=${() => shiftWeek(-1)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
             </button>
             <button onClick=${() => shiftWeek(1)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
             </button>
           </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
          ${weekDays.map(day => {
            const ds = formatDateISO(day);
            const isSelected = ds === selectedDate;
            const isToday = formatDateISO(new Date()) === ds;
            return html`
              <button key=${ds} onClick=${() => setSelectedDate(ds)} className=${`flex flex-col items-center p-4 min-w-[65px] flex-1 rounded-[1.5rem] transition-all border-2 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' : 'bg-white border-slate-50 text-slate-400 hover:border-indigo-100'} ${isToday && !isSelected ? 'border-indigo-200' : ''}`}>
                <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">${day.toLocaleDateString('nl-NL', { weekday: 'short' })}</span>
                <span className="text-xl font-black">${day.getDate()}</span>
              </button>
            `;
          })}
        </div>
      </div>

      <div className="space-y-3">
        ${activeTasks.length > 0 ? activeTasks.map(task => html`
          <div key=${task.id} onClick=${() => onToggle(task.id, selectedDate)} className=${`group cursor-pointer p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${isCompleted(task.id, selectedDate) ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : 'bg-white border-slate-50 shadow-sm hover:border-indigo-200'}`}>
            <div className=${`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isCompleted(task.id, selectedDate) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-300'}`}>
              ${isCompleted(task.id, selectedDate) ? html`<${ICONS.Check} className="w-6 h-6" />` : html`<div className="w-3 h-3 border-2 border-current rounded-full" />`}
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className=${`text-lg font-black truncate ${isCompleted(task.id, selectedDate) ? 'text-slate-400 line-through' : 'text-slate-800'}`}>${task.title}</h3>
              <p className="text-xs text-slate-400 font-medium truncate">${task.description}</p>
            </div>
          </div>
        `) : html`
          <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-black">Alles gedaan voor vandaag! 🎉</p>
          </div>
        `}
      </div>
    </div>
  `;
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [viewMode, setViewMode] = useState('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState(false);

  // Cloud Sync Effect
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setSyncError(true);
        setIsLoading(false);
        return;
      }

      try {
        const [profRes, taskRes, compRes] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('tasks').select('*'),
          supabase.from('completions').select('*')
        ]);

        if (profRes.error) console.warn("Profiles fetch error:", profRes.error);
        if (profRes.data) {
          const merged = [...INITIAL_USERS];
          profRes.data.forEach(p => {
            const idx = merged.findIndex(m => m.id === p.id || m.email.toLowerCase() === p.email.toLowerCase());
            if (idx > -1) merged[idx] = { ...merged[idx], ...p };
            else merged.push({ ...p, role: p.role || UserRole.CHILD });
          });
          setUsers(merged);
        }

        if (taskRes.data) {
          setTasks(taskRes.data.map(t => ({
            ...t,
            assignedTo: t.assigned_to,
            frequency: t.frequency,
            startDate: t.start_date
          })));
        }

        if (compRes.data) {
          setCompletions(compRes.data.map(c => ({ 
            ...c, 
            taskId: c.task_id, 
            completedAt: c.completed_at 
          })));
        }

        setSyncError(false);
      } catch (err) {
        console.error("Cloud error:", err);
        setSyncError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogin = (email, pass) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && String(u.password) === String(pass));
    if (user) {
      setCurrentUser(user);
      setViewMode(user.role === UserRole.ADMIN ? 'manage' : 'daily');
      return true;
    }
    return false;
  };

  const addTask = async (newTask) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const startDate = formatDateISO(new Date());
    
    try {
      const { data, error } = await supabase.from('tasks').insert([{ 
        id: tempId,
        title: newTask.title, 
        description: newTask.description, 
        assigned_to: 'team-all', 
        frequency: newTask.frequency, 
        start_date: startDate 
      }]).select();
      
      if (error) throw error;
      
      const saved = data[0];
      setTasks(prev => [{
        ...saved,
        assignedTo: saved.assigned_to,
        frequency: saved.frequency,
        startDate: saved.start_date
      }, ...prev]);
    } catch (e) {
      console.error("Add failed:", e);
      alert("Fout bij opslaan taak.");
    }
  };

  const removeTask = async (id) => {
    try {
      await supabase.from('tasks').delete().eq('id', id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const toggleTask = async (taskId, date) => {
    if (!currentUser) return;
    const existing = completions.find(c => c.taskId === taskId && c.completedAt === date);
    
    try {
      if (existing) {
        await supabase.from('completions').delete().eq('id', existing.id);
        setCompletions(prev => prev.filter(c => c.id !== existing.id));
      } else {
        const newId = Math.random().toString(36).substr(2, 9);
        await supabase.from('completions').insert([{ 
          id: newId,
          task_id: taskId, 
          completed_at: date, 
          user_id: currentUser.id 
        }]);
        setCompletions(prev => [...prev, { id: newId, taskId, completedAt: date, userId: currentUser.id }]);
      }
    } catch (e) {
      console.error("Toggle failed:", e);
    }
  };

  if (isLoading) return html`
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] flex-col gap-6">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Cloud Sync...</p>
    </div>
  `;

  if (!currentUser) return html`<${LoginView} onLogin=${handleLogin} syncError=${syncError} />`;

  return html`
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] font-sans">
      <nav className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-100 flex flex-col p-6 md:p-10 gap-8 z-50">
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">T</div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">TaskPulse</h1>
          </div>
          <div className=${`w-2 h-2 rounded-full ${syncError ? 'bg-red-500' : 'bg-emerald-500'} md:hidden`} />
        </div>
        
        <div className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar">
          <button onClick=${() => setViewMode('daily')} className=${`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold whitespace-nowrap ${viewMode === 'daily' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 hover:bg-slate-50'}`}>
            <${ICONS.Calendar} className="w-5 h-5" /> Mijn Taken
          </button>
          ${currentUser.role === UserRole.ADMIN && html`
            <button onClick=${() => setViewMode('manage')} className=${`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold whitespace-nowrap ${viewMode === 'manage' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <${ICONS.Layout} className="w-5 h-5" /> Beheer
            </button>
          `}
        </div>

        <div className="mt-auto hidden md:flex flex-col gap-6">
           <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm">
               <img src=${currentUser.avatar} className="w-full h-full object-cover" />
             </div>
             <div className="overflow-hidden">
               <p className="font-bold text-sm text-slate-800 truncate">${currentUser.name}</p>
               <div className="flex items-center gap-1">
                 <div className=${`w-1.5 h-1.5 rounded-full ${syncError ? 'bg-red-500' : 'bg-emerald-500'}`} />
                 <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">${syncError ? 'Offline' : 'Online'}</p>
               </div>
             </div>
           </div>
           <button onClick=${() => setCurrentUser(null)} className="flex items-center gap-4 px-6 py-3 text-slate-400 hover:text-red-500 font-bold transition-all">
             <${ICONS.Logout} className="w-5 h-5" /> Uitloggen
           </button>
        </div>

        <button onClick=${() => setCurrentUser(null)} className="md:hidden absolute top-6 right-6 p-2 text-slate-300">
          <${ICONS.Logout} className="w-6 h-6" />
        </button>
      </nav>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto">
          ${viewMode === 'daily' && html`<${UserView} tasks=${tasks} selectedDate=${selectedDate} setSelectedDate=${setSelectedDate} onToggle=${toggleTask} isCompleted=${(tid, d) => completions.some(c => c.taskId === tid && c.completedAt === d)} currentUser=${currentUser} />`}
          ${viewMode === 'manage' && currentUser.role === UserRole.ADMIN && html`
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-800">Admin</h2>
                    <p className="text-slate-400 font-bold text-sm">Beheer cloud taken voor iedereen.</p>
                  </div>
                  <button onClick=${() => {
                    const title = prompt("Titel:");
                    const desc = prompt("Omschrijving:");
                    if (title) addTask({title, description: desc || '', frequency: 'Dagelijks'});
                  }} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <${ICONS.Plus} className="w-5 h-5" /> Nieuwe Taak
                  </button>
               </div>

               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inhoud</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      ${tasks.map(t => html`
                        <tr key=${t.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-8 py-6">
                            <p className="font-bold text-slate-800">${t.title}</p>
                            <p className="text-xs text-slate-400">${t.frequency}</p>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button onClick=${() => removeTask(t.id)} className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                              <${ICONS.Trash} className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      `)}
                    </tbody>
                  </table>
                  ${tasks.length === 0 && html`<div className="p-20 text-center text-slate-300 font-bold">Geen taken gevonden in de cloud.</div>`}
               </div>
            </div>
          `}
        </div>
      </main>
    </div>
  `;
};

export default App;
