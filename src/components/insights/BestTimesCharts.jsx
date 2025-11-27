import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

function formatHourLabel(hour) {
  if (hour === null || hour === undefined) return "-";
  return `${String(hour).padStart(2, "0")}:00`;
}

function normalizeHours(hours = []) {
  return hours
    .filter((entry) => entry && typeof entry.hour === "number")
    .map((entry) => ({
      hour: entry.hour,
      label: formatHourLabel(entry.hour),
      value: Math.round(entry.avgLikes ?? entry.score ?? 0),
      posts: entry.posts ?? 0
    }));
}

const WEEKDAY_ORDER = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function normalizeDays(days = []) {
  const mapped = days.map((entry) => ({
    weekday: entry.weekday || entry.day || WEEKDAY_ORDER[entry.index] || "Unbekannt",
    value: Math.round(entry.score ?? entry.avgLikes ?? 0),
    posts: entry.posts ?? 0
  }));

  return WEEKDAY_ORDER.map((weekday) => mapped.find((d) => d.weekday === weekday) || { weekday, value: 0, posts: 0 });
}

function ChartCard({ title, subtitle, data, dataKey, labelKey, wrapperRef }) {
  if (!data.length) {
    return (
      <article className="insights-section">
        <header className="section-header">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </header>
        <div className="empty-state">Noch keine ausreichenden Daten für diese Auswertung.</div>
      </article>
    );
  }

  return (
    <article className="insights-section">
      <header className="section-header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </header>
      <div className="chart-wrapper" ref={wrapperRef}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="chart-grid" />
            <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
            <Tooltip wrapperClassName="insights-tooltip" />
            <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default function BestTimesCharts({ analysis, chartRefs = {} }) {
  const hourSource = analysis?.bestTimes?.hours || analysis?.bestPostingHours || [];
  const daySource = analysis?.bestDays?.days || analysis?.bestDaysOfWeek || [];
  const hourData = normalizeHours(hourSource);
  const dayData = normalizeDays(daySource);

  return (
    <div className="insights-chart-grid">
      <ChartCard
        title="Beste Upload-Stunden"
        subtitle="Basierend auf Ø Likes je Slot"
        data={hourData}
        dataKey="value"
        labelKey="label"
        wrapperRef={chartRefs.hoursRef}
      />
      <ChartCard
        title="Beste Upload-Tage"
        subtitle="Mo–So in chronologischer Reihenfolge"
        data={dayData}
        dataKey="value"
        labelKey="weekday"
        wrapperRef={chartRefs.daysRef}
      />
    </div>
  );
}

