import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { endpoints } from "../../api/axios";
import {
  User,
  Mail,
  Phone,
  Shield,
  Briefcase,
  Building,
  Key,
  ShieldCheck,
  Calendar,
  Loader2,
  PenTool,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(user);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await endpoints.auth.getMe();
        if (data.success) {
          setProfileData(data.data);
          updateUser(data.data); // Sync local storage/context with fresh data
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
        toast.error("Could not refresh profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [updateUser]);

  if (loading && !profileData) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  const InfoCard = ({ icon: Icon, label, value, colorClass = "text-slate-600" }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:shadow-sm">
      <div className={`p-2 rounded-lg bg-white shadow-sm ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-700 mt-0.5">{value || "N/A"}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white/20 transform transition-transform group-hover:scale-105">
              {profileData?.fullName?.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-full border-4 border-slate-900 shadow-lg">
              <ShieldCheck size={16} />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-black tracking-tight">{profileData?.fullName}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 backdrop-blur-sm">
                {profileData?.systemRole}
              </span>
              <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-bold uppercase tracking-widest border border-teal-500/20 backdrop-blur-sm">
                {profileData?.designation}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <User size={18} className="text-teal-600" />
              <h2 className="text-lg font-bold text-slate-800">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard icon={Mail} label="Email Address" value={profileData?.email} colorClass="text-blue-500" />
              <InfoCard icon={Phone} label="Phone Number" value={profileData?.phoneNumber} colorClass="text-green-500" />
              <InfoCard icon={Building} label="Department" value={profileData?.department} colorClass="text-purple-500" />
              <InfoCard icon={Briefcase} label="Designation" value={profileData?.designation} colorClass="text-orange-500" />
              <InfoCard icon={Shield} label="System Role" value={profileData?.systemRole} colorClass="text-rose-500" />
              
            </div>
          </div>

         
        </div>

        {/* Security Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <Key size={18} className="text-teal-600" />
              <h2 className="text-lg font-bold text-slate-800">Security</h2>
            </div>
            
            <div className="space-y-3">
              <Link 
                to="/auth/change-password"
                className="flex items-center justify-between p-4 rounded-2xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Key size={18} />
                  <span className="text-sm font-bold">Change Password</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-sm group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </Link>

              <Link 
                to="/auth/set-pin"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors group border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} />
                  <span className="text-sm font-bold">Set Security PIN</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </Link>
            </div>
            
            <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Privacy Note</p>
              <p className="text-[11px] text-amber-600 leading-relaxed font-medium">
                Keep your login credentials and security PIN private. Never share your password with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
