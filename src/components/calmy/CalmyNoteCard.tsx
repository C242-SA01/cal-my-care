import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalmyNote } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Edit, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '../ui/button';

interface CalmyNoteCardProps {
  note: CalmyNote;
  onDelete: (noteId: string) => void;
}

const moodColors: { [key: string]: string } = {
  senang: 'bg-green-100 text-green-800 border-green-200',
  bersemangat: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  biasa: 'bg-blue-100 text-blue-800 border-blue-200',
  lelah: 'bg-purple-100 text-purple-800 border-purple-200',
  sedih: 'bg-gray-100 text-gray-800 border-gray-200',
};

const CalmyNoteCard = ({ note, onDelete }: CalmyNoteCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="flex flex-col justify-between rounded-xl border-pink-50 bg-white transition-all hover:shadow-md"
      onClick={() => navigate(`/calmy/${note.id}/edit`)}
      role="button"
      aria-label={`Lihat atau edit catatan tanggal ${note.note_date}`}
    >
      <CardHeader className="flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-pink-900/80">{note.title || 'Catatan Harian'}</CardTitle>
          <CardDescription className="text-xs">
            {format(new Date(note.note_date.replace(/-/g, '/')), 'eeee, d MMMM yyyy', { locale: id })}
          </CardDescription>
        </div>
        <DropdownMenu onOpenChange={(e) => e && Event.prototype.stopImmediatePropagation}
  onClick={(e) => e.stopPropagation()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/calmy/${note.id}/edit`)}}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(note.id) }} className="text-red-500 focus:text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Hapus</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="py-2">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {note.content}
        </p>
      </CardContent>

      <CardFooter className="pt-4">
        {note.mood && (
          <Badge variant="outline" className={`capitalize ${moodColors[note.mood] || 'border-gray-200'}`}>
            {note.mood}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default CalmyNoteCard;