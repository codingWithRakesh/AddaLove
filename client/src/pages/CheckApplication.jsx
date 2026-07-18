import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Calendar, 
  Hash, 
  CalendarDays, 
  Video,
  Globe,
  ChevronDown,
  ArrowRight,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

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

  // Status mapping for the modern UI
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return {
          color: 'text-green-400',
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          icon: <CheckCircle2 className="w-8 h-8 text-green-400" />,
          title: '✅ Congratulations! Your Application is Accepted',
          message: 'Welcome to AddaLove! Your account has been verified and you can now access all features. A confirmation email has been sent to your registered email address.'
        };
      case 'rejected':
        return {
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: <XCircle className="w-8 h-8 text-red-400" />,
          title: '❌ Your Application Was Not Approved',
          message: "Unfortunately, we couldn't verify your identity from the submitted video. Please try signing up again with a clear 10-second video showing your face."
        };
      case 'pending':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          icon: <Clock className="w-8 h-8 text-yellow-400" />,
          title: '⏳ Your Application is Under Review',
          message: 'Our admin team is reviewing your verification video. This typically takes 24-48 hours. Please check your email for updates.'
        };
      default:
        return {
          color: 'text-slate-400',
          bg: 'bg-white/5',
          border: 'border-white/10',
          icon: <HelpCircle className="w-8 h-8 text-slate-400" />,
          title: '❓ Unknown Status',
          message: 'Your application status is currently unknown. Please contact support.'
        };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusConfig = applicationData ? getStatusConfig(applicationData.applicationStatus) : null;

  return (
    <div className="min-h-screen bg-[#0A0014] text-slate-100 flex flex-col items-center py-6 px-4 font-sans relative overflow-x-hidden">
      
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center items-center">
        <div className="absolute top-[10%] w-[500px] h-[500px] bg-[#FF2994] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse"></div>
        <div className="absolute bottom-[-10%] w-[400px] h-[400px] bg-[#8B2BFF] rounded-full mix-blend-screen filter blur-[150px] opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-2xl flex flex-col items-center z-10">
        
        {/* Header Section */}
        <div className="w-full flex justify-between items-center mb-4 px-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">
              Adda<span className="text-[#FF2994]">Love</span>
            </h1>
            <p className="text-[10px] text-slate-300 mt-0.5">Application <span className="text-[#FF2994]">Status</span></p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition">
            <Globe className="w-3.5 h-3.5" />
            English
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Character Image (Hidden if results are showing to save vertical space) */}
        {!applicationData && (
          <div className="relative w-full flex justify-center mb-6 animate-fadeIn">
            <img 
              src="https://ik.imagekit.io/ufopzzlbh/addlovemodel.jpeg" 
              alt="AddaLove Mascot" 
              className="w-48 h-auto drop-shadow-[0_0_25px_rgba(255,41,148,0.4)] transition-all duration-500"
            />
          </div>
        )}

        <div className="w-full bg-[#150A2A]/90 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl">
          
          {/* Title Area */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-1">
              Check Application
            </h2>
            <p className="text-slate-400 text-sm">
              Enter your tracking ID to see your status
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleCheckStatus} className="mb-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                  <Hash className="w-5 h-5 text-[#FF2994] shrink-0" />
                  <input
                    type="text"
                    id="applicationId"
                    value={applicationId}
                    onChange={(e) => {
                      setApplicationId(e.target.value);
                      setErrors({});
                    }}
                    placeholder="e.g., APP123456789"
                    className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm disabled:opacity-50"
                    disabled={loading}
                  />
                </div>
                {errors.applicationId && (
                  <p className="text-red-400 text-xs mt-1.5 px-2 font-medium">{errors.applicationId}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search Application
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results Section */}
          {searched && !loading && applicationData && statusConfig && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Status Header Badge */}
              <div className="flex justify-center mt-2">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border bg-black/50 ${statusConfig.border} shadow-inner`}>
                  {statusConfig.icon}
                  <span className={`font-bold text-lg uppercase tracking-widest ${statusConfig.color}`}>
                    {applicationData.applicationStatus?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Status Message Alert */}
              <div className={`border-l-4 rounded-r-2xl p-5 shadow-lg ${statusConfig.bg} ${statusConfig.border}`}>
                <h4 className={`font-bold mb-2 flex items-center gap-2 ${statusConfig.color}`}>
                  {statusConfig.title}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {statusConfig.message}
                </p>
              </div>

              {/* Application Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#1C1035] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Full Name</label>
                    <p className="text-slate-200 font-medium text-sm">{applicationData.fullName}</p>
                  </div>
                </div>

                <div className="bg-[#1C1035] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Email</label>
                    <p className="text-slate-200 font-medium text-sm break-all">{applicationData.email}</p>
                  </div>
                </div>

                <div className="bg-[#1C1035] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Age</label>
                    <p className="text-slate-200 font-medium text-sm">{applicationData.age}</p>
                  </div>
                </div>

                <div className="bg-[#1C1035] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                  <CalendarDays className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Submitted On</label>
                    <p className="text-slate-200 font-medium text-sm">{new Date(applicationData.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-[#1C1035] border border-white/5 rounded-2xl p-4 sm:col-span-2 flex items-start gap-3">
                  <Hash className="w-5 h-5 text-[#FF2994] shrink-0 mt-0.5" />
                  <div className="w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Tracking ID</label>
                    <p className="text-[#FF2994] font-mono font-bold text-sm break-all">{applicationData.applicationId}</p>
                  </div>
                </div>
              </div>

              {/* Verification Video */}
              {applicationData.vedioUrl && (
                <div className="bg-[#1C1035] border border-white/5 rounded-2xl p-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" /> Submitted Video
                  </label>
                  <video
                    src={applicationData.vedioUrl}
                    controls
                    className="w-full h-auto aspect-video rounded-xl border border-white/10 bg-black object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Not Found State */}
          {searched && !loading && !applicationData && (
            <div className="text-center py-8 animate-fadeIn border border-white/5 bg-[#1C1035] rounded-2xl mt-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-xl font-bold text-white mb-1">No Application Found</p>
              <p className="text-slate-400 text-sm">Please verify your application ID and try again.</p>
            </div>
          )}

          {/* Action Buttons */}
          {applicationData && (
            <div className="space-y-3 mt-8 animate-fadeIn">
              {applicationData.applicationStatus?.toLowerCase() === 'accepted' && (
                <button
                  onClick={() => navigate('/girlslogin')}
                  className="w-full py-4 px-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                >
                  Proceed to Login <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => {
                  setApplicationData(null);
                  setApplicationId('');
                  setSearched(false);
                  setErrors({});
                }}
                className="w-full py-4 px-4 bg-[#1C1035] border border-white/10 text-white font-bold rounded-full hover:bg-white/5 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
                Check Another Status
              </button>
            </div>
          )}

          {/* Return Links */}
          <div className="mt-6 flex flex-col items-center gap-4">
            {!applicationData && (
              <button
                onClick={() => navigate('/signupgirl')}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Return to Signup
              </button>
            )}

            {/* Help / Info Box */}
            <div className="w-full bg-[#1C1035] border border-white/5 rounded-2xl p-5">
              <h4 className="font-bold text-slate-200 mb-3 flex items-center gap-2 text-sm">
                <HelpCircle className="w-4 h-4 text-[#8B2BFF]" /> Need Help?
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#FF2994] mt-0.5">•</span>
                  Check your email (including spam) for your application ID.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF2994] mt-0.5">•</span>
                  Application review usually takes 24-48 hours.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF2994] mt-0.5">•</span>
                  If rejected, you can submit a new application with a clearer video.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Animation & Inputs Reset */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}