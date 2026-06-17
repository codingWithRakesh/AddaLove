import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore.js';
import useRoomStore from '../store/roomStore.js';

const roomTypes = ['message', 'voice', 'video'];

const Home = () => {
  const navigate = useNavigate();
  const { userRole } = useUserStore();
  const { room, isLoading, error, createRoom, joinRoom } = useRoomStore();
  const [roomType, setRoomType] = useState('message');
  const [roomId, setRoomId] = useState('');

  const isBoy = useMemo(() => userRole === 'boy', [userRole]);
  const isGirl = useMemo(() => userRole === 'girl', [userRole]);

  const handleCreateRoom = async () => {
    try {
      const { roomId } = await createRoom(roomType);
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
            {isGirl ? 'Choose a room type and create your room.' : 'Enter the room ID and join.'}
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

            <button
              type="button"
              onClick={handleCreateRoom}
              className="w-full rounded-2xl bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] px-4 py-3 font-bold text-white"
            >
              Create Room
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
              className="w-full rounded-2xl bg-linear-to-r from-[#4DA6FF] to-[#6C3BFF] px-4 py-3 font-bold text-white"
            >
              Join Room
            </button>
          </div>
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
