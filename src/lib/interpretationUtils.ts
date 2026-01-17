export type AnxietyInterpretation = {
  level: string;
  color: 'Merah' | 'Kuning' | 'Hijau' | 'Gray';
  description: string;
  className: string; // Added for convenience with Tailwind
};

// Aturan interpretasi terpusat
const ANXIETY_THRESHOLDS = [
  // Skor 41-93: Cemas Berat
  { minScore: 41, maxScore: 93, level: "Cemas Berat", color: 'Merah', description: "Tingkat kecemasan Anda tergolong berat. Sangat disarankan untuk segera berkonsultasi dengan tenaga profesional.", className: "text-red-500" },
  // Skor 27-40: Cemas Ringan (Kuning)
  { minScore: 27, maxScore: 40, level: "Cemas Ringan", color: 'Kuning', description: "Anda mengalami gejala kecemasan ringan. Disarankan untuk mempraktikkan teknik relaksasi dan memonitor kondisi Anda.", className: "text-yellow-500" },
  // Skor 21-26: Cemas Ringan
  { minScore: 21, maxScore: 26, level: "Cemas Ringan", color: 'Hijau', description: "Anda menunjukkan gejala kecemasan ringan. Tetap jaga pola hidup sehat dan manajemen stres.", className: "text-green-500" }
];

/**
 * Menerjemahkan skor mentah menjadi level kecemasan, warna, dan deskripsi.
 * @param score Skor numerik hasil kuesioner.
 * @returns Objek interpretasi yang lengkap.
 */
export function getAnxietyInterpretation(score: number | null): AnxietyInterpretation {
  if (score === null || score < 0) { // Handle null or invalid scores
    return {
      level: "Tidak Tersedia",
      color: 'Gray',
      description: "Skor tidak tersedia atau tidak valid.",
      className: "text-gray-500"
    };
  }

  for (const threshold of ANXIETY_THRESHOLDS) {
    if (score >= threshold.minScore && score <= threshold.maxScore) {
      return {
        level: threshold.level,
        color: threshold.color,
        description: threshold.description,
        className: threshold.className
      };
    }
  }

  // Default for scores below the lowest threshold (e.g., < 21)
  return {
    level: "Normal",
    color: 'Gray',
    description: "Skor Anda tidak menunjukkan adanya gejala kecemasan yang signifikan.",
    className: "text-gray-500"
  };
}
