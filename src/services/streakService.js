const SOLVED_DATES_KEY = 'dailySolvedDates';

const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDates = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(SOLVED_DATES_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw)].sort();
  } catch (_) {
    return [];
  }
};

const saveDates = (dates) => {
  localStorage.setItem(SOLVED_DATES_KEY, JSON.stringify([...new Set(dates)].sort()));
};

const dayDiff = (a, b) => {
  const d1 = new Date(`${a}T00:00:00`);
  const d2 = new Date(`${b}T00:00:00`);
  return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
};

export const getDailyStreakStats = () => {
  const dates = parseDates();
  if (!dates.length) return { currentStreak: 0, bestStreak: 0, solvedToday: false };

  let best = 1;
  let running = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dayDiff(dates[i - 1], dates[i]) === 1) {
      running += 1;
      if (running > best) best = running;
    } else {
      running = 1;
    }
  }

  const today = toDateKey(new Date());
  const yesterday = toDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const solvedToday = dates.includes(today);
  let current = 0;

  if (solvedToday) {
    current = 1;
    let cursor = today;
    while (true) {
      const prev = toDateKey(new Date(new Date(`${cursor}T00:00:00`).getTime() - 24 * 60 * 60 * 1000));
      if (!dates.includes(prev)) break;
      current += 1;
      cursor = prev;
    }
  } else if (dates.includes(yesterday)) {
    current = 0;
  }

  return { currentStreak: current, bestStreak: best, solvedToday };
};

export const markDailySolve = () => {
  const dates = parseDates();
  const today = toDateKey(new Date());
  if (!dates.includes(today)) {
    dates.push(today);
    saveDates(dates);
  }
  return getDailyStreakStats();
};

