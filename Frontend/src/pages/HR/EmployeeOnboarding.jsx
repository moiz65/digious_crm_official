// Frontend/src/pages/HR/EmployeeOnboarding.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrSidebar from '../../components/HrSidebar';
import { endpoints } from '../../config/api';
import { 
  ArrowLeft, Save, Plus, CheckCircle, AlertCircle, Eye, EyeOff, X, RefreshCw
} from 'lucide-react';

const EmployeeOnboarding = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('employees');
  const [showPassword, setShowPassword] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  
  const departments = [
      "Human Resources",
      "Sales",
      "Supporting Staff",
      "Production",
      "Digital Marketing",
      "Operations",
    ];

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: 'karachi123',
    confirmPassword: 'karachi123',
    phone: '',
    cnic: '',
    department: '',
    sub_department: '',
    employment_status: '',
    joinDate: '',
    confirmation_date: '',
    // Salary breakdown: baseSalary (required) + allowances[] (optional)
    baseSalary: '',
    allowances: [],
    allowanceName: '',
    allowanceAmount: '',
    address: '',
    emergencyContact: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    requestPasswordChange: true,
    bankAccount: '',
    taxId: '',
    designation: '',
    account_title_name: '',
    bank_name: '',
    custom_bank_name: '',
    cnic_issue_date: '',
    cnic_issue_month: '',
    cnic_issue_year: '',
    cnic_expiry_date: '',
    cnic_expiry_month: '',
    cnic_expiry_year: '',
    dob: '',
    currency: 'PKR',
    exchange_rate: 278,
    // Resource allocation (optional) - predefined resources
    laptop: false,
    laptopSerial: '',
    charger: false,
    chargerSerial: '',
    mouse: false,
    mouseSerial: '',
    mobile: false,
    mobileSerial: '',
    keyboard: false,
    keyboardSerial: '',
    monitor: false,
    monitorSerial: '',
    // Dynamic resources
    dynamicResources: [],
    newResourceName: '',
    newResourceSerial: '',
    resourcesNote: ''
  });

  const [employeeIdStatus, setEmployeeIdStatus] = useState(null); // 'available', 'exists', 'checking', 'generated'
  const [suggestedNextId, setSuggestedNextId] = useState(null);
  const EMPLOYEE_ID_PREFIX = 'DG';
  const ID_PADDING_LENGTH = 3; // Use 3 for 001, 4 for 0001, etc.

  // Auto-generate employee ID on component mount
  useEffect(() => {
    generateNextEmployeeId();
  }, []);

  // Function to check if an employee ID exists in the database
  const checkIdExistsinDB = async (numericId) => {
    try {
      // Pad to at least 3 digits so the backend validation passes (expects 001, not 1)
      const paddedId = numericId.toString().padStart(ID_PADDING_LENGTH, '0');
      const response = await fetch(endpoints.employees.checkIdAvailability(paddedId));
      const data = await response.json();
      // If the endpoint returns 'exists: true', the ID is already taken
      return data.exists === true;
    } catch (error) {
      console.error('Error checking ID availability:', error);
      return false; // Assume available if check fails
    }
  };

  // Function to generate next available employee ID starting from 001
  const generateNextEmployeeId = async () => {
    setIsGeneratingId(true);
    setEmployeeIdStatus('checking');
    
    try {
      // Call backend API to get next available ID
      const response = await fetch(endpoints.employees.getNextId);
      const data = await response.json();
      
      if (data.success && data.nextId) {
        // Format the ID to start from 001 (or 0001 based on padding length)
        // Ensure we start from 001, not 000
        let numericId = parseInt(data.nextId);
        
        // If no employees exist yet, start from 1
        if (numericId === 0) {
          numericId = 1;
        }
        
        // Check if this ID exists in database, and keep incrementing until we find an available one
        let idExists = await checkIdExistsinDB(numericId);
        while (idExists && numericId < 999999) {
          numericId++;
          idExists = await checkIdExistsinDB(numericId);
        }
        
        // Pad with zeros to reach desired length (001, 0001, etc.)
        const formattedId = numericId.toString().padStart(ID_PADDING_LENGTH, '0');
        
        setFormData(prev => ({
          ...prev,
          employeeId: formattedId
        }));
        
        setEmployeeIdStatus('generated');
        setSuggestedNextId(null);
        
        console.log(`✅ Auto-generated Employee ID: ${EMPLOYEE_ID_PREFIX}-${formattedId}`);
      } else {
        // Fallback to local generation if API fails - start from 001
        generateLocalNextId();
      }
    } catch (error) {
      console.error('Error fetching next ID from API:', error);
      // Fallback to local generation
      generateLocalNextId();
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Local fallback function to generate next ID starting from 001
  const generateLocalNextId = async () => {
    // This is a fallback if the API is not available
    // Check if there are existing employees to determine the next ID
    let nextId;
    
    if (employees.length > 0) {
      // Find the maximum existing employee ID
      const maxId = employees.reduce((max, emp) => {
        // Extract numeric part from employeeId (remove prefix)
        const empIdStr = emp.employeeId || '';
        const numericPart = empIdStr.replace(`${EMPLOYEE_ID_PREFIX}-`, '');
        const num = parseInt(numericPart) || 0;
        return Math.max(max, num);
      }, 0);
      
      // Next ID is max + 1
      nextId = maxId + 1;
    } else {
      // No employees yet, start from 001
      nextId = 1;
    }
    
    // Check if the generated ID exists in database, and keep incrementing until we find an available one
    let idExists = await checkIdExistsinDB(nextId);
    while (idExists && nextId < 999999) {
      nextId++;
      idExists = await checkIdExistsinDB(nextId);
    }
    
    const formattedId = nextId.toString().padStart(ID_PADDING_LENGTH, '0');
    
    setFormData(prev => ({
      ...prev,
      employeeId: formattedId
    }));
    
    setEmployeeIdStatus('generated');
    setSuggestedNextId(null);
    
    console.log(`✅ Generated Employee ID (local fallback): ${EMPLOYEE_ID_PREFIX}-${formattedId}`);
  };

  // Manual refresh of employee ID
  const handleRefreshId = () => {
    generateNextEmployeeId();
  };

  // ----- Form step helpers and validation -----
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
      // Validate that ID is not 000
      if (formData.employeeId === '000' || formData.employeeId === '0000' || formData.employeeId === '00000') {
        newErrors.employeeId = 'Employee ID cannot be 000';
      }
      
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      // Email must be @digioussolutions.com
      if (formData.email && !formData.email.endsWith('@digioussolutions.com')) newErrors.email = 'Email must be @digioussolutions.com';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Contact person name is required';
      if (!formData.emergencyContactRelationship.trim()) newErrors.emergencyContactRelationship = 'Relationship is required';
      if (!formData.emergencyContact.trim()) newErrors.emergencyContact = 'Emergency contact phone is required';
      if (!formData.cnic.trim()) newErrors.cnic = 'CNIC is required';
      if (!formData.cnic_issue_date) newErrors.cnic_issue_date = 'CNIC issue date is required';
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.cnic_issue_date)) newErrors.cnic_issue_date = 'CNIC issue must be day, month and year (YYYY-MM-DD)';
      if (!formData.cnic_expiry_date) newErrors.cnic_expiry_date = 'CNIC expiry date is required';
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.cnic_expiry_date)) newErrors.cnic_expiry_date = 'CNIC expiry must be day, month and year (YYYY-MM-DD)';

      // Ensure expiry is same or after issue date
      if (formData.cnic_issue_date && formData.cnic_expiry_date && /^\d{4}-\d{2}-\d{2}$/.test(formData.cnic_issue_date) && /^\d{4}-\d{2}-\d{2}$/.test(formData.cnic_expiry_date)) {
        const issue = new Date(formData.cnic_issue_date + 'T00:00:00');
        const expiry = new Date(formData.cnic_expiry_date + 'T00:00:00');
        if (isNaN(issue.getTime())) newErrors.cnic_issue_date = 'Invalid CNIC issue date';
        else if (isNaN(expiry.getTime())) newErrors.cnic_expiry_date = 'Invalid CNIC expiry date';
        else if (expiry < issue) newErrors.cnic_expiry_date = 'CNIC expiry must be same or after issue date';
      }
      if (!formData.account_title_name.trim()) newErrors.account_title_name = 'Account title name is required';
      if (!formData.bank_name) newErrors.bank_name = 'Bank name is required';
      if (formData.bank_name === 'Other' && !formData.custom_bank_name?.trim()) newErrors.custom_bank_name = 'Custom bank name is required when selecting Other';
    }
    if (step === 2) {
      if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    if (step === 3) {
      if (!formData.department) newErrors.department = 'Please select a department';
      if (!formData.sub_department.trim()) newErrors.sub_department = 'Sub-Department is required';
      if (!formData.employment_status) newErrors.employment_status = 'Employment status is required';
      if (!formData.joinDate) newErrors.joinDate = 'Join date is required';
      // if (!formData.confirmation_date) newErrors.confirmation_date = 'Confirmation date is required';
      if (!formData.baseSalary) newErrors.baseSalary = 'Base salary is required';
    }
    return newErrors;
  };

  const handleNextStep = () => {
    const newErrors = validateStep(onboardingStep);
    if (Object.keys(newErrors).length === 0) {
      setErrors({});
      setOnboardingStep(prev => prev + 1);
    } else {
      setErrors(newErrors);
    }
  };

  const handlePreviousStep = () => {
    setErrors({});
    setOnboardingStep(prev => Math.max(1, prev - 1));
  };

  // Form submission
  const handleSubmit = async () => {
    // Validate all steps before submission
    const stepsToValidate = [1, 2, 3];
    let hasErrors = false;
    
    for (let step of stepsToValidate) {
      const stepErrors = validateStep(step);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setOnboardingStep(step);
        hasErrors = true;
        break;
      }
    }
    
    if (hasErrors) return;

    // Prepare data to send to backend
    const employeeDataForBackend = {
      // Basic info
      employeeId: `${EMPLOYEE_ID_PREFIX}-${String(formData.employeeId).padStart(ID_PADDING_LENGTH, '0')}`,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      cnic: formData.cnic,
      dob: formData.dob,
      department: formData.department,
      sub_department: formData.sub_department,
      
      // Employment details
      employment_status: formData.employment_status,
      join_date: formData.joinDate,
      confirmation_date: formData.confirmation_date,
      designation: formData.designation,
      
      // Contact & Address
      address: formData.address,
      emergency_contact_name: formData.emergencyContactName,
      emergency_contact_relationship: formData.emergencyContactRelationship,
      emergency_contact: formData.emergencyContact,
      
      // Bank & Account details
      account_title_name: formData.account_title_name,
      bank_name: formData.bank_name === 'Other' ? formData.custom_bank_name : formData.bank_name,
      bank_account: formData.bankAccount,
      tax_id: formData.taxId,
      
      // CNIC dates
      cnic_issue_date: formData.cnic_issue_date,
      cnic_expiry_date: formData.cnic_expiry_date,
      
      // Salary & Allowances
      baseSalary: Number(formData.baseSalary || 0),
      allowances: formData.allowances,
      currency: formData.currency,
      exchange_rate: formData.exchange_rate,
      
      // Password settings
      requestPasswordChange: formData.requestPasswordChange,
      
      // Resources
      laptop: formData.laptop,
      laptopSerial: formData.laptopSerial,
      charger: formData.charger,
      chargerSerial: formData.chargerSerial,
      mouse: formData.mouse,
      mouseSerial: formData.mouseSerial,
      mobile: formData.mobile,
      mobileSerial: formData.mobileSerial,
      keyboard: formData.keyboard,
      keyboardSerial: formData.keyboardSerial,
      monitor: formData.monitor,
      monitorSerial: formData.monitorSerial,
      dynamicResources: formData.dynamicResources,
      resourcesNote: formData.resourcesNote
    };

    try {
      setIsLoading(true);
      console.log('🔄 Sending employee data to backend...', employeeDataForBackend);
      
      const response = await fetch(endpoints.employees.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeDataForBackend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create employee');
      }

      console.log('✅ Employee onboarded successfully:', data);

      // If successful, update local state
      const newEmployee = {
        id: data.data.id,
        ...formData,
        employeeId: `${EMPLOYEE_ID_PREFIX}-${String(formData.employeeId).padStart(ID_PADDING_LENGTH, '0')}`,
        baseSalary: Number(formData.baseSalary || 0),
        totalCompensation: computeTotalSalary(),
        status: 'Active',
        avatar: null
      };
      setEmployees([...employees, newEmployee]);
      
      // Set success message with better timing
      setSuccessMessage(`✅ Employee ${formData.name} has been successfully onboarded!`);
      
      // Reset form after success
      setTimeout(() => {
        resetForm();
        setOnboardingStep(1);
        setSuccessMessage('');
        // Generate new ID for next employee
        generateNextEmployeeId();
      }, 2500);
    } catch (error) {
      console.error('❌ Error saving employee:', error);
      setSuccessMessage('');
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      password: 'karachi123',
      confirmPassword: 'karachi123',
      phone: '',
      cnic: '',
      department: '',
      sub_department: '',
      employment_status: '',
      joinDate: '',
      confirmation_date: '',
      baseSalary: '',
      allowances: [],
      allowanceName: '',
      allowanceAmount: '',
      address: '',
      emergencyContact: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      requestPasswordChange: true,
      bankAccount: '',
      taxId: '',
      designation: '',
      account_title_name: '',
      bank_name: '',
      custom_bank_name: '',
      cnic_issue_date: '',
      cnic_issue_month: '',
      cnic_issue_year: '',
      cnic_expiry_date: '',
      cnic_expiry_month: '',
      cnic_expiry_year: '',
      dob: '',
      currency: 'PKR',
      exchange_rate: 278,
      // Resource allocation fields reset
      laptop: false,
      laptopSerial: '',
      charger: false,
      chargerSerial: '',
      mouse: false,
      mouseSerial: '',
      mobile: false,
      mobileSerial: '',
      keyboard: false,
      keyboardSerial: '',
      monitor: false,
      monitorSerial: '',
      dynamicResources: [],
      newResourceName: '',
      newResourceSerial: '',
      resourcesNote: ''
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;
    
    // Handle employee ID - now auto-generated, but allow manual override if needed
    if (name === 'employeeId') {
      newValue = value.replace(/[^0-9]/g, ''); // Remove all non-numeric characters
      // Optional: You could still check availability if manually entered
      if (newValue && newValue.length >= 3) {
        // Optionally check ID availability for manual entries
        // checkEmployeeIdAvailability(newValue);
      }
    }

    // CNIC month/year selects -> keep combined YYYY-MM in cnic_issue_date / cnic_expiry_date
    if (name === 'cnic_issue_date') {
      const dateVal = newValue; // expected YYYY-MM-DD or empty
      let month = '';
      let year = '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        [year, month] = dateVal.split('-');
      } else if (/^\d{4}-\d{2}$/.test(dateVal)) {
        [year, month] = dateVal.split('-');
      }
      setFormData({
        ...formData,
        cnic_issue_date: dateVal,
        cnic_issue_month: month,
        cnic_issue_year: year
      });
      if (errors.cnic_issue_date) setErrors({ ...errors, cnic_issue_date: '' });
      return;
    }

    if (name === 'cnic_expiry_date') {
      const dateVal = newValue; // expected YYYY-MM-DD or empty
      let month = '';
      let year = '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        [year, month] = dateVal.split('-');
      } else if (/^\d{4}-\d{2}$/.test(dateVal)) {
        [year, month] = dateVal.split('-');
      }
      setFormData({
        ...formData,
        cnic_expiry_date: dateVal,
        cnic_expiry_month: month,
        cnic_expiry_year: year
      });
      if (errors.cnic_expiry_date) setErrors({ ...errors, cnic_expiry_date: '' });
      return;
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : newValue
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const checkEmployeeIdAvailability = async (numericId) => {
    setEmployeeIdStatus('checking');
    try {
      // Validate input - must be numeric only
      if (!numericId || !/^\d+$/.test(numericId)) {
        setEmployeeIdStatus('invalid');
        setSuggestedNextId('Employee ID must contain only numeric digits');
        return;
      }

      // Validate minimum 3 digits
      if (numericId.length < 3) {
        setEmployeeIdStatus('invalid');
        setSuggestedNextId(`Employee ID must have at least 3 digits (currently ${numericId.length})`);
        return;
      }

      // Validate "000" is not allowed
      if (numericId === '000' || parseInt(numericId) === 0) {
        setEmployeeIdStatus('invalid');
        setSuggestedNextId('000 is not allowed');
        return;
      }

      // Call backend API to check availability
      const response = await fetch(endpoints.employees.checkIdAvailability(numericId));
      const data = await response.json();

      if (data.exists) {
        // ID exists
        setEmployeeIdStatus('exists');
        setSuggestedNextId(data.suggestedId);
      } else if (data.success) {
        // ID is available
        setEmployeeIdStatus('available');
        setSuggestedNextId(null);
      } else {
        // Invalid input
        setEmployeeIdStatus('invalid');
        setSuggestedNextId(data.message);
      }
    } catch (error) {
      console.error('Error checking employee ID:', error);
      setEmployeeIdStatus(null);
      setSuggestedNextId(null);
    }
  };

  const addAllowance = () => {
    const name = formData.allowanceName.trim();
    const amount = Number(formData.allowanceAmount);
    if (!name || !amount || Number.isNaN(amount)) return;
    setFormData({
      ...formData,
      allowances: [...formData.allowances, { name, amount }],
      allowanceName: '',
      allowanceAmount: ''
    });
  };

  const removeAllowance = (index) => {
    const list = [...formData.allowances];
    list.splice(index, 1);
    setFormData({ ...formData, allowances: list });
  };

  const addDynamicResource = () => {
    const name = formData.newResourceName.trim();
    if (!name) return;
    
    const newResource = {
      id: Date.now(),
      name,
      serial: formData.newResourceSerial.trim() || 'N/A'
    };
    
    setFormData({
      ...formData,
      dynamicResources: [...formData.dynamicResources, newResource],
      newResourceName: '',
      newResourceSerial: ''
    });
  };

  const removeDynamicResource = (id) => {
    setFormData({
      ...formData,
      dynamicResources: formData.dynamicResources.filter(r => r.id !== id)
    });
  };

  function computeTotalSalary() {
    const base = Number(formData.baseSalary || 0);
    const allowances = (formData.allowances || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
    return base + allowances;
  }

  const monthOptions = [
    { value: '01', label: '01 - Jan' },
    { value: '02', label: '02 - Feb' },
    { value: '03', label: '03 - Mar' },
    { value: '04', label: '04 - Apr' },
    { value: '05', label: '05 - May' },
    { value: '06', label: '06 - Jun' },
    { value: '07', label: '07 - Jul' },
    { value: '08', label: '08 - Aug' },
    { value: '09', label: '09 - Sep' },
    { value: '10', label: '10 - Oct' },
    { value: '11', label: '11 - Nov' },
    { value: '12', label: '12 - Dec' }
  ];

  const currentYear = new Date().getFullYear();
  // Allow wider ranges so Year pickers aren't limited to the current year (e.g., not capped at 2026)
  const issueYears = Array.from({ length: 121 }, (_, i) => currentYear - i); // currentYear down to -120 (covers ~120 years back)
  const expiryYears = Array.from({ length: 101 }, (_, i) => currentYear + i); // currentYear to +100 (far future)



  const formatMonthYear = (ym) => {
    if (!ym) return '';
    const parts = ym.split('-');
    if (parts.length !== 2) return ym;
    return `${parts[1]} / ${parts[0]}`; // MM / YYYY
  };

  const formatToDDMMYYYY = (ymd) => {
    if (!ymd) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      const [y,m,d] = ymd.split('-');
      return `${d}-${m}-${y}`;
    }
    if (/^\d{4}-\d{2}$/.test(ymd)) {
      const [y,m] = ymd.split('-');
      return `01-${m}-${y}`;
    }
    return ymd;
  };

  const stepTitles = [
    'Basic Information',
    'Security Setup',
    'Job Details',
    'Review & Confirm'
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">Processing Employee Data</p>
              <p className="text-sm text-gray-600 mt-2">Please wait while we save the information...</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <HrSidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Employee Onboarding</h1>
                <p className="text-gray-500 text-sm mt-1">Complete onboarding process for new employees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message - Toast Notification */}
        {successMessage && (
          <div className="fixed top-8 right-8 max-w-md z-50 animate-in fade-in slide-in-from-top-5 duration-500">
            <div className="bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl shadow-2xl p-5 flex items-start gap-4 border-l-4 border-green-600">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 mt-0.5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">{successMessage}</p>
                <p className="text-sm text-green-50 mt-1">Redirecting back to employee list...</p>
              </div>
              <button
                onClick={() => setSuccessMessage('')}
                className="text-green-200 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-10">
          <div className="w-full mx-auto">
            {/* Progress Indicator */}
            <div className="mb-12">
              <div className="flex justify-between items-start mb-6">
                {stepTitles.map((title, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base transition-all shadow-md ${
                        index + 1 === onboardingStep
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-100'
                          : index + 1 < onboardingStep
                          ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1 < onboardingStep ? <span className="text-lg">✓</span> : index + 1}
                    </div>
                    <p className={`text-xs font-semibold mt-3 text-center max-w-[80px] leading-tight transition-colors ${
                      index + 1 <= onboardingStep ? 'text-slate-900' : 'text-gray-400'
                    }`}>
                      {title}
                    </p>
                  </div>
                ))}
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 transition-all duration-500 ease-out"
                  style={{ width: `${((onboardingStep - 1) / (stepTitles.length - 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 mx-6">
              {/* Step 1: Basic Information */}
              {onboardingStep === 1 && (
                <div className="space-y-8">
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold text-gray-900">Basic Information</h2>
                    <p className="text-gray-600 mt-3 text-base">Enter employee's personal, contact, CNIC and bank details</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        Employee ID *
                        {/* <span className="ml-2 text-xs font-normal text-gray-500">(Auto-generated starting from 001)</span> */}
                      </label>
                      <div className="relative">
                        <div className="flex items-center">
                          <span className="absolute left-4 text-slate-700 font-semibold text-base z-10">{EMPLOYEE_ID_PREFIX}-</span>
                          <div className="relative w-full">
                            <input
                              type="text"
                              name="employeeId"
                              value={formData.employeeId}
                              onChange={handleInputChange}
                              // readOnly={!isGeneratingId} // Make it read-only by default, but allow manual override if needed
                              placeholder="Auto-generated"
                              className={`w-full pl-20 pr-12 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all bg-gray-50 ${
                                errors.employeeId ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 
                                employeeIdStatus === 'generated' ? 'border-green-400 bg-green-50' :
                                'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                            />
                            
                            {/* Refresh button to generate new ID */}
                            <button
                              type="button"
                              onClick={handleRefreshId}
                              disabled={isGeneratingId}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                              title="Generate new ID"
                            >
                              <RefreshCw className={`w-4 h-4 text-blue-600 ${isGeneratingId ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Error message */}
                      {errors.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId}</p>}
                      
                     
                      
                      {/* Generating indicator */}
                      {isGeneratingId && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700 font-medium flex items-center gap-1">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generating next available ID...
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          errors.name ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-2 font-medium">{errors.name}</p>}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-3">Email Address *</label>
                      <div className="flex items-center gap-0 rounded-lg overflow-hidden border-2 border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                        <input
                          type="text"
                          name="email"
                          value={formData.email.replace('@digioussolutions.com', '')}
                          onChange={(e) => {
                            const emailPart = e.target.value.replace(/[^a-zA-Z0-9.]/g, '');
                            setFormData({ ...formData, email: emailPart ? `${emailPart}@digioussolutions.com` : '' });
                          }}
                          placeholder="name"
                          className="flex-1 px-4 py-3 bg-white focus:outline-none text-gray-900"
                        />
                        <span className="px-4 py-3 bg-blue-50 border-l border-gray-300 text-gray-700 font-semibold text-sm">@digioussolutions.com</span>
                      </div>
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+92 300 1234567"
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                          errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                        }`}
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">CNIC Number *</label>
                      <input
                        type="text"
                        name="cnic"
                        value={formData.cnic}
                        onChange={handleInputChange}
                        placeholder="e.g. 12345-6789012-3"
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                          errors.cnic ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                        }`}
                      />
                      {errors.cnic && <p className="text-red-500 text-sm mt-1">{errors.cnic}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">CNIC Issue (DD / MM / YYYY) *</label>
                      <div>
                        <input
                          type="date"
                          name="cnic_issue_date"
                          value={formData.cnic_issue_date && /^\d{4}-\d{2}$/.test(formData.cnic_issue_date) ? `${formData.cnic_issue_date}-01` : (formData.cnic_issue_date || '')}
                          onChange={handleInputChange}
                          min="1900-01-01"
                          max="9999-12-31"
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.cnic_issue_date ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'}`}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Pick date (DD / MM / YYYY). Selected: {formatToDDMMYYYY(formData.cnic_issue_date)}</p>
                      {errors.cnic_issue_date && <p className="text-red-500 text-sm mt-1">{errors.cnic_issue_date}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">CNIC Expiry (DD / MM / YYYY) *</label>
                      <div>
                        <input
                          type="date"
                          name="cnic_expiry_date"
                          value={formData.cnic_expiry_date && /^\d{4}-\d{2}$/.test(formData.cnic_expiry_date) ? `${formData.cnic_expiry_date}-01` : (formData.cnic_expiry_date || '')}
                          onChange={handleInputChange}
                          min="1900-01-01"
                          max="9999-12-31"
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.cnic_expiry_date ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'}`}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Pick date (DD / MM / YYYY). Selected: {formatToDDMMYYYY(formData.cnic_expiry_date)}</p>
                      {errors.cnic_expiry_date && <p className="text-red-500 text-sm mt-1">{errors.cnic_expiry_date}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 border-blue-200 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address *</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter full residential address"
                        rows="3"
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                          errors.address ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                        }`}
                      />
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Emergency Contact</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Contact Person Name *</label>
                          <input
                            type="text"
                            name="emergencyContactName"
                            value={formData.emergencyContactName}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                              errors.emergencyContactName ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                            }`}
                          />
                          {errors.emergencyContactName && <p className="text-red-500 text-sm mt-1">{errors.emergencyContactName}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Relationship with Employee *</label>
                          <input
                            type="text"
                            name="emergencyContactRelationship"
                            value={formData.emergencyContactRelationship}
                            onChange={handleInputChange}
                            placeholder="Father, Mother, Spouse"
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                              errors.emergencyContactRelationship ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                            }`}
                          />
                          {errors.emergencyContactRelationship && <p className="text-red-500 text-sm mt-1">{errors.emergencyContactRelationship}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            name="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={handleInputChange}
                            placeholder="+92 300 1234567"
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                              errors.emergencyContact ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                            }`}
                          />
                          {errors.emergencyContact && <p className="text-red-500 text-sm mt-1">{errors.emergencyContact}</p>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Account Title Name *</label>
                      <input
                        type="text"
                        name="account_title_name"
                        value={formData.account_title_name}
                        onChange={handleInputChange}
                        placeholder="Full name as on bank account"
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                          errors.account_title_name ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                        }`}
                      />
                      {errors.account_title_name && <p className="text-red-500 text-sm mt-1">{errors.account_title_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Bank Name *</label>
                      <select
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                          errors.bank_name ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">Select Bank</option>
                        <option value="HBL">Habib Bank Limited (HBL)</option>
                        <option value="NBP">National Bank of Pakistan (NBP)</option>
                        <option value="UBL">United Bank Limited (UBL)</option>
                        <option value="MCB">MCB Bank</option>
                        <option value="Faysal">Faysal Bank</option>
                        <option value="Allied">Allied Bank</option>
                        <option value="SCB">Standard Chartered Bank</option>
                        <option value="Meezan">Meezan Bank</option>
                        <option value="ADIB">Al Baraka Bank</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.bank_name && <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>}
                    </div>

                    {formData.bank_name === 'Other' && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Bank Name *</label>
                        <input
                          type="text"
                          name="custom_bank_name"
                          value={formData.custom_bank_name || ''}
                          onChange={handleInputChange}
                          placeholder="Enter bank name"
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                            errors.custom_bank_name ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                          }`}
                        />
                        {errors.custom_bank_name && <p className="text-red-500 text-sm mt-1">{errors.custom_bank_name}</p>}
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Bank Account Number</label>
                      <input
                        type="text"
                        name="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleInputChange}
                        placeholder="Enter bank account number (optional)"
                        className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Security Setup */}
              {onboardingStep === 2 && (
                <div className="space-y-8">
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold text-gray-900">Security Setup</h2>
                    <p className="text-gray-600 mt-3 text-base">Default password set for new employee accounts</p>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="karachi123"
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 bg-gray-100 rounded-xl focus:outline-none cursor-not-allowed text-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Default password for all new employees</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="karachi123"
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 bg-gray-100 rounded-xl focus:outline-none cursor-not-allowed text-gray-700"
                      />
                      <p className="text-sm text-gray-600 mt-2">Matches the default password</p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">✓ Password Set</p>
                          <p className="text-xs text-gray-600 mt-1">Default password "karachi123" has been assigned. The employee will be required to change their password on first login for security.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Job Details (includes Allowances, Resources, and Employment Dates) */}
              {onboardingStep === 3 && (
                <div className="space-y-10">
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold text-gray-900">Job Details</h2>
                    <p className="text-gray-600 mt-3 text-base">Enter job-related information, employment dates, salary, allowances, and resources</p>
                  </div>

                  {/* Job Information Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3"><span className="w-1 h-8 bg-blue-500 rounded"></span>Job Information</h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Department *</label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                            errors.department ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                          }`}
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                        {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Sub-Department *</label>
                        <input
                          type="text"
                          name="sub_department"
                          value={formData.sub_department}
                          onChange={handleInputChange}
                          placeholder="e.g. Manager, Developer"
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                            errors.sub_department ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                          }`}
                        />
                        {errors.sub_department && <p className="text-red-500 text-sm mt-1">{errors.sub_department}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Employment Status *</label>
                        <select
                          name="employment_status"
                          value={formData.employment_status}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                            errors.employment_status ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                          }`}
                        >
                          <option value="">Select Status</option>
                          <option value="Probation">Probation</option>
                          <option value="Part-Time">Part-Time</option>
                          <option value="Intern">Intern</option>
                          <option value="MTO">MTO</option>
                          <option value="Permanent">Permanent</option>
                        </select>
                        {errors.employment_status && <p className="text-red-500 text-sm mt-1">{errors.employment_status}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Designation</label>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                          placeholder="e.g. Senior Manager"
                          className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Employment Dates Section */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 rounded-xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3"><span className="w-1 h-8 bg-purple-500 rounded"></span>Employment Dates</h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Join Date *</label>
                        <input
                          type="date"
                          name="joinDate"
                          value={formData.joinDate}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                            errors.joinDate ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                          }`}
                        />
                        {errors.joinDate && <p className="text-red-500 text-sm mt-1">{errors.joinDate}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmation Date </label>
                        <input
                          type="date"
                          name="confirmation_date"
                          value={formData.confirmation_date}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                            errors.confirmation_date ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                          }`}
                        />
                        {errors.confirmation_date && <p className="text-red-500 text-sm mt-1">{errors.confirmation_date}</p>}
                        <p className="text-xs text-gray-500 mt-1">Usually 3 months after joining</p>
                      </div>
                    </div>
                  </div>

                  {/* Salary & Allowances Section */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 rounded-xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3"><span className="w-1 h-8 bg-green-500 rounded"></span>Salary & Allowances</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Base Salary *</label>
                        <input
                          type="number"
                          name="baseSalary"
                          value={formData.baseSalary}
                          onChange={handleInputChange}
                          placeholder="75000"
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                            errors.baseSalary ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                          }`}
                        />
                        {errors.baseSalary && <p className="text-red-500 text-sm mt-1">{errors.baseSalary}</p>}
                      </div>

                      <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Allowance Name</label>
                              <input
                                type="text"
                                name="allowanceName"
                                value={formData.allowanceName}
                                onChange={handleInputChange}
                                placeholder="e.g., Housing Allowance"
                                className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
                              <input
                                type="number"
                                name="allowanceAmount"
                                value={formData.allowanceAmount}
                                onChange={handleInputChange}
                                placeholder="5000"
                                className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={addAllowance}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2"
                          >
                            <Plus className="w-5 h-5" />
                            Add Allowance
                          </button>
                        </div>
                      </div>

                      {formData.allowances.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-900">Current Allowances</h4>
                          {formData.allowances.map((allowance, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <div>
                                <p className="font-semibold text-gray-900">{allowance.name}</p>
                                <p className="text-sm text-gray-600">PKR {Number(allowance.amount).toLocaleString()}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAllowance(index)}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resources Section */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-100 rounded-xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3"><span className="w-1 h-8 bg-orange-500 rounded"></span>Resources & Equipment</h3>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="border-b border-gray-200 pb-6">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Add Custom Resources</h4>
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            name="newResourceName"
                            value={formData.newResourceName}
                            onChange={handleInputChange}
                            placeholder="Resource name (e.g., Headphones, Monitor Stand, Docking Station)"
                            className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="newResourceSerial"
                            value={formData.newResourceSerial}
                            onChange={handleInputChange}
                            placeholder="Serial/Model (optional)"
                            className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={addDynamicResource}
                            disabled={!formData.newResourceName.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 text-sm font-medium transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Display Added Custom Resources */}
                        {formData.dynamicResources.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {formData.dynamicResources.map((resource) => (
                              <div key={resource.id} className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">{resource.name}</p>
                                  <p className="text-xs text-gray-500">{resource.serial}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeDynamicResource(resource.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                                  title="Remove resource"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                        <textarea
                          name="resourcesNote"
                          value={formData.resourcesNote}
                          onChange={handleInputChange}
                          placeholder="Add notes about the resource allocation or special instructions"
                          className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 border-blue-200"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Confirm */}
              {onboardingStep === 4 && (
                <div className="space-y-8">
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold text-gray-900">Review & Confirm</h2>
                    <p className="text-gray-600 mt-3 text-base">Please review all information before submitting</p>
                  </div>

                  {errors.submit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-red-700 font-medium">{errors.submit}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Employee ID</p>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {EMPLOYEE_ID_PREFIX}-{formData.employeeId}
                        <span className="ml-2 text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full">Auto-generated (starting from 001)</span>
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Full Name</p>
                      <p className="text-lg font-bold text-gray-900 mt-2">{formData.name}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Email</p>
                      <p className="text-lg font-bold text-gray-900 mt-2">{formData.email}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Department</p>
                      <p className="text-lg font-bold text-gray-900 mt-2">{formData.department}</p>
                    </div>
                    {formData.sub_department && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Sub-Department</p>
                        <p className="text-lg font-bold text-gray-900 mt-2">{formData.sub_department}</p>
                      </div>
                    )}

                    {formData.employment_status && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Employment Status</p>
                        <p className="text-lg font-bold text-gray-900 mt-2">{formData.employment_status}</p>
                      </div>
                    )}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Join Date</p>
                      <p className="text-lg font-bold text-gray-900 mt-2">{formData.joinDate}</p>
                    </div>
                    <div className="col-span-2 p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Salary Breakdown</p>
                      <div className="mt-3 space-y-3 p-3 bg-white rounded-lg border border-gray-200">
                        {/* Base Salary */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-700">Base Salary:</p>
                          <p className="text-sm font-bold text-gray-900">PKR {Number(formData.baseSalary || 0).toLocaleString()}</p>
                        </div>

                        {/* Allowed Allowances */}
                        {formData.allowances && formData.allowances.length > 0 && (
                          <>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Allowed Allowances:</p>
                              {formData.allowances.map((a, i) => (
                                <div key={i} className="flex justify-between items-center text-sm ml-2 pl-2 border-l-2 border-blue-300">
                                  <span className="text-gray-700">{a.name}</span>
                                  <span className="font-semibold text-gray-900">PKR {Number(a.amount || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Allowances Subtotal */}
                            <div className="flex justify-between items-center py-2 px-2 bg-blue-50 rounded border border-blue-200">
                              <p className="text-sm font-semibold text-gray-700">Total Allowances:</p>
                              <p className="text-sm font-bold text-blue-600">PKR {formData.allowances.reduce((sum, a) => sum + (Number(a.amount || 0)), 0).toLocaleString()}</p>
                            </div>
                          </>
                        )}

                        {/* Total Compensation */}
                        <div className="flex justify-between items-center pt-2 border-t-2 border-gray-400">
                          <p className="text-sm font-bold text-gray-900">Total Compensation:</p>
                          <p className="text-lg font-bold text-green-600">PKR {computeTotalSalary().toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Phone</p>
                      <p className="text-lg font-bold text-gray-900 mt-2">{formData.phone}</p>
                    </div>
                    {formData.cnic && (
                      <>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">CNIC</p>
                          <p className="text-lg font-bold text-gray-900 mt-2">{formData.cnic}</p>
                        </div>

                        {formData.cnic_issue_date && (
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">CNIC Issue</p>
                            <p className="text-lg font-bold text-gray-900 mt-2">{formatMonthYear(formData.cnic_issue_date)}</p>
                          </div>
                        )}

                        {formData.cnic_expiry_date && (
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">CNIC Expiry</p>
                            <p className="text-lg font-bold text-gray-900 mt-2">{formatMonthYear(formData.cnic_expiry_date)}</p>
                          </div>
                        )}
                      </>
                    )}

                    {formData.dob && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Date of Birth</p>
                        <p className="text-lg font-bold text-gray-900 mt-2">{formData.dob}</p>
                      </div>
                    )}

                    {(formData.emergencyContactName || formData.emergencyContactRelationship || formData.emergencyContact) && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Emergency Contact</p>
                        <div className="mt-2 space-y-1">
                          {formData.emergencyContactName && <p className="text-sm font-medium text-gray-900">Name: {formData.emergencyContactName}</p>}
                          {formData.emergencyContactRelationship && <p className="text-sm font-medium text-gray-900">Relationship: {formData.emergencyContactRelationship}</p>}
                          {formData.emergencyContact && <p className="text-sm font-medium text-gray-900">Phone: {formData.emergencyContact}</p>}
                        </div>
                      </div>
                    )}

                    {formData.address && (
                      <div className="col-span-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Address</p>
                        <p className="text-lg font-bold text-gray-900 mt-2">{formData.address}</p>
                      </div>
                    )}

                    {formData.requestPasswordChange && (
                      <div className="col-span-2 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="font-semibold text-orange-900">Password change required</p>
                          <p className="text-sm text-orange-700">Employee must change password on first login</p>
                        </div>
                      </div>
                    )}

                    {formData.dynamicResources.length > 0 && (
                      <div className="col-span-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Resources Issued</p>
                        <div className="mt-3 grid gap-2">
                          {formData.dynamicResources.map((resource) => (
                            <div key={resource.id} className="flex items-center justify-between text-sm">
                              <div>
                                <div className="font-medium text-gray-800">{resource.name}</div>
                                {resource.serial && <div className="text-xs text-gray-500">{resource.serial}</div>}
                              </div>
                              <div>
                                <button
                                  type="button"
                                  disabled
                                  className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-xs"
                                >
                                  Issued
                                </button>
                              </div>
                            </div>
                          ))}

                          {formData.resourcesNote && (
                            <div className="text-sm text-gray-700 mt-2 pt-2 border-t border-gray-200">Note: {formData.resourcesNote}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-4 mt-14 pt-10 border-t-2 border-gray-200">
                <button
                  onClick={handlePreviousStep}
                  disabled={onboardingStep === 1}
                  className={`px-10 py-3 rounded-lg font-semibold transition-all text-base ${
                    onboardingStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
                  }`}
                >
                  ← Previous
                </button>

                {onboardingStep === 4 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className={`flex items-center gap-3 px-10 py-3 rounded-lg font-semibold text-base transition-all ${
                      isLoading
                        ? 'bg-gray-400 text-white cursor-not-allowed opacity-75'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Complete Onboarding
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-10 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-xl transition-all font-semibold text-base hover:scale-105"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>

            {/* Recently Onboarded Employees Table */}
            {employees.length > 0 && (
              <div className="mt-14 mx-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Recently Onboarded Employees</h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                          <th className="px-6 py-4 text-left text-sm font-semibold">Employee ID</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Sub-Department</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Base Salary</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Total Compensation</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Resources</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((emp, index) => (
                          <tr key={emp.id} className={`border-t border-gray-200 hover:bg-blue-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{emp.employeeId}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{emp.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.department}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.sub_department || ''}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">PKR {Number(emp.baseSalary || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm font-bold text-green-600">PKR {Number(emp.totalCompensation || emp.baseSalary || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm">
                              {(
                                (emp.laptop ? 1 : 0) +
                                (emp.charger ? 1 : 0) +
                                (emp.mouse ? 1 : 0) +
                                (emp.keyboard ? 1 : 0) +
                                (emp.monitor ? 1 : 0) +
                                (emp.other ? 1 : 0)
                              ) > 0 ? (
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                  {(
                                    (emp.laptop ? 1 : 0) +
                                    (emp.charger ? 1 : 0) +
                                    (emp.mouse ? 1 : 0) +
                                    (emp.keyboard ? 1 : 0) +
                                    (emp.monitor ? 1 : 0) +
                                    (emp.other ? 1 : 0)
                                  )} items
                                </span>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                {emp.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboarding;