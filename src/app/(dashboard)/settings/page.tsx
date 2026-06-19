import { TelegramConnectPanel } from "@/components/settings/telegram-connect-panel"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { getTelegramConnectionStatus } from "@/lib/telegram/queries"

export default async function SettingsPage() {
  const user = await ensureDbUser()
  const telegramStatus = await getTelegramConnectionStatus(user.id)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-metallic">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage Telegram delivery and account preferences.
        </p>
      </div>

      <TelegramConnectPanel initialStatus={telegramStatus} />
    </main>
  )
}
