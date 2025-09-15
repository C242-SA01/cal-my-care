import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, FileText, Search, ArrowUpDown, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';

// --- TYPE DEFINITIONS ---
type ScreeningStatus = 'in_progress' | 'completed' | 'reviewed';

interface ScreeningResult {
  id: string;
  completed_at: string;
  total_score: number;
  anxiety_level: 'minimal' | 'mild' | 'moderate' | 'severe';
  full_name: string | null;
  email: string | null;
  status: ScreeningStatus;
  notes: string | null;
}

interface ScreeningDetail extends ScreeningResult {
  question_text: string;
  answer_score: number;
}

const ANXIETY_LEVELS: ScreeningResult['anxiety_level'][] = ['minimal', 'mild', 'moderate', 'severe'];
const STATUS_LEVELS: ScreeningStatus[] = ['in_progress', 'completed', 'reviewed'];

const badgeColorMap = {
  minimal: 'bg-green-100 text-green-800 hover:bg-green-200',
  mild: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  moderate: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  severe: 'bg-red-100 text-red-800 hover:bg-red-200',
};

const statusBadgeMap: { [key in ScreeningStatus]: string } = {
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  reviewed: 'bg-purple-100 text-purple-800',
};

const scoreMeaning = ['Tidak sama sekali', 'Beberapa hari', 'Lebih dari separuh waktu', 'Hampir setiap hari'];

