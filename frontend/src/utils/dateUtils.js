/**
 * Date and time utility functions
 */

/**
 * Format a date-time string to localized format
 * @param {String} dateTimeStr - The date-time string to format
 * @return {String} Formatted date-time string
 */
export const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  
  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateTimeStr);
      return dateTimeStr; // Return the original string if it's not a valid date
    }
    
    // Format the date using Intl.DateTimeFormat for better localization support
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateTimeStr;
  }
};

/**
 * Parse a formatted date-time string back to a Date object
 * @param {String} formattedDateTime - The formatted date-time string
 * @return {Date} Date object
 */
export const parseFormattedDateTime = (formattedDateTime) => {
  if (!formattedDateTime) return null;
  
  try {
    // Remove any non-essential characters and keep only digits, dashes, colons and spaces
    const cleanedStr = formattedDateTime.replace(/[^0-9\-: ]/g, '');
    return new Date(cleanedStr);
  } catch (error) {
    console.error('Error parsing formatted date:', error);
    return null;
  }
}; 