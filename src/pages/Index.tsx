import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

const Index = () => {
  const { role } = useAuth();

  if (role === "admin") {
    return <AdminDashboard />;
  }

  return <EmployeeDashboard />;
};

export default Index;
