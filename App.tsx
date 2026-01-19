
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskCompletion, User, UserRole, TaskFrequency, ViewMode } from './types';
import { ICONS, COLORS } from './constants';
import { formatDateISO, getDaysOfWeek, isTaskVisibleOnDate } from './utils/dateUtils';
import { geminiService } from './services/geminiService';

// Initial Users
const INITIAL_USERS: User[] = [
  { id: 'admin-louis', name: 'Louis', email: 'louis.chauvet11.111@gmail.com', avatar: 'https://picsum.photos/seed/louis/100', role: UserRole.ADMIN, password: '#Septembre5' },
  { id: '1', name: 'Papa', email: 'papa@taskpulse.com', avatar: 'https://picsum.photos/seed/papa/100', role: UserRole.ADMIN, password: 'admin' },
  { id: '2', name: 'Sophie', email: 'sophie@taskpulse.com', avatar: 'https://picsum.photos/seed/sophie/100', role: UserRole.CHILD, password: '123' },
  { id: '3', name: 'Iedereen', email: 'iedereen@taskpulse.com', avatar: 'https://picsum.photos/seed/team/100', role: UserRole.CHILD },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(formatDateISO(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [quote, setQuote] = useState<string>('');
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  
  // Notification Permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // background notification checker
  useEffect(() => {
    const checkUpcomingTasks = () => {
      if (!currentUser) return;
      
      const now = new Date();
      const todayStr = formatDateISO(now);
      const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:mm"
      
      const userTasks = tasks.filter(t => (t.assignedTo === currentUser.id || t.assignedTo === '3') && isTaskVisibleOnDate(t, todayStr));
      
      userTasks.forEach(task => {
        if (!task.scheduledTime) return;
        
        const [taskH, taskM] = task.scheduledTime.split(':').map(Number);
        const taskDate = new Date(now);
        taskDate.setHours(taskH, taskM, 0, 0);
        
        const diffMs = taskDate.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);
        
        // Exactly 10 minutes before
        if (diffMins === 10) {
          const msg = `Herinnering: "${task.title}" begint over 10 minuten!`;
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("TaskPulse Herinnering", { body: msg });
          }
          
          const id = Math.random().toString(36).substr(2, 9);
          setNotifications(prev => [...prev, { id, message: msg }]);
          setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 10000);
        }
      });
    };

    const interval = setInterval(checkUpcomingTasks, 60000);
    return () => clearInterval(interval);
  }, [tasks, currentUser]);

  // Persistence
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    const savedCompletions = localStorage.getItem('completions');
    const savedUsers = localStorage.getItem('users');
    const savedSession = localStorage.getItem('session');
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedCompletions) setCompletions(JSON.parse(savedCompletions));
    
    if (savedUsers) {
      const parsedSaved = JSON.parse(savedUsers) as User[];
      const merged = [...INITIAL_USERS];
      parsedSaved.forEach(u => {
        if (!merged.find(m => m.id === u.id || m.email === u.email)) {
          merged.push(u);
        }
      });
      setUsers(merged);
    } else {
      setUsers(INITIAL_USERS);
    }

    if (savedSession) {
      const sessionUser = JSON.parse(savedSession);
      setCurrentUser(sessionUser);
      setViewMode(sessionUser.role === UserRole.ADMIN ? 'manage' : 'daily');
    }
    
    geminiService.getProductivityQuote().then(setQuote);
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('completions', JSON.stringify(completions));
    localStorage.setItem('users', JSON.stringify(users));
    if (currentUser) {
      localStorage.setItem('session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('session');
    }
  }, [tasks, completions, users, currentUser]);

  const handleLogin = (email: string, pass: string) => {
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      setCurrentUser(user);
      setViewMode(user.role === UserRole.ADMIN ? 'manage' : 'daily');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const addTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [task, ...prev]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setCompletions(prev => prev.filter(c => c.taskId !== id));
  };

  const addUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: userData.name || 'Nieuw Lid',
      email: userData.email || '',
      avatar: userData.avatar || `https://picsum.photos/seed/${Math.random()}/100`,
      role: userData.role || UserRole.CHILD,
      password: userData.password || '123'
    };
    setUsers(prev => {
      const everyone = prev.find(u => u.id === '3')!;
      const others = prev.filter(u => u.id !== '3');
      return [...others, newUser, everyone];
    });
  };

  const updateUser = (userData: User) => {
    setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
    if (currentUser?.id === userData.id) {
      setCurrentUser(userData);
    }
  };

  const removeUser = (id: string) => {
    if (id === '3') return; 
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUser?.id === id) {
      setCurrentUser(null);
    }
  };

  const toggleTask = (taskId: string, date: string) => {
    if (!currentUser) return;
    const existing = completions.find(c => c.taskId === taskId && c.completedAt === date);
    if (existing) {
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
    } else {
      const completion: TaskCompletion = {
        id: Math.random().toString(36).substr(2, 9),
        taskId,
        completedAt: date,
        userId: currentUser.id
      };
      setCompletions(prev => [...prev, completion]);
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

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Notifications overlay */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 flex items-center gap-3">
            <ICONS.Sparkles className="w-5 h-5 text-indigo-200" />
            <p className="font-bold text-sm">{n.message}</p>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
            T
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">TaskPulse</h1>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hoofdmenu</p>
          
          <button 
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === 'daily' || viewMode === 'weekly' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ICONS.Calendar className="w-5 h-5" />
            Mijn Taken
          </button>

          <button 
            onClick={() => setViewMode('team')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === 'team' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ICONS.Users className="w-5 h-5" />
            Gezinsoverzicht
          </button>

          {currentUser.role === UserRole.ADMIN && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Beheer</p>
              <button 
                onClick={() => setViewMode('manage')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === 'manage' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <ICONS.Layout className="w-5 h-5" />
                Configuratie
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 mb-4 border border-slate-100">
             <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt={currentUser.name} />
             <div className="overflow-hidden">
               <p className="font-bold text-sm leading-tight truncate text-slate-800">{currentUser.name}</p>
               <p className="text-[10px] opacity-70 uppercase font-bold tracking-tighter text-indigo-600">{currentUser.role === UserRole.ADMIN ? 'Administrator' : 'Gezinslid'}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all font-medium group"
          >
            <ICONS.Logout className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Uitloggen
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl shadow-inner mt-4 border border-slate-100/50">
          <p className="text-[11px] text-slate-500 italic leading-relaxed">"{quote}"</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {viewMode === 'team' ? (
            <FamilyOverview tasks={tasks} users={users} completions={completions} selectedDate={selectedDate} navigateWeeks={navigateWeeks} />
          ) : viewMode === 'manage' && currentUser.role === UserRole.ADMIN ? (
            <AdminDashboard 
              tasks={tasks} 
              users={users}
              onAddTask={addTask} 
              onUpdateTask={updateTask}
              onDeleteTask={removeTask}
              onAddUser={addUser}
              onUpdateUser={updateUser}
              onDeleteUser={removeUser}
            />
          ) : (
            <UserView 
              tasks={filteredTasks} 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              viewMode={viewMode === 'manage' ? 'daily' : viewMode as ViewMode}
              setViewMode={(m) => setViewMode(m as ViewMode)}
              onToggle={toggleTask}
              isCompleted={isCompleted}
              currentUser={currentUser}
              navigateWeeks={navigateWeeks}
            />
          )}
        </div>
      </main>
    </div>
  );
};

/* --- Collective View --- */

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
          <p className="text-slate-500 mt-1">Een overzicht van alle taken voor het hele gezin deze week.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigateWeeks(-1)}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 shadow-sm">
            {weekDays[0].getDate()} {weekDays[0].toLocaleDateString('nl-NL', { month: 'short' })} - {weekDays[6].getDate()} {weekDays[6].toLocaleDateString('nl-NL', { month: 'short' })}
          </div>
          <button 
            onClick={() => navigateWeeks(1)}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100 sticky left-0 bg-slate-50 z-10 w-48 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">Dag</th>
                <th className="px-6 py-4 border-b border-slate-100">Geplande Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weekDays.map(day => {
                const dateStr = formatDateISO(day);
                const dayTasks = tasks.filter(t => isTaskVisibleOnDate(t, dateStr));
                
                return (
                  <tr key={dateStr} className="hover:bg-slate-50/30 group">
                    <td className="px-6 py-8 border-r border-slate-100 sticky left-0 bg-white z-10 align-top shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-indigo-600 uppercase tracking-tight">{day.toLocaleDateString('nl-NL', { weekday: 'long' })}</span>
                        <span className="text-2xl font-bold text-slate-300 group-hover:text-slate-400 transition-colors">{day.getDate()} {day.toLocaleDateString('nl-NL', { month: 'short' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 align-top">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dayTasks.map(task => {
                          const user = users.find(u => u.id === task.assignedTo);
                          const isDone = completions.some(c => c.taskId === task.id && c.completedAt === dateStr);
                          return (
                            <div 
                              key={task.id + dateStr} 
                              className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 group/card ${isDone ? 'bg-emerald-50/50 border-emerald-100 opacity-70' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200'}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex gap-1 items-center">
                                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg tracking-wider ${isDone ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                    {isDone ? 'VOLTOOID' : 'OPENSTAAND'}
                                  </span>
                                  {task.scheduledTime && (
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                      {task.scheduledTime}
                                    </span>
                                  )}
                                </div>
                                {user && (
                                  <div className="relative group/avatar">
                                    <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt={user.name} />
                                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap z-20">
                                      {user.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className={`text-sm font-bold leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</h4>
                                <div className="flex items-center gap-1.5 mt-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                                  <p className="text-[11px] font-semibold text-slate-400">{user?.name || 'Iedereen'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {dayTasks.length === 0 && (
                          <div className="col-span-full py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-sm font-medium italic">Geen taken gepland voor deze dag.</p>
                          </div>
                        )}
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

/* --- Auth Components --- */

const LoginView: React.FC<{ onLogin: (e: string, p: string) => boolean }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(email, password)) {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ICONS.Sparkles className="w-32 h-32 text-white" />
          </div>
          <div className="inline-flex w-16 h-16 bg-white rounded-2xl items-center justify-center text-indigo-600 font-black text-3xl shadow-xl mb-4 relative z-10">
            T
          </div>
          <h1 className="text-2xl font-bold text-white relative z-10">Welkom bij TaskPulse</h1>
          <p className="text-indigo-100 text-sm mt-1 relative z-10">Log in om je taken te bekijken</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium text-center animate-bounce">
              Onjuiste email of wachtwoord
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Adres</label>
            <div className="relative">
              <ICONS.Envelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="naam@voorbeeld.nl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Wachtwoord</label>
            <input 
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            Inloggen
          </button>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
          Beheer je gezin of team met gemak.
        </div>
      </div>
    </div>
  );
};

/* --- Admin Components --- */

const AdminDashboard: React.FC<{ 
  tasks: Task[], 
  users: User[],
  onAddTask: (t: Omit<Task, 'id' | 'createdAt'>) => void,
  onUpdateTask: (t: Task) => void,
  onDeleteTask: (id: string) => void,
  onAddUser: (userData: Partial<User>) => void,
  onUpdateUser: (userData: User) => void,
  onDeleteUser: (id: string) => void
}> = ({ tasks, users, onAddTask, onUpdateTask, onDeleteTask, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'users'>('tasks');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiSuggest = async () => {
    const context = prompt("Waar wilt u taken voor genereren? (bijv. 'Keuken schoonmaken')");
    if (!context) return;
    
    setIsAiLoading(true);
    const suggested = await geminiService.suggestTasks(context);
    setIsAiLoading(false);

    suggested.forEach((s: any) => {
      onAddTask({
        title: s.title,
        description: s.description,
        assignedTo: '3',
        frequency: TaskFrequency.DAILY,
        startDate: formatDateISO(new Date())
      });
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Beheerder Dashboard</h2>
          <p className="text-slate-500 mt-1">Beheer alle taken, schema's en accounts van je gezin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Takenlijst
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Gezinsbeheer
            </button>
          </div>
          
          {activeTab === 'tasks' ? (
            <>
              <button 
                onClick={handleAiSuggest}
                disabled={isAiLoading}
                className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold border border-indigo-100 hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-50"
              >
                <ICONS.Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                AI Suggestie
              </button>
              <button 
                onClick={() => setIsAddingTask(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
              >
                <ICONS.Plus className="w-5 h-5" />
                Taak Toevoegen
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsAddingUser(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
            >
              <ICONS.UserPlus className="w-5 h-5" />
              Nieuw Lid
            </button>
          )}
        </div>
      </div>

      {(isAddingTask || editingTask) && (
        <TaskForm 
          task={editingTask || undefined}
          users={users}
          onClose={() => {
            setIsAddingTask(false);
            setEditingTask(null);
          }} 
          onSubmit={(data) => {
            if (editingTask) {
              onUpdateTask({ ...editingTask, ...data });
            } else {
              onAddTask(data);
            }
            setIsAddingTask(false);
            setEditingTask(null);
          }} 
        />
      )}

      {(isAddingUser || editingUser) && (
        <UserForm 
          user={editingUser || undefined}
          onClose={() => {
            setIsAddingUser(false);
            setEditingUser(null);
          }}
          onSubmit={(data) => {
            if (editingUser) {
              onUpdateUser({ ...editingUser, ...data } as User);
            } else {
              onAddUser(data);
            }
            setIsAddingUser(false);
            setEditingUser(null);
          }}
        />
      )}

      {activeTab === 'tasks' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-[0.1em] font-black">
              <tr>
                <th className="px-6 py-4">Omschrijving</th>
                <th className="px-6 py-4">Verantwoordelijke</th>
                <th className="px-6 py-4">Frequentie</th>
                <th className="px-6 py-4">Tijd</th>
                <th className="px-6 py-4 text-right">Beheer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-800 text-sm">{task.title}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[240px] mt-0.5">{task.description}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-tight bg-blue-50 text-blue-600 border border-blue-100">
                      {users.find(u => u.id === task.assignedTo)?.name || 'Onbekend'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-tight ${task.frequency === TaskFrequency.ONCE ? 'bg-slate-100 text-slate-600' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                      {task.frequency}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-400 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                    {task.scheduledTime || '--:--'}
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingTask(task)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <ICONS.Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteTask(task.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <ICONS.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <ICONS.Calendar className="w-12 h-12 text-slate-200" />
                       <p className="text-slate-400 font-medium italic">Geen taken gevonden.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-[0.1em] font-black">
              <tr>
                <th className="px-6 py-4">Profiel</th>
                <th className="px-6 py-4">Rechten</th>
                <th className="px-6 py-4 text-right">Beheer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.filter(u => u.id !== '3').map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 flex items-center gap-4">
                    <img src={user.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm object-cover" alt={user.name} />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-tight ${user.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <ICONS.Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteUser(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <ICONS.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const UserForm: React.FC<{ user?: User, onClose: () => void, onSubmit: (data: Partial<User>) => void }> = ({ user, onClose, onSubmit }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [password, setPassword] = useState(user?.password || '');
  const [role, setRole] = useState<UserRole>(user?.role || UserRole.CHILD);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-8 pb-0 flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{user ? 'Profiel Aanpassen' : 'Nieuw Lid'}</h3>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <ICONS.XMark className="w-6 h-6" />
            </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ name, email, avatar, password, role });
        }} className="p-8 space-y-6">
          
          <div className="flex flex-col items-center gap-3">
             <div className="w-24 h-24 rounded-3xl border-4 border-indigo-50 overflow-hidden shadow-xl">
               <img src={avatar || 'https://picsum.photos/seed/placeholder/100'} className="w-full h-full object-cover" alt="Preview" />
             </div>
             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Live Voorbeeld</p>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Naam</label>
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Bijv. Mark" className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="naam@taskpulse.nl" className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Avatar URL</label>
              <input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Rol</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 appearance-none">
                <option value={UserRole.CHILD}>Gezinslid</option>
                <option value={UserRole.ADMIN}>Beheerder (Ouder)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Wachtwoord</label>
              <input type="text" required={!user} value={password} onChange={e => setPassword(e.target.value)} placeholder="Kies een veilig wachtwoord" className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800" />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors">Annuleren</button>
            <button type="submit" className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95">{user ? 'Opslaan' : 'Aanmaken'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskForm: React.FC<{ task?: Task, users: User[], onClose: () => void, onSubmit: (data: Omit<Task, 'id' | 'createdAt'>) => void }> = ({ task, users, onClose, onSubmit }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || '3');
  const [frequency, setFrequency] = useState<TaskFrequency>(task?.frequency || TaskFrequency.ONCE);
  const [startDate, setStartDate] = useState(task?.startDate || formatDateISO(new Date()));
  const [scheduledTime, setScheduledTime] = useState(task?.scheduledTime || '');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-8 pb-0 flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{task ? 'Taak Aanpassen' : 'Nieuwe Taak'}</h3>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><ICONS.XMark className="w-6 h-6" /></button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ title, description, assignedTo, frequency, startDate, scheduledTime });
        }} className="p-8 space-y-6">
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Titel</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Bijv. Tafel dekken" className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Verantwoordelijke</label>
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 appearance-none">
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Frequentie</label>
                <select value={frequency} onChange={e => setFrequency(e.target.value as TaskFrequency)} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 appearance-none">
                  {Object.values(TaskFrequency).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Startdatum</label>
                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Tijdstip</label>
                <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Toelichting</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Extra informatie..." className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 resize-none h-20 font-medium text-slate-800" />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100">Annuleren</button>
            <button type="submit" className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100">{task ? 'Bijwerken' : 'Opslaan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- User Components --- */

const UserView: React.FC<{
  tasks: Task[],
  selectedDate: string,
  setSelectedDate: (d: string) => void,
  viewMode: ViewMode,
  setViewMode: (v: ViewMode) => void,
  onToggle: (taskId: string, date: string) => void,
  isCompleted: (taskId: string, date: string) => boolean,
  currentUser: User,
  navigateWeeks: (w: number) => void
}> = ({ tasks, selectedDate, setSelectedDate, viewMode, setViewMode, onToggle, isCompleted, currentUser, navigateWeeks }) => {
  
  const weekDays = useMemo(() => getDaysOfWeek(new Date(selectedDate)), [selectedDate]);
  
  const currentViewTasks = useMemo(() => {
    if (viewMode === 'daily') {
      return tasks.filter(t => isTaskVisibleOnDate(t, selectedDate));
    } else {
      // Return instances for each day of the week
      return weekDays.flatMap(day => {
        const dStr = formatDateISO(day);
        return tasks.filter(t => isTaskVisibleOnDate(t, dStr)).map(t => ({...t, instanceDate: dStr}));
      });
    }
  }, [tasks, selectedDate, viewMode, weekDays]);

  const completionRate = useMemo(() => {
    if (currentViewTasks.length === 0) return 0;
    
    if (viewMode === 'daily') {
      const done = currentViewTasks.filter(t => isCompleted(t.id, selectedDate)).length;
      return Math.round((done / currentViewTasks.length) * 100);
    } else {
      const totalInstances = currentViewTasks.length;
      const doneInstances = (currentViewTasks as any[]).filter(t => isCompleted(t.id, t.instanceDate)).length;
      return Math.round((doneInstances / totalInstances) * 100);
    }
  }, [currentViewTasks, selectedDate, isCompleted, viewMode]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Mijn Schema</h2>
          <p className="text-slate-500 mt-1 font-medium italic">Fijn dat je er weer bent, {currentUser.name}! 👋</p>
        </div>
        
        <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-slate-200 w-fit shadow-sm">
          <button 
            onClick={() => setViewMode('daily')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'daily' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Vandaag
          </button>
          <button 
            onClick={() => setViewMode('weekly')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'weekly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Deze Week
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => navigateWeeks(-1)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              Vorige Week
            </button>
            <button onClick={() => navigateWeeks(1)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
              Volgende Week
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>

          {viewMode === 'daily' ? (
            <div className="space-y-8">
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
                {weekDays.map(day => {
                  const dateStr = formatDateISO(day);
                  const isSelected = selectedDate === dateStr;
                  const dayTasksCount = tasks.filter(t => isTaskVisibleOnDate(t, dateStr)).length;
                  return (
                    <button 
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex flex-col items-center min-w-[85px] py-5 px-3 rounded-[1.75rem] border-2 transition-all relative ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-200 -translate-y-1' : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-100 hover:bg-indigo-50/30'}`}
                    >
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">{day.toLocaleDateString('nl-NL', { weekday: 'short' })}</span>
                      <span className="text-2xl font-black">{day.getDate()}</span>
                      {dayTasksCount > 0 && !isSelected && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-5">
                {(currentViewTasks as Task[]).map(task => {
                  const done = isCompleted(task.id, selectedDate);
                  return (
                    <div 
                      key={task.id}
                      onClick={() => onToggle(task.id, selectedDate)}
                      className={`group flex items-center gap-6 p-6 rounded-3xl bg-white border-2 transition-all cursor-pointer hover:shadow-xl ${done ? 'border-emerald-100 bg-emerald-50/20' : 'border-transparent shadow-md hover:border-indigo-100'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl border-4 flex items-center justify-center transition-all ${done ? 'bg-emerald-500 border-emerald-100 rotate-12 scale-110' : 'bg-slate-50 border-slate-50 group-hover:bg-white group-hover:border-indigo-50 group-hover:scale-105'}`}>
                        {done ? <ICONS.Check className="w-7 h-7 text-white" /> : <div className="w-3 h-3 rounded-full bg-slate-200 group-hover:bg-indigo-200" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className={`text-lg font-black tracking-tight transition-all ${done ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{task.title}</h4>
                          {task.scheduledTime && <span className="text-[11px] font-black text-indigo-400 bg-indigo-50 px-2 py-1 rounded-lg uppercase">{task.scheduledTime}</span>}
                        </div>
                        <p className={`text-xs mt-1 font-medium ${done ? 'text-slate-300' : 'text-slate-400'}`}>{task.description || 'Geen omschrijving.'}</p>
                      </div>
                    </div>
                  );
                })}
                {currentViewTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-50">
                    <p className="text-slate-400 font-medium italic">Geen taken voor deze dag.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-5">
              {weekDays.map(day => {
                const dateStr = formatDateISO(day);
                const dayTasks = tasks.filter(t => isTaskVisibleOnDate(t, dateStr));
                const isSelected = selectedDate === dateStr;
                return (
                  <div key={dateStr} className="flex flex-col gap-3">
                    <div onClick={() => setSelectedDate(dateStr)} className={`text-center py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer transition-all ${isSelected ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:text-slate-500'}`}>{day.toLocaleDateString('nl-NL', { weekday: 'short' })}</div>
                    <div className={`flex flex-col gap-3 min-h-[300px] p-3 bg-white rounded-3xl border-2 ${isSelected ? 'border-indigo-100 shadow-xl' : 'border-slate-50'}`}>
                      {dayTasks.map(t => {
                        const done = isCompleted(t.id, dateStr);
                        return (
                          <div key={t.id} onClick={() => onToggle(t.id, dateStr)} className={`p-3 rounded-2xl text-[11px] font-bold cursor-pointer transition-all ${done ? 'bg-emerald-50 text-emerald-600 opacity-60 line-through' : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 shadow-sm'}`}>
                            {t.scheduledTime && <span className="block text-[9px] text-indigo-300 mb-0.5">{t.scheduledTime}</span>}
                            {t.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/20 border border-slate-50 flex flex-col items-center text-center">
            <div className="relative w-40 h-40 mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-50" />
                <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={452.4} strokeDashoffset={452.4 - (452.4 * completionRate) / 100} strokeLinecap="round" className="text-indigo-600 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">{completionRate}%</span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Gereed</span>
              </div>
            </div>
            <h3 className="font-black text-slate-800 tracking-tight text-lg leading-tight">{viewMode === 'daily' ? 'Vandaag' : 'Deze Week'}</h3>
            <p className="text-sm text-slate-400 mt-2 font-medium">Blijf doorgaan!</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <h3 className="font-black mb-4 flex items-center gap-3 tracking-tight">Focus Tip</h3>
            <p className="text-sm font-medium leading-relaxed text-indigo-50">"Focus op progressie, niet op perfectie."</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
