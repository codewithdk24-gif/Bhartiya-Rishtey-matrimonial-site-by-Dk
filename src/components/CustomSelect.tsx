'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CustomSelectProps {
  label: string;
  value: string;
  options: string[] | { label: string; value: string }[];
  onChange: (value: string) => void;
  icon?: string;
  // searchable is kept for API compatibility but hidden in simple inline mode
  searchable?: boolean;
}

export default function CustomSelect({ label, value, options, onChange, icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedLabel = normalizedOptions.find(opt => opt.value === value)?.label || value || 'Select';

  // Handle Outside Click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Trigger Field */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-stone-200 rounded-2xl px-5 py-3.5 flex justify-between items-center shadow-sm cursor-pointer hover:border-rose-300 transition-all duration-300 group"
      >
        <div className="flex flex-col items-start min-w-0">
          {label && (
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.15em] mb-1 group-hover:text-rose-400 transition-colors">
              {label}
            </span>
          )}
          <div className="flex items-center gap-2 w-full">
            {icon && <span className="material-symbols-outlined text-base text-rose-500 fill-1">{icon}</span>}
            <span className="text-xs font-bold text-stone-900 truncate">{selectedLabel}</span>
          </div>
        </div>
        <span className={`material-symbols-outlined text-stone-300 group-hover:text-rose-400 transition-all duration-500 ${isOpen ? 'rotate-180 text-rose-500' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Inline Dropdown (Directly Below Field) */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white border border-stone-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="relative group/scroll">
            <div 
              className="max-h-[240px] overflow-y-auto hide-scrollbar py-2"
              onScroll={(e) => {
                const target = e.currentTarget;
                const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 5;
                const fade = target.parentElement?.querySelector('.bottom-fade');
                if (fade) {
                  if (isAtBottom) fade.classList.add('opacity-0');
                  else fade.classList.remove('opacity-0');
                }
              }}
            >
              {normalizedOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-5 py-3.5 transition-all text-left ${
                    value === opt.value 
                      ? 'bg-rose-50 text-rose-600 font-bold' 
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-sm">{opt.label}</span>
                  {value === opt.value && (
                    <span className="material-symbols-outlined text-base animate-in zoom-in duration-300 font-bold">check</span>
                  )}
                </button>
              ))}
              
              {normalizedOptions.length === 0 && (
                <div className="py-8 text-center">
                   <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">No options</p>
                </div>
              )}
            </div>

            {/* Bottom Indicator / Fade */}
            {normalizedOptions.length > 5 && (
              <div className="bottom-fade absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none transition-opacity duration-300 flex items-end justify-center pb-1">
                <span className="material-symbols-outlined text-rose-300 text-sm animate-bounce mb-1">keyboard_double_arrow_down</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
