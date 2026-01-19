
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskCompletion, User, UserRole, TaskFrequency, ViewMode } from './types';
import { ICONS, COLORS } from './constants';
import { formatDateISO, getDaysOfWeek, isTaskVisibleOnDate } from './utils/dateUtils';
import { geminiService } from './services/geminiService';
import { supabase } from './services/supabaseClient';

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
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl p-10 border border-slate-100 animate-in fade-in zoom-in duration-500">
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
        <p className="mt-6 text-[10px] text-center text-slate-400 font-medium">Log in met de gegevens die je in de SQL editor hebt ingevoerd.</p>
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
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCompleted(task.id, selectedDate) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
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
            <p className="text-slate-500 mt-2">Geniet van je vrije tijd of bekijk een andere dag.</p>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Beheerpanel</h2>
          <p className="text-slate-500 mt-1">Beheer gezinsprojecten en taken.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          <ICONS.Plus className="w-5 h-5" /> Nieuwe Taak
        </button>
      </div>

      <div className="bg-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-3 flex items-center gap-3"><ICONS.Sparkles className="w-6 h-6 text-indigo-300" /> AI Task Assistant</h3>
          <p className="text-indigo-100 mb-6 max-w-md">Vertel me wat er moet gebeuren en ik help je met suggesties.</p>
          <div className="flex gap-2">
            <input type="text" placeholder="Bijv: 'Lenteschoonmaak' of 'Ochtendritueel'" className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition-all" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
            <button onClick={handleAiSuggest} disabled={isGenerating} className="bg-white text-indigo-900 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-all disabled:opacity-50">{isGenerating ? 'Denken...' : 'Genereer'}</button>
          </div>
          {aiSuggestions.length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {aiSuggestions.map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/10 p-5 rounded-2xl hover:bg-white/20 transition-all flex flex-col justify-between h-full">
                  <div>
                    <h4 className="font-bold text-sm mb-1">{s.title}</h4>
                    <p className="text-[10px] text-white/60 leading-relaxed">{s.description}</p>
                  </div>
                  <button onClick={() => { setFormData({ ...formData, title: s.title, description: s.description }); setIsAdding(true); }} className="mt-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1">Gebruik <ICONS.Plus className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(isAdding || editingTask) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-800">{editingTask ? 'Taak Aanpassen' : 'Nieuwe Taak'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingTask(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ICONS.XMark className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Titel</label>
                  <input type="text" className="w-full px-5 py-3 rounded-xl border border-slate-200" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Beschrijving</label>
                  <textarea className="w-full px-5 py-3 rounded-xl border border-slate-200 h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Toewijzen</label>
                  <select className="w-full px-5 py-3 rounded-xl border border-slate-200" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Herhaling</label>
                  <select className="w-full px-5 py-3 rounded-xl border border-slate-200" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as TaskFrequency})}>
                    {Object.values(TaskFrequency).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all">{editingTask ? 'Bijwerken' : 'Opslaan'}</button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Taak</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Gezinslid</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Ritme</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map(task => {
              const user = users.find(u => u.id === task.assignedTo);
              return (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.description}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {user && <img src={user.avatar} className="w-6 h-6 rounded-full" alt="" />}
                      <span className="text-sm font-medium text-slate-600">{user?.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase">{task.frequency}</span>
                  </td>
                  <td className="px-8 py-6 text-slate-400">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingTask(task); setFormData({ ...task, scheduledTime: task.scheduledTime || '' }); }} className="p-2 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><ICONS.Pencil className="w-5 h-5" /></button>
                      <button onClick={() => onDeleteTask(task.id)} className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><ICONS.Trash className="w-5 h-5" /></button>
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

