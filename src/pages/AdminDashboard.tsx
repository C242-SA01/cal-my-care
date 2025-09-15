import AdminStats from "@/components/admin/AdminStats";

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <AdminStats />
    </div>
  );
};

export default AdminDashboard;
