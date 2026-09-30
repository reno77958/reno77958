import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  ownerEmail: string;
  onClose: () => void;
  onLogin: (email: string, pass: string) => { success: boolean; error?: string };
  isDarkMode: boolean;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  ownerEmail,
  onClose,
  onLogin,
  isDarkMode,
}) => {
  const [email, setEmail] = useState(ownerEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = onLogin(email, password);
    if (!result.success) {
      setErrorMessage(result.error || 'Login gagal.');
    } else {
      setSuccessMessage('Login berhasil! Mengalihkan ke Dashboard Admin...');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-colors ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-700 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Shield */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-sky-600/10 text-sky-600 dark:text-sky-400 border border-sky-600/20 flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">
              Login Khusus Pemilik
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khusus akun <strong className="text-sky-600 dark:text-sky-400 font-mono">{ownerEmail}</strong>
            </p>
          </div>
        </div>

        {/* Restriction Alert Note */}
        <div className={`p-3 rounded-xl border mb-5 text-xs flex items-start gap-2.5 ${
          isDarkMode
            ? 'bg-sky-950/40 border-sky-900/60 text-sky-200'
            : 'bg-sky-50 border-sky-200 text-sky-900'
        }`}>
          <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
          <span>
            Halaman Admin dilindungi. Pengunjung umum atau akun email lain tidak memiliki izin akses ke dashboard ini.
          </span>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
              Email Akun Admin
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reno77958@gmail.com"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
            {email.toLowerCase() !== ownerEmail.toLowerCase() && (
              <p className="mt-1 text-[11px] text-amber-500 font-medium">
                ⚠️ Hanya email {ownerEmail} yang dapat login.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password Admin
              </label>
              <span className="text-[10px] text-slate-400">
                Default: <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded font-mono">chordjitu2026</code>
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin..."
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-sky-600/20 active:scale-98"
            >
              Masuk ke Halaman Admin
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
          >
            Kembali ke Daftar Lagu (Sebagai Pengunjung)
          </button>
        </div>
      </div>
    </div>
  );
};
