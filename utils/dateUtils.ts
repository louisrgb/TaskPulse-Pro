
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDaysOfWeek = (currentDate: Date): Date[] => {
  const start = new Date(currentDate);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  const monday = new Date(start.setDate(diff));
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

export const isTaskVisibleOnDate = (task: any, targetDateStr: string): boolean => {
  const targetDate = new Date(targetDateStr);
  const startDate = new Date(task.startDate);
  
  if (targetDate < startDate) return false;

  if (task.frequency === 'Once') {
    return formatDateISO(startDate) === targetDateStr;
  }

  if (task.frequency === 'Daily') {
    return true;
  }

  if (task.frequency === 'Weekly') {
    return startDate.getDay() === targetDate.getDay();
  }

  if (task.frequency === 'Monthly') {
    return startDate.getDate() === targetDate.getDate();
  }

  return false;
};
