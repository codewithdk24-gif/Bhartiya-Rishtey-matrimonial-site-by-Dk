'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashNav from '@/components/DashNav';

/**
 * /chat/[matchId] — This route now simply redirects to the
 * unified /chat page (WhatsApp-style split layout).
 * The user will land with the correct conversation pre-selected.
 *
 * This page is kept for backward compatibility with notification links.
 */
export default function ChatRedirectPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (matchId) {
      // Store the target chat id in sessionStorage so the /chat page can auto-select it
      sessionStorage.setItem('openChatId', matchId as string);
      router.replace('/chat');
    }
  }, [matchId, router]);

  return (
    <div className="min-h-screen bg-[#f8f4f4]">
      <DashNav />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-[3px] border-rose-100 border-t-rose-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}
