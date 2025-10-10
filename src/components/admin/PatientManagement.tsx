import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Eye, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import PatientDetail from '@/components/admin/PatientDetail';

interface Patient {
  id: string;
  full_name: string | null;
  email: string | null;
  gestational_age: number | null;
  is_primigravida: boolean | null;
  created_at: string;
  role: string | null;
  latest_screening?: {
    id: string;
    total_score: number | null;
    anxiety_level: string | null;
    status: string;
    completed_at: string | null;
  };
}

const PatientManagement = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      // Fetch patients with their latest screening
      const { data: patientsData, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          full_name,
          email,
          gestational_age,
          is_primigravida,
          created_at,
          role
        `
        )
        .eq('role', 'patient')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch latest screening for each patient
      const patientsWithScreenings = await Promise.all(
        (patientsData || []).map(async (patient) => {
          const { data: screening } = await supabase.from('screenings').select('id, total_score, anxiety_level, status, completed_at').eq('user_id', patient.id).order('created_at', { ascending: false }).limit(1).single();

          return {
            ...patient,
            latest_screening: screening,
          };
        })
      );

      setPatients(patientsWithScreenings);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnxietyBadgeVariant = (level: string | null) => {
    switch (level) {
      case 'minimal':
        return 'default';
      case 'ringan':
        return 'secondary';
      case 'sedang':
        return 'destructive';
      case 'berat':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getAnxietyText = (level: string | null) => {
    switch (level) {
      case 'minimal':
        return 'Minimal';
      case 'mild':
        return 'Ringan';
      case 'moderate':
        return 'Sedang';
      case 'severe':
        return 'Berat';
      default:
        return 'Belum ada';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'in_progress':
        return 'Sedang Berjalan';
      default:
        return 'Belum Mulai';
    }
  };

  const exportPatientData = async () => {
    // Create CSV content
    const headers = ['Nama', 'Email', 'Usia Kehamilan', 'Kehamilan Pertama', 'Tanggal Daftar', 'Skor Terakhir', 'Tingkat Kecemasan', 'Status Skrining'];

    const csvContent = [
      headers.join(','),
      ...patients.map((patient) =>
        [
          patient.full_name || '-',
          patient.email || '-',
          patient.gestational_age ? `${patient.gestational_age} minggu` : '-',
          patient.is_primigravida ? 'Ya' : 'Tidak',
          format(parseISO(patient.created_at), 'dd/MM/yyyy', { locale: id }),
          patient.latest_screening?.total_score || '-',
          getAnxietyText(patient.latest_screening?.anxiety_level || null),
          getStatusText(patient.latest_screening?.status || ''),
        ].join(',')
      ),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-pasien-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredPatients = patients.filter((patient) => patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || patient.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Manajemen Pasien</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari pasien..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button onClick={exportPatientData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop View: Table */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Usia Kehamilan</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead>Skor Terakhir</TableHead>
                <TableHead>Tingkat Kecemasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Tidak ada pasien yang ditemukan' : 'Belum ada pasien'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.full_name || 'Tidak ada nama'}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>
                      {patient.gestational_age ? `${patient.gestational_age} minggu` : '-'}
                      {patient.is_primigravida && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Primigravida
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(parseISO(patient.created_at), 'dd MMM yyyy', { locale: id })}</TableCell>
                    <TableCell>{patient.latest_screening?.total_score || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getAnxietyBadgeVariant(patient.latest_screening?.anxiety_level || null)}>{getAnxietyText(patient.latest_screening?.anxiety_level || null)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.latest_screening?.status === 'completed' ? 'default' : 'secondary'}>{getStatusText(patient.latest_screening?.status || '')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedPatient(patient)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detail Pasien: {patient.full_name}</DialogTitle>
                          </DialogHeader>
                          {selectedPatient && <PatientDetail patient={selectedPatient} />}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View: Card List */}
        <div className="md:hidden space-y-4">
          {filteredPatients.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{searchTerm ? 'Tidak ada pasien yang ditemukan' : 'Belum ada pasien'}</p>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id} className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{patient.full_name || 'Tidak ada nama'}</CardTitle>
                  <p className="text-sm text-muted-foreground">{patient.email}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tgl. Daftar</span>
                    <span>{format(parseISO(patient.created_at), 'dd MMM yyyy', { locale: id })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skor Terakhir</span>
                    <span>{patient.latest_screening?.total_score || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Kecemasan</span>
                    <Badge variant={getAnxietyBadgeVariant(patient.latest_screening?.anxiety_level || null)}>{getAnxietyText(patient.latest_screening?.anxiety_level || null)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={patient.latest_screening?.status === 'completed' ? 'default' : 'secondary'}>{getStatusText(patient.latest_screening?.status || '')}</Badge>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setSelectedPatient(patient)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat Detail
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detail Pasien: {patient.full_name}</DialogTitle>
                      </DialogHeader>
                      {selectedPatient && <PatientDetail patient={selectedPatient} />}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientManagement;
