import { BookOpen, Brain, CheckCircle, Heart, MessageSquare, Stethoscope } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "GAD-7 Anxiety Screening",
      description: "Professional 7-question assessment tool validated for maternal anxiety screening during pregnancy.",
      color: "primary"
    },
    {
      icon: Heart,
      title: "Maternal-Focused Care",
      description: "Specifically designed for first-time mothers (primigravida) with pregnancy-specific considerations.",
      color: "maternal"
    },
    {
      icon: BookOpen,
      title: "Educational Resources",
      description: "Access comprehensive learning materials, articles, and interactive content about maternal health.",
      color: "success"
    },
    {
      icon: CheckCircle,
      title: "Interactive Quizzes",
      description: "Test your knowledge with engaging quizzes and track your learning progress over time.",
      color: "primary"
    },
    {
      icon: Stethoscope,
      title: "Healthcare Provider Portal",
      description: "Secure dashboard for midwives and doctors to monitor patient progress and provide guidance.",
      color: "maternal"
    },
    {
      icon: MessageSquare,
      title: "Personalized Feedback",
      description: "Receive detailed results interpretation and personalized recommendations based on your screening.",
      color: "success"
    }
  ];

  const getIconStyle = (color: string) => {
    const styles = {
      primary: "bg-primary/10 text-primary",
      maternal: "bg-maternal/10 text-maternal",
      success: "bg-success/10 text-success"
    };
    return styles[color as keyof typeof styles] || styles.primary;
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background to-accent/20">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent border border-primary/20">
            <Heart className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium text-foreground">Complete Care Platform</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Comprehensive Maternal
            <span className="bg-gradient-to-r from-primary to-maternal bg-clip-text text-transparent"> Health Support</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From professional screening to educational resources, CallMyCare provides everything you need 
            for confident maternal health management.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="card-gradient shadow-soft hover:shadow-maternal transition-all duration-300 border-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="space-y-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${getIconStyle(feature.color)}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="inline-block p-8 card-gradient shadow-maternal border-0">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Ready to Start Your Screening?</h3>
              <p className="text-muted-foreground max-w-md">
                Take the first step towards better maternal health with our professional GAD-7 assessment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <button className="px-6 py-3 bg-gradient-maternal text-white rounded-lg font-medium shadow-maternal hover:shadow-glow transition-all duration-300">
                  Begin Assessment
                </button>
                <button className="px-6 py-3 border border-primary/20 text-foreground rounded-lg font-medium hover:bg-accent transition-smooth">
                  Learn About GAD-7
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Features;