// components/EmployeesProfile.jsx

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  ClipboardList,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  ChevronRight,
  Home,
  BarChart3,
  ArrowUpDown,
  CheckSquare,
  Square,
  Calendar,
  Briefcase,
  ChevronDown,
  Download,
  FileText,
  Target,
  Palette,
  Cpu,
  Shield,
  Building,
  Award,
  Star,
  Zap,
  Activity,
  RefreshCw,
  Mail,
  Phone,
  Code,
  Database,
  Layers,
  ExternalLink,
  MessageSquare,
  Globe,
  MapPin,
  X,
  Save,
  Tag,
  PlusCircle,
  MinusCircle,
  User,
  Lock,
  Key,
  Upload,
  Image,
  EyeOff,
  CalendarDays,
  GitBranch,
  DollarSign as Dollar,
  TrendingUp as Trending,
  Bug,
  Users as UsersIcon,
  Palette as PaletteIcon,
  Target as TargetIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { confirmDialog } from '../utils/confirm';
import { endpoints } from "../config/api";
import { format } from "date-fns";
import { Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Utility function to format sales amounts (thousands/millions)
const formatSalesAmount = (val) => {
  if (!val || val === 0) return '$0';
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `$${Math.round(val).toLocaleString()}`;
};

const EmployeeProfile = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch employees from API on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(endpoints.employees.base);
        const data = await response.json();

        console.log("API Response:", data);

        if (data.success) {
          // API now returns nested allowances and resources per employee
          const transformedEmployees = (data.data || []).map((emp) => ({
            id: emp.id,
            name: emp.name || "Unknown",
            username:
              emp.employee_id ||
              emp.name?.toLowerCase().replace(/\s+/g, ".") ||
              "unknown",
            email: emp.email || "",
            phone: emp.phone || "",
            role: "Employee",
            address: emp.address || "Unknown",
            // Nested allowances array from API
            allowances: Array.isArray(emp.allowances) ? emp.allowances : [],
            // Nested resources array from API
            resources: Array.isArray(emp.resources) ? emp.resources : [],
            base_salary: parseFloat(emp.base_salary) || 0,
            cnic: emp.cnic || "N/A",
            profile_picture: emp.profile_photo || emp.profile_picture || null,
            designation: emp.designation || "N/A",
            total_salary: parseFloat(emp.total_salary) || 0,
            status: emp.status === "Active" ? "active" : "inactive",
            department: emp.department || "Unknown",
            joiningDate:
              emp.join_date || new Date().toISOString().split("T")[0],
            experience: "-- years",
            location: "Unknown",
            performance: "Good",
            skills: [],
            // Sales target data from API
            target: parseFloat(emp.sales_target) || 0,
            achieved: parseFloat(emp.sales_achieved) || 0,
            sales_remaining: parseFloat(emp.sales_remaining) || 0,
            sales_count: parseInt(emp.sales_count) || 0,
            color: ["blue", "green", "purple", "orange"][
              Math.floor(Math.random() * 4)
            ],
            badgeClass: [
              "bg-blue-transparent",
              "bg-green-transparent",
              "bg-purple-transparent",
              "bg-orange-transparent",
            ][Math.floor(Math.random() * 4)],
            attendance: Math.floor(Math.random() * 30) + 70,
            selected: false,
          }));

          console.log(
            "Processed Employees with salary & allowances:",
            transformedEmployees.map((emp) => ({
              id: emp.id,
              name: emp.name,
              base_salary: emp.base_salary,
              total_salary: emp.total_salary,
              allowancesCount: emp.allowances?.length || 0,
              resourcesCount: emp.resources?.length || 0,
            })),
          );

          setEmployees(transformedEmployees);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setLoading(false);
        setEmployees([]);
      }
    };

    fetchEmployees();

    // Refresh employees every 60 seconds
    const refreshInterval = setInterval(fetchEmployees, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [filters, setFilters] = useState({
    department: "all",
    status: "all",
    search: "",
  });
  const [sortBy, setSortBy] = useState("recent");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [exportFormat, setExportFormat] = useState("excel");
  const [bulkAction, setBulkAction] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showContactOptions, setShowContactOptions] = useState({});
  const [showMenuDropdown, setShowMenuDropdown] = useState({});
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showExportDropdown &&
        !event.target.closest(".export-dropdown-container")
      ) {
        setShowExportDropdown(false);
      }

      if (
        Object.values(showMenuDropdown).some((v) => v) &&
        !event.target.closest(".menu-dropdown-container")
      ) {
        setShowMenuDropdown({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportDropdown, showMenuDropdown]);

  // Stats for dashboard
  const stats = [
    {
      title: "Total Employees",
      value: employees.length.toString(),
      badgeColor: "bg-blue-100 text-blue-800 border border-blue-200",
      trend: `${employees.length > 0 ? '+' : ''}${employees.length}`,
      icon: Users,
    },
    {
      title: "Active",
      value: employees.filter((e) => e.status === "active").length.toString(),
      badgeColor: "bg-green-100 text-green-800 border border-green-200",
      trend: employees.length > 0 
        ? `${Math.round((employees.filter((e) => e.status === "active").length / employees.length) * 100)}%` 
        : "0%",
      icon: CheckCircle,
    },
    {
      title: "Inactive",
      value: employees.filter((e) => e.status === "inactive").length.toString(),
      badgeColor: "bg-red-100 text-red-800 border border-red-200",
      trend: employees.length > 0 
        ? `${Math.round((employees.filter((e) => e.status === "inactive").length / employees.length) * 100)}%` 
        : "0%",
      icon: XCircle,
    },
    {
      title: "Departments",
      value: [...new Set(employees.map(e => e.department))].length.toString(),
      badgeColor: "bg-purple-100 text-purple-800 border border-purple-200",
      trend: "Active",
      icon: Building,
    },
  ];

  const getColorClass = (color) => {
    const colors = {
      blue: "text-blue-600 bg-blue-500",
      green: "text-green-600 bg-green-500",
      purple: "text-purple-600 bg-purple-500",
      orange: "text-orange-600 bg-orange-500",
      yellow: "text-yellow-600 bg-yellow-500",
      red: "text-red-600 bg-red-500",
    };
    return colors[color] || "text-blue-600 bg-blue-500";
  };

  const getBadgeColorClass = (badgeClass) => {
    const badgeClasses = {
      "bg-blue-transparent": "bg-blue-100 text-blue-800 border border-blue-200",
      "bg-green-transparent":
        "bg-green-100 text-green-800 border border-green-200",
      "bg-purple-transparent":
        "bg-purple-100 text-purple-800 border border-purple-200",
      "bg-orange-transparent":
        "bg-orange-100 text-orange-800 border border-orange-200",
      "bg-pink-transparent": "bg-pink-100 text-pink-800 border border-pink-200",
      "bg-red-transparent": "bg-red-100 text-red-800 border border-red-200",
    };
    return (
      badgeClasses[badgeClass] ||
      "bg-gray-100 text-gray-800 border border-gray-300"
    );
  };

  const getRoleIcon = (role, department) => {
    switch (department) {
      case "Development":
        return <Code className="h-4 w-4 text-orange-600" />;
      case "Sales":
        return <Target className="h-4 w-4 text-green-600" />;
      case "Human Resources":
        return <Shield className="h-4 w-4 text-blue-600" />;
      case "Design":
        return <Palette className="h-4 w-4 text-purple-600" />;
      default:
        return <Briefcase className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Active
          </span>
        );
      case "inactive":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Inactive
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">
            Unknown
          </span>
        );
    }
  };

  const getPerformanceBadge = (performance) => {
    switch (performance) {
      case "Top Performer":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
            <Star className="h-3 w-3" /> Top Performer
          </span>
        );
      case "Excellent":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
            <Zap className="h-3 w-3" /> Excellent
          </span>
        );
      case "Good":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Activity className="h-3 w-3" /> Good
          </span>
        );
      case "Average":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">
            Average
          </span>
        );
      default:
        return null;
    }
  };

  const getSkillIcon = (skill) => {
    const skillLower = skill.toLowerCase();
    if (
      skillLower.includes("react") ||
      skillLower.includes("javascript") ||
      skillLower.includes("node")
    ) {
      return <Code className="h-3 w-3" />;
    } else if (
      skillLower.includes("aws") ||
      skillLower.includes("docker") ||
      skillLower.includes("postgres")
    ) {
      return <Database className="h-3 w-3" />;
    } else if (
      skillLower.includes("adobe") ||
      skillLower.includes("photoshop") ||
      skillLower.includes("figma")
    ) {
      return <Palette className="h-3 w-3" />;
    } else if (
      skillLower.includes("sales") ||
      skillLower.includes("crm") ||
      skillLower.includes("lead")
    ) {
      return <Target className="h-3 w-3" />;
    } else if (
      skillLower.includes("hr") ||
      skillLower.includes("training") ||
      skillLower.includes("recruitment")
    ) {
      return <Shield className="h-3 w-3" />;
    }
    return <Layers className="h-3 w-3" />;
  };

  const getDepartmentIcon = (department) => {
    switch (department) {
      case "Development":
        return <Cpu className="h-4 w-4 text-orange-500" />;
      case "Sales":
        return <Target className="h-4 w-4 text-green-500" />;
      case "Human Resources":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "Design":
        return <Palette className="h-4 w-4 text-purple-500" />;
      default:
        return <Building className="h-4 w-4 text-gray-500" />;
    }
  };

  // Selection Functions
  const handleSelectEmployee = (id) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmployees(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map((emp) => emp.id)));
    }
  };

  // CRUD Operations
  const handleAddEmployee = (employeeData) => {
    // Find the maximum ID, default to 0 if no employees
    const maxId = employees.length > 0 
      ? Math.max(...employees.map((e) => e.id)) 
      : 0;
      
    const newEmployee = {
      id: maxId + 1,
      ...employeeData,
      selected: false,
      attendance: Math.floor(Math.random() * 30) + 70,
      // Role-specific default metrics
      ...(employeeData.department === "Development"
        ? {
            projects: Math.floor(Math.random() * 20) + 15,
            projectdone: Math.floor(Math.random() * 200) + 100,
            pullRequests: Math.floor(Math.random() * 50) + 20,
            bugsFixed: Math.floor(Math.random() * 80) + 40,
          }
        : employeeData.department === "Sales"
          ? {
              target: Math.floor(Math.random() * 100000) + 100000,
              achieved: Math.floor(Math.random() * 150000) + 50000,
              dealsClosed: Math.floor(Math.random() * 30) + 15,
              newClients: Math.floor(Math.random() * 15) + 5,
            }
          : employeeData.department === "Human Resources"
            ? {
                projects: Math.floor(Math.random() * 10) + 8,
                candidates: Math.floor(Math.random() * 50) + 30,
                interviews: Math.floor(Math.random() * 30) + 15,
                hires: Math.floor(Math.random() * 10) + 5,
              }
            : employeeData.department === "Design"
              ? {
                  projects: Math.floor(Math.random() * 15) + 10,
                  designs: Math.floor(Math.random() * 40) + 20,
                  revisions: Math.floor(Math.random() * 20) + 5,
                }
              : {
                  projects: Math.floor(Math.random() * 15) + 10,
                  done: Math.floor(Math.random() * 12) + 5,
                  progress: Math.floor(Math.random() * 8) + 2,
                }),
      performance: ["Good", "Average", "Excellent"][
        Math.floor(Math.random() * 3)
      ],
      color: getRoleColor(employeeData.role),
      badgeClass: getRoleBadgeClass(employeeData.role),
      skills: employeeData.skills || getDefaultSkills(employeeData.role),
      email: `${employeeData.name
        .toLowerCase()
        .replace(/\s+/g, ".")}@company.com`,
      phone: `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`,
      username:
        employeeData.username ||
        employeeData.name.toLowerCase().replace(/\s+/g, "."),
    };
    setEmployees((prev) => [...prev, newEmployee]);
    setShowAddModal(false);
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case "hr manager":
      case "hr specialist":
        return "blue";
      case "sales executive":
        return "green";
      case "graphic designer":
        return "purple";
      case "developer":
        return "orange";
      default:
        return "blue";
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role.toLowerCase()) {
      case "hr manager":
      case "hr specialist":
        return "bg-blue-transparent";
      case "sales executive":
        return "bg-green-transparent";
      case "graphic designer":
        return "bg-purple-transparent";
      case "developer":
        return "bg-orange-transparent";
      default:
        return "bg-blue-transparent";
    }
  };

  const getDefaultSkills = (role) => {
    switch (role.toLowerCase()) {
      case "hr manager":
      case "hr specialist":
        return ["Recruitment", "Employee Relations", "HR Policies", "Training"];
      case "sales executive":
        return ["Sales Strategy", "Client Relations", "Negotiation", "CRM"];
      case "graphic designer":
        return [
          "Adobe Creative Suite",
          "UI/UX Design",
          "Branding",
          "Illustration",
        ];
      case "developer":
        return ["JavaScript", "React", "Node.js", "TypeScript", "Git"];
      default:
        return ["Communication", "Teamwork", "Problem Solving"];
    }
  };

  const handleEditEmployee = (employeeData) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeData.id ? { ...emp, ...employeeData } : emp,
      ),
    );
    setShowEditModal(false);
    setEditingEmployee(null);
  };

  // Update employee in state without closing the modal (used for partial updates like target)
  const handleUpdateEmployee = (employeeData) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeData.id ? { ...emp, ...employeeData } : emp,
      ),
    );
    setEditingEmployee((prev) => ({ ...prev, ...employeeData }));
  };

  const handleDeleteEmployee = async (id) => {
    if (await confirmDialog('Are you sure you want to delete this employee?')) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      const newSelected = new Set(selectedEmployees);
      newSelected.delete(id);
      setSelectedEmployees(newSelected);
    }
  };

  // Status Management
  const handleToggleStatus = (id) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? { ...emp, status: emp.status === "active" ? "inactive" : "active" }
          : emp,
      ),
    );
  };

  // Contact Functions
  const handleSendEmail = (email) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const handleCall = (phone) => {
    window.open(`tel:${phone.replace(/\D/g, "")}`, "_blank");
  };

  const toggleContactOptions = (id) => {
    setShowContactOptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard!");
  };

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    toast.success("Phone number copied to clipboard!");
  };

  // Menu dropdown function
  const toggleMenuDropdown = (id) => {
    setShowMenuDropdown((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Bulk Operations
  const handleBulkAction = (action) => {
    switch (action) {
      case "activate":
        setEmployees((prev) =>
          prev.map((emp) =>
            selectedEmployees.has(emp.id) ? { ...emp, status: "active" } : emp,
          ),
        );
        break;
      case "deactivate":
        setEmployees((prev) =>
          prev.map((emp) =>
            selectedEmployees.has(emp.id)
              ? { ...emp, status: "inactive" }
              : emp,
          ),
        );
        break;
      case "delete":
        confirmDialog(`Delete ${selectedEmployees.size} selected employees?`).then(
          (confirmed) => {
            if (confirmed) {
              setEmployees((prev) =>
                prev.filter((emp) => !selectedEmployees.has(emp.id)),
              );
              setSelectedEmployees(new Set());
            }
          }
        );
        break;
      case "export":
        handleExportSelected();
        break;
      default:
        break;
    }
    setBulkAction("");
  };

  // Export Functions
  const handleExportSelected = () => {
    const selected = employees.filter((emp) => selectedEmployees.has(emp.id));
    toast.success(
      `Exported ${selected.length} employees to ${exportFormat.toUpperCase()}`,
    );
  };

  const handleExportAll = () => {
    toast.success(
      `Exported all ${
        filteredEmployees.length
      } employees to ${exportFormat.toUpperCase()}`,
    );
  };

  // Search and Filter Functions
  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      department: "all",
      status: "all",
      search: "",
    });
  };

  // View Profile Function
  const handleViewProfile = (employee) => {
    setSelectedProfile(employee);
    setShowProfileModal(true);
  };

  // Sort Functions
  const handleSortChange = (value) => {
    setSortBy(value);
  };

  // Filter and sort employees
  const filteredEmployees = employees.filter((employee) => {
    const matchesDepartment =
      filters.department === "all" ||
      employee.department === filters.department;
    const matchesStatus =
      filters.status === "all" || employee.status === filters.status;
    const matchesSearch =
      !filters.search ||
      employee.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      employee.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      employee.role.toLowerCase().includes(filters.search.toLowerCase()) ||
      employee.skills.some((skill) =>
        skill.toLowerCase().includes(filters.search.toLowerCase()),
      );

    return matchesDepartment && matchesStatus && matchesSearch;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "id":
        return a.id - b.id; // Ascending order by ID
      case "attendance":
        return b.attendance - a.attendance;
      case "projects":
        return b.projects - a.projects;
      case "recent":
        return b.id - a.id;
      case "performance":
        const performanceOrder = [
          "Top Performer",
          "Excellent",
          "Good",
          "Average",
        ];
        return (
          performanceOrder.indexOf(a.performance) -
          performanceOrder.indexOf(b.performance)
        );
      case "revenue":
        if (a.department === "Sales" && b.department === "Sales") {
          return (b.achieved || 0) - (a.achieved || 0);
        }
        return a.department === "Sales" ? -1 : b.department === "Sales" ? 1 : 0;
      case "projectdones":
        if (a.department === "Development" && b.department === "Development") {
          return (b.projectdone || 0) - (a.projectdone || 0);
        }
        return a.department === "Development"
          ? -1
          : b.department === "Development"
            ? 1
            : 0;
      case "hires":
        if (
          a.department === "Human Resources" &&
          b.department === "Human Resources"
        ) {
          return (b.hires || 0) - (a.hires || 0);
        }
        return a.department === "Human Resources"
          ? -1
          : b.department === "Human Resources"
            ? 1
            : 0;
      case "designs":
        if (a.department === "Design" && b.department === "Design") {
          return (b.designs || 0) - (a.designs || 0);
        }
        return a.department === "Design"
          ? -1
          : b.department === "Design"
            ? 1
            : 0;
      default:
        return b.id - a.id;
    }
  });

  // Log all employees data to the console for debugging
  console.log("All Employees Data:", employees);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse"></div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>

      <div className="relative z-10 p-6">
        {/* Breadcrumb and Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Employee Profiles
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600">
                  Manage HR, Sales, Design, and Development teams
                </p>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
                  Total: {employees.length} Employees
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Export Dropdown */}
              <div className="relative export-dropdown-container">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 animate-fadeIn">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          handleExportAll();
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-2 p-2 w-full text-left rounded-lg hover:bg-gray-100 transition duration-200"
                      >
                        <FileText className="h-4 w-4" />
                        Export All
                      </button>
                      <button
                        onClick={() => {
                          if (selectedEmployees.size > 0) {
                            handleBulkAction("export");
                            setShowExportDropdown(false);
                          }
                        }}
                        disabled={selectedEmployees.size === 0}
                        className={`flex items-center gap-2 p-2 w-full text-left rounded-lg transition duration-200 ${
                          selectedEmployees.size === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        Export Selected ({selectedEmployees.size})
                      </button>
                      <div className="border-t border-gray-200 my-2"></div>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#349dff]"
                      >
                        <option value="excel">Excel Format</option>
                        <option value="pdf">PDF Format</option>
                        <option value="csv">CSV Format</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Employee Button */}
              <button
                onClick={() => navigate("/add-employees")}
                className="flex items-center gap-2 px-4 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Home className="h-4 w-4" />
              <ChevronRight className="h-4 w-4" />
              <span>Employee</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-[#349dff] font-medium">
                Employee Profiles
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedEmployees.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedEmployees.size} selected
                  </span>
                  <select
                    value={bulkAction}
                    onChange={(e) => handleBulkAction(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#349dff]"
                  >
                    <option value="">Bulk Actions</option>
                    <option value="activate">Activate Selected</option>
                    <option value="deactivate">Deactivate Selected</option>
                    <option value="export">Export Selected</option>
                    <option value="delete">Delete Selected</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-3 rounded-full ${
                      index === 0
                        ? "bg-blue-100 text-blue-600"
                        : index === 1
                          ? "bg-green-100 text-green-600"
                          : index === 2
                            ? "bg-red-100 text-red-600"
                            : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 truncate">
                      {stat.title}
                    </p>
                    <h4 className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </h4>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs ${stat.badgeColor}`}
                >
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.trend}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees by name, email, role, or skills..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Department Filter */}
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] text-sm"
              >
                <option value="all">All Departments</option>
                {[...new Set(employees.map(e => e.department))].sort().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] text-sm"
              >
                <option value="recent">Recently Added</option>
                <option value="id">ID (Ascending)</option>
                <option value="name">Name A-Z</option>
                <option value="attendance">Attendance</option>
                <option value="projects">Projects</option>
                <option value="performance">Performance</option>
                <option value="revenue">Revenue (Sales)</option>
                <option value="projectdones">Project Done (Dev)</option>
                <option value="hires">Hires (HR)</option>
                <option value="designs">Designs Created</option>
              </select>

              {/* Clear Filters Button */}
              {(filters.search ||
                filters.department !== "all" ||
                filters.status !== "all") && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left">
                    <button onClick={handleSelectAll} className="p-1">
                      {selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-[#349dff]" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joining Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-10 w-10 text-gray-300" />
                        <p className="text-gray-500 font-medium">No employees found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className={`hover:bg-blue-50/40 transition-colors duration-150 ${
                        selectedEmployees.has(employee.id) ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <button onClick={() => handleSelectEmployee(employee.id)} className="p-1">
                          {selectedEmployees.has(employee.id) ? (
                            <CheckSquare className="h-4 w-4 text-[#349dff]" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </td>

                      {/* Employee Name + Avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full border-2 border-blue-100 flex-shrink-0 overflow-hidden cursor-pointer hover:border-blue-300 transition duration-200"
                            onClick={() => handleViewProfile(employee)}
                          >
                            {employee.profile_picture ? (
                              <img
                                src={employee.profile_picture}
                                alt={employee.name}
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full items-center justify-center ${
                                employee.profile_picture ? 'hidden' : 'flex'
                              }`}
                            >
                              <span className="text-gray-700 text-sm font-bold">
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => handleViewProfile(employee)}
                              className="text-sm font-semibold text-gray-900 hover:text-[#349dff] transition duration-200 truncate block"
                            >
                              {employee.name}
                            </button>
                            <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 font-mono">{employee.username || employee.id}</span>
                      </td>

                      {/* Designation */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{employee.designation || employee.role || 'N/A'}</span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                            employee.department === 'Development' ? 'bg-orange-100 text-orange-800' :
                            employee.department === 'Sales' ? 'bg-green-100 text-green-800' :
                            employee.department === 'Human Resources' ? 'bg-blue-100 text-blue-800' :
                            employee.department === 'Design' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getRoleIcon(employee.role, employee.department)}
                          {employee.department}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {employee.phone && (
                            <button
                              onClick={() => handleCall(employee.phone)}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition duration-200"
                              title={employee.phone}
                            >
                              <Phone className="h-4 w-4" />
                            </button>
                          )}
                          {employee.email && (
                            <button
                              onClick={() => handleSendEmail(employee.email)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition duration-200"
                              title={employee.email}
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Joining Date */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(employee.id)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition duration-200 ${
                            employee.status === 'active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            employee.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {employee.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewProfile(employee)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition duration-200"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingEmployee(employee);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition duration-200"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition duration-200"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        {sortedEmployees.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{sortedEmployees.length}</span> of <span className="font-semibold text-gray-900">{employees.length}</span> employees
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">
                    Active: <span className="font-semibold text-green-600">{employees.filter(e => e.status === "active").length}</span>
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-gray-600">
                    Inactive: <span className="font-semibold text-red-600">{employees.filter(e => e.status === "inactive").length}</span>
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="flex items-center gap-2 px-6 py-3 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200 shadow-sm mx-auto">
            Load More
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddEmployee}
        />
      )}

      {showEditModal && editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setShowEditModal(false);
            setEditingEmployee(null);
          }}
          onSave={handleEditEmployee}
          onUpdateEmployee={handleUpdateEmployee}
        />
      )}

      {showProfileModal && selectedProfile && (
        <ProfileDetailModal
          employee={selectedProfile}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedProfile(null);
          }}
          onEdit={() => {
            setShowProfileModal(false);
            setEditingEmployee(selectedProfile);
            setShowEditModal(true);
          }}
          onToggleStatus={() => handleToggleStatus(selectedProfile.id)}
          onDelete={() => handleDeleteEmployee(selectedProfile.id)}
          onSendEmail={() => handleSendEmail(selectedProfile.email)}
          onCall={() => handleCall(selectedProfile.phone)}
          onCopyEmail={() => handleCopyEmail(selectedProfile.email)}
          onCopyPhone={() => handleCopyPhone(selectedProfile.phone)}
        />
      )}
    </div>
  );
};

