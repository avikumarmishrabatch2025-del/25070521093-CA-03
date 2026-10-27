import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Bot,
  Calculator, CalendarDays, ChartNoAxesCombined, Check, ChevronRight, CreditCard,
  Download, FileText, LayoutDashboard, LoaderCircle, LogOut, Menu, PiggyBank,
  Plus, Printer, Search, Send, Settings, ShieldCheck, Sparkles, Target, Trash2,
  TrendingUp, Wallet, X
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import api from './api';
import AmbientBackground from './components/AmbientBackground';
import FinanceScene from './components/FinanceScene';
import { createDemoData, demoUser } from './data/demo';

const money = value => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2
}).format(Number(value || 0));
const monthNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const dateLabel = value => value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const COLORS = ['#6aa9ff', '#8cc8ff', '#f2b86b', '#ff8f7d', '#a5b4fc', '#7dd3fc'];
const navGroups = [
  { label: 'Workspace', items: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'budgets', label: 'Budgets', icon: ChartNoAxesCombined },
    { id: 'goals', label: 'Savings goals', icon: Target }
  ] },
  { label: 'Intelligence', items: [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'advisor', label: 'AI Advisor', icon: Bot }
  ] },
  { label: 'Discover', items: [
    { id: 'tools', label: 'Money tools', icon: Calculator },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings }
  ] }
];
const nav = navGroups.flatMap(group => group.items);
const validPages = new Set(nav.map(item => item.id));
const initialPage = () => {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return validPages.has(hash) ? hash : 'overview';
};
const recalculate = current => {
  const income = current.transactions.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = current.transactions.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  return { ...current, totals: { income, expenses, balance: income - expenses } };
};
const downloadFile = (content, filename, type = 'text/csv;charset=utf-8') => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
};
const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const transactionsCSV = rows => [
  ['Title', 'Type', 'Category', 'Date', 'Amount', 'Note'].map(csvCell).join(','),
  ...rows.map(item => [item.title, item.type, item.category, String(item.date).slice(0, 10), item.amount, item.note].map(csvCell).join(','))
].join('\n');

function Brand({ onClick }) {
  const content = <><span className="brand-mark"><Activity size={20}/></span><span>25070521093<span className="brand-ai"> CA3</span></span></>;
  return onClick
    ? <button className="brand" onClick={onClick} aria-label="Go to overview">{content}</button>
    : <div className="brand">{content}</div>;
}

function AuthScreen({ onAuth, onDemo }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem('finpilot_token', data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.response?.data?.message || (err.code === 'ERR_NETWORK'
        ? 'Cannot reach the API. Start the server and check your MongoDB connection.'
        : 'Could not sign in. Please try again.'));
    } finally { setBusy(false); }
  }
  return <main className="auth-shell">
    <AmbientBackground/>
    <section className="auth-art">
      <div className="auth-topline"><Brand/><span className="status-label"><i/> PERSONAL FINANCE, REIMAGINED</span></div>
      <div className="auth-copy">
        <span className="section-label">YOUR MONEY, IN FOCUS</span>
        <h1>Make every<br/>money move<br/><em>meaningful.</em></h1>
        <p>One clear view of your finances. Build smarter habits, track intentional goals, and plan what comes next.</p>
      </div>
      <FinanceScene motion />
      <div className="auth-foot"><ShieldCheck size={16}/><span>Your records stay private to your account.</span><span className="mono">NO BANK CONNECTION</span></div>
    </section>
    <section className="auth-form-wrap">
      <form className="auth-form" onSubmit={submit}>
        <div className="mobile-brand"><Brand/></div>
        <span className="section-label">WELCOME {mode === 'login' ? 'BACK' : 'ABOARD'}</span>
        <h2>{mode === 'login' ? 'Good to see you.' : 'Start with clarity.'}</h2>
        <p className="muted">Your personal finance workspace awaits.</p>
        {mode === 'register' && <label>Full name<input autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Your name" minLength="2" required/></label>}
        <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required/></label>
        <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" minLength="8" required/></label>
        {error && <div className="error-box" role="alert">{error}</div>}
        <button className="primary-btn full-btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowUpRight size={17}/></button>
        <button className="secondary-btn full-btn" type="button" onClick={onDemo}><Sparkles size={16}/> Explore interactive demo</button>
        <p className="auth-switch">{mode === 'login' ? 'New to FinPilot?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        <div className="auth-legal">Demo uses sample data and does not save changes. Real accounts use your existing MongoDB backend.</div>
      </form>
    </section>
  </main>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [demo, setDemo] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState({ transactions: [], budgets: [], goals: [], totals: { income: 0, expenses: 0, balance: 0 } });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [motion, setMotion] = useState(() => localStorage.getItem('finpilot_motion') !== 'off');
  const [transaction, setTransaction] = useState({ title: '', amount: '', type: 'expense', category: 'Food & dining', date: new Date().toISOString().slice(0, 10), note: '' });
  const [budget, setBudget] = useState({ category: 'Food & dining', limit: '', month: monthNow() });
  const [goal, setGoal] = useState({ title: '', target: '', saved: '0', dueDate: '' });
  const [chat, setChat] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! Ask me about your recorded income, spending, budgets, or savings goals.' }]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [reportMonth, setReportMonth] = useState(monthNow());

  const load = useCallback(async () => {
    const { data: result } = await api.get('/finance/summary');
    setData({
      transactions: result.transactions || [], budgets: result.budgets || [], goals: result.goals || [],
      totals: result.totals || { income: 0, expenses: 0, balance: 0 }
    });
  }, []);

  useEffect(() => {
    let active = true;
    async function boot() {
      const token = localStorage.getItem('finpilot_token');
      if (!token) { if (active) setChecking(false); return; }
      try {
        const { data: me } = await api.get('/auth/me');
        if (!active) return;
        setUser(me.user);
        await load();
      } catch (err) {
        localStorage.removeItem('finpilot_token');
        if (active) setError(err.response?.data?.message || 'Could not restore your session. Please sign in again.');
      } finally { if (active) setChecking(false); }
    }
    boot();
    return () => { active = false; };
  }, [load]);

  useEffect(() => {
    const onHash = () => { setPage(initialPage()); setMobileNav(false); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') { setModal(''); setMobileNav(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('reduce-ui-motion', !motion);
    localStorage.setItem('finpilot_motion', motion ? 'on' : 'off');
  }, [motion]);

  const navigate = useCallback(next => {
    setPage(next);
    window.location.hash = `/${next}`;
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const run = async fn => {
    setBusy(true); setError(''); setNotice('');
    try {
      await fn();
      if (!demo) await load();
      setModal('');
    } catch (err) {
      setError(err.response?.data?.message || (err.code === 'ERR_NETWORK' ? 'Cannot reach the API. Check that the server and MongoDB are running.' : 'Something went wrong. Please try again.'));
    } finally { setBusy(false); }
  };

  const logout = () => {
    localStorage.removeItem('finpilot_token');
    setUser(null); setDemo(false);
    setData({ transactions: [], budgets: [], goals: [], totals: { income: 0, expenses: 0, balance: 0 } });
    navigate('overview');
  };
  const exploreDemo = () => {
    localStorage.removeItem('finpilot_token');
    setData(createDemoData()); setUser(demoUser); setDemo(true); setChecking(false); navigate('overview');
  };
  const month = monthNow();
  const monthExpenses = data.transactions.filter(item => item.type === 'expense' && String(item.date).slice(0, 7) === month).reduce((sum, item) => sum + Number(item.amount), 0);
  const monthIncome = data.transactions.filter(item => item.type === 'income' && String(item.date).slice(0, 7) === month).reduce((sum, item) => sum + Number(item.amount), 0);
  const categoryData = useMemo(() => {
    const grouped = {};
    data.transactions.filter(item => item.type === 'expense' && String(item.date).slice(0, 7) === month).forEach(item => { grouped[item.category] = (grouped[item.category] || 0) + Number(item.amount); });
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data.transactions, month]);
  const monthly = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + index);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rows = data.transactions.filter(item => String(item.date).slice(0, 7) === key);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      income: rows.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0),
      expenses: rows.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0)
    };
  }), [data.transactions]);
  const categories = useMemo(() => [...new Set(data.transactions.map(item => item.category))].sort(), [data.transactions]);
  const filteredTransactions = useMemo(() => data.transactions.filter(item => {
    const matchesQuery = `${item.title} ${item.category} ${item.note || ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (typeFilter === 'all' || item.type === typeFilter) && (categoryFilter === 'all' || item.category === categoryFilter);
  }), [data.transactions, query, typeFilter, categoryFilter]);
  const reportRows = useMemo(() => data.transactions.filter(item => String(item.date).slice(0, 7) === reportMonth), [data.transactions, reportMonth]);
  const reportIncome = reportRows.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const reportExpenses = reportRows.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const reportCategories = useMemo(() => {
    const grouped = {};
    reportRows.filter(item => item.type === 'expense').forEach(item => { grouped[item.category] = (grouped[item.category] || 0) + Number(item.amount); });
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reportRows]);
  const savingsRate = monthIncome > 0 ? Math.max(0, Math.round((monthIncome - monthExpenses) / monthIncome * 100)) : 0;

  async function sendChat(text = chat) {
    const q = text.trim(); if (!q || busy) return;
    setChat(''); setMessages(previous => [...previous, { role: 'user', text: q }]); setBusy(true);
    try {
      let answer;
      if (demo) {
        const top = categoryData[0];
        answer = q.toLowerCase().includes('save')
          ? `Your demo savings rate this month is ${savingsRate}%. Start by reviewing ${top?.name || 'your largest category'} and automate a fixed transfer after payday.`
          : `This month’s demo cash flow shows ${money(monthIncome)} income and ${money(monthExpenses)} expenses. ${top ? `${top.name} is your largest recorded spending category at ${money(top.value)}.` : 'Add an expense to unlock category insights.'}`;
        await new Promise(resolve => setTimeout(resolve, 350));
      } else {
        const { data: result } = await api.post('/ai/chat', { message: q });
        answer = result.answer || 'No answer returned.';
      }
      setMessages(previous => [...previous, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages(previous => [...previous, { role: 'assistant', text: err.response?.data?.message || 'Could not contact the advisor. Check the server connection.' }]);
    } finally { setBusy(false); }
  }

  if (checking) return <div className="loading-screen"><span className="brand-mark"><LoaderCircle size={20}/></span><span>Connecting to your workspace…</span></div>;
  if (!user) return <AuthScreen onDemo={exploreDemo} onAuth={async currentUser => {
    setUser(currentUser); setDemo(false); setChecking(true);
    try { await load(); } catch (err) { setError(err.response?.data?.message || 'Signed in, but data could not load. Check MongoDB connection.'); }
    finally { setChecking(false); }
  }}/>;

  const pageTitle = nav.find(item => item.id === page)?.label || 'Overview';
  const openModal = name => { setError(''); setNotice(''); setModal(name); };
  const remove = async (endpoint, label, id) => {
    if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;
    await run(async () => {
      if (demo) {
        setData(previous => recalculate({
          ...previous,
          transactions: label === 'transaction' ? previous.transactions.filter(item => item._id !== id) : previous.transactions,
          budgets: label === 'budget' ? previous.budgets.filter(item => item._id !== id) : previous.budgets,
          goals: label === 'goal' ? previous.goals.filter(item => item._id !== id) : previous.goals
        }));
      } else await api.delete(endpoint);
      setNotice(`${label[0].toUpperCase() + label.slice(1)} deleted${demo ? ' in this demo tab' : ''}.`);
    });
  };
  const pageMotion = <FinanceScene compact motion={motion}/>;

  return <div className="app-shell">
    <AmbientBackground motion={motion}/>
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`} aria-label="Main navigation">
      <Brand onClick={() => navigate('overview')}/>
      <div className="sidebar-scroll">
        {navGroups.map(group => <div className="nav-group" key={group.label}>
          <div className="workspace-label">{group.label}</div>
          <nav>{group.items.map(item => {
            const Icon = item.icon;
            return <a key={item.id} href={`#/${item.id}`} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={event => { event.preventDefault(); navigate(item.id); }}>
              <Icon size={18}/><span>{item.label}</span>{item.id === 'advisor' && <span className="nav-new">AI</span>}
            </a>;
          })}</nav>
        </div>)}
      </div>
      <div className="sidebar-bottom">
        <div className="security-card"><ShieldCheck size={18}/><strong>Your data, your control</strong><p>Private to your account. No bank connection.</p></div>
        <button className="profile-row" onClick={() => navigate('settings')}><div className="avatar">{user.name?.slice(0, 1).toUpperCase()}</div><div className="profile-copy"><strong>{user.name}</strong><span>{user.email}</span></div><Settings size={16}/></button>
      </div>
    </aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left"><button className="icon-btn mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation"><Menu size={20}/></button><div><div className="breadcrumb">FINPILOT <span>/</span> {pageTitle.toUpperCase()}</div><h1>{pageTitle}</h1></div></div>
        <div className="top-actions"><span className="date-chip"><CalendarDays size={15}/>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span><div className="avatar top-avatar">{user.name?.slice(0, 1).toUpperCase()}</div></div>
      </header>
      {demo && <div className="demo-banner"><Sparkles size={15}/><span><strong>Demo mode</strong> — sample data; changes stay in this tab and are not saved to MongoDB.</span><button onClick={logout}>Exit demo</button></div>}
      <div className="content">
        {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={16}/></button></div>}
        {notice && <div className="notice-banner" role="status"><Check size={16}/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
        <div className="page-enter" key={page}>
          {page === 'overview' && <>
            <PageHero label="FINANCIAL OVERVIEW" title="Your money, at a glance." text="A clear view of today’s cash flow, with every next step within reach." scene={pageMotion} action={<button className="primary-btn" onClick={() => openModal('transaction')}><Plus size={17}/> Add transaction</button>}/>
            <div className="metric-grid">
              <Metric title="Net balance" value={money(data.totals.balance)} icon={Wallet} tone="azure" caption="Income minus expenses"/>
              <Metric title="Total income" value={money(data.totals.income)} icon={ArrowDownRight} tone="sky" caption="All recorded income"/>
              <Metric title="Total expenses" value={money(data.totals.expenses)} icon={ArrowUpRight} tone="coral" caption="All recorded expenses"/>
              <Metric title="This month spent" value={money(monthExpenses)} icon={Activity} tone="amber" caption={`${data.transactions.length} saved transactions`}/>
            </div>
            <div className="dashboard-grid">
              <section className="panel chart-panel"><PanelHead title="Cash flow" text="Income vs expenses · last 6 months" action={<span className="panel-badge"><TrendingUp size={14}/> Live data</span>}/>
                <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid stroke="#2b3c5e" strokeDasharray="3 6" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#96a7c7', fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: '#96a7c7', fontSize: 12 }} tickFormatter={value => value >= 1000 ? `$${value / 1000}k` : `$${value}`}/><Tooltip contentStyle={tooltipStyle} formatter={value => money(value)}/><Area type="monotone" dataKey="income" name="Income" stroke="#8cc8ff" strokeWidth={2.5} fill="#8cc8ff" fillOpacity={0.1}/><Area type="monotone" dataKey="expenses" name="Expenses" stroke="#6aa9ff" strokeWidth={2.5} fill="#6aa9ff" fillOpacity={0.08}/></AreaChart></ResponsiveContainer></div>
                <div className="chart-legend"><span><i style={{ background: '#8cc8ff' }}/>Income</span><span><i style={{ background: '#6aa9ff' }}/>Expenses</span></div>
              </section>
              <section className="panel spending-panel"><PanelHead title="Spending breakdown" text="Current month by category"/>
                <SpendingBreakdown categoryData={categoryData} monthExpenses={monthExpenses}/>
              </section>
            </div>
            <section className="panel transactions-panel"><PanelHead title="Recent transactions" text="Your latest financial activity" action={<button className="text-btn" onClick={() => navigate('transactions')}>View all <ArrowRight size={15}/></button>}/><TransactionTable rows={data.transactions.slice(0, 5)} onDelete={id => remove(`/transactions/${id}`, 'transaction', id)}/></section>
            <div className="bottom-grid">
              <section className="panel"><PanelHead title="Budget pulse" text="Monthly spending limits" action={<button className="text-btn" onClick={() => navigate('budgets')}>Manage <ArrowRight size={15}/></button>}/>{data.budgets.filter(item => item.month === month).length ? data.budgets.filter(item => item.month === month).map(item => <BudgetProgress key={item._id} budget={item} spent={spentFor(data.transactions, item)}/>) : <Empty icon={ChartNoAxesCombined} title="No budgets set" text="Create a monthly limit to track spending."/>}</section>
              <section className="panel"><PanelHead title="Savings goals" text="Small steps, bigger milestones" action={<button className="text-btn" onClick={() => navigate('goals')}>View goals <ArrowRight size={15}/></button>}/>{data.goals.length ? data.goals.slice(0, 3).map(item => <GoalProgress key={item._id} goal={item}/>) : <Empty icon={Target} title="No goals yet" text="Create a goal to start tracking savings."/>}</section>
            </div>
          </>}

          {page === 'transactions' && <>
            <PageHero label="ACTIVITY LEDGER" title="Every transaction, accounted for." text="Search, filter, export, and manage the income and expenses saved to your account." scene={pageMotion} action={<button className="primary-btn" onClick={() => openModal('transaction')}><Plus size={17}/> Add transaction</button>}/>
            <section className="panel full-panel">
              <div className="filter-bar"><label className="search-field"><Search size={17}/><span className="sr-only">Search transactions</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search title, category, or note"/></label><label>Type<select value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option></select></label><label>Category<select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select></label><button className="secondary-btn" onClick={() => downloadFile(transactionsCSV(filteredTransactions), `finpilot-transactions-${monthNow()}.csv`)}><Download size={16}/> Export CSV</button></div>
              <div className="list-summary"><span>{filteredTransactions.length} transactions</span><span>{money(filteredTransactions.reduce((sum, item) => sum + Number(item.amount), 0))} combined value</span></div>
              <TransactionTable rows={filteredTransactions} onDelete={id => remove(`/transactions/${id}`, 'transaction', id)}/>
            </section>
          </>}

          {page === 'budgets' && <>
            <PageHero label="SPENDING LIMITS" title="Spend with intention." text="Turn monthly plans into visible progress and catch overspending early." scene={pageMotion} action={<button className="primary-btn" onClick={() => openModal('budget')}><Plus size={17}/> Create budget</button>}/>
            <div className="section-stat-row"><div><span>Monthly budgets</span><strong>{data.budgets.filter(item => item.month === month).length}</strong></div><div><span>Planned limits</span><strong>{money(data.budgets.filter(item => item.month === month).reduce((sum, item) => sum + Number(item.limit), 0))}</strong></div><div><span>Current month</span><strong>{month}</strong></div></div>
            <div className="budget-grid">{data.budgets.map(item => <section className="panel budget-card tilt-card" key={item._id}><div className="budget-card-top"><span className="icon-tile azure"><ChartNoAxesCombined size={18}/></span><button className="icon-btn danger-hover" onClick={() => remove(`/finance/budgets/${item._id}`, 'budget', item._id)} aria-label={`Delete ${item.category} budget`}><Trash2 size={16}/></button></div><span className="mono-label">{item.month} · {item.category}</span><h3>{money(item.limit)} <small>limit</small></h3><BudgetProgress budget={item} spent={spentFor(data.transactions, item)}/></section>)}{!data.budgets.length && <Empty icon={ChartNoAxesCombined} title="No budgets yet" text="Add your first monthly budget."/>}</div>
          </>}

          {page === 'goals' && <>
            <PageHero label="SAVINGS MILESTONES" title="Make room for what matters." text="Give every savings target a number, a timeline, and a visible next step." scene={pageMotion} action={<button className="primary-btn" onClick={() => openModal('goal')}><Plus size={17}/> Add a goal</button>}/>
            <div className="section-stat-row"><div><span>Total target</span><strong>{money(data.goals.reduce((sum, item) => sum + Number(item.target), 0))}</strong></div><div><span>Already saved</span><strong>{money(data.goals.reduce((sum, item) => sum + Number(item.saved), 0))}</strong></div><div><span>Active goals</span><strong>{data.goals.length}</strong></div></div>
            <div className="goals-grid">{data.goals.map(item => <GoalCard key={item._id} goal={item} onUpdate={saved => run(async () => {
              if (demo) setData(previous => ({ ...previous, goals: previous.goals.map(goalItem => goalItem._id === item._id ? { ...goalItem, saved } : goalItem) }));
              else await api.patch(`/finance/goals/${item._id}`, { saved });
              setNotice('Goal progress updated.');
            })} onDelete={() => remove(`/finance/goals/${item._id}`, 'goal', item._id)}/>)}{!data.goals.length && <Empty icon={Target} title="No goals yet" text="Add a savings goal to begin."/>}</div>
          </>}

          {page === 'analytics' && <>
            <PageHero label="FINANCIAL INTELLIGENCE" title="See the patterns behind the numbers." text="Compare monthly movement, category pressure, and savings momentum in one visual workspace." scene={pageMotion} action={<button className="secondary-btn" onClick={() => navigate('reports')}>Build a report <ArrowRight size={16}/></button>}/>
            <div className="analytics-layout">
              <section className="panel analytics-main"><PanelHead title="Six-month comparison" text="Where income and spending diverge"/><div className="chart-wrap tall-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}><CartesianGrid stroke="#2b3c5e" strokeDasharray="3 6" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#96a7c7', fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: '#96a7c7', fontSize: 12 }} tickFormatter={value => `₹${value / 1000}k`}/><Tooltip contentStyle={tooltipStyle} formatter={value => money(value)}/><Bar dataKey="income" name="Income" fill="#8cc8ff" radius={[4, 4, 0, 0]}/><Bar dataKey="expenses" name="Expenses" fill="#6aa9ff" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer></div></section>
              <section className="panel insight-rail"><PanelHead title="This month" text="Derived from saved records"/><div className="big-insight"><span>Savings rate</span><strong>{savingsRate}%</strong><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, savingsRate)}%` }}/></div><p>{money(monthIncome - monthExpenses)} remains after recorded expenses.</p></div><div className="context-stat"><span>Income</span><strong>{money(monthIncome)}</strong></div><div className="context-stat"><span>Spending</span><strong>{money(monthExpenses)}</strong></div><div className="context-stat"><span>Top category</span><strong>{categoryData[0]?.name || 'No data'}</strong></div></section>
            </div>
            <div className="bottom-grid analytics-bottom"><section className="panel"><PanelHead title="Category pressure" text="Largest current-month expenses"/>{categoryData.length ? categoryData.slice(0, 5).map((item, index) => <div className="category-meter" key={item.name}><div><span>{item.name}</span><strong>{money(item.value)}</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round(item.value / categoryData[0].value * 100)}%`, background: COLORS[index % COLORS.length] }}/></div></div>) : <Empty icon={BarChart3} title="No category data" text="Add expenses to reveal spending patterns."/>}</section><section className="panel insight-note"><span className="section-label">PATTERN NOTE</span><h3>{categoryData[0] ? `${categoryData[0].name} leads this month’s spending.` : 'Your next insight starts with a transaction.'}</h3><p>{categoryData[0] ? `It represents ${Math.round(categoryData[0].value / Math.max(1, monthExpenses) * 100)}% of recorded expenses. Open your report for a printable monthly breakdown.` : 'Record income and expenses to unlock comparisons and useful trends.'}</p><button className="text-btn" onClick={() => navigate('reports')}>Open monthly report <ArrowRight size={15}/></button></section></div>
          </>}

          {page === 'reports' && <>
            <PageHero label="MONTHLY REPORTS" title="A statement you can actually use." text="Choose a month, review the summary, then export or print a clean financial snapshot." scene={pageMotion} action={<button className="primary-btn" onClick={() => window.print()}><Printer size={17}/> Print report</button>}/>
            <section className="panel report-panel">
              <div className="report-toolbar"><div><span className="section-label">REPORT PERIOD</span><h2>{new Date(`${reportMonth}-01T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2></div><div className="report-actions"><label>Month<input type="month" value={reportMonth} onChange={event => setReportMonth(event.target.value)} max={monthNow()}/></label><button className="secondary-btn" onClick={() => downloadFile(transactionsCSV(reportRows), `finpilot-report-${reportMonth}.csv`)}><Download size={16}/> Export CSV</button></div></div>
              <div className="report-summary"><div><span>Income</span><strong>{money(reportIncome)}</strong></div><div><span>Expenses</span><strong>{money(reportExpenses)}</strong></div><div className="report-net"><span>Net cash flow</span><strong>{money(reportIncome - reportExpenses)}</strong></div></div>
              <div className="report-body"><div><h3>Category breakdown</h3>{reportCategories.length ? reportCategories.map(item => <div className="report-line" key={item.name}><span>{item.name}</span><strong>{money(item.value)}</strong><em>{Math.round(item.value / Math.max(1, reportExpenses) * 100)}%</em></div>) : <Empty icon={FileText} title="No expenses this month" text="Choose another month or add a transaction."/>}</div><div><h3>Report notes</h3><p>{reportRows.length ? `${reportRows.length} transactions are included. ${reportIncome >= reportExpenses ? 'Income exceeded expenses during this period.' : 'Expenses exceeded income during this period.'}` : 'There are no records in this reporting period.'}</p><p className="muted">Generated from your currently saved FinPilot records. Amounts are shown in INR (₹).</p></div></div>
            </section>
            <section className="panel transactions-panel"><PanelHead title="Transactions in this report" text={`${reportRows.length} records`}/><TransactionTable rows={reportRows} onDelete={id => remove(`/transactions/${id}`, 'transaction', id)}/></section>
          </>}

          {page === 'advisor' && <>
            <PageHero label="GUIDED BY YOUR DATA" title="Ask better money questions." text="Turn your saved records into practical, educational guidance through the existing FinPilot advisor." scene={pageMotion}/>
            <div className="advisor-layout"><section className="panel advisor-panel"><div className="advisor-heading"><div className="advisor-avatar"><Bot size={23}/><span/></div><div><h2>FinPilot Advisor</h2><p><span className="online-dot"/> {demo ? 'Answering from demo data' : 'Connected to your saved data'}</p></div><span className="ai-tag"><Sparkles size={13}/> MONEY INSIGHTS</span></div><div className="chat-messages" aria-live="polite">{messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}><div className="chat-avatar">{message.role === 'assistant' ? <Bot size={16}/> : <span>{user.name?.slice(0, 1).toUpperCase()}</span>}</div><div className="chat-bubble">{message.text}</div></div>)}{busy && <div className="chat-message assistant"><div className="chat-avatar"><Bot size={16}/></div><div className="chat-bubble typing">Reviewing your financial picture…</div></div>}</div><div className="suggestion-row">{['Where am I spending most?', 'How can I save more?', 'Summarize my finances'].map(question => <button key={question} onClick={() => sendChat(question)}>{question}</button>)}</div><form className="chat-input-row" onSubmit={event => { event.preventDefault(); sendChat(); }}><label className="sr-only" htmlFor="advisor-input">Ask about your money</label><input id="advisor-input" value={chat} onChange={event => setChat(event.target.value)} placeholder="Ask about your money…" disabled={busy}/><button className="send-btn" disabled={busy || !chat.trim()} aria-label="Send message"><Send size={17}/></button></form><p className="advisor-disclaimer"><ShieldCheck size={13}/> Educational guidance only, not professional financial advice.</p></section><aside className="advisor-aside"><section className="panel"><PanelHead title="Account context" text="Current saved records"/><div className="context-stat"><span>Transactions</span><strong>{data.transactions.length}</strong></div><div className="context-stat"><span>Income records</span><strong>{data.transactions.filter(item => item.type === 'income').length}</strong></div><div className="context-stat"><span>Expense records</span><strong>{data.transactions.filter(item => item.type === 'expense').length}</strong></div></section><section className="panel insight-note"><span className="section-label">TRY A FOLLOW-UP</span><h3>Go beyond the total.</h3><p>Ask which category is growing, how your savings rate looks, or where a small change could have the biggest impact.</p></section></aside></div>
          </>}

          {page === 'tools' && <>
            <PageHero label="INTERACTIVE CALCULATORS" title="Test the plan before you commit." text="Simple, instant calculators for savings growth and emergency-fund planning. No records are changed." scene={pageMotion}/>
            <div className="tools-grid"><SavingsCalculator/><EmergencyCalculator/></div>
            <section className="panel formula-note"><Calculator size={22}/><div><h3>Transparent estimates, not predictions.</h3><p>Calculations use the values you enter and a constant estimated return. Actual returns, fees, taxes, and inflation can change real-world outcomes.</p></div></section>
          </>}

          {page === 'learn' && <>
            <PageHero label="FINANCIAL LITERACY" title="Build confidence, one lesson at a time." text="Short practical lessons you can open, read, and mark complete as you strengthen your money habits." scene={pageMotion} action={<button className="secondary-btn" onClick={() => navigate('tools')}>Try money tools <ArrowRight size={16}/></button>}/>
            <LearnLessons/>
          </>}

          {page === 'settings' && <>
            <PageHero label="WORKSPACE PREFERENCES" title="Make FinPilot feel like yours." text="Manage presentation preferences, export your records, and review account security." scene={pageMotion}/>
            <div className="settings-layout">
              <section className="panel settings-section"><PanelHead title="Profile" text="Details from your signed-in account"/><div className="profile-settings"><div className="avatar large-avatar">{user.name?.slice(0, 1).toUpperCase()}</div><div><h3>{user.name}</h3><p>{user.email}</p><span className="panel-badge"><ShieldCheck size={14}/>{demo ? 'Demo profile' : 'Authenticated account'}</span></div></div></section>
              <section className="panel settings-section"><PanelHead title="Appearance & motion" text="Saved only in this browser"/><div className="setting-row"><div><strong>Interface motion</strong><p>Enable 3D scenes, pointer response, and page transitions.</p></div><button className={`toggle ${motion ? 'on' : ''}`} role="switch" aria-checked={motion} aria-label="Toggle interface motion" onClick={() => setMotion(!motion)}><span/></button></div></section>
              <section className="panel settings-section"><PanelHead title="Data & security" text="Portable records, clear controls"/><div className="setting-row"><div><strong>Export workspace</strong><p>Download transactions, budgets, goals, and totals as JSON.</p></div><button className="secondary-btn" onClick={() => downloadFile(JSON.stringify(data, null, 2), `finpilot-workspace-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')}><Download size={16}/> Export JSON</button></div><div className="setting-row"><div><strong>MongoDB connection</strong><p>{demo ? 'Demo mode is disconnected from your database.' : 'Your existing server and database configuration remains unchanged.'}</p></div><span className="connection-badge"><i/>{demo ? 'Demo only' : 'Server managed'}</span></div></section>
              <section className="panel settings-section danger-zone"><PanelHead title="Session" text="Sign out on this device"/><button className="secondary-btn" onClick={logout}><LogOut size={16}/> Sign out</button></section>
            </div>
          </>}
        </div>
      </div>
      <footer className="app-footer"><span>© {new Date().getFullYear()} FinPilot AI</span><span><ShieldCheck size={13}/> Account data · No bank connection</span></footer>
    </main>
    <nav className="mobile-quick-nav" aria-label="Quick navigation">{nav.filter(item => ['overview', 'transactions', 'analytics', 'advisor'].includes(item.id)).map(item => { const Icon = item.icon; return <a href={`#/${item.id}`} className={page === item.id ? 'active' : ''} key={item.id} onClick={event => { event.preventDefault(); navigate(item.id); }}><Icon size={19}/><span>{item.label}</span></a>; })}<button onClick={() => setMobileNav(true)}><Menu size={19}/><span>All pages</span></button></nav>

    {modal && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setModal('')}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><h3 id="modal-title">{modal === 'transaction' ? 'Add transaction' : modal === 'budget' ? 'Create monthly budget' : 'Create savings goal'}</h3><button className="icon-btn" onClick={() => setModal('')} aria-label="Close dialog" autoFocus><X size={18}/></button></div>
      {modal === 'transaction' && <form className="modal-form" onSubmit={event => { event.preventDefault(); run(async () => {
        const payload = { ...transaction, amount: Number(transaction.amount) };
        if (demo) setData(previous => recalculate({ ...previous, transactions: [{ ...payload, _id: `demo-${Date.now()}` }, ...previous.transactions] }));
        else await api.post('/transactions', payload);
        setTransaction({ title: '', amount: '', type: 'expense', category: 'Food & dining', date: new Date().toISOString().slice(0, 10), note: '' });
        setNotice(`Transaction ${demo ? 'added in this demo tab' : 'saved to your account'}.`);
      }); }}>
        <label>Title<input value={transaction.title} onChange={event => setTransaction({ ...transaction, title: event.target.value })} required maxLength="120" placeholder="e.g. Grocery shopping"/></label>
        <div className="form-row"><label>Amount (₹)<input type="number" min="0.01" step="0.01" value={transaction.amount} onChange={event => setTransaction({ ...transaction, amount: event.target.value })} required/></label><label>Type<select value={transaction.type} onChange={event => setTransaction({ ...transaction, type: event.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select></label></div>
        <div className="form-row"><label>Category<input value={transaction.category} onChange={event => setTransaction({ ...transaction, category: event.target.value })} required maxLength="50"/></label><label>Date<input type="date" value={transaction.date} onChange={event => setTransaction({ ...transaction, date: event.target.value })} required/></label></div>
        <label>Note (optional)<input value={transaction.note} onChange={event => setTransaction({ ...transaction, note: event.target.value })} maxLength="300" placeholder="Short note"/></label><button className="primary-btn full-btn" disabled={busy}>{busy ? 'Saving…' : 'Save transaction'}</button>
      </form>}
      {modal === 'budget' && <form className="modal-form" onSubmit={event => { event.preventDefault(); run(async () => {
        const payload = { ...budget, limit: Number(budget.limit) };
        if (demo) setData(previous => ({ ...previous, budgets: [{ ...payload, _id: `demo-${Date.now()}` }, ...previous.budgets] }));
        else await api.post('/finance/budgets', payload);
        setBudget({ ...budget, limit: '' }); setNotice('Budget saved.');
      }); }}><label>Category<input value={budget.category} onChange={event => setBudget({ ...budget, category: event.target.value })} required maxLength="50"/></label><div className="form-row"><label>Monthly limit (₹)<input type="number" min="1" step="0.01" value={budget.limit} onChange={event => setBudget({ ...budget, limit: event.target.value })} required/></label><label>Month<input type="month" value={budget.month} onChange={event => setBudget({ ...budget, month: event.target.value })} required/></label></div><button className="primary-btn full-btn" disabled={busy}>{busy ? 'Saving…' : 'Save budget'}</button></form>}
      {modal === 'goal' && <form className="modal-form" onSubmit={event => { event.preventDefault(); run(async () => {
        const payload = { ...goal, target: Number(goal.target), saved: Number(goal.saved), dueDate: goal.dueDate || null };
        if (demo) setData(previous => ({ ...previous, goals: [{ ...payload, _id: `demo-${Date.now()}` }, ...previous.goals] }));
        else await api.post('/finance/goals', payload);
        setGoal({ title: '', target: '', saved: '0', dueDate: '' }); setNotice('Savings goal created.');
      }); }}><label>Goal name<input value={goal.title} onChange={event => setGoal({ ...goal, title: event.target.value })} required minLength="2" maxLength="100" placeholder="e.g. Emergency fund"/></label><div className="form-row"><label>Target (₹)<input type="number" min="1" step="0.01" value={goal.target} onChange={event => setGoal({ ...goal, target: event.target.value })} required/></label><label>Already saved (₹)<input type="number" min="0" step="0.01" value={goal.saved} onChange={event => setGoal({ ...goal, saved: event.target.value })} required/></label></div><label>Target date (optional)<input type="date" value={goal.dueDate} onChange={event => setGoal({ ...goal, dueDate: event.target.value })}/></label><button className="primary-btn full-btn" disabled={busy}>{busy ? 'Saving…' : 'Create goal'}</button></form>}
    </section></div>}
  </div>;
}

const tooltipStyle = { background: '#171f35', border: '1px solid #3a4d72', borderRadius: 8, color: '#e8efff' };
const spentFor = (transactions, budget) => transactions.filter(item => item.type === 'expense' && item.category === budget.category && String(item.date).slice(0, 7) === budget.month).reduce((sum, item) => sum + Number(item.amount), 0);

function PageHero({ label, title, text, scene, action }) {
  return <section className="page-hero"><div className="page-hero-copy"><span className="section-label">{label}</span><h2>{title}</h2><p>{text}</p>{action && <div className="hero-action">{action}</div>}</div><div className="page-hero-scene">{scene}<span className="scene-caption"><i/> INTERACTIVE FINANCIAL ORBIT</span></div></section>;
}
function PanelHead({ title, text, action }) {
  return <div className="panel-head"><div><h3>{title}</h3>{text && <p>{text}</p>}</div>{action}</div>;
}
function Metric({ title, value, icon: Icon, tone, caption }) {
  const tilt = event => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.transform = `perspective(700px) rotateX(${-y * 5}deg) rotateY(${x * 6}deg) translateY(-3px)`;
  };
  const reset = event => { event.currentTarget.style.transform = ''; };
  return <section className="panel metric-card tilt-card" onPointerMove={tilt} onPointerLeave={reset}><div className="metric-top"><span>{title}</span><span className={`icon-tile ${tone}`}><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-caption">{caption}</div></section>;
}
function Empty({ icon: Icon, title, text }) {
  return <div className="empty-state"><Icon size={24}/><strong>{title}</strong><p>{text}</p></div>;
}
function TransactionTable({ rows, onDelete }) {
  if (!rows.length) return <Empty icon={CreditCard} title="Nothing to show yet" text="Add a transaction or adjust your filters."/>;
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.map(item => <tr key={item._id}><td><div className="transaction-title"><span className={`transaction-icon ${item.type}`}>{item.type === 'income' ? <ArrowDownRight size={16}/> : <ArrowUpRight size={16}/>}</span><div><strong>{item.title}</strong><span>{item.note || (item.type === 'income' ? 'Income' : 'Expense')}</span></div></div></td><td><span className="category-pill">{item.category}</span></td><td className="muted">{dateLabel(item.date)}</td><td className={`amount-cell ${item.type}`}>{item.type === 'income' ? '+' : '−'}{money(item.amount)}</td><td><button className="icon-btn table-delete" title="Delete transaction" aria-label={`Delete ${item.title}`} onClick={() => onDelete(item._id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>;
}
function SpendingBreakdown({ categoryData, monthExpenses }) {
  return categoryData.length ? <><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={84} paddingAngle={4} stroke="none">{categoryData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={value => money(value)}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(monthExpenses)}</strong><span>Total spent</span></div></div><div className="category-list">{categoryData.slice(0, 5).map((item, index) => <div className="category-row" key={item.name}><span className="category-name"><i style={{ background: COLORS[index % COLORS.length] }}/>{item.name}</span><strong>{money(item.value)}</strong></div>)}</div></> : <Empty icon={ChartNoAxesCombined} title="No spending data yet" text="Add an expense to see your category breakdown."/>;
}
function BudgetProgress({ budget, spent }) {
  const pct = Math.min(100, Math.round(spent / Math.max(1, budget.limit) * 100));
  return <div className="budget-progress"><div className="progress-label"><span>{money(spent)} <em>spent</em></span><span>{pct}%</span></div><div className="progress-track"><div className={`progress-fill ${pct >= 100 ? 'over' : pct >= 80 ? 'warning' : ''}`} style={{ width: `${pct}%` }}/></div><div className="progress-foot"><span>{budget.category}</span><span>{money(Math.max(0, budget.limit - spent))} left</span></div></div>;
}
function GoalProgress({ goal }) {
  const pct = Math.min(100, Math.round(goal.saved / Math.max(1, goal.target) * 100));
  return <div className="goal-progress"><div className="goal-row"><span className="goal-icon"><PiggyBank size={17}/></span><div className="goal-name"><strong>{goal.title}</strong><span>{money(goal.saved)} of {money(goal.target)}</span></div><b>{pct}%</b></div><div className="progress-track"><div className="progress-fill goal-fill" style={{ width: `${pct}%` }}/></div></div>;
}
function GoalCard({ goal, onUpdate, onDelete }) {
  const [saved, setSaved] = useState(String(goal.saved));
  return <section className="panel goal-card tilt-card"><div className="goal-card-head"><span className="icon-tile sky"><Target size={18}/></span><button className="icon-btn danger-hover" onClick={onDelete} aria-label={`Delete ${goal.title}`}><Trash2 size={16}/></button></div><span className="mono-label">{goal.dueDate ? `TARGET · ${dateLabel(goal.dueDate)}` : 'SAVINGS GOAL'}</span><h3>{goal.title}</h3><div className="goal-large-amount">{money(goal.saved)} <span>of {money(goal.target)}</span></div><GoalProgress goal={goal}/><form className="inline-update" onSubmit={event => { event.preventDefault(); onUpdate(Number(saved)); }}><label>Update saved amount<input type="number" min="0" max={goal.target} step="0.01" value={saved} onChange={event => setSaved(event.target.value)} required/></label><button className="secondary-btn">Update</button></form></section>;
}
function SavingsCalculator() {
  const [monthly, setMonthly] = useState('250');
  const [years, setYears] = useState('5');
  const [rate, setRate] = useState('6');
  const months = Math.max(0, Number(years) * 12);
  const monthlyRate = Number(rate) / 100 / 12;
  const deposit = Number(monthly);
  const future = monthlyRate > 0 ? deposit * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) : deposit * months;
  const contributed = deposit * months;
  const growth = Math.max(0, future - contributed);
  return <section className="panel calculator-card"><div className="calculator-title"><span className="icon-tile azure"><TrendingUp size={20}/></span><div><h3>Savings growth</h3><p>Estimate a monthly savings plan.</p></div></div><div className="calculator-fields"><label>Monthly deposit (₹)<input type="number" min="0" step="10" value={monthly} onChange={event => setMonthly(event.target.value)}/></label><label>Time period (years)<input type="number" min="0" max="60" step="1" value={years} onChange={event => setYears(event.target.value)}/></label><label>Estimated annual return (%)<input type="number" min="0" max="30" step="0.1" value={rate} onChange={event => setRate(event.target.value)}/></label></div><div className="calculator-result"><span>Estimated future value</span><strong>{money(future)}</strong><div className="result-breakdown"><span>Contributions <b>{money(contributed)}</b></span><span>Estimated growth <b>{money(growth)}</b></span></div></div><button className="text-btn" onClick={() => { setMonthly('250'); setYears('5'); setRate('6'); }}>Reset calculator</button></section>;
}
function EmergencyCalculator() {
  const [expenses, setExpenses] = useState('2400');
  const [months, setMonths] = useState('6');
  const [saved, setSaved] = useState('5000');
  const target = Math.max(0, Number(expenses) * Number(months));
  const remaining = Math.max(0, target - Number(saved));
  const pct = Math.min(100, Math.round(Number(saved) / Math.max(1, target) * 100));
  return <section className="panel calculator-card"><div className="calculator-title"><span className="icon-tile sky"><ShieldCheck size={20}/></span><div><h3>Emergency fund</h3><p>Size a practical financial cushion.</p></div></div><div className="calculator-fields"><label>Essential monthly costs (₹)<input type="number" min="0" step="50" value={expenses} onChange={event => setExpenses(event.target.value)}/></label><label>Coverage period (months)<input type="number" min="1" max="24" step="1" value={months} onChange={event => setMonths(event.target.value)}/></label><label>Currently saved (₹)<input type="number" min="0" step="50" value={saved} onChange={event => setSaved(event.target.value)}/></label></div><div className="calculator-result"><span>Recommended fund target</span><strong>{money(target)}</strong><div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }}/></div><p>{pct}% covered · {money(remaining)} remaining</p></div><button className="text-btn" onClick={() => { setExpenses('2400'); setMonths('6'); setSaved('5000'); }}>Reset calculator</button></section>;
}
function LearnLessons() {
  const lessons = [
    { title: 'Build a budget that survives real life', time: '4 min read', body: 'Start with after-tax income, cover essential costs, assign money to savings, then plan flexible spending. Review the plan weekly and adjust categories instead of abandoning the budget after one unexpected expense.', action: 'Write your essential monthly costs in the Emergency Fund calculator.' },
    { title: 'Why an emergency fund comes first', time: '3 min read', body: 'A cash cushion can reduce the need for high-interest borrowing when income stops or an urgent bill arrives. Many people begin with one month of essential costs and build toward several months over time.', action: 'Separate essential costs from optional spending before choosing a target.' },
    { title: 'Understand your savings rate', time: '3 min read', body: 'Your savings rate is the share of income left after spending. Tracking it monthly can be more useful than chasing a perfect budget. Irregular income may require a larger buffer and a longer averaging period.', action: 'Compare your rate across several months, not just one unusually good month.' },
    { title: 'Compound growth without the jargon', time: '5 min read', body: 'Compounding means growth can earn growth of its own. Time and consistent contributions matter, but investment returns are never guaranteed. Fees, taxes, inflation, and risk all affect the final result.', action: 'Use the Savings Growth calculator to compare time periods, not just return rates.' },
    { title: 'Make a savings goal measurable', time: '3 min read', body: 'A useful goal has a target amount, a purpose, and a date. Divide the remaining amount by the months available to estimate a contribution, then check whether that amount fits your real budget.', action: 'Add one goal in FinPilot and update its progress after each contribution.' },
    { title: 'Read your monthly money report', time: '4 min read', body: 'Start with net cash flow, then inspect your largest categories and unusual transactions. Look for patterns you can act on rather than judging individual purchases. Export a report to keep a monthly comparison habit.', action: 'Open Reports and compare this month with the previous month.' }
  ];
  const [completed, setCompleted] = useState([]);
  const toggle = title => setCompleted(previous => previous.includes(title) ? previous.filter(item => item !== title) : [...previous, title]);
  return <><div className="learning-progress"><div><span className="section-label">YOUR LEARNING PROGRESS</span><strong>{completed.length} of {lessons.length} lessons complete</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${completed.length / lessons.length * 100}%` }}/></div></div><div className="lesson-list">{lessons.map((lesson, index) => <details className="lesson" key={lesson.title} open={index === 0}><summary><span className="lesson-index">{String(index + 1).padStart(2, '0')}</span><span><strong>{lesson.title}</strong><small>{lesson.time}</small></span><ChevronRight size={20}/></summary><div className="lesson-body"><p>{lesson.body}</p><div className="lesson-action"><strong>Try it</strong><p>{lesson.action}</p></div><button className={completed.includes(lesson.title) ? 'secondary-btn' : 'primary-btn'} onClick={() => toggle(lesson.title)}><Check size={16}/>{completed.includes(lesson.title) ? 'Mark incomplete' : 'Mark complete'}</button></div></details>)}</div></>;
}
