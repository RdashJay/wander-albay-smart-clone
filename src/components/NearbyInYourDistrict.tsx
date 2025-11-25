import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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
}

interface NearbyInYourDistrictProps {
  userId: string;
}

const NearbyInYourDistrict = ({ userId }: NearbyInYourDistrictProps) => {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtName, setDistrictName] = useState("");
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites(userId);

  useEffect(() => {
    fetchNearbySpots();
  }, [userId]);

  const getDistrictMunicipalities = (district: string): string[] => {
    const districtMap: { [key: string]: string[] } = {
      "District 1": ["Tabaco", "Tiwi", "Malinao", "Bacacay"],
      "District 2": ["Legazpi", "Daraga", "Camalig", "Manito"],
      "District 3": ["Ligao", "Guinobatan", "Pioduran", "Jovellar", "Oas", "Polangui", "Libon"],
    };
    return districtMap[district] || [];
  };

  const fetchNearbySpots = async () => {
    try {
      setLoading(true);

      // Fetch user preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_preferences")
        .eq("id", userId)
        .single();

      const prefs = profile?.user_preferences as any;

      if (!prefs?.albayDistrict) {
        setSpots([]);
        return;
      }

      const district = prefs.albayDistrict;
      setDistrictName(district);

      // If "Any District" is selected, don't filter by district
      if (district === "Any District") {
        // Fetch random spots from all districts
        const { data: allSpots, error } = await supabase
          .from("tourist_spots")
          .select("*")
          .limit(6);

        if (error) throw error;
        setSpots(allSpots || []);
        return;
      }

      // Get municipalities for the selected district
      const municipalities = getDistrictMunicipalities(district);

      // Fetch tourist spots from the selected district
      const { data: districtSpots, error } = await supabase
        .from("tourist_spots")
        .select("*");

      if (error) throw error;

      // Filter spots by municipality
      const filteredSpots = districtSpots?.filter((spot) => {
        if (!spot.municipality) return false;
        return municipalities.some((municipality) =>
          spot.municipality?.toLowerCase().includes(municipality.toLowerCase())
        );
      }) || [];

      // Sort by rating and take top 6
      const topSpots = filteredSpots
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);

      setSpots(topSpots);
    } catch (error) {
      console.error("Error fetching nearby spots:", error);
      toast.error("Failed to load nearby spots");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-8">
        <h2 className="text-3xl font-bold">Nearby in Your District</h2>
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
          <h2 className="text-3xl font-bold">
            Nearby in {districtName === "Any District" ? "Albay" : districtName}
          </h2>
          <p className="text-muted-foreground mt-2">
            {districtName === "Any District"
              ? "Explore popular destinations across Albay"
              : `Top-rated destinations in your selected district`}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/explore")}>
          Explore More
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
                    💎 Hidden Gem
                  </Badge>
                )}
                {spot.municipality && (
                  <Badge className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm">
                    {spot.municipality}
                  </Badge>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(spot.id);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorited ? "fill-red-500 text-red-500" : "text-foreground"
                    }`}
                  />
                </button>
              </div>

              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                  {spot.name}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{spot.location}</span>
                </div>

                {spot.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{spot.rating.toFixed(1)}</span>
                  </div>
                )}

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {spot.description || "Discover this amazing destination"}
                </p>

                {spot.category && spot.category.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {spot.category.slice(0, 2).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}

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

export default NearbyInYourDistrict;
