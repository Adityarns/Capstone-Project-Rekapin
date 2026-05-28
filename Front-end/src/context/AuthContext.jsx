/**
 * ============================================================
 *    REKAPIN — Auth Context
 *    src/context/AuthContext.jsx
 *
 *    Menyimpan auth state secara global:
 *    - Apakah user sudah login?
 *    - Siapa user-nya? (nama, email, role)
 *    - Fungsi login / logout / register
 *
 *    Cara kerja React Context:
 *    1. AuthProvider membungkus seluruh app di App.jsx
 *    2. Komponen manapun bisa pakai useAuth() untuk akses state
 *    3. Tidak perlu prop drilling — tidak perlu pass props
 *       dari App → Layout → Sidebar → NavItem
 *
 *    Analogi: Context seperti "siaran radio" — AuthProvider
 *    adalah stasiunnya, useAuth() adalah radionya.
 * ============================================================
 * @format
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  loginUser,
  logoutUser,
  registerUser,
  getUserById,
  isSessionActive,
} from "../services/authService";
import { tokenStorage } from "../services/api";

// ── Buat context ──────────────────────────────────────────────
// createContext() membuat "channel" kosong.
// Nilai defaultnya null — artinya belum ada provider.
const AuthContext = createContext(null);

// ── AuthProvider component ────────────────────────────────────
// Ini yang membungkus seluruh app. Di sinilah state disimpan
// dan fungsi didefinisikan.

export function AuthProvider({ children }) {
  // State: data user yang sedang login
  // null = belum login / belum dicek
  const [user, setUser] = useState(null);

  // State: apakah sedang dalam proses pengecekan session awal?
  // Dipakai untuk mencegah flash redirect sebelum kita tahu
  // apakah user sudah login atau belum.
  const [isLoading, setIsLoading] = useState(true);

  // ── Cek session yang tersimpan saat app pertama dibuka ────
  // Ini berjalan sekali saat komponen mount.
  // Kenapa perlu? Karena saat user refresh halaman, React state
  // direset — kita perlu cek localStorage apakah masih ada token.
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const token = tokenStorage.getAccess();
        if (token) {
          // Token ada → anggap masih login
          // TODO: opsional — bisa decode JWT untuk dapat user info
          // atau panggil /users/:userId untuk validasi token
          const storedUser = localStorage.getItem("rekapin_user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Token ada tapi user data tidak ada → partial state
            // Simpan minimal agar ProtectedRoute tahu sudah login
            setUser({ _tokenOnly: true });
          }
        }
      } catch {
        // Jika ada data rusak di localStorage, clear semua
        tokenStorage.clearAll();
        localStorage.removeItem("rekapin_user");
      } finally {
        // Selesai cek → loading done, apapun hasilnya
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  // ── LOGIN ────────────────────────────────────────────────────
  // Dipanggil dari Login.jsx saat user submit form.
  // Mengembalikan { success: true } atau { success: false, message: "..." }
  // agar komponen bisa tampilkan error yang tepat.

  const login = useCallback(async ({ email, password, invitationCode }) => {
    try {
      // 1. Hanya panggil satu endpoint ini saja
      const loginResponse = await loginUser({
        email,
        password,
        invitationCode,
      });

      // 2. Ambil data user yang sudah dirakit lengkap oleh backend saat login
      const profile = loginResponse.user;

      const userData = {
        userId: profile.user_id,
        name: profile.username,
        email: profile.email,
        role: profile.role,
        avatarSrc: profile.avatar_url,
        business_id: profile.business_id,
        business_name: profile.business_name,
        avatar_url: profile.avatar_url,
      };

      setUser(userData);
      localStorage.setItem("rekapin_user", JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  // ── REGISTER ─────────────────────────────────────────────────
  // Dipanggil dari Register.jsx.
  // Setelah register berhasil, langsung auto-login tidak dilakukan —
  // user diarahkan ke /login untuk login manual.
  // Kenapa? Karena backend register tidak mengembalikan token,
  // hanya data user. Jadi harus login terpisah.

  const register = useCallback(async (formData) => {
    try {
      const userData = await registerUser(formData);
      // Register sukses → kembalikan data untuk ditampilkan atau redirect
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  // ── LOGOUT ───────────────────────────────────────────────────
  // Dipanggil dari Sidebar.jsx.
  // Clear semua state dan storage, redirect ke /login.

  const logout = useCallback(async () => {
    await logoutUser(); // panggil DELETE /auth/logout
    setUser(null);
    localStorage.removeItem("rekapin_user");
    // Redirect ditangani di Sidebar.jsx setelah fungsi ini selesai
  }, []);

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updatedUser = {
        ...prev,
        ...updatedFields,
      };

      localStorage.setItem("rekapin_user", JSON.stringify(updatedUser));

      return updatedUser;
    });
  };

  // ── Value yang di-share ke seluruh app ───────────────────────
  const value = {
    user, // data user (null jika belum login)
    isAuthenticated: !!user, // boolean, lebih mudah dicek
    isLoading, // true saat pertama kali cek session
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Custom hook useAuth() ─────────────────────────────────────
// Kenapa dibuat hook terpisah?
// Supaya komponen tidak perlu import AuthContext secara langsung.
// Cukup: import { useAuth } from '../context/AuthContext'
// Dan jika useAuth() dipanggil di luar AuthProvider, kita bisa
// berikan error yang jelas.

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth() harus digunakan di dalam <AuthProvider>. Cek App.jsx.",
    );
  }
  return context;
}
