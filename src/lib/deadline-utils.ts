/**
 * Utility functions for handling deadline conversions
 */

/**
 * Converts a text deadline to a date if possible, otherwise returns null
 * This is a temporary solution until the database field is changed to TEXT
 */
export function parseDeadlineToDate(deadline: string): string | null {
  if (!deadline || !deadline.trim()) {
    return null;
  }

  const cleanDeadline = deadline.trim().toLowerCase();

  // Try to parse common text formats to dates
  const now = new Date();
  
  // Handle "X weeks" format
  const weeksMatch = cleanDeadline.match(/(\d+)\s*weeks?/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + (weeks * 7));
    return futureDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  // Handle "X days" format
  const daysMatch = cleanDeadline.match(/(\d+)\s*days?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + days);
    return futureDate.toISOString().split('T')[0];
  }

  // Handle "X months" format
  const monthsMatch = cleanDeadline.match(/(\d+)\s*months?/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    const futureDate = new Date(now);
    futureDate.setMonth(now.getMonth() + months);
    return futureDate.toISOString().split('T')[0];
  }

  // Try to parse as a regular date
  try {
    const parsedDate = new Date(deadline);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
  } catch (error) {
    // Ignore parsing errors
  }

  // If we can't parse it, return null for now
  // This will be stored as NULL in the database until we change the field to TEXT
  return null;
}

/**
 * Formats a deadline for display
 */
export function formatDeadlineForDisplay(deadline: string | null): string {
  if (!deadline) {
    return 'Not specified';
  }

  // If it's a date string, format it nicely
  try {
    const date = new Date(deadline);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (error) {
    // If it's not a date, return as-is
  }

  return deadline;
}