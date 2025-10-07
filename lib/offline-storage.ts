import type { Feeding } from "./types"

const DB_NAME = "feeding-tracker-db"
const DB_VERSION = 1
const STORE_NAME = "pending-feedings"

interface PendingFeeding extends Feeding {
  action: "create" | "delete"
  synced: boolean
}

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
  })
}

// Add pending feeding to IndexedDB
export async function addPendingFeeding(feeding: Feeding, action: "create" | "delete"): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], "readwrite")
  const store = transaction.objectStore(STORE_NAME)

  const pendingFeeding: PendingFeeding = {
    ...feeding,
    action,
    synced: false,
  }

  store.put(pendingFeeding)

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// Get all pending feedings
export async function getPendingFeedings(): Promise<PendingFeeding[]> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], "readonly")
  const store = transaction.objectStore(STORE_NAME)
  const request = store.getAll()

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Remove synced feeding from IndexedDB
export async function removePendingFeeding(id: string): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], "readwrite")
  const store = transaction.objectStore(STORE_NAME)

  store.delete(id)

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// Local storage for offline feedings cache
const CACHE_KEY = "feedings-cache"

export function getCachedFeedings(): Feeding[] {
  if (typeof window === "undefined") return []
  const cached = localStorage.getItem(CACHE_KEY)
  return cached ? JSON.parse(cached) : []
}

export function setCachedFeedings(feedings: Feeding[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CACHE_KEY, JSON.stringify(feedings))
}

export function addToCachedFeedings(feeding: Feeding): void {
  const cached = getCachedFeedings()
  cached.push(feeding)
  setCachedFeedings(cached)
}

export function removeFromCachedFeedings(id: string): void {
  const cached = getCachedFeedings()
  const filtered = cached.filter((f) => f.id !== id)
  setCachedFeedings(filtered)
}
