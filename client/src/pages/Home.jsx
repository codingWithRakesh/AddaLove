import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore.js';
import useRoomStore from '../store/roomStore.js';
import { MessageCircleMore } from 'lucide-react';

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
  ),
  Message: () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 17 0Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
  ),
  Heart: () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.9-4.18-9.33-8.35C.55 9.02 2.82 4.5 7.05 4.5c2.04 0 3.45 1.08 4.95 2.81 1.5-1.73 2.91-2.81 4.95-2.81 4.23 0 6.5 4.52 4.38 8.15C18.9 16.82 12 21 12 21Z" /></svg>
  ),
  Smile: () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>
  ),
  Lightbulb: () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M8.5 14.5A6.5 6.5 0 1 1 15.5 14c-.92.62-1.5 1.58-1.5 2.5h-4c0-.83-.46-1.49-1.5-2Z" /></svg>
  ),
  Headphones: () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14a9 9 0 0 1 18 0" /><path d="M5 14h3v7H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2ZM16 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3v-7Z" /></svg>
  ),
  Sparkle: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2ZM19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14ZM5 13l.8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z" /></svg>
  ),
  Video: () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5 3V8l-5 3Z" /><rect width="14" height="12" x="2" y="6" rx="2" /></svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5" /></svg>
  ),
  Globe: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" /></svg>
  ),
  Gear: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.16.6.78 1 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" /></svg>
  ),
  ChevronDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
  ),
  Gift: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>
  ),
  Lock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
  ),
  UsersGroup: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Rocket: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.12-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.9 12.9 0 0 1 22 2c0 2.72-.78 7.5-6 11a22 22 0 0 1-4 2Z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
  ),
  ShieldStar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m12 8 .8 2.1 2.2.1-1.7 1.4.6 2.2-1.9-1.2-1.9 1.2.6-2.2L9 10.2l2.2-.1Z" /></svg>
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

const girlRoomTypes = [
  { type: 'message', title: 'Message', subtitle: 'Text Chat', icon: <Icons.Message /> },
  { type: 'voice', title: 'Voice', subtitle: 'Voice Chat', icon: <Icons.Mic /> },
  { type: 'video', title: 'Video', subtitle: 'Video Call', icon: <Icons.Video />, disabled: true },
];

const popularTagCards = popularTags.map((tag) => ({
  ...tag,
  icon: {
    1: <Icons.Heart />,
    2: <Icons.UsersGroup />,
    3: <Icons.Moon />,
    4: <Icons.Smile />,
  }[tag.id],
}));

const girlVibes = [
  { title: 'Chill & Talk', subtitle: 'Casual Chat', icon: <Icons.Message /> },
  { title: 'Deep Talks', subtitle: 'Meaningful', icon: <Icons.Moon /> },
  { title: 'Fun & Masti', subtitle: 'Just for Fun', icon: <Icons.Smile /> },
  { title: 'Study Buddies', subtitle: 'Learn Together', icon: <Icons.Lightbulb /> },
  { title: 'Music Lounge', subtitle: 'Share Vibes', icon: <Icons.Headphones /> },
];

