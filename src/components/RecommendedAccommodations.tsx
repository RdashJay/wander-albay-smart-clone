import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Accommodation {
  id: string;
  name: string;
  location: string;
  municipality: string | null;
  description: string | null;
  image_url: string | null;
  rating: number | null;
  price_range: string | null;
  amenities: string[] | null;
  category: string[] | null;
}

interface RecommendedAccommodationsProps {
  preferences: any;
  userId?: string;
}

export const RecommendedAccommodations = ({ preferences, userId }: RecommendedAccommodationsProps) => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendedAccommodations();
    if (userId) {
      fetchFavorites();
    }
  }, [preferences, userId]);

  const fetchRecommendedAccommodations = async () => {
    setLoading(true);
    
    let query = supabase.from("accommodations").select("*");

    // Filter by district/municipality if available
    if (preferences?.albayDistrict && preferences.albayDistrict !== "Any District") {
      const municipalities = extractMunicipalities(preferences.albayDistrict);
      if (municipalities.length > 0) {
        query = query.in("municipality", municipalities);
      }
    }

    // Filter by budget
    if (preferences?.budgetRange && preferences.budgetRange !== "No preference") {
      const budgetMap: Record<string, string> = {
        "Budget-friendly": "Budget",
        "Moderate": "Mid-range",
        "Premium": "Luxury"
      };
      const mappedBudget = budgetMap[preferences.budgetRange];
      if (mappedBudget) {
        query = query.eq("price_range", mappedBudget);
      }
    }

    query = query.order("rating", { ascending: false }).limit(6);

    const { data, error } = await query;

    if (!error && data) {
      setAccommodations(data);
    }
    
    setLoading(false);
  };

  const extractMunicipalities = (district: string): string[] => {
    const districtMap: Record<string, string[]> = {
      "District 1": ["Tabaco City", "Tiwi", "Malinao", "Bacacay"],
      "District 2": ["Legazpi City", "Daraga", "Camalig", "Manito"],
      "District 3": ["Ligao City", "Guinobatan", "Pioduran", "Jovellar", "Oas", "Polangui", "Libon"]
    };
    return districtMap[district] || [];
  };

  const fetchFavorites = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("favorites")
      .select("item_id")
      .eq("user_id", userId)
      .eq("item_type", "accommodation");

    if (data) {
      setFavorites(new Set(data.map((fav) => fav.item_id)));
    }
  };

  const toggleFavorite = async (accommodationId: string) => {
    if (!userId) {
      toast.error("Please sign in to save favorites");
      return;
    }

    const isFavorite = favorites.has(accommodationId);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", accommodationId)
        .eq("item_type", "accommodation");

      if (!error) {
        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(accommodationId);
          return newSet;
        });
        toast.success("Removed from favorites");
      }
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: userId,
        item_id: accommodationId,
        item_type: "accommodation",
      });

      if (!error) {
        setFavorites((prev) => new Set(prev).add(accommodationId));
        toast.success("Added to favorites");
      }
    }
  };

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Recommended Accommodations 🏨</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted" />
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (accommodations.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Recommended Accommodations 🏨</h2>
          <p className="text-muted-foreground">
            Hotels and stays matching your travel preferences
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/explore")}>
          Explore More
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accommodations.map((accommodation) => (
          <Card
            key={accommodation.id}
            className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
            onClick={() => navigate(`/explore`)}
          >
            <div className="relative h-48 bg-muted overflow-hidden">
              {accommodation.image_url ? (
                <img
                  src={accommodation.image_url}
                  alt={accommodation.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <MapPin className="w-12 h-12" />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(accommodation.id);
                }}
              >
                <Heart
                  className={`w-5 h-5 ${
                    favorites.has(accommodation.id)
                      ? "fill-red-500 text-red-500"
                      : "text-foreground"
                  }`}
                />
              </Button>
            </div>

            <CardHeader>
              <CardTitle className="text-lg">{accommodation.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {accommodation.municipality || accommodation.location}
              </div>
              {accommodation.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{accommodation.rating}</span>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {accommodation.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {accommodation.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {accommodation.price_range && (
                  <Badge variant="secondary">{accommodation.price_range}</Badge>
                )}
                {accommodation.category?.slice(0, 2).map((cat) => (
                  <Badge key={cat} variant="outline">
                    {cat}
                  </Badge>
                ))}
              </div>

              {accommodation.amenities && accommodation.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                  {accommodation.amenities.slice(0, 3).map((amenity, idx) => (
                    <span key={idx}>
                      {amenity}
                      {idx < Math.min(2, accommodation.amenities!.length - 1) && " •"}
                    </span>
                  ))}
                </div>
              )}

              <Button className="w-full mt-4" variant="default">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
