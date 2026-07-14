import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Headphones, LoaderCircle, LogOut, Mic, MicOff, PhoneOff, Radio, Trash2, 
  TriangleAlert, Volume2, VolumeX, ChevronDown, MoreVertical, Bell, 
  User, Heart, Users, Star, Crown, ShieldCheck, Lock, Activity
} from 'lucide-react';
import useUserStore from '../store/userStore.js';
import useRoomStore from '../store/roomStore.js';
import { connectSocket, socket } from '../socket/socket.js';
import useReportStore from '../store/reportStore.js';
import ReportPopup from '../components/ReportPopup.jsx';
import { handleError, handleSuccess } from '../components/ErrorMessage.jsx';
import useRatingStore from '../store/ratingStore.js';
import RatingPopup from '../components/RatingPopup.jsx';

const peerConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const fallbackAvatar = (name = 'User') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6C3BFF&color=fff&bold=true`;

export default function AudioRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useUserStore();
  const { getRoomDetails, leaveRoom, destroyRoom, resetRoomState } = useRoomStore();
  const [girlProfile, setGirlProfile] = useState(null);
  const [boyProfile, setBoyProfile] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [connectionState, setConnectionState] = useState('waiting');
  const [error, setError] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [afterRatingAction, setAfterRatingAction] = useState(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const boyProfileRef = useRef(null);
  const girlProfileRef = useRef(null);
  const hasPendingRatingRef = useRef(false);
  const suppressCloseRatingRef = useRef(false);
  
  // Stats and Duration States
  const [boyFollowers, setBoyFollowers] = useState(0);
  const [girlFollowers, setGirlFollowers] = useState(0);
  const [boyJoinedAt, setBoyJoinedAt] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  // Optional extra states for future API support
  const [girlTopFollower, setGirlTopFollower] = useState(null);
  const [boyRespectPoints, setBoyRespectPoints] = useState(null);
  const [boyTopRespecter, setBoyTopRespecter] = useState(null);

  const { createReport, isLoading: isReportSubmitting } = useReportStore();
  const { createRating, checkRating, isLoading: isRatingSubmitting } = useRatingStore();

  const isGirl = userRole === 'girl';
  const partner = isGirl ? boyProfile : girlProfile;
  const partnerName = partner?.fullName || 'Guest';
  const isBoyInside = isGirl ? Boolean(boyProfile) : true;
  const isBoy = useMemo(() => userRole === 'boy', [userRole]);
  
  useEffect(() => {
  }, [roomId]);

  // Timer Effect
  useEffect(() => {
    let interval;
    if (boyJoinedAt && isBoyInside) {
      interval = setInterval(() => {
        const joinTime = new Date(boyJoinedAt).getTime();
        const diffInSeconds = Math.floor((Date.now() - joinTime) / 1000);
        
        if (diffInSeconds >= 0) {
          const hrs = Math.floor(diffInSeconds / 3600).toString().padStart(2, '0');
          const mins = Math.floor((diffInSeconds % 3600) / 60).toString().padStart(2, '0');
          const secs = (diffInSeconds % 60).toString().padStart(2, '0');
          setElapsedTime(`${hrs}:${mins}:${secs}`);
        }
      }, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    
    return () => clearInterval(interval);
  }, [boyJoinedAt, isBoyInside]);

  const stopPeer = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    pendingCandidatesRef.current = [];
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setConnectionState('waiting');
  }, []);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const ensurePeer = useCallback(async () => {
    if (peerRef.current && peerRef.current.signalingState !== 'closed') return peerRef.current;

    const stream = await ensureLocalStream();
    const peer = new RTCPeerConnection(peerConfiguration);
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('ice_candidate', { roomId, candidate });
    };
    peer.ontrack = ({ streams }) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = streams[0];
        remoteAudioRef.current.play().catch(() => { });
      }
      setConnectionState('connected');
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') setConnectionState('connected');
      if (['failed', 'disconnected'].includes(peer.connectionState)) setConnectionState('reconnecting');
    };
    peerRef.current = peer;
    return peer;
  }, [ensureLocalStream, roomId]);

  const addPendingCandidates = useCallback(async (peer) => {
    const candidates = pendingCandidatesRef.current.splice(0);
    for (const candidate of candidates) await peer.addIceCandidate(candidate);
  }, []);

  const createOffer = useCallback(async () => {
    try {
      stopPeer();
      setConnectionState('connecting');
      const peer = await ensurePeer();
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('offer', { roomId, offer: peer.localDescription });
    } catch (mediaError) {
      setError(mediaError.name === 'NotAllowedError' ? 'Microphone permission is required for an audio room.' : 'Could not start the audio connection.');
    }
  }, [ensurePeer, roomId, stopPeer]);

  const exitRoom = useCallback(() => {
    socket.emit('leave_room', { roomId });
    stopPeer();
    resetRoomState();
    navigate('/');
  }, [navigate, resetRoomState, roomId, stopPeer]);

  const runAfterRatingAction = useCallback(async (action) => {
    if (action === 'destroyThenExit') {
      suppressCloseRatingRef.current = true;
      await destroyRoom(roomId);
      exitRoom();
      return;
    }

    if (action === 'exit') {
      suppressCloseRatingRef.current = true;
      exitRoom();
    }
  }, [destroyRoom, exitRoom, roomId]);

  const openRatingPopup = useCallback(async (targetUser, action = null) => {
    if (!targetUser?._id || hasPendingRatingRef.current) return;

    try {
      const hasRated = await checkRating(targetUser._id);
      if (hasRated) {
        await runAfterRatingAction(action);
        return;
      }
    } catch (checkError) {
      console.error('Error checking rating:', checkError);
    }

    hasPendingRatingRef.current = true;
    setRatingTarget(targetUser);
    setAfterRatingAction(action);
    setIsRatingOpen(true);
  }, [checkRating, runAfterRatingAction]);

  const completeRatingFlow = useCallback(async () => {
    const action = afterRatingAction;

    hasPendingRatingRef.current = false;
    setIsRatingOpen(false);
    setRatingTarget(null);
    setAfterRatingAction(null);

    await runAfterRatingAction(action);
  }, [afterRatingAction, runAfterRatingAction]);

  const handleExit = async () => {
    if (isLeaving) return;
    try {
      setIsLeaving(true);
      if (isGirl) {
        if (boyProfile?._id) {
          await openRatingPopup(boyProfile, 'destroyThenExit');
          return;
        }
        await destroyRoom(roomId);
        exitRoom();
        return;
      }

      await leaveRoom(roomId);
      if (girlProfile?._id) {
        await openRatingPopup(girlProfile, 'exit');
      } else {
        exitRoom();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not leave the room. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleReportSubmit = async (reason) => {
    if (!partner?._id) {
      handleError('No user available to report');
      return;
    }

    try {
      await createReport({
        reportedUserId: partner._id,
        reason,
      });
      setIsReportOpen(false);
      handleSuccess('Report sended');
    } catch (reportError) {
      handleError(reportError?.response?.data?.message || 'Could not send report');
    }
  };

  const handleRatingSubmit = async (rating) => {
    if (!ratingTarget?._id) {
      handleError('No user available to rate');
      return;
    }

    try {
      await createRating({
        ratedUserId: ratingTarget._id,
        rating,
      });
      handleSuccess('Rating sended');
      await completeRatingFlow();
    } catch (ratingError) {
      const message = ratingError?.response?.data?.message || 'Could not send rating';
      if (message.toLowerCase().includes('already rated')) {
        handleSuccess('Rating already sended');
        await completeRatingFlow();
        return;
      }
      handleError(message);
    }
  };

  const handleRatingLater = async () => {
    if (!isBoy) return;
    await completeRatingFlow();
  };

  useEffect(() => {
    if (!roomId || !user?._id) return undefined;
    let active = true;

    const joinSocketRoom = () => socket.emit('join_room', { roomId });
    const handleRoomJoined = () => {
      if (isGirl && boyProfileRef.current) createOffer();
    };
    const handleParticipantJoined = (data) => {
      if (data.roomId === roomId && isGirl) createOffer();
    };
    const handleOffer = async (data) => {
      if (data.roomId !== roomId) return;
      try {
        stopPeer();
        setConnectionState('connecting');
        const peer = await ensurePeer();
        await peer.setRemoteDescription(data.offer);
        await addPendingCandidates(peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', { roomId, answer: peer.localDescription });
      } catch {
        setError('Could not answer the audio connection.');
      }
    };
    const handleAnswer = async (data) => {
      if (data.roomId !== roomId || !peerRef.current) return;
      try {
        await peerRef.current.setRemoteDescription(data.answer);
        await addPendingCandidates(peerRef.current);
      } catch {
        setError('Could not complete the audio connection.');
      }
    };
    const handleCandidate = async (data) => {
      if (data.roomId !== roomId || !data.candidate) return;
      const peer = peerRef.current;
      if (!peer?.remoteDescription) pendingCandidatesRef.current.push(data.candidate);
      else await peer.addIceCandidate(data.candidate).catch(() => { });
    };
    const handleBoyJoined = async (data) => {
      if (data.roomId !== roomId || !isGirl) return;
      try {
        const details = await getRoomDetails(roomId);
        if (!active) return;
        boyProfileRef.current = details.room.currentBoy;
        setBoyProfile(details.room.currentBoy);
        setBoyFollowers(details.room.boyExtraDetails?.followerCount || 0);
        setGirlFollowers(details.room.girlsExtraDetails?.followerCount || 0);
        setBoyJoinedAt(details.room.currentBoyJoinedAt);
        
        // Optional additions for API extensions
        if (details.room.girlsExtraDetails?.topFollower) setGirlTopFollower(details.room.girlsExtraDetails.topFollower);
        if (details.room.boyExtraDetails?.respectPoints) setBoyRespectPoints(details.room.boyExtraDetails.respectPoints);
        if (details.room.boyExtraDetails?.topRespecter) setBoyTopRespecter(details.room.boyExtraDetails.topRespecter);

      } catch {
        setError('Could not load the new participant.');
      }
    };
    const handleBoyLeft = (data) => {
      if (data.roomId !== roomId) return;
      const leavingBoy = boyProfileRef.current;
      stopPeer();
      
      if (isGirl) {
        boyProfileRef.current = null;
        setBoyProfile(null);
        setBoyJoinedAt(null);
        setBoyFollowers(0);
        setElapsedTime('00:00:00');
        if (leavingBoy?._id) openRatingPopup(leavingBoy, null);
      } else if (String(data.boyId) === String(user._id)) {
        openRatingPopup(girlProfileRef.current, 'exit');
      }
    };
    const handleRoomClosed = (data) => {
      if (data.roomId !== roomId) return;

      if (suppressCloseRatingRef.current) {
        exitRoom();
        return;
      }

      stopPeer();
      const target = isGirl ? boyProfileRef.current : girlProfileRef.current;
      if (target?._id) {
        openRatingPopup(target, 'exit');
        return;
      }

      exitRoom();
    };
    const handleRoomError = (data) => {
      if (!data.roomId || data.roomId === roomId) setError(data.message);
    };

    socket.on('room_joined', handleRoomJoined);
    socket.on('voice_participant_joined', handleParticipantJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice_candidate', handleCandidate);
    socket.on('boy_joined', handleBoyJoined);
    socket.on('boy_left', handleBoyLeft);
    socket.on('room_destroyed', handleRoomClosed);
    socket.on('room_closed', handleRoomClosed);
    socket.on('room_error', handleRoomError);

    const initialize = async () => {
      try {
        const details = await getRoomDetails(roomId);
        if (!active) return;
        if (details.room.roomType !== 'voice') {
          navigate(`/messageRoom/${roomId}`, { replace: true });
          return;
        }
        setGirlProfile(details.room.createdBy);
        girlProfileRef.current = details.room.createdBy;
        
        if (details.room.currentBoy) {
          setBoyProfile(details.room.currentBoy);
          boyProfileRef.current = details.room.currentBoy;
          setBoyJoinedAt(details.room.currentBoyJoinedAt);
        }
        
        setBoyFollowers(details.room.boyExtraDetails?.followerCount || 0);
        setGirlFollowers(details.room.girlsExtraDetails?.followerCount || 0);
        
        // Optional additions for API extensions
        if (details.room.girlsExtraDetails?.topFollower) setGirlTopFollower(details.room.girlsExtraDetails.topFollower);
        if (details.room.boyExtraDetails?.respectPoints) setBoyRespectPoints(details.room.boyExtraDetails.respectPoints);
        if (details.room.boyExtraDetails?.topRespecter) setBoyTopRespecter(details.room.boyExtraDetails.topRespecter);

        await ensureLocalStream();
        if (!active) return;
        connectSocket();
        if (socket.connected) joinSocketRoom();
        else socket.once('connect', joinSocketRoom);
      } catch (initialError) {
        setError(initialError.name === 'NotAllowedError' ? 'Allow microphone access to enter the audio room.' : (initialError.response?.data?.message || 'Could not open this audio room.'));
      }
    };
    initialize();

    return () => {
      active = false;
      socket.off('connect', joinSocketRoom);
      socket.off('room_joined', handleRoomJoined);
      socket.off('voice_participant_joined', handleParticipantJoined);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice_candidate', handleCandidate);
      socket.off('boy_joined', handleBoyJoined);
      socket.off('boy_left', handleBoyLeft);
      socket.off('room_destroyed', handleRoomClosed);
      socket.off('room_closed', handleRoomClosed);
      socket.off('room_error', handleRoomError);
      socket.emit('leave_room', { roomId });
      stopPeer();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, [addPendingCandidates, createOffer, ensureLocalStream, ensurePeer, exitRoom, getRoomDetails, isGirl, navigate, openRatingPopup, roomId, stopPeer, user?._id]);

  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.muted = !isSpeakerOn;
  }, [isSpeakerOn]);

  const toggleMicrophone = () => {
    const nextMuted = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setIsMuted(nextMuted);
  };

  // Resolve Profile Data
  const girlData = {
    name: isGirl ? user?.fullName : (girlProfile?.fullName || 'Host'),
    image: isGirl ? user?.imageUrl : girlProfile?.imageUrl,
    followers: girlFollowers,
  };

  const boyData = {
    name: !isGirl ? user?.fullName : (boyProfile?.fullName || 'Boy'),
    image: !isGirl ? user?.imageUrl : boyProfile?.imageUrl,
    followers: boyFollowers,
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#0a0a14] font-sans text-white">
      <audio ref={remoteAudioRef} autoPlay playsInline />
      
      {/* Header */}
      <header className="z-20 flex shrink-0 items-center justify-between p-6">
        {/* Changed to Text without a click action to prevent leaving */}
        <div className="text-lg font-bold tracking-wide text-white">
          Audio Room
        </div>

        {/* Center Pill */}
        <div className="flex flex-col items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-2 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${connectionState === 'connected' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'}`} />
            <span className="text-xs text-slate-300 capitalize font-medium">{connectionState}</span>
          </div>
        </div>

        {/* Changed to Report Icon that opens the report modal */}
        <button 
          onClick={() => partner && setIsReportOpen(true)} 
          className="p-2 text-slate-400 hover:text-red-400 transition"
          aria-label="Report User"
        >
          <TriangleAlert size={24} />
        </button>
      </header>

      {error && (
        <div className="mx-6 mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm font-semibold text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          {error}
        </div>
      )}

      {/* Main Content (Heart, Avatars, Stats) */}
      <main className="relative flex flex-1 flex-col items-center justify-center p-4">
        
        {/* Background Decorative Stars/Sparkles */}
        <div className="absolute top-10 flex flex-col items-center justify-center gap-4 opacity-70">
          <div className="flex gap-12">
            <Star size={16} className="text-[#8b5cf6] fill-current animate-pulse" />
            <Star size={24} className="text-[#f59e0b] fill-current animate-pulse delay-75" />
          </div>
          <Star size={40} className="text-[#3b82f6] fill-current animate-pulse delay-150" />
        </div>

        <div className="relative flex w-full max-w-sm flex-col items-center justify-center gap-8 mt-12">
          
          {/* Central Heart Graphic & Visualizer */}
          <div className="relative flex items-center justify-center drop-shadow-[0_0_35px_rgba(255,77,141,0.2)]">
            <svg width="280" height="280" viewBox="0 0 24 24" fill="none" className="opacity-90">
              <defs>
                <linearGradient id="pinkGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FF4D8D" />
                  <stop offset="100%" stopColor="#b33bf6" />
                </linearGradient>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4DA6FF" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#pinkGrad)" clipPath="url(#left-half)" />
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#blueGrad)" clipPath="url(#right-half)" />
              <clipPath id="left-half">
                <rect x="0" y="0" width="12" height="24" />
              </clipPath>
              <clipPath id="right-half">
                <rect x="12" y="0" width="12" height="24" />
              </clipPath>
            </svg>

            {/* Audio Visualizer Bars inside Heart */}
            <div className="absolute flex items-center gap-1.5 z-10">
              {[3, 5, 8, 12, 16, 12, 8, 5, 3].map((height, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 rounded-full ${i < 4 ? 'bg-[#FF4D8D]' : i === 4 ? 'bg-white' : 'bg-[#4DA6FF]'}`}
                  style={{ 
                    height: `${height * 3}px`, 
                    boxShadow: `0 0 10px ${i < 4 ? '#FF4D8D' : i === 4 ? '#fff' : '#4DA6FF'}`,
                    animation: connectionState === 'connected' ? `pulse 1.${i%3 + 1}s infinite alternate` : 'none' 
                  }}
                />
              ))}
            </div>
          </div>

          {/* Girl Avatar (Top Left) */}
          <div className="absolute -top-10 left-0 flex flex-col items-center">
            <div className="absolute -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF4D8D] text-white z-10 shadow-[0_0_15px_rgba(255,77,141,0.8)]">
              <Bell size={16} fill="currentColor" />
            </div>
            <div className="h-28 w-28 rounded-full border-4 border-[#FF4D8D] bg-slate-800 shadow-[0_0_25px_rgba(255,77,141,0.6)] p-1">
              <img src={girlData.image || fallbackAvatar(girlData.name)} alt={girlData.name} className="h-full w-full rounded-full object-cover" />
            </div>
            <div className="relative -mt-3 flex items-center gap-1.5 rounded-full bg-[#FF4D8D] px-3 py-1 text-xs font-bold text-white shadow-lg">
              <Heart size={12} fill="currentColor" />
              {girlData.followers}
            </div>
          </div>

          {/* Boy Avatar (Top Right) */}
          <div className="absolute -top-10 right-0 flex flex-col items-center">
            <div className="absolute -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#4DA6FF] text-white z-10 shadow-[0_0_15px_rgba(77,166,255,0.8)]">
              <User size={16} fill="currentColor" />
            </div>
            
            {isBoyInside ? (
              <div className="h-28 w-28 rounded-full border-4 border-[#4DA6FF] bg-slate-800 shadow-[0_0_25px_rgba(77,166,255,0.6)] p-1">
                <img src={boyData.image || fallbackAvatar(boyData.name)} alt={boyData.name} className="h-full w-full rounded-full object-cover" />
              </div>
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-dashed border-[#4DA6FF]/50 bg-slate-900/50 shadow-[0_0_15px_rgba(77,166,255,0.2)] p-1">
                <LoaderCircle size={32} className="animate-spin text-[#4DA6FF]/60" />
              </div>
            )}
            
            <div className="relative -mt-3 flex items-center gap-1.5 rounded-full bg-[#4DA6FF] px-3 py-1 text-xs font-bold text-white shadow-lg">
              <User size={12} fill="currentColor" />
              {isBoyInside ? boyData.followers : 'Waiting'}
            </div>
          </div>

        </div>

        {/* Side Stats Container */}
        <div className="absolute top-1/2 w-full flex justify-between px-6 -translate-y-1/2 pointer-events-none">
          {/* Girl Side Stats */}
          <div className="flex flex-col gap-6 text-left">
            <div>
              <div className="flex items-center gap-1 text-[#FF4D8D]">
                <Star size={12} fill="currentColor" className="opacity-80" />
                <span className="text-[10px] font-medium tracking-wider text-slate-400">Followers</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Users size={20} className="text-[#FF4D8D]" />
                <span className="text-2xl font-bold text-[#FF4D8D] drop-shadow-[0_0_8px_rgba(255,77,141,0.5)]">{girlData.followers}</span>
              </div>
            </div>
            
            {/* Conditional Rendering for Top Follower */}
            {girlTopFollower && (
              <div>
                <span className="text-[10px] font-medium tracking-wider text-slate-400">Top Follower</span>
                <div className="flex items-center gap-1.5 mt-1 text-[#FF4D8D]">
                  <Crown size={14} fill="currentColor" />
                  <span className="text-xs font-bold">{girlTopFollower}</span>
                </div>
              </div>
            )}
          </div>

          {/* Boy Side Stats */}
          <div className="flex flex-col gap-6 text-right items-end">
            <div>
              <div className="flex items-center justify-end gap-1 text-[#4DA6FF]">
                <Star size={12} fill="currentColor" className="opacity-80" />
                <span className="text-[10px] font-medium tracking-wider text-slate-400">Followers</span>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <Users size={20} className="text-[#4DA6FF]" />
                <span className="text-2xl font-bold text-[#4DA6FF] drop-shadow-[0_0_8px_rgba(77,166,255,0.5)]">{isBoyInside ? boyData.followers : '-'}</span>
              </div>
            </div>

            {/* Conditional Rendering for Respect Points */}
            {boyRespectPoints && (
              <div>
                <span className="text-[10px] font-medium tracking-wider text-slate-400">Respect Points</span>
                <div className="flex items-center justify-end gap-1.5 mt-1 text-[#4DA6FF]">
                  <Star size={14} fill="currentColor" />
                  <span className="text-lg font-bold">{boyRespectPoints}</span>
                  <span className="text-[10px] text-slate-500">/5</span>
                </div>
              </div>
            )}

            {/* Conditional Rendering for Top Respecter */}
            {boyTopRespecter && (
              <div>
                <span className="text-[10px] font-medium tracking-wider text-slate-400">Top Respecter</span>
                <div className="flex items-center justify-end gap-1.5 mt-1 text-[#4DA6FF]">
                  <Crown size={14} fill="currentColor" />
                  <span className="text-xs font-bold">{boyTopRespecter}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call Timer and Security Badge */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <span className="text-2xl font-light tracking-widest text-white">{elapsedTime}</span>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-1.5">
            <ShieldCheck size={16} className="text-green-500" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-semibold text-slate-300 leading-tight">Secure Call</span>
              <span className="text-[8px] text-slate-500 leading-tight">End-to-End Encrypted</span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer Controls */}
      <footer className="shrink-0 w-full px-6 pb-8">
        
        {/* Buttons Panel */}
        <div className="mx-auto flex max-w-md items-center justify-between rounded-[2.5rem] border border-white/5 bg-[#12121E] px-10 py-6 shadow-2xl">
          
          {/* Mute Button */}
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={toggleMicrophone}>
            <div className={`flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] transition-all duration-300 ${isMuted ? 'border-[#FF4D8D] text-[#FF4D8D] shadow-[0_0_15px_rgba(255,77,141,0.3)]' : 'border-white/10 text-white group-hover:border-white/30'}`}>
              {isMuted ? <MicOff size={26} /> : <Mic size={26} />}
            </div>
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-white transition-colors">Mute</span>
          </div>

          {/* Speaker Button */}
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setIsSpeakerOn(!isSpeakerOn)}>
            <div className={`flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] transition-all duration-300 ${!isSpeakerOn ? 'border-[#4DA6FF] text-[#4DA6FF] shadow-[0_0_15px_rgba(77,166,255,0.3)]' : 'border-white/10 text-white group-hover:border-white/30'}`}>
              {isSpeakerOn ? <Volume2 size={26} /> : <VolumeX size={26} />}
            </div>
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-white transition-colors">Speaker</span>
          </div>

          {/* End Call Button */}
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={handleExit}>
            <button 
              disabled={isLeaving}
              className="flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-[#FF4D8D] bg-[#FF4D8D]/10 text-[#FF4D8D] transition-all duration-300 shadow-[0_0_20px_rgba(255,77,141,0.3)] group-hover:bg-[#FF4D8D] group-hover:text-white disabled:opacity-50"
            >
              {isLeaving ? <LoaderCircle size={26} className="animate-spin" /> : <PhoneOff size={26} />}
            </button>
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-white transition-colors">
              {isGirl ? 'Destroy Room' : 'Leave Room'}
            </span>
          </div>
          
        </div>

        {/* Footer Note */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium">
          <div className="flex gap-1.5 opacity-30">
            <span className="h-1 w-1 rounded-full bg-current" /><span className="h-1 w-1 rounded-full bg-current" /><span className="h-1 w-1 rounded-full bg-current" /><span className="h-1 w-1 rounded-full bg-current" /><span className="h-1 w-1 rounded-full bg-current" />
          </div>
          <Lock size={10} className="mx-2" />
          Be kind. Be respectful. Be real. <Heart size={10} className="text-[#FF4D8D] inline fill-current ml-1" />
          <div className="flex gap-1.5 opacity-30 ml-2">
            <span className="h-1 w-1 rounded-full bg-current" /><span className="h-1 w-1 rounded-full bg-current" /><span className="h-1 w-1 rounded-full bg-current" /><span className="h-1 w-1 rounded-full bg-current" /><span className="h-1 w-1 rounded-full bg-current" />
          </div>
        </div>

      </footer>

      {/* Popups */}
      <ReportPopup
        isOpen={isReportOpen}
        userName={partnerName}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReportSubmit}
        isSubmitting={isReportSubmitting}
      />
      <RatingPopup
        isOpen={isRatingOpen}
        userName={ratingTarget?.fullName || 'Guest'}
        userImage={ratingTarget?.imageUrl || fallbackAvatar(ratingTarget?.fullName || 'Guest')}
        canSkip={isBoy}
        onSkip={handleRatingLater}
        onSubmit={handleRatingSubmit}
        isSubmitting={isRatingSubmitting}
      />
    </div>
  );
}