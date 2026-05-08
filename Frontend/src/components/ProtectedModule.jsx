// components/ProtectedModule.jsx
import React from 'react';
import { usePasscode } from '../context/PasscodeContext';
import { Lock, Key, Shield } from 'lucide-react';

const ProtectedModule = ({ 
  moduleName, 
  children, 
  title, 
  description 
}) => {
  const { isModuleUnlocked, requestAccess, lockModule } = usePasscode();
  const isUnlocked = isModuleUnlocked(moduleName);
  
  // Debug log to check if provider is working
  console.log('ProtectedModule - Module:', moduleName, 'Unlocked:', isUnlocked);
  
  if (!isUnlocked) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            🔒 {title || `${moduleName} Module Locked`}
          </h3>
          <p className="text-slate-600 mb-6">
            {description || `This module contains confidential information. 
            Please enter your security passcode to access it.`}
          </p>
          <button
            onClick={() => requestAccess(moduleName)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Key className="h-5 w-5" />
            Enter Passcode to Unlock
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            Module unlocked • Confidential information visible
          </span>
        </div>
        <button
          onClick={() => lockModule(moduleName)}
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <Lock className="h-3 w-3" />
          Lock Module
        </button>
      </div>
      {children}
    </>
  );
};

export default ProtectedModule;