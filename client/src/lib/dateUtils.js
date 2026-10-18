/**
 * Date formatting utilities for the UCV Community platform.
 * Formats dates in standard university DD Month YYYY format (e.g., "16 October 2026").
 */

export function formatWallDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
