import React, { useState, useEffect, useMemo } from 'react';

// Specialized CSS for custom audio waveforms, floating love hearts, and smooth modal fade-ins
const customStyles = `
@keyframes wave {
  0%, 100% { height: 8px; }
  50% { height: 32px; }
}

@keyframes floatHeart {
  0% { transform: translateY(0) scale(0.8) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.9; }
  100% { transform: translateY(-140px) scale(1.3) rotate(20deg); opacity: 0; }
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 77, 141, 0.4); }
  50% { box-shadow: 0 0 25px rgba(255, 77, 141, 0.8); }
}

.wave-bar-1 { animation: wave 1s infinite ease-in-out; }
.wave-bar-2 { animation: wave 0.8s infinite ease-in-out 0.2s; }
.wave-bar-3 { animation: wave 1.2s infinite ease-in-out 0.4s; }
.wave-bar-4 { animation: wave 0.9s infinite ease-in-out 0.1s; }
.wave-bar-5 { animation: wave 1.1s infinite ease-in-out 0.3s; }

.floating-heart {
  position: absolute;
  pointer-events: none;
  animation: floatHeart 2.5s forwards ease-out;
}

.glow-btn {
  animation: glowPulse 2.5s infinite ease-in-out;
}

/* Hide scrollbar utility */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`;

