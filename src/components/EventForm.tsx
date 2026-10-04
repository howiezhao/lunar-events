import { useState, useEffect } from 'react';
import {
  lunarToSolar,
  leapMonthExists,
  formatLunarMonth,
  formatLunarDay,
  formatSolarDate,
  CN_MONTHS,
  LunarDate,
  LunarEvent,
} from '../lunar';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EventFormProps {
  /** Pre-selected date from the calendar (null if nothing selected) */
  selectedDate: LunarDate | null;
  onAdd: (event: LunarEvent) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 2000;
const MAX_YEAR = 2060;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function EventForm({ selectedDate, onAdd }: EventFormProps) {
  const [name, setName]           = useState('');
  const [month, setMonth]         = useState(1);
  const [day, setDay]             = useState(1);
  const [isLeap, setIsLeap]       = useState(false);
  const [startYear, setStartYear] = useState(CURRENT_YEAR);
  const [endYear, setEndYear]     = useState(CURRENT_YEAR + 20);
  const [error, setError]         = useState<string | null>(null);

  // When the calendar selection changes, sync form fields
  useEffect(() => {
    if (selectedDate) {
      setMonth(selectedDate.lunarMonth);
      setDay(selectedDate.lunarDay);
      setIsLeap(selectedDate.isLeap);
      setError(null);
    }
  }, [selectedDate]);

  // Reset leap flag if the new month has no leap this year
  const handleMonthChange = (m: number) => {
    setMonth(m);
    if (isLeap && !leapMonthExists(CURRENT_YEAR, m)) setIsLeap(false);
    setError(null);
  };

  // Compute preview: first 5 solar dates within the range
  const previewDates: string[] = [];
  for (let y = startYear; y <= endYear && previewDates.length < 5; y++) {
    const s = lunarToSolar(y, month, day, isLeap);
    if (s) previewDates.push(`${s.year}-${String(s.month).padStart(2,'0')}-${String(s.day).padStart(2,'0')}`);
  }

  const hasLeapOption = leapMonthExists(CURRENT_YEAR, month) ||
    leapMonthExists(CURRENT_YEAR + 1, month) ||
    leapMonthExists(CURRENT_YEAR - 1, month);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('请输入活动名称'); return; }
    if (startYear > endYear) { setError('开始年份不能晚于结束年份'); return; }
    if (startYear < MIN_YEAR || endYear > MAX_YEAR) {
      setError(`年份范围需在 ${MIN_YEAR}–${MAX_YEAR} 之间`);
      return;
    }

    // Validate: at least one year produces a valid date
    let found = false;
    for (let y = startYear; y <= Math.min(endYear, startYear + 10); y++) {
      if (lunarToSolar(y, month, day, isLeap)) { found = true; break; }
    }
    if (!found) {
      setError(
        isLeap
          ? '所选闰月在该年份范围内不存在，请取消"闰月"或更换月份'
          : `农历${CN_MONTHS[month-1]}月不足 ${day} 天，请选择较小的日期`,
      );
      return;
    }

    onAdd({
      id: Date.now().toString(),
      name: name.trim(),
      lunarMonth: month,
      lunarDay: day,
      isLeapMonth: isLeap,
      startYear,
      endYear,
    });
    setName('');
    setError(null);
  };

  const selectedLabel = selectedDate
    ? `${formatLunarMonth(selectedDate.lunarMonth, selectedDate.isLeap)}${formatLunarDay(selectedDate.lunarDay)} · ${formatSolarDate(lunarToSolar(selectedDate.lunarYear, selectedDate.lunarMonth, selectedDate.lunarDay, selectedDate.isLeap) ?? { year: 0, month: 0, day: 0 })}`
    : null;

  return (
    <form className="event-form" onSubmit={handleSubmit} noValidate>
      <h2 className="section-title">新建活动</h2>

      {/* Calendar selection hint */}
      {selectedLabel ? (
        <div className="form-hint form-hint--selected">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          已选择：{selectedLabel}
        </div>
      ) : (
        <div className="form-hint">点击左侧日历选择日期，或手动填写下方表单</div>
      )}

      {/* Name */}
      <div className="form-group">
        <label className="form-label">活动名称</label>
        <input
          className="form-input"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例：外婆生日、清明祭祖、中秋家宴"
          maxLength={50}
        />
      </div>

      {/* Lunar date */}
      <div className="form-group">
        <label className="form-label">农历日期</label>
        <div className="form-row">
          <select
            className="form-select"
            value={month}
            onChange={e => handleMonthChange(Number(e.target.value))}
          >
            {CN_MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{i + 1} 月（{m}月）</option>
            ))}
          </select>
          <select
            className="form-select"
            value={day}
            onChange={e => { setDay(Number(e.target.value)); setError(null); }}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i} value={i + 1}>{i + 1} 日</option>
            ))}
          </select>
        </div>
        {hasLeapOption && (
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={isLeap}
              onChange={e => setIsLeap(e.target.checked)}
            />
            <span>闰月（约每 2–3 年出现一次）</span>
          </label>
        )}
      </div>

      {/* Year range */}
      <div className="form-group">
        <label className="form-label">生成年份范围</label>
        <div className="form-row form-row--year">
          <div className="form-year-field">
            <span className="form-year-label">从</span>
            <input
              className="form-input form-input--year"
              type="number"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={startYear}
              onChange={e => setStartYear(Number(e.target.value))}
            />
          </div>
          <div className="form-year-field">
            <span className="form-year-label">到</span>
            <input
              className="form-input form-input--year"
              type="number"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={endYear}
              onChange={e => setEndYear(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Preview dates */}
      {previewDates.length > 0 && (
        <div className="form-group">
          <label className="form-label">公历日期预览</label>
          <div className="form-preview">
            {previewDates.map(d => (
              <span key={d} className="form-preview__date">{d}</span>
            ))}
            {previewDates.length === 5 && <span className="form-preview__more">…</span>}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="form-error">{error}</p>}

      <button className="btn btn--primary btn--full" type="submit">
        添加活动
      </button>
    </form>
  );
}
