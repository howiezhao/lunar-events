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
        <p>算法基于 Jean Meeus《天文算法》· 新月精度 ±2 分钟 · 支持 2000–2060 年</p>
        <a
          className="app-footer__source"
          href="https://github.com/howiezhao/lunar-events"
          target="_blank"
          rel="noopener noreferrer"
          title="在 GitHub 查看源码"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.68 7.68 0 0 1 8 4.71c.68.003 1.36.092 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          开源
        </a>
      </footer>
    </div>
  );
}
