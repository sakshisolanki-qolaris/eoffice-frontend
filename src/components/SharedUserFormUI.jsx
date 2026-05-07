import React from "react";
import PropTypes from "prop-types";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../api/axios";

// 1. Shared Custom Hook for API fetching
export const useUserFormOptions = () => {
  const { data: depts = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await endpoints.users.getDepartments();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  const { data: designations = [] } = useQuery({
    queryKey: ["designations"],
    queryFn: async () => {
      const res = await endpoints.users.getDesignations();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  const { data: allowedRoles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await endpoints.common.constants();
      return Object.values(res.data.data.ROLES);
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  return { depts, designations, allowedRoles };
};

// 2. Shared Select Dropdowns Component
export const SharedUserSelects = ({ register, allowedRoles, designations, depts }) => {
  return (
    <>
      <div>
        <label htmlFor="systemRole" className="block text-sm font-semibold text-slate-700 mb-2">
          System Role
        </label>
        <select
          id="systemRole"
          {...register("systemRole", { required: true })}
          className="w-full border border-slate-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 outline-none"
        >
          <option value="">Select Role</option>
          {allowedRoles.map((role) => (
            <option key={role} value={role}>
              {role.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="designationId" className="block text-sm font-semibold text-slate-700 mb-2">
          Designation
        </label>
        <select
          id="designationId"
          {...register("designationId", { required: true })}
          className="w-full border border-slate-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 outline-none"
        >
          {designations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="departmentId" className="block text-sm font-semibold text-slate-700 mb-2">
          Department
        </label>
        <select
          id="departmentId"
          {...register("departmentId", { required: true })}
          className="w-full border border-slate-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 outline-none"
        >
          {depts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

SharedUserSelects.propTypes = {
  register: PropTypes.func.isRequired,
  allowedRoles: PropTypes.array.isRequired,
  designations: PropTypes.array.isRequired,
  depts: PropTypes.array.isRequired,
};