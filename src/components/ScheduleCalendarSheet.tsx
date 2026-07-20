'use client';

import { useState, useMemo } from 'react';
import Sheet from './Sheet';

interface DaySlot {
  date: Date;
  dayName: string;
  dateStr: string;
  weather: { icon: string; label: string; high: number; low: number; note?: string };
  availability: 'high' | 'medium' | 'low';
  isFriday: boolean;
}

const WEATHER_SEQUENCE = [
  { icon: '⛅', label: 'Partly Cloudy', high: 82, low: 65 },
  { icon: '☀️', label: 'Sunny', high: 86, low: 67 },
  { icon: '🌧️', label: 'Rainy', high: 72, low: 61, note: 'Rain likely — plan for delays' },
  { icon: '🌦️', label: 'Scattered Showers', high: 68, low: 58, note: 'Morning showers clearing by noon' },
  { icon: '☀️', label: 'Sunny', high: 88, low: 70 },
  { icon: '⛅', label: 'Partly Cloudy', high: 75, low: 60 },
  { icon: '☀️', label: 'Sunny', high: 80, low: 62 },
  { icon: '🌥️', label: 'Overcast', high: 74, low: 59 },
  { icon: '🥶', label: 'Cold & Windy', high: 46, low: 33, note: 'Cold front — freezing possible overnight' },
  { icon: '☀️', label: 'Sunny', high: 69, low: 50 },
];

const AVAILABILITY_BY_DOW: Record<number, 'high' | 'medium' | 'low'> = {
  1: 'medium', // Mon
  2: 'low',    // Tue
  3: 'medium', // Wed
  4: 'low',    // Thu
  5: 'high',   // Fri
};

function getNextWeekdays(): DaySlot[] {
  const slots: DaySlot[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1); // start tomorrow
  let weatherIdx = 0;

  while (slots.length < 10) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const w = WEATHER_SEQUENCE[weatherIdx % WEATHER_SEQUENCE.length];
      slots.push({
        date: new Date(cursor),
        dayName: cursor.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weather: w,
        availability: AVAILABILITY_BY_DOW[dow],
        isFriday: dow === 5,
      });
      weatherIdx++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

const AVAIL_CONFIG = {
  high:   { label: 'High Availability',   bg: 'bg-emerald-50 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-400',  border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  medium: { label: 'Medium Availability', bg: 'bg-amber-50 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-400',    border: 'border-amber-200 dark:border-amber-800',   dot: 'bg-amber-400'   },
  low:    { label: 'Low Availability',    bg: 'bg-gray-50 dark:bg-neutral-800',     text: 'text-gray-500 dark:text-neutral-400',     border: 'border-gray-200 dark:border-neutral-700',    dot: 'bg-gray-400'    },
};

interface ScheduleCalendarSheetProps {
  onClose: () => void;
  onConfirm?: (date: string) => void;
}

export default function ScheduleCalendarSheet({ onClose, onConfirm }: ScheduleCalendarSheetProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const days = useMemo(getNextWeekdays, []);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => { onConfirm?.(days[selected!].dateStr); onClose(); }, 1800);
  };

  const header = (
    <>
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-neutral-800">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="font-bold text-gray-900 dark:text-white text-base">Schedule a Crew</div>
          <div className="text-xs text-gray-400 dark:text-neutral-500">Select your preferred work date</div>
        </div>
      </div>

      {/* Promo banner */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-[hsl(25,100%,97%)] dark:bg-neutral-800 border border-[hsl(25,100%,85%)] dark:border-[hsl(25,100%,30%)]">
        <p className="text-xs text-[hsl(25,100%,40%)] dark:text-[hsl(25,100%,65%)] font-medium">
          Friday bookings receive a <strong>5% discount</strong> — AWP has high crew availability on Fridays.
        </p>
      </div>
    </>
  );

  const footer = selected !== null && !confirmed ? (
    <div className="px-4 pb-safe pb-6 pt-3 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800">
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full py-3.5 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-sm"
      >
        Confirm: {days[selected].dayName}, {days[selected].dateStr}
        {days[selected].isFriday && ' — 5% discount applied'}
      </button>
    </div>
  ) : confirmed ? (
    <div className="px-4 pb-safe pb-6 pt-3 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800">
      <div className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm text-center">
        Crew Scheduled for {days[selected!].dayName}, {days[selected!].dateStr}
      </div>
    </div>
  ) : undefined;

  return (
    <Sheet onClose={onClose} maxHeight="92vh" zIndexClass="z-50" header={header} footer={footer}>
      {/* Day list */}
      <div className="px-4 py-3 space-y-2">
        {days.map((day, i) => {
          const avail = AVAIL_CONFIG[day.availability];
          const isSelected = selected === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                isSelected
                  ? 'border-[hsl(25,100%,50%)] bg-[hsl(25,100%,97%)] dark:bg-neutral-800'
                  : day.isFriday
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Date column */}
                <div className="w-14 shrink-0 text-center">
                  <div className={`text-xs font-bold uppercase tracking-wide ${day.isFriday ? 'text-[hsl(25,100%,50%)]' : 'text-gray-500 dark:text-neutral-400'}`}>
                    {day.dayName}
                  </div>
                  <div className={`text-base font-bold mt-0.5 ${isSelected ? 'text-[hsl(25,100%,50%)]' : 'text-gray-900 dark:text-white'}`}>
                    {day.dateStr.split(' ')[1]}
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-neutral-500">{day.dateStr.split(' ')[0]}</div>
                </div>

                {/* Weather + availability */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{day.weather.icon}</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">{day.weather.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                    H {day.weather.high}° · L {day.weather.low}°
                  </div>
                  {day.weather.note && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">{day.weather.note}</div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${avail.bg} ${avail.text} ${avail.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
                    {day.availability === 'high' ? 'High' : day.availability === 'medium' ? 'Medium' : 'Low'}
                  </span>
                  {day.isFriday && (
                    <span className="text-[10px] font-bold text-[hsl(25,100%,50%)] bg-[hsl(25,100%,95%)] dark:bg-[hsl(25,100%,20%)] border border-[hsl(25,100%,80%)] dark:border-[hsl(25,100%,35%)] px-2 py-0.5 rounded-full">
                      5% OFF
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
