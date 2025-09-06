import { createFileRoute } from '@tanstack/react-router';
import { TextChatPage } from '@/text-chat/text-chat.page';

export const Route = createFileRoute('/text-chat')({
  component: TextChatPage,
});
