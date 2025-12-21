import { useState, useEffect } from 'react';
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

// Updated Interfaces
interface Question {
  id: string;
  question_text: string;
  question_order: number;
  type: 'gad7' | 'pass'; // Add type to identify the source table
}

interface Answer {
  question_id: string;
  score: number;
  question_type: 'gad7' | 'pass'; // Add question_type to match the DB schema
}

export default function Screening() {
  const { user, loading } = useAuth();
  const { trimester } = useParams<{ trimester: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedTrimester = trimester ? parseInt(trimester, 10) : null;

  const scoreOptions = [
    { value: '0', label: 'Tidak sama sekali', description: '0 hari' },
    { value: '1', label: 'Beberapa hari', description: '1-6 hari' },
    { value: '2', label: 'Lebih dari setengah hari', description: '7-11 hari' },
    { value: '3', label: 'Hampir setiap hari', description: '12-14 hari' },
  ];

  useEffect(() => {
    const initializePage = async (trimesterNumber: number) => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // 1. Fetch questions from both GAD-7 and PASS tables
        const { data: gad7Data, error: gad7Error } = await supabase
          .from('gad7_questions')
          .select('*')
          .order('question_order', { ascending: true });
        if (gad7Error) throw new Error(`Gagal memuat pertanyaan GAD-7: ${gad7Error.message}`);

        const { data: passData, error: passError } = await supabase
          .from('pass_questions')
          .select('*')
          .order('question_order', { ascending: true });
        if (passError) throw new Error(`Gagal memuat pertanyaan PASS: ${passError.message}`);

        // Map and combine questions, adding the 'type'
        const gad7Questions = (gad7Data || []).map(q => ({ ...q, type: 'gad7' as const }));
        const passQuestions = (passData || []).map(q => ({ ...q, type: 'pass' as const }));
        const allQuestions = [...gad7Questions, ...passQuestions];

        if (allQuestions.length === 0) {
            throw new Error("Tidak ada pertanyaan yang ditemukan.");
        }
        
        setQuestions(allQuestions);

        // 2. Initialize screening session
        const { data: existingScreenings, error: existingError } = await supabase
          .from('screenings')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .eq('trimester', trimesterNumber)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingError) throw existingError;

        let currentScreeningId: string;
        const existingScreening = existingScreenings?.[0];

        if (existingScreening) {
          currentScreeningId = existingScreening.id;
          setScreeningId(currentScreeningId);
        } else {
          const { data: newScreening, error } = await supabase
            .from('screenings')
            .insert({ user_id: user.id, status: 'in_progress', trimester: trimesterNumber })
            .select('id')
            .single();

          if (error) throw error;
          currentScreeningId = newScreening.id;
          setScreeningId(currentScreeningId);
          setAnswers([]);
          setCurrentQuestionIndex(0); // Reset index for new screening
          sessionStorage.removeItem(`screening-answers-${currentScreeningId}`);
          sessionStorage.removeItem(`screening-index-${currentScreeningId}`);
        }
        
        // 3. Load Answers and Index from session or DB
        const answersKey = `screening-answers-${currentScreeningId}`;
        const indexKey = `screening-index-${currentScreeningId}`;

        const savedAnswersJson = sessionStorage.getItem(answersKey);
        if (savedAnswersJson) {
          // Filter out answers that don't have a valid question_id from the newly fetched questions.
          const validQuestionIds = new Set(allQuestions.map(q => q.id));
          const parsedAnswers = JSON.parse(savedAnswersJson);
          const filteredAnswers = parsedAnswers.filter((a: Answer) => validQuestionIds.has(a.question_id));
          
          setAnswers(filteredAnswers);
          sessionStorage.setItem(answersKey, JSON.stringify(filteredAnswers));

        } else {
          // Fallback to DB if session is empty
          const { data: existingAnswers } = await supabase
            .from('screening_answers')
            .select('question_id, score, question_type') // Ensure question_type is selected
            .eq('screening_id', currentScreeningId);

          if (existingAnswers && existingAnswers.length > 0) {
            setAnswers(existingAnswers as Answer[]);
            sessionStorage.setItem(answersKey, JSON.stringify(existingAnswers));
          }
        }
        
        const savedIndex = sessionStorage.getItem(indexKey);
        if (savedIndex) {
          setCurrentQuestionIndex(parseInt(savedIndex, 10));
        }

      } catch (error: any) {
        toast({
          title: "Error",
          description: "Gagal memuat data kuis: " + error.message,
          variant: "destructive",
        });
        navigate('/quiz');
      } finally {
        setIsLoading(false);
      }
    };

    if (!parsedTrimester || ![1, 2, 3].includes(parsedTrimester)) {
      toast({ title: "Error", description: "Trimester quiz tidak valid.", variant: "destructive" });
      navigate('/quiz');
      return;
    }

    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      initializePage(parsedTrimester);
    }
  }, [user, loading, navigate, parsedTrimester, toast]);

  // Updated to include questionType
  const handleAnswerChange = (questionId: string, score: string, questionType: 'gad7' | 'pass') => {
    const newAnswer: Answer = { question_id: questionId, score: parseInt(score), question_type: questionType };
    
    const updatedAnswers = answers.filter(a => a.question_id !== questionId);
    updatedAnswers.push(newAnswer);
    setAnswers(updatedAnswers);

    if (screeningId) {
      const sessionStorageKey = `screening-answers-${screeningId}`;
      sessionStorage.setItem(sessionStorageKey, JSON.stringify(updatedAnswers));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      if (screeningId) {
        sessionStorage.setItem(`screening-index-${screeningId}`, newIndex.toString());
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      if (screeningId) {
        sessionStorage.setItem(`screening-index-${screeningId}`, newIndex.toString());
      }
    }
  };

  const calculateAnxietyLevel = (totalScore: number): 'minimal' | 'mild' | 'moderate' | 'severe' => {
    if (totalScore >= 0 && totalScore <= 4) return 'minimal';
    if (totalScore >= 5 && totalScore <= 9) return 'mild';
    if (totalScore >= 10 && totalScore <= 14) return 'moderate';
    return 'severe';
  };

  const handleComplete = async () => {
    if (!screeningId || !user) return;
    setIsSubmitting(true);
    
    try {
      // 1. Bulk save all answers, now including question_type
      const answersToSave = answers.map(answer => ({
        screening_id: screeningId,
        question_id: answer.question_id,
        score: answer.score,
        question_type: answer.question_type, // Crucial fix: include the question type
      }));

      // Use upsert to prevent duplicate entries if user re-submits
      const { error: answersError } = await supabase
        .from('screening_answers')
        .upsert(answersToSave, { onConflict: 'screening_id, question_id' });

      if (answersError) throw answersError;
      
      // 2. Calculate final score and update the screening status
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

      // 3. Update the user's profile to mark first login as false
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_first_login: false })
        .eq('id', user.id);

      if (profileError) {
        console.error('Failed to update is_first_login flag:', profileError);
      }
      
      // 4. Clean up session storage
      sessionStorage.removeItem(`screening-answers-${screeningId}`);
      sessionStorage.removeItem(`screening-index-${screeningId}`);

      toast({
        title: "Skrining Selesai!",
        description: "Hasil skrining Anda telah tersimpan.",
      });
      
      // 5. Navigate to results page
      navigate('/results', { state: { screeningId } });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menyelesaikan skrining: " + error.message,
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
                <p className="text-sm text-muted-foreground">Skrining Kecemasan</p>
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
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-muted-foreground">
              Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
            </p>
            <p className="text-sm font-medium">{Math.round(progress)}%</p>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

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
              // Pass question type to the handler
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value, currentQuestion.type)}
            >
              {scoreOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} />
                  <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="flex-1 cursor-pointer">
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