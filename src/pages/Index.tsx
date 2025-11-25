import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import HiddenGemsSection from "@/components/HiddenGemsSection";
import PersonalizedFeed from "@/components/PersonalizedFeed";
import NearbyInYourDistrict from "@/components/NearbyInYourDistrict";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Sparkles, Mountain, UtensilsCrossed, Church, Waves, MapPin, ArrowRight, RefreshCw } from "lucide-react";
import heroImage from "@/assets/hero-mayon.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUserId(session.user.id);
        checkOnboardingStatus(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUserId(session.user.id);
        setTimeout(() => {
          checkOnboardingStatus(session.user.id);
        }, 0);
      } else {
        setShowOnboarding(false);
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOnboardingStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_complete, user_preferences")
      .eq("id", userId)
      .single();

    if (!error && data) {
      if (!data.onboarding_complete || !data.user_preferences) {
        setShowOnboarding(true);
        setHasCompletedOnboarding(false);
      } else {
        setHasCompletedOnboarding(true);
      }
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasCompletedOnboarding(true);
    if (userId) {
      checkOnboardingStatus(userId);
    }
  };

  const handleResetPreferences = async () => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_complete: false,
          user_preferences: null,
          onboarding_answers: null
        })
        .eq("id", userId);

      if (error) throw error;

      setHasCompletedOnboarding(false);
      setShowOnboarding(true);
      toast.success("Preferences reset. Let's personalize your experience again!");
    } catch (error) {
      console.error("Error resetting preferences:", error);
      toast.error("Failed to reset preferences");
    }
  };

  const categories = [
    { icon: Mountain, label: "Nature", color: "from-secondary to-secondary/70" },
    { icon: Church, label: "Culture", color: "from-accent to-accent/70" },
    { icon: Waves, label: "Adventure", color: "from-primary to-primary/70" },
    { icon: UtensilsCrossed, label: "Food", color: "from-orange-500 to-orange-400" },
  ];

  const handleCategoryClick = (category: string) => {
    if (!session) {
      navigate("/auth");
    } else {
      navigate("/itinerary", { state: { preselectedCategory: category } });
    }
  };

  const features = [
    {
      title: "Smart Recommendations",
      description: "AI-powered itinerary suggestions based on your interests",
      icon: Sparkles,
      route: "/itinerary",
      requiresAuth: true,
    },
    {
      title: "Interactive Maps",
      description: "Explore Albay's tourist spots with detailed location guides",
      icon: MapPin,
      route: "/map",
      requiresAuth: false,
    },
    {
      title: "Local Insights",
      description: "Discover hidden gems and authentic experiences",
      icon: Mountain,
      route: "/explore",
      requiresAuth: false,
    },
  ];

  const handleFeatureClick = (route: string, requiresAuth: boolean) => {
    if (requiresAuth && !session) {
      navigate("/auth");
    } else {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Onboarding Modal */}
      {showOnboarding && userId && (
        <OnboardingModal
          open={showOnboarding}
          onComplete={handleOnboardingComplete}
          userId={userId}
        />
      )}
      
      {/* Show Personalized Feed for users who completed onboarding */}
      {session && hasCompletedOnboarding && userId ? (
        <div className="container py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">Welcome back, {session.user.user_metadata?.full_name || 'Traveler'}!</h1>
                <p className="text-lg text-muted-foreground">Here's your personalized travel feed</p>
              </div>
              <Button variant="outline" onClick={handleResetPreferences}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Preferences
              </Button>
            </div>
            <NearbyInYourDistrict userId={userId} />
            <PersonalizedFeed userId={userId} />
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Mayon Volcano at sunset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground drop-shadow-lg">
            Explore Albay <br />
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Smarter with Wanderer
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/90 mb-8 drop-shadow-md">
            Your intelligent travel companion for discovering the beauty of Bicol
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg gap-2 shadow-xl hover:shadow-2xl transition-all"
              onClick={() => navigate(session ? "/itinerary" : "/auth")}
            >
              <Sparkles className="w-5 h-5" />
              Build Your Itinerary
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg gap-2 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={() => navigate("/explore")}
            >
              Explore Destinations
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your <span className="text-primary">Adventure</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select your interests and let us create the perfect itinerary for your journey
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.label}
                  className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 hover:border-primary/50 group"
                  onClick={() => handleCategoryClick(category.label)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{category.label}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Hidden Gems Section */}
      <HiddenGemsSection />

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-accent">Wanderer?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title} 
                  className="border-2 hover:border-primary/50 transition-all cursor-pointer hover:scale-105 hover:shadow-xl group"
                  onClick={() => handleFeatureClick(feature.route, feature.requiresAuth)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transition-shadow">
                      <Icon className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">Learn more</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-accent to-secondary">
        <div className="container text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who have discovered Albay's wonders
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg gap-2 shadow-2xl hover:shadow-3xl transition-all"
            onClick={() => navigate(session ? "/itinerary" : "/auth")}
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40">
        <div className="container text-center text-muted-foreground">
          <p>© 2025 Wanderer. Optimizing tourist journeys around Albay.</p>
        </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default Index;
