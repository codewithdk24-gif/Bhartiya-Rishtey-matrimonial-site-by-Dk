'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import UpgradeModal from '@/components/UpgradeModal';

interface ModalContextType {
  openUpgradeModal: (feature: string, requiredPlan: string) => void;
  closeUpgradeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState({ feature: '', requiredPlan: '' });

  const openUpgradeModal = (feature: string, requiredPlan: string) => {
    setModalData({ feature, requiredPlan });
    setIsOpen(true);
  };

  const closeUpgradeModal = () => setIsOpen(false);

  return (
    <ModalContext.Provider value={{ openUpgradeModal, closeUpgradeModal }}>
      {children}
      {isOpen && (
        <UpgradeModal 
          isOpen={isOpen} 
          onClose={closeUpgradeModal} 
          feature={modalData.feature} 
          requiredPlan={modalData.requiredPlan} 
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModals() {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModals must be used within a ModalProvider');
  return context;
}
