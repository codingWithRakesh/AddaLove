import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore.js';
import useRoomStore from '../store/roomStore.js';

const roomTypes = ['message', 'voice', 'video'];
const languages = ['Bengali', 'Hindi', 'Gujarati', 'English', 'Kannada', 'Marathi', 'Tamil', 'Telugu', 'Urdu', 'Punjabi'];

const Home = () => {
  const navigate = useNavigate();
  const { userRole } = useUserStore();
  const { isLoading, error, createRoom, joinRoom , rooms } = useRoomStore();
  const [roomType, setRoomType] = useState('message');
  const [roomId, setRoomId] = useState('');
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
      const { roomId } = await createRoom(roomType, selectedLanguages);
      navigate(`/messageRoom/${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };
  const handleJoinRoom = async () => {
    if(roomId.trim() === '') {
      alert('Please enter a room ID.');
      return;
    }

    try {
      await joinRoom(roomId);
      navigate(`/messageRoom/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1E293B] p-6 shadow-2xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#FF4D8D]">Home</p>
          <h1 className="mt-2 text-2xl font-black">{isGirl ? 'Create a room' : 'Join a room'}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {isGirl ? 'Choose a room type, select 2 languages, and create your room.' : 'Enter the room ID and join.'}
          </p>
        </div>

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
                <span className={selectedLanguages.length === 2 ? 'text-[#4DA6FF]' : 'text-slate-400'}>
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
                      className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${isSelected ? 'border-[#4DA6FF] bg-[#4DA6FF]/15 text-white' : 'border-white/10 bg-white/5 text-slate-300'} ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-white/10'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleLanguageChange(language)}
                        className="h-4 w-4 accent-[#4DA6FF]"
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

        {isBoy && (
          <div className="mt-6 space-y-4">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#4DA6FF]"
            />
            <button
              type="button"
              onClick={handleJoinRoom}
              disabled={isLoading}
              className="w-full rounded-2xl bg-linear-to-r from-[#4DA6FF] to-[#6C3BFF] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>
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
