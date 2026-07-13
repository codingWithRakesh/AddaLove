import { useState } from 'react'
import {
  Loader2,
  Star,
  X,
  ChevronsRight,
  Clock,
  MessageSquare,
  Shield,
  Lock,
  Sparkles,
} from 'lucide-react'

const RatingPopup = ({
  isOpen,
  userName = 'this user',
  userImage,
  canSkip = false,
  onSkip,
  onSubmit,
  isSubmitting = false,
}) => {
  const [selectedRating, setSelectedRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedRating || isSubmitting) return

    // If canSkip is false (Boy UI), divide the 1-10 scale by 2.
    // If canSkip is true (Girl UI), use the 1-5 scale directly.
    const finalRating = !canSkip ? selectedRating / 2 : selectedRating

    // Send only the numerical rating to maintain your original function signature
    await onSubmit(finalRating)
    
    setSelectedRating(0)
    setFeedback('')
  }

  if (!isOpen) return null

  // Determines which UI to show based strictly on the canSkip prop
  const isBoyUI = !canSkip;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a16]/90 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-[360px] rounded-[32px] border border-white/10 bg-[#0F0F1D] p-6 text-white shadow-2xl shadow-black/50"
      >
        {/* Close Button (Only visible if skipping is allowed) */}
        {canSkip && (
          <button 
            type="button"
            onClick={onSkip}
            className="absolute right-6 top-6 text-slate-400 transition hover:text-white"
          >
            <X size={20} />
          </button>
        )}

        {/* Avatar Header */}
        <div className="relative mx-auto -mt-16 mb-4 h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#FF4D8D] to-[#8b5cf6] p-[2px]">
            <img
              src={userImage}
              alt={userName}
              className="h-full w-full rounded-full border-[3px] border-[#0F0F1D] object-cover"
            />
          </div>
        </div>

        {!isBoyUI ? (
          /* =========================================
             GIRL UI (1-5 Stars, Skippable)
             ========================================= */
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">
                Rate <span className="text-[#FF4D8D]">{userName}</span>
              </h2>
              <p className="mt-2 text-xs text-slate-300">
                How was your experience with {userName} in the room?<br />
                Please rate her on a scale of 1 to 5 stars.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="mb-4 text-center text-sm font-semibold text-[#FF4D8D]">Select Rating</p>
              <div className="flex items-center justify-between px-1">
                {[1, 2, 3, 4, 5].map((rating, index) => {
                  const labels = ['Poor', 'Average', 'Good', 'Very Good', 'Excellent']
                  return (
                    <div key={rating} className="flex flex-col items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRating(rating)}
                        disabled={isSubmitting}
                        className="transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Star
                          size={32}
                          fill={rating <= selectedRating ? '#FF4D8D' : 'none'}
                          stroke="#FF4D8D"
                          strokeWidth={1.5}
                          className={rating <= selectedRating ? 'drop-shadow-[0_0_8px_rgba(255,77,141,0.6)]' : ''}
                        />
                      </button>
                      <span className="text-[10px] font-medium text-slate-400">{rating}</span>
                      <span className="text-[9px] text-slate-500">{labels[index]}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-500">
                <Star size={20} fill="currentColor" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-xs font-semibold text-[#FF4D8D]">Your rating matters!</h4>
                <p className="text-[10px] leading-tight text-slate-400">Your ratings help girls grow and build a positive community.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onSkip}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center rounded-xl bg-white/5 py-2 text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronsRight size={16} className="mb-1 text-slate-400" />
                <span className="text-xs font-semibold">Skip</span>
                <span className="text-[9px] text-slate-500">Not now</span>
              </button>
              
              {/* Note: Mapped to onSkip since no onLater param was allowed */}
              {/* <button
                type="button"
                onClick={onSkip}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center rounded-xl bg-white/5 py-2 text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <Clock size={16} className="mb-1 text-slate-400" />
                <span className="text-xs font-semibold">Later</span>
                <span className="text-[9px] text-slate-500">Remind me later</span>
              </button> */}
              
              <button
                type="submit"
                disabled={!selectedRating || isSubmitting}
                className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-r from-[#FF4D8D] to-[#b33bf6] py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="mb-0.5 flex items-center gap-1">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} fill="currentColor" />}
                </div>
                <span className="text-xs font-semibold">Submit Rating</span>
                <span className="text-[9px] text-white/70">Submit your rating</span>
              </button>
            </div>
          </>
        ) : (
          /* =========================================
             BOY UI (1-10 Respect Points, Unskippable)
             ========================================= */
          <>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">
                How was your experience with <br />
                <span className="text-[#FF4D8D]">{userName}?</span>
              </h2>
              <p className="mt-2 text-xs text-slate-300">
                Your respect matters. Please rate {userName} on a scale <br />
                of 1 to 10 based on his behavior in the room.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="mb-4 text-center text-sm font-semibold text-[#8b5cf6]">Select Respect Points</p>
              <div className="flex justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
                  const isSelected = rating === selectedRating;
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setSelectedRating(rating)}
                      disabled={isSubmitting}
                      className={`flex h-8 w-7 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                        isSelected
                          ? 'border-transparent bg-gradient-to-br from-[#FF4D8D] to-[#8b5cf6] text-white drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {rating}
                    </button>
                  )
                })}
              </div>
              <div className="mt-2 flex justify-between px-1 text-[9px] text-slate-500">
                <span>Not Respectful</span>
                <span>Neutral</span>
                <span>Very Respectful</span>
              </div>
            </div>

            {/* <div className="mt-3 flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400">
                <MessageSquare size={12} />
              </div>
              <div className="w-full text-left">
                <h4 className="text-[11px] font-semibold text-slate-300">Want to add a quick feedback? (Optional)</h4>
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  maxLength={120}
                  placeholder="He was polite and listened to everyone..."
                  className="mt-1 w-full resize-none bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-600"
                  rows={2}
                />
                <div className="text-right text-[9px] text-slate-600">{feedback.length}/120</div>
              </div>
            </div> */}

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#FF4D8D]/30 bg-[#FF4D8D]/10 text-[#FF4D8D]">
                <Shield size={20} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-xs font-semibold text-[#FF4D8D]">Why this matters?</h4>
                <p className="text-[10px] leading-tight text-slate-400">Your respect points help us build a safe and positive community for everyone.</p>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={!selectedRating || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4D8D] to-[#8b5cf6] py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Submit Respect Points
              </button>
              
              <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-500">
                <Lock size={10} />
                <span>You must submit a rating to exit the room.</span>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

export default RatingPopup