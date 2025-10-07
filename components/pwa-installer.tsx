"use client"

import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Download, X } from "lucide-react"

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowInstall(false)
    }
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg z-50 flex items-center gap-3">
      <Download className="h-5 w-5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">نصب برنامه</p>
        <p className="text-xs text-muted-foreground">برای دسترسی سریع به صفحه اصلی اضافه کنید</p>
      </div>
      <Button onClick={handleInstall} size="sm">
        نصب
      </Button>
      <Button onClick={() => setShowInstall(false)} size="sm" variant="ghost" className="flex-shrink-0">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
