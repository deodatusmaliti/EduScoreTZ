import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Building,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Zap,
  Search,
  Check,
  Send,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, backendApi } from '../services/backendApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  language?: 'en' | 'sw';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  language = 'en',
}) => {
  const {
    signInGoogle,
    signInYahoo,
    signInEmail,
    signUpEmail,
    sendPasswordReset,
    setDemoUser,
    authError,
    clearError,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'confirm-reset' | 'recover-username'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('Jitegemee Secondary School');
  const [role, setRole] = useState<UserRole>('teacher');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [usernameMatches, setUsernameMatches] = useState<Array<{ email: string; displayName: string; role: string; institution: string }> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isSw = language === 'sw';

  const handleGoogleLogin = async () => {
    try {
      await signInGoogle(email.trim() || undefined, fullName.trim() || undefined);
      onClose();
    } catch {
      // Handled in authContext
    }
  };

  const handleYahooLogin = async () => {
    try {
      await signInYahoo(email.trim() || undefined, fullName.trim() || undefined);
      onClose();
    } catch {
      // Handled in authContext
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    clearError();
    setSuccessMessage(null);

    try {
      const res = await sendPasswordReset(email.trim());
      setSuccessMessage(
        isSw
          ? `Barua pepe ya kurejesha nenosiri imetumwa. Namba yako ya uthibitisho (PIN): ${res.restorationCode || 'N/A'}`
          : `Restoration email dispatched. Your verification PIN code is: ${res.restorationCode || 'Check inbox'}`
      );
      if (res.restorationCode) {
        setResetCode(res.restorationCode);
      }
      setMode('confirm-reset');
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword) return;
    setIsSubmitting(true);
    clearError();
    setSuccessMessage(null);

    try {
      const res = await backendApi.confirmPasswordReset(resetCode.trim(), newPassword);
      setSuccessMessage(
        isSw
          ? 'Nenosiri lako limerekebishwa kikamilifu! Sasa unaweza kuingia.'
          : res.message || 'Password successfully restored! You can now log in.'
      );
      setPassword(newPassword);
      setMode('signin');
    } catch (err: any) {
      clearError();
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverUsernameLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() && !institution.trim() && !email.trim()) return;
    setIsSubmitting(true);
    clearError();
    setSuccessMessage(null);

    try {
      const q = fullName.trim() || institution.trim() || email.trim();
      const res = await backendApi.recoverUsername(q);
      setUsernameMatches(res.matches || []);
      setSuccessMessage(
        isSw
          ? `Akaunti ${res.matches.length} zimepatikana zinazolingana na utafutaji wako.`
          : `Found ${res.matches.length} matching institutional account(s).`
      );
    } catch (err: any) {
      clearError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    if (mode === 'signin') {
      if (!email.trim() || !password) return;
      try {
        await signInEmail(email, password);
        onClose();
      } catch {
        // Handled in context
      }
    } else if (mode === 'signup') {
      if (!email.trim() || !password || !fullName.trim()) return;
      if (password.length < 6) return;
      try {
        await signUpEmail(email, password, fullName, role, institution);
        onClose();
      } catch {
        // Handled in context
      }
    }
  };

  const handleQuickDemo = (selectedRole: UserRole) => {
    setDemoUser(selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
              TZ
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                EduScore Independent Cloud
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Server className="w-2.5 h-2.5" />
                  1TB Engine
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {isSw
                  ? 'Kuingia Salama, Ukaguzi wa Usalama na Urejeshaji Nenosiri'
                  : 'Standard Authentication Protocol & Credential Restoration Suite'}
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="flex bg-slate-800/80 p-1 rounded-xl mt-4 border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearError();
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isSw ? 'Ingia (Sign In)' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearError();
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isSw ? 'Fungua Akaunti (Register)' : 'Create Account'}
              </button>
            </div>
          )}

          {(mode === 'forgot' || mode === 'confirm-reset' || mode === 'recover-username') && (
            <div className="flex items-center gap-2 mt-4 text-xs font-bold text-amber-300">
              <button
                onClick={() => {
                  setMode('signin');
                  clearError();
                  setSuccessMessage(null);
                }}
                className="flex items-center gap-1 hover:underline cursor-pointer text-slate-200 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isSw ? 'Rudi Kuingia' : 'Back to Sign In'}</span>
              </button>
              <span>•</span>
              <span className="text-amber-400 font-semibold">
                {mode === 'forgot'
                  ? 'Password Restoration Request'
                  : mode === 'confirm-reset'
                  ? 'Verify PIN & Set Password'
                  : 'Username / Email Lookup'}
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Notifications / Errors */}
          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-2 animate-fadeIn">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 space-y-2">
                  {authError.includes('EMAIL_ALREADY_IN_USE') ? (
                    <div>
                      <p className="font-semibold text-rose-900">
                        {isSw ? 'Barua pepe hii imekwisha kusajiliwa.' : 'This email address is already registered.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signin');
                          clearError();
                        }}
                        className="mt-1 inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-900 bg-amber-100 px-2.5 py-1 rounded text-xs cursor-pointer border border-amber-300"
                      >
                        ➜ {isSw ? 'Ingia na barua pepe hii' : 'Switch to Sign In'}
                      </button>
                    </div>
                  ) : authError.includes('INVALID_CREDENTIAL') ? (
                    <div>
                      <p className="font-semibold text-rose-900">{authError.replace('INVALID_CREDENTIAL:', '')}</p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setMode('signup');
                            clearError();
                          }}
                          className="inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-900 bg-amber-100 px-2.5 py-1 rounded text-xs cursor-pointer border border-amber-300"
                        >
                          ➜ {isSw ? 'Unda Akaunti Mpya' : 'Create Account'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            clearError();
                          }}
                          className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900 bg-white px-2 py-1 rounded text-xs cursor-pointer border border-slate-300"
                        >
                          {isSw ? 'Umesahau nenosiri?' : 'Forgot Password?'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-semibold">{authError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <span className="font-bold">{isSw ? 'Taarifa: ' : 'Success: '}</span>
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {/* Social / OAuth Providers */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs shadow-sm transition-all hover:border-slate-400 active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google 1-Click</span>
                </button>

                {/* Yahoo Button */}
                <button
                  type="button"
                  onClick={handleYahooLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#6001d2]/10 border border-[#6001d2]/30 hover:bg-[#6001d2]/20 text-[#6001d2] rounded-xl font-semibold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  <span className="font-black text-sm text-[#6001d2]">Y!</span>
                  <span>Yahoo 1-Click</span>
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isSw ? 'au kwa Barua Pepe na Nenosiri' : 'or with Email & Password'}
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
            </div>
          )}

          {/* Form: Sign In & Sign Up */}
          {(mode === 'signin' || mode === 'signup') && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isSw ? 'Jina Kamili la Mwalimu/Afisa' : 'Full Name & Title'}
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Mwl. Sophia Mlay"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isSw ? 'Nafasi/Jukumu' : 'System Role'}
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="admin">Administrator / Principal</option>
                        <option value="headteacher">Academic Master / Head</option>
                        <option value="teacher">Subject Teacher</option>
                        <option value="parent">Parent / Guardian</option>
                        <option value="inspector">District Inspector</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isSw ? 'Jina la Shule' : 'School Institution'}
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="Jitegemee Sec School"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isSw ? 'Anuani ya Barua Pepe' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.ac.tz or deodatusmaliti2@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isSw ? 'Nenosiri Salama' : 'Secure Password'}
                  </label>
                  {mode === 'signin' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          clearError();
                          setSuccessMessage(null);
                        }}
                        className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                      >
                        {isSw ? 'Umesahau nenosiri?' : 'Forgot password?'}
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('recover-username');
                          clearError();
                          setSuccessMessage(null);
                        }}
                        className="text-[11px] text-blue-700 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        {isSw ? 'Tafuta akaunti' : 'Forgot email?'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Policy Minimum 6 characters Indicator */}
                {mode === 'signup' && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1">
                      {password.length >= 6 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 font-bold inline" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 inline" />
                      )}
                      <span className={password.length >= 6 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                        {isSw ? 'Sera ya Nenosiri: Angalau herufi 6' : 'Password Policy: Minimum 6 characters'}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {password.length}/6+
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : mode === 'signin' ? (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{isSw ? 'Ingia Kwenye Mfumo' : 'Sign In to Independent Backend'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isSw ? 'Unda Akaunti na Ujiunge' : 'Create Cloud Account'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode: Forgot Password (Step 1 Request) */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotRequest} className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <p>
                  Enter your registered institutional email. We will generate a cryptographic verification PIN and restoration link.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.ac.tz or deodatusmaliti2@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Restoration PIN & Link'}</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('confirm-reset')}
                  className="text-xs text-amber-800 hover:underline font-semibold cursor-pointer"
                >
                  Already have a verification PIN? Enter PIN & new password
                </button>
              </div>
            </form>
          )}

          {/* Mode: Confirm Password Reset (Step 2 Verification & New Password) */}
          {mode === 'confirm-reset' && (
            <form onSubmit={handleConfirmReset} className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <p>
                  Enter the <strong>6-digit restoration PIN</strong> sent to your email, along with your desired new secure password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Verification PIN / Token</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="e.g. 583921"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Secure Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1">
                    {newPassword.length >= 6 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 font-bold inline" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 inline" />
                    )}
                    <span className={newPassword.length >= 6 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      {isSw ? 'Sera ya Nenosiri: Angalau herufi 6' : 'Policy: Minimum 6 characters'}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {newPassword.length}/6+
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !resetCode.trim() || newPassword.length < 6}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Restoring...' : 'Restore & Save New Password'}</span>
              </button>
            </form>
          )}

          {/* Mode: Recover Username / Account Finder */}
          {mode === 'recover-username' && (
            <form onSubmit={handleRecoverUsernameLookup} className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <p>
                  Search for your account details using your educator name, school name, or keyword.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Search Identifier</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Masanja, Sophia, or Jitegemee"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !fullName.trim()}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{isSubmitting ? 'Searching...' : 'Lookup Registered Account'}</span>
              </button>

              {usernameMatches && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 max-h-48 overflow-y-auto">
                  <span className="font-bold text-slate-800 block text-[11px]">Matching Accounts:</span>
                  {usernameMatches.length === 0 ? (
                    <p className="text-slate-500 italic">No account matched your search.</p>
                  ) : (
                    usernameMatches.map((m, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="font-bold text-slate-900">{m.displayName} ({m.role})</div>
                          <div className="font-mono text-slate-600 text-[10px]">{m.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(m.email);
                            setMode('forgot');
                          }}
                          className="px-2 py-1 bg-amber-100 text-amber-900 rounded font-bold hover:bg-amber-200 text-[10px] cursor-pointer"
                        >
                          Use this email
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </form>
          )}

          {/* Quick Demo Switcher */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {isSw ? 'Ingia Moja kwa Moja (Nafasi za Jaribio)' : 'Instant Demo Role Switch'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-1.5 px-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[11px] font-bold rounded-lg text-center transition-colors truncate cursor-pointer shadow-xs"
                title="Super Administrator / Principal / System Controller"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('teacher')}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg text-center transition-colors truncate cursor-pointer"
                title="Subject Teacher"
              >
                👨‍🏫 Teacher
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('inspector')}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg text-center transition-colors truncate cursor-pointer"
                title="District Inspector"
              >
                🏛️ Inspector
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
