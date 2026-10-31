import { LunarEvent, formatLunarMonth, formatLunarDay } from '../lunar';
import { buildICS, countOccurrences, triggerDownload } from '../ics';
import { formatCoordinates, locationMapUrl, normalizeLocation } from '../geo';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EventListProps {
  events: LunarEvent[];
  onDelete: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// EventCard
// ─────────────────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: LunarEvent;
  onDelete: (id: string) => void;
}

function EventCard({ event, onDelete }: EventCardProps) {
  const lunarLabel = formatLunarMonth(event.lunarMonth, event.isLeapMonth) +
    formatLunarDay(event.lunarDay);

  const location = normalizeLocation(event.location);
  const mapUrl = location ? locationMapUrl(location) : null;
  const coordLabel = location?.coordinates
    ? formatCoordinates(location.coordinates.latitude, location.coordinates.longitude)
    : '';
  const locationLabel = location
    ? location.name && coordLabel
      ? `${location.name} · ${coordLabel}`
      : location.name || coordLabel
    : '';

  const occurrences = countOccurrences(event);

  const handleDownload = () => {
    const ics = buildICS([event]);
    const safeName = event.name.replace(/[^\w\u4e00-\u9fa5]+/g, '_');
    triggerDownload(`${safeName}.ics`, ics);
  };

  return (
    <div className="event-card">
      <div className="event-card__body">
        <div className="event-card__name">{event.name}</div>
        {locationLabel && mapUrl && (
          <div className="event-card__location">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1.4a3.8 3.8 0 0 0-3.8 3.8c0 2.7 3.8 6.9 3.8 6.9s3.8-4.2 3.8-6.9A3.8 3.8 0 0 0 7 1.4z" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="7" cy="5.2" r="1.15" fill="currentColor"/>
            </svg>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="在高德地图中打开"
            >
              {locationLabel}
            </a>
          </div>
        )}
        <div className="event-card__meta">
          <span className="event-card__badge">{lunarLabel}</span>
          <span className="event-card__range">
            {event.startYear}–{event.endYear} 年
          </span>
          <span className="event-card__count">{occurrences} 次</span>
        </div>
      </div>
      <div className="event-card__actions">
        <button
          className="btn btn--secondary btn--sm"
          onClick={handleDownload}
          title="下载此活动的 ICS 文件"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v7M4 7l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          ICS
        </button>
        <button
          className="btn btn--ghost btn--sm btn--danger"
          onClick={() => onDelete(event.id)}
          title="删除此活动"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EventList
// ─────────────────────────────────────────────────────────────────────────────

export default function EventList({ events, onDelete }: EventListProps) {
  const handleDownloadAll = () => {
    const ics = buildICS(events);
    triggerDownload('lunar-events.ics', ics);
  };

  return (
    <div className="event-list">
      <div className="event-list__header">
        <h2 className="section-title">已创建活动</h2>
        {events.length > 0 && (
          <button className="btn btn--secondary" onClick={handleDownloadAll}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v7M4 7l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            下载全部 ICS
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="event-list__empty">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="6" y="8" width="28" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6 14h28M13 5v6M27 5v6M13 21h6M13 27h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p>暂无活动</p>
          <p className="event-list__empty-hint">点击日历选择日期，填写名称后添加</p>
        </div>
      ) : (
        <div className="event-list__items">
          {events.map(ev => (
            <EventCard key={ev.id} event={ev} onDelete={onDelete} />
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="event-list__footer">
          <p className="event-list__tip">
            下载 ICS 文件后，在 Google 日历或 Apple 日历中选择「导入」即可添加所有活动。每个活动对应准确的公历日期。填写了地理位置的活动会带上地点；有经纬度时，Apple 日历可在地图中显示。
          </p>
        </div>
      )}
    </div>
  );
}
