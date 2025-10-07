"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Milk, Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { addPendingFeeding, addToCachedFeedings } from "@/lib/offline-storage"
import type { Feeding } from "@/lib/types"

const AMOUNTS = [
  { value: 30, label: "۳۰ میلی‌لیتر", color: "bg-accent/20 hover:bg-accent/30 border-accent/40" },
  { value: 60, label: "۶۰ میلی‌لیتر", color: "bg-primary/20 hover:bg-primary/30 border-primary/40" },
  { value: 120, label: "۱۲۰ میلی‌لیتر", color: "bg-primary/30 hover:bg-primary/40 border-primary/50" },
]

export function FeedingForm() {
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null)
  const [successAmount, setSuccessAmount] = useState<number | null>(null)
  const { toast } = useToast()

  const handleFeedingLog = async (amount: number) => {
    if (loadingAmount !== null) return

    setLoadingAmount(amount)

    const feeding: Feeding = {
      id: crypto.randomUUID(),
      amount,
      created_at: new Date().toISOString(),
    }

    if (!navigator.onLine) {
      // Offline: save to IndexedDB and local cache
      await addPendingFeeding(feeding, "create")
      addToCachedFeedings(feeding)

      setLoadingAmount(null)
      setSuccessAmount(amount)

      window.dispatchEvent(new Event("feedingUpdated"))

      toast({
        title: "تغذیه ثبت شد (آفلاین)",
        description: `${amount} میلی‌لیتر پس از اتصال به اینترنت همگام‌سازی می‌شود`,
      })

      setTimeout(() => setSuccessAmount(null), 1500)
      return
    }

    const supabase = createClient()

    const { error } = await supabase.from("feedings").insert({
      id: feeding.id,
      amount: feeding.amount,
      created_at: feeding.created_at,
    })

    if (error) {
      console.error("[v0] Error inserting feeding:", error)
      toast({
        title: "خطا",
        description: "ثبت تغذیه با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      })
      setLoadingAmount(null)
      return
    }

    setLoadingAmount(null)
    setSuccessAmount(amount)

    // Dispatch custom event to update overview
    window.dispatchEvent(new Event("feedingUpdated"))

    // Show success feedback with Persian time
    const time = new Date().toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    })

    toast({
      title: "تغذیه ثبت شد",
      description: `${amount} میلی‌لیتر در ساعت ${time} ثبت شد`,
    })

    setTimeout(() => setSuccessAmount(null), 1500)
  }

  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6">
        <div className="mb-6 flex items-center gap-2">
          <Milk className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">ثبت تغذیه</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {AMOUNTS.map(({ value, label, color }) => {
            const isLoading = loadingAmount === value
            const isSuccess = successAmount === value
            const isDisabled = loadingAmount !== null && loadingAmount !== value

            return (
              <button
                key={value}
                onClick={() => handleFeedingLog(value)}
                disabled={isDisabled}
                className={`
                  group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-6 transition-all duration-300
                  ${color}
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : "active:scale-95"}
                  ${isSuccess ? "scale-105 border-primary" : ""}
                `}
              >
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/20 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                )}

                {isSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/20 animate-in fade-in zoom-in-50 duration-300">
                    <Check className="h-10 w-10 text-primary animate-in zoom-in-50 duration-500" />
                  </div>
                )}

                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full bg-background/50 transition-transform ${!isDisabled && "group-hover:scale-110"}`}
                >
                  <Milk className="h-8 w-8 text-primary" />
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-card-foreground ltr-numbers">{value}</div>
                  <div className="text-xs text-muted-foreground">میلی‌لیتر</div>
                </div>
              </button>
            )
          })}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">برای ثبت تغذیه روی یک لیوان ضربه بزنید</p>
      </div>
    </Card>
  )
}
