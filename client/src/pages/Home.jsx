import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore.js';
import useRoomStore from '../store/roomStore.js';
import { socket } from '../socket/socket.js';
import { MessageCircleMore } from 'lucide-react';

const roomTypes = ['message', 'voice', 'video'];
const languages = ['Bengali', 'Hindi', 'Gujarati', 'English', 'Kannada', 'Marathi', 'Tamil', 'Telugu', 'Urdu', 'Punjabi'];

const getRoomPath = (type, roomId) => {
  if (type === 'voice') return `/voiceRoom/${roomId}`;
  return `/messageRoom/${roomId}`;
};

// SVG Icons for the new Boy UI design
const Icons = {
  Wave: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 7v10M22 10v4M7 7v10M2 10v4" /></svg>
  ),
  Book: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
  ),
  Coffee: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" /></svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
  ),
  Verified: () => (
    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#3b82f6" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path fill="white" d="M10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
  ),
  Mic: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a1 1 0 0 0-2 0 3 3 0 1 1-6 0 1 1 0 0 0-2 0 5 5 0 0 0 4 4.9V19H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-3.1A5 5 0 0 0 17 11z" /></svg>
  ),
  User: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
  ),
  Phone: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" /></svg>
  ),
  HeartShield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8a2 2 0 0 0-2 2c0 3 2 4.5 2 4.5s2-1.5 2-4.5a2 2 0 0 0-2-2z" /></svg>
  ),
  LockShield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><rect x="9" y="11" width="6" height="6" rx="1" /><path d="M10 11V9a2 2 0 0 1 4 0v2" /></svg>
  )
};

const topCategories = [
  { id: 1, title: 'Live Conversations', subtitle: 'Join live voice rooms', icon: <Icons.Wave />, color: 'text-[#FF4D8D]' },
  { id: 2, title: 'Study Together', subtitle: 'Focus rooms for students', icon: <Icons.Book />, color: 'text-[#8B5CF6]' },
  { id: 3, title: 'Chill & Talk', subtitle: 'Casual talks & hangout', icon: <Icons.Coffee />, color: 'text-[#10B981]' },
  { id: 4, title: 'Late Night Talks', subtitle: 'Deep talks & quiet vibes', icon: <Icons.Moon />, color: 'text-[#F59E0B]' },
];

const popularTags = [
  { id: 1, title: 'Heart to Heart', rooms: '182 Rooms', icon: '💖', iconBg: 'bg-pink-500/10' },
  { id: 2, title: 'Just Friends', rooms: '156 Rooms', icon: '🫂', iconBg: 'bg-indigo-500/10' },
  { id: 3, title: 'Mindful Talks', rooms: '134 Rooms', icon: '🪷', iconBg: 'bg-purple-500/10' },
  { id: 4, title: 'Laugh Out Loud', rooms: '98 Rooms', icon: '😀', iconBg: 'bg-yellow-500/10' },
];

