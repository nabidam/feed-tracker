"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { BarChart3, Calendar, Droplets, Clock, X } from "lucide-react"
import { format, startOfDay, isToday, isYesterday, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface FeedingEntry {
  id: string
  amount: number
  timestamp: string
}

interface DailyTotal {
  date: string
  total: number
  count: number
  entries: FeedingEntry[]
}

export function FeedingOverview() {
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([])
  const { toast } = useToast()

  const loadFeedingData = () => {
    const existingEntries = localStorage.getItem("feedingEntries")
    const entries: FeedingEntry[] = existingEntries ? JSON.parse(existingEntries) : []

    const grouped = entries.reduce(
      (acc, entry) => {
        const date = format(startOfDay(parseISO(entry.timestamp)), "yyyy-MM-dd")

        if (!acc[date]) {
          acc[date] = {
            date,
            total: 0,
            count: 0,
            entries: [],
          }
        }

        acc[date].total += entry.amount
        acc[date].count += 1
        acc[date].entries.push(entry)

        return acc
      },
      {} as Record<string, DailyTotal>,
    )

    const totals = Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setDailyTotals(totals)
  }

  const handleDeleteEntry = (entryId: string) => {
    const existingEntries = localStorage.getItem("feedingEntries")
    const entries: FeedingEntry[] = existingEntries ? JSON.parse(existingEntries) : []

    const filteredEntries = entries.filter((entry) => entry.id !== entryId)
    localStorage.setItem("feedingEntries", JSON.stringify(filteredEntries))

    loadFeedingData()
    window.dispatchEvent(new Event("feedingUpdated"))

    toast({
      title: "Entry removed",
      description: "Feeding entry has been deleted",
    })
  }

  useEffect(() => {
    loadFeedingData()

    window.addEventListener("feedingUpdated", loadFeedingData)

    return () => {
      window.removeEventListener("feedingUpdated", loadFeedingData)
    }
  }, [])

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMM d, yyyy")
  }

  const todayTotal = dailyTotals.find((d) => isToday(parseISO(d.date)))

  return (
    <div className="space-y-4">
      {todayTotal && (
        <Card className="overflow-hidden border-border bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">Today's Total</h2>
            </div>

            <div className="flex items-end gap-2">
              <div className="text-5xl font-bold text-primary">{todayTotal.total}</div>
              <div className="mb-2 text-xl text-muted-foreground">ml</div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Droplets className="h-4 w-4" />
                <span>{todayTotal.count} feedings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Avg {Math.round(todayTotal.total / todayTotal.count)}ml</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-border bg-card">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">History</h2>
          </div>

          {dailyTotals.length === 0 ? (
            <div className="py-12 text-center">
              <Droplets className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">No feedings logged yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Tap a cup above to start tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyTotals.map((day) => (
                <div
                  key={day.date}
                  className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-card-foreground">{getDateLabel(day.date)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {day.count} feeding{day.count !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{day.total}</div>
                      <div className="text-xs text-muted-foreground">ml</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {day.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="group relative rounded-lg bg-background/50 px-3 py-1.5 text-xs transition-all hover:bg-background/70"
                      >
                        <span className="font-medium text-card-foreground">{entry.amount}ml</span>
                        <span className="ml-1.5 text-muted-foreground">
                          {format(parseISO(entry.timestamp), "h:mm a")}
                        </span>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Delete entry"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
