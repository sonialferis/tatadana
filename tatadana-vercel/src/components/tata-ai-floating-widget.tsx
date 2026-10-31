'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bot, Sparkles, X, Maximize2, MessageSquare } from 'lucide-react';
import TataAiChat from './tata-ai-chat';

export default function TataAiFloatingWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // If already on the dedicated Tata AI page, do not show floating bubble
  if (pathname === '/dashboard/tata-ai') {
    return null;
  }

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON (BOTTOM RIGHT) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-full shadow-xl shadow-orange-600/30 hover:shadow-orange-600/50 transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-white/40"
            title="Buka TATA AI BOT - Asisten Keuangan Pribadi"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-amber-200 animate-pulse" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-black tracking-tight leading-tight">TATA AI BOT</span>
              <span className="block text-[9px] text-orange-100 font-medium leading-none">Asisten Keuangan</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping hidden sm:block"></span>
          </button>
        )}

        {/* 2. FLOATING CHAT WINDOW POPUP */}
        {isOpen && (
          <div className="w-[92vw] sm:w-[410px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
            {/* Top Toolbar */}
            <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-orange-400" />
                <span className="font-extrabold text-xs">Tata AI Asisten</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/tata-ai"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:text-orange-400 text-slate-400 transition"
                  title="Buka Layar Penuh"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:text-rose-400 text-slate-400 transition"
                  title="Tutup Widget"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Chat */}
            <TataAiChat embedded={true} onClose={() => setIsOpen(false)} />
          </div>
        )}
      </div>
    </>
  );
}
