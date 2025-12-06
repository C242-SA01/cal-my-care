import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, Heart, Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  question_order: number;
}

const screeningQuestions: Question[] = [
  { id: 'q1', question_text: 'Khawatir terhadap janin atau kehamilan', question_order: 1 },
  { id: 'q2', question_text: 'Takut jika bahaya akan datang pada janin', question_order: 2 },
  { id: 'q3', question_text: 'Merasa takut akan hal-hal buruk yang akan terjadi', question_order: 3 },
  { id: 'q4', question_text: 'Khawatir tentang banyak hal', question_order: 4 },
  { id: 'q5', question_text: 'Khawatir tentang masa depan', question_order: 5 },
  { id: 'q6', question_text: 'Merasa kelelahan', question_order: 6 },
  { id: 'q7', question_text: 'Merasa takut terhadap jarum, darah, kelahiran, nyeri, dan sakit', question_order: 7 },
  { id: 'q8', question_text: 'Mendadak merasa takut atau tidak nyaman berlebihan', question_order: 8 },
  { id: 'q9', question_text: 'Memikirkan suatu hal berulang-ulang dan sulit dihentikan atau dikontrol', question_order: 9 },
  { id: 'q10', question_text: 'Sulit tidur walau ada kesempatan tidur sempurna', question_order: 10 },
  { id: 'q11', question_text: 'Merasa harus melakukan hal-hal sesuai aturan', question_order: 11 },
  { id: 'q12', question_text: 'Menginginkan segala sesuatu sempurna', question_order: 12 },
  { id: 'q13', question_text: 'Merasa perlu mengendalikan segala hal', question_order: 13 },
  { id: 'q14', question_text: 'Sulit berhenti memeriksa atau melakukan sesuatu secara berlebihan', question_order: 14 },
  { id: 'q15', question_text: 'Merasa gelisah atau mudah terkejut', question_order: 15 },
  { id: 'q16', question_text: 'Merasa khawatir atas pikiran berulang', question_order: 16 },
  { id: 'q17', question_text: 'Merasa perlu selalu mengawasi sesuatu', question_order: 17 },
  { id: 'q18', question_text: 'Terganggu kenangan berulang atau mimpi buruk', question_order: 18 },
  { id: 'q19', question_text: 'Khawatir mempermalukan diri di depan orang lain', question_order: 19 },
  { id: 'q20', question_text: 'Khawatir orang lain menilai negatif', question_order: 20 },
  { id: 'q21', question_text: 'Tidak nyaman di keramaian', question_order: 21 },
  { id: 'q22', question_text: 'Menghindari kegiatan sosial', question_order: 22 },
  { id: 'q23', question_text: 'Menghindari hal yang membuat risau', question_order: 23 },
  { id: 'q24', question_text: 'Merasa terpisah dari diri sendiri', question_order: 24 },
  { id: 'q25', question_text: 'Lupa waktu dan apa yang telah terjadi', question_order: 25 },
  { id: 'q26', question_text: 'Sulit menyesuaikan diri dengan perubahan', question_order: 26 },
  { id: 'q27', question_text: 'Khawatir tidak mampu melakukan sesuatu', question_order: 27 },
  { id: 'q28', question_text: 'Pikiran tidak berhenti dan sulit berkonsentrasi', question_order: 28 },
  { id: 'q29', question_text: 'Takut kehilangan kendali', question_order: 29 },
  { id: 'q30', question_text: 'Merasa panik', question_order: 30 },
  { id: 'q31', question_text: 'Merasa gelisah', question_order: 31 },
];

interface Answer {
  question_id: string;
  score: number;
}

export default function Screening() {
  const { user, loading } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const scoreOptions = [
    { value: '0', label: 'Tidak sama sekali', description: '0 hari' },
    { value: '1', label: 'Beberapa hari', description: '1-6 hari' },
    { value: '2', label: 'Lebih dari setengah hari', description: '7-11 hari' },
    { value: '3', label: 'Hampir setiap hari', description: '12-14 hari' },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      // Set questions from the static list
      setQuestions(screeningQuestions);
      setIsLoading(false);
      initializeScreening();
    }
  }, [user, loading, navigate]);

  const initializeScreening = async () => {
    try {
      // Check if there's an ongoing screening
      const { data: existingScreening } = await supabase
        .from('screenings')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'in_progress')
        .single();

      if (existingScreening) {
        setScreeningId(existingScreening.id);
        
        // Load existing answers
        const { data: existingAnswers } = await supabase
          .from('screening_answers')
          .select('*')
          .eq('screening_id', existingScreening.id);

        if (existingAnswers) {
          setAnswers(existingAnswers.map(a => ({
            question_id: a.question_id,
            score: a.score
          })));
        }
      } else {
        // Create new screening
        const { data: newScreening, error } = await supabase
          .from('screenings')
          .insert({
            user_id: user?.id,
            status: 'in_progress'
          })
          .select()
          .single();

        if (error) throw error;
        setScreeningId(newScreening.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat sesi skrining",
        variant: "destructive",
      });
    }
  };

  const handleAnswerChange = async (questionId: string, score: string) => {
    const newAnswer: Answer = { question_id: questionId, score: parseInt(score) };
    
    // Update local state
    const updatedAnswers = answers.filter(a => a.question_id !== questionId);
    updatedAnswers.push(newAnswer);
    setAnswers(updatedAnswers);

    // Save to database
    if (screeningId) {
      try {
        const { error } = await supabase
          .from('screening_answers')
          .upsert({
            screening_id: screeningId,
            question_id: questionId,
            score: parseInt(score)
          });

        if (error) throw error;
      } catch (error: any) {
        console.error('Error saving answer:', error);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateAnxietyLevel = (totalScore: number): 'minimal' | 'mild' | 'moderate' | 'severe' => {
    if (totalScore >= 0 && totalScore <= 4) return 'minimal';
    if (totalScore >= 5 && totalScore <= 9) return 'mild';
    if (totalScore >= 10 && totalScore <= 14) return 'moderate';
    return 'severe';
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
      const anxietyLevel = calculateAnxietyLevel(totalScore);

      const { error } = await supabase
        .from('screenings')
        .update({
          status: 'completed',
          total_score: totalScore,
          anxiety_level: anxietyLevel,
          completed_at: new Date().toISOString()
        })
        .eq('id', screeningId);

      if (error) throw error;

      toast({
        title: "Skrining Selesai!",
        description: "Hasil skrining Anda telah tersimpan.",
      });

      navigate('/results', { state: { screeningId } });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menyelesaikan skrining",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Tidak ada pertanyaan yang tersedia</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.question_id === currentQuestion.id);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed = currentAnswer !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/assets/logo-CalMyCare.png" alt="CalmyCare Logo" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-foreground">CalMyCare</h1>
                <p className="text-sm text-muted-foreground">Skrining Kecemasan</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-muted-foreground">
              Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
            </p>
            <p className="text-sm font-medium">{Math.round(progress)}%</p>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">
              Dalam 2 minggu terakhir, seberapa sering Anda terganggu oleh masalah berikut?
            </CardTitle>
            <CardDescription className="text-base font-medium text-foreground">
              {currentQuestion.question_text}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={currentAnswer?.score.toString() || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {scoreOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Sebelumnya
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleComplete}
              disabled={!canProceed || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Selesai
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
            >
              Selanjutnya
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Petunjuk:</strong> Pilih jawaban yang paling sesuai dengan kondisi Anda dalam 2 minggu terakhir. 
            Jawaban Anda akan disimpan secara otomatis dan dapat dilanjutkan kapan saja.
          </p>
        </div>
      </div>
    </div>
  );
}