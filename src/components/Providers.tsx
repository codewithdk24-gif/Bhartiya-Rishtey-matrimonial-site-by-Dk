'use client';

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/context/NotificationContext";
import { ModalProvider } from "@/context/ModalContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ModalProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ModalProvider>
    </SessionProvider>
  );
}
