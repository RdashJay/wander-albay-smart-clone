import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
}

interface UserPreferences {
  travelerType: string[];
  activities: string[];
  travelDistance: string;
  budgetRange: string;
  placePreference: string;
  accessibilityNeeded: boolean;
  sceneryPreference: string[];
  travelPace: string;
  travelCompanions: string;
  autoRecommendations: boolean;
}

export const OnboardingModal = ({ open, onComplete, userId }: OnboardingModalProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    travelerType: [],
    activities: [],
    travelDistance: "",
    budgetRange: "",
    placePreference: "",
    accessibilityNeeded: false,
    sceneryPreference: [],
    travelPace: "",
    travelCompanions: "",
    autoRecommendations: true,
  });

  const totalSteps = 10;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          user_preferences: preferences as any,
          onboarding_complete: true,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Preferences saved! Generating your personalized recommendations...");
      onComplete();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return preferences.travelerType.length > 0;
      case 2: return preferences.activities.length > 0;
      case 3: return preferences.travelDistance !== "";
      case 4: return preferences.budgetRange !== "";
      case 5: return preferences.placePreference !== "";
      case 6: return true; // accessibility is optional
      case 7: return preferences.sceneryPreference.length > 0;
      case 8: return preferences.travelPace !== "";
      case 9: return preferences.travelCompanions !== "";
      case 10: return true; // auto recommendations has default
      default: return false;
    }
  };

  const toggleMultiSelect = (field: keyof UserPreferences, value: string) => {
    const current = preferences[field] as string[];
    setPreferences({
      ...preferences,
      [field]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">What type of traveler are you?</h3>
              <p className="text-sm text-muted-foreground mb-4">Select all that apply</p>
              {["Adventure Seeker", "Nature Lover", "Relaxed Tourist", "Food Explorer", "Cultural/Historical Traveler"].map((type) => (
                <div key={type} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={type}
                    checked={preferences.travelerType.includes(type)}
                    onCheckedChange={() => toggleMultiSelect("travelerType", type)}
                  />
                  <Label htmlFor={type} className="cursor-pointer flex-1 font-normal">{type}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">What activities do you enjoy most?</h3>
              <p className="text-sm text-muted-foreground mb-4">Select all that apply</p>
              {["Hiking", "Swimming/Beach", "Food Trips", "Historical Tours", "Sightseeing", "Wildlife/Eco Tours", "Shopping"].map((activity) => (
                <div key={activity} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={activity}
                    checked={preferences.activities.includes(activity)}
                    onCheckedChange={() => toggleMultiSelect("activities", activity)}
                  />
                  <Label htmlFor={activity} className="cursor-pointer flex-1 font-normal">{activity}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">How far are you willing to travel?</h3>
              {["Within my city", "Within my province", "Within Region V", "Anywhere in the Philippines"].map((distance) => (
                <div key={distance} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={distance}
                    checked={preferences.travelDistance === distance}
                    onCheckedChange={() => setPreferences({ ...preferences, travelDistance: distance })}
                  />
                  <Label htmlFor={distance} className="cursor-pointer flex-1 font-normal">{distance}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">What is your preferred budget range?</h3>
              {["Budget-friendly", "Moderate", "Premium", "No preference"].map((budget) => (
                <div key={budget} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={budget}
                    checked={preferences.budgetRange === budget}
                    onCheckedChange={() => setPreferences({ ...preferences, budgetRange: budget })}
                  />
                  <Label htmlFor={budget} className="cursor-pointer flex-1 font-normal">{budget}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">Do you prefer popular places or hidden gems?</h3>
              {["Popular", "Hidden Gems", "Both"].map((pref) => (
                <div key={pref} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={pref}
                    checked={preferences.placePreference === pref}
                    onCheckedChange={() => setPreferences({ ...preferences, placePreference: pref })}
                  />
                  <Label htmlFor={pref} className="cursor-pointer flex-1 font-normal">{pref}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">Do you need accessibility-friendly locations?</h3>
              {[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ].map((option) => (
                <div key={String(option.value)} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={String(option.value)}
                    checked={preferences.accessibilityNeeded === option.value}
                    onCheckedChange={() => setPreferences({ ...preferences, accessibilityNeeded: option.value })}
                  />
                  <Label htmlFor={String(option.value)} className="cursor-pointer flex-1 font-normal">{option.label}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">What scenery do you prefer?</h3>
              <p className="text-sm text-muted-foreground mb-4">Select all that apply</p>
              {["Mountain", "Beach", "Waterfalls", "Urban", "Rural/Nature", "No preference"].map((scenery) => (
                <div key={scenery} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={scenery}
                    checked={preferences.sceneryPreference.includes(scenery)}
                    onCheckedChange={() => toggleMultiSelect("sceneryPreference", scenery)}
                  />
                  <Label htmlFor={scenery} className="cursor-pointer flex-1 font-normal">{scenery}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 8:
        return (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">What is your travel pace?</h3>
              {[
                { value: "Slow", desc: "Take your time, enjoy each moment" },
                { value: "Balanced", desc: "Mix of relaxation and activity" },
                { value: "Fast", desc: "See as much as possible" },
              ].map((pace) => (
                <div key={pace.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={pace.value}
                    checked={preferences.travelPace === pace.value}
                    onCheckedChange={() => setPreferences({ ...preferences, travelPace: pace.value })}
                  />
                  <Label htmlFor={pace.value} className="cursor-pointer flex-1">
                    <div className="font-medium">{pace.value}</div>
                    <div className="text-sm text-muted-foreground">{pace.desc}</div>
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 9:
        return (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">Who are you traveling with?</h3>
              {["Solo", "Couple", "Family", "Friends"].map((companion) => (
                <div key={companion} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={companion}
                    checked={preferences.travelCompanions === companion}
                    onCheckedChange={() => setPreferences({ ...preferences, travelCompanions: companion })}
                  />
                  <Label htmlFor={companion} className="cursor-pointer flex-1 font-normal">{companion}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 10:
        return (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">Do you want automatic recommendations?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We'll show you personalized recommendations based on your preferences
              </p>
              {[
                { value: true, label: "Yes, show me recommendations" },
                { value: false, label: "No, I'll explore on my own" },
              ].map((option) => (
                <div key={String(option.value)} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={`auto-${option.value}`}
                    checked={preferences.autoRecommendations === option.value}
                    onCheckedChange={() => setPreferences({ ...preferences, autoRecommendations: option.value })}
                  />
                  <Label htmlFor={`auto-${option.value}`} className="cursor-pointer flex-1 font-normal">{option.label}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 1 ? "Welcome to Wanderer!" : `Step ${step} of ${totalSteps}`}
          </DialogTitle>
          <div className="w-full bg-secondary rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <div className="py-4">{renderStep()}</div>

        <div className="flex justify-between gap-4 pt-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="flex-1" />
          
          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed() || loading}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Complete Setup
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};