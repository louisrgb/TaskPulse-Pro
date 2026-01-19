
export const formatDateISO = (date) => {
  return date.toISOString().split('T')[0];
};

export const getDaysOfWeek = (currentDate) => {
  const start = new Date(currentDate);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(start.setDate(diff));
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

export const isTaskVisibleOnDate = (task, targetDateStr) => {
  const targetDate = new Date(targetDateStr);
  const startDate = new Date(task.startDate);
  if (targetDate < startDate) return false;

  const targetDateOnly = targetDateStr;
  const startDateOnly = task.startDate;

  // Gebruik de Nederlandse labels uit types.js indirect door ze hier hardcoded te matchen met de staat
  if (task.frequency === 'Eenmalig') return startDateOnly === targetDateOnly;
  if (task.frequency === 'Dagelijks') return true;
  if (task.frequency === 'Wekelijks') return startDate.getDay() === targetDate.getDay();
  if (task.frequency === 'Maandelijks') return startDate.getDate() === targetDate.getDate();

  // Fallback voor oude data
  if (task.frequency === 'Once') return startDateOnly === targetDateOnly;
  if (task.frequency === 'Daily') return true;
  if (task.frequency === 'Weekly') return startDate.getDay() === targetDate.getDay();
  if (task.frequency === 'Monthly') return startDate.getDate() === targetDate.getDate();

  return false;
};
