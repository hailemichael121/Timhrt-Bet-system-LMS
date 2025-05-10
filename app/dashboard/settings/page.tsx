import { SettingsForm } from "@/components/settings/settings-form"
import { PageTitle } from "@/components/page-title"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Settings" description="Manage your account settings" />

      <SettingsForm />
    </div>
  )
}
