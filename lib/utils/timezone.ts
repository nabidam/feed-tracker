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

export function formatPersianDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    calendar: "persian",
    timeZone: TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }
  return new Intl.DateTimeFormat("fa-IR", defaultOptions).format(dateObj)
}

export function formatPersianTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dateObj)
}

export function formatPersianDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return new Intl.DateTimeFormat("fa-IR", {
    calendar: "persian",
    timeZone: TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj)
}

export function formatPersianShortDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return new Intl.DateTimeFormat("fa-IR", {
    calendar: "persian",
    timeZone: TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj)
}

export function formatPersianWeekday(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: TIMEZONE,
    weekday: "long",
  }).format(dateObj)
}

export function getLast7DaysRange() {
  const now = new Date()
  const tehranNow = getTehranDate(now)
  const endDate = getTehranEndOfDay(tehranNow)
  const startDate = getTehranStartOfDay(subDays(tehranNow, 6))

  return { startDate, endDate }
}