const Home = () => {
  const navigate = useNavigate();
  const { userRole } = useUserStore();
  const { isLoading, error, createRoom, joinRoom, getOpenRooms, rooms } = useRoomStore();
  const [roomType, setRoomType] = useState('message');
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  const isBoy = useMemo(() => userRole === 'boy', [userRole]);
  const isGirl = useMemo(() => userRole === 'girl', [userRole]);

  useEffect(() => {
    if (!isBoy) return undefined;
    const refreshRooms = () => getOpenRooms().catch(() => { });
    socket.on('room_opened', refreshRooms);
    socket.on('room_available', refreshRooms);
    socket.on('room_occupied', refreshRooms);
    socket.on('room_closed', refreshRooms);
    return () => {
      socket.off('room_opened', refreshRooms);
      socket.off('room_available', refreshRooms);
      socket.off('room_occupied', refreshRooms);
      socket.off('room_closed', refreshRooms);
    };
  }, [getOpenRooms, isBoy]);

  const handleLanguageChange = (language) => {
    setSelectedLanguages((currentLanguages) => {
      if (currentLanguages.includes(language)) {
        return currentLanguages.filter((selectedLanguage) => selectedLanguage !== language);
      }
      if (currentLanguages.length === 2) {
        return currentLanguages;
      }
      return [...currentLanguages, language];
    });
  };

  const handleCreateRoom = async () => {
    if (selectedLanguages.length !== 2) {
      alert('Please select exactly 2 languages.');
      return;
    }
    try {
      const createdRoom = await createRoom(roomType, selectedLanguages);
      navigate(getRoomPath(createdRoom.roomType, createdRoom.roomId));
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleJoinRoom = async (targetRoom) => {
    const idToJoin = typeof targetRoom === 'object' ? targetRoom.roomId : targetRoom;
    if (!idToJoin || idToJoin.trim() === '') {
      alert('Please enter a room ID.');
      return;
    }
    try {
      const joinedRoom = await joinRoom(idToJoin);
      navigate(getRoomPath(joinedRoom.roomType, idToJoin));
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div className={`min-h-screen ${isBoy ? 'bg-[#090A10]' : 'bg-[#0F172A]'} text-white flex justify-center sm:items-center px-0 sm:px-4 sm:py-8`}>
      <div className={`w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col ${isBoy ? 'bg-[#0B0C13] border-none sm:rounded-3xl sm:border sm:border-white/5' : 'bg-[#1E293B] rounded-3xl border border-white/10 p-6'}`}>

        {/* Girl/Unknown Header (Hidden for Boy) */}
        {!isBoy && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[#FF4D8D]">Home</p>
            <h1 className="mt-2 text-2xl font-black">{isGirl ? 'Create a room' : 'Join a room'}</h1>
            <p className="mt-2 text-sm text-slate-400">
              {isGirl ? 'Choose a room type, select 2 languages, and create your room.' : 'Browse open rooms or enter a room ID to join.'}
            </p>
          </div>
        )}

        {/* GIRL UI */}
        {isGirl && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {roomTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRoomType(type)}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${roomType === type ? 'border-[#FF4D8D] bg-[#FF4D8D]/15 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-200">Languages</span>
                <span className={selectedLanguages.length === 2 ? 'text-[#FF4D8D]' : 'text-slate-400'}>
                  {selectedLanguages.length}/2 selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((language) => {
                  const isSelected = selectedLanguages.includes(language);
                  const isDisabled = !isSelected && selectedLanguages.length === 2;

                  return (
                    <label
                      key={language}
                      className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${isSelected ? 'border-[#FF4D8D] bg-[#FF4D8D]/15 text-white' : 'border-white/10 bg-white/5 text-slate-300'} ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-white/10'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleLanguageChange(language)}
                        className="h-4 w-4 accent-[#FF4D8D]"
                      />
                      {language}
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={isLoading || selectedLanguages.length !== 2}
              className="w-full rounded-2xl bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        )}

        {/* BOY UI - Redesigned to match provided image exactly */}
        {isBoy && (
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            <div className="flex flex-col gap-6">

              {/* Hero Banner */}
              <div className="relative w-full rounded-2xl border mt-18 border-[#FF4D8D]/20 bg-linear-to-br from-[#2D1433] via-[#141021] to-[#0D111A] p-5 overflow-hidden shadow-lg">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-[#FF4D8D] opacity-20 blur-[40px]"></div>
                <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-[#6C3BFF] opacity-20 blur-[40px]"></div>

                <div className="relative z-10 w-2/3">
                  <h2 className="text-[26px] font-black leading-tight tracking-wide">
                    <span className="block text-[#FF4D8D]">Real Voices.</span>
                    <span className="block text-white">Real People.</span>
                    <span className="block bg-linear-to-r from-[#8C6DF8] to-[#5C94FF] bg-clip-text text-transparent">Real Connections.</span>
                  </h2>
                  <p className="mt-2 text-[11px] font-medium text-slate-300">Safe • Friendly • Private</p>
                  <button className="mt-4 rounded-full bg-linear-to-r from-[#FF4D8D] to-[#E11D48] px-5 py-2 text-[13px] font-bold text-white shadow-[0_0_15px_rgba(255,77,141,0.3)] transition-transform hover:scale-105">
                    Explore Rooms →
                  </button>
                </div>
                {/* 3D Mic Proxy Image/Icon */}
                <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 text-[90px] drop-shadow-[0_0_15px_rgba(255,77,141,0.4)] pointer-events-none select-none">
                  🎙️
                </div>
              </div>

              {/* Top Categories Scroll */}
              <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {topCategories.map((c) => (
                  <div key={c.id} className="min-w-[135px] flex-shrink-0 cursor-pointer flex-col rounded-2xl border border-[#232336] bg-[#12131D] p-3 transition-colors hover:bg-[#1A1C29]">
                    <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 ${c.color}`}>
                      {c.icon}
                    </div>
                    <h4 className="text-[13px] font-bold text-white">{c.title}</h4>
                    <p className="mt-0.5 text-[10px] font-medium leading-tight text-slate-400">
                      {c.subtitle}
                    </p>
                    <div className="mt-2 flex justify-end text-slate-500">
                      <Icons.ChevronRight />
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Rooms Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-end justify-between px-1">
                  <h3 className="text-[17px] font-bold text-white">Active Rooms</h3>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF4D8D]">
                    <Icons.Wave /> {rooms?.length || 0} Active Now
                  </span>
                </div>

                {isLoading ? (
                  /* Loading Skeletons */
                  <div className="flex flex-col gap-3">
                    {[1, 2].map((n) => (
                      <div key={n} className="flex h-[110px] w-full animate-pulse flex-col rounded-2xl border border-[#232336] bg-[#12131D] p-4"></div>
                    ))}
                  </div>
                ) : rooms && rooms.length > 0 ? (
                  /* Exact Matching Room Card */
                  <div className="flex flex-col gap-4">
                    {rooms.map((room) => (
                      <div key={room._id} className="relative rounded-[20px] border border-[#232336] bg-[#12131D] p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                          {/* Avatar & Info */}
                          <div className="flex gap-3.5">
                            <div className="relative shrink-0">
                              <img
                                src={room.createdBy?.imageUrl}
                                alt={room.createdBy?.fullName}
                                className="h-[52px] w-[52px] rounded-full object-cover border border-[#2A2B3D]"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${room.createdBy?.fullName || 'U'}&background=FF4D8D&color=fff`;
                                }}
                              />
                              <span className="absolute bottom-9 right-0 h-3 w-3 rounded-full border-[2px] border-[#12131D] bg-[#22C55E]"></span>
                            </div>

                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-[15px] font-bold text-white">{room.createdBy?.fullName}</h4>
                                <Icons.Verified />
                                <span className="text-[11px] font-medium text-slate-400">{room.createdBy?.age} yrs</span>
                              </div>
                              <div className="mt-[2px] flex items-center gap-1 text-[10px] font-bold tracking-wider text-[#FF4D8D] uppercase">
                                {room.roomType === 'message' ? <MessageCircleMore className='h-4' /> : <Icons.Mic />} {room.roomType}
                              </div>

                              {/* Audio Wave Visualizer & Listeners */}
                              <div className="flex flex-col items-center justify-center transition-transform hover:scale-105">
                                <div className="bg-gradient-to-b from-white to-[#FF4D8D] bg-clip-text text-2xl font-black text-transparent drop-shadow-[0_0_15px_rgba(255,77,141,0.8)]">
                                  {room.totalFollowers || 0}
                                </div>
                                <div className="text-xs font-semibold tracking-widest text-[#FF4D8D] drop-shadow-[0_0_8px_rgba(255,77,141,0.6)]">
                                  Followers
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Join Button */}
                          <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
                            <button
                              onClick={() => handleJoinRoom(room)}
                              className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-linear-to-br from-[#4dffa6] to-[#55e11d] shadow-[0_4px_14px_rgba(255,77,141,0.35)] transition-transform hover:scale-105 active:scale-95"
                            >
                              <Icons.Phone />
                            </button>
                            <span className="text-[11px] font-medium text-slate-200">Join</span>
                          </div>
                        </div>

                        {/* Languages Bottom Section */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {room.language?.map((lang) => (
                            <span key={lang} className="rounded-full border border-white/10 bg-transparent px-3.5 py-1 text-[11px] font-medium text-slate-300">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#232336] bg-[#12131D] px-4 py-8 text-center text-[13px] text-slate-400">
                    No active rooms right now. Check back soon!
                  </div>
                )}
              </div>

              {/* Only Girls Banner */}
              <div className="relative rounded-[16px] bg-linear-to-r from-[#FF4D8D]/40 to-transparent p-[1px] overflow-hidden">
                <div className="flex items-center gap-3 rounded-[16px] bg-[#120B15] px-4 py-3.5 relative z-10">
                  <div className="shrink-0 flex items-center justify-center h-10 w-10">
                    <Icons.HeartShield />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-[13px] font-bold text-[#FF4D8D]">Only Girls Can Create Rooms</h4>
                    <p className="mt-0.5 text-[10px] text-slate-300 leading-snug pr-8">
                      To keep AddaLove safe, respectful and comfortable for everyone.
                    </p>
                  </div>
                  <div className="absolute right-4 opacity-50 flex items-center justify-center">
                    <Icons.LockShield />
                  </div>
                </div>
              </div>

              {/* Popular This Week */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[15px] font-bold text-white px-1">Popular This Week</h3>
                <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {popularTags.map((tag) => (
                    <div key={tag.id} className="min-w-[120px] shrink-0 rounded-2xl border border-[#232336] bg-[#12131D] p-3 flex flex-col items-center text-center gap-1.5 transition-colors hover:bg-[#1A1C29]">
                      <div className="text-[22px] leading-none mb-1 drop-shadow-md">{tag.icon}</div>
                      <h4 className="text-[11px] font-bold text-white leading-tight">{tag.title}</h4>
                      <p className="text-[9px] font-medium text-slate-400">{tag.rooms}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Priority Footer Banner */}
              <div className="flex cursor-pointer items-center justify-between rounded-xl bg-[#12131D] border border-white/5 px-4 py-3 transition-colors hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF4D8D]/15 text-[#FF4D8D]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-[13px] font-bold text-[#D8B4FE]">Your Safety, Our Priority</h4>
                    <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                      24x7 Moderation • No Harassment • 100% Secure
                    </p>
                  </div>
                </div>
                <div className="text-slate-500">
                  <Icons.ChevronRight />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Error Handling */}
        {error && (
          <p className="mx-6 mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 text-center">
            {error}
          </p>
        )}

        {/* Fallback for No Role */}
        {!isBoy && !isGirl && (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">
            No role found for this account.
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;