"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { syncManager } from "@/lib/sync-manager"

export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      setIsOnline(true)
      setIsSyncing(true)
      await syncManager.syncPendingChanges()
      setIsSyncing(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial sync if online
    if (navigator.onLine) {
      handleOnline()
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <div className="flex items-center gap-2 text-xs">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">{isSyncing ? "در حال همگام‌سازی..." : "آنلاین"}</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-orange-500" />
          <span className="text-muted-foreground">آفلاین</span>
        </>
      )}
    </div>
  )
}
