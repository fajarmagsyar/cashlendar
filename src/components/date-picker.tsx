'use client';

import { useId, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { todayJakarta, validDate } from '@/lib/finance/dates';
import { Icon } from './icon';

type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max'> & {
  value?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  onChange?: (value: string) => void;
};

const dateLabel = (date: string) => new Intl.DateTimeFormat('en', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

export function DatePicker({ value, defaultValue = '', onChange, min = '1900-01-01', max = '9999-12-31', ...props }: DatePickerProps) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const today = todayJakarta();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selected = value ?? internalValue;
  const [month, setMonth] = useState((validDate(selected) ? selected : today).slice(0, 7));
  const [focusedDate, setFocusedDate] = useState(validDate(selected) ? selected : today);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [year, monthNumber] = month.split('-').map(Number);
  const leadingDays = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthTitle = new Intl.DateTimeFormat('en', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));

  function clamp(date: string) {
    return date < min ? min : date > max ? max : date;
  }

  function focusDate(date: string) {
    const next = clamp(date);
    setMonth(next.slice(0, 7));
    setFocusedDate(next);
    requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus());
  }

  function changeDate(date: string) {
    setInternalValue(date);
    onChange?.(date);
    panel.current?.hidePopover();
    trigger.current?.focus();
  }

  function toggle() {
    if (!panel.current) return;
    if (open) {
      panel.current.hidePopover();
      return;
    }
    if (!('showPopover' in panel.current)) {
      input.current?.showPicker();
      return;
    }
    const rect = trigger.current!.parentElement!.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    const height = Math.min(408, window.innerHeight - 24);
    panel.current.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    panel.current.style.top = `${Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - height - 12))}px`;
    panel.current.showPopover();
    focusDate(validDate(selected) ? selected : today);
  }

  function navigateMonth(offset: number) {
    const date = new Date(`${month}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + offset);
    focusDate(date.toISOString().slice(0, 10));
  }

  function handleDayKey(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in offsets) {
      event.preventDefault();
      const next = new Date(`${date}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + offsets[event.key]);
      const time = Math.max(new Date(`${min}T00:00:00Z`).getTime(), Math.min(next.getTime(), new Date(`${max}T00:00:00Z`).getTime()));
      focusDate(new Date(time).toISOString().slice(0, 10));
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusDate(`${month}-${event.key === 'Home' ? '01' : String(daysInMonth).padStart(2, '0')}`);
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      if (event.key === 'PageUp' && month > min.slice(0, 7)) navigateMonth(-1);
      if (event.key === 'PageDown' && month < max.slice(0, 7)) navigateMonth(1);
    }
  }

  return (
    <div className="date-control">
      <input {...props} ref={input} id={id} type="date" min={min} max={max} value={selected}
        onChange={event => { setInternalValue(event.target.value); onChange?.(event.target.value); }} />
      <button ref={trigger} type="button" className="date-trigger" aria-label="Open date picker"
        aria-expanded={open} aria-controls={`${id}-picker`} aria-haspopup="dialog" disabled={props.disabled} onClick={toggle}>
        <Icon name="calendar" size={19} />
      </button>
      <div ref={panel} id={`${id}-picker`} popover="auto" role="dialog" aria-label="Choose date" className="date-popover"
        onToggle={event => {
          setOpen(event.newState === 'open');
          if (event.newState === 'closed' && panel.current?.contains(document.activeElement)) trigger.current?.focus();
        }}>
        <div className="date-picker-heading">
          <button type="button" aria-label="Previous month" disabled={month <= min.slice(0, 7)} onClick={() => navigateMonth(-1)}><Icon name="left" size={16} /></button>
          <h3 aria-live="polite">{monthTitle}</h3>
          <button type="button" aria-label="Next month" disabled={month >= max.slice(0, 7)} onClick={() => navigateMonth(1)}><Icon name="right" size={16} /></button>
        </div>
        <div className="date-weekdays" aria-hidden="true">{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => <span key={day}>{day}</span>)}</div>
        <div className="date-days" role="group" aria-label="Calendar days">
          {Array.from({ length: leadingDays }, (_, index) => <span key={`blank-${index}`} />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const date = `${month}-${String(index + 1).padStart(2, '0')}`;
            return <button key={date} type="button" data-date={date} aria-label={dateLabel(date)}
              aria-pressed={date === selected} aria-current={date === today ? 'date' : undefined}
              tabIndex={date === focusedDate ? 0 : -1} disabled={date < min || date > max}
              onKeyDown={event => handleDayKey(event, date)} onClick={() => changeDate(date)}>{index + 1}</button>;
          })}
        </div>
        <div className="date-picker-footer">
          <button type="button" disabled={today < min || today > max} onClick={() => changeDate(today)}>Today</button>
          {!props.required && <button type="button" onClick={() => changeDate('')}>Clear date</button>}
          <button type="button" onClick={() => { panel.current?.hidePopover(); trigger.current?.focus(); }}>Done</button>
        </div>
      </div>
    </div>
  );
}
