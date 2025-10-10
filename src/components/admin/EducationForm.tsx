import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Zod schema updated to handle file uploads
const formSchema = z.object({
  title: z.string().min(1, "Judul harus diisi"),
  content: z.string().min(1, "Konten harus diisi"),
  material_type: z.enum(["article", "video"]),
  anxiety_level: z.string().optional(),
  video_url: z.string().optional(),
  image_url: z.string().optional(),
  image_file: z.any().optional(), // Field for the new file upload
  is_published: z.boolean(),
});

interface EducationFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
  initialData?: Partial<z.infer<typeof formSchema>> & { id?: string };
  isSubmitting: boolean;
}

// Helper to get the public URL for image preview
const getPublicImageUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  try {
    const { data } = supabase.storage.from("educational_materials").getPublicUrl(path);
    return data?.publicUrl;
  } catch (error) {
    console.error("Error getting public image URL:", error);
    return null;
  }
};

export const EducationForm = ({
  onSubmit,
  initialData,
  isSubmitting,
}: EducationFormProps) => {
  const draftKey = initialData?.id
    ? `education-form-draft-${initialData.id}`
    : "education-form-draft-new";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      material_type: "article",
      anxiety_level: "",
      video_url: "",
      image_url: "",
      is_published: true,
    },
  });

  // This functionality is now less relevant with file uploads but kept for other fields
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        // Don't restore file inputs from draft
        delete draftData.image_file;
        form.reset(draftData);
      } catch (error) {
        console.error("Failed to parse draft data:", error);
      }
    }
  }, [form, draftKey]);

  const watchedValues = form.watch();
  useEffect(() => {
    // Don't save file objects in localStorage
    const { image_file, ...rest } = watchedValues;
    localStorage.setItem(draftKey, JSON.stringify(rest));
  }, [watchedValues, draftKey]);

  const handleFormSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      await onSubmit(values);
      form.reset();
    },
    [onSubmit, form]
  );

  const materialType = form.watch("material_type");
  const currentImageUrl = getPublicImageUrl(initialData?.image_url ?? null);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan judul materi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="material_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Materi</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="article">Artikel</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="anxiety_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Tingkat Kecemasan</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? "all"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tingkat kecemasan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">Semua Level</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="mild">Ringan</SelectItem>
                  <SelectItem value="moderate">Sedang</SelectItem>
                  <SelectItem value="severe">Berat</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konten</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Masukkan konten materi edukasi"
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {materialType === "video" && (
          <FormField
            control={form.control}
            name="video_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Video</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Image preview for existing images */}
        {currentImageUrl && (
          <div className="space-y-2">
            <FormLabel>Gambar Saat Ini</FormLabel>
            <img src={currentImageUrl} alt="Preview" className="w-full h-auto max-h-48 object-cover rounded-md border" />
          </div>
        )}

        {/* New file upload field */}
        <FormField
          control={form.control}
          name="image_file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{currentImageUrl ? "Ganti Gambar" : "Unggah Gambar"}</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Publikasikan</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan
        </Button>
      </form>
    </Form>
  );
};
