import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";

interface TouristSpot {
  id: string;
  name: string;
  description: string | null;
  location: string;
  municipality: string | null;
  category: string[];
  image_url: string | null;
  rating: number | null;
  is_hidden_gem: boolean | null;
  budget_level: string | null;
  accessibility_friendly: boolean | null;
  scenery_type: string[] | null;
  latitude: number | null;
  longitude: number | null;
}

interface PersonalizedFeedProps {
  userId: string;
}

const PersonalizedFeed = ({ userId }: PersonalizedFeedProps) => {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites(userId);

  useEffect(() => {
    fetchPersonalizedSpots();
  }, [userId]);

  const fetchPersonalizedSpots = async () => {
    try {
      setLoading(true);

      // Fetch user preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_preferences")
        .eq("id", userId)
        .single();

      const prefs = profile?.user_preferences as any;

      if (!prefs || !prefs.autoRecommendations) {
        setSpots([]);
        return;
      }

      // Fetch all tourist spots
      const { data: allSpots, error } = await supabase
        .from("tourist_spots")
        .select("*");

      if (error) throw error;

      // Score and filter spots based on Albay-specific preferences
      const scoredSpots = allSpots?.map((spot) => {
        let score = 0;

        // Match Albay district
        if (prefs.albayDistrict && prefs.albayDistrict !== "Any District" && spot.municipality) {
          const districtMatch = (() => {
            if (prefs.albayDistrict === "District 1") {
              return ["Tabaco", "Tiwi", "Malinao", "Bacacay"].some(m => 
                spot.municipality?.toLowerCase().includes(m.toLowerCase())
              );
            }
            if (prefs.albayDistrict === "District 2") {
              return ["Legazpi", "Daraga", "Camalig", "Manito"].some(m => 
                spot.municipality?.toLowerCase().includes(m.toLowerCase())
              );
            }
            if (prefs.albayDistrict === "District 3") {
              return ["Ligao", "Guinobatan", "Pioduran", "Jovellar", "Oas", "Polangui", "Libon"].some(m => 
                spot.municipality?.toLowerCase().includes(m.toLowerCase())
              );
            }
            return false;
          })();
          if (districtMatch) score += 5;
        }

        // Traveler type matching
        if (prefs.travelerType && spot.category) {
          if (prefs.travelerType === "Nature Lover" && spot.category.some((c: string) => 
            c.toLowerCase().includes("nature") || c.toLowerCase().includes("eco"))) score += 3;
          if (prefs.travelerType === "Adventure Seeker" && spot.category.some((c: string) => 
            c.toLowerCase().includes("adventure") || c.toLowerCase().includes("hiking"))) score += 3;
          if (prefs.travelerType === "Food Explorer" && spot.category.some((c: string) => 
            c.toLowerCase().includes("food") || c.toLowerCase().includes("restaurant"))) score += 3;
          if (prefs.travelerType === "Cultural/Historical Traveler" && spot.category.some((c: string) => 
            c.toLowerCase().includes("cultural") || c.toLowerCase().includes("historical"))) score += 3;
        }

        // Activity matching
        if (prefs.activities && Array.isArray(prefs.activities) && spot.category) {
          prefs.activities.forEach((activity: string) => {
            if (activity.includes("Hiking") && spot.category.some((c: string) => c.toLowerCase().includes("hiking"))) score += 2;
            if (activity.includes("Beach") && spot.category.some((c: string) => c.toLowerCase().includes("beach"))) score += 2;
            if (activity.includes("Waterfall") && spot.category.some((c: string) => c.toLowerCase().includes("waterfall"))) score += 2;
            if (activity.includes("Food") && spot.category.some((c: string) => c.toLowerCase().includes("food"))) score += 2;
            if (activity.includes("Historical") && spot.category.some((c: string) => c.toLowerCase().includes("historical"))) score += 2;
          });
        }

        // Budget matching
        const budgetMap: { [key: string]: string } = {
          "Budget-friendly": "budget",
          "Moderate": "moderate",
          "Premium": "premium",
        };
        if (prefs.budgetRange && prefs.budgetRange !== "No preference") {
          if (spot.budget_level === budgetMap[prefs.budgetRange]) score += 2;
        }

        // Place preference
        if (prefs.placePreference === "Hidden Gems" && spot.is_hidden_gem) score += 3;
        if (prefs.placePreference === "Popular Tourist Spots" && !spot.is_hidden_gem) score += 2;
        if (prefs.placePreference === "Both") score += 1;

        // Accessibility
        if (prefs.accessibilityNeeded && spot.accessibility_friendly) score += 3;

        // Scenery preference
        if (prefs.sceneryPreference && prefs.sceneryPreference !== "No preference" && spot.scenery_type) {
          const sceneryMatch = spot.scenery_type.some((type: string) => 
            type.toLowerCase().includes(prefs.sceneryPreference.toLowerCase()) ||
            prefs.sceneryPreference.toLowerCase().includes(type.toLowerCase())
          );
          if (sceneryMatch) score += 2;
        }

        // Rating boost
        if (spot.rating) score += (spot.rating / 5) * 2;

        return { ...spot, score };
      }) || [];

      // Sort by score and take top recommendations
      const recommendationCount = 8;
      const topSpots = scoredSpots
        .filter((spot) => spot.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, recommendationCount);

      setSpots(topSpots);
    } catch (error) {
      console.error("Error fetching personalized spots:", error);
      toast.error("Failed to load personalized recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-8">
        <h2 className="text-3xl font-bold">Recommended For You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (spots.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Recommended For You</h2>
          <p className="text-muted-foreground mt-2">
            Based on your travel preferences
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/explore")}>
          View All Destinations
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spots.map((spot) => {
          const isFavorited = favorites.includes(spot.id);

          return (
            <Card
              key={spot.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/spot/${spot.id}`)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={spot.image_url || "/placeholder.svg"}
                  alt={spot.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {spot.is_hidden_gem && (
                  <Badge className="absolute top-3 left-3 bg-primary">
                    Hidden Gem
                  </Badge>
                )}
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-1">{spot.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{spot.location}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {spot.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{spot.rating.toFixed(1)}</span>
                  </div>
                )}

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {spot.description || "Explore this amazing destination"}
                </p>

                <div className="flex flex-wrap gap-2">
                  {spot.category?.slice(0, 2).map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                  {spot.budget_level && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {spot.budget_level}
                    </Badge>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/spot/${spot.id}`);
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalizedFeed;