import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Eye, Heart, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { Session } from "@supabase/supabase-js";

interface TouristSpot {
  id: string;
  name: string;
  description: string;
  location: string;
  municipality: string;
  category: string[];
  image_url: string;
  rating: number;
  is_hidden_gem: boolean;
}

interface UserPreferences {
  albayDistrict: string;
  travelerType: string;
  activities: string[];
  sceneryPreference: string;
  placePreference: string;
  budgetRange: string;
  accessibilityNeeded: boolean;
  travelMode: string;
  travelCompanions: string;
  autoRecommendations: boolean;
}

interface RecommendedSpotsProps {
  preferences: UserPreferences;
  userId?: string;
}

const RecommendedSpots = ({ preferences, userId }: RecommendedSpotsProps) => {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { favorites, visited, toggleFavorite, markAsVisited, isFavorite, isVisited } = useFavorites(userId);

  useEffect(() => {
    fetchRecommendedSpots();
  }, [preferences]);

  const fetchRecommendedSpots = async () => {
    try {
      const { data, error } = await supabase
        .from("tourist_spots")
        .select("*");

      if (error) throw error;

      if (data) {
        // Filter and score spots based on Albay-specific preferences
        const scoredSpots = data.map(spot => {
          let score = 0;
          
          // Match Albay district with municipality
          if (preferences.albayDistrict && preferences.albayDistrict !== "Any District" && spot.municipality) {
            const districtMatch = (() => {
              if (preferences.albayDistrict === "District 1") {
                return ["Tabaco", "Tiwi", "Malinao", "Bacacay"].some(m => 
                  spot.municipality?.toLowerCase().includes(m.toLowerCase())
                );
              }
              if (preferences.albayDistrict === "District 2") {
                return ["Legazpi", "Daraga", "Camalig", "Manito"].some(m => 
                  spot.municipality?.toLowerCase().includes(m.toLowerCase())
                );
              }
              if (preferences.albayDistrict === "District 3") {
                return ["Ligao", "Guinobatan", "Pioduran", "Jovellar", "Oas", "Polangui", "Libon"].some(m => 
                  spot.municipality?.toLowerCase().includes(m.toLowerCase())
                );
              }
              return false;
            })();
            if (districtMatch) score += 5;
          }

          // Match traveler type with categories
          if (preferences.travelerType && spot.category) {
            if (preferences.travelerType === "Nature Lover" && spot.category.some(c => 
              c.toLowerCase().includes("nature") || c.toLowerCase().includes("eco"))) score += 3;
            if (preferences.travelerType === "Adventure Seeker" && spot.category.some(c => 
              c.toLowerCase().includes("adventure") || c.toLowerCase().includes("hiking"))) score += 3;
            if (preferences.travelerType === "Food Explorer" && spot.category.some(c => 
              c.toLowerCase().includes("food") || c.toLowerCase().includes("restaurant"))) score += 3;
            if (preferences.travelerType === "Cultural/Historical Traveler" && spot.category.some(c => 
              c.toLowerCase().includes("cultural") || c.toLowerCase().includes("historical"))) score += 3;
          }

          // Match activities
          if (preferences.activities && preferences.activities.length > 0 && spot.category) {
            preferences.activities.forEach(activity => {
              if (activity.includes("Hiking") && spot.category.some(c => c.toLowerCase().includes("hiking"))) score += 2;
              if (activity.includes("Beach") && spot.category.some(c => c.toLowerCase().includes("beach"))) score += 2;
              if (activity.includes("Waterfall") && spot.category.some(c => c.toLowerCase().includes("waterfall"))) score += 2;
              if (activity.includes("Food") && spot.category.some(c => c.toLowerCase().includes("food"))) score += 2;
              if (activity.includes("Historical") && spot.category.some(c => c.toLowerCase().includes("historical"))) score += 2;
            });
          }

          // Match place preference
          if (preferences.placePreference === "Hidden Gems" && spot.is_hidden_gem) score += 3;
          if (preferences.placePreference === "Popular Tourist Spots" && !spot.is_hidden_gem) score += 2;

          // Boost highly rated spots
          if (spot.rating) score += (spot.rating / 5) * 2;

          return { ...spot, score };
        });

        // Sort by score and take top 8
        const recommendedSpots = scoredSpots
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);

        setSpots(recommendedSpots);
      }
    } catch (error) {
      console.error("Error fetching spots:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't find spots matching your preferences. Try exploring all destinations!
          </p>
          <Button onClick={() => navigate("/explore")}>
            Explore All Destinations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {spots.map((spot) => (
        <Card 
          key={spot.id} 
          className="group cursor-pointer hover:shadow-xl transition-all overflow-hidden"
          onClick={() => navigate(`/spot/${spot.id}`)}
        >
          <div className="relative h-48 overflow-hidden">
            <img
              src={spot.image_url || "/placeholder.svg"}
              alt={spot.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {spot.is_hidden_gem && (
              <Badge className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm">
                💎 Hidden Gem
              </Badge>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
              {spot.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{spot.municipality || spot.location}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {spot.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{spot.rating.toFixed(1)}</span>
                </div>
              )}
              {spot.category && spot.category.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {spot.category[0]}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {spot.description}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/spot/${spot.id}`);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RecommendedSpots;
