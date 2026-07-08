import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import useUserStore from '../store/userStore';
import { LogOut, Bell, ChevronLeft, CheckCircle2, Star, Trophy, Users, UserCheck, Wallet } from 'lucide-react';
import { handleError } from '../components/ErrorMessage';

export default function Profile() {
  const { user: useralldata, userRole, userRate } = useUserStore();
  const naviget = useNavigate();

  // State for Modal and Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loder, setLoder] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    userType: '',
    imageUrl: ''
  });

  const isBoy = useMemo(() => userRole === 'boy', [userRole]);
  const isGirl = useMemo(() => userRole === 'girl', [userRole]);

  useEffect(() => {
    console.log("User Data:", useralldata);
    console.log("User Rate:", userRate);
    console.log(isBoy, '....... girl--->>', isGirl)
  }, [useralldata, userRate]);

  // Open modal and pre-fill data
  const handleOpenModal = () => {
    if (useralldata) {
      setFormData({
        fullName: useralldata.fullName || '',
        age: useralldata.age || '',
        userType: useralldata.userType || '',
        imageUrl: useralldata.imageUrl || ''
      });
      setIsModalOpen(true);
    }
  };

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handelTopUp = () => {
    console.log("hello")
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    naviget('/wallet');
  };

  const handlewithdraw = () => {
    console.log("hello")
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    naviget('/withdraw');
  };

  // Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updated Data:', formData);
    // Add API call or context update here
    setIsModalOpen(false);
  };

  const handelLogout = async () => {
    try {
      setLoder(true);
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/logout`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) {
        handleError(data.message);
      }
      window.location.reload();
    } catch (error) {
      console.log(error);
      handleError('Network issue!!');
    } finally {
      setLoder(false);
    }
  };

  // SKELETON LOADER
  if (!useralldata) {
    return (
      <div className="min-h-screen bg-[#090514] py-12 px-4 flex justify-center items-center">
        <div className="w-full max-w-2xl bg-[#130E29] rounded-3xl p-8 animate-pulse border border-purple-900/20">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-purple-950/50"></div>
            <div className="space-y-3 flex-1">
              <div className="h-6 bg-purple-950/50 rounded w-1/3"></div>
              <div className="h-4 bg-purple-950/50 rounded w-1/4"></div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-purple-950/30 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090514] text-white font-sans selection:bg-[#EC4899] selection:text-white pb-24">

      {/* Top Navigation Bar Header from IMG-20260626-WA0012.jpg */}


      {/* Main Container Dashboard */}
      <main className="max-w-md mx-auto px-4 mt-18  min-h-screen bg-[#090514] text-white font-sans selection:bg-[#EC4899] selection:text-white pb-24">

        {/* Profile Identity Card Context */}
        <section className="relative flex items-start justify-between bg-[#130E29]/60 border border-purple-900/30 p-5 rounded-3xl backdrop-blur-xl mb-6 shadow-xl">
          <div className="flex items-start gap-4">
            {/* Crown Avatar Badge Container */}
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg drop-shadow-[0_2px_5px_rgba(236,72,153,0.5)] z-20">👑</div>
              <div className="relative p-1 rounded-full bg-linear-to-tr from-[#8B5CF6] via-[#EC4899] to-[#F472B6] shadow-[0_0_20px_rgba(236,72,153,0.25)]">
                <img
                  src={useralldata.imageUrl}
                  alt={useralldata.fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#130E29] bg-[#1A1235]"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-linear-to-r from-[#EC4899] to-[#8B5CF6] text-[9px] font-black tracking-wider uppercase whitespace-nowrap shadow-md shadow-pink-500/20 border border-white/10">
                {isGirl ? 'Top Girl' : 'Top Boy'}
              </div>
            </div>

            {/* Profile Info Text Blocks */}
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">{useralldata.fullName}</h1>
                <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400" />
              </div>

              <div className="inline-block bg-purple-950/40 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-pink-300">
                ⭐ Stylish Star
              </div>

              <p className="text-xs text-slate-400 italic max-w-50 leading-relaxed py-0.5">
                "Be kind, be real, be you! 💜"
              </p>

              {/* Badges Info Chips Grid Row */}
              <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-medium text-slate-300">
                <span className="bg-[#1C143A] px-2 py-0.5 rounded-md border border-purple-500/10 flex items-center gap-1">
                  👤 {useralldata.age || 20} Years
                </span>
                <span className="bg-[#1C143A] px-2 py-0.5 rounded-md border border-purple-500/10 flex items-center gap-1">
                  📍 India
                </span>
                <span className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${isGirl ? 'bg-pink-950/30 border-pink-500/20 text-pink-400' : 'bg-blue-950/30 border-blue-500/20 text-blue-400'}`}>
                  {isGirl ? '♀️ Girl' : '♂️ Boy'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Call for Editing */}
          <button
            onClick={handleOpenModal}
            className="shrink-0 px-4 py-1.5 text-xs font-bold rounded-full bg-linear-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-90 shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
          >
            Edit Profile
          </button>
        </section>

        {/* Dashboard Analytics Statistics Grid Layout */}
        <section className="grid grid-cols-4 gap-2.5 mb-6">
          <div className="bg-[#130E29]/60 border border-pink-500/40 rounded-2xl p-3 text-center flex flex-col justify-center items-center shadow-lg shadow-pink-500/5">
            <Users className="w-4 h-4 text-pink-500 mb-1" />
            <span className="text-sm font-black text-pink-400">{useralldata.followersCount || 0}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Followers</span>
          </div>

          <div className="bg-[#130E29]/60 border border-purple-900/30 rounded-2xl p-3 text-center flex flex-col justify-center items-center">
            <UserCheck className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-sm font-black text-slate-200">{useralldata.followingCount || 0}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Following</span>
          </div>

          <div className="bg-[#130E29]/60 border border-purple-900/30 rounded-2xl p-3 text-center flex flex-col justify-center items-center">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mb-1" />
            <span className="text-sm font-black text-slate-200">{userRate || '4.8'}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg. Rating</span>
          </div>

          <div className="bg-[#130E29]/60 border border-purple-900/30 rounded-2xl p-3 text-center flex flex-col justify-center items-center">
            <Trophy className="w-4 h-4 text-orange-400 mb-1" />
            <span className="text-sm font-black text-slate-200">Rank 3</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Leaderboard</span>
          </div>
        </section>

        {/* Financial Action Wallet Section Card */}
        <section className="bg-[#130E29]/60 border border-purple-900/30 rounded-2xl p-5 mb-4 shadow-xl flex items-center justify-between relative overflow-hidden group">
          {/* <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div> */}
          <div className="flex items-center gap-3.5 relative z-10">
            <div className={`p-3 rounded-xl ${isGirl ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 tracking-wide">
                {isGirl ? 'Your earning' : 'Wallet Balance'}
              </p>
              <h3 className="text-2xl font-black text-white mt-0.5 tracking-tight">
                {useralldata.walletBlance?.toLocaleString() || 0} <span className="text-xs text-yellow-500 font-bold">Coins</span>
              </h3>
            </div>
          </div>

          <button
            onClick={isBoy?handelTopUp:handlewithdraw}
           
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${isGirl
              ? 'bg-linear-to-r from-pink-500 to-rose-600 shadow-pink-500/20'
              : 'bg-linear-to-r from-blue-500 to-[#8B5CF6] shadow-blue-500/20'
              }`}
          >
            {isGirl ? 'Withdraw' : 'Top Up'}
          </button>
        </section>

        {/* Global Action Management Controls Area */}
        <section className="space-y-3 mt-6">
          <button
            onClick={handelLogout}
            disabled={loder}
            className="w-full flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 text-red-400 font-bold text-sm tracking-wide transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loder ? (
              <svg className="animate-spin h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Logout Account</span>
              </>
            )}
          </button>
        </section>

      </main>

      {/* Edit Profile Glassmorphism Modal Context */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-md bg-[#130E29] border border-purple-500/20 rounded-3xl shadow-2xl overflow-hidden transform transition-all">

            <div className="px-6 py-4 border-b border-purple-900/30 flex justify-between items-center bg-purple-950/20">
              <h2 className="text-base font-bold text-white tracking-wide">Edit Profile Settings</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wider uppercase">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-[#090514] border border-purple-900/40 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wider uppercase">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full bg-[#090514] border border-purple-900/40 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wider uppercase">User Type</label>
                  <input
                    type="text"
                    name="userType"
                    value={formData.userType}
                    onChange={handleInputChange}
                    className="w-full bg-[#090514] border border-purple-900/40 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wider uppercase">Profile Image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full bg-[#090514] border border-purple-900/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all font-mono"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-purple-900/40 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-[#8B5CF6] to-[#EC4899] text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}