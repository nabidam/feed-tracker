"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { BarChart3, Calendar, Droplets, Clock, X, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { getTehranDate, getTehranStartOfDay, formatPersianTime, formatPersianShortDate } from "@/lib/utils/timezone"
import type { Feeding } from "@/lib/types"
import { getCachedFeedings, addPendingFeeding, removeFromCachedFeedings } from "@/lib/offline-storage"

interface DailyTotal {
  date: string
  total: number
  count: number
  entries: Feeding[]
}

export function FeedingOverview() {
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadFeedingData = async () => {
    if (!navigator.onLine) {
      // Load from cache when offline
      const cachedEntries = getCachedFeedings()
      processEntries(cachedEntries)
      return
    }

    const supabase = createClient()

    const { data: entries, error } = await supabase
      .from("feedings")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading feedings:", error)
      const cachedEntries = getCachedFeedings()
      processEntries(cachedEntries)
      return
    }

    processEntries(entries || [])
  }

  const processEntries = (entries: Feeding[]) => {
    if (!entries || entries.length === 0) {
      setDailyTotals([])
      return
    }

    const grouped = entries.reduce(
      (acc, entry) => {
        const tehranDate = getTehranDate(entry.created_at)
        const date = format(getTehranStartOfDay(tehranDate), "yyyy-MM-dd")

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

  const handleDeleteEntry = async (entryId: string) => {
    if (deletingId) return

    setDeletingId(entryId)

    if (!navigator.onLine) {
      const entry = dailyTotals.flatMap((d) => d.entries).find((e) => e.id === entryId)

      if (entry) {
        await addPendingFeeding(entry, "delete")
        removeFromCachedFeedings(entryId)
      }

      setTimeout(() => {
        loadFeedingData()
        window.dispatchEvent(new Event("feedingUpdated"))
        setDeletingId(null)

        toast({
          title: "Entry removed (offline)",
          description: "Will sync when online",
        })
      }, 300)
      return
    }

    const supabase = createClient()

    const { error } = await supabase.from("feedings").delete().eq("id", entryId)

    if (error) {
      console.error("[v0] Error deleting feeding:", error)
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      })
      setDeletingId(null)
      return
    }

    setTimeout(() => {
      loadFeedingData()
      window.dispatchEvent(new Event("feedingUpdated"))
      setDeletingId(null)

      toast({
        title: "Entry removed",
        description: "Feeding entry has been deleted",
      })
    }, 300)
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
    const tehranNow = getTehranDate(new Date())
    const tehranDate = getTehranDate(date)

    if (format(tehranDate, "yyyy-MM-dd") === format(getTehranStartOfDay(tehranNow), "yyyy-MM-dd")) {
      return "امروز" // Today in Persian
    }

    const yesterday = new Date(tehranNow)
    yesterday.setDate(yesterday.getDate() - 1)
    if (format(tehranDate, "yyyy-MM-dd") === format(getTehranStartOfDay(yesterday), "yyyy-MM-dd")) {
      return "دیروز" // Yesterday in Persian
    }

    return formatPersianShortDate(tehranDate)
  }

  const tehranNow = getTehranDate(new Date())
  const todayKey = format(getTehranStartOfDay(tehranNow), "yyyy-MM-dd")
  const todayTotal = dailyTotals.find((d) => d.date === todayKey)

  return (
    <div className="space-y-4">
      {todayTotal && (
        <Card className="overflow-hidden border-border bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">{"امروز کل"}</h2>{" "}
              {/* Today's Total in Persian */}
            </div>

            <div className="flex items-end gap-2">
              <div className="text-5xl font-bold text-primary">{todayTotal.total}</div>
              <div className="mb-2 text-xl text-muted-foreground">ml</div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Droplets className="h-4 w-4" />
                <span>{todayTotal.count} تغذیه‌ها</span> {/* Feedings in Persian */}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>میانگین {Math.round(todayTotal.total / todayTotal.count)}ml</span> {/* Average in Persian */}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-border bg-card">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">تاریخچه</h2> {/* History in Persian */}
          </div>

          {dailyTotals.length === 0 ? (
            <div className="py-12 text-center">
              <Droplets className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">هنوز تغذیه‌ای ثبت نشده است</p>{" "}
              {/* No feedings logged yet in Persian */}
              <p className="mt-1 text-xs text-muted-foreground">بر روی یک میز بالا کلیک کنید تا ردیابی شروع کنید</p>{" "}
              {/* Tap a cup above to start tracking in Persian */}
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
                        {day.count} تغذیه‌{day.count !== 1 ? "ها" : ""} {/* Feedings in Persian */}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{day.total}</div>
                      <div className="text-xs text-muted-foreground">ml</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {day.entries.map((entry) => {
                      const isDeleting = deletingId === entry.id

                      return (
                        <div
                          key={entry.id}
                          className={`
                            group relative rounded-lg bg-background/50 px-3 py-1.5 text-xs transition-all
                            ${isDeleting ? "opacity-50 scale-95" : "hover:bg-background/70"}
                          `}
                        >
                          <span className="font-medium text-card-foreground">{entry.amount}ml</span>
                          <span className="ml-1.5 text-muted-foreground">{formatPersianTime(entry.created_at)}</span>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            disabled={isDeleting}
                            className={`
                              absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full 
                              bg-destructive text-destructive-foreground transition-all
                              ${isDeleting ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                            `}
                            aria-label="Delete entry"
                          >
                            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          </button>
                        </div>
                      )
                    })}
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
