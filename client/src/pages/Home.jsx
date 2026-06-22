import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore.js';
import useRoomStore from '../store/roomStore.js';
import { socket } from '../socket/socket.js';

const roomTypes = ['message', 'voice', 'video'];
const languages = ['Bengali', 'Hindi', 'Gujarati', 'English', 'Kannada', 'Marathi', 'Tamil', 'Telugu', 'Urdu', 'Punjabi'];

const getRoomPath = (type, roomId) => {
  if (type === 'voice') return `/voiceRoom/${roomId}`;
  return `/messageRoom/${roomId}`;
};

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
    const refreshRooms = () => getOpenRooms().catch(() => {});
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
    <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1E293B] p-6 shadow-2xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#FF4D8D]">Home</p>
          <h1 className="mt-2 text-2xl font-black">{isGirl ? 'Create a room' : 'Join a room'}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {isGirl ? 'Choose a room type, select 2 languages, and create your room.' : 'Browse open rooms or enter a room ID to join.'}
          </p>
        </div>

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

        {/* BOY UI */}
        {isBoy && (
          <div className="mt-6 space-y-6">
            
            {/* Open Rooms List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-slate-200">Available Rooms</h2>
                {rooms && rooms.length > 0 && (
                  <span className="text-xs font-medium text-[#FF4D8D] bg-[#FF4D8D]/10 border border-[#FF4D8D]/20 px-2 py-1 rounded-full">
                    {rooms.length} Active
                  </span>
                )}
              </div>

              {isLoading ? (
                /* Skeleton Loader */
                <div className="flex max-h-87.5 flex-col gap-3 overflow-y-auto pr-1">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex w-full animate-pulse flex-col rounded-2xl border border-[#FF4D8D]/20 bg-[#FF4D8D]/5 p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-[#FF4D8D]/20"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-[#FF4D8D]/20"></div>
                          <div className="h-3 w-1/2 rounded bg-[#FF4D8D]/10"></div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <div className="h-6 w-16 rounded-full bg-[#FF4D8D]/20"></div>
                        <div className="h-6 w-20 rounded-full bg-[#FF4D8D]/20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : rooms && rooms.length > 0 ? (
                /* Room Cards with Pink / Girl Vibe */
                <div className="flex max-h-87.5 flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
                  {rooms.map((room) => (
                    <button
                      key={room._id}
                      onClick={() => handleJoinRoom(room)}
                      // Added pink hover glow, pink border, and pink background tint
                      className="group flex w-full flex-col rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all duration-300 hover:border-[#FF4D8D] hover:bg-[#FF4D8D]/5 hover:shadow-[0_0_20px_rgba(255,77,141,0.15)] focus:outline-none"
                    >
                      <div className="flex items-center gap-4 w-full">
                        <img
                          src={room.createdBy?.imageUrl}
                          alt={room.createdBy?.fullName}
                          // Added pink border on hover for avatar
                          className="h-12 w-12 rounded-full object-cover border-2 border-transparent group-hover:border-[#FF4D8D] transition-colors duration-300"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${room.createdBy?.fullName || 'U'}&background=FF4D8D&color=fff`;
                          }}
                        />
                        <div className="flex-1 overflow-hidden">
                          <h3 className="truncate font-semibold text-white flex items-baseline gap-1.5">
                            {room.createdBy?.fullName}
                            <span className="text-xs font-normal text-slate-400">{room.createdBy?.age} yrs</span>
                          </h3>
                          {/* Changed text color to pink */}
                          <p className="mt-0.5 text-[11px] font-bold tracking-wider text-[#FF4D8D] uppercase flex items-center gap-1">
                            {room.roomType === 'video' && <span className="text-base leading-none">📹</span>}
                            {room.roomType === 'voice' && <span className="text-base leading-none">🎤</span>}
                            {room.roomType === 'message' && <span className="text-base leading-none">💬</span>}
                            {room.roomType}
                          </p>
                        </div>
                        
                        {/* Join Arrow Icon - Pre-tinted pink, fills pink on hover */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF4D8D]/10 text-[#FF4D8D] transition-all duration-300 group-hover:bg-[#FF4D8D] group-hover:text-white group-hover:shadow-lg group-hover:-translate-x-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </div>
                      </div>
                      
                      {/* Language Tags - Given a subtle pink tint */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {room.language?.map((lang) => (
                          <span key={lang} className="rounded-lg border border-[#FF4D8D]/20 bg-[#FF4D8D]/5 px-2.5 py-1 text-[10px] font-medium text-pink-100/90 group-hover:border-[#FF4D8D]/40 group-hover:bg-[#FF4D8D]/10 transition-colors">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="rounded-2xl border border-dashed border-[#FF4D8D]/30 bg-[#FF4D8D]/5 px-4 py-8 text-center text-sm text-[#FF4D8D]/70">
                  No rooms available right now. Waiting for the girls to create one...
                </div>
              )}
            </div>

            {/* Manual Join Section (Fallback) */}
        
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

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