const FamilyOverview: React.FC<{ 
  tasks: Task[], 
  users: User[], 
  completions: TaskCompletion[], 
  selectedDate: string,
  navigateWeeks: (w: number) => void
}> = ({ tasks, users, completions, selectedDate, navigateWeeks }) => {
  const weekDays = useMemo(() => getDaysOfWeek(new Date(selectedDate)), [selectedDate]);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Gezinsoverzicht</h2>
          <p className="text-slate-500 mt-1">Status van alle geplande taken voor deze week.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigateWeeks(-1)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 shadow-sm">
            {weekDays[0].getDate()} {weekDays[0].toLocaleDateString('nl-NL', { month: 'short' })} - {weekDays[6].getDate()} {weekDays[6].toLocaleDateString('nl-NL', { month: 'short' })}
          </div>
          <button onClick={() => navigateWeeks(1)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100 w-48">Dag</th>
                <th className="px-6 py-4 border-b border-slate-100">Gezamenlijke Planning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weekDays.map(day => {
                const dateStr = formatDateISO(day);
                const dayTasks = tasks.filter(t => isTaskVisibleOnDate(t, dateStr));
                
                return (
                  <tr key={dateStr} className="hover:bg-slate-50/30 group">
                    <td className="px-6 py-8 border-r border-slate-100 bg-white align-top">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-indigo-600 uppercase tracking-tight">{day.toLocaleDateString('nl-NL', { weekday: 'long' })}</span>
                        <span className="text-2xl font-bold text-slate-300">{day.getDate()} {day.toLocaleDateString('nl-NL', { month: 'short' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 align-top">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dayTasks.map(task => {
                          const user = users.find(u => u.id === task.assignedTo);
                          const isDone = completions.some(c => c.taskId === task.id && c.completedAt === dateStr);
                          return (
                            <div key={task.id + dateStr} className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${isDone ? 'bg-emerald-50/50 border-emerald-100 opacity-70' : 'bg-white border-slate-200 shadow-sm'}`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${isDone ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                  {isDone ? 'GEDAAN' : 'OPEN'}
                                </span>
                                {user && <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt={user.name} />}
                              </div>
                              <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</h4>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      
      // Veiligheidsmechanisme: als het langer dan 5 seconden duurt, toon dan in ieder geval de login
      const timeout = setTimeout(() => {
        setIsLoading(false);
        setFetchError("Connectie duurt lang, probeer alvast in te loggen.");
      }, 5000);

      try {
        console.log("Start laden gegevens uit Supabase...");
        
        // 1. Haal profielen op
        const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
        if (pError) console.error("Fout bij profielen:", pError);
        if (profiles) {
          const mappedUsers: User[] = profiles.map(p => ({
            id: p.id, name: p.name, email: p.email, avatar: p.avatar, role: p.role as UserRole, password: p.password
          }));
          setUsers([...mappedUsers, ...INITIAL_USERS]);
          console.log("Profielen geladen:", mappedUsers.length);
        }

        // 2. Haal taken op
        const { data: dbTasks, error: tError } = await supabase.from('tasks').select('*');
        if (tError) console.error("Fout bij taken:", tError);
        if (dbTasks) {
          setTasks(dbTasks.map(t => ({
            id: t.id, title: t.title, description: t.description, assignedTo: t.assigned_to, frequency: t.frequency as TaskFrequency, createdAt: t.created_at, startDate: t.start_date, scheduledTime: t.scheduled_time
          })));
          console.log("Taken geladen:", dbTasks.length);
        }

        // 3. Haal voltooide taken op
        const { data: dbCompletions, error: cError } = await supabase.from('completions').select('*');
        if (cError) console.error("Fout bij completions:", cError);
        if (dbCompletions) {
          setCompletions(dbCompletions.map(c => ({
            id: c.id, taskId: c.task_id, completedAt: c.completed_at, userId: c.user_id
          })));
          console.log("Completions geladen:", dbCompletions.length);
        }
      } catch (err) {
        console.error("Kritieke fout bij laden data:", err);
        setFetchError("Kon geen verbinding maken met de database.");
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };

    fetchData();
    geminiService.getProductivityQuote().then(setQuote);
    
    try {
      const savedSession = localStorage.getItem('session');
      if (savedSession) setCurrentUser(JSON.parse(savedSession));
    } catch(e) {
      console.warn("Ongeldige sessie in localStorage");
    }
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

  const updateTask = async (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    await supabase.from('tasks').update({
      title: updatedTask.title, description: updatedTask.description, assigned_to: updatedTask.assignedTo, frequency: updatedTask.frequency, start_date: updatedTask.startDate, scheduled_time: updatedTask.scheduledTime
    }).eq('id', updatedTask.id);
  };

  const removeTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
    await supabase.from('completions').delete().eq('task_id', id);
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

  const isCompleted = (taskId: string, date: string) => {
    return completions.some(c => c.taskId === taskId && c.completedAt === date);
  };

  const navigateWeeks = (weeks: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (weeks * 7));
    setSelectedDate(formatDateISO(date));
  };

  const filteredTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === '3');
  }, [tasks, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <p className="text-slate-800 font-bold">Gegevens ophalen...</p>
            <p className="text-slate-500 text-sm mt-1 italic">Zorg dat RLS uitstaat in je Supabase Dashboard.</p>
          </div>
          {fetchError && <p className="text-amber-600 text-xs font-medium mt-4 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">{fetchError}</p>}
        </div>
      </div>
    );
  }

  if (!currentUser) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 flex items-center gap-3">
            <ICONS.Sparkles className="w-5 h-5 text-indigo-200" />
            <p className="font-bold text-sm">{n.message}</p>
          </div>
        ))}
      </div>

      <nav className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">T</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">TaskPulse</h1>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hoofdmenu</p>
          <button onClick={() => setViewMode('daily')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === 'daily' || viewMode === 'weekly' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <ICONS.Calendar className="w-5 h-5" /> Mijn Taken
          </button>
          <button onClick={() => setViewMode('team')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === 'team' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <ICONS.Users className="w-5 h-5" /> Gezinsoverzicht
          </button>
          {currentUser.role === UserRole.ADMIN && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Beheer</p>
              <button onClick={() => setViewMode('manage')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === 'manage' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                <ICONS.Layout className="w-5 h-5" /> Configuratie
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-auto">
          {quote && (
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-6 italic text-[11px] text-indigo-700 leading-relaxed font-medium">
              "{quote}"
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 mb-4 border border-slate-100">
             <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt={currentUser.name} />
             <div className="overflow-hidden">
               <p className="font-bold text-sm leading-tight truncate text-slate-800">{currentUser.name}</p>
               <p className="text-[10px] opacity-70 uppercase font-bold text-indigo-600">{currentUser.role === UserRole.ADMIN ? 'Admin' : 'Gezinslid'}</p>
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all font-medium group">
            <ICONS.Logout className="w-5 h-5 group-hover:scale-110 transition-transform" /> Uitloggen
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {viewMode === 'team' ? (
            <FamilyOverview tasks={tasks} users={users} completions={completions} selectedDate={selectedDate} navigateWeeks={navigateWeeks} />
          ) : viewMode === 'manage' && currentUser.role === UserRole.ADMIN ? (
            <AdminDashboard tasks={tasks} users={users} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={removeTask} onAddUser={() => {}} onUpdateUser={() => {}} onDeleteUser={() => {}} />
          ) : (
            <UserView tasks={filteredTasks} selectedDate={selectedDate} setSelectedDate={setSelectedDate} viewMode={viewMode === 'manage' ? 'daily' : viewMode as ViewMode} setViewMode={(m) => setViewMode(m as ViewMode)} onToggle={toggleTask} isCompleted={isCompleted} currentUser={currentUser} navigateWeeks={navigateWeeks} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
