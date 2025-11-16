// Holiday configuration
// Add holidays in YYYY-MM-DD format to skip auto-sessions

export const HOLIDAYS = [
  // 2024 Holidays (Example - Update with your actual holidays)
  "2024-01-26", // Republic Day
  "2024-08-15", // Independence Day
  "2024-10-02", // Gandhi Jayanti
  "2024-10-31", // Diwali
  "2024-12-25", // Christmas
  
  // 2025 Holidays (Update with your actual holidays)
  "2025-01-26", // Republic Day
  "2025-08-15", // Independence Day
  "2025-10-02", // Gandhi Jayanti
  "2025-12-25", // Christmas
];

// Check if today is a holiday
export const isTodayHoliday = () => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  return HOLIDAYS.includes(dateString);
};

// Check if a specific date is a holiday
export const isHoliday = (date) => {
  const dateString = date.toISOString().split('T')[0];
  return HOLIDAYS.includes(dateString);
};

// Get upcoming holidays
export const getUpcomingHolidays = (count = 5) => {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  return HOLIDAYS
    .filter(holiday => holiday >= todayString)
    .slice(0, count)
    .map(holiday => {
      const date = new Date(holiday);
      return {
        date: holiday,
        formatted: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      };
    });
};
