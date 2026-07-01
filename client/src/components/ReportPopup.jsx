import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

const REPORT_REASONS = [
  'Harassment or abusive behavior',
  'Inappropriate messages',
  'Fake profile or impersonation',
  'Spam or scam',
  'Other',
]

const ReportPopup = ({ isOpen, userName = 'this user', onClose, onSubmit, isSubmitting = false }) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0])
  const [customReason, setCustomReason] = useState('')

  const finalReason = useMemo(() => {
    if (selectedReason === 'Other') return customReason.trim()
    return selectedReason
  }, [customReason, selectedReason])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!finalReason || isSubmitting) return

    await onSubmit(finalReason)
    setSelectedReason(REPORT_REASONS[0])
    setCustomReason('')
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm'>
      <form
        onSubmit={handleSubmit}
        className='w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 text-white shadow-2xl shadow-black/40'
      >
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-300'>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className='text-base font-bold'>Report {userName}</h2>
              <p className='mt-1 text-xs leading-5 text-slate-400'>Choose a reason so we can review this chat.</p>
            </div>
          </div>
          <button
            type='button'
            aria-label='Close report popup'
            onClick={onClose}
            disabled={isSubmitting}
            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60'
          >
            <X size={17} />
          </button>
        </div>

        <div className='mt-5 space-y-2'>
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                selectedReason === reason
                  ? 'border-[#FF4D8D]/70 bg-[#FF4D8D]/12 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/8'
              }`}
            >
              <input
                type='radio'
                name='reportReason'
                value={reason}
                checked={selectedReason === reason}
                onChange={() => setSelectedReason(reason)}
                className='h-4 w-4 accent-[#FF4D8D]'
              />
              <span>{reason}</span>
            </label>
          ))}
        </div>

        {selectedReason === 'Other' && (
          <textarea
            value={customReason}
            onChange={(event) => setCustomReason(event.target.value)}
            placeholder='Write your reason...'
            rows={3}
            className='mt-4 w-full resize-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF4D8D]/70'
          />
        )}

        <div className='mt-5 flex justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            disabled={isSubmitting}
            className='rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={!finalReason || isSubmitting}
            className='flex items-center gap-2 rounded-xl bg-[#FF4D8D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isSubmitting && <Loader2 size={16} className='animate-spin' />}
            Send report
          </button>
        </div>
      </form>
    </div>
  )
}

export default ReportPopup
