import {
  lunarToSolar,
  getLunarMonthDays,
  adjacentLunarMonth,
  getChineseYearName,
  formatLunarMonth,
  formatLunarDay,
  getMondayBasedDOW,
  solarToLunar,
  today,
  SolarDate,
  LunarDate,
} from '../lunar';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarProps {
  /** Currently displayed lunar year */
  viewYear: number;
  /** Currently displayed lunar month (1–12) */
  viewMonth: number;
  /** Whether the displayed month is a leap month */
  viewIsLeap: boolean;
  /** The selected lunar date (if any) */
  selected: LunarDate | null;
  /** Called when the user clicks a day cell */
  onSelect: (date: LunarDate) => void;
  /** Called when the user navigates to a different month */
  onNavigate: (year: number, month: number, isLeap: boolean) => void;
}

// Day-of-week header, Mon-first (standard Chinese calendar layout)
const DOW_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

// ─────────────────────────────────────────────────────────────────────────────
// DayCell
// ─────────────────────────────────────────────────────────────────────────────

interface DayCellProps {
  lunarDay: number;
  solar: SolarDate;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  onClick: () => void;
}

function DayCell({ lunarDay, solar, isToday, isSelected, isWeekend, onClick }: DayCellProps) {
  let className = 'cal-cell';
  if (isSelected) className += ' cal-cell--selected';
  else if (isToday) className += ' cal-cell--today';
  if (isWeekend && !isSelected) className += ' cal-cell--weekend';

  const lunarLabel = formatLunarDay(lunarDay);
  const isSpecial = lunarDay === 1 || lunarDay === 15;

  return (
    <button className={className} onClick={onClick} title={`${solar.year}-${solar.month}-${solar.day}`}>
      <span className="cal-cell__solar">{solar.day}</span>
      <span className={`cal-cell__lunar${isSpecial ? ' cal-cell__lunar--special' : ''}`}>
        {lunarLabel}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar
// ─────────────────────────────────────────────────────────────────────────────

export default function Calendar({
  viewYear,
  viewMonth,
  viewIsLeap,
  selected,
  onSelect,
  onNavigate,
}: CalendarProps) {
  const todayDate = today();
  const todayLunar = solarToLunar(todayDate.year, todayDate.month, todayDate.day);

  // Get the first day's solar date to determine grid offset
  const firstDaySolar = lunarToSolar(viewYear, viewMonth, 1, viewIsLeap);
  const monthLen = getLunarMonthDays(viewYear, viewMonth, viewIsLeap);

  // Build grid cells: null = empty padding, number = lunar day
  const cells: (number | null)[] = [];
  if (firstDaySolar) {
    const dow = getMondayBasedDOW(firstDaySolar.year, firstDaySolar.month, firstDaySolar.day);
    for (let i = 0; i < dow; i++) cells.push(null);
  }
  for (let d = 1; d <= monthLen; d++) cells.push(d);

  const handlePrev = () => {
    const n = adjacentLunarMonth(viewYear, viewMonth, viewIsLeap, -1);
    onNavigate(n.lunarYear, n.lunarMonth, n.isLeap);
  };

  const handleNext = () => {
    const n = adjacentLunarMonth(viewYear, viewMonth, viewIsLeap, 1);
    onNavigate(n.lunarYear, n.lunarMonth, n.isLeap);
  };

  const handleGoToday = () => {
    if (todayLunar) {
      onNavigate(todayLunar.lunarYear, todayLunar.lunarMonth, todayLunar.isLeap);
    }
  };

  const monthTitle = `${getChineseYearName(viewYear)} ${formatLunarMonth(viewMonth, viewIsLeap)}`;

  return (
    <div className="calendar">
      {/* ── Navigation ── */}
      <div className="cal-nav">
        <button className="cal-nav__btn" onClick={handlePrev} title="上一月">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="cal-nav__center">
          <span className="cal-nav__title">{monthTitle}</span>
          <button className="cal-nav__today" onClick={handleGoToday}>今天</button>
        </div>
        <button className="cal-nav__btn" onClick={handleNext} title="下一月">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Day-of-week header ── */}
      <div className="cal-dow">
        {DOW_LABELS.map((d, i) => (
          <div key={d} className={`cal-dow__cell${i >= 5 ? ' cal-dow__cell--weekend' : ''}`}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div className="cal-grid">
        {cells.map((lunarDay, idx) => {
          if (lunarDay === null) {
            return <div key={`pad-${idx}`} className="cal-cell cal-cell--empty" />;
          }

          const solar = lunarToSolar(viewYear, viewMonth, lunarDay, viewIsLeap);
          if (!solar) return null;

          const isToday =
            todayLunar?.lunarYear  === viewYear   &&
            todayLunar?.lunarMonth === viewMonth  &&
            todayLunar?.lunarDay   === lunarDay   &&
            todayLunar?.isLeap     === viewIsLeap;

          const isSelected =
            selected?.lunarYear  === viewYear   &&
            selected?.lunarMonth === viewMonth  &&
            selected?.lunarDay   === lunarDay   &&
            selected?.isLeap     === viewIsLeap;

          // idx mod 7 → column (0=Mon … 6=Sun), weekends at col 5,6
          const col = idx % 7;
          const isWeekend = col === 5 || col === 6;

          return (
            <DayCell
              key={lunarDay}
              lunarDay={lunarDay}
              solar={solar}
              isToday={isToday}
              isSelected={isSelected}
              isWeekend={isWeekend}
              onClick={() =>
                onSelect({
                  lunarYear: viewYear,
                  lunarMonth: viewMonth,
                  lunarDay,
                  isLeap: viewIsLeap,
                })
              }
            />
          );
        })}
      </div>

      {/* ── Month info ── */}
      <div className="cal-footer">
        <span>本月 {monthLen} 天</span>
        {todayLunar && (
          <span>
            今天：
            {formatLunarMonth(todayLunar.lunarMonth, todayLunar.isLeap)}
            {formatLunarDay(todayLunar.lunarDay)}
          </span>
        )}
      </div>
    </div>
  );
}
