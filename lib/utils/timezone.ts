import { toZonedTime, format as formatTz } from "date-fns-tz"
import { startOfDay, endOfDay, subDays, parseISO } from "date-fns"

export const TIMEZONE = "Asia/Tehran"

export function getTehranDate(date: Date | string): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return toZonedTime(dateObj, TIMEZONE)
}

export function getTehranStartOfDay(date: Date | string): Date {
  const tehranDate = getTehranDate(date)
  return startOfDay(tehranDate)
}

export function getTehranEndOfDay(date: Date | string): Date {
  const tehranDate = getTehranDate(date)
  return endOfDay(tehranDate)
}

export function formatTehranTime(date: Date | string, formatStr: string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return formatTz(dateObj, formatStr, { timeZone: TIMEZONE })
}

export function getLast7DaysRange() {
  const now = new Date()
  const tehranNow = getTehranDate(now)
  const endDate = getTehranEndOfDay(tehranNow)
  const startDate = getTehranStartOfDay(subDays(tehranNow, 6))

  return { startDate, endDate }
}
