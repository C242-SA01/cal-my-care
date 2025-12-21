import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import FlipbookViewer from '@/components/admin/FlipbookViewer';

// Define a type for our E-Module until types are auto-generated
type EModule = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  file_url: string | null;
  published: boolean;
  cover_image_url: string | null;
  category: string | null;
  tags: string[] | null;
};

export default function EModulAdminList() {
  const [modules, setModules] = useState<EModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<EModule | null>(null);
  const { toast } = useToast();

  const fetchModules = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('e_modules').select('*').order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch e-modules.',
        variant: 'destructive',
      });
      console.error(error);
    } else {
      setModules(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleDelete = async (id: string) => {
    // First, delete the associated files if any (cover image, module file)
    const moduleToDelete = modules.find((m) => m.id === id);
    if (moduleToDelete) {
      try {
        if (moduleToDelete.cover_image_url) {
          const coverPath = moduleToDelete.cover_image_url.split('/').pop();
          if (coverPath) await supabase.storage.from('e-modules').remove([coverPath]);
        }
        if (moduleToDelete.file_url) {
          const filePath = moduleToDelete.file_url.split('/').pop();
          if (filePath) await supabase.storage.from('e-modules').remove([filePath]);
        }
      } catch (storageError) {
        console.error('Error deleting storage files, proceeding with DB deletion.', storageError);
      }
    }

    try {
      const { error } = await supabase.from('e_modules').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'E-Modul deleted successfully.',
      });
      fetchModules(); // Refresh the list
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete e-modul.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">E-Modul Management</h1>
        <Button asChild>
          <Link to="/admin/emodules/new">Add New E-Modul</Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.id}>
            <CardHeader>
              <CardTitle className="truncate">{module.title}</CardTitle>
              <CardDescription>
                <Badge variant={module.published ? 'default' : 'secondary'}>{module.published ? 'Published' : 'Draft'}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <img src={module.cover_image_url || 'https://via.placeholder.com/300'} alt={module.title} className="rounded-md object-cover h-48 w-full" />
              <div className="mt-4">
                {module.category && <p className="text-sm text-gray-500">Category: {module.category}</p>}
                {module.tags && module.tags.length > 0 && (
                  <div className="mt-2">
                    {module.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="mr-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedModule(module)}>
                View
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/admin/emodules/${module.id}/edit`}>Edit</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the e-modul and its associated files.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(module.id)}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedModule && (
        <Dialog open={!!selectedModule} onOpenChange={(isOpen) => !isOpen && setSelectedModule(null)}>
          <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>{selectedModule.title}</DialogTitle>
              <DialogDescription>{selectedModule.description}</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
              {selectedModule.file_url ? (
                <FlipbookViewer
                  pdfUrl={selectedModule.file_url}
                  title={selectedModule.title}
                  cover={selectedModule.cover_image_url}
                  maxViewerHeight={window.innerHeight * 0.8} // Pass down a sensible max height
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>No PDF available for this module.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
