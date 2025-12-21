import React from 'react';
import CalmyNoteCard from './CalmyNoteCard';
import { CalmyNote } from '@/integrations/supabase/types';

interface CalmyNoteListProps {
  notes: CalmyNote[];
  onDelete: (noteId: string) => void;
}

const CalmyNoteList = ({ notes, onDelete }: CalmyNoteListProps) => {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-pink-100 bg-pink-50/30 p-12 text-center">
        <div className="text-3xl text-pink-300">📔</div>
        <h3 className="mt-4 text-lg font-semibold text-pink-900/80">Belum Ada Catatan</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Yuk, tulis apa yang Bunda rasakan. <br/> Semua ceritamu aman di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
      {notes.map((note) => (
        <div key={note.id}>
          <CalmyNoteCard note={note} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
};

export default CalmyNoteList;