'use client';

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/context/NotificationContext";
import { ModalProvider } from "@/context/ModalContext";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ModalProvider>
        <NotificationProvider>
          {children}
          <Toaster richColors position="top-right" />
        </NotificationProvider>
      </ModalProvider>
    </SessionProvider>
  );
}