// --- MAIN COMPONENT ---
export default function ScreeningManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Data states
  const [allResults, setAllResults] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feature states
  const [searchTerm, setSearchTerm] = useState('');
  const [anxietyFilter, setAnxietyFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ScreeningResult; direction: 'asc' | 'desc' } | null>({ key: 'completed_at', direction: 'desc' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ScreeningDetail[] | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Review form states
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<ScreeningStatus>('completed');

  const fetchScreeningResults = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_screening_results');
      if (error) throw new Error('Gagal mengambil data. Pastikan migrasi database sudah dijalankan.');
      setAllResults(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreeningResults();
  }, []);

  const handleViewDetails = async (screeningId: string) => {
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_screening_details', { p_screening_id: screeningId });
      if (error) throw new Error('Gagal mengambil detail skrining.');
      setModalData(data);
      if (data && data.length > 0) {
        setReviewNotes(data[0].notes || '');
        setReviewStatus(data[0].status);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveReview = async () => {
    if (!modalData || modalData.length === 0 || !user) return;

    setIsSubmittingReview(true);
    try {
      const screeningId = modalData[0].screening_id;
      const { error } = await supabase
        .from('screenings')
        .update({
          notes: reviewNotes,
          status: reviewStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', screeningId);

      if (error) throw error;

      toast({ title: "Berhasil", description: "Tinjauan berhasil disimpan." });
      setIsModalOpen(false);
      fetchScreeningResults(); // Refresh the main table data
    } catch (err: any) {
      console.error("Error saving review:", err);
      toast({ title: "Error", description: "Gagal menyimpan tinjauan.", variant: "destructive" });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSort = (key: keyof ScreeningResult) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredAndSortedResults = useMemo(() => {
    let results = allResults
      .filter(res => 
        (res.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         res.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (anxietyFilter === 'all' || res.anxiety_level === anxietyFilter)
      );

    if (sortConfig !== null) {
      results.sort((a, b) => {
        if (a[sortConfig.key]! < b[sortConfig.key]!) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key]! > b[sortConfig.key]!) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return results;
  }, [allResults, searchTerm, anxietyFilter, sortConfig]);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedResults.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedResults, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage);

  const renderSortArrow = (key: keyof ScreeningResult) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-64 text-red-600"><AlertTriangle className="h-8 w-8 mb-2" /><p>{error}</p></div>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Hasil Skrining</CardTitle>
          <CardDescription>Cari, filter, dan kelola semua hasil skrining kecemasan pasien.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-grow"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Cari berdasarkan nama atau email..." className="pl-8 sm:w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Select value={anxietyFilter} onValueChange={setAnxietyFilter}><SelectTrigger className="sm:w-[180px]"><SelectValue placeholder="Filter Level" /></SelectTrigger><SelectContent><SelectItem value="all">Semua Level</SelectItem>{ANXIETY_LEVELS.map(level => <SelectItem key={level} value={level} className="capitalize">{level}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow>
                <TableHead onClick={() => handleSort('full_name')} className="cursor-pointer">Pasien{renderSortArrow('full_name')}</TableHead>
                <TableHead onClick={() => handleSort('completed_at')} className="cursor-pointer">Tanggal{renderSortArrow('completed_at')}</TableHead>
                <TableHead onClick={() => handleSort('total_score')} className="cursor-pointer text-center">Skor{renderSortArrow('total_score')}</TableHead>
                <TableHead onClick={() => handleSort('anxiety_level')} className="cursor-pointer">Level{renderSortArrow('anxiety_level')}</TableHead>
                <TableHead onClick={() => handleSort('status')} className="cursor-pointer">Status{renderSortArrow('status')}</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow></TableHeader>
              <TableBody>{paginatedResults.length > 0 ? paginatedResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell><div className="font-medium">{result.full_name || 'N/A'}</div><div className="text-sm text-muted-foreground">{result.email || 'N/A'}</div></TableCell>
                  <TableCell>{new Date(result.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                  <TableCell className="text-center font-semibold">{result.total_score}</TableCell>
                  <TableCell><Badge className={`capitalize ${badgeColorMap[result.anxiety_level]}`}>{result.anxiety_level}</Badge></TableCell>
                  <TableCell><Badge className={`capitalize ${statusBadgeMap[result.status]}`}>{result.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleViewDetails(result.id)}><FileText className="h-4 w-4 mr-2" />Lihat Detail</Button></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="text-center h-24">Tidak ada hasil yang cocok.</TableCell></TableRow>}</TableBody>
            </Table>
          </div>
          <Pagination className="mt-4"><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} /></PaginationItem>{[...Array(totalPages).keys()].map(i => <PaginationItem key={i}><PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>{i + 1}</PaginationLink></PaginationItem>)}<PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} /></PaginationItem></PaginationContent></Pagination>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Hasil Skrining</DialogTitle>
            {modalData && modalData.length > 0 && <DialogDescription>Hasil untuk {modalData[0].full_name} pada {new Date(modalData[0].completed_at).toLocaleString('id-ID')}</DialogDescription>}
          </DialogHeader>
          {modalLoading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : modalData && modalData.length > 0 ? (
            <div className="max-h-[70vh] flex flex-col">
              <div className="overflow-y-auto pr-4">
                <div className="grid grid-cols-2 gap-4 text-center mb-4 sticky top-0 bg-background py-2">
                    <div><Badge className={`text-lg ${badgeColorMap[modalData[0].anxiety_level]}`}>{modalData[0].anxiety_level}</Badge></div>
                    <div className="font-bold text-2xl">{modalData[0].total_score} / 21</div>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Pertanyaan GAD-7</TableHead><TableHead className="text-right">Jawaban</TableHead></TableRow></TableHeader>
                  <TableBody>{modalData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.question_text}</TableCell>
                      <TableCell className="text-right"><div className="font-semibold">{item.answer_score} - {scoreMeaning[item.answer_score]}</div></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-2 flex items-center"><MessageSquare className="h-4 w-4 mr-2"/>Tinjauan Admin</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="review-status" className="text-sm font-medium">Status</label>
                    <Select value={reviewStatus} onValueChange={(value) => setReviewStatus(value as ScreeningStatus)}>
                      <SelectTrigger id="review-status"><SelectValue placeholder="Ubah status" /></SelectTrigger>
                      <SelectContent>{STATUS_LEVELS.map(level => <SelectItem key={level} value={level} className="capitalize">{level.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="review-notes" className="text-sm font-medium">Catatan</label>
                    <Textarea id="review-notes" placeholder="Tambahkan catatan tindak lanjut untuk pasien..." value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={4} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-amber-600 p-8 text-center"><p>Detail jawaban untuk skrining ini tidak ditemukan.</p><p className="text-sm text-muted-foreground mt-2">Ini bisa terjadi jika sesi skrining tidak diselesaikan dengan benar.</p></div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Tutup</Button>
            <Button onClick={handleSaveReview} disabled={isSubmittingReview}>
              {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} 
              Simpan Tinjauan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
