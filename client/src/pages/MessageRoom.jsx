import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useUserStore from '../store/userStore.js'
import { connectSocket, socket } from '../socket/socket.js'
import useRoomStore from '../store/roomStore.js'
import useMessageStore from '../store/messageStore.js'

const MessageRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, userRole } = useUserStore()
  const [messageText, setMessageText] = useState('')
  const [isLeaving, setIsLeaving] = useState(false)
  const [isBoyInside, setIsBoyInside] = useState(userRole === 'boy')
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

    const message = messageText
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    try {
      const messageData = {
        text: trimmedMessage,
        messageType: 'text',
      }
      await sendMessageToServer(roomId, messageData)
      setMessageText('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const exitRoom = useCallback(() => {
    clearMessages()
    if (roomId && user?._id) {
      socket.emit('leave_room', {
        roomId,
        userId: user._id,
      })
    }
    navigate('/')
  }, [clearMessages, navigate, roomId, user?._id])

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
      socket.emit('join_room', {
        roomId,
        userId: user._id,
      })
    }

    connectSocket()

    if (socket.connected) {
      joinRoom()
    } else {
      socket.once('connect', joinRoom)
    }

    return () => {
      socket.off('connect', joinRoom)
      socket.emit('leave_room', {
        roomId,
        userId: user._id,
      })
    }
  }, [roomId, user?._id])

  useEffect(() => {
    if (!roomId) return

    clearMessages()

    // Load the room once so the girl knows whether a boy is already inside.
    getRoomDetails(roomId)
      .then((data) => {
        const room = data?.room
        setIsBoyInside(userRole === 'boy' || Boolean(room?.currentBoy))
      })
      .catch((error) => {
        console.error('Error loading room details:', error)
      })

    getMessages(roomId).catch((error) => {
      console.error('Error loading messages:', error)
    })

    const handleNewMessage = (message) => {
      if (message.roomId === roomId) {
        addMessage(message)
      }
    }

    const handleRoomClosed = (data) => {
      if (data.roomId === roomId) {
        exitRoom()
      }
    }

    // Boy joined: allow both users to start messaging.
    const handleBoyJoined = (data) => {
      if (data.roomId === roomId) {
        setIsBoyInside(true)
      }
    }

    // Boy left or time expired: boy goes home, girl goes back to waiting.
    const handleBoyLeft = (data) => {
      if (data.roomId === roomId) {
        setIsBoyInside(false)
        clearMessages()

        if (userRole === 'boy' && String(data.boyId) === String(user?._id)) {
          exitRoom()
        }
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
  }, [roomId, userRole, user?._id, getRoomDetails, getMessages, addMessage, clearMessages, exitRoom])

  const exitLabel = userRole === 'girl' ? 'Destroy Room' : 'Leave Room'
  const inputPlaceholder = isBoyInside ? 'Type your message...' : 'No boy inside'

  return (
    <div className='min-h-screen bg-slate-950 px-4 py-6 text-white'>
      <div className='mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30'>
        <div className='border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur'>
          <p className='text-xs uppercase tracking-[0.35em] text-pink-400'>Chat Room</p>
          <h1 className='mt-1 text-xl font-bold'>Message Room</h1>
          <p className='mt-1 text-sm text-slate-400'>Simple live chat interface</p>
        </div>

        <div className='fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur'>
          <span className='text-sm font-semibold text-slate-200'>Message Room</span>
          <button
            type='button'
            onClick={userRole === 'girl' ? destroyRoomFunc : leaveRoomFunc}
            disabled={isLeaving}
            className='rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isLeaving ? 'Please wait...' : exitLabel}
          </button>
        </div>

        <div className='showAllMessages flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6'>
          {!isBoyInside && userRole === 'girl' ? (
            <div className='flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-slate-400'>
              No boy inside
            </div>
          ) : messages.length === 0 ? (
            <div className='flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-slate-400'>
              Start the conversation by typing a message below.
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message._id || index}
                className={`flex ${message.sender?.id === user?._id || message.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}
              >
                <div className='max-w-[80%] rounded-3xl rounded-br-md bg-linear-to-r from-pink-500 to-rose-500 px-4 py-3 text-sm leading-relaxed text-white shadow-lg shadow-pink-500/20'>
                  {message.messageType === 'text' ? message.text : message.fileUrl}
                </div>
              </div>
            ))
          )}
        </div>

        <div className='border-t border-white/10 bg-slate-950/80 p-4 backdrop-blur'>
          <div className='sendMessage flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3'>
            <input
              type='text'
              value={messageText}
              placeholder={inputPlaceholder}
              disabled={!isBoyInside}
              className='w-full bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-500'
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage()
                }
              }}
            />
            <button
              type='button'
              onClick={handleSendMessage}
              disabled={!isBoyInside}
              className='rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageRoom
