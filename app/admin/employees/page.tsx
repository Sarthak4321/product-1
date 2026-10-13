"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ChevronRight,
  X,
  RefreshCw,
  Check,
  Copy,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/components/context/AppContext";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  joiningDate: string;
  status: "ACTIVE" | "PROBATION" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  userId?: string;
  user?: { id: string; name: string; email: string; role: string };
  createdAt: string;
}

export default function AdminEmployeesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, userLoading } = useApp();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State - New Employee
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmploymentType, setNewEmploymentType] = useState("FULL_TIME");
  const [newJoiningDate, setNewJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [userRole, setUserRole] = useState("HR");
  const [userPassword, setUserPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [copiedOrgCode, setCopiedOrgCode] = useState(false);

  const orgRoomCode = user?.organization?.code || user?.organization?.slug || user?.organizationId || "";

  const handleCopyOrgCode = () => {
    if (!orgRoomCode) return;
    navigator.clipboard.writeText(orgRoomCode);
    setCopiedOrgCode(true);
    showToast(`Copied Organization Code: ${orgRoomCode}`, "success");
    setTimeout(() => setCopiedOrgCode(false), 3000);
  };

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/hr/employees?${params.toString()}`);
      const empData = await res.json();

      if (res.ok) setEmployees(empData.employees || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load employee data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user) {
      fetchData();
    }
  }, [userLoading, user, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newEmail.trim() || !userPassword.trim()) {
      showToast("Please fill in Name, Email, and Password", "error");
      return;
    }

    const nameParts = newFirstName.trim().split(" ");
    const fName = nameParts[0] || "Staff";
    const lName = nameParts.slice(1).join(" ") || newLastName || "Member";
    const empId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      setSubmitting(true);
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: empId,
          firstName: fName,
          lastName: lName,
          email: newEmail.trim(),
          phone: newPhone.trim(),
          employmentType: newEmploymentType,
          joiningDate: newJoiningDate,
          createUserAccount: true,
          userRole,
          userPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee");

      showToast(`Employee ${fName} ${lName} added successfully!`, "success");
      setShowAddModal(false);
      resetAddForm();
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPhone("");
    setNewEmploymentType("FULL_TIME");
    setUserRole("HR");
    setUserPassword("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
      case "PROBATION":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Probation
          </span>
        );
      case "ON_LEAVE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            On Leave
          </span>
        );
      case "RESIGNED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Resigned
          </span>
        );
      case "TERMINATED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Terminated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "HR":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            HR Manager
          </span>
        );
      case "TEACHER":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Teacher / Faculty
          </span>
        );
      case "COUNSELLOR":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Counsellor
          </span>
        );
      case "ORG_ADMIN":
      case "ADMIN":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ff5a36]/10 text-[#ff5a36] border border-[#ff5a36]/20">
            Org Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Staff Member
          </span>
        );
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (roleFilter === "ALL") return true;
    const empRole = emp.user?.role || "EMPLOYEE";
    return empRole === roleFilter;
  });

  // Metric Stats
  const totalStaff = employees.length;
  const activeStaff = employees.filter((e) => e.status === "ACTIVE").length;
  const counsellorsCount = employees.filter((e) => (e.user?.role || "") === "COUNSELLOR").length;
  const teachersHrCount = employees.filter((e) => ["TEACHER", "HR"].includes(e.user?.role || "")).length;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-12">
      <Header user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Employee Directory
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Manage staff profiles, roles, and organization team members.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Room Code Display */}
            {orgRoomCode && (
              <div className="inline-flex items-center gap-1.5 bg-blue-500 border border-slate-200 px-3 py-1.5 rounded-lg text-x">
                <span className="text-slate-600 font-medium text-white">Org Code:</span>
                <code className="font-mono font-bold text-white">
                  {orgRoomCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyOrgCode}
                  className="p-1 hover:bg-slate-200 rounded transition-colors text-white hover:text-slate-800"
                  title="Copy Org Code"
                >
                  {copiedOrgCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-2 bg-[#ff5a36] hover:bg-[#e04826] text-white text-xl shadow-xs font-extrabold px-4 py-2"
            >
              <span className="text-l font-bold">Add Employee</span>
            </Button>
          </div>
        </div>

        {/* Employee Count Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Total Staff</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalStaff}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Active Members</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{activeStaff}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Counsellors</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{counsellorsCount}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Teachers & HR</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-1">{teachersHrCount}</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5a36]/20 focus:border-[#ff5a36]"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs py-2 bg-slate-50 border-slate-200"
              >
                <option value="ALL">All Roles</option>
                <option value="HR">HR Managers</option>
                <option value="TEACHER">Teachers & Faculty</option>
                <option value="COUNSELLOR">Counsellors</option>
                <option value="EMPLOYEE">Staff Members</option>
                <option value="ORG_ADMIN">Org Admins</option>
              </Select>

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-2 bg-slate-50 border-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PROBATION">Probation</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
              </Select>

              <Button type="submit" variant="secondary" size="sm" className="gap-1.5 text-xs font-semibold px-4">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </Button>
            </div>
          </form>
        </div>

        {/* Directory Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#ff5a36] mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading employee directory...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No staff members found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              No staff members match the selected criteria. Try adjusting your search query or filters.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setRoleFilter("ALL");
              }}
              className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Joined</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 font-semibold text-slate-700 flex items-center justify-center text-xs border border-slate-200">
                            {emp.firstName.charAt(0)}
                            {emp.lastName.charAt(0)}
                          </div>
                          <div>
                            <Link
                              href={`/admin/employees/${emp.id}`}
                              className="font-bold text-slate-900 hover:text-[#ff5a36] transition-colors text-xs"
                            >
                              {emp.firstName} {emp.lastName}
                            </Link>
                            <p className="text-[11px] text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {getRoleBadge(emp.user?.role)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-600">
                        {emp.phone || <span className="text-slate-400 font-normal">—</span>}
                      </td>

                      <td className="px-5 py-4">
                        {getStatusBadge(emp.status)}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {new Date(emp.joiningDate).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/employees/${emp.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          View Profile
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add New Employee</h2>
                <p className="text-slate-400 text-[11px]">Create staff account & login access</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Organization ID Callout & Login Note */}
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 mb-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-950 text-xs">
                  Organization Code:{" "}
                  <code className="bg-white text-amber-950 px-2 py-0.5 rounded font-mono font-bold text-xs border border-amber-300">
                    {orgRoomCode || "N/A"}
                  </code>
                </span>
                {orgRoomCode && (
                  <button
                    type="button"
                    onClick={handleCopyOrgCode}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-2.5 py-1 rounded transition-colors"
                  >
                    {copiedOrgCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedOrgCode ? "Copied!" : "Copy Code"}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                📌 <strong>Share with your Employee:</strong> Provide this <strong>Organization Code</strong> along with their email and password so they can log in via the Employee Login Portal.
              </p>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <Input
                  value={newFirstName}
                  onChange={(e) => {
                    const parts = e.target.value.split(" ");
                    setNewFirstName(e.target.value);
                    setNewLastName(parts.slice(1).join(" "));
                  }}
                  placeholder="e.g. Ramesh Verma"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ramesh@coachingcenter.com"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Role / Access Level
                  </label>
                  <Select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                  >
                    <option value="HR">HR Manager (Staff & HR Ops)</option>
                    <option value="TEACHER">Teacher / Faculty Member</option>
                    <option value="COUNSELLOR">Counsellor (Leads & Calling)</option>
                    <option value="EMPLOYEE">Staff Member</option>
                    <option value="ORG_ADMIN">Organization Admin</option>
                  </Select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Employment Type
                  </label>
                  <Select
                    value={newEmploymentType}
                    onChange={(e) => setNewEmploymentType(e.target.value)}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Login Password *
                </label>
                <Input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                  className="bg-[#ff5a36] hover:bg-[#e04826] text-white font-medium px-4"
                >
                  {submitting ? "Saving..." : "Create Employee"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav user={user} />
    </div>
  );
}
