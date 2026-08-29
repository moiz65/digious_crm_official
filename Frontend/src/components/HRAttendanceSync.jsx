// HRDashboard.jsx - HR Only Sync Button
import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Loader, Clock, AlertCircle } from 'lucide-react';
import { toast } from "react-hot-toast";

const HRAttendanceSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [lastSyncInfo, setLastSyncInfo] = useState(null);

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userInfo.employeeId || userInfo.id || userInfo.userId;

  // Check for ongoing sync on load
  useEffect(() => {
    checkOngoingSync();
  }, []);

  const checkOngoingSync = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.118.172.21:5000'}/api/v1/zkTime/sync-jobs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const ongoing = data.data.find(job => job.status === 'processing' || job.status === 'pending');
        if (ongoing) {
          setCurrentJobId(ongoing.job_id);
          setIsSyncing(true);
          startPolling(ongoing.job_id);
        }
      }
    } catch (error) {
      console.error('Failed to check ongoing sync:', error);
    }
  };

  const handleSyncAll = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      setSyncProgress(0);
      setSyncLogs([]);
      
      // ✅ Get user ID from localStorage
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userInfo.employeeId || userInfo.id || userInfo.userId;
      
      console.log("📤 Sending sync request with HR User ID:", userId);
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const firstDayOfMonth = `${year}-${month}-01`;
      const lastDayOfMonth = new Date(year, now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.118.172.21:5000'}/api/v1/zkTime/sync-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          date_from: firstDayOfMonth,
          date_to: lastDayOfMonth,
          initiated_by: userId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentJobId(data.job_id);
        toast.success('Sync job initiated successfully!');
        startPolling(data.job_id);
      } else {
        toast.error(data.message || 'Failed to start sync');
        setIsSyncing(false);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to initiate sync');
      setIsSyncing(false);
    }
  };

  const startPolling = (jobId) => {
    let interval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://100.118.172.21:5000'}/api/v1/zkTime/sync-status/${jobId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        
        if (data.success) {
          const status = data.data;
          setSyncStatus(status);
          setSyncProgress(status.progress_percentage || 0);
          
          if (status.logs && status.logs.length > 0) {
            setSyncLogs(status.logs);
          }
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
            setIsSyncing(false);
            
            if (status.status === 'completed') {
              toast.success(`✅ Sync completed! ${status.synced_records} records synced`);
              setLastSyncInfo({
                date: new Date().toLocaleString(),
                synced: status.synced_records,
                failed: status.failed_records,
              });
            } else {
              toast.error(`❌ Sync failed: ${status.error_message || 'Unknown error'}`);
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'processing': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return <Loader className="w-5 h-5 animate-spin" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-500" />
            Attendance Sync
          </h3>
          <p className="text-sm text-gray-500">
            Sync all employee's attendance from ZKTeco device
          </p>
          <p className="text-xs text-gray-400 mt-1">
            HR ID: {userId || 'Not found'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastSyncInfo && (
            <div className="text-xs text-gray-400 text-right">
              <div>Last sync: {lastSyncInfo.date}</div>
              <div>Synced: {lastSyncInfo.synced} • Failed: {lastSyncInfo.failed}</div>
            </div>
          )}
          
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300
              ${isSyncing 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25'}
            `}
          >
            {isSyncing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Sync All Employees
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Progress Section */}
      {isSyncing && syncStatus && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {getStatusIcon(syncStatus.status)}
              <span className={getStatusColor(syncStatus.status)}>
                {syncStatus.status.charAt(0).toUpperCase() + syncStatus.status.slice(1)}
              </span>
              <span className="text-gray-400">•</span>
              <span>{syncStatus.processed_employees || 0} / {syncStatus.total_employees || 0} employees</span>
            </div>
            <span className="text-sm font-semibold text-indigo-600">
              {syncProgress}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {syncStatus.synced_records || 0}
              </div>
              <div className="text-xs text-gray-500">Synced</div>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {syncStatus.failed_records || 0}
              </div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {syncStatus.total_records || 0}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
          
          {/* Recent Logs */}
          {syncLogs.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-500 mb-2">Recent Activity</div>
              {syncLogs.slice(0, 10).map((log, index) => (
                <div key={index} className="flex items-center justify-between py-1 text-xs border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{log.employee_code || 'Unknown'}</span>
                  <span className={`px-2 py-0.5 rounded ${
                    log.status === 'inserted' ? 'bg-green-100 text-green-700' :
                    log.status === 'updated' ? 'bg-blue-100 text-blue-700' :
                    log.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-gray-400">{log.message || ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HRAttendanceSync;