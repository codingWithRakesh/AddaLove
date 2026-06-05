import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleError, handleSuccess } from '../components/ErrorMessage';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupGirls() {
  const navigate = useNavigate();

  // ===== STEP 1: Email OTP Verification =====
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Registration, 4: Video, 5: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // ===== STEP 3: Registration Form =====
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    age: '',
    password: '',
    confirmPassword: '',
    profilePhoto: null,
    profilePhotoPreview: null,
  });

  // ===== STEP 4: Video Recording =====
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimerInterval, setRecordingTimerInterval] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  // ===== STEP 5: Success Data =====
  const [applicationId, setApplicationId] = useState('');
  const [userId, setUserId] = useState('');
  const [registrationData, setRegistrationData] = useState(null);

  // OTP Timer Effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    setOtpSent(false);
  }, [timer]);

  // Cleanup recording timer
  useEffect(() => {
    return () => {
      if (recordingTimerInterval) clearInterval(recordingTimerInterval);
    };
  }, [recordingTimerInterval]);

  // ==================== STEP 1: SEND OTP ====================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: 'Invalid email format' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/send-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setErrors({ email: data.message || 'Failed to send OTP' });
        setLoading(false);
        return;
      }

      setReferenceCode(data.data.referenceCode);
      setOtpSent(true);
      setTimer(120); // 2-minute timer
      setSuccessMessage('OTP sent to your email!');
      setStep(2);
    } catch (error) {
      setErrors({ email: error.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  // ==================== STEP 2: VERIFY OTP ====================
  const handleSubmitOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    if (!otp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    if (otp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/verify-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp, referenceCode }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setErrors({ otp: data.message || 'Invalid OTP' });
        setLoading(false);
        return;
      }

      setSuccessMessage('OTP verified successfully!');
      setFormData((prev) => ({ ...prev, email }));
      setStep(3); // Move to registration form
    } catch (error) {
      setErrors({ otp: error.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  // ==================== STEP 3: HANDLE FORM INPUT CHANGE ====================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ==================== STEP 3: HANDLE PHOTO UPLOAD ====================
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, profilePhoto: 'Please upload an image file' }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, profilePhoto: 'File size must be less than 5MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profilePhoto: file,
          profilePhotoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ==================== STEP 3: VALIDATE & SUBMIT REGISTRATION ====================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    const { fullName, age, password, confirmPassword } = formData;

    // Validation
    if (!fullName.trim()) {
      setErrors((prev) => ({ ...prev, fullName: 'Full name is required' }));
      return;
    }

    if (!age || parseInt(age) < 18) {
      setErrors((prev) => ({ ...prev, age: 'Age must be 18 or above' }));
      return;
    }

    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      return;
    }

    if (password.length < 8) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return;
    }

    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    if (!formData.profilePhoto) {
      setErrors((prev) => ({ ...prev, profilePhoto: 'Profile photo is required' }));
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', fullName);
      formDataToSend.append('email', email);
      formDataToSend.append('age', age);
      formDataToSend.append('password', password);
      formDataToSend.append('profilePhoto', formData.profilePhoto);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/girl-register`,
        {
          method: 'POST',
          body: formDataToSend,
        }
      );

      const data = await response.json();
      console.log(data)
      if (!data.success) {
        setErrors({ general: data.message || 'Registration failed' });
        setLoading(false);
        return;
      }

      // Store registration data including userId
      setRegistrationData(data.data.newuser);
      setUserId(data.data.newuser._id);
      setSuccessMessage('Registration successful! Now upload your verification video.');
      setStep(4); // Move to video upload
    } catch (error) {
      setErrors({ general: error.message || 'Network error during registration' });
    } finally {
      setLoading(false);
    }
  };

  // ==================== STEP 4: START CAMERA ====================
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      // 1. Set state to TRUE first so React renders the <video> tag
      setCameraActive(true);
      setErrors({});

      // 2. Use a short timeout to let React finish mounting the <video> element
      // before attempting to attach the stream to it.
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);

    } catch (error) {
      setErrors({ video: 'Unable to access camera. Please check permissions.' });
    }
  };

  // ==================== STEP 4: START RECORDING ====================
  const handleStartRecording = () => {
    setErrors({});
    setRecordedVideoBlob(null);
    setRecordingTime(0);

    const stream = videoRef.current?.srcObject;
    if (!stream) {
      setErrors({ video: 'Camera not accessible' });
      return;
    }

    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setRecordedVideoBlob(blob);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);

    // Start 10-second timer
    let seconds = 0;
    const interval = setInterval(() => {
      seconds += 1;
      setRecordingTime(seconds);

      if (seconds >= 10) {
        clearInterval(interval);
        recorder.stop();
        setIsRecording(false);
        setRecordingTimerInterval(null);
      }
    }, 1000);

    setRecordingTimerInterval(interval);
  };

  // ==================== STEP 4: STOP RECORDING MANUALLY ====================
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerInterval) {
        clearInterval(recordingTimerInterval);
        setRecordingTimerInterval(null);
      }
    }
  };

  // ==================== STEP 4: STOP CAMERA ====================
  const handleStopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingTimerInterval) clearInterval(recordingTimerInterval);
    }
  };

  // ==================== STEP 4: SUBMIT VIDEO ====================
  const handleSubmitVideo = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    if (!recordedVideoBlob) {
      setErrors({ video: 'Please record a video first' });
      return;
    }

    if (recordingTime < 10) {
      setErrors({ video: 'Video must be at least 10 seconds long' });
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('girlVedio', recordedVideoBlob, 'verification-video.webm');
      formDataToSend.append('userId', userId);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/girl-vedio`,
        {
          method: 'PUT',
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (!data.success) {
        setErrors({ video: data.message || 'Video upload failed' });
        setLoading(false);
        return;
      }

      // Extract application ID from response
      setApplicationId(data.data.applicationId);
      setSuccessMessage('Video uploaded successfully!');
      handleStopCamera();
      setStep(5); // Move to success screen
    } catch (error) {
      setErrors({ video: error.message || 'Network error during video upload' });
    } finally {
      setLoading(false);
    }
  };

  // ==================== COPY APPLICATION ID ====================
  const handleCopyApplicationId = () => {
    navigator.clipboard.writeText(applicationId);
    setSuccessMessage('Application ID copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ==================== CHECK APPLICATION STATUS ====================
  const handleCheckApplication = () => {
    navigate('/check-application', { state: { applicationId } });
  };

  // ==================== RENDER STEP 1: EMAIL VERIFICATION ====================
  if (step === 1) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A] text-slate-100 flex items-center justify-center px-4 py-8">
        {/* Animated background blur elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:border-white/30 transition-all duration-300">
            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] bg-clip-text text-transparent mb-2 text-center">
              Girl's Signup
            </h1>
            <p className="text-slate-400 text-sm text-center mb-8 font-semibold tracking-wide">
              Step 1: Email Verification
            </p>

            {errors.general && handleError(errors.general)}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 text-sm font-semibold">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-3 text-slate-200">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 hover:bg-white/5 disabled:opacity-50"
                  disabled={loading}
                />
                {errors.email && <p className="text-red-400 text-xs mt-2 font-semibold">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 px-4 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:from-[#FF4D8D] hover:to-[#6C3BFF]"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A]">
                    Already have an account?
                  </span>
                </div>
              </div>

              {/* Sign Up Link */}
              <a
                href="/girlslogin"
                className="block w-full py-3 border border-white/20 text-white font-bold rounded-xl text-center hover:bg-white/5 hover:border-[#FF4D8D] transition-all duration-300 transform hover:scale-105"
              >
                Login
              </a>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER STEP 2: OTP VERIFICATION ====================
  if (step === 2) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A] text-slate-100 flex items-center justify-center px-4 py-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:border-white/30 transition-all duration-300">
            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] bg-clip-text text-transparent mb-2 text-center">
              Verify OTP
            </h1>
            <p className="text-slate-400 text-sm text-center mb-8 font-semibold tracking-wide">
              Step 2: Enter 6-Digit Code
            </p>

            {errors.general && handleError(errors.general)}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 text-sm font-semibold">
                {successMessage}
              </div>
            )}

            <p className="text-slate-300 text-sm text-center mb-6 font-medium">
              We've sent an OTP to <span className="text-[#FF4D8D] font-bold">{email}</span>
            </p>

            <form onSubmit={handleSubmitOtp} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold mb-3 text-slate-200">
                  Enter OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    setErrors((prev) => ({ ...prev, otp: '' }));
                  }}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 hover:bg-white/5 text-center text-2xl tracking-widest font-bold disabled:opacity-50"
                  disabled={loading}
                />
                {errors.otp && <p className="text-red-400 text-xs mt-2 font-semibold">{errors.otp}</p>}
              </div>

              {otpSent && timer > 0 && (
                <p className="text-center text-slate-300 text-sm font-semibold">
                  Resend OTP in <span className="text-[#FF4D8D]">{timer}s</span>
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              {timer === 0 && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-3 px-4 bg-white/5 border border-white/20 text-slate-200 font-bold rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                >
                  Resend OTP
                </button>
              )}
            </form>

            <button
              onClick={() => setStep(1)}
              className="w-full mt-6 py-3 px-4 text-slate-300 font-semibold hover:text-slate-100 transition-colors duration-300"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER STEP 3: REGISTRATION FORM ====================
  if (step === 3) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A] text-slate-100 flex items-center justify-center px-4 py-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:border-white/30 transition-all duration-300">
            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] bg-clip-text text-transparent mb-2 text-center">
              Complete Profile
            </h1>
            <p className="text-slate-400 text-sm text-center mb-8 font-semibold tracking-wide">
              Step 3: Your Information
            </p>

            {errors.general && handleError(errors.general)}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 text-sm font-semibold">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold mb-2 text-slate-200">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 hover:bg-white/5 disabled:opacity-50"
                  disabled={loading}
                />
                {errors.fullName && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.fullName}</p>}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-500 placeholder-slate-400 focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Age */}
              <div>
                <label htmlFor="age" className="block text-sm font-semibold mb-2 text-slate-200">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Enter your age"
                  min="18"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 hover:bg-white/5 disabled:opacity-50"
                  disabled={loading}
                />
                {errors.age && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.age}</p>}
              </div>

              {/* Profile Photo */}
              <div>
                <label htmlFor="profilePhoto" className="block text-sm font-semibold mb-2 text-slate-200">
                  Profile Photo
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    id="profilePhoto"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full px-4 py-3 bg-white/5 border-2 border-dashed border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] transition-all duration-300 hover:border-white/30 cursor-pointer disabled:opacity-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FF4D8D]/20 file:text-[#FF4D8D] hover:file:bg-[#FF4D8D]/30"
                    disabled={loading}
                  />
                  {formData.profilePhotoPreview && (
                    <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border-2 border-[#FF4D8D]/30">
                      <img src={formData.profilePhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                {errors.profilePhoto && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.profilePhoto}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2 text-slate-200">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 hover:bg-white/5 pr-10 disabled:opacity-50"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#FF4D8D] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 text-slate-200">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 hover:bg-white/5 pr-10 disabled:opacity-50"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#FF4D8D] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? 'Registering...' : 'Continue to Video Upload'}
              </button>
            </form>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-6 py-3 px-4 text-slate-300 font-semibold hover:text-slate-100 transition-colors duration-300"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER STEP 4: VIDEO RECORDING ====================
  if (step === 4) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A] text-slate-100 flex items-center justify-center px-4 py-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:border-white/30 transition-all duration-300 max-h-[90vh] overflow-y-auto">
            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] bg-clip-text text-transparent mb-2 text-center">
              Verification Video
            </h1>
            <p className="text-slate-400 text-sm text-center mb-6 font-semibold tracking-wide">
              Step 4: Record Your Video
            </p>

            {errors.general && handleError(errors.general)}
            {errors.video && handleError(errors.video)}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 text-sm font-semibold">
                {successMessage}
              </div>
            )}

            {/* Instructions */}
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
              <h3 className="font-bold mb-3 text-slate-200">📹 Instructions:</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>✓ Record a 10-second video for verification</li>
                <li>✓ Make sure your face is clearly visible</li>
                <li>✓ The video helps us verify you are real</li>
                <li>✓ Ensure good lighting and clear audio</li>
              </ul>
            </div>

            {/* Video Preview / Recording Area */}
            <div className="mb-6 rounded-2xl overflow-hidden border-2 border-white/20 hover:border-[#FF4D8D]/50 transition-all duration-300 bg-black">
              {cameraActive ? (
                <div className="relative aspect-video bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-full">
                      <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      <span className="text-white text-sm font-bold">{recordingTime}s</span>
                    </div>
                  )}
                </div>
              ) : recordedVideoBlob ? (
                <div className="space-y-3 p-4">
                  <video
                    src={URL.createObjectURL(recordedVideoBlob)}
                    controls
                    className="w-full h-auto rounded-lg"
                  />
                  <p className="text-green-400 text-sm font-bold text-center">
                    ✓ Video recorded ({recordingTime}s)
                  </p>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center text-slate-400">
                  <p className="text-center">📷 Camera feed will appear here</p>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {!cameraActive ? (
                <button
                  className="col-span-1 md:col-span-2 py-3 px-4 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  onClick={handleStartCamera}
                  disabled={loading}
                >
                  📷 Open Camera
                </button>
              ) : (
                <>
                  {!isRecording ? (
                    <button
                      className="py-3 px-4 bg-red-500/80 text-white font-bold rounded-xl hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300"
                      onClick={handleStartRecording}
                      disabled={loading}
                    >
                      🔴 Start Record
                    </button>
                  ) : (
                    <button
                      className="py-3 px-4 bg-orange-500/80 text-white font-bold rounded-xl hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300"
                      onClick={handleStopRecording}
                    >
                      ⏹ Stop Record
                    </button>
                  )}

                  <button
                    className="py-3 px-4 bg-white/5 border border-white/20 text-slate-200 font-bold rounded-xl hover:bg-white/10 hover:border-white/30 disabled:opacity-50 transition-all duration-300"
                    onClick={handleStopCamera}
                    disabled={isRecording}
                  >
                    ❌ Close Camera
                  </button>
                </>
              )}
            </div>

            {/* Submit Video */}
            {recordedVideoBlob && (
              <form onSubmit={handleSubmitVideo}>
                <button
                  type="submit"
                  disabled={loading || recordingTime < 10}
                  className="w-full py-3 px-4 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? 'Uploading Video...' : '📤 Upload & Submit'}
                </button>
              </form>
            )}

            <button
              onClick={() => setStep(3)}
              className="w-full mt-6 py-3 px-4 text-slate-300 font-semibold hover:text-slate-100 transition-colors duration-300"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER STEP 5: SUCCESS SCREEN ====================
  if (step === 5) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A] text-slate-100 flex items-center justify-center px-4 py-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:border-white/30 transition-all duration-300 max-h-[90vh] overflow-y-auto">
            {/* Success Icon */}
            <div className="text-6xl text-center mb-6 animate-bounce">✅</div>

            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] bg-clip-text text-transparent mb-3 text-center">
              Application Submitted!
            </h1>

            <div className="space-y-6">
              <p className="text-center text-slate-300 font-medium">
                Your application has been successfully received.
              </p>

              {/* Application ID Card */}
              <div className="bg-linear-to-r from-[#FF4D8D]/20 to-[#6C3BFF]/20 border border-[#FF4D8D]/30 rounded-2xl p-6 text-center">
                <p className="text-xs font-bold text-slate-300 mb-3 tracking-widest uppercase">
                  Your Application ID
                </p>
                <div className="flex items-center justify-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                  <span className="text-xl md:text-2xl font-bold font-mono text-[#FF4D8D] break-all">
                    {applicationId}
                  </span>
                  <button
                    onClick={handleCopyApplicationId}
                    className="shrink-0 w-10 h-10 rounded-lg bg-[#FF4D8D]/20 border border-[#FF4D8D]/50 flex items-center justify-center text-[#FF4D8D] hover:bg-[#FF4D8D]/30 hover:border-[#FF4D8D] transition-all duration-300 hover:shadow-lg hover:shadow-[#FF4D8D]/50"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                  ⏳ What Happens Next?
                </h3>
                <ol className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <span className="font-bold text-[#FF4D8D]">1.</span>
                    <span>Our admin team will review your verification video</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#FF4D8D]">2.</span>
                    <span>We will verify that you are a real person</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#FF4D8D]">3.</span>
                    <span>Once approved, you'll receive a confirmation email</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#FF4D8D]">4.</span>
                    <span>You can then start using our platform</span>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-200 text-xs font-semibold">
                📧 Please check your email (including spam folder) for our confirmation.
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleCheckApplication}
                  className="w-full py-3 px-4 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 transition-all duration-300"
                >
                  🔍 Check Application Status
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 bg-white/5 border border-white/20 text-slate-200 font-bold rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                >
                  🔐 Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
