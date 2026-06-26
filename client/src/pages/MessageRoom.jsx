import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Coins, Loader2, LogOut, MessageCircle, Send, Trash2, UserMinus, UserRoundPlus } from 'lucide-react'
import useUserStore from '../store/userStore.js'
import { connectSocket, socket } from '../socket/socket.js'
import useRoomStore from '../store/roomStore.js'
import useMessageStore from '../store/messageStore.js'
import { handleError } from '../components/ErrorMessage.jsx'
const MessageRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, userRole } = useUserStore()
  const [messageText, setMessageText] = useState('')
  const [isLeaving, setIsLeaving] = useState(false)
  const [isBoyInside, setIsBoyInside] = useState(userRole === 'boy')
  const [boyProfile, setBoyProfile] = useState(null)
  const { user: useralldata } = useUserStore();
  const [girlProfile, setGirlProfile] = useState(null)
  const messagesEndRef = useRef(null)
  const { leaveRoom, destroyRoom, getRoomDetails } = useRoomStore()
  const {
    sendMessage: sendMessageToServer,
    getMessages,
    clearMessages,
    addMessage,
    messages,
  } = useMessageStore()

  const handleSendMessage = async () => {
    if (!isBoyInside) return

    const trimmedMessage = messageText.trim()
    if (!trimmedMessage) return

    try {
      await sendMessageToServer(roomId, {
        text: trimmedMessage,
        messageType: 'text',
      })
      setMessageText('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const exitRoom = useCallback(() => {
    clearMessages()
    if (roomId && user?._id) {
      socket.emit('leave_room', { roomId, userId: user._id })
    }
    navigate('/')
  }, [clearMessages, navigate, roomId, user])

  const leaveRoomFunc = async () => {
    if (userRole !== 'boy' || isLeaving) return

    try {
      setIsLeaving(true)
      await leaveRoom(roomId)
      exitRoom()
    } catch (error) {
      console.error('Error leaving room:', error)
    } finally {
      setIsLeaving(false)
    }
  }

  const destroyRoomFunc = async () => {
    if (userRole !== 'girl' || isLeaving) return

    try {
      setIsLeaving(true)
      await destroyRoom(roomId)
      exitRoom()
    } catch (error) {
      console.error('Error destroying room:', error)
    } finally {
      setIsLeaving(false)
    }
  }

  useEffect(() => {
    if (!roomId || !user?._id) return

    const joinRoom = () => {
      socket.emit('join_room', { roomId, userId: user._id })
    }

    connectSocket()
    if (socket.connected) joinRoom()
    else socket.once('connect', joinRoom)

    return () => {
      socket.off('connect', joinRoom)
      socket.emit('leave_room', { roomId, userId: user._id })
    }
  }, [roomId, user?._id])
  const isBoy = useMemo(() => userRole === 'boy', [userRole]);
  const isGirl = useMemo(() => userRole === 'girl', [userRole]);
  const [isFollow, setIsFollow] = useState(false)
  const [loder, setLoder] = useState(false)
  useEffect(() => {
    console.log(boyProfile);
    console.log(girlProfile)
    const fectFollowOrnot = async () => {
      if (isBoy) {
        try {
          const url = `${import.meta.env.VITE_BACKEND_URL}/api/follower/v1/check-follow`;

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ profileUserId: girlProfile._id }),
            credentials: 'include',
          });
          const data = await res.json();
          console.log(data)
          if (!data.success) {
            return setIsFollow(false)
          }
          setIsFollow(true)
        } catch (error) {
          
        }
        finally {
          setLoder(false)
        }

      }
      if (isGirl) {
        try {


          const url = `${import.meta.env.VITE_BACKEND_URL}/api/follower/v1/check-follow`;

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ profileUserId: boyProfile._id }),
            credentials: 'include',
          });
          const data = await res.json();
          console.log(data);
          if (!data.success) {
            return setIsFollow(false)
          }
          setIsFollow(true)
        } catch (error) {
         
        }
        finally {
          setLoder(false);
        }
      }

    }
    fectFollowOrnot();
  }, [boyProfile, girlProfile])
  // Follow and Unfollow api call here
  const handleFollowClick = async () => {
    if (isBoy) {
      try {
        setLoder(true)

        const url = `${import.meta.env.VITE_BACKEND_URL}/api/follower/v1/add-followers`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ profileUserId: girlProfile._id }),
          credentials: 'include',
        });
        const data = await res.json();
        console.log(data)
        if (!data.success) {
          return setIsFollow(false)
        }
        setIsFollow(true)
      } catch (error) {
        

      } finally {
        setLoder(false)
      }

    }
    if (isGirl) {
      try {
        setLoder(true)

        const url = `${import.meta.env.VITE_BACKEND_URL}/api/follower/v1/add-followers`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ profileUserId: boyProfile._id }),
          credentials: 'include',
        });
        const data = await res.json();
        console.log(data);
        if (!data.success) {
          return setIsFollow(false)
        }
        setIsFollow(true)
      } catch (error) {
        
      } finally {
        setLoder(false)
      }
    }

  }
  const handleUnfollowClick = async () => {

    if (isBoy) {
      try {


        const url = `${import.meta.env.VITE_BACKEND_URL}/api/follower/v1/unfollow`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ profileUserId: girlProfile._id }),
          credentials: 'include',
        });
        const data = await res.json();
        console.log(data)
        if (data.success) {
          return setIsFollow(false)
        }
        setIsFollow(true)
      } catch (error) {
        handleError('Network Issue ! Try again')
      } finally {
        setLoder(false)
      }

    }
    if (isGirl) {
      try {


        const url = `${import.meta.env.VITE_BACKEND_URL}/api/follower/v1/unfollow`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ profileUserId: boyProfile._id }),
          credentials: 'include',
        });
        const data = await res.json();
        console.log(data);
        if (data.success) {
          return setIsFollow(false)
        }
        setIsFollow(true)
      } catch (error) {
        handleError('Network Issue ! Try again')
      } finally {
        setLoder(false)
      }
    }

  }



  useEffect(() => {
    if (!roomId) return

    clearMessages()

    getRoomDetails(roomId)
      .then((data) => {
        const room = data?.room
        setIsBoyInside(userRole === 'boy' || Boolean(room?.currentBoy))
        setBoyProfile(room?.currentBoy || null)
        setGirlProfile(room?.createdBy || null)
      })
      .catch((error) => console.error('Error loading room details:', error))

    getMessages(roomId).catch((error) => {
      console.error('Error loading messages:', error)
    })

    const handleNewMessage = (message) => {
      if (message.roomId === roomId) addMessage(message)
    }

    const handleRoomClosed = (data) => {
      if (data.roomId === roomId) exitRoom()
    }

    const handleBoyJoined = async (data) => {
      if (data.roomId !== roomId) return

      setIsBoyInside(true)
      if (userRole === 'girl') {
        try {
          const details = await getRoomDetails(roomId)
          setBoyProfile(details?.room?.currentBoy || null)
        } catch (error) {
          console.error('Error loading joined boy details:', error)
        }
      }
    }

    const handleBoyLeft = (data) => {
      if (data.roomId !== roomId) return

      setIsBoyInside(false)
      setBoyProfile(null)
      clearMessages()

      if (userRole === 'boy' && String(data.boyId) === String(user?._id)) {
        exitRoom()
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('boy_joined', handleBoyJoined)
    socket.on('room_destroyed', handleRoomClosed)
    socket.on('room_closed', handleRoomClosed)
    socket.on('boy_left', handleBoyLeft)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('boy_joined', handleBoyJoined)
      socket.off('room_destroyed', handleRoomClosed)
      socket.off('room_closed', handleRoomClosed)
      socket.off('boy_left', handleBoyLeft)
      clearMessages()
    }
  }, [roomId, userRole, user, getRoomDetails, getMessages, addMessage, clearMessages, exitRoom])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getFallbackAvatar = (name = 'User') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF4D8D&color=fff&bold=true`

  const handleAvatarError = (event, name) => {
    event.currentTarget.onerror = null
    event.currentTarget.src = getFallbackAvatar(name)
  }

  const isOwnMessage = (message) =>
    String(message.sender?.id || message.sender?._id) === String(user?._id)

  const exitLabel = userRole === 'girl' ? 'Destroy Room' : 'Leave Room'
  const inputPlaceholder = isBoyInside ? 'Type your message...' : 'No boy is in the room yet'
  const chatPartner = userRole === 'boy' ? girlProfile : boyProfile
  const partnerName = chatPartner?.fullName || 'Guest'
  const partnerAvatar = chatPartner?.imageUrl || getFallbackAvatar(partnerName)

  return (
    <div className='min-h-screen bg-slate-950 p-0 text-white sm:px-4 sm:py-5'>
      <div className='mx-auto flex h-dvh w-full max-w-5xl flex-col overflow-hidden bg-slate-900 shadow-2xl shadow-black/30 sm:h-[calc(100vh-2.5rem)] sm:rounded-3xl sm:border sm:border-white/10'>
        <nav className='z-20 flex min-h-17 items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 py-3 backdrop-blur-xl sm:px-6'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF4D8D]/15 text-[#FF4D8D]'>
              <MessageCircle size={21} />
            </div>
            <div>
              <p className='text-[10px] font-semibold uppercase tracking-[0.25em] text-[#FF4D8D]'>Live chat</p>
              <h1 className='text-base font-bold sm:text-lg'>Message Room</h1>
            </div>
          </div>
          <div className='flex gap-1  rounded-3xl border border-yellow-400/20 bg-yellow-500/10  p-1.5'><CoinIcon className="w-4 h-4 text-yellow-400 mt-1" /> {useralldata.walletBlance}</div>
          <button
            type='button'
            onClick={userRole === 'girl' ? destroyRoomFunc : leaveRoomFunc}
            disabled={isLeaving}
            className='flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm'
          >
            {userRole === 'girl' ? <Trash2 size={16} /> : <LogOut size={16} />}
            {isLeaving ? 'Please wait...' : exitLabel}
          </button>
        </nav>

        {isBoyInside && chatPartner && (
          <div className='z-10 flex items-center gap-3 border-b border-white/10 bg-white/3 px-4 py-3 sm:px-6'>
            <div className='relative shrink-0'>
              <img
                src={partnerAvatar}
                alt={partnerName}
                onError={(event) => handleAvatarError(event, partnerName)}
                className='h-11 w-11 rounded-full border-2 border-[#FF4D8D]/70 object-cover'
              />
              <span className='absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400' />
            </div>
            <div className='min-w-0'>
              <p className='truncate text-sm font-bold text-white'>{partnerName}</p>
              <p className='flex items-center gap-1.5 text-xs text-emerald-400'>
                <span className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
                In the room
              </p>
            </div>
          </div>
        )}

        <main className='showAllMessages flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(255,77,141,0.08),transparent_36%)] px-4 py-5 sm:px-6'>
          {!isBoyInside && userRole === 'girl' ? (
            <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
              <div className='mb-4 flex h-18 w-18 items-center justify-center rounded-full border border-[#FF4D8D]/20 bg-[#FF4D8D]/10 text-[#FF4D8D]'>
                <MessageCircle size={30} />
              </div>
              <h2 className='text-lg font-bold text-white'>Waiting for someone to join</h2>
              <p className='mt-2 max-w-xs text-sm leading-6 text-slate-400'>You’ll see his profile here as soon as a boy enters the room.</p>
            </div>
          ) : (
            <>
              {chatPartner && (
                <section className='mx-auto mb-7 flex max-w-lg flex-col items-center rounded-3xl border border-[#FF4D8D]/20 bg-slate-900/80 px-5 py-6 text-center shadow-xl shadow-black/15 backdrop-blur'>
                  <div className='rounded-full bg-linear-to-br from-[#FF4D8D] to-rose-600 p-1 shadow-lg shadow-[#FF4D8D]/20'>
                    <img
                      src={partnerAvatar}
                      alt={partnerName}
                      onError={(event) => handleAvatarError(event, partnerName)}
                      className='h-22 w-22 rounded-full border-4 border-slate-900 object-cover sm:h-26 sm:w-26'
                    />
                  </div>
                  <h2 className='mt-3 text-xl font-extrabold'>{partnerName}</h2>

                  <div
                    onClick={loder ? undefined : (isFollow ? handleUnfollowClick : handleFollowClick)}
                    className={`mt-2 flex w-fit cursor-pointer items-center justify-center gap-2 rounded-full border border-yellow-400/15 bg-yellow-400/10 px-3 py-1.5 text-sm text-yellow-300 transition-colors hover:bg-yellow-400/20 ${loder ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {loder ? (
                      <>
                        <Loader2 size={15} className="animate-spin text-yellow-400" />
                        <span className="font-semibold text-yellow-400">Loading...</span>
                      </>
                    ) : (
                      <>
                        {isFollow ? <UserMinus size={15} /> : <UserRoundPlus size={15} />}
                        <span className="font-semibold">{isFollow ? 'Unfollow' : 'Follow'}</span>
                      </>
                    )}
                  </div>

                  <p className='mt-3 text-xs text-slate-500'>You’re connected — say hello!</p>
                </section>
              )}

              {messages.length === 0 ? (
                <p className='py-4 text-center text-sm text-slate-500'>No messages yet. Start the conversation below.</p>
              ) : messages.map((message, index) => {
                const ownMessage = isOwnMessage(message)

                return (
                  <div key={message._id || index} className={`flex items-end gap-2 ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                    {!ownMessage && (
                      <img
                        src={partnerAvatar}
                        alt={partnerName}
                        onError={(event) => handleAvatarError(event, partnerName)}
                        className='h-8 w-8 shrink-0 rounded-full border border-[#FF4D8D]/50 object-cover'
                      />
                    )}
                    <div className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed shadow-lg sm:max-w-[68%] ${ownMessage ? 'rounded-2xl rounded-br-sm bg-linear-to-r from-[#FF4D8D] to-rose-500 text-white shadow-[#FF4D8D]/10' : 'rounded-2xl rounded-bl-sm border border-white/10 bg-white/8 text-slate-100 shadow-black/10'}`}>
                      {message.messageType === 'text' ? message.text : message.fileUrl}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </main>

        <footer className='border-t border-white/10 bg-slate-950/90 p-3 backdrop-blur-xl sm:p-4'>
          <div className={`sendMessage flex items-center gap-2 rounded-2xl border px-3 py-2 transition ${isBoyInside ? 'border-white/10 bg-white/5 focus-within:border-[#FF4D8D]/60' : 'border-white/5 bg-white/3 opacity-70'}`}>
            <input
              type='text'
              value={messageText}
              placeholder={inputPlaceholder}
              disabled={!isBoyInside}
              className='min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed'
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSendMessage()
              }}
            />
            <button
              type='button'
              aria-label='Send message'
              onClick={handleSendMessage}
              disabled={!isBoyInside || !messageText.trim()}
              className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF4D8D] text-white shadow-lg shadow-[#FF4D8D]/20 transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none'
            >
              <Send size={18} />
            </button>
          </div>
          {!isBoyInside && userRole === 'girl' && (
            <p className='mt-2 text-center text-[11px] text-slate-500'>Messaging will unlock when a boy joins.</p>
          )}
        </footer>
      </div>
    </div>
  )
}
function CoinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" fill="#facc15" />
      <circle cx="12" cy="12" r="8" fill="#eab308" />
      <path d="M12 6V18M9 9H15M9 15H15" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export default MessageRoom
