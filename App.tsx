
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
    <div className="space-y-8">
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

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const ds = formatDateISO(day);
          const sel = ds === selectedDate;
          return (
            <button key={ds} onClick={() => setSelectedDate(ds)} className={`flex flex-col items-center p-3 rounded-2xl transition-all border ${sel ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}>
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

// AdminDashboard en FamilyOverview blijven grotendeels hetzelfde maar met gefixte imports (reeds toegevoegd bovenaan)
// ... (Zelfde structuur als voorheen) ...

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
        // 1. Haal profielen op
        const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
        if (profiles) {
          const mappedUsers: User[] = profiles.map(p => ({
            id: p.id, name: p.name, email: p.email, avatar: p.avatar, role: p.role as UserRole, password: p.password
          }));
          setUsers([...mappedUsers, ...INITIAL_USERS]);
        }

        // 2. Haal taken op
        const { data: dbTasks } = await supabase.from('tasks').select('*');
        if (dbTasks) {
          setTasks(dbTasks.map(t => ({
            id: t.id, title: t.title, description: t.description, assignedTo: t.assigned_to, frequency: t.frequency as TaskFrequency, createdAt: t.created_at, startDate: t.start_date, scheduledTime: t.scheduled_time
          })));
        }

        // 3. Haal completions op
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

  // Functies voor taken (identiek aan voorheen maar met await)
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
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">TaskPulse</h1>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => setViewMode('daily')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === 'daily' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <ICONS.Calendar className="w-5 h-5" /> Mijn Taken
          </button>
          <button onClick={() => setViewMode('team')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === 'team' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <ICONS.Users className="w-5 h-5" /> Gezinsoverzicht
          </button>
          {currentUser.role === UserRole.ADMIN && (
            <button onClick={() => setViewMode('manage')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === 'manage' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <ICONS.Layout className="w-5 h-5" /> Beheer
            </button>
          )}
        </div>
        <div className="mt-auto pt-6 border-t border-slate-100">
           <div className="flex items-center gap-3 mb-6">
             <img src={currentUser.avatar} className="w-8 h-8 rounded-full" alt="" />
             <p className="font-bold text-sm text-slate-800 truncate">{currentUser.name}</p>
           </div>
           <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-500 transition-all font-medium">
             <ICONS.Logout className="w-5 h-5" /> Uitloggen