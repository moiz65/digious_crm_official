import React, { useState, useEffect } from "react";
import {
  User, Mail, Phone, MapPin, Briefcase, Building, Calendar,
  Heart, Shield, Lock, Settings, Download, Edit, X, Upload, Camera,
  Globe, CheckCircle, FileText, Eye, Share2, Printer, Clock, CreditCard,
  BarChart3, Target, Zap, AlertCircle, Pencil, Save, TrendingUp, Award,
  Linkedin, Github, ExternalLink, DollarSign, BriefcaseIcon, Users,
  ChevronRight, Plus, Trash2, GraduationCap, Star, Calendar as CalendarIcon
} from "lucide-react";

import config from '../config/api';

const EmployeePersonalProfileV2 = ({ employeeId, onBack }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Configuration - use centralized config
  const API_BASE_URL = config.FULL_API_URL;

  // Fetch employee profile from database views
  const fetchEmployeeProfile = async (empId) => {
    try {
      setLoading(true);
      setError(null);

      // In production, make these API calls to your backend
      // For now, using sample data structure that matches database output
      
      // Query 1: Get profile summary (joins employees + profiles + departments)
      // GET /api/employees/{empId}/profile-summary
      
      // Query 2: Get financial summary (bank accounts + allowances masked)
      // GET /api/employees/{empId}/financial-summary
      
      // Query 3: Get attendance summary (90-day stats)
      // GET /api/employees/{empId}/attendance-summary
      
      // Query 4: Get performance summary (reviews + goals)
      // GET /api/employees/{empId}/performance-summary

      // Simulated API call - replace with actual axios/fetch calls
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: sampleEmployee, // Replace with API response
          });
        }, 500);
      });

      setEmployee(response.data);
    } catch (err) {
      console.error("Error fetching employee profile:", err);
      setError("Failed to load employee profile");
    } finally {
      setLoading(false);
    }
  };

  // Save employee profile changes
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        bio: employee.profile?.bio || null,
        emergency_contact_name: employee.personalDetails?.emergencyContactName || null,
        emergency_contact_phone: employee.personalDetails?.emergencyContactPhone || null,
        emergency_contact_relation: employee.personalDetails?.emergencyContactRelation || null,
        preferred_contact_method: employee.profile?.preferredContactMethod || null,
        linkedin_url: employee.personalDetails?.linkedin || null,
        github_url: employee.personalDetails?.github || null,
        portfolio_url: employee.personalDetails?.portfolio || null,
      };

      // Attempt real API call
      const res = await fetch(`${API_BASE_URL}/employees/${employee.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save profile");
      }

      // Refresh data after save
      await fetchEmployeeProfile(employee.id);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }; 

  // Small helper to update nested employee fields while editing
  const updateEmployeeField = (path, value) => {
    setEmployee(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      const keys = path.split('.');
      let cur = next;
      keys.forEach((k, i) => {
        if (i === keys.length - 1) cur[k] = value;
        else {
          if (!cur[k]) cur[k] = {};
          cur = cur[k];
        }
      });
      return next;
    });
  };

  // Sample data matching database structure
  const sampleEmployee = {
    id: employeeId || 1,
    basicInfo: {
      name: "Muhammad Hunain",
      employeeId: "EMP-0001",
      email: "muhammad.hunain@digious.com",
      phone: "+92 300 1234567",
      personalPhone: "+92 321 9876543",
      dateOfBirth: "1990-05-15",
      age: 35,
      gender: "Male",
      maritalStatus: "Single",
      nationality: "Pakistani",
      bloodGroup: "O+",
      profileImage: null,
    },
    professionalInfo: {
      role: "Senior Full-Stack Developer",
      department: "Engineering",
      reportingTo: "Fahad Ahmed (CTO)",
      employeeType: "Full-time",
      employmentStatus: "Active",
      joiningDate: "2023-01-15",
      workExperience: "12 years",
      salaryGrade: "G7",
      employeeLevel: "Senior",
      officeLocation: "Karachi Headquarters",
      workSchedule: "9:00 PM - 6:00 AM",
      workMode: "Hybrid",
    },
    personalDetails: {
      address: "House #123, Street 5, DHA Phase 5, Karachi",
      emergencyContactName: "Muhammad Ali",
      emergencyContactPhone: "+92 300 9876543",
      emergencyContactRelation: "Brother",
      linkedin: "linkedin.com/in/muhammdhunain",
      github: "github.com/mhunain",
      portfolio: "https://hunain.dev",
    },
    profile: {
      preferredContactMethod: "Email"
    },
    bankInfo: {
      accountNumber: "PKRIBAN123456",
      bankName: "HBL",
      accountTitle: "Muhammad Hunain",
      accountType: "Savings",
      routingNumber: "0063",
      branchCode: "KHI001",
    },
    financialInfo: {
      totalAllowances: 18000,
      allowancesList: [
        { name: "Housing Allowance", amount: 8000, currency: "PKR" },
        { name: "Transport Allowance", amount: 5000, currency: "PKR" },
        { name: "Medical Allowance", amount: 5000, currency: "PKR" },
      ],
      salaryGrade: "G7",
    },
    attendanceStats: {
      presentDays: 45,
      absentDays: 2,
      lateDays: 3,
      attendancePercentage: 93.75,
      overtimeHours: 125.5,
      lastAttendanceDate: "2026-01-30",
      lastPresentDate: "2026-01-30",
    },
    performanceInfo: {
      currentRating: 4.7,
      lastReviewDate: "2025-12-15",
      nextReviewDate: "2026-06-15",
      reviewStatus: "Scheduled",
      daysUntilReview: 137,
      completedGoals: 8,
      inProgressGoals: 5,
      totalGoals: 13,
      avgGoalProgress: 72,
    },
    leaveBalance: {
      annual: 20,
      taken: 12,
      remaining: 8,
      sick: 10,
      maternity: 0,
      paternity: 0,
    },
    healthInfo: {
      bloodGroup: "O+",
      allergies: ["Penicillin"],
      medicalConditions: "None",
    },
    skills: {
      technical: ["React", "Node.js", "MongoDB", "AWS", "Docker", "GraphQL"],
      soft: ["Leadership", "Communication", "Problem Solving", "Team Management"],
    },
    workHistory: [
      {
        id: 1,
        company: "Digious",
        position: "Senior Full-Stack Developer",
        period: "Jan 2023 - Present",
        duration: "3 years",
        description: "Leading development of CRM platform",
      },
      {
        id: 2,
        company: "TechCorp Pakistan",
        position: "Senior Developer",
        period: "2020 - 2023",
        duration: "3 years",
        description: "Managed team of 5 developers",
      },
    ],
    certifications: [
      {
        id: 1,
        name: "AWS Solutions Architect",
        issuer: "Amazon Web Services",
        issueDate: "2024-06-15",
        expiryDate: "2027-06-15",
        credentialId: "AWS-12345",
      },
      {
        id: 2,
        name: "MongoDB Certified Developer",
        issuer: "MongoDB University",
        issueDate: "2023-12-20",
        expiryDate: null,
        credentialId: "MONGO-67890",
      },
    ],
  };

  useEffect(() => {
    // Fetch actual employee data from database via API
    fetchEmployeeProfile(employeeId || 1);
  }, [employeeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
            )}
            <button
              onClick={() => fetchEmployeeProfile(employeeId || 1)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Found</h3>
          <p className="text-gray-600 mb-6">Employee profile not found.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      {/* Header with hero section */}
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span className="font-medium">Back to Employees</span>
          </button>
        )}

        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32"></div>
          
          <div className="px-8 pb-8 relative">
            {/* Avatar positioned on top of gradient */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 -mt-20 relative z-10">
              <div className="flex items-end gap-6">
                {/* Profile Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
                    {employee?.basicInfo?.profileImage ? (
                      <img src={employee?.basicInfo?.profileImage} alt={employee?.basicInfo?.name || 'Profile'} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-4xl font-bold text-blue-900">
                        {(employee?.basicInfo?.name || 'U').split(" ").map(n => n[0]).join("")}
                      </span>
                    )}
                  </div>
                  <button aria-label="Change profile photo" className="absolute bottom-0 right-0 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-all">
                    <Camera className="h-5 w-5" />
                  </button>
                </div>

                {/* Name and title */}
                <div className="flex-1 pb-2">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{employee?.basicInfo?.name || 'Unnamed'}</h1>
                  <p className="text-xl text-gray-600 font-medium mb-3">{employee?.professionalInfo?.role || '—'}</p>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-green-100 text-green-800 text-sm font-semibold rounded-full border border-green-200">
                      {employee?.professionalInfo?.employmentStatus || 'Unknown'}
                    </span>
                    <span className="px-4 py-1.5 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full border border-blue-200">
                      {employee?.professionalInfo?.employeeType || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {!isEditing ? (
                  <>
                    <button className="p-3 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all" aria-label="Print">
                      <Printer className="h-5 w-5 text-gray-600" />
                    </button>
                    <button className="p-3 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all" aria-label="Share">
                      <Share2 className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-semibold flex items-center gap-2 transition-all"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2 transition-all shadow-md">
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium">
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<BarChart3 className="h-6 w-6" />}
            label="Performance Rating"
            value={employee?.performanceInfo?.currentRating || '—'}
            subtitle="/5.0"
            color="blue"
          />
          <MetricCard
            icon={<Target className="h-6 w-6" />}
            label="Goals Progress"
            value={`${employee?.performanceInfo?.avgGoalProgress ?? 0}%`}
            subtitle={`${employee?.performanceInfo?.inProgressGoals ?? 0} in progress`}
            color="purple"
          />
          <MetricCard
            icon={<Clock className="h-6 w-6" />}
            label="Attendance"
            value={`${employee?.attendanceStats?.attendancePercentage ?? 0}%`}
            subtitle={`${employee?.attendanceStats?.presentDays ?? 0} days`}
            color="green"
          />
          <MetricCard
            icon={<DollarSign className="h-6 w-6" />}
            label="Total Allowances"
            value={`${employee?.financialInfo?.totalAllowances ?? 0}`}
            subtitle="PKR per month"
            color="amber"
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <CardSection title="Contact Information" icon={<Mail className="h-5 w-5" />}>
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Work Email" value={employee?.basicInfo?.email || '—'} copyable />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Work Phone" value={employee?.basicInfo?.phone || '—'} copyable />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Personal Phone" value={employee?.basicInfo?.personalPhone || '—'} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={employee?.personalDetails?.address || '—'} />

              {/* Preferred Contact Method */}
              {!isEditing ? (
                <InfoRow label="Preferred Contact" value={employee.profile?.preferredContactMethod || 'Email'} />
              ) : (
                <div className="pt-3">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preferred Contact</label>
                  <select
                    value={employee.profile?.preferredContactMethod || 'Email'}
                    onChange={(e) => updateEmployeeField('profile.preferredContactMethod', e.target.value)}
                    className="mt-2 block w-full rounded-md border-gray-200 py-2 px-3 bg-white text-sm"
                  >
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
              )}
            </CardSection>

            {/* Bank Account */}
            <CardSection title="Bank Account" icon={<CreditCard className="h-5 w-5" />}>
              <InfoRow label="Bank Name" value={employee?.bankInfo?.bankName || '—'} />
              <InfoRow label="Account" value={`****${(employee?.bankInfo?.accountNumber || '').slice(-4) || '****'}`} copyable subtitle="Masked for security" />
              <InfoRow label="Account Type" value={employee?.bankInfo?.accountType || '—'} />
              <InfoRow label="Account Title" value={employee?.bankInfo?.accountTitle || '—'} />
            </CardSection>

            {/* Emergency Contact */}
            <CardSection title="Emergency Contact" icon={<Heart className="h-5 w-5" />}>
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                    <input
                      type="text"
                      value={employee?.personalDetails?.emergencyContactName || ''}
                      onChange={(e) => updateEmployeeField('personalDetails.emergencyContactName', e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-200 py-2 px-3 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Relation</label>
                    <input
                      type="text"
                      value={employee?.personalDetails?.emergencyContactRelation || ''}
                      onChange={(e) => updateEmployeeField('personalDetails.emergencyContactRelation', e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-200 py-2 px-3 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                    <input
                      type="text"
                      value={employee?.personalDetails?.emergencyContactPhone || ''}
                      onChange={(e) => updateEmployeeField('personalDetails.emergencyContactPhone', e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-200 py-2 px-3 bg-white text-sm"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <InfoRow label="Name" value={employee?.personalDetails?.emergencyContactName || '—'} />
                  <InfoRow label="Relation" value={employee?.personalDetails?.emergencyContactRelation || '—'} />
                  <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={employee?.personalDetails?.emergencyContactPhone || '—'} copyable />
                </>
              )}
            </CardSection>

            {/* Social Links */}
            <CardSection title="Social Links" icon={<Globe className="h-5 w-5" />}>
              <div className="space-y-3">
                {employee?.personalDetails?.linkedin && (
                  <SocialLink icon={<Linkedin className="h-5 w-5" />} label="LinkedIn" url={employee?.personalDetails?.linkedin} />
                )}
                {employee?.personalDetails?.github && (
                  <SocialLink icon={<Github className="h-5 w-5" />} label="GitHub" url={employee?.personalDetails?.github} />
                )}
                {employee?.personalDetails?.portfolio && (
                  <SocialLink icon={<Globe className="h-5 w-5" />} label="Portfolio" url={employee?.personalDetails?.portfolio} />
                )}
              </div>
            </CardSection>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Professional Information */}
            <CardSection title="Professional Information" icon={<Briefcase className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Employee ID" value={employee.basicInfo.employeeId} />
                <InfoRow label="Department" value={employee.professionalInfo.department} />
                <InfoRow label="Reporting To" value={employee.professionalInfo.reportingTo} />
                <InfoRow label="Joining Date" value={employee.professionalInfo.joiningDate } />
                <InfoRow label="Work Experience" value={employee.professionalInfo.workExperience} />
                <InfoRow label="Employee Level" value={employee.professionalInfo.employeeLevel} />
                <InfoRow label="Office Location" value={employee.professionalInfo.officeLocation} />
                <InfoRow label="Work Schedule" value={employee.professionalInfo.workSchedule} />
                <InfoRow label="Work Mode" value={employee.professionalInfo.workMode} />
              </div>
            </CardSection>

            {/* Performance & Goals */}
            <CardSection title="Performance & Review" icon={<TrendingUp className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <InfoRow label="Current Rating" value={`${employee.performanceInfo.currentRating}/5.0`} />
                <InfoRow label="Last Review" value={employee.performanceInfo.lastReviewDate} />
                <InfoRow label="Next Review" value={employee.performanceInfo.nextReviewDate} />
                <InfoRow label="Review Status" value={employee.performanceInfo.reviewStatus} />
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Goals Progress
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Progress</span>
                    <span className="font-semibold text-blue-600">{employee.performanceInfo.inProgressGoals}/{employee.performanceInfo.totalGoals}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${employee.performanceInfo.avgGoalProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-500">{employee.performanceInfo.avgGoalProgress}% average progress</p>
                </div>
              </div>
            </CardSection>

            {/* Attendance & Leave */}
            <CardSection title="Attendance & Leave" icon={<Calendar className="h-5 w-5" />}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <StatBox label="Present Days" value={employee.attendanceStats.presentDays} color="green" />
                <StatBox label="Absent Days" value={employee.attendanceStats.absentDays} color="red" />
                <StatBox label="Late Days" value={employee.attendanceStats.lateDays} color="amber" />
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Leave Balance</h4>
                <div className="space-y-2">
                  <LeaveBar label="Annual Leave" used={employee.leaveBalance.taken} total={employee.leaveBalance.annual} color="blue" />
                  <LeaveBar label="Sick Leave" used={0} total={employee.leaveBalance.sick} color="orange" />
                </div>
              </div>
            </CardSection>

            {/* Skills & Expertise */}
            <CardSection title="Skills & Expertise" icon={<Zap className="h-5 w-5" />}>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Technical Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {employee.skills.technical.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Soft Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {employee.skills.soft.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardSection>

            {/* Allowances */}
            <CardSection title="Allowances & Benefits" icon={<DollarSign className="h-5 w-5" />}>
              <div className="space-y-3">
                {employee.financialInfo.allowancesList.map((allowance, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-900">{allowance.name}</span>
                    <span className="text-blue-600 font-semibold">{allowance.amount} {allowance.currency}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200 font-semibold">
                  <span>Total Monthly Allowances</span>
                  <span className="text-blue-600">{employee.financialInfo.totalAllowances} PKR</span>
                </div>
              </div>
            </CardSection>
          </div>
        </div>

        {/* Work History & Certifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Work History */}
          <CardSection title="Work History" icon={<BriefcaseIcon className="h-5 w-5" />}>
            <div className="space-y-4">
              {employee.workHistory.map((job, i) => (
                <div key={i} className="pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{job.position}</h4>
                    <span className="text-sm text-gray-500">{job.duration}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{job.company}</p>
                  <p className="text-xs text-gray-500">{job.period}</p>
                  <p className="text-sm text-gray-700 mt-2">{job.description}</p>
                </div>
              ))}
            </div>
          </CardSection>

          {/* Certifications */}
          <CardSection title="Certifications" icon={<Award className="h-5 w-5" />}>
            <div className="space-y-4">
              {employee.certifications.map((cert, i) => (
                <div key={i} className="pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm">{cert.name}</h4>
                      <p className="text-xs text-gray-600">{cert.issuer}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Issued: {cert.issueDate}
                        {cert.expiryDate && ` • Expires: ${cert.expiryDate}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardSection>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const CardSection = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className="text-blue-600">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const InfoRow = ({ icon, label, value, copyable, subtitle }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-100 last:border-b-0">
    <div className="flex items-start gap-3 flex-1">
      {icon && <div className="text-gray-400 mt-0.5">{icon}</div>}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
    {copyable && (
      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600">
        <FileText className="h-4 w-4" />
      </button>
    )}
  </div>
);

const MetricCard = ({ icon, label, value, subtitle, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    green: "bg-green-50 border-green-200 text-green-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
  };

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-white rounded-lg">{icon}</div>
      </div>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs opacity-60 mt-1">{subtitle}</p>
    </div>
  );
};

const SocialLink = ({ icon, label, url }) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all group">
    <div className="flex items-center gap-3">
      <div className="text-gray-400 group-hover:text-blue-600 transition-colors">{icon}</div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </div>
    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
  </a>
);

const StatBox = ({ label, value, color }) => {
  const colorClasses = {
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className={`rounded-lg border p-3 text-center ${colorClasses[color]}`}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

const LeaveBar = ({ label, used, total, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="font-medium text-gray-900">{label}</span>
      <span className="text-gray-600">{used}/{total}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full bg-${color}-500`}
        style={{ width: `${(used / total) * 100}%` }}
      ></div>
    </div>
  </div>
);

export default EmployeePersonalProfileV2;
