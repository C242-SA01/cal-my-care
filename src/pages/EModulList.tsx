import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

type EModule = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  file_url: string | null;
  published: boolean;
  cover_image_url: string | null;
};

export default function EModulList() {
  const [modules, setModules] = useState<EModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchModules = async () => {
      setIsLoading(true);
      // RLS ensures only published modules are returned to non-admins,
      // but we can be explicit here as well.
      const { data, error } = await supabase
        .from("e_modules")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch e-modules.",
          variant: "destructive",
        });
        console.error(error);
      } else {
        setModules(data as EModule[]);
      }
      setIsLoading(false);
    };

    fetchModules();
  }, [toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">E-Modul Edukasi</h1>
        <p className="text-muted-foreground">Materi edukasi untuk kesehatan mental Anda.</p>
      </div>
      {modules.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
            <h2 className="text-xl font-semibold">Belum Ada Modul</h2>
            <p className="text-muted-foreground mt-2">Saat ini belum ada modul edukasi yang tersedia. Silakan kembali lagi nanti.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate">{module.title}</CardTitle>
                {module.description && <CardDescription>{module.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-grow">
                <img
                  src={module.cover_image_url || 'https://via.placeholder.com/300'}
                  alt={module.title}
                  className="rounded-md object-cover h-48 w-full"
                />
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={`/emodules/${module.id}`}>
                    Baca Selengkapnya
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