// Modal Components
const AddEmployeeModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    role: "",
    department: "",
    email: "",
    phone: "",
    location: "",
    joiningDate: new Date().toISOString().split("T")[0],
    status: "active",
    skills: [],
    password: "",
    confirmPassword: "",
  });
  const [currentSkill, setCurrentSkill] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    onSave(formData);
  };

  const handleRoleChange = (role) => {
    const departmentMap = {
      "HR Manager": "Human Resources",
      "HR Specialist": "Human Resources",
      "Sales Executive": "Sales",
      "Graphic Designer": "Design",
      Developer: "Development",
    };

    const defaultSkills = {
      "HR Manager": ["Recruitment", "Employee Relations", "HR Policies"],
      "HR Specialist": ["Onboarding", "Training", "Benefits Administration"],
      "Sales Executive": ["Sales Strategy", "Client Relations", "Negotiation"],
      "Graphic Designer": ["Adobe Creative Suite", "UI/UX Design", "Branding"],
      Developer: ["JavaScript", "React", "Node.js"],
    };

    setFormData((prev) => ({
      ...prev,
      role,
      department: departmentMap[role] || "",
      email: role
        ? `${prev.name.toLowerCase().replace(/\s+/g, ".")}@company.com`
        : "",
      username: role ? prev.name.toLowerCase().replace(/\s+/g, ".") : "",
      skills: defaultSkills[role] || [],
    }));
  };

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()],
      }));
      setCurrentSkill("");
    }
  };

  const removeSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Add New Employee
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                  username: e.target.value.toLowerCase().replace(/\s+/g, "."),
                }))
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
            >
              <option value="">Select Role</option>
              <option value="Sales">Sales</option>
              <option value="Production">Production</option>
              <option value="Operations">Operations</option>
              <option value="Human Resource">Human Resource</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Supporting Staff">Supporting Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <input
              type="text"
              value={formData.department}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
              placeholder="employee@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              required
              placeholder="+1 (555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] pr-10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff] pr-10"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="City, Country"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a skill (e.g., React, Sales)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#349dff]"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-3 py-2 bg-[#349dff] text-white rounded-xl hover:bg-[#2980db] transition duration-200"
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              </div>

              {formData.skills.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Added Skills ({formData.skills.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                      >
                        <Tag className="h-3 w-3" />
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <MinusCircle className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm text-white bg-[#349dff] rounded-xl hover:bg-[#2980db] transition duration-200"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditEmployeeModal = ({ employee, onClose, onSave, onUpdateEmployee }) => {
  const [formData, setFormData] = useState({
    ...employee,
    firstName: employee.name.split(" ")[0],
    lastName: employee.name.split(" ").slice(1).join(" "),
    employeeId: `EMP-${String(employee.id).padStart(4, "0")}`,
    about: `Experienced ${employee.role} in the ${employee.department} department.`,
    // Profile image
    profile_picture: employee.profile_picture || "",
    profileImageFile: null,
    profileImagePreview: employee.profile_picture || "",

    // Allowances (array format)
    allowances: employee.allowances || [
      {
        allowance_name: employee.allowance_name || "",
        allowance_amount: employee.allowance_amount || 0,
      },
    ],

    // Resources
    resources: employee.resources || [
      {
        resource_name: employee.resource_name || "",
        resource_serial: employee.resource_serial || "",
      },
    ],

    // Other fields
    base_salary: employee.base_salary || 0,
    total_salary: employee.total_salary || 0,
    cnic: employee.cnic || "",
    designation: employee.designation || "",
    department: employee.department || "",
    role: employee.role || "",
    phone: employee.phone || "",
    address: employee.address || "",
    join_date:
      employee.joiningDate ||
      employee.join_date ||
      new Date().toISOString().split("T")[0],
    status: employee.status || "active",
  });

  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(
    employee.profile_picture || "",
  );

  // Sales target state
  const [salesTarget, setSalesTarget] = useState({
    monthly_target: employee.target || 0,
    notes: "",
  });
  const [salesTargetLoading, setSalesTargetLoading] = useState(false);
  const [salesTargetSaved, setSalesTargetSaved] = useState(false);

  // Sales history state
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesHistoryLoading, setSalesHistoryLoading] = useState(false);
  const [selectedHistoryYear, setSelectedHistoryYear] = useState(new Date().getFullYear());

  const fetchSalesHistory = async (year) => {
    setSalesHistoryLoading(true);
    try {
      const response = await fetch(
        endpoints.salesTargets.history(employee.id, year),
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );
      const data = await response.json();
      if (data.success) setSalesHistory(data.data || []);
    } catch (err) {
      console.error("Error fetching sales history:", err);
    } finally {
      setSalesHistoryLoading(false);
    }
  };

  // Fetch history whenever user switches to salesTarget tab
  useEffect(() => {
    if (activeTab === "salesTarget") fetchSalesHistory(selectedHistoryYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedHistoryYear]);

  // Add this function to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let profilePictureBase64 =
        formData.profile_picture || employee.profile_picture;

      // Convert new image file to base64 if exists
      if (profileImageFile) {
        profilePictureBase64 = await convertFileToBase64(profileImageFile);
      }
      // Prepare form data for API (with allowance IDs)
      const updatedEmployee = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: employee.email,
        phone: formData.phone,
        address: formData.address,
        cnic: formData.cnic,
        designation: formData.designation,
        role: formData.role,
        department: formData.department,
        status: formData.status,
        join_date: formData.join_date,
        profile_picture: profilePictureBase64, // Use the base64 string

        // salary
        salary: {
          base_salary: parseFloat(formData.base_salary) || 0,
          total_salary: parseFloat(formData.total_salary) || 0,
        },

        // allowances WITH IDs for existing ones
        allowances: formData.allowances.map((a) => ({
          id: a.id || null, // Send existing ID or null for new
          allowance_name: a.allowance_name,
          allowance_amount: parseFloat(a.allowance_amount) || 0,
        })),

        // dynamic resources
        dynamic_resources: formData.resources.map((dr) => ({
          resource_name: dr.resource_name || "",
          resource_serial: dr.resource_serial || "",
        })),
      };

      console.log("Sending to API:", {
        ...updatedEmployee,
        profile_picture: profilePictureBase64
          ? "BASE64_IMAGE_PRESENT"
          : "NO_IMAGE",
      });

      // Call API to update employee
      const response = await fetch(
        `${endpoints.employees.base}/${employee.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedEmployee),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Employee details updated successfully!");

        // Update local state with new profile picture URL if returned
        if (data.profile_picture_url) {
          setProfileImagePreview(data.profile_picture_url);
          setFormData((prev) => ({
            ...prev,
            profile_picture: data.profile_picture_url,
          }));
        }

        onSave({
          ...employee,
          ...data.employee,
          ...updatedEmployee,
          name: `${formData.firstName} ${formData.lastName}`,
          profile_picture:
            data.profile_picture_url ||
            data.employee?.profile_picture ||
            profilePictureBase64,
        });
      } else {
        toast.error(
          "Failed to update employee: " + (data.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Image should be below 100x100 1mb");
    } finally {
      setLoading(false);
    }
  };



  const uploadProfileImage = async (employeeId, file) => {
    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const response = await fetch(
        `${endpoints.employees.base}/${employeeId}/profile-picture`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      return false;
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          profile_picture: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAllowance = () => {
    setFormData((prev) => ({
      ...prev,
      allowances: [
        ...prev.allowances,
        { allowance_name: "", allowance_amount: 0 },
      ],
    }));
  };

  const handleRemoveAllowance = (index) => {
    setFormData((prev) => ({
      ...prev,
      allowances: prev.allowances.filter((_, i) => i !== index),
    }));
  };

  const handleAllowanceChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      allowances: prev.allowances.map((allowance, i) =>
        i === index ? { ...allowance, [field]: value } : allowance,
      ),
    }));
  };

  const handleAddResource = () => {
    setFormData((prev) => ({
      ...prev,
      resources: [
        ...prev.resources,
        { resource_name: "", resource_serial: "" },
      ],
    }));
  };

  const handleRemoveResource = (index) => {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index),
    }));
  };

  const handleResourceChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.map((resource, i) =>
        i === index ? { ...resource, [field]: value } : resource,
      ),
    }));
  };

  const departments = [
    "Human Resources",
    "Sales",
    "Supporting Staff",
    "Production",
    "Digital Marketing",
    "Operations",
  ];

  const designations = [
    "Internee", 
    "Sr. Sales Executive",
    "Jr. sales executive", 
    "Bidder",
    "Team Lead Sales", 
    "Team Lead Development",
    "Prodction Manager",
    "Sr. Graphics Designer",
    "Jr. Graphics Designer",
    "Animation Artist",
    "SEO Executive",
    "SEO Speacialist",
    "Social Media Marketer",
    "Office Boy",
    "Sr. Developer",
    "Jr.Developer",
  ];

  const renderBasicInfoTab = () => (
    <>
      <div className="modal-body pb-0 px-6 pt-6">
        <div className="row">
          <div className="col-span-12">
            <div className="flex items-center flex-wrap gap-3 bg-gray-50 w-full rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-gray-300 mr-4 flex-shrink-0">
                {/* SHOW ACTUAL PROFILE PICTURE OR INITIALS */}
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile Preview"
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => {
                      // If image fails to load, show initials
                      e.target.style.display = "none";
                      const initialsDiv = e.target.parentElement;
                      initialsDiv.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                        <span class="text-gray-700 text-2xl font-bold">
                          ${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}
                        </span>
                      </div>
                    `;
                    }}
                  />
                ) : employee.profile_picture ? (
                  <img
                    src={employee.profile_picture}
                    alt={employee.name}
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => {
                      // If image fails to load, show initials
                      e.target.style.display = "none";
                      const initialsDiv = e.target.parentElement;
                      initialsDiv.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                        <span class="text-gray-700 text-2xl font-bold">
                          ${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}
                        </span>
                      </div>
                    `;
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="text-gray-700 text-2xl font-bold">
                      {formData.firstName?.[0] || ""}
                      {formData.lastName?.[0] || ""}
                    </span>
                  </div>
                )}
              </div>
              <div className="profile-upload flex-1">
                <div className="mb-2">
                  <h6 className="font-semibold text-gray-900 mb-1">
                    Upload Profile Image
                  </h6>
                  <p className="text-sm text-gray-500">
                    Image should be below 100x100 1mb
                  </p>
                </div>
                <div className="profile-uploader flex items-center">
                  <button
                    type="button"
                    className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm mr-3"
                    onClick={() =>
                      document.getElementById("profileImageInput").click()
                    }
                  >
                    Upload
                  </button>
                  <input
                    id="profileImageInput"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 text-sm"
                    onClick={() => {
                      setProfileImagePreview("");
                      setProfileImageFile(null);
                      setFormData((prev) => ({ ...prev, profile_picture: "" }));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.employeeId}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joining Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={(() => {
                    // Direct conversion in input value
                    const dateValue =
                      employee.joiningDate || employee.join_date;

                    if (!dateValue) return "";

                    try {
                      const date = new Date(dateValue);
                      if (isNaN(date.getTime())) return "";

                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
                      const day = String(date.getDate()).padStart(2, "0");

                      return `${year}-${month}-${day}`;
                    } catch (error) {
                      console.error("Date conversion error:", error);
                      return "";
                    }
                  })()}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      join_date: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={employee.email}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNIC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cnic: e.target.value }))
                }
                required
                placeholder="XXXXX-XXXXXXX-X"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.designation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    designation: e.target.value,
                  }))
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Designation</option>
                {designations.map((des) => (
                  <option key={des} value={des}>
                    {des}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status field - removed Experience */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderSalaryTab = () => (
    <>
      <div className="modal-body pb-0 px-6 pt-6">
        <div className="space-y-6">
          {/* Base Salary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Salary (PKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.base_salary}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    base_salary: e.target.value,
                    total_salary:
                      parseFloat(e.target.value || 0) +
                      formData.allowances.reduce(
                        (sum, allowance) =>
                          sum + (parseFloat(allowance.allowance_amount) || 0),
                        0,
                      ),
                  }))
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Salary (PKR)
              </label>
              <input
                type="number"
                value={formData.total_salary}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl"
              />
              <p className="text-sm text-gray-500 mt-1">
                Base Salary + Allowances
              </p>
            </div>
          </div>

          {/* Allowances */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">Allowances</h4>
              <button
                type="button"
                onClick={handleAddAllowance}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Allowance
              </button>
            </div>

            {formData.allowances.map((allowance, index) => (
              <div key={index} className="flex items-end gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowance Name
                  </label>
                  <input
                    type="text"
                    value={allowance.allowance_name}
                    onChange={(e) =>
                      handleAllowanceChange(
                        index,
                        "allowance_name",
                        e.target.value,
                      )
                    }
                    placeholder="e.g., Travel Allowance"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={allowance.allowance_amount}
                    onChange={(e) => {
                      handleAllowanceChange(
                        index,
                        "allowance_amount",
                        e.target.value,
                      );
                      // Update total salary
                      const totalAllowances = formData.allowances.reduce(
                        (sum, a, i) =>
                          sum +
                          (i === index
                            ? parseFloat(e.target.value || 0)
                            : parseFloat(a.allowance_amount || 0)),
                        0,
                      );
                      setFormData((prev) => ({
                        ...prev,
                        total_salary:
                          parseFloat(prev.base_salary || 0) + totalAllowances,
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {formData.allowances.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAllowance(index)}
                    className="px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderResourcesTab = () => (
    <>
      <div className="modal-body pb-0 px-6 pt-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-900">Resources</h4>
            <button
              type="button"
              onClick={handleAddResource}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Resource
            </button>
          </div>

          {formData.resources.map((resource, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource Name
                </label>
                <input
                  type="text"
                  value={resource.resource_name}
                  onChange={(e) =>
                    handleResourceChange(index, "resource_name", e.target.value)
                  }
                  placeholder="e.g., Laptop, Monitor, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={resource.resource_serial}
                  onChange={(e) =>
                    handleResourceChange(
                      index,
                      "resource_serial",
                      e.target.value,
                    )
                  }
                  placeholder="Serial number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {formData.resources.length > 1 && (
                <div className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveResource(index)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Resource
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const handleSalesTargetSave = async () => {
    setSalesTargetLoading(true);
    try {
      const now = new Date();
      const response = await fetch(
        endpoints.salesTargets.set(employee.id),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            monthly_target: parseFloat(salesTarget.monthly_target) || 0,
            notes: salesTarget.notes || "",
          }),
        },
      );
      const data = await response.json();
      if (data.success) {
        setSalesTargetSaved(true);
        setTimeout(() => setSalesTargetSaved(false), 3000);
        // Refresh history so the current month row updates
        fetchSalesHistory(selectedHistoryYear);
        // Update the card in the parent without closing the modal
        if (onUpdateEmployee) {
          onUpdateEmployee({
            ...employee,
            target: parseFloat(salesTarget.monthly_target) || 0,
          });
        }
      } else {
        toast.error("Failed to save target: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving sales target:", error);
      toast.error("Error saving sales target");
    } finally {
      setSalesTargetLoading(false);
    }
  };

  const renderSalesTargetTab = () => {
    const achieved = parseFloat(employee.achieved) || 0;
    const target = parseFloat(salesTarget.monthly_target) || 0;
    const remaining = target - achieved;
    const progressPercent = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;

    return (
      <>
        <div className="modal-body pb-0 px-6 pt-6">
          <div className="space-y-6">
            {/* Target Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">Monthly Target</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${target > 0 ? target.toLocaleString() : '0'}
                </p>
              </div>
              <div className={`border rounded-xl p-4 text-center ${achieved >= target && target > 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <p className={`text-xs font-medium mb-1 ${achieved >= target && target > 0 ? 'text-green-600' : 'text-orange-600'}`}>Achieved</p>
                <p className={`text-2xl font-bold ${achieved >= target && target > 0 ? 'text-green-700' : 'text-orange-700'}`}>
                  ${achieved.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">From {employee.sales_count || 0} sales</p>
              </div>
              <div className={`border rounded-xl p-4 text-center ${remaining <= 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs font-medium mb-1 ${remaining <= 0 ? 'text-green-600' : 'text-gray-600'}`}>Remaining</p>
                <p className={`text-2xl font-bold ${remaining <= 0 ? 'text-green-700' : 'text-gray-700'}`}>
                  {remaining <= 0 ? 'Target Met!' : `$${remaining.toLocaleString()}`}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {target > 0 && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${progressPercent >= 100 ? 'bg-green-500' : progressPercent >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Sales History Table */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Sales History
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { const y = selectedHistoryYear - 1; setSelectedHistoryYear(y); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    &#8249;
                  </button>
                  <span className="text-sm font-semibold text-gray-700 min-w-[3rem] text-center">{selectedHistoryYear}</span>
                  <button
                    type="button"
                    onClick={() => { const y = selectedHistoryYear + 1; setSelectedHistoryYear(y); }}
                    disabled={selectedHistoryYear >= new Date().getFullYear()}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                  >
                    &#8250;
                  </button>
                </div>
              </div>

              {salesHistoryLoading ? (
                <div className="flex items-center justify-center py-6 text-gray-400">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading history...
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Month</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Target</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Achieved</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Remaining</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Sales</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salesHistory.map((row) => (
                        <tr
                          key={row.month}
                          className={`${
                            row.is_current ? "bg-blue-50/60" : row.is_future ? "bg-gray-50/40" : "bg-white"
                          } hover:bg-gray-50 transition-colors`}
                        >
                          <td className="px-4 py-2.5 font-medium text-gray-800">
                            {row.month_name}
                            {row.is_current && (
                              <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">Now</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {row.target_set
                              ? <span className="text-gray-800 font-medium">{formatSalesAmount(row.monthly_target)}</span>
                              : <span className="text-gray-400 text-xs">Not Set</span>
                            }
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {row.is_future
                              ? <span className="text-gray-300 text-xs">—</span>
                              : <span className={row.achieved > 0 ? "font-medium text-gray-800" : "text-gray-400"}>{formatSalesAmount(row.achieved ?? 0)}</span>
                            }
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {row.is_future || !row.target_set
                              ? <span className="text-gray-300 text-xs">—</span>
                              : row.remaining <= 0
                              ? <span className="text-green-600 font-medium text-xs">Met ✓</span>
                              : <span className="text-orange-600 font-medium">{formatSalesAmount(row.remaining)}</span>
                            }
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {row.is_future
                              ? <span className="text-gray-300">—</span>
                              : <span className="text-gray-600">{row.sales_count ?? 0}</span>
                            }
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {row.is_future ? (
                              <span className="text-xs text-gray-400">Upcoming</span>
                            ) : row.hit_target ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Hit</span>
                            ) : row.target_set ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">In Progress</span>
                            ) : (
                              <span className="text-xs text-gray-400">No Target</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Set Target Form */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Set Monthly Target
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Amount ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={salesTarget.monthly_target}
                    onChange={(e) =>
                      setSalesTarget((prev) => ({
                        ...prev,
                        monthly_target: e.target.value,
                      }))
                    }
                    min="0"
                    step="100"
                    placeholder="e.g., 50000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={salesTarget.notes}
                    onChange={(e) =>
                      setSalesTarget((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="e.g., Q1 target, special focus on enterprise"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSalesTargetSave}
                  disabled={salesTargetLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {salesTargetLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Target
                    </>
                  )}
                </button>
                {salesTargetSaved && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Target saved successfully!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center">
            <h4 className="text-lg font-semibold text-gray-900 mr-3">
              Edit Employee
            </h4>
            <span className="text-sm text-gray-600">
              Employee ID: {formData.employeeId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-6">
            <ul className="flex border-b border-gray-200" role="tablist">
              <li className="mr-2" role="presentation">
                <button
                  type="button"
                  className={`px-4 py-3 text-sm font-medium rounded-t-lg ${
                    activeTab === "basic"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("basic")}
                >
                  Basic Information
                </button>
              </li>
              <li className="mr-2" role="presentation">
                <button
                  type="button"
                  className={`px-4 py-3 text-sm font-medium rounded-t-lg ${
                    activeTab === "salary"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("salary")}
                >
                  Salary & Allowances
                </button>
              </li>
              <li role="presentation">
                <button
                  type="button"
                  className={`px-4 py-3 text-sm font-medium rounded-t-lg ${
                    activeTab === "resources"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("resources")}
                >
                  Resources
                </button>
              </li>
              {employee.department === "Sales" && (
                <li className="mr-2" role="presentation">
                  <button
                    type="button"
                    className={`px-4 py-3 text-sm font-medium rounded-t-lg ${
                      activeTab === "salesTarget"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("salesTarget")}
                  >
                    Sales Target
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="tab-content">
            {activeTab === "basic" && renderBasicInfoTab()}
            {activeTab === "salary" && renderSalaryTab()}
            {activeTab === "resources" && renderResourcesTab()}
            {activeTab === "salesTarget" && renderSalesTargetTab()}
          </div>

          <div className="modal-footer flex justify-center p-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200 border border-gray-300 mr-3"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition duration-200 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Updated ProfileDetailModal component
const ProfileDetailModal = ({
  employee,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
  onSendEmail,
  onCall,
  onCopyEmail,
  onCopyPhone,
}) => {
  // Status badge function
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Active
          </span>
        );
      case "inactive":
        return (
          <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Inactive
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800 border border-gray-200">
            Unknown
          </span>
        );
    }
  };

  // Performance badge function
  // const getPerformanceBadge = (performance) => {
  //   switch (performance) {
  //     case "Top Performer":
  //       return (
  //         <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
  //           <Star className="h-3 w-3" /> Top Performer
  //         </span>
  //       );
  //     case "Excellent":
  //       return (
  //         <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
  //           <Zap className="h-3 w-3" /> Excellent
  //         </span>
  //       );
  //     case "Good":
  //       return (
  //         <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
  //           <Activity className="h-3 w-3" /> Good
  //         </span>
  //       );
  //     default:
  //       return null;
  //   }
  // };

  // Skill icon function
  const getSkillIcon = (skill) => {
    const skillLower = skill.toLowerCase();
    if (
      skillLower.includes("react") ||
      skillLower.includes("javascript") ||
      skillLower.includes("node")
    ) {
      return <Code className="h-3 w-3" />;
    } else if (
      skillLower.includes("aws") ||
      skillLower.includes("docker") ||
      skillLower.includes("postgres")
    ) {
      return <Database className="h-3 w-3" />;
    } else if (
      skillLower.includes("adobe") ||
      skillLower.includes("photoshop") ||
      skillLower.includes("figma")
    ) {
      return <Palette className="h-3 w-3" />;
    } else if (
      skillLower.includes("sales") ||
      skillLower.includes("crm") ||
      skillLower.includes("lead")
    ) {
      return <Target className="h-3 w-3" />;
    } else if (
      skillLower.includes("hr") ||
      skillLower.includes("training") ||
      skillLower.includes("recruitment")
    ) {
      return <Shield className="h-3 w-3" />;
    }
    return <Layers className="h-3 w-3" />;
  };

  // Role specific metrics
  const renderRoleSpecificMetrics = () => {
    switch (employee.department) {
      case "Development":
        return (
          <>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-sm text-green-600">Project Done</div>
              </div>
              <div className="text-2xl font-bold">
                {employee.projectdone || 0}
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="h-4 w-4 text-orange-600" />
                <div className="text-sm text-orange-600">Pending</div>
              </div>
              <div className="text-2xl font-bold">
                {employee.pullRequests || 0}
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Bug className="h-4 w-4 text-purple-600" />
                <div className="text-sm text-purple-600">On Progress</div>
              </div>
              <div className="text-2xl font-bold">
                {employee.bugsFixed || 0}
              </div>
            </div>
          </>
        );
      case "Sales":
        return (
          <>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-green-600" />
                <div className="text-sm text-green-600">Revenue Target</div>
              </div>
              <div className="text-2xl font-bold">
                ${(employee.target || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Dollar className="h-4 w-4 text-blue-600" />
                <div className="text-sm text-blue-600">Revenue Achieved</div>
              </div>
              <div
                className={`text-2xl font-bold ${
                  employee.achieved >= employee.target
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                ${(employee.achieved || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-purple-600" />
                <div className="text-sm text-purple-600">Deals Closed</div>
              </div>
              <div className="text-2xl font-bold">
                {employee.dealsClosed || 0}
              </div>
            </div>
          </>
        );
      case "Human Resources":
        return (
          <>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <UsersIcon className="h-4 w-4 text-green-600" />
                <div className="text-sm text-green-600">Hires</div>
              </div>
              <div className="text-2xl font-bold">{employee.hires || 0}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <div className="text-sm text-blue-600">Candidates</div>
              </div>
              <div className="text-2xl font-bold">
                {employee.candidates || 0}
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="h-4 w-4 text-orange-600" />
                <div className="text-sm text-orange-600">Interviews</div>
              </div>
              <div className="text-2xl font-bold">
                {employee.interviews || 0}
              </div>
            </div>
          </>
        );
      case "Design":
        return (
          <>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <PaletteIcon className="h-4 w-4 text-green-600" />
                <div className="text-sm text-green-600">Designs Created</div>
              </div>
              <div className="text-2xl font-bold">{employee.designs || 0}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="h-4 w-4 text-orange-600" />
                <div className="text-sm text-orange-600">Revisions</div>
              </div>
              <div className="text-2xl font-bold">
                {employee.revisions || 0}
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-purple-600" />
                <div className="text-sm text-purple-600">Projects</div>
              </div>
              <div className="text-2xl font-bold">{employee.projects || 0}</div>
            </div>
          </>
        );
      default:
        return (
          <>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm text-blue-600">Projects</div>
              <div className="text-2xl font-bold">{employee.projects || 0}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-sm text-green-600">Done</div>
              <div className="text-2xl font-bold">{employee.done || 0}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="text-sm text-orange-600">Progress</div>
              <div className="text-2xl font-bold">{employee.progress || 0}</div>
            </div>
          </>
        );
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString || "N/A";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Employee Profile Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Top Section: Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Profile Image and Basic Info */}
            <div className="flex flex-col items-center md:items-start md:flex-row md:gap-6">
              <div className="relative mb-4 md:mb-0">
                <div className="w-24 h-24 rounded-full border-4 border-blue-100 p-1">
                  {/* SHOW PROFILE PICTURE FROM DATABASE */}
                  {employee.profile_picture ? (
                    <img
                      src={employee.profile_picture}
                      alt={employee.name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        // If image fails to load, show initials
                        e.target.style.display = "none";
                        const initialsDiv = e.target.parentElement;
                        initialsDiv.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <span class="text-gray-700 text-xl font-bold">
                              ${employee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 text-xl font-bold">
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {employee.name}
                  </h2>
                  {getStatusBadge(employee.status)}
                  {/* {getPerformanceBadge(employee.performance)} */}
                </div>
                <div className="flex flex-wrap gap-3 mb-3">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="h-4 w-4" />
                    {employee.role}
                  </span>
                  <span className="flex items-center gap-2 text-gray-600">
                    <Building className="h-4 w-4" />
                    {employee.department}
                  </span>
                  <span className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(employee.joiningDate)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition duration-200"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={onToggleStatus}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 transition duration-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {employee.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Contact & Personal Info */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-500" />
                  Contact Information
                </h4>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-32 text-gray-600">Email:</div>
                    <div className="flex-1">
                      <div className="font-medium">{employee.email}</div>
                      <div className="flex gap-3 mt-1">
                        <button
                          onClick={onSendEmail}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" /> Email
                        </button>
                        <button
                          onClick={onCopyEmail}
                          className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-32 text-gray-600">Phone:</div>
                    <div className="flex-1">
                      <div className="font-medium">{employee.phone}</div>
                      <div className="flex gap-3 mt-1">
                        <button
                          onClick={onCall}
                          className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" /> Call
                        </button>
                        <button
                          onClick={onCopyPhone}
                          className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-32 text-gray-600">Address:</div>
                    <div className="flex-1 font-medium">{employee.address}</div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-32 text-gray-600">CNIC:</div>
                    <div className="flex-1 font-medium">{employee.cnic}</div>
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                  Job Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Designation
                    </div>
                    <div className="font-medium">{employee.designation}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Department</div>
                    <div className="font-medium">{employee.department}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Joining Date
                    </div>
                    <div className="font-medium">
                      {formatDate(employee.joiningDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className="font-medium capitalize">{employee.status}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Salary & Resources */}
            <div className="space-y-6">
              {/* Salary Information */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  (PKR) Salary Information
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Base Salary</span>
                    <span className="font-semibold text-lg">
                      PKR {employee.base_salary?.toLocaleString() || "0"}
                    </span>
                  </div>
                  {/* Show all allowances */}
                  {employee.allowances && employee.allowances.length > 0 ? (
                    <>
                      <div className="pb-3 border-b border-gray-200">
                        <div className="text-gray-600 mb-2">Allowances</div>
                        <div className="space-y-2">
                          {employee.allowances.map((allowance, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center"
                            >
                              <div className="text-sm text-gray-500">
                                {allowance.allowance_name}
                              </div>
                              <span className="font-semibold">
                                PKR{" "}
                                {allowance.allowance_amount?.toLocaleString() ||
                                  "0"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <div>
                        <div className="text-gray-600">Allowance</div>
                        <div className="text-sm text-gray-500">
                          {employee.allowance_name || "No allowances"}
                        </div>
                      </div>
                      <span className="font-semibold text-lg">
                        PKR {employee.allowance_amount?.toLocaleString() || "0"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-800 font-medium text-lg">
                      Total Salary
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      PKR {employee.total_salary?.toLocaleString() || "0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resource Information - Table Format */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="h-5 w-5 text-gray-500" />
                  Assigned Resources
                  {employee.resources && employee.resources.length > 0 && (
                    <span className="ml-2 text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {employee.resources.length} items
                    </span>
                  )}
                </h4>
                {employee.resources && employee.resources.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-3 text-sm font-medium text-gray-700 border-b border-gray-200">
                            #
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700 border-b border-gray-200">
                            Resource Name
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700 border-b border-gray-200">
                            Serial Number
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {employee.resources.map((resource, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition duration-150"
                          >
                            <td className="p-3 border-b border-gray-200 text-sm text-gray-600">
                              {index + 1}
                            </td>
                            <td className="p-3 border-b border-gray-200">
                              <div className="font-medium text-gray-800">
                                {resource.resource_name || "Unnamed Resource"}
                              </div>
                            </td>
                            <td className="p-3 border-b border-gray-200">
                              <div className="font-medium text-gray-800">
                                {resource.resource_serial || "N/A"}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No resources assigned
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Resources will appear here once assigned
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;