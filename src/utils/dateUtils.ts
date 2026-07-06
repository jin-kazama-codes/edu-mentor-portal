/**
 * Checks if a meeting link should be active (within 10 minutes of the start time or already in progress/past).
 * @param dateStr ISO date string (yyyy-mm-dd)
 * @param timeStr Time slot string (e.g. "04:00 PM - 05:00 PM")
 */
export function isMeetingLinkActive(dateStr: string, timeStr: string): boolean {
  try {
    // 1. Extract the start time string, e.g. "04:00 PM" from "04:00 PM - 05:00 PM"
    const startTimePart = timeStr.split('-')[0].trim(); // "04:00 PM"
    
    // 2. Parse date and time into a single Date object
    const [year, month, day] = dateStr.split('-').map(Number);
    
    const timeMatch = startTimePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return true; // Fallback if format is unexpected
    
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const ampm = timeMatch[3].toUpperCase();
    
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    const sessionStartDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // 3. Compare with current time
    const now = new Date();
    const timeDiffMs = sessionStartDate.getTime() - now.getTime();
    
    // Active if starts in <= 10 minutes or has already started (timeDiffMs is negative)
    return timeDiffMs <= 10 * 60 * 1000;
  } catch (e) {
    console.error('Error parsing meeting link active state:', e);
    return true; // Fallback to active if parsing fails
  }
}
