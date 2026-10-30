// contexts/PasscodeContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { X, Lock, Key, Mail } from "lucide-react";

const PasscodeContext = createContext();

export const usePasscode = () => {
  const context = useContext(PasscodeContext);
  if (!context) {
    throw new Error("usePasscode must be used within PasscodeProvider");
  }
  return context;
};

const DEFAULT_LOCKED = {
  payroll: true,
  emp_payroll: true,
  expense: true,
  employeeSalaries: true,
  salesStats: true,
  profile: true,
  admin_customers: true,
  emp_sales: true,
};

const SESSION_UNLOCK_KEY = "digious_passcode_session_unlock";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes for non-session unlock

const readSessionUnlock = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_UNLOCK_KEY);
    if (!raw) return { modules: {}, all: false };
    const parsed = JSON.parse(raw);
    return {
      modules: parsed.modules && typeof parsed.modules === "object" ? parsed.modules : {},
      all: !!parsed.all,
    };
  } catch {
    return { modules: {}, all: false };
  }
};

const writeSessionUnlock = (data) => {
  try {
    sessionStorage.setItem(SESSION_UNLOCK_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
};

const clearSessionUnlock = () => {
  try {
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
  } catch {
    /* ignore */
  }
};

const buildLockedFromSession = () => {
  const saved = readSessionUnlock();
  const next = { ...DEFAULT_LOCKED };
  if (saved.all) {
    Object.keys(next).forEach((k) => {
      next[k] = false;
    });
    return next;
  }
  Object.keys(saved.modules).forEach((k) => {
    if (saved.modules[k] && k in next) next[k] = false;
  });
  return next;
};

export const PasscodeProvider = ({ children }) => {
  const [lockedModules, setLockedModules] = useState(buildLockedFromSession);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [tempUnlocked, setTempUnlocked] = useState({});
  const [hasPasscode, setHasPasscode] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Re-hydrate if sessionStorage was updated in another tab
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === SESSION_UNLOCK_KEY) {
        setLockedModules(buildLockedFromSession());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    checkPasscodeStatus();
  }, []);

  const checkPasscodeStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/passcode/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();

      if (data.success) {
        if (data.data.isAdmin) {
          setShowSetupModal(false);
          setHasPasscode(true);
        } else if (data.data.hasPasscode) {
          setShowSetupModal(false);
          setHasPasscode(true);
        } else {
          setShowSetupModal(true);
          setHasPasscode(false);
        }
      }
    } catch (error) {
      console.error("Error checking passcode status:", error);
    }
  };

  const isModuleUnlocked = useCallback(
    (moduleName) => {
      const saved = readSessionUnlock();
      if (saved.all || saved.modules[moduleName]) return true;
      return !lockedModules[moduleName] || !!tempUnlocked[moduleName];
    },
    [lockedModules, tempUnlocked],
  );

  const unlockModule = async (moduleName, passcode, permanent = false) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/passcode/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ passcode, moduleName }),
        },
      );

      const data = await response.json();

      if (data.success) {
        if (permanent) {
          // Session unlock: all confidential modules stay open until logout / tab close
          const allUnlocked = { ...DEFAULT_LOCKED };
          Object.keys(allUnlocked).forEach((k) => {
            allUnlocked[k] = false;
          });
          setLockedModules(allUnlocked);
          writeSessionUnlock({ all: true, modules: {} });
          toast.success("✅ Confidential modules unlocked for this session!");
        } else {
          setTempUnlocked((prev) => ({ ...prev, [moduleName]: true }));
          setTimeout(() => {
            setTempUnlocked((prev) => ({ ...prev, [moduleName]: false }));
            toast(`🔒 ${moduleName} module has been locked again.`, {
              icon: "🔒",
              duration: 3000,
            });
          }, SESSION_TIMEOUT);
          toast.success(`🔓 Module unlocked for 30 minutes!`);
        }
        setShowPasscodeModal(false);
        setCurrentModule(null);
        setFailedAttempts(0);
        return true;
      }

      if (data.remainingAttempts !== undefined) {
        setFailedAttempts(5 - data.remainingAttempts);
      }
      toast.error(`❌ ${data.message}`);
      return false;
    } catch (error) {
      console.error("Error verifying passcode:", error);
      toast.error("❌ Failed to verify passcode");
      return false;
    }
  };

  const setPasscode = async (passcode) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/passcode/set`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ passcode }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setHasPasscode(true);
        setShowSetupModal(false);
        toast.success("✅ Passcode set successfully!");
        await checkPasscodeStatus();
        return true;
      }
      toast.error(`❌ ${data.message}`);
      return false;
    } catch (error) {
      console.error("Error setting passcode:", error);
      toast.error("❌ Failed to set passcode");
      return false;
    }
  };

  const requestPasscodeResetOtp = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/passcode/reset/request-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        return data.data;
      }
      toast.error(data.message || "Failed to send verification code");
      return null;
    } catch (error) {
      console.error("Error requesting passcode reset code:", error);
      toast.error("Failed to send verification code. Please check your connection.");
      return null;
    }
  };

  const resetPasscode = async (otp, newPasscode) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/passcode/reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otp, newPasscode }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setShowResetModal(false);
        setShowPasscodeModal(false);
        toast.success(
          "✅ Passcode reset successfully! Please use your new passcode.",
        );
        setTempUnlocked({});
        setFailedAttempts(0);
        setLockedModules({ ...DEFAULT_LOCKED });
        clearSessionUnlock();
        return true;
      }
      toast.error(`❌ ${data.message}`);
      return false;
    } catch (error) {
      console.error("Error resetting passcode:", error);
      toast.error("❌ Failed to reset passcode. Please check your connection.");
      return false;
    }
  };

  const lockModule = (moduleName) => {
    setLockedModules((prev) => ({ ...prev, [moduleName]: true }));
    setTempUnlocked((prev) => ({ ...prev, [moduleName]: false }));

    const saved = readSessionUnlock();
    if (saved.all) {
      // Downgrade full-session unlock to per-module map (all except this one)
      const modules = {};
      Object.keys(DEFAULT_LOCKED).forEach((k) => {
        if (k !== moduleName) modules[k] = true;
      });
      writeSessionUnlock({ all: false, modules });
      setLockedModules((prev) => {
        const next = { ...DEFAULT_LOCKED };
        Object.keys(modules).forEach((k) => {
          next[k] = false;
        });
        next[moduleName] = true;
        return next;
      });
    } else if (saved.modules[moduleName]) {
      const modules = { ...saved.modules };
      delete modules[moduleName];
      writeSessionUnlock({ all: false, modules });
    }

    toast(`🔒 ${moduleName} module has been locked.`, {
      icon: "🔒",
      duration: 2000,
    });
  };

  const requestAccess = (moduleName) => {
    setCurrentModule(moduleName);
    setShowPasscodeModal(true);
  };

  // Clear session unlocks on logout
  useEffect(() => {
    const resetUnlocks = () => {
      clearSessionUnlock();
      setLockedModules({ ...DEFAULT_LOCKED });
      setTempUnlocked({});
    };
    const onStorage = (e) => {
      if (e.key === "token" && !e.newValue) resetUnlocks();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:loggedOut", resetUnlocks);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:loggedOut", resetUnlocks);
    };
  }, []);

  // Passcode Setup Modal (First time)
  const SetupPasscodeModal = () => {
    const [passcode, setPasscodeLocal] = useState("");
    const [confirmPasscode, setConfirmPasscode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!showSetupModal) return null;

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (passcode !== confirmPasscode) {
        toast.error("Passcodes do not match!");
        return;
      }
      if (passcode.length < 4) {
        toast.error("Passcode must be at least 4 characters");
        return;
      }
      if (passcode.length > 10) {
        toast.error("Passcode must be at most 10 characters");
        return;
      }
      setIsLoading(true);
      try {
        const ok = await setPasscode(passcode);
        if (ok) {
          setPasscodeLocal("");
          setConfirmPasscode("");
        }
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Key className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Set Security Passcode
            </h3>
          </div>

          <p className="text-sm text-slate-600 mb-4">
            Please set a security passcode to protect confidential modules.
            You'll need this passcode to access payroll, expenses, and other
            sensitive information. If you forget it, you can reset it using a
            verification code sent to your registered email.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Security Passcode (4-10 characters)
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscodeLocal(e.target.value)}
                placeholder="Enter passcode"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Passcode
              </label>
              <input
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                placeholder="Confirm passcode"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Setting Passcode..." : "Set Passcode & Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Passcode Verify Modal
  const PasscodeModal = () => {
    const [passcode, setPasscodeLocal] = useState("");
    const [unlockPermanent, setUnlockPermanent] = useState(true);

    if (!showPasscodeModal) return null;

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (currentModule) {
        const success = await unlockModule(
          currentModule,
          passcode,
          unlockPermanent,
        );
        if (success) {
          setPasscodeLocal("");
          setUnlockPermanent(true);
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Confidential Module Access
              </h3>
            </div>
            <button
              onClick={() => {
                setShowPasscodeModal(false);
                setPasscodeLocal("");
              }}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-slate-600 mb-4">
            This module contains confidential information. Please enter your
            security passcode to continue.
          </p>

          {failedAttempts > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                ⚠️ {failedAttempts} failed attempt(s). After 5 attempts, account
                will be locked for 15 minutes.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Security Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscodeLocal(e.target.value)}
                placeholder="Enter passcode"
                autoFocus
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={unlockPermanent}
                onChange={(e) => setUnlockPermanent(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">
                Keep unlocked for this session (all confidential modules)
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasscodeModal(false);
                  setPasscodeLocal("");
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Unlock
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => {
              setShowPasscodeModal(false);
              setShowResetModal(true);
            }}
            className="mt-3 w-full text-xs text-slate-500 hover:text-blue-600"
          >
            Forgot passcode? Reset with email code
          </button>
        </div>
      </div>
    );
  };

  // Reset Passcode Modal
  const ResetPasscodeModal = () => {
    const [otpRequested, setOtpRequested] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPasscode, setNewPasscode] = useState("");
    const [confirmPasscode, setConfirmPasscode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!showResetModal) return null;

    const handleRequestCode = async () => {
      setIsLoading(true);
      try {
        const result = await requestPasscodeResetOtp();
        if (result) {
          setMaskedEmail(result.email);
          setOtpRequested(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!otpRequested) {
        await handleRequestCode();
        return;
      }
      if (newPasscode !== confirmPasscode) {
        toast.error("Passcodes do not match!");
        return;
      }
      if (newPasscode.length < 4 || newPasscode.length > 10) {
        toast.error("Passcode must be 4-10 characters");
        return;
      }
      if (!/^\d{6}$/.test(otp)) {
        toast.error("Enter the 6-digit email verification code");
        return;
      }
      setIsLoading(true);
      try {
        await resetPasscode(otp, newPasscode);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Mail className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Reset Passcode</h3>
          </div>

          {!otpRequested ? (
            <div>
              <p className="text-sm text-slate-600 mb-5">
                We’ll send a one-time verification code to the email address
                registered to your account.
              </p>
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50"
              >
                {isLoading ? "Sending code..." : "Send email verification code"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-sm text-slate-600 mb-4">
                Enter the 6-digit code sent to <strong>{maskedEmail}</strong>.
                The code expires in 10 minutes.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Passcode
                </label>
                <input
                  type="password"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm New Passcode
                </label>
                <input
                  type="password"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-amber-300 rounded-xl text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                >
                  Resend code
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50"
                >
                  {isLoading ? "Resetting..." : "Reset Passcode"}
                </button>
              </div>
            </form>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowResetModal(false);
                setShowPasscodeModal(true);
                setOtpRequested(false);
                setMaskedEmail("");
                setOtp("");
                setNewPasscode("");
                setConfirmPasscode("");
              }}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PasscodeContext.Provider
      value={{
        lockedModules,
        tempUnlocked,
        isModuleUnlocked,
        unlockModule,
        lockModule,
        requestAccess,
        hasPasscode,
        setShowResetModal,
      }}
    >
      {children}
      <SetupPasscodeModal />
      <PasscodeModal />
      <ResetPasscodeModal />
    </PasscodeContext.Provider>
  );
};
