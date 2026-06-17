import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CheckApplication() {
  const location = useLocation();
  const navigate = useNavigate();
  const [applicationId, setApplicationId] = useState(
    location.state?.applicationId || ''
  );
  const [loading, setLoading] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [errors, setErrors] = useState({});
  const [searched, setSearched] = useState(false);

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return '#27ae60';
      case 'rejected':
        return '#e74c3c';
      case 'pending':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return '✅';
      case 'rejected':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  // Fetch application details
  const handleCheckStatus = async (e) => {
    e?.preventDefault();
    setErrors({});
    setApplicationData(null);
    setSearched(false);

    if (!applicationId.trim()) {
      setErrors({ applicationId: 'Application ID is required' });
      return;
    }

    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/check-application/${applicationId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (!data.success) {
        setErrors({
          applicationId: data.message || 'Application not found',
        });
        setSearched(true);
        setLoading(false);
        return;
      }

      setApplicationData(data.data);
      setSearched(true);
    } catch (error) {
      setErrors({ applicationId: error.message || 'Network error' });
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // Auto-check if application ID is provided via navigation
  useEffect(() => {
    if (applicationId && !searched) {
      handleCheckStatus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A] text-slate-100 flex items-center justify-center px-4 py-8">
      {/* Animated background blur elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:border-white/30 transition-all duration-300 max-h-[90vh] overflow-y-auto">
          {/* Search Form */}
          <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] bg-clip-text text-transparent mb-2 text-center">
            Check Application
          </h1>
          <p className="text-slate-400 text-sm text-center mb-8 font-semibold tracking-wide">
            Enter your application ID to check the status
          </p>

          <form onSubmit={handleCheckStatus} className="mb-8">
            <div>
              <label htmlFor="applicationId" className="block text-sm font-semibold mb-3 text-slate-200">
                Application ID
              </label>
              <div className="flex gap-3 flex-col sm:flex-row">
                <input
                  type="text"
                  id="applicationId"
                  value={applicationId}
                  onChange={(e) => {
                    setApplicationId(e.target.value);
                    setErrors({});
                  }}
                  placeholder="e.g., APP123456789"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 hover:bg-white/5 disabled:opacity-50"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 whitespace-nowrap"
                >
                  {loading ? '🔍 Searching...' : '🔍 Search'}
                </button>
              </div>
              {errors.applicationId && (
                <p className="text-red-400 text-xs mt-2 font-semibold">{errors.applicationId}</p>
              )}
            </div>
          </form>

          {/* Results Section */}
          {searched && !loading && applicationData && (
            <div className="space-y-6 animate-fadeIn">
              {/* Status Badge */}
              <div className="flex justify-center">
                <div 
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border-2"
                  style={{ borderColor: getStatusColor(applicationData.applicationStatus) }}
                >
                  <span className="text-3xl">{getStatusIcon(applicationData.applicationStatus)}</span>
                  <span 
                    className="font-bold text-lg uppercase tracking-widest"
                    style={{ color: getStatusColor(applicationData.applicationStatus) }}
                  >
                    {applicationData.applicationStatus?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Full Name</label>
                  <p className="text-slate-100 font-semibold">{applicationData.fullName}</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Email</label>
                  <p className="text-slate-100 font-semibold break-all">{applicationData.email}</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Age</label>
                  <p className="text-slate-100 font-semibold">{applicationData.age}</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Application ID</label>
                  <p className="text-slate-100 font-mono font-bold text-sm break-all">{applicationData.applicationId}</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Submitted Date</label>
                  <p className="text-slate-100 font-semibold">{new Date(applicationData.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Verification Video */}
              {applicationData.vedioUrl && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block">Verification Video</label>
                  <video
                    src={applicationData.vedioUrl}
                    controls
                    className="w-full h-auto rounded-lg border border-white/10"
                  />
                </div>
              )}

              {/* Status Messages */}
              {applicationData.applicationStatus?.toLowerCase() === 'pending' && (
                <div className="bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-xl p-5">
                  <h4 className="font-bold text-yellow-200 mb-2 flex items-center gap-2">
                    ⏳ Your Application is Under Review
                  </h4>
                  <p className="text-yellow-100 text-sm leading-relaxed">
                    Our admin team is reviewing your verification video. This typically takes 24-48 hours. Please check your email for updates.
                  </p>
                </div>
              )}

              {applicationData.applicationStatus?.toLowerCase() === 'accepted' && (
                <div className="bg-green-500/10 border-l-4 border-green-500 rounded-r-xl p-5">
                  <h4 className="font-bold text-green-200 mb-2 flex items-center gap-2">
                    ✅ Congratulations! Your Application is Accepted
                  </h4>
                  <p className="text-green-100 text-sm leading-relaxed">
                    Welcome to AddaLove! Your account has been verified and you can now access all features. A confirmation email has been sent to your registered email address.
                  </p>
                </div>
              )}

              {applicationData.applicationStatus?.toLowerCase() === 'rejected' && (
                <div className="bg-red-500/10 border-l-4 border-red-500 rounded-r-xl p-5">
                  <h4 className="font-bold text-red-200 mb-2 flex items-center gap-2">
                    ❌ Your Application Was Not Approved
                  </h4>
                  <p className="text-red-100 text-sm leading-relaxed">
                    Unfortunately, we couldn't verify your identity from the submitted video. Please try signing up again with a clear 10-second video showing your face.
                  </p>
                </div>
              )}
            </div>
          )}

          {searched && !loading && !applicationData && (
            <div className="text-center py-12">
              <p className="text-2xl font-bold text-slate-300 mb-2">No application found</p>
              <p className="text-slate-400 text-sm">Please double-check your application ID and try again.</p>
            </div>
          )}

          {/* Action Buttons */}
          {applicationData && (
            <div className="space-y-3 mt-8">
              {applicationData.applicationStatus?.toLowerCase() === 'accepted' && (
                <button
                  onClick={() => navigate('/girlslogin')}
                  className="w-full py-3 px-4 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 transition-all duration-300"
                >
                  🔐 Go to Login
                </button>
              )}

              <button
                onClick={() => {
                  setApplicationData(null);
                  setApplicationId('');
                  setSearched(false);
                  setErrors({});
                }}
                className="w-full py-3 px-4 bg-white/5 border border-white/20 text-slate-200 font-bold rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                🔄 Check Another Application
              </button>

              <button
                onClick={() => navigate('/signupgirl')}
                className="w-full py-3 px-4 text-slate-300 font-semibold hover:text-slate-100 transition-colors duration-300"
              >
                ← Back to Signup
              </button>
            </div>
          )}

          {!applicationData && (
            <button
              onClick={() => navigate('/girl-signup')}
              className="w-full mt-8 py-3 px-4 bg-white/5 border border-white/20 text-slate-200 font-bold rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            >
              ← Back to Signup
            </button>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-5">
            <h4 className="font-bold text-slate-200 mb-3">❓ Need Help?</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>✓ Check your email (including spam folder) for your application ID</li>
              <li>✓ Application review usually takes 24-48 hours</li>
              <li>✓ Make sure your video is clear and your face is visible</li>
              <li>✓ Contact support if you have any questions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
