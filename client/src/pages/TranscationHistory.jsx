import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllTransactionHistory = async () => {
      try {
        setIsLoading(true);
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/wallet/v1/transcatin-history`;
        
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json"
          },
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch transaction history');
        }

        const data = await res.json();
        
        // Match the backend typo "allTranscation" to extract the array
        if (data.success && data.data && data.data.allTranscation) {
          setTransactions(data.data.allTranscation.reverse());
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTransactionHistory();
  }, []);
 const naviget=useNavigate()
  const backfun =()=>{
    naviget(-1);
  }

  return (
    <div className="min-h-screen bg-[#0d0c11] text-white font-sans selection:bg-pink-500 selection:text-white pb-24">
      <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button onClick={backfun} className="text-gray-400 hover:text-white transition-colors bg-[#17161c] p-2 rounded-full border border-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">Transaction History</h1>
            <p className="text-gray-400 text-sm mt-1">View your past recharges and coin purchases</p>
          </div>
        </header>

        {/* Content Area */}
        <div className="space-y-4">
          {error ? (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-2xl text-center">
              <p>Error: {error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm underline hover:text-red-400"
              >
                Try again
              </button>
            </div>
          ) : isLoading ? (
            /* Skeleton Loaders */
            <>
              {[1, 2, 3, 4].map((n) => (
                <TransactionSkeleton key={n} />
              ))}
            </>
          ) : transactions.length === 0 ? (
            /* Empty State */
            <div className="bg-[#17161c] rounded-3xl p-10 text-center border border-gray-800">
              <div className="w-20 h-20 bg-[#2a1a29] rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-500/20">
                <CoinIcon className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Transactions Yet</h3>
              <p className="text-gray-400 mb-6">Looks like you haven't made any purchases.</p>
              <button className="bg-pink-600 hover:bg-pink-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                Recharge Now
              </button>
            </div>
          ) : (
            /* Actual Transaction List */
            transactions.map((tx) => (
              <TransactionCard key={tx._id} tx={tx} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}

// --- Sub Components ---

function TransactionCard({ tx }) {
  // Format the date and time beautifully
  const dateObj = new Date(tx.createdAt);
  const formattedDate = dateObj.toLocaleDateString('en-IN', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="bg-[#17161c] rounded-2xl p-4 sm:p-5 border border-gray-800 hover:border-gray-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
      
      {/* Left side: Icon, Coins, and Date */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-[#2a1a29] to-[#17161c] rounded-xl flex items-center justify-center border border-pink-500/20 group-hover:border-pink-500/40 transition-colors shadow-inner">
          <CoinIcon className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400 drop-shadow-md" />
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold text-lg sm:text-xl tracking-tight">
              {tx.coins.toLocaleString()} Coins
            </h3>
            {tx.bonus > 0 && (
              <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                +{tx.bonus} Bonus
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
            <span>{formattedDate}</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Right side: Amount and Order ID */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t border-gray-800 sm:border-t-0 pt-3 sm:pt-0">
        <span className="text-white font-black text-xl">
          ₹{tx.amount.toLocaleString()}
        </span>
        
        <div className="flex items-center gap-1 mt-1 text-gray-500 text-[10px] sm:text-xs font-mono bg-[#0d0c11] px-2 py-1 rounded-md border border-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-blue-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="truncate max-w-30" title={tx.razorpay_order_id}>
            {tx.razorpay_order_id}
          </span>
        </div>
      </div>
      
    </div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="bg-[#17161c] rounded-2xl p-4 sm:p-5 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-800 rounded-xl"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-24 bg-gray-800 rounded"></div>
            <div className="h-4 w-16 bg-gray-800/50 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-20 bg-gray-800 rounded"></div>
            <div className="h-3 w-12 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t border-gray-800 sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
        <div className="h-6 w-16 bg-gray-800 rounded mb-2"></div>
        <div className="h-5 w-28 bg-gray-800 rounded-md"></div>
      </div>
    </div>
  );
}

// Simple reusable Coin SVG Component
function CoinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" fill="#facc15" />
      <circle cx="12" cy="12" r="8" fill="#eab308" />
      <path d="M12 6V18M9 9H15M9 15H15" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}