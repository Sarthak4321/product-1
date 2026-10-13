"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit2,
  UserX,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/components/context/AppContext";

interface EmployeeDetail {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  joiningDate: string;
  exitDate?: string;
  status: "ACTIVE" | "PROBATION" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  userId?: string;
  user?: { id: string; name: string; email: string; role: string };
  department?: { id: string; name: string; code?: string; description?: string };
  designation?: { id: string; title: string; code?: string };
  manager?: { id: string; firstName: string; lastName: string; employeeId: string };
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { showToast } = useToast();
  const { user, userLoading } = useApp();

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hr/employees/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load employee profile");
      setEmployee(data.employee);

      // Populate edit fields
      setFirstName(data.employee.firstName);
      setLastName(data.employee.lastName);
      setPhone(data.employee.phone || "");
      setStatus(data.employee.status);
      setEmploymentType(data.employee.employmentType);
      setEmergencyContactName(data.employee.emergencyContactName || "");
      setEmergencyContactPhone(data.employee.emergencyContactPhone || "");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user && id) {
      fetchEmployee();
    }
  }, [userLoading, user, id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          status,
          employmentType,
          emergencyContactName,
          emergencyContactPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("Employee profile updated successfully!", "success");
      setShowEditModal(false);
      fetchEmployee();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("Employee deactivated successfully", "success");
      setShowDeactivateConfirm(false);
      fetchEmployee();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Header user={user} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#ff5a36] mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Header user={user} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <UserX className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Employee Profile Not Found</h2>
          <Link href="/admin/employees" className="mt-4 inline-block text-sm font-semibold text-[#ff5a36]">
            &larr; Back to Employee Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-12">
      <Header user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Back Link */}
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employee Directory
        </Link>

        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white font-bold text-xl flex items-center justify-center shadow-md">
              {employee.firstName.charAt(0)}
              {employee.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {employee.employeeId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>{employee.designation?.title || "No Designation"}</span>
                <span>&bull;</span>
                <span>{employee.department?.name || "No Department"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="gap-2 border-slate-300 text-slate-700"
            >
              <Edit2 className="w-4 h-4 text-slate-500" />
              Edit Profile
            </Button>
            {employee.status !== "TERMINATED" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeactivateConfirm(true)}
                className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                <UserX className="w-4 h-4" />
                Deactivate
              </Button>
            ) : (
              <span className="text-xs font-semibold px-3 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                Terminated / Inactive
              </span>
            )}
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employment Overview */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#ff5a36]" />
              Employment Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Status</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{employee.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Employment Type</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{employee.employmentType}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Joining Date</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {new Date(employee.joiningDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Exit Date</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {employee.exitDate ? new Date(employee.exitDate).toLocaleDateString() : "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Personal Info */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#ff5a36]" />
              Contact Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Email</span>
                <span className="font-semibold text-slate-800">{employee.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Phone</span>
                <span className="font-semibold text-slate-800">{employee.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Emergency Contact</span>
                <span className="font-semibold text-slate-800">
                  {employee.emergencyContactName ? `${employee.emergencyContactName} (${employee.emergencyContactPhone || ""})` : "Not provided"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Linked User Account Info */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            CRM User Credentials Link
          </h3>

          {employee.user ? (
            <div className="mt-3 flex items-center justify-between bg-purple-50/50 p-3 rounded-lg border border-purple-100 text-xs">
              <div>
                <p className="font-bold text-purple-900">{employee.user.name}</p>
                <p className="text-purple-700">{employee.user.email}</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-900 font-bold text-[11px]">
                {employee.user.role}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2">
              This employee profile is not linked to an active CRM login account.
            </p>
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#ff5a36]" />
                Edit Employee Profile
              </h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="ACTIVE">Active</option>
                    <option value="PROBATION">Probation</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="RESIGNED">Resigned</option>
                    <option value="TERMINATED">Terminated</option>
                  </Select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
                  <Select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                  <Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                  <Input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} size="sm" className="bg-[#ff5a36] text-white">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-rose-500 bg-rose-50 p-2.5 rounded-full" />
            <h3 className="text-base font-bold text-slate-900">Deactivate Employee Profile?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to deactivate <strong className="text-slate-800">{employee.firstName} {employee.lastName}</strong>? Their status will be set to TERMINATED.
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeactivateConfirm(false)}>
                Cancel
              </Button>
              <Button disabled={submitting} size="sm" onClick={handleDeactivate} className="bg-rose-600 hover:bg-rose-700 text-white">
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav user={user} />
    </div>
  );
}
