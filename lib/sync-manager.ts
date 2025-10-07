import { createBrowserClient } from "@supabase/ssr"
import { getPendingFeedings, removePendingFeeding, setCachedFeedings } from "./offline-storage"
import type { Feeding } from "./types"

export class SyncManager {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  private isSyncing = false

  async syncPendingChanges(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return

    this.isSyncing = true
    console.log("[v0] Starting sync...")

    try {
      const pending = await getPendingFeedings()

      for (const item of pending) {
        try {
          if (item.action === "create") {
            const { error } = await this.supabase.from("feedings").insert({
              id: item.id,
              amount: item.amount,
              fed_at: item.fed_at,
            })

            if (!error) {
              await removePendingFeeding(item.id)
              console.log("[v0] Synced create:", item.id)
            }
          } else if (item.action === "delete") {
            const { error } = await this.supabase.from("feedings").delete().eq("id", item.id)

            if (!error) {
              await removePendingFeeding(item.id)
              console.log("[v0] Synced delete:", item.id)
            }
          }
        } catch (error) {
          console.error("[v0] Error syncing item:", error)
        }
      }

      // Refresh cache from server
      await this.refreshCache()

      console.log("[v0] Sync complete")
    } finally {
      this.isSyncing = false
    }
  }

  async refreshCache(): Promise<void> {
    if (!navigator.onLine) return

    try {
      const { data, error } = await this.supabase.from("feedings").select("*").order("fed_at", { ascending: false })

      if (!error && data) {
        setCachedFeedings(data as Feeding[])
        console.log("[v0] Cache refreshed")
      }
    } catch (error) {
      console.error("[v0] Error refreshing cache:", error)
    }
  }
}

export const syncManager = new SyncManager()
