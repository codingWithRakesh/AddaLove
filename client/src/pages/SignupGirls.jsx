import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { handleError, handleSuccess } from '../components/ErrorMessage';
import { 
  Eye, 
  EyeOff, 
  Verified,
  Smartphone,
  Globe,
  ChevronDown,
  Sparkles,
  ArrowRight,
  User,
  Mail,
  FileText,
  Calendar,
  Lock,
  Camera,
  Video,
  CheckCircle2,
  Copy,
  AlertCircle,
  Loader
} from 'lucide-react';
import shotlogo from "../assets/logo2.png";

export default function SignupGirls() {
  const navigate = useNavigate();

  // ===== STEP 1: Email OTP Verification (Phone in logic) =====
  const [step, setStep] = useState(1); // 1: Email/Phone, 2: OTP, 3: Registration, 4: Video, 5: Success
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('')
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
    phoneNumber: '',
    bio: "",
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
  const [uploadProgress, setUploadProgress] = useState(0); // Tracks upload progress %

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
    if (e) e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    const cleanedPhone = phoneNumber.trim();

    // Validation
    if (!cleanedPhone) {
      setErrors({ phoneNumber: 'Phone number is required.' });
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(cleanedPhone)) {
      setErrors({
        phoneNumber: 'Please enter a valid 10-digit Indian mobile number.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL2}/api/auth/v1/send-sms-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: cleanedPhone }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setErrors({ phoneNumber: data.message || 'Failed to send OTP' });
        setLoading(false);
        return;
      }

      setReferenceCode(data.data.referenceCode);
      setOtpSent(true);
      setTimer(120); // 2-minute timer
      setSuccessMessage('OTP sent to your phone number!');
      setStep(2);
    } catch (error) {
      setErrors({ phoneNumber: error.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  // ==================== STEP 2: VERIFY OTP ====================
  const handleSubmitOtp = async (e) => {
    if (e) e.preventDefault();
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
        `${import.meta.env.VITE_BACKEND_URL2}/api/auth/v1/verify-otp`,
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
      setFormData((prev) => ({ ...prev, phoneNumber }));
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
        setErrors((prev) => ({ ...prev, profilePhoto: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ==================== STEP 3: VALIDATE & SUBMIT REGISTRATION ====================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    const { fullName, age, password, confirmPassword, email, bio } = formData;

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
      formDataToSend.append('email', formData.email);
      formDataToSend.append('age', age);
      formDataToSend.append('bio', bio);
      formDataToSend.append('password', password);
      formDataToSend.append('phoneNumber', phoneNumber)
      formDataToSend.append('profilePhoto', formData.profilePhoto);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL2}/api/auth/v1/girl-register`,
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

      setCameraActive(true);
      setErrors({});

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
    setUploadProgress(0); // Reset upload tracker when re-recording

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

  // ==================== STEP 4: SUBMIT VIDEO WITH PROGRESS ====================
  const handleSubmitVideo = (e) => {
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
    setUploadProgress(0);

    const formDataToSend = new FormData();
    formDataToSend.append('girlVedio', recordedVideoBlob, 'verification-video.webm');
    formDataToSend.append('userId', userId);

    // Using XMLHttpRequest to support file stream transmission tracking updates
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentage);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        
        if (!data.success) {
          setErrors({ video: data.message || 'Video upload failed' });
          setLoading(false);
          return;
        }

        setApplicationId(data.data.applicationId);
        setSuccessMessage('Video uploaded successfully!');
        handleStopCamera();
        setStep(5); // Move to success screen
      } catch (err) {
        setErrors({ video: 'Invalid server response structure.' });
      } finally {
        setLoading(false);
      }
    });

    xhr.addEventListener('error', () => {
      setErrors({ video: 'Network error during video upload setup.' });
      setLoading(false);
    });

    xhr.open('PUT', `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/girl-vedio`);
    xhr.send(formDataToSend);
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

  // ==================== SHARED LAYOUT RENDER ====================
  return (
    <div className="min-h-screen bg-[#0A0014] text-slate-100 flex flex-col items-center py-6 px-4 font-sans relative overflow-x-hidden">
      
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center items-center">
        <div className="absolute top-[10%] w-[500px] h-[500px] bg-[#FF2994] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse"></div>
        <div className="absolute bottom-[-10%] w-[400px] h-[400px] bg-[#8B2BFF] rounded-full mix-blend-screen filter blur-[150px] opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-md flex flex-col items-center z-10">
        
        {/* Header Section */}
        <div className="w-full flex justify-between items-center mb-4 px-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">
              Adda<span className="text-[#FF2994]">Love</span>
            </h1>
            <p className="text-[10px] text-slate-300 mt-0.5">Girls Community <span className="text-[#FF2994]">Signup</span></p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition">
            <Globe className="w-3.5 h-3.5" />
            English
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Character Image (Hidden on form & video steps to save vertical space) */}
        {step < 3 && (
          <div className="relative w-full flex justify-center mb-6">
            <img 
              src="https://ik.imagekit.io/ufopzzlbh/addlovemodel.jpeg" 
              alt="AddaLove Mascot" 
              className="w-48 h-auto drop-shadow-[0_0_25px_rgba(255,41,148,0.4)] transition-all duration-500"
            />
          </div>
        )}

        {/* Main Glassmorphism Card */}
        <div className="w-full bg-[#150A2A]/90 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl">
          
          {/* Main Messaging Logic for Step Header */}
          {step !== 5 && (
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-1">
                {step === 1 && "Create an Account"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Complete Profile"}
                {step === 4 && "Verification Video"}
              </h2>
              <p className="text-slate-400 text-sm">
                {step === 1 && 'Enter your phone number to get started'}
                {step === 2 && 'Enter the 6-digit code sent to your phone'}
                {step === 3 && 'Tell us a bit more about yourself'}
                {step === 4 && 'Record a 10s video to verify your identity'}
              </p>
            </div>
          )}

          {/* Global Error/Success Render inside card */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
              <p className="text-red-400 text-xs flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.general}</p>
            </div>
          )}
          {successMessage && step !== 5 && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
              <p className="text-green-400 text-xs flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3"/>{successMessage}</p>
            </div>
          )}

          {/* ==================== STEP 1 ==================== */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                  <Smartphone className="w-5 h-5 text-[#FF2994] shrink-0" />
                  <input
                    type="number"
                    name='phoneNumber'
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (errors.phoneNumber) setErrors({});
                    }}
                    placeholder="Phone Number"
                    className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm disabled:opacity-50"
                    disabled={loading}
                  />
                  <div className="flex items-center text-slate-400 text-sm border-l border-white/10 pl-3 ml-2 shrink-0">
                    +91 <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                </div>
                {errors.phoneNumber && <p className="text-red-400 text-xs mt-1.5 px-2">{errors.phoneNumber}</p>}
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading || !phoneNumber}
                className="w-full mt-4 py-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Send OTP
                  </>
                )}
              </button>

              <Link 
                to="/girlslogin"
                className="mt-6 flex items-center justify-between w-full bg-[#1A0B2E] border border-white/5 hover:border-[#FF2994]/30 rounded-2xl p-4 transition-colors group cursor-pointer"
              >
                <span className="text-sm text-slate-300">
                  Already have an account? <span className="text-[#FF2994] font-medium group-hover:text-[#FF66AD] transition-colors">Login</span>
                </span>
                <div className="w-7 h-7 rounded-full bg-[#2A1545] flex items-center justify-center group-hover:bg-[#FF2994]/20 transition-colors">
                  <ArrowRight className="w-4 h-4 text-[#FF2994]" />
                </div>
              </Link>
            </div>
          )}

          {/* ==================== STEP 2 ==================== */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-4 focus-within:border-[#FF2994]/50 transition-colors">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (errors.otp) setErrors({});
                    }}
                    placeholder="••••••"
                    maxLength="6"
                    className="w-full bg-transparent text-white placeholder-slate-600 text-center text-3xl tracking-[0.5em] font-bold outline-none disabled:opacity-50"
                    disabled={loading}
                  />
                </div>
                {errors.otp && <p className="text-red-400 text-xs mt-1.5 px-2 text-center">{errors.otp}</p>}
              </div>

              <button
                onClick={handleSubmitOtp}
                disabled={loading || otp.length !== 6}
                className="w-full py-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Verified className="w-4 h-4" />
                    Verify OTP
                  </>
                )}
              </button>

              <div className="text-center flex justify-between items-center px-2">
                <button
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setErrors({});
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors font-medium"
                >
                  Change Number
                </button>
                {timer > 0 ? (
                  <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full">Resend in {timer}s</span>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    className="text-xs text-[#FF2994] hover:text-[#FF66AD] transition-colors font-medium"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================== STEP 3 ==================== */}
          {step === 3 && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fadeIn">
              
              {/* Profile Photo Upload inside Step 3 */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="profilePhoto"
                    disabled={loading}
                  />
                  <label
                    htmlFor="profilePhoto"
                    className={`flex flex-col items-center justify-center w-24 h-24 rounded-full cursor-pointer transition-all duration-300 overflow-hidden border-2 ${formData.profilePhotoPreview ? 'border-[#FF2994]' : 'border-dashed border-white/20 bg-[#1C1035] hover:border-[#FF2994]/50 hover:bg-[#251545]'}`}
                  >
                    {formData.profilePhotoPreview ? (
                      <>
                        <img
                          src={formData.profilePhotoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <Camera className="w-6 h-6 mb-1 text-slate-400 group-hover:text-[#FF2994] transition-colors" />
                        <span className="text-[9px] font-medium uppercase tracking-wider group-hover:text-[#FF2994] transition-colors">Upload</span>
                      </div>
                    )}
                  </label>
                </div>
                {errors.profilePhoto && <p className="text-red-400 text-xs mt-1.5">{errors.profilePhoto}</p>}
              </div>

              {/* Full Name */}
              <div>
                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                  <User className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm disabled:opacity-50"
                    disabled={loading}
                  />
                </div>
                {errors.fullName && <p className="text-red-400 text-xs mt-1 px-2">{errors.fullName}</p>}
              </div>

              {/* Phone (Read-only) */}
              <div>
                <div className="flex items-center bg-[#150A2A] border border-white/5 rounded-2xl px-4 py-3.5 opacity-80">
                  <Verified className="w-5 h-5 text-green-400 shrink-0" />
                  <input
                    type="number"
                    value={phoneNumber}
                    readOnly
                    className="w-full bg-transparent text-slate-300 ml-3 outline-none text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                  <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder='Email Address (Optional)'
                    className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm disabled:opacity-50"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Age */}
              <div>
                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Age (Min 18)"
                    min="18"
                    max="120"
                    className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm disabled:opacity-50"
                    disabled={loading}
                  />
                </div>
                {errors.age && <p className="text-red-400 text-xs mt-1 px-2">{errors.age}</p>}
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-start bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                  <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Write a short bio..."
                    rows={2}
                    className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm resize-none disabled:opacity-50"
                    disabled={loading}
                  />
                </div>
                {errors.bio && <p className="text-red-400 text-xs mt-1 px-2">{errors.bio}</p>}
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className="w-full bg-transparent text-white placeholder-slate-500 ml-2 outline-none text-sm disabled:opacity-50"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-white transition-colors shrink-0"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-[10px] mt-1 px-1">{errors.password}</p>}
                </div>
                <div>
                  <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm"
                      className="w-full bg-transparent text-white placeholder-slate-500 ml-2 outline-none text-sm disabled:opacity-50"
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-[10px] mt-1 px-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    Continue to Video Verification
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2 mt-2 text-slate-400 hover:text-white transition-colors text-xs font-medium"
                disabled={loading}
              >
                Back to OTP
              </button>
            </form>
          )}

          {/* ==================== STEP 4 ==================== */}
          {step === 4 && (
            <div className="animate-fadeIn">
              
              {/* Instructions */}
              <div className="mb-5 p-4 bg-[#1C1035] border border-white/5 rounded-2xl">
                <h3 className="font-bold mb-2 text-slate-200 flex items-center gap-2 text-sm"><Video className="w-4 h-4 text-[#FF2994]" /> Verification Rules:</h3>
                <ul className="space-y-1.5 text-xs text-slate-400 ml-6 list-disc">
                  <li>Record a 10-second video</li>
                  <li>Ensure your face is clearly visible</li>
                  <li>Have good lighting and clear audio</li>
                </ul>
              </div>

              {/* Video Preview / Recording Area */}
              <div className="mb-5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF2994]/50 transition-all duration-300 bg-[#1C1035] shadow-inner">
                {errors.video && (
                  <div className="p-2 bg-red-500/10 text-center border-b border-red-500/30">
                    <p className="text-red-400 text-xs">{errors.video}</p>
                  </div>
                )}
                
                {cameraActive ? (
                  <div className="relative aspect-[4/3] bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {isRecording && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md border border-red-400/50">
                        <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        <span className="text-white text-xs font-bold tracking-widest">00:0{recordingTime}</span>
                      </div>
                    )}
                  </div>
                ) : recordedVideoBlob ? (
                  <div className="p-3 bg-black">
                    <video
                      src={URL.createObjectURL(recordedVideoBlob)}
                      controls
                      className="w-full h-auto aspect-[4/3] rounded-xl object-cover"
                    />
                    <div className="mt-3 flex items-center justify-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 py-2 rounded-lg border border-green-500/20">
                      <CheckCircle2 className="w-4 h-4" /> Video recorded successfully ({recordingTime}s)
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[4/3] flex flex-col items-center justify-center text-slate-500 gap-3">
                    <Camera className="w-10 h-10 opacity-50" />
                    <p className="text-xs font-medium uppercase tracking-widest">Camera Feed</p>
                  </div>
                )}
              </div>

              {/* Recording Controls */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {!cameraActive ? (
                  <button
                    className="col-span-2 py-3.5 px-4 bg-[#1C1035] border border-white/10 text-white font-bold rounded-2xl hover:border-[#FF2994]/50 hover:bg-[#251545] disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                    onClick={handleStartCamera}
                    disabled={loading}
                  >
                    <Camera className="w-4 h-4 text-[#FF2994]" />
                    Open Camera
                  </button>
                ) : (
                  <>
                    {!isRecording ? (
                      <button
                        className="col-span-2 py-3.5 px-4 bg-red-500/90 text-white font-bold rounded-2xl hover:bg-red-600 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                        onClick={handleStartRecording}
                        disabled={loading}
                      >
                        <span className="w-3 h-3 bg-white rounded-full"></span>
                        Start Recording
                      </button>
                    ) : (
                      <button
                        className="col-span-2 py-3.5 px-4 bg-orange-500/90 text-white font-bold rounded-2xl hover:bg-orange-600 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                        onClick={handleStopRecording}
                      >
                        <span className="w-3 h-3 bg-white rounded-sm"></span>
                        Stop Recording
                      </button>
                    )}

                    <button
                      className="col-span-2 py-3 px-4 bg-transparent border border-white/10 text-slate-400 font-medium rounded-2xl hover:bg-white/5 hover:text-white disabled:opacity-50 transition-all duration-300 text-xs"
                      onClick={handleStopCamera}
                      disabled={isRecording}
                    >
                      Cancel & Close Camera
                    </button>
                  </>
                )}
              </div>

              {/* Submit & Upload Progress UI Layer */}
              {recordedVideoBlob && (
                <form onSubmit={handleSubmitVideo} className="space-y-4">
                  {loading && (
                    <div className="w-full space-y-2 bg-[#1C1035] p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>Uploading verification file...</span>
                        <span className="text-[#FF2994] font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] h-full transition-all duration-150 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={loading || recordingTime < 10}
                    className="w-full py-4 px-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? `Uploading Video (${uploadProgress}%)` : (
                      <>
                        Submit Verification Video <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ==================== STEP 5 ==================== */}
          {step === 5 && (
            <div className="animate-fadeIn py-4">
              <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-2 text-center">
                Application Submitted!
              </h1>
              <p className="text-center text-slate-400 text-sm mb-6">
                Your verification video is under review.
              </p>

              <div className="bg-[#1C1035] border border-white/5 rounded-2xl p-5 mb-6 text-center shadow-inner">
                <p className="text-[10px] font-bold text-slate-400 mb-2 tracking-widest uppercase">
                  Your Application ID
                </p>
                <div className="flex items-center justify-between gap-3 bg-black/50 rounded-xl p-3 border border-white/5">
                  <span className="text-sm font-bold font-mono text-[#FF2994] truncate">
                    {applicationId}
                  </span>
                  <button
                    onClick={handleCopyApplicationId}
                    className="shrink-0 w-8 h-8 rounded-lg bg-[#251545] border border-white/5 flex items-center justify-center text-slate-300 hover:bg-[#FF2994]/20 hover:text-[#FF2994] hover:border-[#FF2994]/50 transition-all duration-300"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-[#1C1035] border border-white/5 rounded-2xl p-5 space-y-4 mb-6">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8B2BFF]" /> What Happens Next?
                </h3>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#251545] text-white flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                    <span>Admin review of your video & profile.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#251545] text-white flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                    <span>Identity and age verification check.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#251545] text-white flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                    <span>Approval email sent to your inbox.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckApplication}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] transition-all duration-300 text-sm"
                >
                  Check Application Status
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 px-4 bg-transparent border border-white/10 text-slate-300 font-bold rounded-full hover:bg-white/5 transition-all duration-300 text-sm"
                >
                  Return to Login
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Progress Indicator (Global for Steps 1-4) */}
        {step < 5 && (
          <div className="flex gap-2 justify-center mt-6 z-10">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === step
                    ? 'bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] w-8 shadow-[0_0_10px_rgba(255,41,148,0.5)]'
                    : i < step 
                      ? 'bg-[#8B2BFF]/50 w-4'
                      : 'bg-white/10 w-4'
                }`}
              />
            ))}
          </div>
        )}
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
        /* Hide number input spinners */
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}

// Inline component for the Clock icon (since it wasn't in the original imports)
function Clock(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}