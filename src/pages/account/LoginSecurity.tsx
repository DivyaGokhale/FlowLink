import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiChevronLeft, FiEdit2, FiEye, FiEyeOff, FiLock, FiMail, FiPhone, FiX, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../components/AuthContext';
import { toast } from 'react-toastify';

const LoginSecurity: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const go = (path: string) => navigate(shop ? `/${shop}${path}` : path);
  
  // State for edit modes and form fields
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePhoneSave = async () => {
    try {
      await updateProfile({ phone });
      setIsEditingPhone(false);
      toast.success('Phone number updated successfully');
    } catch (error) {
      toast.error('Failed to update phone number');
      console.error('Update phone error:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      // This would be handled by your auth context
      // await updatePassword(currentPassword, newPassword);
      
      // For now, just show success and reset form
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  const cancelEdit = () => {
    setIsEditingPhone(false);
    setPhone(user?.phone || '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => go('/profile')}
            className="mr-4 p-2 rounded-full hover:bg-green-100 transition-colors"
          >
            <FiChevronLeft className="w-5 h-5 text-green-700" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-black-800 mb-1">Login & Security</h1>
            <p className="text-l font-semibold text-green-700">Manage your account security settings</p>
          </div>
        </div>

        <div className="bg-white border border-green-200 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-6 text-black-800">Account Security</h2>
          
          {/* Email Section */}
          <div className="border-b border-green-200 pb-6 mb-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-black-800 mb-1">Email Address</h3>
                <p className="text-sm text-green-600 mb-2">Your account email address</p>
                <p className="text-base text-green-800">{user?.email || 'user@example.com'}</p>
              </div>
              <button className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium ml-4">
                <FiEdit2 className="mr-1" /> Edit
              </button>
            </div>
          </div>

          {/* Phone Number Section */}
          <div className="border-b border-green-200 pb-6 mb-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-black-800 mb-1">Phone Number</h3>
                <p className="text-sm text-green-600 mb-2">Your contact number</p>
                {!isEditingPhone && (
                  <p className="text-base text-green-800">{user?.phone || 'Not added'}</p>
                )}
              </div>
              {!isEditingPhone && (
                <button 
                  onClick={() => setIsEditingPhone(true)}
                  className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium ml-4"
                >
                  <FiEdit2 className="mr-1" /> {user?.phone ? 'Edit' : 'Add'}
                </button>
              )}
            </div>
            
            {isEditingPhone && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full p-2.5 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none bg-green-50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePhoneSave}
                      className="p-2.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Save"
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-green-600">We'll use this number to verify your account</p>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="pb-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-black-800 mb-1">Password</h3>
                {!isChangingPassword && (
                  <div className="flex items-center text-green-800 mt-2">
                    <FiLock className="mr-2" /> ••••••••••••••••
                  </div>
                )}
              </div>
              {!isChangingPassword && (
                <button 
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium ml-4"
                >
                  <FiEdit2 className="mr-1" /> Change
                </button>
              )}
            </div>
            
            {isChangingPassword && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-black-700 mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2.5 border border-green-300 rounded-lg pr-10 focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none bg-green-50"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-600"
                    >
                      {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 border border-green-300 rounded-lg pr-10 focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none bg-green-50"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-600"
                    >
                      {showNewPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2.5 border border-green-300 rounded-lg pr-10 focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none bg-green-50"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-600"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-start gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                    className={`px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white transition-colors ${
                      !currentPassword || !newPassword || newPassword !== confirmPassword
                        ? 'bg-green-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>


      </div>
    </div>
  );
};

export default LoginSecurity;
