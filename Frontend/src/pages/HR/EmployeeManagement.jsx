// Frontend/src/pages/HR/EmployeeManagement.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HrSidebar from "../../components/HrSidebar";
import { config } from "../../config/api";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  X,
  Loader,
} from "lucide-react";
import { generateTablePDF, exportToCSV } from "../../utils/pdfExport";
import toast from "react-hot-toast";
import {
  DashboardHeader,
  RoleBasedNav,
} from "../../components/DashboardComponents";
import { useAuth } from "../../context/AuthContext";

const API_URL = config.FULL_API_URL;

const EmployeeManagement = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("employees");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const itemsPerPage = 10;

  const [employees, setEmployees] = useState([]);

  // Fetch employees from API
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/employees`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setEmployees(data.data);
      } else {
        setEmployees([]);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments from employees
  const departments = [
    "All",
    ...new Set(employees.map((emp) => emp.department || "N/A")),
  ];

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (emp.name || "").toLowerCase().includes(term) ||
      (emp.email || "").toLowerCase().includes(term);
    const matchesDept = filterDept === "All" || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDept]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handleDeleteEmployee = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        const response = await fetch(`${API_URL}/employees/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setEmployees(employees.filter((emp) => emp.id !== id));
        } else {
          toast.error("Failed to delete employee");
        }
      } catch (err) {
        console.error("Error deleting employee:", err);
        toast.error("Failed to delete employee");
      }
    }
  };

  const handleExportPDF = () => {
    try {
      // Always export all employees
      const dataToExport = employees;

      if (dataToExport.length === 0) {
        toast.error("No employees to export");
        return;
      }

      const columns = [
        { key: "employee_id", label: "Office ID", width: 12 },
        { key: "name", label: "Name", width: 20 },
        { key: "email", label: "Email", width: 22 },
        { key: "phone", label: "Phone", width: 15 },
        { key: "department", label: "Department", width: 16 },
        { key: "position", label: "Position", width: 16 },
        { key: "designation", label: "Designation", width: 16 },
        { key: "cnic", label: "CNIC", width: 16 },
        { key: "bank_account", label: "Bank Account", width: 18 },
        { key: "join_date", label: "Join Date", width: 14 },
        { key: "status", label: "Status", width: 12 },
      ];

      const filename = `Employee_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      generateTablePDF(
        "Employee Management Report",
        "Complete Employee Directory",
        columns,
        dataToExport,
        filename,
      );
      console.log("✅ PDF exported successfully");
    } catch (error) {
      console.error("❌ Export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleExportCSV = () => {
    try {
      // Always export all employees
      const dataToExport = employees;

      if (dataToExport.length === 0) {
        toast.error("No employees to export");
        return;
      }

      const columns = [
        { key: "employee_id", label: "Office ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "department", label: "Department" },
        { key: "position", label: "Position" },
        { key: "designation", label: "Designation" },
        { key: "cnic", label: "CNIC" },
        { key: "bank_account", label: "Bank Account" },
        { key: "join_date", label: "Join Date" },
        { key: "address", label: "Address" },
        { key: "emergency_contact", label: "Emergency Contact" },
        { key: "status", label: "Status" },
      ];

      const filename = `Employee_Report_${new Date().toISOString().split("T")[0]}`;
      exportToCSV(columns, dataToExport, filename);
      console.log("✅ CSV exported successfully");
    } catch (error) {
      console.error("❌ Export error:", error);
      toast.error("Failed to export CSV");
    }
  };

  const handleViewDetails = async (employee) => {
    try {
      // Fetch full employee details including resources and all onboarding data
      const response = await fetch(`${API_URL}/employees/${employee.id}`);
      const data = await response.json();

      if (data.success && data.data) {
        // Merge the full data with the existing employee
        const fullEmployee = {
          ...data.data,
          // Flatten resources from nested object for easier display
          laptop: data.data.resources?.laptop || false,
          laptop_serial: data.data.resources?.laptop_serial || null,
          charger: data.data.resources?.charger || false,
          charger_serial: data.data.resources?.charger_serial || null,
          mouse: data.data.resources?.mouse || false,
          mouse_serial: data.data.resources?.mouse_serial || null,
          keyboard: data.data.resources?.keyboard || false,
          keyboard_serial: data.data.resources?.keyboard_serial || null,
          monitor: data.data.resources?.monitor || false,
          monitor_serial: data.data.resources?.monitor_serial || null,
          mobile: data.data.resources?.mobile || false,
          mobile_serial: data.data.resources?.mobile_serial || null,
          resources_note: data.data.resources?.resources_note || null,
          dynamicResources: data.data.dynamicResources || [],
        };
        setSelectedEmployee(fullEmployee);
      } else {
        setSelectedEmployee(employee);
      }
    } catch (err) {
      console.error("Error fetching full employee details:", err);
      setSelectedEmployee(employee);
    }

    setEditFormData(null);
    setIsEditMode(false);
    setShowDetailsModal(true);
  };

  const handleEditEmployee = (employee) => {
    const formData = { ...employee };
    // Ensure allowances is properly initialized as array
    if (!formData.allowances) {
      formData.allowances = [];
    }
    // Ensure dynamic resources mapping is available
    if (!formData.dynamicResources && !formData.dynamic_resources) {
      formData.dynamicResources = [];
      formData.dynamic_resources = [];
    } else if (!formData.dynamic_resources && formData.dynamicResources) {
      formData.dynamic_resources = formData.dynamicResources;
    } else if (!formData.dynamicResources && formData.dynamic_resources) {
      formData.dynamicResources = formData.dynamic_resources;
    }

    // Prepare temp input fields
    formData.newAllowanceName = "";
    formData.newAllowanceAmount = "";
    formData.newResourceName = "";
    formData.newResourceSerial = "";

    setEditFormData(formData);
    setIsEditMode(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add / remove allowances
  const addAllowance = () => {
    const name = (editFormData?.newAllowanceName || "").trim();
    const amount = Number(editFormData?.newAllowanceAmount || 0);
    if (!name || !amount) {
      toast.error("Provide allowance name and amount");
      return;
    }
    const updated = [
      ...(editFormData.allowances || []),
      { allowance_name: name, allowance_amount: amount },
    ];
    handleEditFormChange("allowances", updated);
    handleEditFormChange("newAllowanceName", "");
    handleEditFormChange("newAllowanceAmount", "");
  };

  const removeAllowance = (idx) => {
    const list = [...(editFormData.allowances || [])];
    list.splice(idx, 1);
    handleEditFormChange("allowances", list);
  };

  // Add / remove dynamic resources
  const addDynamicResource = () => {
    const name = (editFormData?.newResourceName || "").trim();
    const serial = (editFormData?.newResourceSerial || "").trim();
    if (!name) {
      toast.error("Provide resource name");
      return;
    }
    const base =
      editFormData.dynamic_resources || editFormData.dynamicResources || [];
    const updated = [...base, { resource_name: name, resource_serial: serial }];
    handleEditFormChange("dynamic_resources", updated);
    handleEditFormChange("dynamicResources", updated);
    handleEditFormChange("newResourceName", "");
    handleEditFormChange("newResourceSerial", "");
  };

  const removeDynamicResource = (idx) => {
    const list = [
      ...(editFormData.dynamic_resources ||
        editFormData.dynamicResources ||
        []),
    ];
    list.splice(idx, 1);
    handleEditFormChange("dynamic_resources", list);
    handleEditFormChange("dynamicResources", list);
  };

  const handleSaveEmployee = async () => {
    try {
      setIsSaving(true);
      // Normalize allowances to expected backend shape
      const normalizedAllowances = (editFormData.allowances || []).map((a) => ({
        allowance_name: a.allowance_name || a.name,
        allowance_amount: Number(a.allowance_amount || a.amount || 0),
      }));

      // Ensure dynamic_resources key is included for backend
      const dynamicResourcesPayload =
        editFormData.dynamic_resources || editFormData.dynamicResources || [];

      // Normalize dynamic resources to backend expected shape and filter empty names
      const normalizedDynamicResources = (dynamicResourcesPayload || [])
        .map((r) => ({
          resource_name: r.resource_name || r.name || r.resourceName || "",
          resource_serial:
            r.resource_serial || r.serial || r.resourceSerial || "",
        }))
        .filter((r) => r.resource_name && r.resource_name.trim() !== "");

      const payload = {
        ...editFormData,
        allowances: normalizedAllowances,
        dynamic_resources: normalizedDynamicResources,
      };

      const response = await fetch(`${API_URL}/employees/${editFormData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedEmployee = await response.json();
        setEmployees(
          employees.map((emp) =>
            emp.id === editFormData.id ? { ...emp, ...editFormData } : emp,
          ),
        );
        setSelectedEmployee({ ...selectedEmployee, ...editFormData });
        setIsEditMode(false);
        toast.success("Employee details updated successfully!");
      } else {
        toast.error("Failed to update employee");
      }
    } catch (err) {
      console.error("Error updating employee:", err);
      toast.error("Failed to update employee");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <HrSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader
          title="Employee Management"
          subtitle="Manage and organize your team members"
        />
        <RoleBasedNav role={role} />
        {/* <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Employee Management
              </h1>
              <p className="text-gray-500 text-base mt-2">
                Manage and organize your team members
              </p>
            </div>
            <div className="flex gap-3"></div>
          </div>
        </div> */}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-10 md:px-8">
          <div className="w-full max-w-full mx-auto">
            {/* Stats Cards */}
            <div className="mb-12">
              {/* <h3 className="text-3xl font-bold text-gray-900 capitalize mb-6">Overview</h3> */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        Total Employees
                      </p>
                      <p className="text-3xl font-bold text-blue-900 mt-4">
                        {employees.length}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        Active Staff
                      </p>
                      <p className="text-3xl font-bold text-green-900 mt-4">
                        {employees.filter((e) => e.status === "Active").length}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-800">
                        Departments
                      </p>
                      <p className="text-4xl font-bold text-purple-900 mt-4">
                        {new Set(employees.map((e) => e.department)).size}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                      <Briefcase className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">
                        New This Month
                      </p>
                      <p className="text-4xl font-bold text-amber-900 mt-4">
                        {
                          employees.filter((e) => {
                            const joinDate = new Date(
                              e.join_date || e.joinDate,
                            );
                            const now = new Date();
                            return (
                              joinDate.getMonth() === now.getMonth() &&
                              joinDate.getFullYear() === now.getFullYear()
                            );
                          }).length
                        }
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search employees by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm"
                      title="Export to PDF"
                    >
                      <Download className="w-5 h-5" />
                      PDF
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm"
                      title="Export to CSV"
                    >
                      <Download className="w-5 h-5" />
                      CSV
                    </button>
                    <button
                      onClick={() => navigate("/hr/onboarding")}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-sm"
                    >
                      <Plus className="w-5 h-5" />
                      Onboard Employee
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-5 px-7 text-xs font-bold text-gray-700 capitalize tracking-wider">
                        Employee ID
                      </th>
                      <th className="text-left py-5 px-7 text-xs font-bold text-gray-700 capitalize tracking-wider">
                        Employee
                      </th>
                      <th className="text-left py-5 px-7 text-xs font-bold text-gray-700 capitalize tracking-wider">
                        Contact
                      </th>
                      <th className="text-left py-5 px-7 text-xs font-bold text-gray-700 capitalize tracking-wider">
                        Department
                      </th>
                      <th className="text-left py-5 px-7 text-xs font-bold text-gray-700 capitalize tracking-wider">
                        Sub-Department
                      </th>
                      <th className="text-left py-5 px-7 text-xs font-bold text-gray-700 capitalize tracking-wider">
                        Join Date
                      </th>
                      <th className="text-left py-5 px-7 text-xs font-bold text-gray-700 capitalize tracking-wider">
                        Status
                      </th>
                      <th className="text-center py-5 px-7 text-xs font-bold text-gray-700 capitalize tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="py-12 px-7 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Loader className="w-5 h-5 animate-spin text-blue-500" />
                            <span className="text-gray-600 font-medium">
                              Loading employees...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 px-7 text-center">
                          <span className="text-gray-500">
                            No employees found
                          </span>
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map((employee) => (
                        <tr
                          key={employee.id}
                          className="hover:bg-blue-50 transition-colors duration-150 group"
                        >
                          <td className="py-5 px-7">
                            <span className="font-bold text-blue-600 text-sm bg-blue-50 px-4 py-2 rounded-lg group-hover:bg-blue-100">
                              {employee.employee_id}
                            </span>
                          </td>
                          <td className="py-5 px-7">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {employee.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {employee.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {employee.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-7">
                            <div className="flex items-center gap-2 text-gray-700 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">
                                {employee.phone || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-7">
                            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wide">
                              {employee.department || "N/A"}
                            </span>
                          </td>
                          <td className="py-5 px-7">
                            <p className="text-gray-900 font-medium text-sm">
                              {employee.sub_department || "N/A"}
                            </p>
                          </td>
                          <td className="py-5 px-7">
                            <p className="text-gray-700 text-sm font-medium">
                              {employee.join_date
                                ? new Date(
                                    employee.join_date,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </td>
                          <td className="py-5 px-7">
                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold capitalize tracking-wide">
                              {employee.status || "Active"}
                            </span>
                          </td>
                          <td className="py-5 px-7">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleViewDetails(employee)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all font-medium"
                                title="View Details"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteEmployee(employee.id)
                                }
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all font-medium"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredEmployees.length > 0 && (
                <div className="flex items-center justify-between px-7 py-6 bg-gray-50 border-t border-gray-100">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing{" "}
                    <span className="font-bold text-gray-900">
                      {startIndex + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-gray-900">
                      {Math.min(endIndex, filteredEmployees.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-gray-900">
                      {filteredEmployees.length}
                    </span>{" "}
                    employees
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 rounded-lg font-medium transition-all ${
                                currentPage === pageNum
                                  ? "bg-blue-500 text-white shadow-md"
                                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}
                      {totalPages > 5 && (
                        <>
                          <span className="text-gray-400 px-2">...</span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className={`px-3 py-2 rounded-lg font-medium transition-all ${
                              currentPage === totalPages
                                ? "bg-blue-500 text-white shadow-md"
                                : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredEmployees.length === 0 && (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No employees found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Employee modal removed; use Onboard Employee page instead */}

      {/* Employee Details Modal */}
      {showDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[95vh] overflow-y-auto">
            {/* Header - Sticky */}
            <div className="sticky top-0 flex justify-between items-start p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl gap-4">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Employee Details
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 mt-1">
                  ID: {selectedEmployee.employee_id}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Top Summary */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg shrink-0">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-sm sm:text-lg text-slate-600 mt-1">
                    {selectedEmployee.sub_department || ""}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
                      {isEditMode ? (
                        <select
                          value={editFormData.status || "Active"}
                          onChange={(e) =>
                            handleEditFormChange("status", e.target.value)
                          }
                          className="bg-green-100 text-green-700 border-0 outline-none cursor-pointer font-semibold"
                        >
                          <option>Active</option>
                          <option>Inactive</option>
                          <option>On Leave</option>
                        </select>
                      ) : (
                        selectedEmployee.status || "Active"
                      )}
                    </span>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold">
                      {selectedEmployee.department}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Contact Information */}
                <CompactField
                  icon={Mail}
                  label="Email"
                  value={selectedEmployee.email}
                  isEditMode={isEditMode}
                  editValue={editFormData?.email}
                  onChange={(val) => handleEditFormChange("email", val)}
                  readOnly={true}
                />
                <CompactField
                  icon={Phone}
                  label="Phone"
                  value={selectedEmployee.phone}
                  isEditMode={isEditMode}
                  editValue={editFormData?.phone}
                  onChange={(val) => handleEditFormChange("phone", val)}
                />
                <CompactField
                  icon={Calendar}
                  label="Join Date"
                  value={
                    selectedEmployee.join_date
                      ? new Date(
                          selectedEmployee.join_date,
                        ).toLocaleDateString()
                      : "N/A"
                  }
                  isEditMode={isEditMode}
                  editValue={
                    editFormData?.join_date
                      ? editFormData.join_date.split("T")[0]
                      : ""
                  }
                  onChange={(val) => handleEditFormChange("join_date", val)}
                  type="date"
                />

                {/* Employment Details */}
                <CompactField
                  icon={Briefcase}
                  label="Department"
                  value={selectedEmployee.department}
                  isEditMode={isEditMode}
                  editValue={editFormData?.department}
                  onChange={(val) => handleEditFormChange("department", val)}
                />
                {selectedEmployee.sub_department && (
                  <CompactField
                    label="Sub-Department"
                    value={selectedEmployee.sub_department}
                    isEditMode={isEditMode}
                    editValue={editFormData?.sub_department}
                    onChange={(val) =>
                      handleEditFormChange("sub_department", val)
                    }
                  />
                )}
                {selectedEmployee.designation && (
                  <CompactField
                    label="Designation"
                    value={selectedEmployee.designation}
                    isEditMode={isEditMode}
                    editValue={editFormData?.designation}
                    onChange={(val) => handleEditFormChange("designation", val)}
                  />
                )}

                {/* Personal Information */}
                {selectedEmployee.cnic && (
                  <CompactField
                    label="CNIC"
                    value={selectedEmployee.cnic}
                    isEditMode={isEditMode}
                    editValue={editFormData?.cnic}
                    onChange={(val) => handleEditFormChange("cnic", val)}
                  />
                )}

                {/* New: Date of Birth */}
                <CompactField
                  icon={Calendar}
                  label="Date of Birth"
                  value={
                    selectedEmployee.dob
                      ? new Date(selectedEmployee.dob).toLocaleDateString()
                      : "N/A"
                  }
                  isEditMode={isEditMode}
                  editValue={
                    editFormData?.dob ? editFormData.dob.split("T")[0] : ""
                  }
                  onChange={(val) => handleEditFormChange("dob", val)}
                  type="date"
                />

                {/* CNIC Issue & Expiry */}
                <CompactField
                  label="CNIC Issue"
                  value={
                    selectedEmployee.cnic_issue_date
                      ? new Date(
                          selectedEmployee.cnic_issue_date,
                        ).toLocaleDateString()
                      : "N/A"
                  }
                  isEditMode={isEditMode}
                  editValue={
                    editFormData?.cnic_issue_date
                      ? editFormData.cnic_issue_date.split("T")[0]
                      : ""
                  }
                  onChange={(val) =>
                    handleEditFormChange("cnic_issue_date", val)
                  }
                  type="date"
                />
                <CompactField
                  label="CNIC Expiry"
                  value={
                    selectedEmployee.cnic_expiry_date
                      ? new Date(
                          selectedEmployee.cnic_expiry_date,
                        ).toLocaleDateString()
                      : "N/A"
                  }
                  isEditMode={isEditMode}
                  editValue={
                    editFormData?.cnic_expiry_date
                      ? editFormData.cnic_expiry_date.split("T")[0]
                      : ""
                  }
                  onChange={(val) =>
                    handleEditFormChange("cnic_expiry_date", val)
                  }
                  type="date"
                />

                {/* CNIC Document Status */}
                <CompactField
                  label="CNIC Status"
                  value={selectedEmployee.cnic_document_status || "N/A"}
                  isEditMode={false}
                />

                {selectedEmployee.emergency_contact && (
                  <CompactField
                    label="Emergency Contact"
                    value={selectedEmployee.emergency_contact}
                    isEditMode={isEditMode}
                    editValue={editFormData?.emergency_contact}
                    onChange={(val) =>
                      handleEditFormChange("emergency_contact", val)
                    }
                  />
                )}
                {selectedEmployee.address && (
                  <CompactField
                    icon={MapPin}
                    label="Address"
                    value={selectedEmployee.address}
                    isEditMode={isEditMode}
                    editValue={editFormData?.address}
                    onChange={(val) => handleEditFormChange("address", val)}
                  />
                )}

                {/* Financial Information */}
                {selectedEmployee.bank_account && (
                  <CompactField
                    label="Bank Account"
                    value={selectedEmployee.bank_account}
                    isEditMode={isEditMode}
                    editValue={editFormData?.bank_account}
                    onChange={(val) =>
                      handleEditFormChange("bank_account", val)
                    }
                  />
                )}
                {selectedEmployee.tax_id && (
                  <CompactField
                    label="Tax ID"
                    value={selectedEmployee.tax_id}
                    isEditMode={isEditMode}
                    editValue={editFormData?.tax_id}
                    onChange={(val) => handleEditFormChange("tax_id", val)}
                  />
                )}
                {selectedEmployee.base_salary && (
                  <CompactField
                    label="Base Salary"
                    value={`PKR ${Number(selectedEmployee.base_salary).toLocaleString()}`}
                    isEditMode={isEditMode}
                    editValue={editFormData?.base_salary || ""}
                    onChange={(val) => handleEditFormChange("base_salary", val)}
                    type="number"
                  />
                )}
              </div>

              {/* Allowances Section - HR can add/remove allowances */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <div className="p-4 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Allowances</h4>
                    {isEditMode && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={editFormData?.newAllowanceName || ""}
                          onChange={(e) =>
                            handleEditFormChange(
                              "newAllowanceName",
                              e.target.value,
                            )
                          }
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={editFormData?.newAllowanceAmount || ""}
                          onChange={(e) =>
                            handleEditFormChange(
                              "newAllowanceAmount",
                              e.target.value,
                            )
                          }
                          className="px-3 py-2 border rounded w-36"
                        />
                        <button
                          type="button"
                          onClick={addAllowance}
                          className="px-3 py-2 bg-green-500 text-white rounded"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(editFormData?.allowances &&
                    editFormData.allowances.length > 0
                      ? editFormData.allowances
                      : selectedEmployee.allowances || []
                    ).map((a, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-semibold">
                            {a.allowance_name || a.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            PKR{" "}
                            {Number(
                              a.allowance_amount || a.amount,
                            ).toLocaleString()}
                          </p>
                        </div>
                        {isEditMode && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeAllowance(idx)}
                              className="text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {(!editFormData?.allowances ||
                      editFormData.allowances.length === 0) &&
                      (!selectedEmployee.allowances ||
                        selectedEmployee.allowances.length === 0) && (
                        <p className="text-sm text-gray-500">
                          No allowances assigned.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Dynamic Resources Section - HR can allocate resources */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <div className="p-4 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Resources (Dynamic)
                    </h4>
                    {isEditMode && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Resource Name"
                          value={editFormData?.newResourceName || ""}
                          onChange={(e) =>
                            handleEditFormChange(
                              "newResourceName",
                              e.target.value,
                            )
                          }
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Serial (optional)"
                          value={editFormData?.newResourceSerial || ""}
                          onChange={(e) =>
                            handleEditFormChange(
                              "newResourceSerial",
                              e.target.value,
                            )
                          }
                          className="px-3 py-2 border rounded w-36"
                        />
                        <button
                          type="button"
                          onClick={addDynamicResource}
                          className="px-3 py-2 bg-green-500 text-white rounded"
                        >
                          Allocate
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(editFormData?.dynamic_resources &&
                    editFormData.dynamic_resources.length > 0
                      ? editFormData.dynamic_resources
                      : editFormData?.dynamicResources &&
                          editFormData.dynamicResources.length > 0
                        ? editFormData.dynamicResources
                        : selectedEmployee.dynamicResources || []
                    ).map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-semibold">
                            {r.resource_name || r.name}
                          </p>
                          {r.resource_serial && (
                            <p className="text-sm text-gray-500">
                              SN: {r.resource_serial || r.serial}
                            </p>
                          )}
                        </div>
                        {isEditMode && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeDynamicResource(idx)}
                              className="text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {(!editFormData?.dynamic_resources ||
                      editFormData.dynamic_resources.length === 0) &&
                      (!selectedEmployee.dynamicResources ||
                        selectedEmployee.dynamicResources.length === 0) && (
                        <p className="text-sm text-gray-500">
                          No dynamic resources allocated.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Sticky Footer */}
              <div className="sticky bottom-0 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-200 bg-white">
                {!isEditMode ? (
                  <>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm sm:text-base"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleEditEmployee(selectedEmployee)}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditMode(false)}
                      disabled={isSaving}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium disabled:opacity-50 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEmployee}
                      disabled={isSaving}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      {isSaving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Component: Compact Field Display/Edit
const CompactField = ({
  icon: Icon,
  label,
  value,
  isEditMode,
  editValue,
  onChange,
  type = "text",
  readOnly = false,
}) => {
  return (
    <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100 hover:border-blue-300 transition">
      <p className="text-xs font-semibold text-slate-600 capitalize tracking-wide flex items-center gap-1 mb-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      {isEditMode && !readOnly ? (
        <input
          type={type}
          value={editValue || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white text-slate-800 font-semibold border border-blue-300 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      ) : (
        <p className="text-slate-800 font-semibold text-sm">{value || "—"}</p>
      )}
    </div>
  );
};

// Helper Component: Resource Item Display
const ResourceItem = ({ name, serial }) => {
  return (
    <div className="p-2.5 sm:p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-400 transition text-center">
      <p className="text-xs sm:text-sm font-bold text-amber-900">{name}</p>
      {serial && (
        <p className="text-xs text-amber-700 mt-1 truncate" title={serial}>
          {serial}
        </p>
      )}
    </div>
  );
};

export default EmployeeManagement;
