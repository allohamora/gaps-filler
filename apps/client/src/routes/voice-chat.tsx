import { createFileRoute } from '@tanstack/react-router';
import { VoiceChatPage } from '@/voice-chat/voice-chat.page';

export const Route = createFileRoute('/voice-chat')({
  component: VoiceChatPage,
});
