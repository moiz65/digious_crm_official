// EmployeeSettings.jsx
import React, { useState } from 'react';

const EmployeeSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    // Profile Information
    name: 'John Smith',
    email: 'john.smith@acmecorp.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    position: 'Senior Developer',
    employeeId: 'EMP-2024-001',
    joinDate: '2024-01-15',
    location: 'San Francisco, CA',
    timezone: 'PST (UTC-8)',
    
    // Profile Image
    profileImage: null,
    
    // (notifications and privacy removed)
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleInputChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  const handlePasswordChange = (field, value) => {
    setPasswords({ ...passwords, [field]: value });
    
    if (field === 'new') {
      // Simple password strength calculation
      let strength = 0;
      if (value.length >= 8) strength += 1;
      if (value.match(/[A-Z]/)) strength += 1;
      if (value.match(/[0-9]/)) strength += 1;
      if (value.match(/[^A-Za-z0-9]/)) strength += 1;
      setPasswordStrength(strength);
    }

  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    alert('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (!passwords.current) {
      alert('Please enter your current password');
      return;
    }
    if (passwords.new.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match');
      return;
    }
    alert('Password changed successfully!');
    setPasswords({ current: '', new: '', confirm: '' });
    setPasswordStrength(0);
  };

  const handleLogout = () => {
    alert('Logging out...');
    // Add actual logout logic here
  };

  const handleDeleteAccount = () => {
    alert('Account deletion request submitted. You will receive a confirmation email.');
    setShowDeleteConfirm(false);
  };

  return (
    <div className="max-w-7xl p-6">
      
      {/* Settings Navigation with Icons */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Security & Access
          </button>
          {/* Notifications and Privacy tabs removed */}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
            <h2 className="text-xl font-semibold text-white">Personal Information</h2>
            <p className="text-blue-100 text-sm mt-1">Update your personal details and contact information</p>
          </div>

          <div className="p-8">
            <div className="flex items-start space-x-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-500">
                      {settings.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div className="mt-4 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-upload"
                  />
                  <label
                    htmlFor="profile-upload"
                    className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Change Photo
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF (max 2MB)</p>
              </div> 

              {/* Profile Form */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      readOnly={!isEditing}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      readOnly={!isEditing}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      readOnly={!isEditing}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={settings.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      readOnly={!isEditing}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                      {settings.department}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                      {settings.position}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!isEditing}
                    >
                      <option>PST (UTC-8)</option>
                      <option>EST (UTC-5)</option>
                      <option>GMT (UTC+0)</option>
                      <option>CET (UTC+1)</option>
                      <option>IST (UTC+5:30)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-4 pt-4">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Employee Details Card */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Employment Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{settings.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {new Date(settings.joinDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>  
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
              <h2 className="text-xl font-semibold text-white">Change Password</h2>
              <p className="text-blue-100 text-sm mt-1">Update your password regularly to keep your account secure</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="max-w-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => handlePasswordChange('current', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-24"
                        placeholder="Enter current password"
                      />
                      <button
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-3 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showPasswords.current ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => handlePasswordChange('new', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-24"
                        placeholder="Enter new password"
                      />
                      <button
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-3 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showPasswords.new ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    
                    {/* Password Strength Meter */}
                    {passwords.new && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-2 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength
                                  ? level === 1
                                    ? 'bg-red-500'
                                    : level === 2
                                    ? 'bg-yellow-500'
                                    : level === 3
                                    ? 'bg-blue-500'
                                    : 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {passwordStrength === 0 && 'Very weak'}
                          {passwordStrength === 1 && 'Weak'}
                          {passwordStrength === 2 && 'Fair'}
                          {passwordStrength === 3 && 'Good'}
                          {passwordStrength === 4 && 'Strong'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-24"
                        placeholder="Confirm new password"
                      />
                      <button
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-3 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showPasswords.confirm ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passwords.confirm && passwords.new !== passwords.confirm && (
                      <p className="text-xs text-red-500 mt-2">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication Card */}
          {/* <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                  Recommended
                </span>
              </div>
            </div>
            <div className="p-8">
              <button className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Enable Two-Factor Authentication
              </button>
            </div>
          </div> */}

          {/* Session Management Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Active Sessions</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your active login sessions</p>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">MacBook Pro - Chrome</p>
                      <p className="text-sm text-gray-500">San Francisco, CA • Current session</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    Active Now
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">iPhone 14 - Safari</p>
                      <p className="text-sm text-gray-500">San Francisco, CA • 2 hours ago</p>
                    </div>
                  </div>
                  <button className="text-sm text-red-600 hover:text-red-800">
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Logout & Delete Account */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Account Actions</h3>
                  <p className="text-sm text-gray-600 mt-1">Logout or delete your account</p>
                </div>
              </div>
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications section removed */}

      {/* Privacy section removed */}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Account</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSettings;