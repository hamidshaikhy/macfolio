import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { preferenceStorage } from "../lib/storage";

type CalendarEvent = { id: string; title: string; date: string; time: string; color: string };
export const useCalendar = create<{
  events: CalendarEvent[];
  add: (event: CalendarEvent) => void;
  remove: (id: string) => void;
}>()(persist(set => ({
  events: [],
  add: event => set(s => ({ events: [...s.events, event] })),
  remove: id => set(s => ({ events: s.events.filter(e => e.id !== id) })),
}), { name: "macfolio.calendar.v1", storage: createJSONStorage(() => preferenceStorage) }));

const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Calendar() {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState("Month");
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(dateKey(today));
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [color, setColor] = useState("#ff4562");
  const calendar = useCalendar();
  const first = new Date(month);
  first.setDate(1 - (month.getDay() + 6) % 7);
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(first);
    day.setDate(first.getDate() + i);
    return day;
  });
  const visibleEvents = calendar.events.filter(e => e.date.startsWith(dateKey(month).slice(0, 7)))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  function newEvent(key: string) {
    setDate(key);
    setTitle("");
    setEditing(true);
  }

  return <div className="calendar-app">
    <header className="calendar-toolbar">
      <h2>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
      <div className="calendar-navigation">
        <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
        <button onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
        <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
      </div>
      <div className="calendar-views">{["Month", "List"].map(v => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{v}</button>)}</div>
      <button className="calendar-new" onClick={() => newEvent(dateKey(today))}><Plus size={16} /> New Event</button>
    </header>
    {view === "Month" ? <>
      <div className="calendar-weekdays">{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(day => <span key={day}>{day}</span>)}</div>
      <div className="calendar-month-grid">{days.map(day => {
        const key = dateKey(day);
        return <div key={key} className={`calendar-cell ${day.getMonth() !== month.getMonth() ? "outside" : ""} ${key === dateKey(today) ? "is-today" : ""}`}>
          <button className="calendar-day-area" aria-label={`Add event on ${key}`} onClick={() => newEvent(key)}><span className="calendar-date">{day.getDate()}</span></button>
          {calendar.events.filter(e => e.date === key).sort((a, b) => a.time.localeCompare(b.time)).map(event => (
            <div className="calendar-event" key={event.id} style={{ borderColor: event.color, background: `${event.color}25` }}>
              <span title={event.title}>{event.time} {event.title}</span>
              <button aria-label={`Delete ${event.title}`} onClick={() => calendar.remove(event.id)}><X size={12} /></button>
            </div>
          ))}
        </div>;
      })}</div>
    </> : <div className="calendar-event-list">
      {visibleEvents.length ? visibleEvents.map(event => <div key={event.id}>
        <span style={{ color: event.color }}>{event.date} / {event.time}</span><strong>{event.title}</strong>
        <button aria-label={`Delete ${event.title}`} onClick={() => calendar.remove(event.id)}><Trash2 size={17} /></button>
      </div>) : <div className="calendar-empty"><h3>A little room for something new.</h3><p>No events this month. Add your first plan.</p></div>}
    </div>}
    {editing && <div className="calendar-form-backdrop" onKeyDown={e => { if (e.key === "Escape") setEditing(false); }}>
      <form className="calendar-event-form" aria-label="New event" onSubmit={e => {
        e.preventDefault();
        if (!title.trim()) return;
        calendar.add({ id: crypto.randomUUID(), title: title.trim(), date, time, color });
        setEditing(false);
      }}>
        <header><h3>New event</h3><button type="button" aria-label="Cancel event" onClick={() => setEditing(false)}><X size={18} /></button></header>
        <label>Title<input autoFocus required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="What is the plan?" /></label>
        <div><label>Date<input required type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label>Time<input required type="time" value={time} onChange={e => setTime(e.target.value)} /></label></div>
        <label>Color<input type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
        <button className="calendar-new" type="submit">Add event</button><small>Saved in this browser.</small>
      </form>
    </div>}
  </div>;
}
