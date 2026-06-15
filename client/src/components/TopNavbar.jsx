import React from 'react'
import { useUserData } from '../context/UserdataContext'
import { useNavigate } from 'react-router';
export default function TopNavbar() {
    const naviget = useNavigate();
    const { useralldata } = useUserData();
    const handlecoinclick = () => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth', // Optional: creates a smooth animation instead of an instant jump
        });
        naviget('/wallet')
    }
    return (
        <div>
            <header className="fixed top-0 w-full bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 z-30 px-4 md:px-8 py-4 flex justify-between items-center select-none">

                {/* Left section: Web title on widescreen or close button on small screens */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setActiveCategory('All');
                            triggerToast("Exploring all live voice hosts on AddaLove!");
                        }}
                        className="md:hidden w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700/80 flex items-center justify-center transition-all"
                    >
                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="hidden md:block">
                        <h1 className="text-xl font-black text-white flex items-center gap-2">
                            <span>Welcome to AddaLove Web</span>
                            <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                ● Premium Voice Hub
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400">Interact with high-rated vocal artists and listeners instantly.</p>
                    </div>

                    {/* Logo specifically for Mobile Viewport header */}
                    <div className="flex md:hidden items-center gap-1.5">
                        <div className="relative flex items-center">
                            <span className="text-lg font-black italic text-transparent bg-clip-text bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF]">Adda</span>
                            <span className="text-lg font-black italic text-[#FF4D8D] ml-px">Love</span>
                        </div>
                    </div>
                </div>

                {/* Right Header Controls (Search & Wallet) */}
                <div className="flex items-center gap-3">
                    {/* Wallet button specifically on Mobile Viewport */}
                    <button
                        onClick={handlecoinclick}
                        className="md:hidden bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold border border-[#6C3BFF]/30"
                    >
                        <span className="text-yellow-400">🪙</span>
                        <span className="text-slate-200">{useralldata.walletBlance}</span>
                    </button>

                    <button
                        onClick={() => triggerToast("All active connections are premium and secure.")}
                        className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all relative"
                    >
                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#FF4D8D] rounded-full ring-2 ring-[#0F172A]"></span>
                    </button>
                </div>
            </header>
        </div>
    )
}
