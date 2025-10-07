"use client"

import { useState, useEffect } from "react"
import { FeedingForm } from "@/components/feeding-form"
import { FeedingOverview } from "@/components/feeding-overview"
import { FeedingHeatmap } from "@/components/feeding-heatmap"
import { PWAInstaller } from "@/components/pwa-installer"
import { OnlineStatus } from "@/components/online-status"
import { Baby } from "lucide-react"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("[v0] Service worker registration failed:", error)
      })
    }
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Baby className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">تغذیه نوزاد</h1>
              <p className="text-xs text-muted-foreground">پیگیری هر وعده غذایی</p>
            </div>
            <OnlineStatus />
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-6 p-6">
          <FeedingForm />
          <FeedingHeatmap />
          <FeedingOverview />
        </div>
      </div>

      <PWAInstaller />
    </main>
  )
}
