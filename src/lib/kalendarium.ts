interface KalendariumEvent {
  holliday: boolean;
  danishLong: string;
  danishShort: string;
}

interface KalendariumResponse {
  holliday: boolean; // unreliable — do not use directly
  events: KalendariumEvent[];
}

// Module-level cache: date string → result (lives for the process lifetime)
const cache = new Map<string, { holiday: boolean; name?: string }>();

/**
 * Check whether a given date is a Danish public holiday via the Kalendarium API.
 * @param dateStr  Date in YYYY-MM-DD format
 */
export async function isPublicHoliday(
  dateStr: string
): Promise<{ holiday: boolean; name?: string }> {
  if (cache.has(dateStr)) {
    return cache.get(dateStr)!;
  }

  // API expects DD-MM-YYYY
  const [year, month, day] = dateStr.split("-");
  const apiDate = `${day}-${month}-${year}`;

  try {
    const res = await fetch(`https://api.kalendarium.dk/Dayinfo/${apiDate}`, {
      next: { revalidate: 3600 }, // cache for 1 hour at the Next.js layer too
    });

    if (!res.ok) {
      // Fail open — don't block the status check if the API is down
      console.error(`Kalendarium API error: ${res.status} for ${apiDate}`);
      return { holiday: false };
    }

    const data: KalendariumResponse = await res.json();

    // The top-level `holliday` field is unreliable.
    // The source of truth is whether any event in the events array has holliday: true.
    const holidayEvent = data.events?.find((e) => e.holliday === true);
    const result: { holiday: boolean; name?: string } = holidayEvent
      ? { holiday: true, name: holidayEvent.danishLong }
      : { holiday: false };

    cache.set(dateStr, result);
    return result;
  } catch (err) {
    console.error(`Kalendarium fetch failed for ${apiDate}:`, err);
    // Fail open — if we can't reach the API we don't want to block the status
    return { holiday: false };
  }
}
