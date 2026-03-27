import React, { useState, useEffect } from "react";
import {
  Link, User, Mail, Phone, MapPin, Briefcase, Building, Calendar,
  Heart, Shield, Lock, Settings, Download, Edit, X, Upload, Camera,
  Globe, CheckCircle, FileText, Eye, Share2, Printer, Clock, CreditCard,
  Zap, AlertCircle, Pencil, Save, TrendingUp, Award, DollarSign,
  Linkedin, Github, ExternalLink, Users,
  ChevronRight, Plus, Trash2, GraduationCap, Star, Calendar as CalendarIcon
} from "lucide-react";
import toast from 'react-hot-toast';
import EmployeeProfileService from "../services/employeeProfileService";
import config from '../config/api';

const EmployeePersonalProfileV2 = ({ employeeId: propsEmployeeId, onBack }) => {
  // Get employeeId from props or from localStorage (logged-in user)
  const [employeeId, setEmployeeId] = useState(() => {
    if (propsEmployeeId) return propsEmployeeId;
    
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.employeeId || user.employee_id || user.id;
      }
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Editable sections (only these should be editable when in edit mode)
  const editableSections = ['contact', 'skills', 'emergency', 'social', 'documents', 'achievements'];
  const canEdit = (section) => isEditing && editableSections.includes(section);

  // Local inputs for skills & achievements
  const [newTechSkill, setNewTechSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newAchievement, setNewAchievement] = useState({ name: '', issuer: '', issueDate: '', expiryDate: '' });
  const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '' });

  // API Configuration - use centralized config
  const API_BASE_URL = config.FULL_API_URL;

  // Fetch employee profile from database views
  const fetchEmployeeProfile = async (empId) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile summary from API
      const profileResponse = await EmployeeProfileService.getProfileSummary(empId);
      
      if (!profileResponse.success) {
        throw new Error(profileResponse.message || 'Failed to load profile');
      }

      const profileData = profileResponse.data?.profile;

      // Parse JSON fields - handle double-escaped strings
      let documents = [];
      let resources = [];
      
      // Helper function to safely parse JSON with double-escaped handling
      const safeJsonParse = (jsonString) => {
        if (!jsonString) return [];
        try {
          let parsed = JSON.parse(jsonString);
          // If it's an array containing a single stringified value, parse again
          if (Array.isArray(parsed) && parsed.length === 1 && typeof parsed[0] === 'string') {
            parsed = JSON.parse(parsed[0]);
          }
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn('JSON parse error:', e);
          return [];
        }
      };
      
      documents = profileData?.documents_json ? safeJsonParse(profileData.documents_json) : [];
      resources = profileData?.resources_json ? safeJsonParse(profileData.resources_json) : [];

      // Try fetching onboarding details (CNIC, additional resources, allowances, etc.)
      let onboardingDetails = {};
      let financialSummary = {};
      let dynamicResources = [];
      let resourcesMessage = '';
      let skillsData = { technical: [], soft: [] };
      let socialLinksData = {};
      let requiredDocumentsData = [];
      let achievementsData = [];

      // Parallelize all independent fetches for faster profile loading
      const [onboardingResult, finResult, resResult, skillsResult, socialResult, docsResult, achResult] = await Promise.allSettled([
        // 1. Onboarding details
        fetch(`${API_BASE_URL}/employees/${empId}`).then(r => r.json()).catch(e => ({ success: false })),
        // 2. Financial summary
        EmployeeProfileService.getFinancialSummary(empId).catch(e => ({ success: false })),
        // 3. Dynamic resources
        EmployeeProfileService.getEmployeeResources(empId).catch(e => ({ success: false })),
        // 4. Skills
        EmployeeProfileService.getEmployeeSkills(empId).catch(e => ({ success: false })),
        // 5. Social links
        EmployeeProfileService.getEmployeeSocialLinks(empId).catch(e => ({ success: false })),
        // 6. Required documents
        EmployeeProfileService.getEmployeeRequiredDocuments(empId).catch(e => ({ success: false })),
        // 7. Achievements
        EmployeeProfileService.getEmployeeAchievements(empId).catch(e => ({ success: false })),
      ]);

      // Process onboarding
      if (onboardingResult.status === 'fulfilled') {
        const onboardingJson = onboardingResult.value;
        if (onboardingJson?.success) onboardingDetails = onboardingJson.data || {};
      }

      // Process financial summary
      if (finResult.status === 'fulfilled' && finResult.value?.success && finResult.value?.data) {
        financialSummary = finResult.value.data;
      }

      // Process dynamic resources
      if (resResult.status === 'fulfilled' && resResult.value?.success) {
        dynamicResources = resResult.value.data || [];
        resourcesMessage = resResult.value.message || '';
      }

      // Process skills
      if (skillsResult.status === 'fulfilled' && skillsResult.value?.success && skillsResult.value?.data) {
        skillsData = {
          technical: Array.isArray(skillsResult.value.data.technical) ? skillsResult.value.data.technical : [],
          soft: Array.isArray(skillsResult.value.data.soft) ? skillsResult.value.data.soft : []
        };
      } else if (profileData?.skills_json) {
        try {
          const parsed = JSON.parse(profileData.skills_json);
          skillsData = {
            technical: Array.isArray(parsed?.technical) ? parsed.technical : [],
            soft: Array.isArray(parsed?.soft) ? parsed.soft : []
          };
        } catch (parseErr) {
          skillsData = { technical: [], soft: [] };
        }
      }

      // Process social links
      if (socialResult.status === 'fulfilled' && socialResult.value?.success && socialResult.value?.data) {
        socialLinksData = socialResult.value.data;
      } else if (profileData?.social_links_json) {
        try {
          socialLinksData = JSON.parse(profileData.social_links_json);
        } catch (parseErr) {
          socialLinksData = {};
        }
      }

      // Process required documents
      if (docsResult.status === 'fulfilled' && docsResult.value?.success && docsResult.value?.data) {
        requiredDocumentsData = Array.isArray(docsResult.value.data) ? docsResult.value.data : [];
      } else if (profileData?.required_documents_json) {
        try {
          requiredDocumentsData = JSON.parse(profileData.required_documents_json);
        } catch (parseErr) {
          requiredDocumentsData = [];
        }
      }

      // Process achievements
      if (achResult.status === 'fulfilled' && achResult.value?.success && achResult.value?.data) {
        achievementsData = Array.isArray(achResult.value.data) ? achResult.value.data : [];
      } else if (profileData?.achievements_json) {
        try {
          achievementsData = JSON.parse(profileData.achievements_json);
        } catch (parseErr) {
          achievementsData = [];
        }
      }

      // Transform to component format (nested structure expected by the UI)
      // Clean dynamic resources - remove empty/deprecated entries
      const dynamicResourcesClean = Array.isArray(dynamicResources) ? dynamicResources.filter(r => r && (r.resource_name || r.name || r.title)) : [];

      // Normalize profile/onboarding fallback resources and filter out empty entries
      const profileResourcesArray = Array.isArray(resources) ? resources.slice() : (resources ? [resources] : []);
      const profileResourcesClean = profileResourcesArray.filter(item => item && Object.values(item).some(v => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)));

      const onboardingResourcesArray = Array.isArray(onboardingDetails.resources) ? onboardingDetails.resources.slice() : (onboardingDetails.resources ? [onboardingDetails.resources] : []);
      const onboardingResourcesClean = onboardingResourcesArray.filter(item => item && Object.values(item).some(v => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)));

      const finalFallbackResources = profileResourcesClean.length ? profileResourcesClean : (onboardingResourcesClean.length ? onboardingResourcesClean : []);

      const resourcesSource = dynamicResourcesClean.length > 0 ? 'employee_dynamic_resources' : (finalFallbackResources.length ? 'profile_resources' : null);
      const bankParts = (profileData?.bank_accounts_summary || onboardingDetails.bank_account || '').split('|');
      const transformedEmployee = {
        id: profileData?.id || onboardingDetails.id,

        basicInfo: {
          name: profileData?.name || profileData?.full_name || (profileData?.first_name ? `${profileData.first_name} ${profileData.last_name || ''}` : null),
          employeeId: profileData?.employee_id,
          email: profileData?.email,
          phone: profileData?.phone,
          personalPhone: profileData?.personal_phone || null,
          dateOfBirth: profileData?.date_of_birth || null,
          age: profileData?.age || null,
          // Use profile_photo (from backend) or fallback to profile_image for compatibility
          profileImage: profileData?.profile_photo || profileData?.profile_image || null,
        },

        professionalInfo: {
          role: profileData?.designation || null,
          department: profileData?.department || null,
          reportingTo: profileData?.reporting_to || null,
          employmentStatus: profileData?.employment_status || profileData?.status || null,
          employeeType: profileData?.employee_type || profileData?.status || null,
          joiningDate: profileData?.join_date || null,
          workMode: profileData?.work_mode_preference || null,
          officeLocation: profileData?.office_location || null,
        },

        profile: {
          bio: profileData?.bio,
          bannerImage: profileData?.banner_url,
          preferredContactMethod: profileData?.preferred_contact_method,
          workModePreference: profileData?.work_mode_preference,
          preferredWorkLocation: profileData?.preferred_work_location,
        },

        personalDetails: {
          emergencyContactPhone: profileData?.emergency_contact_phone,
          // Prefer address from merged profile, fallback to onboarding details (single source of truth)
          address: profileData?.address || onboardingDetails.address || null,
          linkedin: profileData?.linkedin_url,
          github: profileData?.github_url,
          portfolio: profileData?.portfolio_url,
        },

        bankInfo: {
          accountNumber: financialSummary?.bank_account?.account_number_masked || (onboardingDetails?.bank_account ? `****${(onboardingDetails.bank_account || '').slice(-4)}` : null),
          bankName: financialSummary?.bank_account?.bank_name || onboardingDetails?.bank_name || null,
          accountType: financialSummary?.bank_account?.account_type || onboardingDetails?.account_type || null,
          accountTitle: financialSummary?.bank_account?.account_title_name || onboardingDetails?.account_title_name || null,
        },

        financialInfo: {
          bankAccountSummary: profileData?.bank_accounts_summary,
          // Use financial summary values (base salary, total allowances) with fallback to onboarding
          baseSalary: financialSummary?.base_salary ? Number(financialSummary.base_salary) : (onboardingDetails?.base_salary ? Number(onboardingDetails.base_salary) : null),
          totalAllowances: financialSummary?.total_allowances !== undefined ? Number(financialSummary.total_allowances) : 0,
          allowancesList: Array.isArray(financialSummary?.allowances) ? financialSummary.allowances.map(a => ({
            name: a.name || a.allowance_name || '',
            amount: Number(a.amount || a.allowance_amount || 0)
          })) : []
        },

        // Merge CNIC and other onboarding fields into personalDetails
        documents,
        // Prefer dynamic resources from employee_dynamic_resources table, fallback to profile/onboarding resources (cleaned)
        resources: dynamicResourcesClean.length > 0 ? dynamicResourcesClean.map(r => ({
          id: r.id,
          resource_name: r.resource_name || r.name || r.title,
          title: r.resource_name || r.name || r.title,
          type: 'equipment',
          resource_serial: r.resource_serial || r.serial || null,
          serial: r.resource_serial || r.serial || null,
          created_at: r.created_at || null,
          issuedAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : null
        })) : (finalFallbackResources.length ? finalFallbackResources : []),
        resourcesSource: resourcesSource,
        resourcesMessage: resourcesMessage, 
        achievements: achievementsData,
        profileCompleteness: profileResponse.data?.metadata?.profile_completeness || 0,

        // Parse skills from API endpoint or fallback to skills_json field
        skills: skillsData,

        // Social links and required documents
        socialLinks: socialLinksData,
        requiredDocuments: requiredDocumentsData,

        // Add onboarding-specific quick fields
        personalIdentifiers: {
          cnic: onboardingDetails.cnic || null,
          cnicIssueDate: onboardingDetails.cnic_issue_date || onboardingDetails.cnicIssueDate || null,
          cnicExpiryDate: onboardingDetails.cnic_expiry_date || onboardingDetails.cnicExpiryDate || null,
        }
      };

      // Normalize arrays to avoid runtime errors when backend returns single objects or unexpected types
      transformedEmployee.documents = Array.isArray(transformedEmployee.documents) ? transformedEmployee.documents : (transformedEmployee.documents ? [transformedEmployee.documents] : []);
      transformedEmployee.resources = Array.isArray(transformedEmployee.resources) ? transformedEmployee.resources : (transformedEmployee.resources ? [transformedEmployee.resources] : []);
      transformedEmployee.achievements = Array.isArray(transformedEmployee.achievements) ? transformedEmployee.achievements : (transformedEmployee.achievements ? [transformedEmployee.achievements] : []);
      transformedEmployee.requiredDocuments = Array.isArray(transformedEmployee.requiredDocuments) ? transformedEmployee.requiredDocuments : (transformedEmployee.requiredDocuments ? [transformedEmployee.requiredDocuments] : []);
      transformedEmployee.socialLinks = transformedEmployee.socialLinks && typeof transformedEmployee.socialLinks === 'object' ? transformedEmployee.socialLinks : {};
      transformedEmployee.financialInfo = transformedEmployee.financialInfo || {};
      transformedEmployee.financialInfo.allowancesList = Array.isArray(transformedEmployee.financialInfo.allowancesList) ? transformedEmployee.financialInfo.allowancesList : (transformedEmployee.financialInfo.allowancesList ? [transformedEmployee.financialInfo.allowancesList] : []);
      // Ensure skills structure
      transformedEmployee.skills = transformedEmployee.skills || { technical: [], soft: [] };
      transformedEmployee.skills.technical = Array.isArray(transformedEmployee.skills.technical) ? transformedEmployee.skills.technical : (transformedEmployee.skills.technical ? [transformedEmployee.skills.technical] : []);
      transformedEmployee.skills.soft = Array.isArray(transformedEmployee.skills.soft) ? transformedEmployee.skills.soft : (transformedEmployee.skills.soft ? [transformedEmployee.skills.soft] : []);

      setEmployee(transformedEmployee);
    } catch (err) {
      console.error("Error fetching employee profile:", err);
      setError(err.message || "Failed to load employee profile");
    } finally {
      setLoading(false);
    }
  };

  // Save employee profile changes
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Prepare payload for employee_profiles (profile-related fields)
      const profilePayload = {
        bio: employee.profile?.bio || null,
        emergency_contact_phone: employee.personalDetails?.emergencyContactPhone || null,
        preferred_contact_method: employee.profile?.preferredContactMethod || null,
        linkedin_url: employee.personalDetails?.linkedin || null,
        github_url: employee.personalDetails?.github || null,
        portfolio_url: employee.personalDetails?.portfolio || null,
        preferred_work_location: employee.profile?.preferredWorkLocation || null,
        work_mode_preference: employee.profile?.workModePreference || null,
        // Send skills as object (backend will stringify)
        skills_json: { technical: employee?.skills?.technical || [], soft: employee?.skills?.soft || [] },
        documents_json: employee.documents || [],
        resources_json: employee.resources || [],
      };

      // Prepare payload for onboarding (contact info stored there)
      const onboardingPayload = {};
      if (employee?.basicInfo?.email) onboardingPayload.email = employee.basicInfo.email;
      if (employee?.basicInfo?.phone) onboardingPayload.phone = employee.basicInfo.phone;
      if (employee?.basicInfo?.personalPhone) onboardingPayload.personal_phone = employee.basicInfo.personalPhone;
      if (employee?.personalDetails?.address) onboardingPayload.address = employee.personalDetails.address;

      // If onboarding fields to update, call onboarding API
      if (Object.keys(onboardingPayload).length > 0) {
        const res = await fetch(`${API_BASE_URL}/employees/${employee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(onboardingPayload)
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to update onboarding (contact info)');
        }
      }

      // Call API to update profile fields
      const result = await EmployeeProfileService.updateProfile(employee.id, profilePayload);

      if (!result.success) {
        throw new Error(result.message || 'Failed to save profile');
      }

      // Prepare and update social links from personalDetails (linkedin, github, portfolio)
      const socialLinksFromPersonal = {
        linkedin: employee.personalDetails?.linkedin ? { url: employee.personalDetails.linkedin } : null,
        github: employee.personalDetails?.github ? { url: employee.personalDetails.github } : null,
        portfolio: employee.personalDetails?.portfolio ? { url: employee.personalDetails.portfolio } : null,
      };
      
      // Filter out null values
      const socialLinksToSave = Object.fromEntries(
        Object.entries(socialLinksFromPersonal).filter(([_, v]) => v !== null)
      );

      if (Object.keys(socialLinksToSave).length > 0) {
        console.log('Updating social links from personalDetails:', socialLinksToSave);
        const socialLinksResult = await EmployeeProfileService.updateEmployeeSocialLinks(employee.id, socialLinksToSave);
        if (!socialLinksResult.success) {
          console.warn('Warning: Social links update may have failed:', socialLinksResult.message);
        }
      }

      // Also update any additional social links from employee.socialLinks if they exist
      // Filter out empty values to avoid overwriting data with blank strings
      if (employee.socialLinks && Object.keys(employee.socialLinks).length > 0) {
        const filteredAdditionalLinks = Object.fromEntries(
          Object.entries(employee.socialLinks).filter(([key, value]) => {
            // Keep entries that have a URL or object with a URL
            if (typeof value === 'object' && value !== null && value.url) {
              return true;
            }
            // Keep string entries that are not empty
            if (typeof value === 'string' && value.trim() !== '') {
              return true;
            }
            // Skip arrays, empty values, and false-y values
            return false;
          })
        );

        if (Object.keys(filteredAdditionalLinks).length > 0) {
          console.log('Updating additional social links:', filteredAdditionalLinks);
          const additionalSocialLinksResult = await EmployeeProfileService.updateEmployeeSocialLinks(employee.id, filteredAdditionalLinks);
          if (!additionalSocialLinksResult.success) {
            console.warn('Warning: Additional social links update may have failed:', additionalSocialLinksResult.message);
          }
        }
      }

      // Update achievements if they were edited
      // Filter out empty/incomplete achievements to avoid saving invalid data
      if (employee.achievements && Array.isArray(employee.achievements) && employee.achievements.length > 0) {
        // Only keep achievements with at least a title (required field)
        const validAchievements = employee.achievements.filter(ach => 
          ach && (ach.title || ach.name) && 
          (ach.title?.trim() || ach.name?.trim())
        );
        
        if (validAchievements.length > 0) {
          // Normalize fields to backend expected shape
          const normalizedAchievements = validAchievements.map(normalizeAchievements);
          console.log('Updating achievements (normalized):', normalizedAchievements);
          const achievementsResult = await EmployeeProfileService.updateEmployeeAchievements(employee.id, normalizedAchievements);
          if (!achievementsResult.success) {
            console.warn('Warning: Achievements update may have failed:', achievementsResult.message);
          }
        }
      }

      // Update required documents if they were edited
      // Filter out empty/incomplete documents to avoid saving invalid data
      if (employee.requiredDocuments && Array.isArray(employee.requiredDocuments) && employee.requiredDocuments.length > 0) {
        // Only keep documents with at least a name/type and some meaningful data
        const validDocuments = employee.requiredDocuments.filter(doc =>
          doc && (
            (doc.document_name && doc.document_name.trim()) ||
            (doc.name && doc.name.trim()) ||
            (doc.document_type && doc.document_type.trim())
          )
        );
        
        if (validDocuments.length > 0) {
          console.log('Updating required documents:', validDocuments);
          const docsResult = await EmployeeProfileService.updateEmployeeRequiredDocuments(employee.id, validDocuments);
          if (!docsResult.success) {
            console.warn('Warning: Required documents update may have failed:', docsResult.message);
          }
        }
      }

      setSuccessMessage('Profile saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Wait 500ms for database transactions to complete, then refresh
      console.log('⏳ Waiting 500ms for database transactions to complete...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 Refreshing employee profile...');
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

  // Date formatter helper - returns localized human-friendly date or '—' when missing
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }; 

  // Skills helpers
  const addTechSkill = () => {
    if (!newTechSkill.trim()) return;
    setEmployee(prev => ({
      ...prev,
      skills: {
        technical: [ ...(prev.skills?.technical || []), newTechSkill.trim() ],
        soft: [ ...(prev.skills?.soft || []) ]
      }
    }));
    setNewTechSkill('');
  };

  const removeTechSkill = (index) => {
    setEmployee(prev => ({
      ...prev,
      skills: {
        technical: (prev.skills?.technical || []).filter((_, i) => i !== index),
        soft: [ ...(prev.skills?.soft || []) ]
      }
    }));
  };

  const addSoftSkill = () => {
    if (!newSoftSkill.trim()) return;
    setEmployee(prev => ({
      ...prev,
      skills: {
        technical: [ ...(prev.skills?.technical || []) ],
        soft: [ ...(prev.skills?.soft || []), newSoftSkill.trim() ]
      }
    }));
    setNewSoftSkill('');
  };

  const removeSoftSkill = (index) => {
    setEmployee(prev => ({
      ...prev,
      skills: {
        technical: [ ...(prev.skills?.technical || []) ],
        soft: (prev.skills?.soft || []).filter((_, i) => i !== index)
      }
    }));
  };

  // Banner, Profile and Documents state
  const [bannerFile, setBannerFile] = useState(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [avatarKey, setAvatarKey] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState("");
  const [docDesc, setDocDesc] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  
  // Required documents state
  const [requiredDocFile, setRequiredDocFile] = useState(null);
  const [requiredDocName, setRequiredDocName] = useState("");
  const [isUploadingReqDoc, setIsUploadingReqDoc] = useState(false);

  // Banner select handler
  const handleBannerSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    // show preview immediately
    const url = URL.createObjectURL(file);
    updateEmployeeField('profile.bannerImage', url);
  };

  const uploadBanner = async () => {
    if (!bannerFile || !employee) return;
    try {
      setIsUploadingBanner(true);
      setError(null);

      const result = await EmployeeProfileService.uploadBanner(employee.id, bannerFile);

      if (!result.success) {
        throw new Error(result.message || 'Banner upload failed');
      }

      setSuccessMessage('Banner uploaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Update employee data with new banner URL
      setEmployee(prev => ({
        ...prev,
        profile: { ...prev.profile, bannerImage: result.data.banner_url }
      }));

      setBannerFile(null);
    } catch (err) {
      console.error('Error uploading banner:', err);
      setError(err.message || 'Failed to upload banner');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Profile photo select handler
  const handleProfileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setProfileFile(file);
    // show preview immediately
    const url = URL.createObjectURL(file);
    updateEmployeeField('basicInfo.profileImage', url);
  };

  const uploadProfile = async () => {
    if (!profileFile || !employee) return;
    try {
      setIsUploadingProfile(true);
      setError(null);

      const result = await EmployeeProfileService.uploadProfilePhoto(employee.id, profileFile);

      if (!result.success) {
        throw new Error(result.message || 'Profile upload failed');
      }

      setSuccessMessage('Profile photo uploaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Update employee data with new profile image URL and bump avatarKey to bust cache
      // Update avatar cache key and re-fetch served profile to ensure canonical data
      setAvatarKey(Date.now());
      try {
        await fetchEmployeeProfile(employee.id);
      } catch (e) {
        // fallback to updating locally if refetch fails
        setEmployee(prev => ({
          ...prev,
          basicInfo: { ...prev.basicInfo, profileImage: result.data.profile_photo_url }
        }));
      }
      setAvatarKey(Date.now());

      // Clear selected file (triggers a re-fetch via effect)
      setProfileFile(null);
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      setError(err.message || 'Failed to upload profile photo');
    } finally {
      setIsUploadingProfile(false);
    }
  };

  // Make sure to re-fetch profile after successful upload to avoid stale URLs/cache issues
  useEffect(() => {
    // When profileFile is cleared after a successful upload, refresh data
    if (!profileFile && employee && employee.id) {
      // slight debounce to allow DB propagation
      const t = setTimeout(() => fetchEmployeeProfile(employee.id), 400);
      return () => clearTimeout(t);
    }
  }, [profileFile]);

  // Document upload handlers
  const handleDocFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setDocFile(file);
  };

  const uploadDocument = async () => {
    if (!docFile || !docType || !employee) {
      setError('Please select a document file and type');
      return;
    }
    try {
      setIsUploadingDoc(true);
      setError(null);

      // Prepare document for upload (match service expected format)
      const documentsToUpload = [{
        imageFile: docFile,
        title: docDesc || docFile.name,
        type: docType
      }];

      // Use the service to upload document
      const result = await EmployeeProfileService.uploadDocuments(employee.id, documentsToUpload);

      if (!result.success) {
        throw new Error(result.message || 'Document upload failed');
      }

      setSuccessMessage('Document uploaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Create document object from response
      const uploadedDoc = {
        id: Date.now(),
        fileName: docFile.name,
        type: docType,
        description: docDesc,
        uploadedAt: new Date().toISOString(),
        url: result.data.documents && result.data.documents[0] ? result.data.documents[0].url : URL.createObjectURL(docFile),
      };

      // Add to local state
      setEmployee(prev => ({
        ...prev,
        documents: [...(prev.documents || []), uploadedDoc]
      }));

      // Reset form
      setDocFile(null);
      setDocType('');
      setDocDesc('');
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.message || 'Document upload failed');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Remove document
  const removeDocument = (docId) => {
    setEmployee(prev => ({ ...prev, documents: (prev.documents || []).filter(d => d.id !== docId) }));
  };

  // Required Documents Upload Handler
  const handleRequiredDocFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setRequiredDocFile(file);
  };

  const uploadRequiredDocument = async () => {
    if (!requiredDocFile || !requiredDocName.trim() || !employee) {
      setError('Please select a document file and enter document name');
      return;
    }
    try {
      setIsUploadingReqDoc(true);
      setError(null);

      // Prepare document for upload
      const documentsToUpload = [{
        file: requiredDocFile,
        document_type: requiredDocName.trim(),
        document_name: requiredDocName.trim(),
        name: requiredDocName.trim()
      }];

      // Use the service to upload required documents
      const result = await EmployeeProfileService.uploadRequiredDocuments(employee.id, documentsToUpload);

      if (!result.success) {
        throw new Error(result.message || 'Required document upload failed');
      }

      setSuccessMessage('Required document uploaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh employee data to show newly uploaded document
      await fetchEmployeeProfile(employee.id);

      // Reset form
      setRequiredDocFile(null);
      setRequiredDocName('');
    } catch (err) {
      console.error('Error uploading required document:', err);
      setError(err.message || 'Required document upload failed');
    } finally {
      setIsUploadingReqDoc(false);
    }
  };

  // Resource management (equipment, documents, other)
  const [resourceType, setResourceType] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [resourceSerial, setResourceSerial] = useState('');
  const [resourceIssuedAt, setResourceIssuedAt] = useState('');
  const [resourceFile, setResourceFile] = useState(null);

  const handleResourceFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setResourceFile(f || null);
  };

  const addResource = async () => {
    if (!resourceType || !resourceName) {
      setError('Please provide resource type and name');
      return;
    }

    // Simulated add - in production, POST to server and return created resource with id & url
    const newRes = {
      id: Date.now(),
      title: resourceName,
      type: resourceType === 'document' ? 'document' : (resourceType === 'equipment' ? 'equipment' : 'other'),
      serial: resourceSerial || null,
      status: resourceType === 'equipment' ? 'Issued' : null,
      issuedAt: resourceIssuedAt || (resourceType === 'equipment' ? new Date().toISOString().split('T')[0] : null),
      url: resourceFile ? URL.createObjectURL(resourceFile) : (resourceType === 'document' ? null : null)
    };

    setEmployee(prev => ({ ...prev, resources: [ ...(prev.resources || []), newRes ] }));

    // reset inputs
    setResourceType(''); setResourceName(''); setResourceSerial(''); setResourceIssuedAt(''); setResourceFile(null);
  };

  const removeResource = (resId) => {
    setEmployee(prev => ({ ...prev, resources: (prev.resources || []).filter(r => r.id !== resId) }));
  }; 

  // Achievement helpers
  const normalizeAchievements = (ach) => ({
    title: ach.title || ach.name || '',
    achievement_type: ach.achievement_type || ach.type || 'certification',
    description: ach.description || null,
    issuer_organization: ach.issuer_organization || ach.issuer || null,
    issue_date: ach.issue_date || ach.issueDate || null,
    expiry_date: ach.expiry_date || ach.expiryDate || null,
    credential_url: ach.credential_url || ach.credentialUrl || ach.credential || null,
    attachment_url: ach.attachment_url || ach.attachmentUrl || ach.attachment || null,
    is_verified: typeof ach.is_verified !== 'undefined' ? ach.is_verified : 0
  });

  const saveAchievements = async (achArray) => {
    const normalized = (achArray || []).map(normalizeAchievements).filter(a => a.title && a.title.trim());
    try {
      console.log('🏆 [saveAchievements] Saving normalized achievements:', normalized);
      const result = await EmployeeProfileService.updateEmployeeAchievements(employee.id, normalized);
      if (result.success) {
        setSuccessMessage('Achievements updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        console.log('✅ [saveAchievements] Achievements saved');
        // Refresh from backend to get canonical IDs and data
        try {
          await fetchEmployeeProfile(employee.id);
          console.log('🔄 [saveAchievements] Refreshed profile after achievements save');
        } catch (e) {
          console.warn('⚠️ [saveAchievements] Failed to refresh profile:', e?.message || e);
        }
      } else {
        console.warn('⚠️ [saveAchievements] Backend returned failure:', result.message);
      }
    } catch (err) {
      console.error('❌ [saveAchievements] Error saving achievements:', err);
      setError(err.message || 'Failed to save achievements');
    }
  };

  const addAchievement = async () => {
    const ach = { ...newAchievement };
    if (!ach.name || !ach.name.trim()) return;
    const newAch = {
      title: ach.name.trim(),
      issuer_organization: ach.issuer || null,
      issue_date: ach.issueDate || null,
      expiry_date: ach.expiryDate || null,
      description: ach.description || null,
      is_verified: 0
    };

    setEmployee(prev => ({ ...prev, achievements: [ ...(prev.achievements || []), newAch ] }));
    setNewAchievement({ name: '', issuer: '', issueDate: '', expiryDate: '' });

    // Save immediately
    await saveAchievements([ ...(employee.achievements || []), newAch ]);
  };

  const removeAchievement = async (index) => {
    const updated = (employee.achievements || []).filter((_, i) => i !== index);
    setEmployee(prev => ({ ...prev, achievements: updated }));
    // Save immediately
    await saveAchievements(updated);
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
      emergencyContactPhone: "+92 300 9876543",
      linkedin: "linkedin.com/in/muhammdhunain",
      github: "github.com/mhunain",
      portfolio: "https://hunain.dev",
    },
    profile: {
      preferredContactMethod: "Email",
      bannerImage: null
    },
    documents: [],
    bankInfo: {
      accountNumber: "PKRIBAN123456",
      bankName: "HBL",
      accountTitle: "Muhammad Hunain",
      accountType: "Savings",
      routingNumber: "0063",
      branchCode: "KHI001",
    },
    financialInfo: {
      baseSalary: 150000,
      totalAllowances: 18000,
      allowancesList: [
        { name: "Housing Allowance", amount: 8000, currency: "PKR" },
        { name: "Transport Allowance", amount: 5000, currency: "PKR" },
        { name: "Medical Allowance", amount: 5000, currency: "PKR" },
      ],
      salaryGrade: "G7",
    },
    resources: [
      { id: 1, title: 'Employee Handbook', url: '/docs/handbook.pdf', type: 'document' },
      { id: 2, title: 'Onboarding Slides', url: '/docs/onboarding.pdf', type: 'document' },
      { id: 3, title: 'Dell Latitude 5430', type: 'equipment', serial: 'DL5430-12345', status: 'Issued', issuedAt: '2025-06-01' },
      { id: 4, title: 'USB-C Charger', type: 'equipment', serial: 'CHG-9988', status: 'Issued', issuedAt: '2025-06-01' },
    ],
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

    achievements: [
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
    if (employeeId) {
      fetchEmployeeProfile(employeeId);
    } else {
      setError('No employee selected. Please select an employee from the list.');
      setLoading(false);
    }
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

  if (error && !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{error}</p>
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
      <div className="max-w-full mx-auto">
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

        {/* Hero Section (supports banner upload) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div
            className={`h-32 bg-gradient-to-r from-blue-600 to-purple-600 ${employee.profile?.bannerImage ? 'bg-cover bg-center' : ''}`}
            style={employee?.profile?.bannerImage ? { backgroundImage: `url(${employee?.profile?.bannerImage})` } : {}}
          >
            {/* Banner upload control (hidden unless allowed) */}
            {canEdit('profile') && (
              <div className="flex justify-end p-3 items-center gap-3">
                <label className="inline-flex items-center gap-2 bg-white/80 text-sm px-3 py-1 rounded-md cursor-pointer hover:bg-white">
                  <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleBannerSelect(e)} />
                  <Camera className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-700">Upload Banner</span>
                </label>
                {bannerFile && (
                  <div className="inline-flex items-center gap-2">
                    <button onClick={uploadBanner} disabled={isUploadingBanner} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">{isUploadingBanner ? 'Uploading...' : 'Apply'}</button>
                    <button onClick={() => { setBannerFile(null); updateEmployeeField('profile.bannerImage', null); }} className="px-3 py-1 bg-gray-100 rounded-md text-sm">Cancel</button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="px-8 pb-8 relative">
            {/* Avatar positioned on top of gradient */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 -mt-20 relative z-10">
              <div className="flex items-end gap-6">
                {/* Profile Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
                    {employee?.basicInfo?.profileImage ? (
                      <img src={employee?.basicInfo?.profileImage ? `${employee.basicInfo.profileImage}${avatarKey ? `?v=${avatarKey}` : ''}` : undefined} alt={employee?.basicInfo?.name || 'Profile'} className="w-full h-full object-cover rounded-lg cursor-pointer" onClick={() => document.getElementById('profile-upload')?.click()} />
                    ) : (
                      <span className="text-4xl font-bold text-blue-900">
                        {(employee?.basicInfo?.name || 'U').split(" ").map(n => n[0]).join("")}
                      </span>
                    )}
                  </div>

                  {/* Profile photo upload control - always available to replace photo */}
                    <label title="Change profile photo" aria-label="Change profile photo" className="absolute right-2 bottom-2 inline-flex items-center bg-white p-0.5 rounded-full cursor-pointer shadow-lg z-10">
                      <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileSelect(e)} />
                      <span className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all flex items-center justify-center">
                        <Camera className="h-4 w-4" />
                      </span>
                    </label>

                  {profileFile && (
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={uploadProfile} disabled={isUploadingProfile} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">{isUploadingProfile ? 'Uploading...' : 'Apply'}</button>
                      <button onClick={() => { setProfileFile(null); fetchEmployeeProfile(employee.id); }} className="px-3 py-1 bg-gray-100 rounded-md text-sm">Cancel</button>
                    </div>
                  )}
                </div>

                {/* Name and title */}
                <div className="flex-1 pb-2">
                  <h1 className="text-3xl font-bold text-white mb-1">{employee?.basicInfo?.name || 'Unnamed'}</h1>
                  <p className="text-xl text-white font-medium mb-3">{employee?.professionalInfo?.role || '—'}</p>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-green-100 text-green-800 text-sm font-semibold rounded-full border border-green-200">
                      {employee?.professionalInfo?.employmentStatus || 'Unknown'}
                    </span>
                    {/* <span className="px-4 py-1.5 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full border border-blue-200">
                      {employee?.professionalInfo?.employeeType || '—'}
                    </span> */}
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
              {isEditing && (
                <p className="text-xs text-gray-500 mt-3">Editable sections: <strong>Contact Information</strong>, <strong>Skills & Expertise</strong>, <strong>Emergency Contact</strong>, <strong>Social Links</strong>, <strong>Required Documents</strong>, <strong>Achievements</strong>.</p>
              )}
            </div>
          </div>
        </div>



        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <CardSection title="Contact Information" icon={<Mail className="h-5 w-5" />}>
              {!canEdit('contact') ? (
                <>
                  <InfoRow icon={<Mail className="h-4 w-4" />} label="Work Email" value={employee?.basicInfo?.email || '—'} copyable />
                  <InfoRow icon={<Phone className="h-4 w-4" />} label="Work Phone" value={employee?.basicInfo?.phone || '—'} copyable />
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={employee?.personalDetails?.address || '—'} />
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Work Email</label>
                    <input
                      type="email"
                      value={employee?.basicInfo?.email || ''}
                      onChange={(e) => updateEmployeeField('basicInfo.email', e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-200 py-2 px-3 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Work Phone</label>
                    <input
                      type="text"
                      value={employee?.basicInfo?.phone || ''}
                      onChange={(e) => updateEmployeeField('basicInfo.phone', e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-200 py-2 px-3 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Personal Phone</label>
                    <input
                      type="text"
                      value={employee?.basicInfo?.personalPhone || ''}
                      onChange={(e) => updateEmployeeField('basicInfo.personalPhone', e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-200 py-2 px-3 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</label>
                    <input
                      type="text"
                      value={employee?.personalDetails?.address || ''}
                      onChange={(e) => updateEmployeeField('personalDetails.address', e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-200 py-2 px-3 bg-white text-sm"
                    />
                  </div>
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
              {canEdit('emergency') ? (
                <div className="space-y-3">
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
                  <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={employee?.personalDetails?.emergencyContactPhone || '—'} copyable />
                </>
              )}
            </CardSection>

            {/* Social Links */}
            <CardSection title="Social Links" icon={<Globe className="h-5 w-5" />}>
              <div className="space-y-4">
                {console.log('🔗 [Social Links Render] Data:', employee?.socialLinks)}
                {!canEdit('social') ? (
                  // VIEW MODE
                  employee?.socialLinks && Object.keys(employee.socialLinks).length > 0 ? (
                    Object.entries(employee.socialLinks).map(([platform, data]) => {
                      console.log(`🔗 [Social Link Item] ${platform}:`, data);
                      const url = typeof data === 'string' ? data : (data?.url || '');
                      if (!url || !url.trim()) {
                        console.log(`⚠️ [Social Link Item] No URL for ${platform}`);
                        return null;
                      }
                      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
                      return (
                        <a
                          key={platform}
                          href={finalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-400 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-blue-600" />
                            <div>
                              <span className="text-sm font-semibold text-gray-900 capitalize">{platform}</span>
                              <p className="text-xs text-gray-600">{url}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                        </a>
                      );
                    })
                  ) : (
                    <>
                      {console.log('❌ [Social Links] Empty or no socialLinks object')}
                      <p className="text-sm text-gray-500 italic">No social links added yet.</p>
                    </>
                  )
                ) : (
                  // EDIT MODE
                  <div className="space-y-4">
                    {/* Display existing social links with remove buttons */}
                    {employee?.socialLinks && Object.keys(employee.socialLinks).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900">Existing Links</h4>
                        {Object.entries(employee.socialLinks).map(([platform, data]) => {
                          const url = typeof data === 'string' ? data : (data?.url || '');
                          return (
                            <div key={platform} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <Globe className="h-4 w-4 text-gray-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 capitalize">{platform}</p>
                                <p className="text-xs text-gray-600 truncate">{url}</p>
                              </div>
                              <button
                                onClick={async () => {
                                  const updated = { ...employee.socialLinks };
                                  delete updated[platform];
                                  
                                  // Update local state first for immediate UI feedback
                                  updateEmployeeField('socialLinks', updated);
                                  console.log(`🗑️ [Remove Social Link] Removed ${platform} from state`);
                                  
                                  // Now save to backend (save full updated socialLinks object)
                                  try {
                                    const result = await EmployeeProfileService.updateEmployeeSocialLinks(employee.id, updated);
                                    if (result.success) {
                                      console.log(`✅ [Remove Social Link] ${platform} successfully removed from database`);
                                      setSuccessMessage(`${platform} link removed successfully!`);
                                      setTimeout(() => setSuccessMessage(null), 3000);
                                    } else {
                                      console.error(`❌ [Remove Social Link] Failed to remove ${platform}`, result.message);
                                      // Revert on failure
                                      updateEmployeeField('socialLinks', employee.socialLinks);
                                    }
                                  } catch (err) {
                                    console.error(`❌ [Remove Social Link] Error:`, err);
                                    updateEmployeeField('socialLinks', employee.socialLinks);
                                  }
                                }}
                                className="ml-2 px-3 py-1 bg-red-50 text-red-600 text-xs rounded hover:bg-red-100 font-medium transition"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add new social link */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Add Social Link</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">Platform Name</label>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              placeholder="e.g., LinkedIn, GitHub, Twitter, Portfolio"
                              value={newSocialLink?.platform || ''}
                              onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value.toLowerCase().trim() })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              list="social-platforms"
                            />
                            <datalist id="social-platforms">
                              <option value="linkedin" />
                              <option value="github" />
                              <option value="twitter" />
                              <option value="facebook" />
                              <option value="instagram" />
                              <option value="portfolio" />
                              <option value="website" />
                              <option value="behance" />
                              <option value="dribbble" />
                              <option value="codepen" />
                              <option value="stackoverflow" />
                            </datalist>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600">URL</label>
                          <input
                            type="url"
                            placeholder="https://example.com or example.com"
                            value={newSocialLink?.url || ''}
                            onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value.trim() })}
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!newSocialLink?.platform || !newSocialLink?.url) {
                              toast.error('Please enter both platform name and URL');
                              return;
                            }
                            const updated = { ...employee.socialLinks };
                            updated[newSocialLink.platform] = { url: newSocialLink.url };
                            updateEmployeeField('socialLinks', updated);
                            setNewSocialLink({ platform: '', url: '' });
                            console.log(`✅ Added social link: ${newSocialLink.platform}`);
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
                        >
                          Add Platform
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardSection>

            {/* Required Documents (compact) */}
            <div className="mt-4">
              <div className="min-h-0">
                <CardSection title="Required Documents" icon={<FileText className="h-5 w-5" />}>
                  {canEdit('documents') && (
                    <div className="space-y-3 mb-4 pb-4 border-b">
                      <input 
                        type="text" 
                        value={requiredDocName} 
                        onChange={(e)=>setRequiredDocName(e.target.value)} 
                        placeholder="Document name" 
                        className="border rounded-md p-2 text-sm w-full" 
                      />
                      <div className="flex gap-2">
                        <input type="file" onChange={handleRequiredDocFileChange} className="border rounded-md p-2 text-sm bg-white flex-1" />
                        <button onClick={uploadRequiredDocument} disabled={isUploadingReqDoc} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm whitespace-nowrap">{isUploadingReqDoc ? 'Uploading...' : 'Upload'}</button>
                      </div>
                      {requiredDocFile && (
                        <p className="text-xs text-gray-600">Selected: {requiredDocFile.name}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Display uploaded documents */}
                  <div className="space-y-2">
                    {(Array.isArray(employee?.requiredDocuments) && employee.requiredDocuments.length > 0) ? (
                      employee.requiredDocuments.map((doc, idx) => (
                        <div key={doc.id || idx} className="flex items-center justify-between p-3 border rounded-md bg-green-50 border-green-200 hover:bg-green-100 transition">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{doc.document_name || doc.document_type}</p>
                            <p className="text-xs text-green-600 mt-1">✓ Uploaded {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <a 
                              href={`http://localhost:5000/${doc.document_url}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                            >
                              Open
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic py-2">No documents uploaded yet{canEdit('documents') ? '. Upload documents using the form above.' : '. Contact HR to upload documents.'}</p>
                    )}
                  </div>
                </CardSection>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Professional Information */}
            <CardSection title="Professional Information" icon={<Briefcase className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Employee ID" value={employee?.basicInfo?.employeeId || '—'} />
                <InfoRow label="Department" value={employee?.professionalInfo?.department || '—'} />
                <InfoRow label="Reporting To" value={employee?.professionalInfo?.reportingTo || '—'} />
                <InfoRow label="Joining Date" value={formatDate(employee?.professionalInfo?.joiningDate)} />
              </div>
            </CardSection>

            {/* Salary & Allowances */}
            <CardSection title="Salary & Allowances" icon={<DollarSign className="h-5 w-5" />}>
              <div className="space-y-3">
                <InfoRow label="Base Salary" value={`${employee?.financialInfo?.baseSalary != null ? (Number(employee.financialInfo.baseSalary)).toLocaleString() : '—'} PKR`} />
                <div className="pt-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Allowances</p>
                  <div className="mt-2 space-y-2">
                    {(Array.isArray(employee?.financialInfo?.allowancesList) ? employee.financialInfo.allowancesList : []).map((a, i) => (
                      <div key={`allowance-${i}-${a?.name}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-100">
                        <span className="text-sm">{a?.name || '—'}</span>
                        <span className="text-sm font-semibold text-blue-600">{(Number(a?.amount) || 0).toLocaleString()} PKR</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between p-2 bg-blue-50 rounded-md border border-blue-100 font-semibold">
                    <span>Total Monthly Allowances</span>
                    <span className="text-blue-600">{employee?.financialInfo?.totalAllowances != null ? Number(employee.financialInfo.totalAllowances).toLocaleString() : '0'} PKR</span>
                  </div>
                </div>
              </div>
            </CardSection>

            {/* Resources */}
            <CardSection title="Resources" icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-4">
                {canEdit('resources') && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} className="border rounded-md p-2">
                        <option value="">Select Type</option>
                        <option value="document">Document</option>
                        <option value="equipment">Equipment</option>
                        <option value="other">Other</option>
                      </select>
                      <input type="text" value={resourceName} onChange={(e) => setResourceName(e.target.value)} placeholder="Name (e.g., Dell Laptop)" className="border rounded-md p-2" />
                      {resourceType === 'equipment' && (
                        <input type="text" value={resourceSerial} onChange={(e) => setResourceSerial(e.target.value)} placeholder="Serial number" className="border rounded-md p-2" />
                      )}
                      {resourceType === 'document' && (
                        <input type="file" onChange={handleResourceFileChange} className="border rounded-md p-2 bg-white" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="date" value={resourceIssuedAt} onChange={(e) => setResourceIssuedAt(e.target.value)} className="border rounded-md p-2" />
                      <button onClick={addResource} className="px-4 py-2 bg-blue-600 text-white rounded-md">Add Resource</button>
                      <p className="text-sm text-gray-500">Equipment will be tracked by serial number.</p>
                    </div>
                  </>
                )}
                {!canEdit('resources') && (
                  <p className="text-sm text-gray-500">Resources are loaded from the `employee_dynamic_resources` table. Contact IT/HR to change allocations.</p>
                )}

                {/* Resources list */}
                <div className="space-y-2">
                  {(() => {
                    const resourcesArray = Array.isArray(employee?.resources) ? employee.resources : [];
                    const visibleResources = resourcesArray.filter(r => r && (r.resource_name || r.title || r.name));

                    if (visibleResources.length > 0) {
                      return (
                        <>
                          {employee?.resourcesSource === 'employee_dynamic_resources' && (
                            <p className="text-xs text-gray-500 mb-2">Source: <span className="font-medium">employee_dynamic_resources</span></p>
                          )}

                          {visibleResources.map((r, idx) => (
                            <div key={r.id || `res-${idx}`} className="flex items-center justify-between p-3 border rounded-md bg-gray-50 hover:bg-gray-100">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{r.resource_name || r.title || r.name || '—'}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Serial: <span className="font-mono text-gray-700">{(r.resource_serial || r.serial) || 'N/A'}</span>
                                </p>
                                {(r.created_at || r.issuedAt) && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Added: {new Date(r.created_at || r.issuedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    }

                    return (
                      <div className="text-sm text-gray-500 italic">
                        <p className="font-medium text-gray-700">No resources found</p>
                        <p className="text-xs text-gray-500">No resources found — please contact <span className="font-medium text-gray-700">IT/HR</span> to request allocations.</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardSection>



            {/* Skills & Expertise */}
            <CardSection title="Skills & Expertise" icon={<Zap className="h-5 w-5" />}>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Technical Skills</h4>
                  <div className="flex flex-wrap gap-2 items-center">
                    {(Array.isArray(employee?.skills?.technical) ? employee.skills.technical : []).map((skill, i) => (
                      <div key={`tech-skill-${i}-${skill}`} className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{skill}</span>
                        {canEdit('skills') && (
                          <button onClick={() => removeTechSkill(i)} className="text-red-500 text-xs">Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                  {canEdit('skills') && (
                    <div className="mt-3 flex gap-2">
                      <input type="text" value={newTechSkill} onChange={(e) => setNewTechSkill(e.target.value)} placeholder="Add technical skill" className="border rounded-md p-1 text-sm w-48" />
                      <button onClick={addTechSkill} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">Add</button>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Soft Skills</h4>
                  <div className="flex flex-wrap gap-2 items-center">
                    {(Array.isArray(employee?.skills?.soft) ? employee.skills.soft : []).map((skill, i) => (
                      <div key={`soft-skill-${i}-${skill}`} className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">{skill}</span>
                        {canEdit('skills') && (
                          <button onClick={() => removeSoftSkill(i)} className="text-red-500 text-xs">Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                  {canEdit('skills') && (
                    <div className="mt-3 flex gap-2">
                      <input type="text" value={newSoftSkill} onChange={(e) => setNewSoftSkill(e.target.value)} placeholder="Add soft skill" className="border rounded-md p-1 text-sm w-48" />
                      <button onClick={addSoftSkill} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">Add</button>
                    </div>
                  )}
                </div>
              </div>
            </CardSection>

            {/* Duplicate required documents removed - compact view is shown in left column */}


          </div>
        </div>

        {/* Achievements */}
        <div className="relative z-20 grid grid-cols-1 gap-8 mt-12 lg:mt-16">
          <CardSection title="Achievements" icon={<Star className="h-5 w-5" />}>
            <div className="space-y-4">
              {(employee?.achievements && employee?.achievements?.length > 0) ? (
                employee?.achievements?.map((ach, i) => {
                  console.log(`🏆 [Achievements Display] Achievement ${i}:`, ach);
                  return (
                    <div key={`achievement-${i}-${ach?.id || ach?.title}`} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Star className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm">{ach?.title || ach?.name || '—'}</h4>
                          <p className="text-xs text-gray-700 font-medium">{ach?.achievement_type && `[${ach.achievement_type.toUpperCase()}]`} {ach?.issuer_organization || ach?.issuer || '—'}</p>
                          <p className="text-xs text-gray-600 mt-2">
                            {ach?.issue_date ? `Issued: ${new Date(ach.issue_date).toLocaleDateString()}` : 'No issue date'}
                            {(ach?.expiry_date) && ` • Expires: ${new Date(ach.expiry_date).toLocaleDateString()}`}
                          </p>
                          {ach?.description && (
                            <p className="text-xs text-gray-600 mt-2 italic">{ach.description}</p>
                          )}
                          {ach?.credential_url && (
                            <a href={ach.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block">
                              View Credential →
                            </a>
                          )}
                        </div>
                        {canEdit('achievements') && (
                          <div className="ml-4">
                            <button onClick={() => removeAchievement(i)} className="px-2 py-1 text-red-600 bg-red-50 text-xs rounded hover:bg-red-100">Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 italic">No achievements listed yet. Start adding your certifications and accomplishments!</p>
              )}

              {canEdit('achievements') && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Add New Achievement</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Achievement Title" value={newAchievement.name} onChange={(e) => setNewAchievement(prev => ({ ...prev, name: e.target.value }))} className="border border-gray-300 rounded-md p-2 text-sm" />
                    <input type="text" placeholder="Issuer/Organization" value={newAchievement.issuer} onChange={(e) => setNewAchievement(prev => ({ ...prev, issuer: e.target.value }))} className="border border-gray-300 rounded-md p-2 text-sm" />
                    <input type="date" placeholder="Issue Date" value={newAchievement.issueDate} onChange={(e) => setNewAchievement(prev => ({ ...prev, issueDate: e.target.value }))} className="border border-gray-300 rounded-md p-2 text-sm" />
                    <input type="date" placeholder="Expiry Date" value={newAchievement.expiryDate} onChange={(e) => setNewAchievement(prev => ({ ...prev, expiryDate: e.target.value }))} className="border border-gray-300 rounded-md p-2 text-sm" />
                  </div>
                  <div>
                    <button onClick={addAchievement} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">Add Achievement</button>
                  </div>
                </div>
              )}
            </div>
          </CardSection>
        </div>


      </div>
    </div>
  );
};

// Helper Components
const CardSection = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow relative z-0">
    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
      <div className="text-blue-600">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
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



const SocialLink = ({ icon, label, url }) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all group">
    <div className="flex items-center gap-3">
      <div className="text-gray-400 group-hover:text-blue-600 transition-colors">{icon}</div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </div>
    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
  </a>
);





export default EmployeePersonalProfileV2;
