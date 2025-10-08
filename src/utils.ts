/**
 * Utility functions for the AgriMonitor system
 */

/**
 * Format Date object to YYYY/MM/DD HH:mm:ss string
 * @param date Date object to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}
