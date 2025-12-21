import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, isValid } from 'date-fns';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Schema for form validation
const noteFormSchema = z.object({
  title: z.string().max(100, "Judul tidak boleh lebih dari 100 karakter.").optional(),
  content: z.string().min(3, "Catatan terlalu pendek, yuk ceritakan lebih banyak lagi."),
  mood: z.enum(['senang', 'sedih', 'lelah', 'bersemangat', 'biasa']).optional(),
  note_date: z.string(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

const moodOptions = [
  { value: 'senang', label: '😊 Senang' },
  { value: 'bersemangat', label: '🤩 Bersemangat' },
  { value: 'biasa', label: '🙂 Biasa' },
  { value: 'lelah', label: '😴 Lelah' },
  { value: 'sedih', label: '😥 Sedih' },
];

const CalmyNoteForm = () => {
  const { id: noteId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditMode = !!noteId;

  const prefilledDate = searchParams.get('date');
  const defaultDate = (prefilledDate && isValid(parseISO(prefilledDate))) 
    ? format(parseISO(prefilledDate), 'yyyy-MM-dd') 
    : format(new Date(), 'yyyy-MM-dd');

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: '',
      content: '',
      note_date: defaultDate,
    },
  });

  const { formState: { isSubmitting, isLoading } } = form;

  useEffect(() => {
    const fetchNote = async () => {
      if (!isEditMode || !user) return;

      const { data, error } = await supabase
        .from('calmy_notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Gagal memuat catatan",
          description: "Catatan tidak ditemukan atau Anda tidak memiliki akses.",
        });
        navigate('/calmy');
      } else {
        form.reset({
          title: data.title || '',
          content: data.content,
          mood: data.mood as any,
          note_date: data.note_date,
        });
      }
    };
    fetchNote();
  }, [noteId, isEditMode, user, navigate, toast, form]);

  const onSubmit = async (values: NoteFormValues) => {
    if (!user) return;

    const payload = {
      ...values,
      user_id: user.id,
    };

    const { error } = isEditMode
      ? await supabase.from('calmy_notes').update(payload).eq('id', noteId)
      : await supabase.from('calmy_notes').insert(payload);

    if (error) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: `Terjadi kesalahan: ${error.message}`,
      });
    } else {
      toast({
        title: "Catatan Tersimpan!",
        description: "Semua ceritamu aman di sini, Bunda.",
      });
      navigate('/calmy');
    }
  };
  
  if (isLoading) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-600">Memuat catatan...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
       <Button variant="ghost" onClick={() => navigate('/calmy')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Kalender
      </Button>
      <Card className="max-w-2xl mx-auto rounded-2xl shadow-lg shadow-pink-100/50">
        <CardHeader>
          <CardTitle className="text-pink-900/80">{isEditMode ? 'Edit Catatan' : 'Tulis Cerita Hari Ini'}</CardTitle>
          <CardDescription>Bagaimana perasaan Bunda hari ini? Ceritakan apa saja yang ingin Bunda tulis.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="note_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Catatan</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="w-auto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Cerita (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Momen spesial hari ini..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cerita Bunda</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tuliskan pikiran, perasaan, atau kejadian hari ini di sini..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Bagaimana Perasaan Bunda?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        {moodOptions.map(opt => (
                           <FormItem key={opt.value} className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={opt.value} id={opt.value} />
                            </FormControl>
                            <FormLabel htmlFor={opt.value} className="font-normal cursor-pointer">
                              {opt.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-pink-500 hover:bg-pink-600" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Catatan'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalmyNoteForm;