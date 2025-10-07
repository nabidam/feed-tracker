"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Milk, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FeedingEntry {
  id: string
  amount: number
  timestamp: string
}

const AMOUNTS = [
  { value: 30, label: "30ml", color: "bg-accent/20 hover:bg-accent/30 border-accent/40" },
  { value: 60, label: "60ml", color: "bg-primary/20 hover:bg-primary/30 border-primary/40" },
  { value: 120, label: "120ml", color: "bg-primary/30 hover:bg-primary/40 border-primary/50" },
]

export function FeedingForm() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const { toast } = useToast()

  const handleFeedingLog = (amount: number) => {
    setSelectedAmount(amount)

    const entry: FeedingEntry = {
      id: crypto.randomUUID(),
      amount,
      timestamp: new Date().toISOString(),
    }

    // Get existing entries
    const existingEntries = localStorage.getItem("feedingEntries")
    const entries: FeedingEntry[] = existingEntries ? JSON.parse(existingEntries) : []

    // Add new entry
    entries.push(entry)
    localStorage.setItem("feedingEntries", JSON.stringify(entries))

    // Dispatch custom event to update overview
    window.dispatchEvent(new Event("feedingUpdated"))

    // Show success feedback
    toast({
      title: "Feeding logged",
      description: `${amount}ml recorded at ${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`,
    })

    // Reset selection after animation
    setTimeout(() => setSelectedAmount(null), 1000)
  }

  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6">
        <div className="mb-6 flex items-center gap-2">
          <Milk className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">Log Feeding</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {AMOUNTS.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => handleFeedingLog(value)}
              className={`
                group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-6 transition-all duration-300
                ${color}
                ${selectedAmount === value ? "scale-95" : "active:scale-95"}
              `}
            >
              {selectedAmount === value && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/20">
                  <Check className="h-8 w-8 text-primary animate-in zoom-in-50" />
                </div>
              )}

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/50 transition-transform group-hover:scale-110">
                <Milk className="h-8 w-8 text-primary" />
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-card-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">milliliters</div>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">Tap a cup to log feeding</p>
      </div>
    </Card>
  )
}