export default function Home() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'rooms', 'profile', 'wallet'
  const [selectedHost, setSelectedHost] = useState(null); // Host for bottom sheet
  const [activeCall, setActiveCall] = useState(null); // Call state (host details)
  const [callDuration, setCallDuration] = useState(0);
  const [walletBalance, setWalletBalance] = useState(25.00); // Initial mock balance in Rupees
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('50');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [hearts, setHearts] = useState([]); // Dynamic floating hearts during active calls
  const [activeCategory, setActiveCategory] = useState('All');
  const [systemMessage, setSystemMessage] = useState('');
  const [currentCaption, setCurrentCaption] = useState('');

  // --- MOCK DATA ---
  const hosts = [
    {
      id: 'priya',
      name: 'Priya',
      age: 21,
      rating: 4.8,
      status: 'Live',
      tagline: 'Listening to your deep thoughts... Let\'s connect! 💕',
      language: 'Bengali, Hindi',
      interest: 'Singing, Reading',
      color: 'from-pink-500 to-purple-500',
      rate: 10, // ₹10 per hour
      avatarText: '👸',
      online: true,
      popularRoom: 'Bengali Adda Night',
      listeners: 128
    },
    {
      id: 'diya',
      name: 'Diya',
      age: 20,
      rating: 4.2,
      status: 'Live',
      tagline: 'Let\'s sing songs and chat about our day! 🎵',
      language: 'Bengali, English',
      interest: 'Acoustic Guitar, Coffee',
      color: 'from-purple-500 to-blue-500',
      rate: 10,
      avatarText: '👩‍🎤',
      online: true,
      popularRoom: 'Sweet Voice Only',
      listeners: 96
    },
    {
      id: 'ananya',
      name: 'Ananya',
      age: 23,
      rating: 4.9,
      status: 'Live',
      tagline: 'Late night secrets, fun riddles and friendly gossip. 🔮',
      language: 'Hindi, English',
      interest: 'Movies, Astrology',
      color: 'from-red-500 to-pink-500',
      rate: 10,
      avatarText: '🙋‍♀️',
      online: true,
      popularRoom: 'Late Night Gossip Adda',
      listeners: 184
    },
    {
      id: 'riya',
      name: 'Riya',
      age: 22,
      rating: 4.6,
      status: 'Live',
      tagline: 'A cozy space to play truth or dare & make friends! 🍿',
      language: 'Bengali',
      interest: 'Gaming, Cooking',
      color: 'from-indigo-500 to-purple-600',
      rate: 10,
      avatarText: '💁‍♀️',
      online: true,
      popularRoom: 'Fun With Friends',
      listeners: 74
    },
    {
      id: 'sneha',
      name: 'Sneha',
      age: 24,
      rating: 4.5,
      status: 'Offline',
      tagline: 'Simple girl looking to have some pleasant evening adda.',
      language: 'Bengali, Hindi',
      interest: 'Poetry, Travel',
      color: 'from-teal-500 to-blue-500',
      rate: 10,
      avatarText: '🧘‍♀️',
      online: false,
      popularRoom: 'Quiet Corners',
      listeners: 0
    },
    {
      id: 'arko',
      name: 'Arko',
      age: 25,
      rating: 4.7,
      status: 'Live',
      tagline: 'Guitar jam sessions. Request your favorite retro hits! 🎸',
      language: 'Bengali, English',
      interest: 'Guitar, Classic Rock',
      color: 'from-blue-600 to-indigo-600',
      rate: 10,
      avatarText: '🧑‍🎤',
      online: true,
      popularRoom: 'Music Adda',
      listeners: 96
    }
  ];

  // Conversation script for simulated hosts during the voice call
  const dialogueScripts = {
    priya: [
      "Hey! Welcome in! I'm Priya. How are you doing tonight? 😊",
      "I was just listening to some lo-fi Bengali tracks. Do you like music?",
      "It is so peaceful to talk at this hour. Tell me, what keeps you awake?",
      "Aww, you have such a warm voice! I really enjoy chatting with you.",
      "Shall we play a quick game of 20 questions? You go first!",
      "I'm so glad we connected on AddaLove! You are lovely."
    ],
    diya: [
      "Hello! Diya here, hope your day went wonderfully! 🎙️",
      "Are you in the mood for a sweet song? I can hum something for you!",
      "I love brewing warm tea while talking to friendly voices like yours.",
      "Bengali adda is never complete without sharing sweet memories, right?",
      "What's your absolute favorite comfort food? Mine is phuchka!",
      "Keep talking, I'm all ears! Your voice is super relaxing."
    ],
    ananya: [
      "Hi there! Ananya in the house! What's the late night gossip? 😉",
      "Are you a night owl too? I find the best thoughts come past midnight.",
      "Let's make a deal: you tell me a secret, and I will share one too!",
      "My rating is 4.9 for a reason, I promise never to let you get bored!",
      "Haha! You are absolutely hilarious. I love your sense of humor.",
      "Let's just connect and talk about life, universe and everything!"
    ],
    riya: [
      "Hey sweetie! Welcome to my cozy corner! Riya here. 🌸",
      "We were just about to start a fun truth or dare round! Care to join?",
      "Tell me honestly... what's the craziest thing you did this week?",
      "Aww, you sound so sweet! You just made my evening so much brighter.",
      "I feel like we could talk for hours without ever running out of things to say.",
      "Let's invite more positive vibes! Tell me your favorite hobby."
    ],
    arko: [
      "Yo! Arko here. Grab some coffee, let's jam! 🎸",
      "Just tuning my guitar. Got any song requests? Old is gold!",
      "Bengali rock or classic romantic - what's your vibe today?",
      "Awesome! Playing this tune especially for you right now...",
      "Voice connection on AddaLove is amazing, feels like we are in the same room.",
      "Cheers for hanging out with me. You rock!"
    ]
  };

  // --- FILTERED DATA ---
  const filteredHosts = useMemo(() => {
    return hosts.filter(host => {
      const matchesSearch = host.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            host.popularRoom.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeCategory === 'All') return matchesSearch;
      if (activeCategory === 'Online') return matchesSearch && host.online;
      if (activeCategory === 'Highly Rated') return matchesSearch && host.rating >= 4.7;
      return matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const recommendedGirls = useMemo(() => {
    return hosts.filter(h => h.id !== 'arko' && h.online);
  }, []);

  // --- SIMULATION TIMERS ---
  useEffect(() => {
    let timer;
    if (activeCall) {
      setCurrentCaption(`Connecting to ${activeCall.name}'s voice room...`);
      
      timer = setInterval(() => {
        setCallDuration(prev => {
          const nextSec = prev + 1;
          
          // Cost calculation: ₹10 per hour = ₹10 / 3600 seconds = ~0.00278 Rupees per second
          const costPerSecond = 10 / 3600;
          setWalletBalance(currBalance => {
            if (currBalance <= costPerSecond) {
              clearInterval(timer);
              setActiveCall(null);
              triggerToast("Call disconnected: Insufficient wallet balance! Please recharge.");
              setShowRechargeModal(true);
              return 0;
            }
            return Number((currBalance - costPerSecond).toFixed(4));
          });

          // Simulate conversations
          const hostDialogues = dialogueScripts[activeCall.id] || dialogueScripts['priya'];
          const dialogueIndex = Math.floor(nextSec / 8) % hostDialogues.length;
          if (nextSec % 8 === 0) {
            setCurrentCaption(hostDialogues[dialogueIndex]);
          } else if (nextSec === 3) {
            setCurrentCaption(hostDialogues[0]);
          }

          return nextSec;
        });
      }, 1000);
    } else {
      setCallDuration(0);
      setCurrentCaption('');
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  // --- HANDLERS ---
  const handleStartCall = (host) => {
    if (!host.online) {
      triggerToast(`${host.name} is currently offline. Feel free to call other active hosts!`);
      return;
    }
    if (walletBalance < 1.00) {
      triggerToast("Minimum ₹1.00 balance required to initiate a call!");
      setShowRechargeModal(true);
      return;
    }
    setSelectedHost(null);
    setActiveCall(host);
    triggerToast(`Connecting call with ${host.name}...`);
  };

  const handleEndCall = () => {
    if (activeCall) {
      triggerToast(`Call with ${activeCall.name} ended. Duration: ${formatTime(callDuration)}`);
      setActiveCall(null);
    }
  };

  const handleRecharge = () => {
    const amt = parseFloat(rechargeAmount);
    if (!isNaN(amt) && amt > 0) {
      setWalletBalance(prev => prev + amt);
      setShowRechargeModal(false);
      triggerToast(`Successfully added ₹${amt.toFixed(2)} to your AddaLove wallet!`);
    }
  };

  const spawnHeart = () => {
    const id = Date.now() + Math.random();
    const newHeart = {
      id,
      x: Math.random() * 80 + 10,
      size: Math.random() * 24 + 16,
    };
    setHearts(prev => [...prev, newHeart]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 2500);
  };

  const triggerToast = (msg) => {
    setSystemMessage(msg);
    setTimeout(() => {
      setSystemMessage('');
    }, 4000);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans selection:bg-[#FF4D8D]/30">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* DYNAMIC SYSTEM ALERTS & TOASTS */}
      {systemMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] text-white py-2.5 px-6 rounded-2xl shadow-2xl text-xs md:text-sm font-bold flex items-center gap-3 border border-white/20 animate-bounce">
          <span>🔔 {systemMessage}</span>
          <button onClick={() => setSystemMessage('')} className="hover:opacity-80 font-bold ml-2">×</button>
        </div>
      )}

      {/* MAIN CONTAINER LAYOUT */}
      <div className="flex flex-1 w-full relative">

        {/* ========================================================= */}
        {/* SIDEBAR NAVIGATION: DISPLAYED ON TABLET/DESKTOP WIDESCREENS */}
        {/* ========================================================= */}
        <aside className="hidden md:flex flex-col w-72 bg-[#0B0F19] border-r border-slate-800 p-6 shrink-0 h-screen sticky top-0 justify-between">
          
          {/* Logo & Header */}
   

          {/* Sidebar Footer Profile */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#6C3BFF] to-[#4DA6FF] flex items-center justify-center text-lg shadow-md">
                🤵
              </div>
              <div>
                <span className="text-xs font-black block text-white">Guest User</span>
                <span className="text-[9px] text-emerald-400 font-bold block">Status: Verified ID</span>
              </div>
            </div>
            <button 
              onClick={() => triggerToast("AddaLove features are updated to support full responsiveness!")}
              className="text-slate-400 hover:text-slate-200"
              title="System Help"
            >
              ❓
            </button>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN DISPLAY VIEWPORT (Fluid, Full Width, Highly Responsive) */}
        {/* ========================================================= */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen pb-24 md:pb-6">

          {/* HEADER SECTION */}
       

          {/* MAIN PAGE FEED */}
          <div className="flex-1 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto space-y-8">
            
            {/* RESPONSIVE BANNER & SEARCH BAR GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Interactive Banner Area */}
              <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-linear-to-br from-[#2E1065] via-[#1E1B4B] to-[#0F172A] p-6 md:p-8 border border-[#6C3BFF]/40 shadow-2xl">
                {/* Visual Glow elements */}
                <div className="absolute -right-5 -top-5 w-48 h-48 bg-[#FF4D8D]/20 rounded-full blur-3xl"></div>
                <div className="absolute left-1/4 bottom-0 w-32 h-32 bg-[#4DA6FF]/15 rounded-full blur-2xl"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                  <div className="space-y-3">
                    <span className="inline-block bg-[#FF4D8D] text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md">
                      LIVESTREAMING NIGHTS
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                      Bengali Adda Night
                    </h2>
                    <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
                      Join Now & Have Fun! Talk with our active premium female hosts instantly with absolute privacy.
                    </p>
                    
                    <button 
                      onClick={() => {
                        const topHost = hosts.find(h => h.id === 'priya');
                        if (topHost) handleStartCall(topHost);
                      }}
                      className="glow-btn bg-[#FF4D8D] hover:bg-[#ff3b81] active:scale-95 text-white font-extrabold text-xs md:text-sm py-2.5 px-6 rounded-full shadow-lg transition-all flex items-center gap-2"
                    >
                      <span>Join Now</span>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>

                  {/* Icon Indicator matching reference layout */}
                  <div className="relative self-center">
                    <div className="w-24 h-24 bg-slate-950/50 rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                      <svg className="w-12 h-12 text-[#FF4D8D] filter drop-shadow-[0_0_12px_rgba(255,77,141,0.6)] animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm0 16a6 6 0 0 1-6-6h2a4 4 0 0 0 8 0h2a6 6 0 0 1-6 6zm-1 2h2v2h-2z" />
                      </svg>
                    </div>
                    <div className="absolute top-0 left-0 w-24 h-24 border-2 border-[#6C3BFF]/40 rounded-full animate-ping pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* Live Search Panel Card (Perfect on Large screen, compact on Mobile) */}
              <div className="bg-[#1E293B] rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#4DA6FF]">Voice Filter Hub</h3>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search hosts, rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0F172A] text-slate-100 placeholder-slate-400 text-xs md:text-sm rounded-xl pl-11 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#6C3BFF] border border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category filters inside search panel */}
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Filters</span>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Online', 'Highly Rated'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeCategory === cat
                            ? 'bg-[#FF4D8D] text-white shadow-md'
                            : 'bg-[#0F172A] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* ACTIVE HOSTS CAROUSEL SLIDER */}
            <section className="space-y-4 select-none">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wide text-slate-200">
                    Active Hosts
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setActiveCategory('Online');
                    triggerToast("Filtered layout for active live hosts.");
                  }}
                  className="text-xs text-[#4DA6FF] font-bold hover:underline"
                >
                  See All Live
                </button>
              </div>

              {/* Horizontal Scroll Containers */}
              <div className="flex gap-5 overflow-x-auto no-scrollbar pb-3 pt-1">
                {hosts.map((host) => (
                  <div 
                    key={host.id} 
                    onClick={() => setSelectedHost(host)}
                    className="flex flex-col items-center shrink-0 cursor-pointer group"
                  >
                    <div className="relative">
                      {/* Interactive dynamic glowing frame */}
                      <div className={`p-0.75 rounded-full transition-all duration-300 ${
                        host.online 
                          ? 'bg-linear-to-tr from-[#6C3BFF] via-[#FF4D8D] to-[#4DA6FF] group-hover:scale-105' 
                          : 'bg-slate-700'
                      }`}>
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#0F172A] flex items-center justify-center overflow-hidden relative">
                          <div className={`w-full h-full bg-linear-to-br ${host.color} flex items-center justify-center text-3xl md:text-4xl shadow-inner`}>
                            {host.avatarText}
                          </div>
                        </div>
                      </div>

                      {/* Online Pulse Indicator */}
                      {host.online && (
                        <span className="absolute bottom-0 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0F172A] flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs md:text-sm font-bold mt-2 text-slate-300 group-hover:text-white transition-colors">
                      {host.name}
                    </span>
                    
                    {/* Star ratings */}
                    <div className="flex items-center gap-1 mt-1 bg-slate-800/90 py-0.5 px-2 rounded-md border border-slate-700">
                      <span className="text-[10px] text-yellow-400">⭐</span>
                      <span className="text-[10px] font-black text-slate-200">{host.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* GIRLS RECOMMENDED FOR YOU GRID (1 column on mobile, fits beautifully into grid on web width) */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wide text-slate-200">
                    Girls Recommended For You
                  </h3>
                </div>
                <button 
                  onClick={() => triggerToast("Exploring personalized algorithms for recommended live rooms!")}
                  className="text-xs text-[#4DA6FF] font-bold hover:underline"
                >
                  See All
                </button>
              </div>

              {/* Dynamic Responsive Multi-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredHosts.filter(h => h.id !== 'arko').map((girl) => (
                  <div 
                    key={girl.id}
                    className="bg-[#1E293B] rounded-2xl p-4 flex flex-col justify-between border border-slate-800 hover:border-[#6C3BFF]/40 transition-all shadow-md hover:shadow-2xl group relative overflow-hidden"
                  >
                    {/* Inner Content row */}
                    <div className="flex items-start gap-3.5">
                      {/* Custom Avatar container */}
                      <div className="relative shrink-0">
                        <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${girl.color} flex items-center justify-center text-2xl shadow-md`}>
                          {girl.avatarText}
                        </div>
                        {girl.online && (
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#1E293B]"></span>
                        )}
                      </div>

                      {/* Text & Metadata */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-white group-hover:text-[#4DA6FF] transition-colors truncate">
                          {girl.popularRoom}
                        </h4>
                        
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <span>Host: <strong className="text-slate-200 font-semibold">{girl.name}</strong></span>
                        </div>

                        {/* Interactive Ratings row */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center text-yellow-400 font-bold gap-0.5 text-[10px]">
                            ⭐ {girl.rating}
                          </span>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-slate-400 text-[10px]">
                            👤 {girl.listeners} active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Row (₹10/hr pricing perfectly placed) */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-black px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <span>🪙</span>
                        <span>₹10/hr</span>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedHost(girl)}
                          className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                        >
                          Bio
                        </button>
                        <button 
                          onClick={() => handleStartCall(girl)}
                          className="bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] hover:opacity-90 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1 active:scale-95"
                        >
                          <span>Join</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredHosts.filter(h => h.id !== 'arko').length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 text-sm">
                    No active voice hosts found match your criteria. Try resetting the filters!
                  </div>
                )}
              </div>
            </section>

            {/* MUSIC ADDA / COLLAPSIBLE SECONDARY RECOMMENDATION BANNER */}
            <section className="bg-[#1E293B] rounded-3xl p-5 border border-slate-800/80 shadow-md">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-900 to-[#1E1B4B] flex items-center justify-center text-2xl shadow-inner border border-purple-500/20">
                    🎸
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm md:text-base text-white">Featured Acoustic Session: Music Adda</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Hosted by Arko • Guitar jams and retro lyrics on demand.</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                        Live JamMING
                      </span>
                      <span className="text-[10px] text-slate-300 font-semibold">
                        👤 96 listeners connected
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const arko = hosts.find(h => h.id === 'arko');
                    if (arko) handleStartCall(arko);
                  }}
                  className="w-full md:w-auto bg-[#6C3BFF] hover:bg-[#582de0] text-white text-xs font-black py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95 text-center"
                >
                  Join Session
                </button>
              </div>
            </section>

          </div>

        </main>

      </div>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR: SHOWN ONLY ON SMALL SCREENS */}
      {/* ========================================================= */}
      

      {/* ========================================================= */}
      {/* PROFILE DETAIL BOTTOM DRAWER: FLOATS UP FLUIDLY ON BOTH VIEWS */}
      {/* ========================================================= */}
      {selectedHost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center md:items-end justify-center select-none p-4">
          <div className="absolute inset-0" onClick={() => setSelectedHost(null)}></div>
          
          <div className="relative w-full max-w-lg bg-[#1E293B] rounded-2xl md:rounded-t-4xl md:rounded-b-none p-6 border border-slate-700/60 max-h-[90%] md:max-h-[85%] overflow-y-auto z-10 animate-slide-up space-y-6">
            
            {/* Drag Handle block */}
            <div className="hidden md:block w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2"></div>
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${selectedHost.color} flex items-center justify-center text-3xl shadow-lg relative`}>
                  {selectedHost.avatarText}
                  {selectedHost.online && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1E293B]"></span>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-extrabold text-white">{selectedHost.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-slate-900 text-slate-300 py-0.5 px-2.5 rounded-full border border-slate-800">
                      Age: {selectedHost.age}
                    </span>
                    <span className="text-xs text-yellow-400 font-bold flex items-center gap-0.5">
                      ⭐ {selectedHost.rating} Rating
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedHost(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            {/* Custom Bio Tagline */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-purple-400 uppercase tracking-wider block font-bold mb-1">Status Vibe</span>
              <p className="text-sm italic text-slate-200">
                "{selectedHost.tagline}"
              </p>
            </div>

            {/* Detail info grids */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fluent In</span>
                <span className="text-xs font-bold text-slate-200 mt-0.5 block">{selectedHost.language}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Main Interests</span>
                <span className="text-xs font-bold text-slate-200 mt-0.5 block">{selectedHost.interest}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Call Rate</span>
                <span className="text-xs font-extrabold text-emerald-400 mt-0.5 block">₹10 / hour</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Availability</span>
                <span className={`text-xs font-bold mt-0.5 block ${selectedHost.online ? 'text-green-400' : 'text-slate-500'}`}>
                  {selectedHost.online ? '🟢 Live & Active' : '🔴 Offline'}
                </span>
              </div>
            </div>

            {/* Voice Clip Intro (Simulated audio waveform feedback) */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => triggerToast(`Playing ${selectedHost.name}'s voice demo intro...`)}
                    className="w-10 h-10 rounded-full bg-[#6C3BFF] text-white flex items-center justify-center hover:bg-opacity-90 active:scale-95 transition-all"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <div>
                    <span className="text-xs font-bold text-white block">Audition Voice Intro</span>
                    <span className="text-[10px] text-slate-400">Recorded sample (0:12s)</span>
                  </div>
                </div>
                {/* Waveform graphic */}
                <div className="flex gap-1 items-center">
                  <div className="w-1 h-3 bg-[#6C3BFF] rounded-full"></div>
                  <div className="w-1 h-5 bg-[#6C3BFF] rounded-full"></div>
                  <div className="w-1 h-4 bg-[#FF4D8D] rounded-full"></div>
                  <div className="w-1 h-6 bg-[#FF4D8D] rounded-full"></div>
                  <div className="w-1 h-3 bg-slate-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Action Bottom row */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setSelectedHost(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-3 rounded-xl text-xs transition-all active:scale-95"
              >
                Close Profile
              </button>
              <button 
                onClick={() => handleStartCall(selectedHost)}
                className="flex-2 bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] text-white font-black py-3 rounded-xl text-xs shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Call Voice Room</span>
                <span className="bg-white/20 text-[10px] font-bold px-2 py-0.5 rounded-full">₹10/hr</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================= */}
      {/* INTERACTIVE VOICE-CALL CONSOLE OVERLAY */}
      {/* ========================================================= */}
      {activeCall && (
        <div className="fixed inset-0 bg-[#0B0F19] z-50 flex flex-col justify-between p-6 md:p-12 overflow-hidden select-none">
          
          {/* Animated Background effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#6C3BFF]/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-[#FF4D8D]/15 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Render active hearts layer */}
          {hearts.map(heart => (
            <span 
              key={heart.id} 
              className="floating-heart"
              style={{ 
                left: `${heart.x}%`, 
                bottom: '120px', 
                fontSize: `${heart.size}px` 
              }}
            >
              💖
            </span>
          ))}

          {/* Call Top Header */}
          <div className="flex justify-between items-center z-10 max-w-4xl w-full mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-full py-1.5 px-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] md:text-xs font-bold text-slate-300">P2P Encrypted Audio Connected</span>
            </div>

            <div className="text-right">
              <span className="text-xs md:text-sm font-black text-white bg-[#FF4D8D]/25 border border-[#FF4D8D]/40 px-3.5 py-1.5 rounded-full shadow-lg">
                Wallet Balance: ₹{walletBalance.toFixed(2)}
              </span>
              <p className="text-[9px] text-slate-400 mt-1.5">Running Cost: ~₹0.16 / minute</p>
            </div>
          </div>

          {/* Call Center Area (Pulse Avatar & Timer status) */}
          <div className="flex flex-col items-center justify-center flex-1 z-10 max-w-4xl w-full mx-auto my-6">
            
            {/* Visual Wave pulses */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-[#6C3BFF]/30 blur-2xl opacity-60 animate-pulse"></div>
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full p-2 bg-linear-to-tr from-[#6C3BFF] via-[#FF4D8D] to-[#4DA6FF] relative z-10">
                <div className={`w-full h-full rounded-full bg-linear-to-br ${activeCall.color} flex items-center justify-center text-7xl shadow-2xl`}>
                  {activeCall.avatarText}
                </div>
              </div>
              <div className="absolute -inset-6 border border-[#FF4D8D]/20 rounded-full animate-ping pointer-events-none opacity-30"></div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">{activeCall.name}</h2>
            <span className="text-xs md:text-sm text-[#4DA6FF] font-bold mt-1.5 uppercase tracking-widest">Connected Live Voice Session</span>

            {/* Timer Badge */}
            <div className="mt-5 bg-slate-950/60 px-5 py-2 rounded-full border border-slate-800 shadow-inner">
              <span className="text-lg md:text-xl font-mono text-slate-200 font-bold tracking-widest">
                {formatTime(callDuration)}
              </span>
            </div>

            {/* Live active equalizer wave bars */}
            <div className="flex gap-2 items-center justify-center mt-10 h-10">
              <span className="w-1.5 bg-[#4DA6FF] rounded-full wave-bar-1"></span>
              <span className="w-1.5 bg-[#6C3BFF] rounded-full wave-bar-2"></span>
              <span className="w-1.5 bg-[#FF4D8D] rounded-full wave-bar-3"></span>
              <span className="w-1.5 bg-pink-400 rounded-full wave-bar-4"></span>
              <span className="w-1.5 bg-blue-400 rounded-full wave-bar-5"></span>
            </div>
          </div>

          {/* Subtitle dialogue captions */}
          <div className="max-w-xl w-full mx-auto bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl mb-8 min-h-24 flex flex-col justify-center relative z-10 backdrop-blur-md shadow-2xl">
            <span className="absolute top-2 left-4 text-[9px] uppercase tracking-wider font-extrabold text-[#FF4D8D]">
              Speech Subtitle Transcript
            </span>
            <p className="text-sm md:text-base text-slate-100 leading-relaxed font-semibold mt-2 text-center">
              {currentCaption || "Waiting for audio sync channels..."}
            </p>
          </div>

          {/* Control Bar */}
          <div className="flex justify-between items-center gap-4 bg-[#1E293B]/90 border border-slate-700/65 p-4 rounded-3xl z-10 backdrop-blur-md max-w-md mx-auto w-full shadow-2xl">
            
            <button 
              onClick={() => {
                setIsMuted(!isMuted);
                triggerToast(isMuted ? "Your Mic is now active" : "Your Mic is muted");
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                {isMuted ? (
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17l-11-11L2.7 1.43l11 11L12 14c-1.66 0-3-1.34-3-3H7.3c0 2.25 1.56 4.14 3.7 4.67V21h2v-5.33c.87-.13 1.68-.45 2.38-.93l4.5 4.5 1.42-1.42-14-14zm.02-6.17a3 3 0 0 0-5.3 1.83l2.3 2.3c.3-.5.7-.93 1.2-1.23v-.9c0-.55.45-1 1-1s1 .45 1 1v2.17l2-2v-1.17z" />
                ) : (
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                )}
              </svg>
            </button>

            {/* Reaction dispatcher */}
            <button 
              onClick={spawnHeart}
              className="w-12 h-12 rounded-full bg-[#FF4D8D]/10 text-[#FF4D8D] border border-[#FF4D8D]/30 flex items-center justify-center hover:bg-[#FF4D8D]/25 active:scale-90 transition-all font-bold text-xl"
            >
              💖
            </button>

            <button 
              onClick={() => {
                setIsSpeakerOn(!isSpeakerOn);
                triggerToast(isSpeakerOn ? "Speaker Disabled" : "Speaker Enabled");
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isSpeakerOn ? 'bg-[#4DA6FF]/20 text-[#4DA6FF] border border-[#4DA6FF]/30' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>

            {/* Red End Call button */}
            <button 
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all transform hover:-rotate-45"
            >
              <svg className="w-6 h-6 fill-current transform rotate-135" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
              </svg>
            </button>

          </div>
        </div>
      )}


      {/* ========================================================= */}
      {/* RECHARGE / ADD COINS WALLET POP-UP MODAL */}
      {/* ========================================================= */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-[#1E293B] rounded-4xl p-6 border border-slate-700 shadow-2xl relative animate-scale-up space-y-6">
            
            <button 
              onClick={() => setShowRechargeModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              ✕
            </button>

            <div className="text-center">
              <span className="text-4xl">🪙</span>
              <h3 className="text-xl font-black text-white mt-2">Recharge Voice Wallet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Calls cost only ₹10/hr. Keep your balance updated for non-stop vocal adda session.
              </p>
            </div>

            {/* Current Balance visual box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center shadow-inner">
              <span className="text-xs text-slate-400 block font-medium">Your Current Wallet Balance</span>
              <span className="text-2xl font-black text-[#FF4D8D] mt-0.5 block">
                ₹{walletBalance.toFixed(2)}
              </span>
            </div>

            {/* Select packages templates */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 block uppercase font-extrabold tracking-wider">Select Recharge Amount</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: '20', label: '₹20' },
                  { val: '50', label: '₹50' },
                  { val: '100', label: '₹100' }
                ].map(pkg => (
                  <button
                    key={pkg.val}
                    onClick={() => setRechargeAmount(pkg.val)}
                    className={`py-3 rounded-xl text-xs font-black transition-all ${
                      rechargeAmount === pkg.val
                        ? 'bg-[#FF4D8D] text-white ring-2 ring-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-755 border-2 border-transparent'
                    }`}
                  >
                    {pkg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Pay */}
            <button 
              onClick={handleRecharge}
              className="w-full bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] text-white font-black py-4 rounded-xl text-xs md:text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Instant UPI/Paytm Pay ₹{rechargeAmount}
            </button>

            <p className="text-[9px] text-center text-slate-500">
              🔒 Encrypted payment transaction protocol
            </p>
          </div>
        </div>
      )}

    </div>
  );
}