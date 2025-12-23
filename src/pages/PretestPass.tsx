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
import { ArrowRight, Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  question_order: number;
  type: 'pass';
}

interface Answer {
  question_id: string;
  score: number;
  question_type: 'pass';
}

export default function PretestPass() {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scoreOptions = [
    { value: '0', label: 'Tidak sama sekali' },
    { value: '1', label: 'Kadang-kadang' },
    { value: '2', label: 'Sering' },
    { value: '3', label: 'Sangat Sering' },
  ];

  useEffect(() => {
    const initializePretest = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data: passData, error: passError } = await supabase
          .from('pass_questions')
          .select('*')
          .order('question_order', { ascending: true });
        if (passError) throw new Error(`Gagal memuat pertanyaan PASS: ${passError.message}`);

        const passQuestions = (passData || []).map(q => ({ ...q, type: 'pass' as const }));
        setQuestions(passQuestions);

        const { data: existingScreenings, error: existingError } = await supabase
          .from('screenings')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .eq('screening_type', 'pretest')
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingError) throw existingError;

        let currentScreeningId = existingScreenings?.[0]?.id;

        if (!currentScreeningId) {
          const { data: newScreening, error } = await supabase
            .from('screenings')
            .insert({ user_id: user.id, status: 'in_progress', screening_type: 'pretest' })
            .select('id')
            .single();
          if (error) throw error;
          currentScreeningId = newScreening.id;
        }
        
        setScreeningId(currentScreeningId);
        
        const answersKey = `pretest-answers-${currentScreeningId}`;
        const indexKey = `pretest-index-${currentScreeningId}`;
        const savedAnswersJson = sessionStorage.getItem(answersKey);
        const savedIndex = sessionStorage.getItem(indexKey);

        if (savedAnswersJson) setAnswers(JSON.parse(savedAnswersJson));
        if (savedIndex) setCurrentQuestionIndex(parseInt(savedIndex, 10));

      } catch (error: any) {
        toast({
          title: "Error Memuat Pre-test",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      initializePretest();
    }
  }, [user, navigate, toast]);

  const handleAnswerChange = (questionId: string, score: string) => {
    const newAnswer: Answer = { question_id: questionId, score: parseInt(score), question_type: 'pass' };
    const updatedAnswers = answers.filter(a => a.question_id !== questionId);
    updatedAnswers.push(newAnswer);
    setAnswers(updatedAnswers);

    if (screeningId) {
      sessionStorage.setItem(`pretest-answers-${screeningId}`, JSON.stringify(updatedAnswers));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      if (screeningId) {
        sessionStorage.setItem(`pretest-index-${screeningId}`, newIndex.toString());
      }
    }
  };

  const calculateAnxietyLevel = (totalScore: number): 'normal' | 'ringan' | 'sedang' | 'berat' => {
    const score = Math.max(0, Math.min(totalScore, 93));
    if (score >= 0 && score <= 28) return 'normal';
    if (score >= 29 && score <= 46) return 'ringan';
    if (score >= 47 && score <= 64) return 'sedang';
    return 'berat';
  };

  const handleComplete = async () => {
    if (!screeningId || !user) return;
    setIsSubmitting(true);
    
    try {
      const answersToSave = answers.map(answer => ({ ...answer, screening_id: screeningId }));
      const { error: answersError } = await supabase.from('screening_answers').upsert(answersToSave, { onConflict: 'screening_id, question_id' });
      if (answersError) throw answersError;
      
      const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
      const anxietyLevel = calculateAnxietyLevel(totalScore);
      const { error: screeningError } = await supabase
        .from('screenings')
        .update({
          status: 'completed',
          total_score: totalScore,
          anxiety_level: anxietyLevel,
          completed_at: new Date().toISOString()
        })
        .eq('id', screeningId);
      if (screeningError) throw screeningError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_pretest_pass_completed: true, pretest_pass_completed_at: new Date().toISOString() })
        .eq('id', user.id);
      if (profileError) throw profileError;
      
      sessionStorage.removeItem(`pretest-answers-${screeningId}`);
      sessionStorage.removeItem(`pretest-index-${screeningId}`);

      await refreshUserProfile();

      toast({
        title: "Pre-test Selesai!",
        description: "Terima kasih, Bunda. Onboarding Anda telah selesai. Selamat datang di CalMyCare!",
      });

      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast({ title: "Error Menyelesaikan Kuis", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-amber-50/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.question_id === currentQuestion?.id);
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceedToNext = currentAnswer !== undefined;
  const canComplete = answers.length === questions.length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 via-rose-50/60 to-amber-50/40 p-4">
      <Card className="w-full max-w-2xl rounded-3xl shadow-lg border-0">
        <CardHeader className="text-center p-6 sm:p-8">
            <p className="font-semibold text-pink-600">Langkah 2 dari 2</p>
            <CardTitle className="text-2xl font-semibold text-slate-800">Skrining Awal</CardTitle>
            <CardDescription className="text-slate-500 mt-2">
                Ini adalah skrining awal yang wajib dan hanya dilakukan sekali untuk memahami kondisi Bunda lebih dalam.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-0">
          <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Pertanyaan {currentQuestionIndex + 1} dari {questions.length}</p>
                <p className="text-sm font-medium">{Math.round(progress)}%</p>
              </div>
              <Progress value={progress} className="h-2" />
          </div>

          <div className="min-h-[250px]">
            {currentQuestion && (
              <>
                <p className="text-base font-medium text-foreground mb-4">{currentQuestion.question_text}</p>
                <RadioGroup
                  value={currentAnswer?.score.toString() || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="space-y-2"
                >
                  {scoreOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent has-[:checked]:border-pink-200 has-[:checked]:bg-pink-50">
                      <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} />
                      <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="flex-1 cursor-pointer font-normal text-slate-700">{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t">
              {isLastQuestion ? (
                <Button onClick={handleComplete} disabled={!canComplete || isSubmitting} className="rounded-2xl bg-pink-500 text-white hover:bg-pink-600 px-8 py-3 text-base">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Selesai & Lihat Hasil
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceedToNext} className="rounded-2xl bg-slate-800 text-white hover:bg-slate-900 px-8 py-3 text-base">
                  Selanjutnya <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
