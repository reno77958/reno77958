import { useState, useEffect } from 'react';

const ADMIN_EMAIL = 'reno77958@gmail.com';
const AUTH_STORAGE_KEY = 'chordjitu_admin_session_v1';
const PASS_STORAGE_KEY = 'chordjitu_admin_pass_v1';
const DEFAULT_PASS = 'chordjitu2026';

export function useAdminAuth() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      const session = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return parsed.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && parsed.isLoggedIn === true;
    } catch {
      return false;
    }
  });

  const [adminEmail, setAdminEmail] = useState<string | null>(() => {
    return isAdminAuthenticated ? ADMIN_EMAIL : null;
  });

  const getStoredPassword = (): string => {
    return localStorage.getItem(PASS_STORAGE_KEY) || DEFAULT_PASS;
  };

  const login = (emailInput: string, passwordInput: string): { success: boolean; error?: string } => {
    const cleanEmail = emailInput.trim().toLowerCase();
    
    // Strict verification: only reno77958@gmail.com is allowed!
    if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
      return {
        success: false,
        error: `Akses Ditolak! Akun "${emailInput}" tidak memiliki izin admin. Halaman ini khusus untuk ${ADMIN_EMAIL}.`,
      };
    }

    const currentPassword = getStoredPassword();
    if (passwordInput !== currentPassword) {
      return {
        success: false,
        error: 'Password admin salah. Silakan periksa kembali password Anda.',
      };
    }

    // Login successful
    const session = {
      email: ADMIN_EMAIL,
      isLoggedIn: true,
      loginTime: new Date().toISOString(),
    };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error(e);
    }

    setIsAdminAuthenticated(true);
    setAdminEmail(ADMIN_EMAIL);
    return { success: true };
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setIsAdminAuthenticated(false);
    setAdminEmail(null);
  };

  const changePassword = (oldPass: string, newPass: string): { success: boolean; error?: string } => {
    const current = getStoredPassword();
    if (oldPass !== current) {
      return { success: false, error: 'Password lama salah.' };
    }
    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'Password baru minimal 6 karakter.' };
    }

    try {
      localStorage.setItem(PASS_STORAGE_KEY, newPass);
      return { success: true };
    } catch {
      return { success: false, error: 'Gagal menyimpan password baru.' };
    }
  };

  return {
    isAdminAuthenticated,
    adminEmail,
    ownerEmail: ADMIN_EMAIL,
    login,
    logout,
    changePassword,
  };
}
