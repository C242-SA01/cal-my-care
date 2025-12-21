import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageSquare, CheckCircle } from 'lucide-react';

type ScreeningStatus = 'in_progress' | 'completed' | 'reviewed';

const STATUS_LEVELS: ScreeningStatus[] = ['in_progress', 'completed', 'reviewed'];

interface ScreeningReviewFormProps {
  screeningId: string;
  initialNotes: string;
  initialStatus: ScreeningStatus;
  onSave: () => void; // To refresh data and close modal
  onCancel: () => void;
}

interface ReviewFormState {
  notes: string;
  status: ScreeningStatus;
}

export function ScreeningReviewForm({ screeningId, initialNotes, initialStatus, onSave, onCancel }: ScreeningReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formKey = `screening-review-${screeningId}`;
  const [formState, setFormState, clearFormState] = useFormPersistence<ReviewFormState>(
    formKey,
    { notes: initialNotes, status: initialStatus }
  );

  const handleSave = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('screenings')
        .update({
          notes: formState.notes,
          status: formState.status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', screeningId);

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Tinjauan berhasil disimpan.' });
      clearFormState();
      onSave(); // This will be implemented in the parent to close modal and refresh
    } catch (err: any) {
      console.error('Error saving review:', err);
      toast({
        title: 'Error',
        description: `Gagal menyimpan tinjualan: ${err.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    // We don't clear state on cancel, so user can reopen and see their draft.
    onCancel();
  }

  return (
    <>
      <div className="mt-4 pt-4 border-t">
        <h4 className="font-semibold mb-2 flex items-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          Tinjauan Admin
        </h4>
        <div className="space-y-4">
          <div>
            <label htmlFor="review-status" className="text-sm font-medium">
              Status
            </label>
            <Select
              value={formState.status}
              onValueChange={(value) => setFormState({ ...formState, status: value as ScreeningStatus })}
            >
              <SelectTrigger id="review-status">
                <SelectValue placeholder="Ubah status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_LEVELS.map((level) => (
                  <SelectItem key={level} value={level} className="capitalize">
                    {level.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="review-notes" className="text-sm font-medium">
              Catatan
            </label>
            <Textarea
              id="review-notes"
              placeholder="Tambahkan catatan tindak lanjut untuk pasien..."
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
         <Button variant="secondary" onClick={handleCancel}>
            Tutup
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Simpan Tinjauan
          </Button>
      </div>
    </>
  );
}
