"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { format, eachDayOfInterval, subDays, addDays, isSameDay } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { getTehranDate, getLast7DaysRange, TIMEZONE, formatPersianShortDate } from "@/lib/utils/timezone"

interface HeatmapData {
  date: string
  hour: number
  amount: number
  count: number
}

export function FeedingHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [dateRange, setDateRange] = useState(() => getLast7DaysRange())
  const [isLoading, setIsLoading] = useState(true)

  const loadHeatmapData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: entries, error } = await supabase
      .from("feedings")
      .select("*")
      .gte("created_at", dateRange.startDate.toISOString())
      .lte("created_at", dateRange.endDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error loading heatmap data:", error)
      setIsLoading(false)
      return
    }

    if (!entries) {
      setHeatmapData([])
      setIsLoading(false)
      return
    }

    const grouped: Record<string, HeatmapData> = {}

    entries.forEach((entry) => {
      const tehranDate = getTehranDate(entry.created_at)
      const dateKey = format(tehranDate, "yyyy-MM-dd")
      const hour = tehranDate.getHours()
      const key = `${dateKey}-${hour}`

      if (!grouped[key]) {
        grouped[key] = {
          date: dateKey,
          hour,
          amount: 0,
          count: 0,
        }
      }

      grouped[key].amount += entry.amount
      grouped[key].count += 1
    })

    setHeatmapData(Object.values(grouped))
    setIsLoading(false)
  }

  useEffect(() => {
    loadHeatmapData()

    window.addEventListener("feedingUpdated", loadHeatmapData)

    return () => {
      window.removeEventListener("feedingUpdated", loadHeatmapData)
    }
  }, [dateRange])

  const days = eachDayOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate,
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getHeatmapValue = (date: Date, hour: number) => {
    const dateKey = format(date, "yyyy-MM-dd")
    const data = heatmapData.find((d) => d.date === dateKey && d.hour === hour)
    return data?.amount || 0
  }

  const maxAmount = Math.max(...heatmapData.map((d) => d.amount), 1)

  const getHeatColor = (amount: number) => {
    if (amount === 0) return "bg-muted/20"
    const intensity = Math.min(amount / maxAmount, 1)

    if (intensity < 0.25) return "bg-primary/20"
    if (intensity < 0.5) return "bg-primary/40"
    if (intensity < 0.75) return "bg-primary/60"
    return "bg-primary/80"
  }

  const handlePreviousWeek = () => {
    setDateRange((prev) => ({
      startDate: subDays(prev.startDate, 7),
      endDate: subDays(prev.endDate, 7),
    }))
  }

  const handleNextWeek = () => {
    setDateRange((prev) => ({
      startDate: addDays(prev.startDate, 7),
      endDate: addDays(prev.endDate, 7),
    }))
  }

  const handleToday = () => {
    setDateRange(getLast7DaysRange())
  }

  const isCurrentWeek = isSameDay(dateRange.endDate, getTehranDate(new Date()))

  return (
    <Card className="border-border bg-card">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Feeding Heatmap</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousWeek} className="h-8 w-8 p-0 bg-transparent">
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              disabled={isCurrentWeek}
              className="h-8 px-3 text-xs bg-transparent"
            >
              Today
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              disabled={isCurrentWeek}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mb-4">
          {formatPersianShortDate(dateRange.startDate)} - {formatPersianShortDate(dateRange.endDate)} ({TIMEZONE})
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Hour labels */}
              <div className="flex">
                <div className="w-16 flex-shrink-0" />
                <div className="flex flex-1 gap-1">
                  {hours
                    .filter((h) => h % 3 === 0)
                    .map((hour) => (
                      <div
                        key={hour}
                        className="flex-1 text-center text-xs text-muted-foreground"
                        style={{ minWidth: "32px" }}
                      >
                        {hour}
                      </div>
                    ))}
                </div>
              </div>

              {/* Heatmap grid */}
              <div className="mt-2 space-y-1">
                {days.map((day) => (
                  <div key={day.toISOString()} className="flex items-center gap-1">
                    <div className="w-16 flex-shrink-0 text-xs text-muted-foreground">
                      {formatPersianShortDate(day)}
                    </div>
                    <div className="flex flex-1 gap-1">
                      {hours.map((hour) => {
                        const amount = getHeatmapValue(day, hour)
                        const data = heatmapData.find((d) => d.date === format(day, "yyyy-MM-dd") && d.hour === hour)

                        return (
                          <div
                            key={hour}
                            className={`
                              aspect-square rounded transition-all hover:ring-2 hover:ring-primary/50
                              ${getHeatColor(amount)}
                            `}
                            style={{ minWidth: "8px", flex: 1 }}
                            title={
                              amount > 0
                                ? `${formatPersianShortDate(day)} ${hour}:00 - ${amount}ml (${data?.count} تغذیه)`
                                : `${formatPersianShortDate(day)} ${hour}:00 - بدون تغذیه`
                            }
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded bg-muted/20" />
                  <div className="h-3 w-3 rounded bg-primary/20" />
                  <div className="h-3 w-3 rounded bg-primary/40" />
                  <div className="h-3 w-3 rounded bg-primary/60" />
                  <div className="h-3 w-3 rounded bg-primary/80" />
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
