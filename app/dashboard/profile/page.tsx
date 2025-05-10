import { PageTitle } from "@/components/page-title"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { notFound } from "next/navigation"
import { ProfileForm } from "@/components/profile/profile-form"
import { FileUpload } from "@/components/file-upload"

export default async function ProfilePage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null // Will be handled by middleware
  }

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (error || !profile) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <PageTitle title="Profile" description="View and edit your profile information" />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information and profile picture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">
                    {profile.first_name?.[0] || ""}
                    {profile.last_name?.[0] || ""}
                  </AvatarFallback>
                </Avatar>

                <div className="w-full max-w-[250px]">
                  <FileUpload
                    bucket="avatars"
                    path={session.user.id}
                    onUploadComplete={async (url) => {
                      "use server"
                      // This will be handled client-side in the ProfileForm component
                    }}
                    acceptedFileTypes=".jpg,.jpeg,.png"
                    maxSizeMB={2}
                  />
                </div>
              </div>

              <div className="flex-1 w-full">
                <ProfileForm profile={profile} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
