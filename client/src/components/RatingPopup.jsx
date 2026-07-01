import { useState } from 'react'
import { Loader2, Star } from 'lucide-react'

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedRating || isSubmitting) return

    await onSubmit(selectedRating)
    setSelectedRating(0)
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 py-6 backdrop-blur-sm'>
      <form
        onSubmit={handleSubmit}
        className='w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-5 text-center text-white shadow-2xl shadow-black/40'
      >
        <img
          src={userImage}
          alt={userName}
          className='mx-auto h-20 w-20 rounded-full border-4 border-[#FF4D8D]/70 object-cover'
        />
        <h2 className='mt-3 text-lg font-extrabold'>{userName}</h2>
        <p className='mt-1 text-xs text-slate-400'>Rate your chat experience</p>

        <div className='mt-5 flex items-center justify-center gap-2'>
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type='button'
              aria-label={`${rating} star rating`}
              onClick={() => setSelectedRating(rating)}
              disabled={isSubmitting}
              className='rounded-full p-1 text-yellow-300 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60'
            >
              <Star
                size={34}
                fill={rating <= selectedRating ? 'currentColor' : 'none'}
                className={rating <= selectedRating ? 'drop-shadow-[0_0_10px_rgba(250,204,21,0.45)]' : 'text-slate-500'}
              />
            </button>
          ))}
        </div>

        <div className='mt-6 flex gap-2'>
          {canSkip && (
            <button
              type='button'
              onClick={onSkip}
              disabled={isSubmitting}
              className='flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60'
            >
              Later
            </button>
          )}
          <button
            type='submit'
            disabled={!selectedRating || isSubmitting}
            className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF4D8D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isSubmitting && <Loader2 size={16} className='animate-spin' />}
            Submit
          </button>
        </div>
      </form>
    </div>
  )
}

export default RatingPopup
