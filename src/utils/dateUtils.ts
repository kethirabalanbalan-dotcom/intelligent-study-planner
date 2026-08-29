export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatLongDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function getDayOfWeekName(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function getDayOfWeekKey(dateStr: string): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const day = d.getDay(); // 0 is Sunday
  const map: Record<number, 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };
  return map[day] || 'monday';
}

export function differenceInDays(targetDateStr: string, fromDateStr: string): number {
  const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number);
  const [fYear, fMonth, fDay] = fromDateStr.split('-').map(Number);
  const t = new Date(tYear, tMonth - 1, tDay).getTime();
  const f = new Date(fYear, fMonth - 1, fDay).getTime();
  const diff = Math.round((t - f) / (1000 * 60 * 60 * 24));
  return diff;
}

export function addDaysToDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTime12h(totalMinutesFromMidnight: number): string {
  const totalMin = Math.max(0, Math.floor(totalMinutesFromMidnight));
  let hours = Math.floor(totalMin / 60) % 24;
  const minutes = totalMin % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minStr = String(minutes).padStart(2, '0');
  return `${hours}:${minStr} ${ampm}`;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 9 * 60; // 9 AM default
  const trimmed = timeStr.trim();
  
  // Check if contains AM/PM
  if (/am|pm/i.test(trimmed)) {
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const isPm = match[3].toLowerCase() === 'pm';
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
  }

  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }
  return 9 * 60;
}

export function formatMinutesTo24h(totalMinutes: number): string {
  const mins = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return '';
  if (/am|pm/i.test(timeStr)) return timeStr;
  const mins = parseTimeToMinutes(timeStr);
  return formatTime12h(mins);
}

