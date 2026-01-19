
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskCompletion, User, UserRole, TaskFrequency, ViewMode } from './types.ts';
import { ICONS, COLORS } from './constants.tsx';
import { formatDateISO, getDaysOfWeek, isTaskVisibleOnDate } from './utils/dateUtils.ts';
import { geminiService } from './services/geminiService.ts';
import { supabase } from './services/supabaseClient.ts';

const INITIAL_USERS: User[] = [
  { id: '3', name: 'Iedereen', email: 'iedereen@taskpulse.com', avatar: 'https://picsum.photos/seed/team/100', role: UserRole.CHILD },
];

const LoginView: React.FC<{ onLogin: (email: string, pass: string) => boolean }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(email, password)) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl p-10 border border-slate-100">
        <div className="flex flex-col items-center gap-6 mb-8 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-indigo-100">T</div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">TaskPulse</h2>
            <p className="text-slate-500 text-sm">Gezinsproductiviteit in de cloud.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">E-mailadres</label>
            <input type="email" className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Wachtwoord</label>
            <input type="password" title="password" className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-red-500 text-xs font-bold ml-1">Onjuiste e-mail of wachtwoord.</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
            Inloggen
          </button>
        </form>
      </div>
    </div>
  );
};

const UserView: React.FC<{ 
  tasks: Task[], 
  selectedDate: string, 
  setSelectedDate: (d: string) => void,
  viewMode: ViewMode,
  setViewMode: (m: string) => void,
  onToggle: (taskId: string, date: string) => void,
  isCompleted: (taskId: string, date: string) => boolean,
  currentUser: User,
  navigateWeeks: (w: number) => void
}> = ({ tasks, selectedDate, setSelectedDate, viewMode, setViewMode, onToggle, isCompleted, currentUser, navigateWeeks }) => {
  const weekDays = useMemo(() => getDaysOfWeek(new Date(selectedDate)), [selectedDate]);
  const activeTasks = tasks.filter(t => isTaskVisibleOnDate(t, selectedDate));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Hoi {currentUser.name}! 👋</h2>
          <p className="text-slate-500 mt-1">Laten we er een productieve dag van maken.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => setViewMode('daily')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'daily' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Vandaag</button>
          <button onClick={() => setViewMode('weekly')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'weekly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Deze Week</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {weekDays.map(day => {
          const ds = formatDateISO(day);
          const sel = ds === selectedDate;
          return (
            <button key={ds} onClick={() => setSelectedDate(ds)} className={`flex flex-col items-center p-3 md:p-4 rounded-2xl transition-all border ${sel ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest mb-1">{day.toLocaleDateString('nl-NL', { weekday: 'short' })}</span>
              <span className="text-xl font-bold">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeTasks.length > 0 ? (
          activeTasks.map(task => (
            <div key={task.id} onClick={() => onToggle(task.id, selectedDate)} className={`group cursor-pointer p-6 rounded-3xl border transition-all flex items-center gap-6 ${isCompleted(task.id, selectedDate) ? 'bg-emerald-50/50 border-emerald-100 opacity-70' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCompleted(task.id, selectedDate) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {isCompleted(task.id, selectedDate) ? <ICONS.Check className="w-6 h-6" /> : <div className="w-3 h-3 border-2 border-current rounded-full" />}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${isCompleted(task.id, selectedDate) ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</h3>
                <p className={`text-sm ${isCompleted(task.id, selectedDate) ? 'text-slate-300' : 'text-slate-500'}`}>{task.description}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[2rem] p-16 text-center border-2 border-dashed border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">Geen taken vandaag! 🥳</h3>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{
  tasks: Task[],
  users: User[],
  onAddTask: (t: Omit<Task, 'id' | 'createdAt'>) => void,
  onUpdateTask: (t: Task) => void,
  onDeleteTask: (id: string) => void,
  onAddUser: () => void,
  onUpdateUser: () => void,
  onDeleteUser: () => void,
}> = ({ tasks, users, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<{title: string, description: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', assignedTo: '3', frequency: TaskFrequency.DAILY, startDate: formatDateISO(new Date()), scheduledTime: ''
  });

  const handleAiSuggest = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    const suggestions = await geminiService.suggestTasks(aiPrompt);
    setAiSuggestions(suggestions);
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) onUpdateTask({ ...editingTask, ...formData });
    else onAddTask(formData);
    setIsAdding(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', assignedTo: '3', frequency: TaskFrequency.DAILY, startDate: formatDateISO(new Date()), scheduledTime: '' });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Beheerpanel</h2>
          <p className="text-slate-500 mt-1">Beheer gezinsprojecten en taken.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg hover:bg-indigo-700 transition-all">
          <ICONS.Plus className="w-5 h-5" /> Nieuwe Taak
        </button>
      </div>

      <div className="bg-indigo-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><ICONS.Sparkles className="w-6 h-6 text-indigo-300" /> AI Task Assistant</h3>
        <div className="flex gap-2">
          <input type="text" placeholder="Bijv: 'Lenteschoonmaak'" className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
          <button onClick={handleAiSuggest} disabled={isGenerating} className="bg-white text-indigo-900 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all disabled:opacity-50">{isGenerating ? 'Denken...' : 'Genereer'}</button>
        </div>
        {aiSuggestions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="bg-white/10 border border-white/10 p-4 rounded-xl">
                <h4 className="font-bold text-xs mb-1">{s.title}</h4>
                <button onClick={() => { setFormData({ ...formData, title: s.title, description: s.description }); setIsAdding(true); }} className="text-[10px] font-bold text-indigo-300 uppercase mt-2">Gebruik</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Taak</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Ritme</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map(task => (
              <tr key={task.id} className="hover:bg-slate-50/50 transition-all">
                <td className="px-8 py-6">
                  <p className="font-bold text-slate-800">{task.title}</p>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase">{task.frequency}</span>
                </td>
                <td className="px-8 py-6">
                  <button onClick={() => onDeleteTask(task.id)} className="p-2 text-red-400 hover:text-red-600 transition-all"><ICONS.Trash className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(isAdding || editingTask) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-800">Taak Toevoegen</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ICONS.XMark className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="text" className="w-full px-5 py-3 rounded-xl border border-slate-200" placeholder="Titel" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <textarea className="w-full px-5 py-3 rounded-xl border border-slate-200" placeholder="Beschrijving" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <select className="w-full px-5 py-3 rounded-xl border border-slate-200" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as TaskFrequency})}>
                {Object.values(TaskFrequency).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Opslaan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const FamilyOverview: React.FC<{ 
  tasks: Task[], 
  users: User[], 
  completions: TaskCompletion[], 
  selectedDate: string,
  navigateWeeks: (w: number) => void
}> = ({ tasks, users, completions, selectedDate, navigateWeeks }) => {
  const weekDays = useMemo(() => getDaysOfWeek(new Date(selectedDate)), [selectedDate]);
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Gezinsoverzicht</h2>
      </div>
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Dag</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {weekDays.map(day => {
              const ds = formatDateISO(day);
              const dayTasks = tasks.filter(t => isTaskVisibleOnDate(t, ds));
              return (
                <tr key={ds} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6 font-bold text-slate-600">
                    {day.toLocaleDateString('nl-NL', { weekday: 'long' })} {day.getDate()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-2">
                      {dayTasks.map(t => (
                        <span key={t.id} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${completions.some(c => c.taskId === t.id && c.completedAt === ds) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          {t.title}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(formatDateISO(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [quote, setQuote] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      console.log("App start...");
      const timeout = setTimeout(() => {
        console.warn("Cloud timeout: forceer laden.");
        setIsLoading(false);
      }, 4000);

      try {
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (profiles) {
          const mappedUsers: User[] = profiles.map(p => ({
            id: p.id, name: p.name, email: p.email, avatar: p.avatar, role: p.role as UserRole, password: p.password
          }));
          setUsers([...mappedUsers, ...INITIAL_USERS]);
        }

        const { data: dbTasks } = await supabase.from('tasks').select('*');
        if (dbTasks) {
          setTasks(dbTasks.map(t => ({
            id: t.id, title: t.title, description: t.description, assignedTo: t.assigned_to, frequency: t.frequency as TaskFrequency, createdAt: t.created_at, startDate: t.start_date, scheduledTime: t.scheduled_time
          })));
        }

        const { data: dbCompletions } = await supabase.from('completions').select('*');
        if (dbCompletions) {
          setCompletions(dbCompletions.map(c => ({
            id: c.id, taskId: c.task_id, completedAt: c.completed_at, userId: c.user_id
          })));
        }
      } catch (err) {
        console.error("Supabase Error:", err);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };

    fetchData();
    geminiService.getProductivityQuote().then(setQuote);
    
    const saved = localStorage.getItem('session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleLogin = (email: string, pass: string) => {
    const user = users.find(u => u.email === email && u.password === pass);
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

  const addTask = async (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const task: Task = { ...newTask, id, createdAt: new Date().toISOString() };
    setTasks(prev => [task, ...prev]);
    await supabase.from('tasks').insert([{
      id: task.id, title: task.title, description: task.description, assigned_to: task.assignedTo, frequency: task.frequency, start_date: task.startDate, scheduled_time: task.scheduledTime
    }]);
  };

  const removeTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const toggleTask = async (taskId: string, date: string) => {
    if (!currentUser) return;
    const existing = completions.find(c => c.taskId === taskId && c.completedAt === date);
    if (existing) {
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
      await supabase.from('completions').delete().eq('id', existing.id);
    } else {
      const completion: TaskCompletion = {
        id: Math.random().toString(36).substr(2, 9),
        taskId, completedAt: date, userId: currentUser.id
      };
      setCompletions(prev => [...prev, completion]);
      await supabase.from('completions').insert([{
        id: completion.id, task_id: completion.taskId, completed_at: completion.completedAt, user_id: completion.userId
      }]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold">Laden...</p>
      </div>
    );
  }

  if (!currentUser) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      <nav className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">T</div>
          <h1 className="text-xl font-bold text-slate-800