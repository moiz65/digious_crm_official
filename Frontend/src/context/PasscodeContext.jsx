// contexts/PasscodeContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, Shield, Lock, Key, Film } from "lucide-react";
import { endpoints } from "../config/api";

const PasscodeContext = createContext();

export const usePasscode = () => {
  const context = useContext(PasscodeContext);
  if (!context) {
    throw new Error("usePasscode must be used within PasscodeProvider");
  }
  return context;
};

export const PasscodeProvider = ({ children }) => {
  const [lockedModules, setLockedModules] = useState({
    payroll: true,
    emp_payroll: true,
    expense: true,
    employeeSalaries: true,
    salesStats: true,
    profile: true,
    admin_customers: true,
    emp_sales: true,
  });

  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [tempUnlocked, setTempUnlocked] = useState({});
  const [hasPasscode, setHasPasscode] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Check if user has passcode on mount
  useEffect(() => {
    checkPasscodeStatus();
  }, []);

  const checkPasscodeStatus = async () => {
    try {
      const token = localStorage.getItem("token");
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
          toast.success('👑 Admin: Use "admin123" to access modules');
        } else {
          if (data.data.hasPasscode) {
            setShowSetupModal(false);
            setHasPasscode(true);
          } else {
            setShowSetupModal(true);
            setHasPasscode(false);
          }
        }
      }
    } catch (error) {
      console.error("Error checking passcode status:", error);
    }
  };

  const isModuleUnlocked = (moduleName) => {
    return !lockedModules[moduleName] || tempUnlocked[moduleName];
  };

  const unlockModule = async (moduleName, passcode, permanent = false) => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔓 Unlocking module:", moduleName);

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
      console.log("Verify response:", data);

      if (data.success) {
        if (permanent) {
          setLockedModules((prev) => ({ ...prev, [moduleName]: false }));
          toast.success(`✅ ${moduleName} module unlocked for this session!`);
        } else {
          setTempUnlocked((prev) => ({ ...prev, [moduleName]: true }));
          setTimeout(() => {
            setTempUnlocked((prev) => ({ ...prev, [moduleName]: false }));
            toast(`🔒 ${moduleName} module has been locked again.`, {
              icon: "🔒",
              duration: 3000,
            });
          }, SESSION_TIMEOUT);
          toast.success(`🔓 ${moduleName} module unlocked for 30 minutes!`);
        }
        setShowPasscodeModal(false);
        setCurrentModule(null);
        setFailedAttempts(0);
        return true;
      } else {
        if (data.remainingAttempts !== undefined) {
          setFailedAttempts(5 - data.remainingAttempts);
        }
        toast.error(`❌ ${data.message}`);
        return false;
      }
    } catch (error) {
      console.error("Error verifying passcode:", error);
      toast.error("❌ Failed to verify passcode");
      return false;
    }
  };

  const setPasscode = async (passcode, favoriteMovie) => {
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
          body: JSON.stringify({ passcode, favoriteMovie }), // No need to send employeeId
        },
      );

      const data = await response.json();

      if (data.success) {
        setHasPasscode(true);
        setShowSetupModal(false);
        toast.success("✅ Passcode set successfully!");
        await checkPasscodeStatus();
        return true;
      } else {
        toast.error(`❌ ${data.message}`);
        return false;
      }
    } catch (error) {
      console.error("Error setting passcode:", error);
      toast.error("❌ Failed to set passcode");
      return false;
    }
  };

  const resetPasscode = async (favoriteMovie, newPasscode) => {
    try {
      const token = localStorage.getItem("token");

      console.log("🔄 Resetting passcode...");
      console.log("Favorite Movie:", favoriteMovie);
      console.log("New Passcode length:", newPasscode?.length);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/passcode/reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ favoriteMovie, newPasscode }),
        },
      );

      const data = await response.json();
      console.log("Reset response:", data);

      if (data.success) {
        setShowResetModal(false);
        toast.success(
          "✅ Passcode reset successfully! Please use your new passcode.",
        );

        // Clear any temp unlocked modules
        setTempUnlocked({});

        // Reset failed attempts
        setFailedAttempts(0);

        return true;
      } else {
        toast.error(`❌ ${data.message}`);
        return false;
      }
    } catch (error) {
      console.error("Error resetting passcode:", error);
      toast.error("❌ Failed to reset passcode. Please check your connection.");
      return false;
    }
  };

  const lockModule = (moduleName) => {
    setLockedModules((prev) => ({ ...prev, [moduleName]: true }));
    setTempUnlocked((prev) => ({ ...prev, [moduleName]: false }));
    toast(`🔒 ${moduleName} module has been locked.`, {
      icon: "🔒",
      duration: 2000,
    });
  };

  const requestAccess = (moduleName) => {
    setCurrentModule(moduleName);
    setShowPasscodeModal(true);
  };

  // Passcode Setup Modal (First time)
  const SetupPasscodeModal = () => {
    const [passcode, setPasscode] = useState("");
    const [confirmPasscode, setConfirmPasscode] = useState("");
    const [favoriteMovie, setFavoriteMovie] = useState("");
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

      if (!favoriteMovie.trim()) {
        toast.error("Favorite movie is required");
        return;
      }

      setIsLoading(true);
      console.log("🔄 Calling setPasscode API...");

      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const employeeId = user.employeeId; // ✅ Get employeeId

        console.log("📤 Sending with employeeId:", employeeId);

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/v1/passcode/set`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              passcode: passcode,
              favoriteMovie: favoriteMovie.trim(),
              employeeId: employeeId, // ✅ SEND employeeId
            }),
          },
        );

        const data = await response.json();
        console.log("📡 Set Passcode Response:", data);

        if (data.success) {
          setHasPasscode(true);
          setShowSetupModal(false);
          toast.success("✅ Passcode set successfully!");
          setPasscode("");
          setConfirmPasscode("");
          setFavoriteMovie("");
          // ✅ CRITICAL: Re-check status to ensure consistency
          await checkPasscodeStatus();
        } else {
          toast.error(`❌ ${data.message}`);
        }
      } catch (error) {
        console.error("❌ Network error:", error);
        toast.error("❌ Failed to set passcode.");
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
            sensitive information.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Security Passcode (4-10 characters)
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Film className="h-4 w-4 inline mr-2" />
                Favorite Movie (for passcode recovery)
              </label>
              <input
                type="text"
                value={favoriteMovie}
                onChange={(e) => setFavoriteMovie(e.target.value)}
                placeholder="e.g., The Dark Knight, Inception, etc."
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 mt-1">
                This will be used to reset your passcode if you forget it.
              </p>
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
    const [passcode, setPasscode] = useState("");
    const [unlockPermanent, setUnlockPermanent] = useState(false);

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
          setPasscode("");
          setUnlockPermanent(false);
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
                🔒 Confidential Module Access
              </h3>
            </div>
            <button
              onClick={() => {
                setShowPasscodeModal(false);
                setPasscode("");
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
                onChange={(e) => setPasscode(e.target.value)}
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
                Keep unlocked for this session
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
              >
                Forgot Passcode?
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Unlock Module
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Passcode Reset Modal
  const ResetPasscodeModal = () => {
    const [favoriteMovie, setFavoriteMovie] = useState("");
    const [newPasscode, setNewPasscode] = useState("");
    const [confirmPasscode, setConfirmPasscode] = useState("");

    if (!showResetModal) return null;

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (newPasscode !== confirmPasscode) {
        toast.error("Passcodes do not match!");
        return;
      }

      if (newPasscode.length < 4) {
        toast.error("Passcode must be at least 4 characters");
        return;
      }

      const success = await resetPasscode(favoriteMovie, newPasscode);
      if (success) {
        setShowResetModal(false);
        setFavoriteMovie("");
        setNewPasscode("");
        setConfirmPasscode("");
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150]">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Film className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Reset Passcode</h3>
          </div>

          <p className="text-sm text-slate-600 mb-4">
            Enter your favorite movie name to reset your passcode.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Favorite Movie
              </label>
              <input
                type="text"
                value={favoriteMovie}
                onChange={(e) => setFavoriteMovie(e.target.value)}
                placeholder="Enter your favorite movie"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Passcode (4-10 characters)
              </label>
              <input
                type="password"
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                placeholder="Enter new passcode"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                required
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
                placeholder="Confirm new passcode"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700"
              >
                Reset Passcode
              </button>
            </div>
          </form>
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
      }}
    >
      {children}
      <SetupPasscodeModal />
      <PasscodeModal />
      <ResetPasscodeModal />
    </PasscodeContext.Provider>
  );
};