const Home = () => {
  const navigate = useNavigate();
  const { userRole  } = useUserStore();
  const { isLoading, error, createRoom, joinRoom, rooms } = useRoomStore();
  const [roomType, setRoomType] = useState('message');
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  const isBoy = useMemo(() => userRole === 'boy', [userRole]);
  const isGirl = useMemo(() => userRole === 'girl', [userRole]);

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
    if (typeof targetRoom === 'object' && targetRoom.status === 'occupied') {
      alert('This room is currently occupied. Try again shortly.');
      return;
    }
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
    <div className={`min-h-screen ${isBoy || isGirl ? 'bg-[#090A10]' : 'bg-[#0F172A]'} text-white flex justify-center sm:items-center px-0 sm:px-4 sm:py-8`}>
      <div className={`w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col ${isBoy ? 'bg-[#0B0C13] border-none sm:rounded-3xl sm:border sm:border-white/5' : isGirl ? 'bg-[#070812] border-none sm:rounded-3xl sm:border sm:border-white/5' : 'bg-[#1E293B] rounded-3xl border border-white/10 p-6'}`}>

        {/* Girl/Unknown Header (Hidden for Boy) */}
        {!isBoy && !isGirl && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[#FF4D8D]">Home</p>
            <h1 className="mt-2 text-2xl font-black">Join a room</h1>
            <p className="mt-2 text-sm text-slate-400">
              Browse open rooms or enter a room ID to join.
            </p>
          </div>
        )}

        {/* GIRL UI */}
        {isGirl && (
          <div className="flex-1 overflow-y-auto px-4 pt-24 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            <div className="girl-create-ui rounded-3xl border border-white/10 bg-[#090915] px-4 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="relative overflow-hidden rounded-[18px] border border-[#FF4D8D]/15 bg-[#0F0D1C] px-4 py-5">
                <div className="absolute right-3 top-2 h-24 w-24 rounded-full bg-[#FF4D8D]/20 blur-2xl"></div>
                <div className="absolute right-16 bottom-0 h-20 w-20 rounded-full bg-[#6C3BFF]/20 blur-2xl"></div>
                <div className="relative z-10 max-w-[58%]">
                  <h1 className="text-[30px] font-black leading-tight tracking-normal text-white">
                    Create a <span className="text-[#FF4D8D]">Room</span>
                  </h1>
                  <p className="mt-2 text-[14px] font-semibold leading-6 text-slate-300">
                    Choose your vibe, select 2 languages and let the fun begin!
                  </p>
                </div>
                <div className="absolute right-5 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-[28px] bg-linear-to-br from-[#FF4D8D] to-[#7C2DFF] text-white shadow-[0_0_28px_rgba(255,77,141,0.45)]">
                  <Icons.Message />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {girlRoomTypes.map((option) => {
                  const isSelected = roomType === option.type;

                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => !option.disabled && setRoomType(option.type)}
                      disabled={option.disabled}
                      className={`relative flex min-h-21.5 flex-col items-center justify-center rounded-[18px] border px-2 py-3 text-center transition-all ${isSelected ? 'border-[#FF4D8D] bg-[#FF4D8D]/20 text-white shadow-[0_0_20px_rgba(255,77,141,0.36)]' : 'border-white/10 bg-[#11111F] text-slate-300 hover:border-white/20'} ${option.disabled ? 'cursor-not-allowed opacity-55' : ''}`}
                    >
                      <span className={isSelected ? 'text-[#FF4D8D]' : 'text-[#8D88B8]'}>{option.icon}</span>
                      <span className="mt-2 text-[14px] font-black">{option.title}</span>
                      <span className="mt-0.5 text-[11px] font-semibold text-slate-400">{option.subtitle}</span>
                    </button>
                  );
                })}
              </div>

              <div className="girl-vibe-section mt-6">
                <h2 className="flex items-center gap-2 text-[17px] font-black text-white">
                  Pick a Vibe <span className="text-[#FF4D8D]"><Icons.Heart /></span>
                </h2>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                  {girlVibes.map((vibe, index) => (
                    <button
                      key={vibe.title}
                      type="button"
                      className={`relative min-w-29.5 rounded-[18px] border px-3 py-4 text-left transition-colors ${index === 0 ? 'border-[#FF4D8D] bg-[#311029] shadow-[0_0_18px_rgba(255,77,141,0.32)]' : 'border-white/10 bg-[#11111F] hover:border-white/20'}`}
                    >
                      {index === 0 && (
                        <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF4D8D] text-white shadow-[0_0_14px_rgba(255,77,141,0.6)]">
                          <Icons.Check />
                        </span>
                      )}
                      <div className={`flex h-14 items-center justify-center ${index === 0 ? 'text-[#FF4D8D]' : 'text-[#A7A0D8]'}`}>
                        {vibe.icon}
                      </div>
                      <h3 className={`mt-3 text-[13px] font-black ${index === 2 || index === 4 ? 'text-[#FF5DA4]' : 'text-white'}`}>{vibe.title}</h3>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{vibe.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#A7A0D8]"><Icons.Globe /></span>
                    <span className="text-[17px] font-black text-white">Select 2 Languages</span>
                  </div>
                  <span className={`flex items-center gap-2 text-[13px] font-bold ${selectedLanguages.length === 2 ? 'text-[#FF4D8D]' : 'text-slate-400'}`}>
                    {selectedLanguages.length}/2 selected
                    {selectedLanguages.length === 2 && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF4D8D] text-white">
                        <Icons.Check />
                      </span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {languages.map((language) => {
                    const isSelected = selectedLanguages.includes(language);
                    const isDisabled = !isSelected && selectedLanguages.length === 2;

                    return (
                      <button
                        key={language}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleLanguageChange(language)}
                        className={`flex min-h-12 items-center gap-3 rounded-[14px] border px-3 text-left text-[14px] font-bold transition-colors ${isSelected ? 'border-[#FF4D8D] bg-[#FF4D8D]/16 text-white' : 'border-white/10 bg-[#10101D] text-slate-300'} ${isDisabled ? 'cursor-not-allowed opacity-45' : 'hover:border-white/20'}`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${isSelected ? 'border-[#FF4D8D] bg-[#FF4D8D] text-white' : 'border-white/15 bg-transparent text-transparent'}`}>
                          <Icons.Check />
                        </span>
                        <span className="truncate">{language}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[#A7A0D8]"><Icons.Gear /></span>
                  <span className="text-[17px] font-black text-white">Optional Settings</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <button type="button" className="flex min-h-18.5 items-center gap-3 rounded-3xl border border-white/10 bg-[#11111F] px-3 text-left">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF4D8D]/18 text-[#FF4D8D]"><Icons.Lock /></span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-black text-[#FF4D8D]">Room Privacy</span>
                      <span className="mt-1 flex items-center gap-1 text-[12px] font-bold text-white">Anyone can join <Icons.ChevronDown /></span>
                    </span>
                  </button>
                  <button type="button" className="flex min-h-18.5 items-center gap-3 rounded-3xl border border-white/10 bg-[#11111F] px-3 text-left">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED]/20 text-[#A855F7]"><Icons.UsersGroup /></span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-black text-[#FF4D8D]">Age Preference</span>
                      <span className="mt-1 flex items-center gap-1 text-[12px] font-bold text-white">18 - 25 <Icons.ChevronDown /></span>
                    </span>
                  </button>
                  <div className="flex min-h-18.5 items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#11111F] px-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF4D8D]/18 text-[#FF4D8D]"><Icons.Gift /></span>
                      <span className="text-[12px] font-black text-[#FF4D8D]">Allow Gifts</span>
                    </div>
                    <span className="relative h-8 w-14 rounded-full bg-linear-to-r from-[#A855F7] to-[#FF4D8D] p-1 shadow-[0_0_12px_rgba(255,77,141,0.35)]">
                      <span className="block h-6 w-6 translate-x-6 rounded-full bg-white"></span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isLoading || selectedLanguages.length !== 2}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-[20px] bg-linear-to-r from-[#7C2DFF] via-[#C026D3] to-[#FF2D87] px-4 py-4 text-[20px] font-black text-white shadow-[0_12px_30px_rgba(255,45,135,0.3)] transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icons.Rocket />
                <span>{isLoading ? 'Creating...' : 'Create Room'}</span>
              </button>
              <p className="mt-1 text-center text-[13px] font-semibold text-slate-300">Let the good vibes begin!</p>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FF4D8D]/15 text-[#FF4D8D]"><Icons.ShieldStar /></div>
                  <p className="mt-2 text-[12px] font-black text-[#A855F7]">No Rules</p>
                  <p className="text-[10px] font-semibold text-slate-400">Just Respect</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FF4D8D]/15 text-[#FF4D8D]"><Icons.LockShield /></div>
                  <p className="mt-2 text-[12px] font-black text-[#A855F7]">Safe & Secure</p>
                  <p className="text-[10px] font-semibold text-slate-400">100% Moderated</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#6C3BFF]/20 text-[#8B5CF6]"><Icons.UsersGroup /></div>
                  <p className="mt-2 text-[12px] font-black text-[#A855F7]">Real People</p>
                  <p className="text-[10px] font-semibold text-slate-400">Real Connections</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOY UI - Redesigned to match provided image exactly */}
        {isBoy && (
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            <div className="flex flex-col gap-6">

              {/* Hero Banner */}
              <div className="relative w-full rounded-2xl border mt-18 border-[#FF4D8D]/20 bg-linear-to-br from-[#2D1433] via-[#141021] to-[#0D111A] p-5 overflow-hidden shadow-lg">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-[#FF4D8D] opacity-20 blur-2xl"></div>
                <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-[#6C3BFF] opacity-20 blur-2xl"></div>

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
                <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 text-[90px] drop-shadow-[0_0_15px_rgba(255,77,141,0.4)] pointer-events-none select-none">
                  🎙️
                </div>
              </div>

              {/* Top Categories Scroll */}
              <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                {topCategories.map((c) => (
                  <div key={c.id} className="min-w-33.75 shrink-0 cursor-pointer flex-col rounded-2xl border border-[#232336] bg-[#12131D] p-3 transition-colors hover:bg-[#1A1C29]">
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
                      <div key={n} className="flex h-27.5 w-full animate-pulse flex-col rounded-2xl border border-[#232336] bg-[#12131D] p-4"></div>
                    ))}
                  </div>
                ) : rooms && rooms.length > 0 ? (
                  /* Exact Matching Room Card */
                  <div className="flex flex-col gap-4">
                    {rooms.map((room) => {
                      const isOccupied = room.status === 'occupied' || Boolean(room.currentBoy);

                      return (
                      <div key={room.roomId || room._id} className={`relative rounded-[20px] border p-4 shadow-sm ${isOccupied ? 'border-yellow-400/25 bg-[#17151A]' : 'border-[#232336] bg-[#12131D]'}`}>
                        <div className="flex items-start justify-between">
                          {/* Avatar & Info */}
                          <div className="flex gap-3.5">
                            <div className="relative shrink-0">
                              <img
                                src={room.createdBy?.imageUrl}
                                alt={room.createdBy?.fullName}
                                className="h-13 w-13 rounded-full object-cover border border-[#2A2B3D]"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${room.createdBy?.fullName || 'U'}&background=FF4D8D&color=fff`;
                                }}
                              />
                              <span className="absolute bottom-9 right-0 h-3 w-3 rounded-full border-2 border-[#12131D] bg-[#22C55E]"></span>
                            </div>

                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-[15px] font-bold text-white">{room.createdBy?.fullName}</h4>
                                <Icons.Verified />
                                <span className="text-[11px] font-medium text-slate-400">{room.createdBy?.age} yrs</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold tracking-wider text-[#FF4D8D] uppercase">
                                {room.roomType === 'message' ? <MessageCircleMore className='h-4' /> : <Icons.Mic />} {room.roomType}
                              </div>
                              <span className={`mt-1 w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isOccupied ? 'border-yellow-400/25 bg-yellow-400/10 text-yellow-300' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'}`}>
                                {isOccupied ? 'Occupied' : 'Available'}
                              </span>

                              {/* Audio Wave Visualizer & Listeners */}
                              <div className="flex flex-col items-center justify-center transition-transform hover:scale-105">
                                <div className="bg-linear-to-b from-white to-[#FF4D8D] bg-clip-text text-2xl font-black text-transparent drop-shadow-[0_0_15px_rgba(255,77,141,0.8)]">
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
                              disabled={isOccupied}
                              className={`flex h-10.5 w-10.5 items-center justify-center rounded-full shadow-[0_4px_14px_rgba(255,77,141,0.35)] transition-transform active:scale-95 ${isOccupied ? 'cursor-not-allowed bg-slate-700 opacity-60' : 'bg-linear-to-br from-[#4dffa6] to-[#55e11d] hover:scale-105'}`}
                            >
                              <Icons.Phone />
                            </button>
                            <span className="text-[11px] font-medium text-slate-200">{isOccupied ? 'Busy' : 'Join'}</span>
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
                    )})}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#232336] bg-[#12131D] px-4 py-8 text-center text-[13px] text-slate-400">
                    No active rooms right now. Check back soon!
                  </div>
                )}
              </div>

              {/* Only Girls Banner */}
              <div className="relative rounded-3xl bg-linear-to-r from-[#FF4D8D]/40 to-transparent p-px overflow-hidden">
                <div className="flex items-center gap-3 rounded-3xl bg-[#120B15] px-4 py-3.5 relative z-10">
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
                <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                  {popularTagCards.map((tag) => (
                    <div key={tag.id} className="min-w-30 shrink-0 rounded-2xl border border-[#232336] bg-[#12131D] p-3 flex flex-col items-center text-center gap-1.5 transition-colors hover:bg-[#1A1C29]">
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
