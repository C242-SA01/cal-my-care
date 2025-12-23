import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CalmyCalendar from '@/components/calmy/CalmyCalendar';
import CalmyNoteList from '@/components/calmy/CalmyNoteList';
import { supabase } from '@/integrations/supabase/client';
import { CalmyNote } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { startOfMonth, endOfMonth, format, isSameDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';


const CalmyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for the calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined); // MODIFIED: Default to undefined
  
  // State for notes
  const [notes, setNotes] = useState<CalmyNote[]>([]);
  const [highlightedDays, setHighlightedDays] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);


  const fetchNotesForMonth = async () => {
    if (!user) return;
    setIsLoading(true);

    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('calmy_notes')
      .select('*')
      .eq('user_id', user.id)
      .gte('note_date', startDate)
      .lte('note_date', endDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      toast({
        variant: "destructive",
        title: "Gagal memuat catatan",
        description: "Terjadi kesalahan saat mengambil data catatan Anda.",
      });
    } else {
      setNotes(data || []);
      const datesWithNotes = data.map(note => new Date(note.note_date.replace(/-/g, '/')));
      setHighlightedDays(datesWithNotes);
    }
    setIsLoading(false);
  };

  // Fetch notes for the current visible month
  useEffect(() => {
    fetchNotesForMonth();
  }, [user, currentMonth]);

  // Filter notes based on the selected date
  const filteredNotes = useMemo(() => {
    if (!selectedDate) return notes; // If no date selected, return all notes for the month
    return notes.filter(
      (note) => isSameDay(new Date(note.note_date.replace(/-/g, '/')), selectedDate)
    );
  }, [notes, selectedDate]);
  
  const handleDateClick = (date: Date | undefined) => {
    // MODIFIED LOGIC: If the same date is clicked again, unset selectedDate to show month view
    if (selectedDate && date && isSameDay(selectedDate, date)) {
      setSelectedDate(undefined);
    } else {
      setSelectedDate(date);
    }

    // Only navigate to create a new note if a specific date is selected and has no notes yet
    if (date) {
      const hasNotesOnSelectedDate = notes.some(
        note => isSameDay(new Date(note.note_date.replace(/-/g, '/')), date)
      );
      if (!hasNotesOnSelectedDate) {
        navigate(`/calmy/new?date=${format(date, 'yyyy-MM-dd')}`);
      }
    }
  }

  const handleDeleteRequest = (noteId: string) => {
    setNoteToDelete(noteId);
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!noteToDelete) return;

    const { error } = await supabase
      .from('calmy_notes')
      .delete()
      .eq('id', noteToDelete);

    if (error) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus catatan",
        description: "Terjadi kesalahan. Silakan coba lagi.",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Catatan Anda telah dihapus.",
      });
      // Refetch notes to update the view
      fetchNotesForMonth();
    }
    setNoteToDelete(null);
    setIsDeleteDialogOpen(false);
  };


  return (
    <>
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-pink-900/80">Ruang Tenangmu</h1>
            <p className="text-muted-foreground">Catat perasaan dan ceritamu setiap hari di sini, Bunda.</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Calendar View (Left/Top) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <Card className="rounded-2xl shadow-lg shadow-pink-100/50">
              <CardContent className="p-2">
                <CalmyCalendar
                  selected={selectedDate}
                  onSelect={handleDateClick}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  highlightedDays={highlightedDays}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                />
              </CardContent>
            </Card>
          </div>

          {/* Notes List (Right/Bottom) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card className="rounded-2xl shadow-lg shadow-pink-100/50 min-h-[400px]">
              <CardHeader>
                <CardTitle className="text-pink-900/80">
                  {selectedDate 
                    ? `Catatan ${format(selectedDate, 'd MMMM yyyy', { locale: localeId })}`
                    : `Catatan Bulan ${format(currentMonth, 'MMMM yyyy', { locale: localeId })}`} {/* MODIFIED: Title for month view */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <CalmyNoteList notes={filteredNotes} onDelete={handleDeleteRequest} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Action Button */}
        <Link
          to={`/calmy/new?date=${format(selectedDate || new Date(), 'yyyy-MM-dd')}`}
          className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40"
        >
          <Button
            size="lg"
            className="h-16 w-16 rounded-full bg-pink-500 text-white shadow-xl hover:bg-pink-600 focus:ring-pink-400"
            aria-label="Tambah catatan baru"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </Link>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Catatan Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Bunda yakin ingin menghapus catatan ini? Catatan yang sudah dihapus tidak bisa dikembalikan lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className={buttonVariants({ variant: "destructive" })}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CalmyPage;