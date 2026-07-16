import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader, Mail, Phone, Verified } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { handleSuccess } from '../components/ErrorMessage';
import shotlogo from '../assets/logo2.png';

export default function ForgetPassword() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errors, setErrors] = useState({});
  const naviget = useNavigate();

  const backendUrl = import.meta.env.VITE_BACKEND_URL2 || import.meta.env.VITE_BACKEND_URL;
  const supportMessage = 'Your account is not have gamil contatc our support team ph no : 7362999841';

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const parseResponse = async (response) => {
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Something went wrong. Try again.');
    }
    return data;
  };

  const handleFindUser = async () => {
    const cleanedPhone = phoneNumber.trim();
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(cleanedPhone)) {
      setErrors({ phoneNumber: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/auth/v1/find-user-for-forget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleanedPhone }),
      });
      const data = await parseResponse(response);

      if (!data.data) {
        setEmail('');
        setSelectedEmail('');
        setErrors({ email: supportMessage });
        setStep(2);
        return;
      }

      setEmail(data.data);
      setSelectedEmail(data.data);
      setErrors({});
      setStep(2);
    } catch (error) {
      setErrors({ phoneNumber: error.message || 'User not found.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!selectedEmail) {
      setErrors({ email: 'Please select Gmail to send OTP.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/auth/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail, purpose: 'forget-password' }),
      });
      const data = await parseResponse(response);
      setReferenceCode(data.data.referenceCode);
      setOtp('');
      setTimer(120);
      setErrors({});
      setStep(3);
    } catch (error) {
      setErrors({ email: error.message || 'Failed to send OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/auth/v1/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, referenceCode }),
      });
      await parseResponse(response);
      setErrors({});
      setStep(4);
    } catch (error) {
      setErrors({ otp: error.message || 'Invalid OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters.';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/auth/v1/forget-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail, newPassword }),
      });
      await parseResponse(response);
      handleSuccess('Password has been changed!');
      naviget('/login');
    } catch (error) {
      setErrors({ submit: error.message || 'Password change failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A] text-slate-100 flex items-center justify-center px-4 py-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-block mb-4 p-3 bg-linear-to-r from-[rgb(28,1,11)] to-[#170352] rounded-full">
              <img className="h-10" src={shotlogo} alt="" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] bg-clip-text text-transparent mb-2">AddaLove</h1>
            <p className="text-slate-300 text-sm">
              {step === 1 && 'Find your account with phone number'}
              {step === 2 && 'Select Gmail to receive OTP'}
              {step === 3 && 'Enter the OTP sent to your Gmail'}
              {step === 4 && 'Create your new password'}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-200">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (errors.phoneNumber) setErrors({});
                    }}
                    placeholder="eg. 8665237845"
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 hover:bg-white/5"
                  />
                </div>
                {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>}
              </div>
              <button onClick={handleFindUser} disabled={loading} className="w-full py-3 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <><Loader className="w-4 h-4 animate-spin" />Checking...</> : 'Find Account'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {email ? (
                <>
                  <button type="button" onClick={() => setSelectedEmail(email)} className={`w-full p-4 border rounded-xl text-left transition-all duration-300 ${selectedEmail === email ? 'border-[#FF4D8D] bg-white/10' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}>
                    <span className="flex items-center gap-3 text-sm font-semibold text-slate-100">
                      <Mail className="w-5 h-5 text-[#FF4D8D]" />
                      {email}
                      {selectedEmail === email && <Verified className="w-5 h-5 text-blue-500 ml-auto" />}
                    </span>
                  </button>
                  {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                  <button onClick={handleSendOtp} disabled={loading || !selectedEmail} className="w-full py-3 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? <><Loader className="w-4 h-4 animate-spin" />Sending...</> : 'Send OTP'}
                  </button>
                </>
              ) : (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <p className="text-red-300 text-sm">{errors.email || supportMessage}</p>
                </div>
              )}
              <button type="button" onClick={() => { setStep(1); setErrors({}); }} className="w-full py-2 text-slate-300 hover:text-[#FF4D8D] transition-colors text-sm font-semibold">Back</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-200">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (errors.otp) setErrors({});
                  }}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 text-center text-2xl tracking-widest font-bold hover:bg-white/5"
                />
                {errors.otp && <p className="text-red-400 text-xs mt-1">{errors.otp}</p>}
              </div>
              <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="w-full py-3 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <><Loader className="w-4 h-4 animate-spin" />Verifying...</> : 'Verify OTP'}
              </button>
              <div className="text-center flex justify-between items-center">
                <button type="button" onClick={() => { setStep(2); setOtp(''); setErrors({}); }} className="text-xs text-slate-400 hover:text-[#FF4D8D] transition-colors">Back</button>
                {timer > 0 ? <span className="text-xs text-slate-400">Resend in {timer}s</span> : <button type="button" onClick={handleSendOtp} className="text-xs text-[#FF4D8D] hover:text-[#6C3BFF] transition-colors">Resend OTP</button>}
              </div>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={handleChangePassword} className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-200">New Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors({}); }} placeholder="Password" className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 pr-10 hover:bg-white/5" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#FF4D8D] transition-colors">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
                {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-200">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({}); }} placeholder="Confirm password" className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 pr-10 hover:bg-white/5" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#FF4D8D] transition-colors">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
              {errors.submit && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl"><p className="text-red-300 text-xs">{errors.submit}</p></div>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <><Loader className="w-4 h-4 animate-spin" />Saving...</> : 'Change Password'}
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A]">Remember your password?</span></div>
          </div>
          <Link to="/login" className="block w-full py-3 border border-white/20 text-white font-bold rounded-xl text-center hover:bg-white/5 hover:border-[#FF4D8D] transition-all duration-300 transform hover:scale-105">Login</Link>
        </div>

        <div className="flex gap-2 justify-center mt-8">
          {[1, 2, 3, 4].map((i) => <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] w-8' : 'bg-white/20 w-6'}`} />)}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}

