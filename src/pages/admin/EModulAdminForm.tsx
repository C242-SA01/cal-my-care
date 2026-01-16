import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadEModuleFile } from "@/lib/storage";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  published: z.boolean().default(false),
  // URLs will be strings, but the form will handle File objects
  cover_image_url: z.string().optional(),
  file_url: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
});

type EModulFormValues = z.infer<typeof formSchema>;

export default function EModulAdminForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [moduleFile, setModuleFile] = useState<File | null>(null);

  const form = useForm<EModulFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      published: false,
      cover_image_url: "",
      file_url: "",
      category: "",
      tags: "",
    },
  });

  const isEditMode = !!id;
  const draftKey = isEditMode ? `emodule-form-draft-${id}` : "emodule-form-draft-new";

  useEffect(() => {
    if (isEditMode) {
      const fetchModule = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("e_modules")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          toast({
            title: "Error",
            description: "Failed to fetch module data.",
            variant: "destructive",
          });
          navigate("/admin/emodules");
        } else {
          // Convert tags array to a comma-separated string for the form input
          const fetchedData = {
            ...data,
            tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          };
          
          form.reset(fetchedData);
        }
        setIsLoading(false);
      };
      fetchModule();
    } else {
      // For new modules, just check for a draft
      const savedDraft = sessionStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          form.reset(JSON.parse(savedDraft));
        } catch (error) {
          console.error("Failed to parse draft for new e-module:", error);
        }
      }
    }
  }, [id, form, toast, navigate, isEditMode, draftKey]);

  // Watch for form changes and save to sessionStorage
  const watchedValues = form.watch();
  useEffect(() => {
    sessionStorage.setItem(draftKey, JSON.stringify(watchedValues));
  }, [watchedValues, draftKey]);


  const onSubmit = async (values: EModulFormValues) => {
    setIsLoading(true);
    try {
      let newCoverImageUrl = values.cover_image_url;
      if (coverImageFile) {
        newCoverImageUrl = await uploadEModuleFile(coverImageFile);
      }

      let newFileUrl = values.file_url;
      if (moduleFile) {
        newFileUrl = await uploadEModuleFile(moduleFile);
      }

      const moduleData = {
        title: values.title,
        description: values.description,
        published: values.published,
        cover_image_url: newCoverImageUrl,
        file_url: newFileUrl,
        category: values.category,
        tags: values.tags ? values.tags.split(",").map((tag) => tag.trim()) : [],
      };

      let error;
      if (isEditMode) {
        const { error: updateError } = await supabase
          .from("e_modules")
          .update(moduleData)
          .eq("id", id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("e_modules")
          .insert(moduleData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `E-Modul ${isEditMode ? "updated" : "created"} successfully.`,
      });
      // Clear the saved draft from session storage
      sessionStorage.removeItem(draftKey);
      navigate("/admin/emodules");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditMode ? "update" : "create"} E-Modul.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? "Edit" : "Create"} E-Modul</h1>
      {isLoading && isEditMode ? <div className="flex items-center justify-center h-64"><Loader2 className="h-16 w-16 animate-spin" /></div> :
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter module title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter module description" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Enter module category" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input placeholder="Enter tags, separated by commas" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormDescription>
                  Separate tags with commas (e.g., pregnancy, nutrition, health).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Cover Image</FormLabel>
            <FormControl>
              <Input type="file" accept="image/png, image/jpeg" onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)} />
            </FormControl>
            <FormDescription>
              {form.getValues("cover_image_url") && !coverImageFile && (
                <a href={form.getValues("cover_image_url")} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  View Current Image
                </a>
              )}
            </FormDescription>
          </FormItem>
          <FormItem>
            <FormLabel>Module File (PDF)</FormLabel>
            <FormControl>
              <Input type="file" accept="application/pdf" onChange={(e) => setModuleFile(e.target.files?.[0] || null)} />
            </FormControl>
             <FormDescription>
              {form.getValues("file_url") && !moduleFile && (
                <a href={form.getValues("file_url")} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  View Current PDF
                </a>
              )}
            </FormDescription>
          </FormItem>
          
          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Publish</FormLabel>
                  <FormDescription>
                    Make this module visible to all users.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save E-Modul"}
          </Button>
        </form>
      </Form>
    }
    </div>
  );
}
