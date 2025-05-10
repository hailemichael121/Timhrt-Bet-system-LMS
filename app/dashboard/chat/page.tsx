import { PageTitle } from "@/components/page-title"
import { FormalChatInterface } from "@/components/chat/formal-chat-interface"

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="Messages" description="Communicate with students, teachers, and administrators" />
      <div className="h-[calc(100vh-13rem)]">
        <FormalChatInterface />
      </div>
    </div>
  )
}
