import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Headphones, LoaderCircle, LogOut, Mic, MicOff, PhoneOff, Radio, Trash2, TriangleAlert, Volume2, VolumeX } from 'lucide-react';
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
  const [boyFollowers, setBoyFollowers] = useState(0)
  const [girlFollowers, setGirlFollowers] = useState(0)
  const { createReport, isLoading: isReportSubmitting } = useReportStore()
  const { createRating, checkRating, isLoading: isRatingSubmitting } = useRatingStore()

  const isGirl = userRole === 'girl';
  const partner = isGirl ? boyProfile : girlProfile;
  const partnerName = partner?.fullName || 'Guest';
  const isBoyInside = isGirl ? Boolean(boyProfile) : true;
  const isBoy = useMemo(() => userRole === 'boy', [userRole]);
  useEffect(() => {

  }, [roomId])

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
        setBoyFollowers(details.room.boyExtraDetails.followerCount);
        setGirlFollowers(details.room.girlsExtraDetails.followerCount)
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
        setBoyProfile(details.room.currentBoy || null);
        boyProfileRef.current = details.room.currentBoy || null;
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

  const participants = [
    { ...user, label: 'You', muted: isMuted, self: true },
    ...(partner ? [{ ...partner, label: partner.fullName, muted: false, self: false }] : []),
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#0F172A] font-sans text-white">
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-white/5 bg-[#0F172A]/95 p-4 md:px-6">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4D8D] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#FF4D8D]" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-wide">Audio Room</h1>
            <p className="text-xs capitalize text-slate-400">{connectionState === 'waiting' && isGirl ? 'Waiting for a boy to join' : connectionState}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {partner && (
            <button
              type="button"
              aria-label={`Report ${partnerName}`}
              onClick={() => setIsReportOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-300 transition hover:bg-red-500 hover:text-white"
            >
              <TriangleAlert size={18} />
            </button>
          )}
        </div>
      </header>

      {error && <div className="mx-4 mt-3 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-center text-sm text-red-200">{error}</div>}

      <main className="mx-auto min-h-0 w-full max-w-7xl flex-1 p-4 md:p-6">
        <div className={`flex h-full w-full gap-4 transition-all duration-300 md:gap-6 ${participants.length === 1 ? 'flex-col' : 'flex-col md:flex-row'}`}>
          {participants.map((participant) => {
            // console.log(participant)
            
            console.log(girlFollowers)
            console.log(boyFollowers)
            const name = participant.fullName || participant.label;
            const connected = connectionState === 'connected' && !participant.self;
            return (
              <section key={participant.self ? 'self' : participant._id} className={`group relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border bg-[#1E293B] shadow-xl ${connected ? 'border-[#6C3BFF]/70 ring-2 ring-[#6C3BFF]/30' : 'border-white/5'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,59,255,0.12),transparent_55%)]" />
                <div className="relative z-10">
                  <div className={`h-32 w-32 rounded-full p-1 md:h-40 md:w-40 ${connected ? 'bg-linear-to-tr from-[#6C3BFF] to-[#4DA6FF]' : 'bg-slate-700'}`}>
                    <img src={participant.imageUrl || fallbackAvatar(name)} alt={name} onError={(event) => { event.currentTarget.src = fallbackAvatar(name); }} className="h-full w-full rounded-full border-4 border-[#1E293B] object-cover" />
                  </div>
                  {connected && <div className="pointer-events-none absolute -inset-4 animate-ping rounded-full border-2 border-[#6C3BFF]/25" style={{ animationDuration: '2s' }} />}
                </div>
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-2xl border border-white/5 bg-[#0F172A]/85 px-4 py-2 shadow-lg backdrop-blur-md">
                  <span className={`rounded-full p-1.5 ${participant.muted ? 'bg-red-500/20 text-red-400' : 'bg-[#6C3BFF]/20 text-[#9f86ff]'}`}>{participant.muted ? <MicOff size={14} /> : <Mic size={14} />}</span>
                  <span className="text-sm font-medium text-gray-200 md:text-base">{participant.label}</span>
                </div>
                <div className="flex flex-col items-center justify-center transition-transform hover:scale-105">
                  <div className="bg-linear-to-b from-white to-[#FF4D8D] bg-clip-text text-2xl font-black text-transparent drop-shadow-[0_0_15px_rgba(255,77,141,0.8)]">
                    {participant.userType==='Girl' ?girlFollowers:boyFollowers}
                  </div>
                  <div className="text-xs font-semibold tracking-widest text-[#FF4D8D] drop-shadow-[0_0_8px_rgba(255,77,141,0.6)]">
                    Followers
                  </div>
                </div>
              </section>
            );
          })}

          {!isBoyInside && isGirl && (
            <section className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#6C3BFF]/15 text-[#9f86ff]"><Radio size={34} /></div>
              <h2 className="text-xl font-bold">Your room is live</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">You are the host. Stay here while we wait for a boy to join. When he arrives, his profile will appear beside yours and audio will connect automatically.</p>
            </section>
          )}
        </div>
      </main>

      <footer className="shrink-0 bg-[#0F172A] p-4 md:p-6">
        <div className="mx-auto flex max-w-md items-center justify-center gap-5 rounded-3xl border border-white/5 bg-[#1E293B] p-4 shadow-2xl">
          <button type="button" onClick={toggleMicrophone} aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'} className={`flex h-14 w-14 items-center justify-center rounded-full transition hover:scale-105 ${isMuted ? 'bg-red-500/15 text-red-400' : 'bg-[#6C3BFF] text-white'}`}>{isMuted ? <MicOff size={24} /> : <Mic size={24} />}</button>
          <button type="button" onClick={() => setIsSpeakerOn((value) => !value)} aria-label={isSpeakerOn ? 'Turn speaker off' : 'Turn speaker on'} className={`flex h-14 w-14 items-center justify-center rounded-full transition hover:scale-105 ${isSpeakerOn ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-500'}`}>{isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}</button>
          <button type="button" onClick={handleExit} disabled={isLeaving} aria-label={isGirl ? 'Destroy room' : 'Leave room'} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF4D8D] text-white shadow-lg shadow-[#FF4D8D]/20 transition hover:scale-105 disabled:opacity-50">{isLeaving ? <LoaderCircle className="animate-spin" size={24} /> : isGirl ? <PhoneOff size={24} /> : <PhoneOff size={24} />}</button>
          <span className="sr-only"><Headphones />Audio controls</span>
        </div>
      </footer>
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
