import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  question_order: number;
  type: 'gad7' | 'pass';
}

interface Answer {
  question_id: string;
  score: number;
  question_type: 'gad7' | 'pass';
}

const QUIZ_TYPES = ['trimester_1', 'trimester_2', 'trimester_3', 'post_test'];

export default function Screening() {
  const { user, userProfile, isProfileLoading } = useAuth();
  const { quizType } = useParams<{ quizType: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageTitle, setPageTitle] = useState('Skrining Kecemasan');

  const scoreOptions = [
    { value: '0', label: 'Tidak sama sekali' },
    { value: '1', label: 'Beberapa hari' },
    { value: '2', label: 'Lebih dari setengah hari' },
    { value: '3', label: 'Hampir setiap hari' },
  ];

  const getQuestionsForType = useCallback(async (type: string) => {
    if (type.includes('trimester')) {
      const { data: gad7Data, error: gad7Error } = await supabase.from('gad7_questions').select('*').order('question_order');
      if (gad7Error) throw new Error(`Gagal memuat pertanyaan GAD-7: ${gad7Error.message}`);
      
      const { data: passData, error: passError } = await supabase.from('pass_questions').select('*').order('question_order');
      if (passError) throw new Error(`Gagal memuat pertanyaan PASS: ${passError.message}`);

      const gad7Questions = (gad7Data || []).map(q => ({ ...q, type: 'gad7' as const }));
      const passQuestions = (passData || []).map(q => ({ ...q, type: 'pass' as const }));
      return [...gad7Questions, ...passQuestions];

    } else if (type === 'post_test') {
      const { data: passData, error: passError } = await supabase.from('pass_questions').select('*').order('question_order');
      if (passError) throw new Error(`Gagal memuat pertanyaan PASS: ${passError.message}`);
      return (passData || []).map(q => ({ ...q, type: 'pass' as const }));
    }
    return [];
  }, []);

  useEffect(() => {
    const initializePage = async (type: string) => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const fetchedQuestions = await getQuestionsForType(type);
        if (fetchedQuestions.length === 0) throw new Error("Tipe kuis tidak valid atau tidak ada pertanyaan.");
        setQuestions(fetchedQuestions);
        
        switch(type) {
          case 'trimester_1': setPageTitle('Kuis Trimester 1'); break;
          case 'trimester_2': setPageTitle('Kuis Trimester 2'); break;
          case 'trimester_3': setPageTitle('Kuis Trimester 3'); break;
          case 'post_test': setPageTitle('Post Test'); break;
        }

        const { data: existingScreenings, error: existingError } = await supabase
          .from('screenings')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .eq('screening_type', type)
          .order('created_at', { ascending: false })
          .limit(1);
        if (existingError) throw existingError;

        let currentScreeningId = existingScreenings?.[0]?.id;
        if (!currentScreeningId) {
          const { data: newScreening, error } = await supabase
            .from('screenings')
            .insert({ user_id: user.id, status: 'in_progress', screening_type: type })
            .select('id')
            .single();
          if (error) throw error;
          currentScreeningId = newScreening.id;
        }
        setScreeningId(currentScreeningId);
        
        const answersKey = `screening-answers-${currentScreeningId}`;
        const indexKey = `screening-index-${currentScreeningId}`;
        const savedAnswersJson = sessionStorage.getItem(answersKey);
        if (savedAnswersJson) setAnswers(JSON.parse(savedAnswersJson));
        
        const savedIndex = sessionStorage.getItem(indexKey);
        if (savedIndex) setCurrentQuestionIndex(parseInt(savedIndex, 10));

      } catch (error: any) {
        toast({ title: "Error", description: `Gagal memuat data kuis: ${error.message}`, variant: "destructive" });
        navigate('/quiz');
      } finally {
        setIsLoading(false);
      }
    };

    if (!quizType || !QUIZ_TYPES.includes(quizType)) {
      toast({ title: "Error", description: "Tipe kuis tidak valid.", variant: "destructive" });
      navigate('/quiz');
      return;
    }

    if (!isProfileLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      initializePage(quizType);
    }
  }, [user, isProfileLoading, navigate, quizType, toast, getQuestionsForType]);

  const handleAnswerChange = (questionId: string, score: string, questionType: 'gad7' | 'pass') => {
    const newAnswer: Answer = { question_id: questionId, score: parseInt(score), question_type: questionType };
    const updatedAnswers = answers.filter(a => a.question_id !== questionId);
    updatedAnswers.push(newAnswer);
    setAnswers(updatedAnswers);

    if (screeningId) {
      sessionStorage.setItem(`screening-answers-${screeningId}`, JSON.stringify(updatedAnswers));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      if (screeningId) sessionStorage.setItem(`screening-index-${screeningId}`, newIndex.toString());
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      if (screeningId) sessionStorage.setItem(`screening-index-${screeningId}`, newIndex.toString());
    }
  };

  const calculateAnxietyLevel = (totalScore: number): 'normal' | 'ringan' | 'sedang' | 'berat' => {
    const score = Math.max(0, Math.min(totalScore, 93)); // Ensure score is within 0-93

    if (score >= 0 && score <= 28) {
      return 'normal';
    }
    if (score >= 29 && score <= 46) {
      return 'ringan';
    }
    if (score >= 47 && score <= 64) {
      return 'sedang';
    }
    return 'berat'; // For scores 65-93
  };

  const handleComplete = async () => {
    if (!screeningId || !user || !userProfile) return;
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
          completed_at: new Date().toISOString(),
          gestational_age_at_completion: userProfile.gestational_age_weeks, // Save gestational age
        })
        .eq('id', screeningId);
      if (screeningError) throw screeningError;
      
      sessionStorage.removeItem(`screening-answers-${screeningId}`);
      sessionStorage.removeItem(`screening-index-${screeningId}`);

      toast({ title: "Skrining Selesai!", description: "Hasil skrining Anda telah tersimpan." });
      
      navigate('/quiz'); // Navigate back to the quiz list
    } catch (error: any) {
      toast({ title: "Error", description: `Gagal menyelesaikan skrining: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Tidak ada pertanyaan yang tersedia untuk skrining ini.</p>
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
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/assets/logo-CalMyCare.png" alt="CalmyCare Logo" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-foreground">CalMyCare</h1>
                <p className="text-sm text-muted-foreground">{pageTitle}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/quiz')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">Pertanyaan {currentQuestionIndex + 1} dari {questions.length}</p>
          <Progress value={progress} className="h-2 mt-2" />
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Dalam 2 minggu terakhir, seberapa sering Anda terganggu oleh masalah berikut?</CardTitle>
            <CardDescription className="text-base font-medium text-foreground pt-2">{currentQuestion.question_text}</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={currentAnswer?.score.toString() || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value, currentQuestion.type)}
            >
              {scoreOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent has-[:checked]:border-pink-200 has-[:checked]:bg-pink-50">
                  <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} />
                  <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="flex-1 cursor-pointer font-normal text-slate-700">{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Sebelumnya
          </Button>

          {isLastQuestion ? (
            <Button onClick={handleComplete} disabled={answers.length !== questions.length || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Selesaikan Kuis
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed}>
              Selanjutnya
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}