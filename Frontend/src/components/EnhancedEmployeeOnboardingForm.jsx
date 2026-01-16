// components/EnhancedEmployeeOnboardingForm.jsx
// New component with all enhanced fields for employee onboarding

import React, { useState } from 'react';
import { 
  AlertCircle, Check, ChevronRight, ChevronLeft,
  Calendar, Briefcase, DollarSign, CreditCard,
  FileText, User, Mail, Phone, Building, Award
} from 'lucide-react';

const EnhancedEmployeeOnboardingForm = ({ onSubmit, initialData = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || {
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Work Details
    employeeId: '',
    department: '',
    subDepartment: '',
    employmentStatus: 'Probation',
    joinDate: new Date().toISOString().split('T')[0],
    confirmationDate: '',
    
    // Bank Account
    bankAccount: '',
    accountTitleName: '',
    bankName: 'HBL',
    
    // CNIC Details
    cnic: '',
    cnicIssueDate: '',
    cnicExpiryDate: '',
    
    // Additional Info
    address: '',
    emergencyContact: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Personal Information
        if (!formData.firstName.trim()) newErrors.firstName = 'First name required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name required';
        if (!formData.email) newErrors.email = 'Email required';
        if (!formData.phone) newErrors.phone = 'Phone number required';
        break;

      case 2: // Work Details
        if (!formData.employeeId) newErrors.employeeId = 'Employee ID required';
        if (!formData.department) newErrors.department = 'Department required';
        if (!formData.subDepartment) newErrors.subDepartment = 'Sub-Department required';
        if (!formData.employmentStatus) newErrors.employmentStatus = 'Employment Status required';
        if (!formData.joinDate) newErrors.joinDate = 'Join Date required';
        break;

      case 3: // Bank Details
        if (!formData.bankAccount) newErrors.bankAccount = 'Bank Account Number required';
        if (!formData.accountTitleName) newErrors.accountTitleName = 'Account Title Name required';
        if (!formData.bankName) newErrors.bankName = 'Bank Name required';
        break;

      case 4: // CNIC Details
        if (!formData.cnic) newErrors.cnic = 'CNIC number required';
        if (!formData.cnicIssueDate) newErrors.cnicIssueDate = 'CNIC Issue Date required';
        if (!formData.cnicExpiryDate) newErrors.cnicExpiryDate = 'CNIC Expiry Date required';
        if (formData.cnicExpiryDate && formData.cnicIssueDate && 
            new Date(formData.cnicExpiryDate) <= new Date(formData.cnicIssueDate)) {
          newErrors.cnicExpiryDate = 'Expiry date must be after issue date';
        }
        break;

      default:
        break;
    }

    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length === 0) {
      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setErrors(stepErrors);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stepErrors = validateStep(currentStep);
    
    if (Object.keys(stepErrors).length === 0) {
      setIsLoading(true);
      try {
        if (onSubmit) {
          await onSubmit(formData);
        }
      } catch (error) {
        setErrors({ submit: error.message });
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(stepErrors);
    }
  };

  // Sub-department options based on department
  const getSubDepartmentOptions = () => {
    const options = {
      'Production & Development': [
        'Software Engineer',
        'Senior Developer',
        'Junior Developer',
        'Full Stack Developer',
        'DevOps Engineer',
        'QA Engineer'
      ],
      'Product Design': [
        'UI/UX Designer',
        'Product Designer',
        'Design Lead',
        'Graphic Designer'
      ],
      'Digital Marketing': [
        'Digital Marketing Manager',
        'SEO Specialist',
        'Content Manager',
        'Social Media Manager'
      ],
      'Sales & Business Development': [
        'Sales Manager',
        'Sales Executive',
        'Business Development Manager',
        'Account Manager'
      ],
      'Human Resources': [
        'HR Manager',
        'HR Executive',
        'Recruiter',
        'HR Lead'
      ],
      'Project Management': [
        'Project Manager',
        'Scrum Master',
        'Project Coordinator',
        'PMO Lead'
      ]
    };
    return options[formData.department] || [];
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
        <p className="text-gray-600 mt-2">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
              errors.firstName ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            }`}
            placeholder="John"
          />
          {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
              errors.lastName ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            }`}
            placeholder="Doe"
          />
          {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
            errors.email ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
          }`}
          placeholder="john.doe@digious.com"
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number *
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
            errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
          }`}
          placeholder="+92 300 1234567"
        />
        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Work Details</h3>
        <p className="text-gray-600 mt-2">Employment and role information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee ID *
          </label>
          <input
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
              errors.employeeId ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            }`}
            placeholder="DG-001"
          />
          {errors.employeeId && <p className="text-red-600 text-sm mt-1">{errors.employeeId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department *
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
              errors.department ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            }`}
          >
            <option value="">Select Department</option>
            <option value="Production & Development">Production & Development</option>
            <option value="Product Design">Product Design</option>
            <option value="Digital Marketing">Digital Marketing</option>
            <option value="Sales & Business Development">Sales & Business Development</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Project Management">Project Management</option>
          </select>
          {errors.department && <p className="text-red-600 text-sm mt-1">{errors.department}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sub-Department (Role) *
        </label>
        <select
          name="subDepartment"
          value={formData.subDepartment}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
            errors.subDepartment ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
          }`}
        >
          <option value="">Select Sub-Department</option>
          {getSubDepartmentOptions().map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {errors.subDepartment && <p className="text-red-600 text-sm mt-1">{errors.subDepartment}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employment Status *
          </label>
          <select
            name="employmentStatus"
            value={formData.employmentStatus}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
              errors.employmentStatus ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            }`}
          >
            <option value="Probation">Probation</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Intern">Intern</option>
            <option value="MTO">Management Trainee Officer (MTO)</option>
            <option value="Permanent">Permanent</option>
          </select>
          {errors.employmentStatus && <p className="text-red-600 text-sm mt-1">{errors.employmentStatus}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Join Date *
          </label>
          <input
            type="date"
            name="joinDate"
            value={formData.joinDate}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
              errors.joinDate ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            }`}
          />
          {errors.joinDate && <p className="text-red-600 text-sm mt-1">{errors.joinDate}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirmation Date (Auto-calculated)
        </label>
        <input
          type="date"
          name="confirmationDate"
          value={formData.confirmationDate}
          readOnly
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600"
        />
        <p className="text-xs text-gray-500 mt-1">
          Will be set to 3 months after joining (automatically calculated)
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Bank Account Details</h3>
        <p className="text-gray-600 mt-2">Salary transfer information (Mandatory)</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          💡 Bank account details are required for salary processing and payments.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bank Account Number *
        </label>
        <input
          type="text"
          name="bankAccount"
          value={formData.bankAccount}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
            errors.bankAccount ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
          }`}
          placeholder="PKRIBAN123456789"
        />
        {errors.bankAccount && <p className="text-red-600 text-sm mt-1">{errors.bankAccount}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Account Title Name *
        </label>
        <input
          type="text"
          name="accountTitleName"
          value={formData.accountTitleName}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
            errors.accountTitleName ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
          }`}
          placeholder="Your Full Name as per bank"
        />
        {errors.accountTitleName && <p className="text-red-600 text-sm mt-1">{errors.accountTitleName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bank Name *
        </label>
        <select
          name="bankName"
          value={formData.bankName}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
            errors.bankName ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
          }`}
        >
          <option value="HBL">HBL (Habib Bank Limited)</option>
          <option value="UBL">UBL (United Bank Limited)</option>
          <option value="MCB">MCB (Muslim Commercial Bank)</option>
          <option value="Allied Bank">Allied Bank</option>
          <option value="NBP">NBP (National Bank of Pakistan)</option>
          <option value="Askari Bank">Askari Bank</option>
          <option value="Bank Alfalah">Bank Alfalah</option>
          <option value="Faysal Bank">Faysal Bank</option>
          <option value="Others">Others</option>
        </select>
        {errors.bankName && <p className="text-red-600 text-sm mt-1">{errors.bankName}</p>}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">CNIC Details</h3>
        <p className="text-gray-600 mt-2">National ID information for compliance</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          ⚠️ CNIC information is required for legal and tax compliance purposes.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CNIC Number *
        </label>
        <input
          type="text"
          name="cnic"
          value={formData.cnic}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
            errors.cnic ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
          }`}
          placeholder="XXXXX-XXXXXXXXX-X"
        />
        {errors.cnic && <p className="text-red-600 text-sm mt-1">{errors.cnic}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNIC Issue Date *
          </label>
          <input
            type="date"
            name="cnicIssueDate"
            value={formData.cnicIssueDate}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
              errors.cnicIssueDate ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            }`}
          />
          {errors.cnicIssueDate && <p className="text-red-600 text-sm mt-1">{errors.cnicIssueDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNIC Expiry Date *
          </label>
          <input
            type="date"
            name="cnicExpiryDate"
            value={formData.cnicExpiryDate}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
              errors.cnicExpiryDate ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            }`}
          />
          {errors.cnicExpiryDate && <p className="text-red-600 text-sm mt-1">{errors.cnicExpiryDate}</p>}
        </div>
      </div>

      {formData.cnicIssueDate && formData.cnicExpiryDate && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✓ CNIC Validity: {Math.round((new Date(formData.cnicExpiryDate) - new Date(formData.cnicIssueDate)) / (1000 * 60 * 60 * 24 * 365))} years
          </p>
        </div>
      )}
    </div>
  );

  const steps = [
    { number: 1, title: 'Personal', icon: '👤' },
    { number: 2, title: 'Work Details', icon: '🏢' },
    { number: 3, title: 'Bank Account', icon: '🏦' },
    { number: 4, title: 'CNIC', icon: '📄' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    currentStep >= step.number
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <p className={`mt-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {step.title}
                </p>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-1 w-16 mx-2 mt-4 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-8 border-t">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {isLoading ? 'Submitting...' : 'Complete Onboarding'}
                  <Check className="w-5 h-5" />
                </button>
              )}
            </div>

            {errors.submit && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{errors.submit}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-600 text-sm">
          <p>Step {currentStep} of 4 • All fields marked with * are mandatory</p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEmployeeOnboardingForm;
