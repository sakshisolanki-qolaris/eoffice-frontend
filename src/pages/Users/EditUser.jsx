import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { endpoints } from "../../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { UserCog, Loader2, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Import the shared UI hook and component created in the previous step
import {
  useUserFormOptions,
  SharedUserSelects,
} from "../../components/SharedUserFormUI";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm();

  // 1. Use the shared hook to fetch roles, designations, and departments
  const { depts, designations, allowedRoles } = useUserFormOptions();

  // 2. Fetch the specific User's Data
  const { data: userToEdit, isLoading } = useQuery({
    queryKey: ["userToEdit", id],
    queryFn: async () => {
      const res = await endpoints.users.getAll();
      return res.data.data.find((u) => u.id === Number.parseInt(id, 10));
    },
  });

  useEffect(() => {
    if (userToEdit) {
      setValue("fullName", userToEdit.full_name);
      setValue("phoneNumber", userToEdit.phone_number);
      setValue("email", userToEdit.email);
      setValue("systemRole", userToEdit.system_role);
      setValue(
        "designationId",
        userToEdit.designation?.id || userToEdit.designation_id,
      );
      setValue(
        "departmentId",
        userToEdit.department?.id || userToEdit.department_id,
      );
      setValue("isActive", userToEdit.is_active);
    }
  }, [userToEdit, setValue]);

  const onSubmit = async (data) => {
    try {
      const { phoneNumber, ...payload } = data;

      await endpoints.users.update(id, payload);

      if (currentUser?.id === Number.parseInt(id, 10)) {
        const { data: allUsers } = await endpoints.users.getAll();
        const freshUser = allUsers.data.find(
          (u) => u.id === Number.parseInt(id, 10),
        );

        if (freshUser) {
          updateUser({
            fullName: freshUser.full_name,
            email: freshUser.email,
            systemRole: freshUser.system_role,
            designation: freshUser.designation,
            department: freshUser.department,
          });
        }
      }

      toast.success("User updated successfully");
      navigate("/users");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Update failed");
    }
  };

  if (isLoading)
    return (
      <div className="p-10 text-center text-teal-600">Loading user data...</div>
    );

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-fade-in-up">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-8">
        <div className="p-3 bg-teal-50 rounded-xl text-teal-600 border border-teal-100">
          <UserCog size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Edit Official Profile
          </h2>
          <p className="text-sm text-slate-500">
            Update system access and details.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Full Name
          </label>
          <input
            id="fullName"
            {...register("fullName")}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-semibold text-slate-400 mb-2"
          >
            Phone (Read Only)
          </label>
          <input
            id="phoneNumber"
            {...register("phoneNumber")}
            disabled
            className="w-full border p-3 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Email
          </label>
          <input
            id="email"
            {...register("email")}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        {/* 3. Replaced the 3 duplicate <select> blocks with the Shared Component */}
        <SharedUserSelects
          register={register}
          allowedRoles={allowedRoles}
          designations={designations}
          depts={depts}
        />

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            {...register("isActive")}
            className="w-5 h-5 text-teal-600"
          />
          <label
            htmlFor="isActive"
            className="text-sm font-semibold text-slate-700"
          >
            Account Active
          </label>
        </div>

        <div className="md:col-span-2 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 font-bold flex justify-center gap-2 items-center disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Save size={20} /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
