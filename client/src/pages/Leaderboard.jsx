import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Star, UserPlus, Flame } from 'lucide-react';
import useLeaderboardStore from '../store/leaderbordStore.js';

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('girl');
  const { leaderboard, isLoading, fetchLeaderboard } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab, fetchLeaderboard]);

  const topThree = leaderboard?.slice(0, 3) || [];
  const restList = leaderboard?.slice(3) || [];

  // Rearrange top 3 for podium display (2nd, 1st, 3rd)
  const podiumOrder = [
    topThree[1] || null, // Rank 2
    topThree[0] || null, // Rank 1
    topThree[2] || null, // Rank 3
  ];

  return (
    // Added pt-[73px] for mobile and md:pt-[105px] to account for desktop padding + navbar
    <div className="min-h-screen bg-[#05000a] flex items-start justify-center pt-[73px] px-0 pb-0 md:px-8 md:pb-8 md:pt-[105px] font-sans">
      
      {/* Main Card Container */}
      <div className="w-full max-w-md bg-[#0b0515] text-white p-4 md:p-6 md:rounded-[2.5rem] md:border md:border-[#2a1b42] md:shadow-2xl md:shadow-fuchsia-900/20 min-h-screen md:min-h-[850px]">
        
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Leaderboard</h1>
            <p className="text-sm text-pink-400 font-medium mb-1">
              Top {activeTab === 'boy' ? '50 boy' : '10 girl'} This Week
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              Rank is based on {activeTab === 'boy' ? 'Respect Points' : 'Stars & Followers'}
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-500 text-[9px] ml-1">i</span>
            </p>
          </div>
          
          {/* Trophy Graphic */}
          <div className="relative">
            <div className="absolute inset-0 bg-fuchsia-600 blur-[20px] opacity-40 rounded-full"></div>
            <Trophy className="w-16 h-16 text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] relative z-10" strokeWidth={1.2} />
          </div>

          <div className="bg-[#150a21] rounded-2xl p-2 px-3 flex flex-col items-center border border-[#2a1b42]">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
              <Clock className="w-3 h-3" /> Resets in
            </div>
            <div className="text-xs font-bold">5d 12h 30m</div>
          </div>
        </div>

        {/* Toggle Section */}
        <div className="bg-[#150a21] rounded-2xl p-1.5 flex mb-8 border border-[#2a1b42]">
          <button
            onClick={() => setActiveTab('boy')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'boy'
                ? 'bg-[#1e1332] text-[#818cf8] shadow-[0_0_15px_rgba(129,140,248,0.15)] border border-[#3b285c]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-lg leading-none">♂</span> boy Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('girl')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'girl'
                ? 'bg-[#2d112b] text-[#f472b6] shadow-[0_0_15px_rgba(244,114,182,0.15)] border border-[#521c4b]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-lg leading-none">♀</span> girl Leaderboard
          </button>
        </div>

        {/* Podium Section */}
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div></div>
        ) : (
          <div className="flex items-end justify-center gap-3 mb-8 h-64">
            {podiumOrder.map((user, index) => {
              if (!user) return <div key={index} className="w-[30%]"></div>;
              
              const rank = index === 0 ? 2 : index === 1 ? 1 : 3;
              
              const styles = {
                1: { height: 'h-36', color: 'text-[#ffd700]', border: 'border-[#ffd700]', bg: 'bg-gradient-to-t from-[#ffd700]/20 via-[#ffd700]/5 to-transparent', ring: 'ring-[#ffd700]' },
                2: { height: 'h-28', color: 'text-[#a78bfa]', border: 'border-[#a78bfa]', bg: 'bg-gradient-to-t from-[#a78bfa]/20 via-[#a78bfa]/5 to-transparent', ring: 'ring-[#a78bfa]' },
                3: { height: 'h-24', color: 'text-[#f472b6]', border: 'border-[#f472b6]', bg: 'bg-gradient-to-t from-[#f472b6]/20 via-[#f472b6]/5 to-transparent', ring: 'ring-[#f472b6]' },
              }[rank];

              return (
                <div key={user._id} className="flex flex-col items-center relative w-[31%]">
                  {rank === 1 && (
                    <div className="absolute -top-12 z-20">
                      <Flame className="w-8 h-8 text-[#ffd700] fill-[#ffd700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
                    </div>
                  )}
                  
                  {/* Avatar */}
                  <div className="relative mb-3">
                    <div className={`p-1 rounded-full bg-gradient-to-b from-transparent to-${styles.color.split('-')[1]}-900/50`}>
                      <img
                        src={user.imageUrl || '/api/placeholder/150/150'}
                        alt={user.fullName}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-full object-cover ring-2 ${styles.ring} ring-offset-4 ring-offset-[#0b0515]`}
                      />
                    </div>
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold bg-[#0b0515] border-2 ${styles.border} ${styles.color}`}>
                      {rank}
                    </div>
                  </div>

                  {/* Pedestal */}
                  <div className={`w-full ${styles.height} ${styles.bg} rounded-t-3xl border-t-2 ${styles.border} flex flex-col items-center pt-4 px-1 shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)]`}>
                    <p className="font-bold text-[13px] md:text-sm truncate w-full text-center tracking-wide">{user.fullName}</p>
                    
                    {activeTab === 'girl' ? (
                      <>
                        <p className="text-[#ffd700] text-[11px] font-bold flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-[#ffd700]" /> {user.averageRating || '0.0'}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-1">Followers</p>
                        <p className={`text-[13px] font-bold ${styles.color}`}>
                          {user.followersCount >= 1000 ? `${(user.followersCount / 1000).toFixed(1)}K` : user.followersCount || 0}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[9px] text-gray-400 mt-1">Respect Points</p>
                        <p className={`text-[13px] font-bold ${styles.color}`}>
                          {user.ratingScore?.toLocaleString() || 0}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List Section */}
        <div className="flex flex-col gap-3">
          {!isLoading && restList.map((user, index) => {
            const rank = index + 4;
            return (
              <div key={user._id} className="flex items-center justify-between bg-[#11081a] p-3 rounded-2xl border border-[#2a1b42] hover:bg-[#150a21] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-[15px] font-semibold text-gray-400">{rank}</span>
                  <img
                    src={user.imageUrl || '/api/placeholder/150/150'}
                    alt={user.fullName}
                    className="w-11 h-11 rounded-full object-cover border border-[#2a1b42]"
                  />
                  <span className="font-semibold text-[15px]">{user.fullName}</span>
                </div>

                {activeTab === 'girl' ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[#ffd700] text-sm font-bold w-12 justify-end">
                      <Star className="w-3.5 h-3.5 fill-[#ffd700]" /> {user.averageRating || '0.0'}
                    </div>
                    <div className="text-[11px] text-gray-400 w-24 text-right">
                      Followers <span className="text-white font-semibold ml-1">
                        {user.followersCount >= 1000 ? `${(user.followersCount / 1000).toFixed(1)}K` : user.followersCount || 0}
                      </span>
                    </div>
                    <button className="p-2 rounded-full border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 transition-colors">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Respect Points</p>
                      <p className="text-[15px] font-bold text-white tracking-wide">
                        {user.ratingScore?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#1e1332] border border-[#2a1b42] flex items-center justify-center">
                      <Star className="w-4 h-4 text-[#a78bfa] fill-[#a78bfa]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;