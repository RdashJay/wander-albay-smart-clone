import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MapPin, Sparkles, CheckCircle2 } from "lucide-react";

interface TouristSpot {
  id: string;
  name: string;
  description: string | null;
  location: string;
  municipality: string | null;
  category: string[];
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  budget_level: string | null;
  scenery_type: string[];
  spot_type: string[];
  is_hidden_gem: boolean;
}

interface CreateItineraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

export const CreateItineraryModal = ({ open, onOpenChange, onSuccess, userId }: CreateItineraryModalProps) => {
  const [itineraryName, setItineraryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [selectedSpots, setSelectedSpots] = useState<Set<string>>(new Set());
  const [fetchingSpots, setFetchingSpots] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchUserPreferences();
      fetchSpots();
    }
  }, [open]);

  const fetchUserPreferences = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_preferences, onboarding_answers")
      .eq("id", userId)
      .single();

    if (data) {
      setUserPreferences(data.user_preferences || data.onboarding_answers);
    }
  };

  const fetchSpots = async () => {
    setFetchingSpots(true);
    const { data, error } = await supabase
      .from("tourist_spots")
      .select("*")
      .order("rating", { ascending: false });

    if (error) {
      toast.error("Failed to fetch tourist spots");
    } else {
      setSpots(data || []);
    }
    setFetchingSpots(false);
  };

  const scoreSpot = (spot: TouristSpot) => {
    let score = 0;

    if (!userPreferences) return Math.random();

    // Category matching
    if (userPreferences.preferredActivities && spot.category) {
      const matches = userPreferences.preferredActivities.filter((activity: string) =>
        spot.category.some((cat: string) => cat.toLowerCase().includes(activity.toLowerCase()))
      );
      score += matches.length * 3;
    }

    // Budget level matching
    if (userPreferences.budgetRange && spot.budget_level) {
      if (spot.budget_level.toLowerCase() === userPreferences.budgetRange.toLowerCase()) {
        score += 2;
      }
    }

    // Scenery type matching
    if (userPreferences.sceneryType && spot.scenery_type) {
      const matches = spot.scenery_type.filter((scenery: string) =>
        userPreferences.sceneryType.includes(scenery)
      );
      score += matches.length * 2;
    }

    // Hidden gems preference
    if (userPreferences.hiddenGems && spot.is_hidden_gem) {
      score += 2;
    }

    // Rating boost
    if (spot.rating) {
      score += spot.rating / 2;
    }

    return score;
  };

  const handleAutoSelect = () => {
    const scoredSpots = spots
      .map((spot) => ({ spot, score: scoreSpot(spot) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => item.spot.id);

    setSelectedSpots(new Set(scoredSpots));
    toast.success("Auto-selected top 8 recommended spots based on your preferences!");
  };

  const toggleSpot = (spotId: string) => {
    const newSelected = new Set(selectedSpots);
    if (newSelected.has(spotId)) {
      newSelected.delete(spotId);
    } else {
      newSelected.add(spotId);
    }
    setSelectedSpots(newSelected);
  };

  const handleCreateItinerary = async () => {
    if (!itineraryName.trim()) {
      toast.error("Please enter an itinerary name");
      return;
    }

    if (selectedSpots.size === 0) {
      toast.error("Please select at least one spot");
      return;
    }

    setLoading(true);

    const selectedSpotData = spots.filter((spot) => selectedSpots.has(spot.id));

    const { error } = await supabase.from("itineraries").insert([{
      user_id: userId,
      name: itineraryName,
      spots: selectedSpotData as any,
      selected_categories: [...new Set(selectedSpotData.flatMap((s) => s.category))],
    }]);

    setLoading(false);

    if (error) {
      toast.error("Failed to create itinerary");
    } else {
      toast.success("Itinerary created successfully!");
      setItineraryName("");
      setSelectedSpots(new Set());
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Itinerary</DialogTitle>
          <DialogDescription>
            Give your itinerary a name and add tourist spots to visit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div>
            <Label htmlFor="name">Itinerary Name</Label>
            <Input
              id="name"
              placeholder="e.g., Weekend Adventure in Albay"
              value={itineraryName}
              onChange={(e) => setItineraryName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <Tabs defaultValue="auto" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Auto-Select</TabsTrigger>
              <TabsTrigger value="manual">Manual Selection</TabsTrigger>
            </TabsList>

            <TabsContent value="auto" className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Smart Recommendations
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll select the best spots based on your preferences
                    </p>
                  </div>
                  <Button onClick={handleAutoSelect} disabled={fetchingSpots}>
                    {fetchingSpots ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Auto-Select Top 8"
                    )}
                  </Button>
                </div>

                {selectedSpots.size > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      {selectedSpots.size} spots selected
                    </div>
                    <ScrollArea className="h-[300px] border rounded-lg p-4">
                      <div className="grid gap-3">
                        {spots
                          .filter((spot) => selectedSpots.has(spot.id))
                          .map((spot) => (
                            <Card key={spot.id}>
                              <CardContent className="p-3 flex items-center gap-3">
                                {spot.image_url && (
                                  <img
                                    src={spot.image_url}
                                    alt={spot.name}
                                    className="w-16 h-16 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm line-clamp-1">
                                    {spot.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {spot.location}
                                  </p>
                                  <div className="flex gap-1 mt-1">
                                    {spot.category.slice(0, 2).map((cat) => (
                                      <Badge key={cat} variant="secondary" className="text-xs">
                                        {cat}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSpot(spot.id)}
                                >
                                  Remove
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="flex-1 overflow-auto">
              <ScrollArea className="h-[400px]">
                {fetchingSpots ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid gap-3 pr-4">
                    {spots.map((spot) => (
                      <Card
                        key={spot.id}
                        className={`cursor-pointer transition-all ${
                          selectedSpots.has(spot.id) ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => toggleSpot(spot.id)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <Checkbox
                            checked={selectedSpots.has(spot.id)}
                            onCheckedChange={() => toggleSpot(spot.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {spot.image_url && (
                            <img
                              src={spot.image_url}
                              alt={spot.name}
                              className="w-16 h-16 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-1">{spot.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {spot.location}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {spot.category.slice(0, 2).map((cat) => (
                                <Badge key={cat} variant="secondary" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedSpots.size} {selectedSpots.size === 1 ? "spot" : "spots"} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateItinerary} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Itinerary"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
