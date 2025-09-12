import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, TrendingUp, BookOpen, LogOut } from "lucide-react";
import AdminStats from "@/components/admin/AdminStats";
import PatientManagement from "@/components/admin/PatientManagement";
import EducationManagement from "@/components/admin/EducationManagement";
import { toast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string | null;
  role: string;
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data && (data.role === "midwife" || data.role === "admin")) {
        setProfile(data);
      } else {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki akses ke dashboard admin.",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Dashboard Admin CallMyCare
                </h1>
                <p className="text-sm text-muted-foreground">
                  Selamat datang, {profile.full_name || "Admin"}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manajemen Pasien
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Manajemen Edukasi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminStats />
          </TabsContent>

          <TabsContent value="patients">
            <PatientManagement />
          </TabsContent>

          <TabsContent value="education">
            <EducationManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;