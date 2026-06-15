import React, { useState } from 'react';
import { useUserData } from '../context/UserdataContext';
import { useNavigate } from 'react-router';

export default function Profile() {
  const { useralldata } = useUserData();
  const naviget = useNavigate()
  // State for Modal and Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    userType: '',
    imageUrl: ''
  });

  // Open modal and pre-fill data (excluding email & wallet)
  const handleOpenModal = () => {
    if (useralldata) {
      setFormData({
        fullName: useralldata.fullName,
        age: useralldata.age,
        userType: useralldata.userType,
        imageUrl: useralldata.imageUrl
      });
      setIsModalOpen(true);
    }
  };

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const hnadletopup = () => {

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth', // Optional: creates a smooth animation instead of an instant jump
    });
    naviget('/wallet')
  }

  // Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updated Data:', formData);
    // Add your API call or context update here
    setIsModalOpen(false);
  };

  // ---------------------------------------------------------
  // SKELETON LOADER
  // ---------------------------------------------------------
  if (!useralldata) {
    return (
      <div className="min-h-screen bg-[#0F172A] py-12 px-4 sm:px-6 flex justify-center items-center">
        <div className="w-full max-w-4xl bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden animate-pulse border border-white/5">
          <div className="h-48 bg-slate-700/50 w-full"></div>
          <div className="px-6 md:px-10 pb-10">
            <div className="relative flex flex-col md:flex-row md:justify-between md:items-end -mt-16 md:-mt-20 mb-8 gap-4">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-600 border-4 border-[#1E293B]"></div>
              <div className="w-32 h-10 rounded-full bg-slate-700"></div>
            </div>
            <div className="space-y-4 mb-10">
              <div className="h-8 bg-slate-700 rounded-md w-1/3"></div>
              <div className="h-5 bg-slate-700 rounded-md w-1/4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-700/30 rounded-2xl border border-white/5"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN PROFILE UI
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0F172A] py-12 px-4 sm:px-6 flex justify-center items-center text-white font-sans selection:bg-[#FF4D8D] selection:text-white">

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-4xl bg-[#1E293B]/90 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 transition-all duration-500 hover:shadow-[#6C3BFF]/10 hover:border-white/20">

        {/* Gradient Banner */}
        <div className="h-48 w-full bg-linear-to-r from-[#6C3BFF] via-[#FF4D8D] to-[#4DA6FF] relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/20 rounded-full blur-2xl"></div>
        </div>

        <div className="px-6 md:px-10 pb-10">

          {/* Avatar and Action Section */}
          <div className="relative flex flex-col md:flex-row md:justify-between md:items-end -mt-16 md:-mt-20 mb-8">
            <div className="relative inline-block group">
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-[#6C3BFF] to-[#FF4D8D] blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img
                src={useralldata.imageUrl}
                alt={useralldata.fullName}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#1E293B] bg-[#1E293B] relative z-10 transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>

            <div className="mt-6 md:mt-0">
              <button
                onClick={handleOpenModal}
                className="px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 font-semibold tracking-wide transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:text-[#FF4D8D] hover:shadow-lg active:scale-95"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Header Info */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-300 mb-3 drop-shadow-sm">
              {useralldata.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-slate-400 font-medium">
              <span className="px-3 py-1 rounded-full bg-[#6C3BFF]/10 border border-[#6C3BFF]/30 text-sm backdrop-blur-md flex items-center gap-2 text-[#4DA6FF]">
                <span className="w-2 h-2 rounded-full bg-[#4DA6FF] animate-pulse shadow-[0_0_8px_#4DA6FF]"></span>
                {useralldata.userType}
              </span>
              <span>•</span>
              <span className="text-sm">
                Member since {new Date(useralldata.createdAt).getFullYear()}
              </span>
            </div>
          </div>

          {/* Info Grid using Glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <InfoCard
              icon={<MailIcon />}
              label="Email Address"
              value={useralldata.email}
              gradient="from-[#6C3BFF] to-purple-400"
            />

            <InfoCard
              icon={<UserIcon />}
              label="Age"
              value={`${useralldata.age} Years`}
              gradient="from-[#FF4D8D] to-pink-400"
            />

            {/* Wallet Card with Top Up Button */}
            <InfoCard
              icon={<WalletIcon />}
              label="Wallet Balance"
              value={`$${useralldata.walletBlance.toLocaleString()}`}
              gradient="from-[#4DA6FF] to-blue-400"
              isHighlight={true}
              action={
                <button
                  onClick={hnadletopup}
                  className="mt-3 px-5 py-1.5 rounded-full bg-linear-to-r from-[#4DA6FF] to-[#6C3BFF] text-white text-sm font-bold shadow-lg shadow-[#4DA6FF]/30 hover:shadow-[#4DA6FF]/50 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Top Up
                </button>
              }
            />

            <InfoCard
              icon={<CalendarIcon />}
              label="Last Updated"
              value={new Date(useralldata.updatedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
              gradient="from-slate-400 to-slate-200"
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-[#1E293B]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden transform transition-all">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-linear-to-r from-white/5 to-transparent">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#6C3BFF] focus:ring-1 focus:ring-[#6C3BFF] transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D8D] focus:ring-1 focus:ring-[#FF4D8D] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">User Type</label>
                  <input
                    type="text"
                    name="userType"
                    value={formData.userType}
                    onChange={handleInputChange}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4DA6FF] focus:ring-1 focus:ring-[#4DA6FF] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Profile Image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#6C3BFF] focus:ring-1 focus:ring-[#6C3BFF] transition-all text-sm"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-medium hover:bg-white/5 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] text-white font-bold shadow-lg shadow-[#6C3BFF]/25 hover:shadow-[#6C3BFF]/40 transition-all hover:-translate-y-0.5"
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

// ---------------------------------------------------------
// REUSABLE GLASSMORPHISM CARD COMPONENT
// ---------------------------------------------------------
function InfoCard({ icon, label, value, gradient, isHighlight, action }) {
  return (
    <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-black/40 overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-[2]"></div>

      <div className="flex items-start gap-5 relative z-10 w-full">
        <div className={`p-4 rounded-xl bg-linear-to-br ${gradient} bg-opacity-20 shadow-inner group-hover:scale-110 transition-transform duration-300 shrink-0`}>
          {icon}
        </div>

        <div className="w-full overflow-hidden">
          <p className="text-sm text-slate-400 font-medium mb-1">{label}</p>
          <p className={`text-lg font-bold truncate ${isHighlight
              ? 'text-transparent bg-clip-text bg-linear-to-r from-[#4DA6FF] to-white drop-shadow-sm'
              : 'text-slate-100'
            }`}>
            {value}
          </p>
          {/* Action Area (e.g. Top Up Button) */}
          {action && (
            <div className="mt-1">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// SVG ICONS
// ---------------------------------------------------------
const MailIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);