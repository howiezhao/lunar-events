import { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import { LunarDate, LunarEvent, solarToLunar, today } from './lunar';

// ─────────────────────────────────────────────────────────────────────────────
// Persist events to localStorage
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'lunar-calendar-events-v1';

function loadEvents(): LunarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LunarEvent[]) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: LunarEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // Initialize calendar at today's lunar month
  const todayDate = today();
  const todayLunar = solarToLunar(todayDate.year, todayDate.month, todayDate.day);

  const [viewYear,  setViewYear]  = useState(todayLunar?.lunarYear  ?? todayDate.year);
  const [viewMonth, setViewMonth] = useState(todayLunar?.lunarMonth ?? 1);
  const [viewIsLeap, setViewIsLeap] = useState(todayLunar?.isLeap ?? false);

  const [selected, setSelected]   = useState<LunarDate | null>(null);
  const [events,   setEvents]     = useState<LunarEvent[]>(loadEvents);

  // Persist events whenever they change
  useEffect(() => { saveEvents(events); }, [events]);

  const handleNavigate = (year: number, month: number, isLeap: boolean) => {
    setViewYear(year);
    setViewMonth(month);
    setViewIsLeap(isLeap);
  };

  const handleSelect = (date: LunarDate) => {
    setSelected(prev =>
      prev &&
      prev.lunarYear  === date.lunarYear  &&
      prev.lunarMonth === date.lunarMonth &&
      prev.lunarDay   === date.lunarDay   &&
      prev.isLeap     === date.isLeap
        ? null   // toggle off if same date
        : date
    );
  };

  const handleAddEvent = (event: LunarEvent) => {
    setEvents(prev => [event, ...prev]);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <span className="app-header__icon" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M3 9h18M8 2v4M16 2v4M8 13h2M12 13h2M16 13h2M8 17h2M12 17h2M16 17h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <h1 className="app-header__title">农历周期活动</h1>
          </div>
          <p className="app-header__sub">
            基于天文算法精确推算农历日期 · 生成 ICS 文件导入 Google 日历 / Apple 日历
          </p>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="app-main">
        <div className="app-layout">
          {/* Left: Calendar */}
          <section className="app-layout__calendar">
            <Calendar
              viewYear={viewYear}
              viewMonth={viewMonth}
              viewIsLeap={viewIsLeap}
              selected={selected}
              onSelect={handleSelect}
              onNavigate={handleNavigate}
            />
          </section>

          {/* Right: Form + List */}
          <aside className="app-layout__sidebar">
            <EventForm
              selectedDate={selected}
              onAdd={handleAddEvent}
            />
            <div className="app-divider" />
            <EventList
              events={events}
              onDelete={handleDeleteEvent}
            />
          </aside>
        </div>
      </main>

      <footer className="app-footer">
        算法基于 Jean Meeus《天文算法》· 新月精度 ±2 分钟 · 支持 2000–2060 年
      </footer>
    </div>
  );
}
