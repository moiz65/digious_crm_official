import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Calendar, MapPin, Briefcase, 
  Shield, Lock, Settings, Download, Edit, X, 
  Upload, Camera, Building, Globe, CheckCircle,
  FileText, Eye, Share2, Printer, Bell, Clock,
  CreditCard, UserCheck, BarChart3, Target, Zap,
  MoreVertical, ExternalLink, Copy, RefreshCw,
  Trash2, Folder, File, BookOpen, Newspaper,
  Clipboard, CalendarDays, Watch, Thermometer,
  Wind, Cloud, Umbrella, Plus, Tag, XCircle,
  Save, AlertCircle, Pencil, PlusCircle, MinusCircle,
  Check, ChevronDown, ChevronRight, Star
} from 'lucide-react';

const EmployeePersonalProfile = ({ employeeId, onBack }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState('technical');
  const [isSaving, setIsSaving] = useState(false);
  
  // Sample employee data
  const sampleEmployee = {
    id: employeeId || 1,
    basicInfo: {
      name: "Anthony Lewis",
      employeeId: "EMP-0001",
      email: "anthony.lewis@company.com",
      phone: "+1 (555) 123-4567",
      personalPhone: "+1 (555) 987-6543",
      dateOfBirth: "1988-05-15",
      age: 36,
      gender: "Male",
      maritalStatus: "Married",
      nationality: "American",
      bloodGroup: "O+",
      profileImage: null
    },
    professionalInfo: {
      role: "HR Manager",
      department: "Human Resources",
      reportingTo: "Sarah Johnson (Director)",
      employeeType: "Full-time",
      employmentStatus: "Active",
      joiningDate: "2023-01-15",
      workExperience: "12 years",
      salaryGrade: "G7",
      employeeLevel: "Senior Manager",
      officeLocation: "New York Headquarters",
      workSchedule: "9:00 AM - 6:00 PM",
      workMode: "Hybrid (3 days office)"
    },
    personalDetails: {
      address: "123 Park Avenue, New York, NY 10022",
      permanentAddress: "456 Broadway, Boston, MA 02115",
      personalEmail: "anthony.lewis@personal.com",
      linkedin: "linkedin.com/in/anthonylewis",
      github: "github.com/anthonylewis",
      portfolio: "anthonylewis.design"
    },
    certifications: [
      {
        id: 1,
        name: "Professional in Human Resources (PHR)",
        issuer: "HR Certification Institute",
        issueDate: "2015-06-15",
        expiryDate: "2025-06-15",
        credentialId: "PHR-12345"
      },
      {
        id: 2,
        name: "SHRM Certified Professional",
        issuer: "Society for HR Management",
        issueDate: "2016-03-20",
        expiryDate: "2026-03-20",
        credentialId: "SHRM-CP-67890"
      }
    ],
    skills: {
      technical: ["HR Analytics", "Recruitment Software", "Payroll Systems", "Performance Management Tools"],
      soft: ["Leadership", "Communication", "Conflict Resolution", "Strategic Planning"],
    },
    workHistory: [
      {
        id: 1,
        company: "TechCorp Inc.",
        position: "Senior HR Specialist",
        period: "2018-2022",
        duration: "4 years",
        achievements: [
          "Reduced employee turnover by 30%",
          "Implemented new performance review system"
        ]
      },
      {
        id: 2,
        company: "Global Solutions Ltd.",
        position: "HR Generalist",
        period: "2014-2018",
        duration: "4 years",
        achievements: [
          "Managed recruitment for 200+ positions",
          "Developed training programs"
        ]
      }
    ],
    achievements: [
      {
        id: 1,
        title: "Employee of the Year",
        issuer: "Current Company",
        date: "2023-12-15",
        description: "Recognized for outstanding contributions to HR initiatives"
      },
      {
        id: 2,
        title: "Best Team Leadership Award",
        issuer: "HR Association",
        date: "2022-11-10",
        description: "Awarded for exceptional team management"
      }
    ],
    preferences: {
      communication: {
        preferredMethod: "Email",
        notificationFrequency: "Daily",
        newsletter: true,
        marketingEmails: false
      },
      privacy: {
        profileVisibility: "Company Only",
        contactVisibility: "HR Department Only",
        showBirthday: true,
        showAnniversary: true
      },
      accessibility: {
        theme: "Light",
        fontSize: "Medium",
        language: "English",
        reducedMotion: false
      }
    },
    documents: [
      {
        id: 1,
        name: "Employment Contract",
        type: "Contract",
        uploadDate: "2023-01-10",
        expiryDate: "2026-01-10",
        status: "Valid",
        size: "2.5 MB"
      },
      {
        id: 2,
        name: "ID Proof",
        type: "Identification",
        uploadDate: "2023-01-12",
        expiryDate: "2033-05-15",
        status: "Valid",
        size: "1.2 MB"
      },
      {
        id: 3,
        name: "Education Certificates",
        type: "Education",
        uploadDate: "2023-01-12",
        expiryDate: null,
        status: "Verified",
        size: "5.7 MB"
      }
    ],
    leaveBalance: {
      annual: 20,
      taken: 12,
      remaining: 8,
      sick: 10,
      maternity: 0,
      paternity: 0
    },
    performance: {
      currentRating: 4.7,
      lastReview: "2023-12-01",
      nextReview: "2024-06-01",
      achievements: 15,
      goals: 8,
      completedGoals: 6
    },
    healthInfo: {
      bloodGroup: "O+",
      allergies: ["Penicillin", "Peanuts"],
      medicalConditions: ["None"],
      emergencyInstructions: "Contact spouse first",
      insuranceProvider: "Blue Cross",
      policyNumber: "BC-123456789",
      lastCheckup: "2023-11-15",
      nextCheckup: "2024-05-15"
    },
    financialInfo: {
      bankName: "Chase Bank",
      accountNumber: "XXXX-XXXX-1234",
      routingNumber: "021000021",
      taxId: "123-45-6789",
      salaryAccount: true,
      investmentAccounts: ["401k", "Stock Portfolio"]
    }
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setEmployee(sampleEmployee);
      setLoading(false);
    }, 500);
  }, [employeeId]);

  // Skills Management Functions
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    setEmployee(prev => {
      const updatedSkills = { ...prev.skills };
      if (!updatedSkills[skillType].includes(newSkill.trim())) {
        updatedSkills[skillType] = [...updatedSkills[skillType], newSkill.trim()];
      }
      return { ...prev, skills: updatedSkills };
    });
    
    setNewSkill('');
  };

  const handleRemoveSkill = (type, skillToRemove) => {
    setEmployee(prev => {
      const updatedSkills = { ...prev.skills };
      updatedSkills[type] = updatedSkills[type].filter(skill => skill !== skillToRemove);
      return { ...prev, skills: updatedSkills };
    });
  };

  const handleSaveSkills = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Skills saved:', employee.skills);
      setEditingSkills(false);
      setIsSaving(false);
      
      // Show success message
      alert('Skills updated successfully!');
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
        
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Employee not found</h3>
          <p className="text-gray-600 mb-6">The requested employee profile could not be loaded.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  const handleSaveProfile = (updatedData) => {
    setEmployee(prev => ({ ...prev, ...updatedData }));
    setIsEditing(false);
    // In real app, send to API
  };

  const handleUploadDocument = (document) => {
    // Handle document upload
    console.log('Upload document:', document);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-blue-600 mb-3 font-medium transition-colors"
              >
                ← Back to Employees
              </button>
            )}
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Employee Personal Profile</h1>
            <p className="text-gray-600">Complete personal and professional information</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 hover:bg-blue-50 rounded-xl transition-colors border border-gray-200 hover:border-blue-300">
              <Printer className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-3 hover:bg-blue-50 rounded-xl transition-colors border border-gray-200 hover:border-blue-300">
              <Share2 className="h-5 w-5 text-gray-600" />
            </button>
            <button className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold">
              <Download className="h-4 w-4" />
              Export Profile
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 relative z-10">
        {/* Left Sidebar - Profile Summary */}
        <div className="lg:w-1/3">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl border-2 border-blue-100 shadow-xl p-8 mb-6 hover:shadow-2xl transition-all">
            <div className="text-center">
              <div className="relative w-36 h-36 mx-auto mb-5">
                <div className="w-full h-full rounded-full border-4 border-blue-200 overflow-hidden shadow-lg">
                  <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
                    {employee.basicInfo.profileImage ? (
                      <img 
                        src={employee.basicInfo.profileImage} 
                        alt={employee.basicInfo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-900 text-5xl font-extrabold">
                        {employee.basicInfo.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                </div>
                <button className="absolute bottom-1 right-1 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 shadow-lg hover:scale-110 transition-transform">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{employee.basicInfo.name}</h2>
              <p className="text-gray-600 font-medium mb-3">{employee.professionalInfo.role}</p>
              <div className="mt-3">
                <span className={`px-4 py-1.5 text-sm font-semibold rounded-full shadow-sm ${employee.professionalInfo.employmentStatus === 'Active' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-200' : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-2 border-red-200'}`}>
                  {employee.professionalInfo.employmentStatus}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:shadow-md transition-all">
                <div className="bg-blue-500 rounded-lg p-2.5">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Work Email</p>
                  <p className="font-semibold text-gray-900 truncate">{employee.basicInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all">
                <div className="bg-green-500 rounded-lg p-2.5">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Work Phone</p>
                  <p className="font-semibold text-gray-900">{employee.basicInfo.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all">
                <div className="bg-purple-500 rounded-lg p-2.5">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Employee ID</p>
                  <p className="font-semibold text-gray-900">{employee.basicInfo.employeeId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 hover:shadow-md transition-all">
                <div className="bg-orange-500 rounded-lg p-2.5">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Department</p>
                  <p className="font-semibold text-gray-900">{employee.professionalInfo.department}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <h4 className="font-bold text-gray-900 mb-5 text-lg">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-4 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-all group">
                  <p className="text-xs text-blue-700 font-semibold mb-1">Performance</p>
                  <p className="text-2xl font-extrabold text-blue-900 group-hover:scale-110 transition-transform">{employee.performance.currentRating}/5.0</p>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-xl border-2 border-green-200 hover:shadow-lg transition-all group">
                  <p className="text-xs text-green-700 font-semibold mb-1">Leave Balance</p>
                  <p className="text-2xl font-extrabold text-green-900 group-hover:scale-110 transition-transform">{employee.leaveBalance.remaining} days</p>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-violet-100 p-4 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-all group">
                  <p className="text-xs text-purple-700 font-semibold mb-1">Experience</p>
                  <p className="text-2xl font-extrabold text-purple-900 group-hover:scale-110 transition-transform">{employee.professionalInfo.workExperience}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-4 rounded-xl border-2 border-orange-200 hover:shadow-lg transition-all group">
                  <p className="text-xs text-orange-700 font-semibold mb-1">Certifications</p>
                  <p className="text-2xl font-extrabold text-orange-900 group-hover:scale-110 transition-transform">{employee.certifications.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-2/3">
          {/* Tabs */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-xl mb-6 overflow-hidden hover:shadow-2xl transition-all">
            <div className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <nav className="flex overflow-x-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all ${
                        activeTab === tab.id 
                          ? 'text-blue-600 bg-white border-b-4 border-blue-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && <OverviewTab 
                employee={employee} 
                editingSkills={editingSkills}
                setEditingSkills={setEditingSkills}
                newSkill={newSkill}
                setNewSkill={setNewSkill}
                skillType={skillType}
                setSkillType={setSkillType}
                handleAddSkill={handleAddSkill}
                handleRemoveSkill={handleRemoveSkill}
                handleSaveSkills={handleSaveSkills}
                isSaving={isSaving}
                handleKeyPress={handleKeyPress}
              />}
              {activeTab === 'professional' && <ProfessionalTab employee={employee} />}
              {activeTab === 'personal' && <PersonalTab employee={employee} />}
              {activeTab === 'documents' && <DocumentsTab employee={employee} />}
              {activeTab === 'preferences' && <PreferencesTab employee={employee} />}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDocumentModal && (
        <DocumentUploadModal
          onClose={() => setShowDocumentModal(false)}
          onUpload={handleUploadDocument}
        />
      )}

      {showPreferencesModal && (
        <PreferencesModal
          employee={employee}
          onClose={() => setShowPreferencesModal(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
};

// Tab Components
const OverviewTab = ({ 
  employee, 
  editingSkills, 
  setEditingSkills,
  newSkill,
  setNewSkill,
  skillType,
  setSkillType,
  handleAddSkill,
  handleRemoveSkill,
  handleSaveSkills,
  isSaving,
  handleKeyPress
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Performance Summary</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-blue-700">{employee.performance.currentRating}</p>
            <p className="text-sm text-blue-600">Current Rating</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600">Last Review</p>
            <p className="font-medium">{employee.performance.lastReview}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 rounded-xl p-4">
        <h4 className="font-semibold text-green-900 mb-2">Leave Summary</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-green-700">{employee.leaveBalance.remaining}</p>
            <p className="text-sm text-green-600">Days Remaining</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600">Annual Leave</p>
            <p className="font-medium">{employee.leaveBalance.annual} days</p>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-gray-900">Skills & Expertise</h4>
        {!editingSkills ? (
          <button
            onClick={() => setEditingSkills(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition duration-200"
          >
            <Pencil className="h-3 w-3" />
            Edit Skills
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingSkills(false)}
              className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSkills}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  Save Skills
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {editingSkills ? (
        <div className="space-y-6">
          {/* Add New Skill Form */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="font-medium text-gray-900 mb-3">Add New Skill</h5>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter a new skill (e.g., React, Project Management)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Skill Type</label>
                <div className="flex gap-2">
                  {['technical', 'soft'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSkillType(type)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition duration-200 ${
                        skillType === type 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {type === 'technical' ? 'Technical Skills' : 'Soft Skills'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Skills Lists */}
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600">Technical Skills</span>
                <span className="text-sm text-gray-500">({employee.skills.technical.length})</span>
              </h5>
              <div className="flex flex-wrap gap-2">
                {employee.skills.technical.map((skill, index) => (
                  <div key={index} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full">
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill('technical', skill)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {employee.skills.technical.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No technical skills added yet</p>
                )}
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-green-600">Soft Skills</span>
                <span className="text-sm text-gray-500">({employee.skills.soft.length})</span>
              </h5>
              <div className="flex flex-wrap gap-2">
                {employee.skills.soft.map((skill, index) => (
                  <div key={index} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded-full">
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill('soft', skill)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {employee.skills.soft.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No soft skills added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Technical Skills</h5>
            <div className="flex flex-wrap gap-2">
              {employee.skills.technical.map((skill, index) => (
                <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Soft Skills</h5>
            <div className="flex flex-wrap gap-2">
              {employee.skills.soft.map((skill, index) => (
                <span key={index} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

    <div>
      <h4 className="font-semibold text-gray-900 mb-4">Recent Achievements</h4>
      <div className="space-y-3">
        {employee.achievements.slice(0, 2).map(achievement => (
          <div key={achievement.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h5 className="font-medium text-gray-900">{achievement.title}</h5>
              <p className="text-sm text-gray-600">{achievement.description}</p>
              <p className="text-xs text-gray-500 mt-1">Awarded: {achievement.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProfessionalTab = ({ employee }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Employee Type</h5>
          <p className="font-medium">{employee.professionalInfo.employeeType}</p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Work Schedule</h5>
          <p className="font-medium">{employee.professionalInfo.workSchedule}</p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Office Location</h5>
          <p className="font-medium">{employee.professionalInfo.officeLocation}</p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Salary Grade</h5>
          <p className="font-medium">{employee.professionalInfo.salaryGrade}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Reporting To</h5>
          <p className="font-medium">{employee.professionalInfo.reportingTo}</p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Work Mode</h5>
          <p className="font-medium">{employee.professionalInfo.workMode}</p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Joining Date</h5>
          <p className="font-medium">{employee.professionalInfo.joiningDate}</p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Employee Level</h5>
          <p className="font-medium">{employee.professionalInfo.employeeLevel}</p>
        </div>
      </div>
    </div>

    <div>
      <h4 className="font-semibold text-gray-900 mb-4">Work History</h4>
      <div className="space-y-4">
        {employee.workHistory.map(job => (
          <div key={job.id} className="p-4 border border-gray-200 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-semibold text-gray-900">{job.position}</h5>
                <p className="text-gray-600">{job.company}</p>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                {job.period}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {job.achievements.map((achievement, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h4 className="font-semibold text-gray-900 mb-4">Certifications</h4>
      <div className="space-y-3">
        {employee.certifications.map(cert => (
          <div key={cert.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div>
              <h5 className="font-medium text-gray-900">{cert.name}</h5>
              <p className="text-sm text-gray-600">{cert.issuer}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Expires: {cert.expiryDate}</p>
              <p className="text-xs text-gray-500">{cert.credentialId}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PersonalTab = ({ employee }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Date of Birth</h5>
          <p className="font-medium">{employee.basicInfo.dateOfBirth} (Age: {employee.basicInfo.age})</p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Gender</h5>
          <p className="font-medium">{employee.basicInfo.gender}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Additional personal info can go here */}
      </div>
    </div>

    <div>
      <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-xl">
          <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Current Address
          </h5>
          <p className="text-gray-600">{employee.personalDetails.address}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-xl">
          <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Personal Phone
          </h5>
          <p className="text-gray-600">{employee.basicInfo.personalPhone}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-xl">
          <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Personal Email
          </h5>
          <p className="text-gray-600">{employee.personalDetails.personalEmail}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-xl">
          <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            LinkedIn Profile
          </h5>
          <p className="text-gray-600">{employee.personalDetails.linkedin}</p>
        </div>
      </div>
    </div>

    <div>
      <h4 className="font-semibold text-gray-900 mb-4">Financial Information</h4>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 border border-gray-200 rounded-xl">
          <div>
            <h5 className="font-medium text-gray-900">Bank Name</h5>
            <p className="text-sm text-gray-600">{employee.financialInfo.bankName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Account Number</p>
            <p className="font-medium">{employee.financialInfo.accountNumber}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DocumentsTab = ({ employee }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h4 className="font-semibold text-gray-900">Employee Documents</h4>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 flex items-center gap-2">
        <Upload className="h-4 w-4" />
        Upload Document
      </button>
    </div>

    <div className="space-y-3">
      {employee.documents.map(doc => (
        <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h5 className="font-medium text-gray-900">{doc.name}</h5>
              <p className="text-sm text-gray-600">
                {doc.type} • {doc.size} • Uploaded: {doc.uploadDate}
                {doc.expiryDate && ` • Expires: ${doc.expiryDate}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded-full ${doc.status === 'Valid' || doc.status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {doc.status}
            </span>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Download className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Eye className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      ))}
    </div>

    <div>
      <h4 className="font-semibold text-gray-900 mb-4">Document Categories</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-blue-50 rounded-xl text-center">
          <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="font-medium">Contracts</p>
          <p className="text-sm text-gray-600">1 document</p>
        </div>
        <div className="p-4 bg-green-50 rounded-xl text-center">
          <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-medium">Identification</p>
          <p className="text-sm text-gray-600">1 document</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-xl text-center">
          <File className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="font-medium">Education</p>
          <p className="text-sm text-gray-600">1 document</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-xl text-center">
          <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="font-medium">Certificates</p>
          <p className="text-sm text-gray-600">2 documents</p>
        </div>
      </div>
    </div>
  </div>
);

const PreferencesTab = ({ employee }) => (
  <div className="space-y-6">
    <div>
      <h4 className="font-semibold text-gray-900 mb-4">Communication Preferences</h4>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
          <div>
            <h5 className="font-medium text-gray-900">Email Notifications</h5>
            <p className="text-sm text-gray-600">Receive daily updates</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked={employee.preferences.communication.newsletter} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>

    <div>
      <h4 className="font-semibold text-gray-900 mb-4">Privacy Settings</h4>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Profile Visibility</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-xl"
            defaultValue={employee.preferences.privacy.profileVisibility}
          >
            <option>Company Only</option>
            <option>My Department Only</option>
            <option>Team Members Only</option>
            <option>Public</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);

// Modal Components
const DocumentUploadModal = ({ onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file && documentType) {
      onUpload({ file, type: documentType });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select 
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
            >
              <option value="">Select Type</option>
              <option value="contract">Contract</option>
              <option value="identification">Identification</option>
              <option value="certificate">Certificate</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Drag & drop files or click to browse</p>
              <input 
                type="file"
                onChange={handleFileChange}
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-2">Max file size: 10MB</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PreferencesModal = ({ employee, onClose, onSave }) => {
  const [formData, setFormData] = useState(employee.preferences);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ preferences: formData });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Preferences</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Communication Preferences</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Preferred Communication Method</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  value={formData.communication.preferredMethod}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    communication: { ...prev.communication, preferredMethod: e.target.value }
                  }))}
                >
                  <option>Email</option>
                  <option>Phone</option>
                  <option>Teams/Slack</option>
                  <option>SMS</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notification Frequency</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  value={formData.communication.notificationFrequency}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    communication: { ...prev.communication, notificationFrequency: e.target.value }
                  }))}
                >
                  <option>Real-time</option>
                  <option>Hourly</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeePersonalProfile;