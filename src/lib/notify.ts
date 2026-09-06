/** Локальные напоминания: работают, пока приложение открыто или висит в фоне. */

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function permission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : 'denied'
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export async function notify(title: string, body: string, tag: string) {
  if (permission() !== 'granted') return false
  const options: NotificationOptions = {
    body,
    tag,
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { tag },
  }
  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg) {
      await reg.showNotification(title, { ...options, requireInteraction: false })
      return true
    }
  } catch {
    /* без service worker — обычное уведомление */
  }
  try {
    new Notification(title, options)
    return true
  } catch {
    return false
  }
}

/** Метка времени напоминания задачи, либо null. */
export function remindTime(day: string, remindAt: string | null): number | null {
  if (!remindAt) return null
  const [h, m] = remindAt.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const [y, mo, d] = day.split('-').map(Number)
  return new Date(y, mo - 1, d, h, m, 0, 0).getTime()
}
