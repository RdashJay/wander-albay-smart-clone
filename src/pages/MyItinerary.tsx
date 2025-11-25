import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Navigation, Trash2, Loader2, Calendar, AlertCircle, Plus } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { CreateItineraryModal } from "@/components/CreateItineraryModal";

interface SavedSpot {
  id: string;
  name: string;
  description: string | null;
  location: string;
  municipality: string | null;
  category: string[];
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface SavedItinerary {
  id: string;
  name: string;
  created_at: string;
  spots: SavedSpot[];
  selected_categories: string[];
}

const MyItinerary = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session?.user) {
      fetchItineraries();
    }
  }, [session]);

  const fetchItineraries = async () => {
    if (!session?.user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setIsLoading(false);

    if (error) {
      toast.error("Failed to load itineraries");
      return;
    }

    // Transform the data to match our interface
    const transformedData: SavedItinerary[] = (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      created_at: item.created_at,
      spots: Array.isArray(item.spots) ? (item.spots as any[]).filter(spot => spot && typeof spot === 'object') : [],
      selected_categories: item.selected_categories || [],
    }));

    setItineraries(transformedData);
  };

  const deleteItinerary = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("itineraries").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      toast.error("Failed to delete itinerary");
    } else {
      toast.success("Itinerary deleted");
      fetchItineraries();
    }
  };

  const navigateToSpot = (spot: SavedSpot) => {
    if (!spot.latitude || !spot.longitude) {
      toast.error("Location coordinates not available");
      return;
    }

    navigate(
      `/route?lat=${spot.latitude}&lng=${spot.longitude}&name=${encodeURIComponent(
        spot.name
      )}&image=${encodeURIComponent(spot.image_url || "")}`
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                My <span className="text-primary">Itineraries</span>
              </h1>
              <p className="text-muted-foreground">
                View your saved travel plans and get directions to your destinations
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create New
            </Button>
          </div>

          {itineraries.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">No Itineraries Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start planning your adventure by creating your first itinerary
                </p>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Itinerary
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {itineraries.map((itinerary) => (
                <Card key={itinerary.id} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{itinerary.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Created on {new Date(itinerary.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {itinerary.selected_categories.map((category) => (
                            <Badge key={category} variant="secondary">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItinerary(itinerary.id)}
                        disabled={deletingId === itinerary.id}
                      >
                        {deletingId === itinerary.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Destinations ({itinerary.spots.length})
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {itinerary.spots.map((spot) => {
                        const hasCoordinates = spot.latitude && spot.longitude;
                        return (
                          <Card
                            key={spot.id}
                            className={`overflow-hidden transition-all ${
                              hasCoordinates ? "cursor-pointer hover:shadow-lg group" : ""
                            }`}
                            onClick={() => hasCoordinates && navigateToSpot(spot)}
                          >
                            {spot.image_url && (
                              <div className="relative h-40 overflow-hidden">
                                <img
                                  src={spot.image_url}
                                  alt={spot.name}
                                  className={`w-full h-full object-cover transition-transform duration-300 ${
                                    hasCoordinates ? "group-hover:scale-110" : ""
                                  }`}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-2 right-2">
                                  <Button
                                    size="sm"
                                    className="gap-2 bg-primary/90 hover:bg-primary"
                                    disabled={!hasCoordinates}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigateToSpot(spot);
                                    }}
                                  >
                                    <Navigation className="w-3 h-3" />
                                    Get Directions
                                  </Button>
                                </div>
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold line-clamp-1">{spot.name}</h4>
                                {!hasCoordinates && (
                                  <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                                    <AlertCircle className="w-3 h-3" />
                                    No GPS
                                  </Badge>
                                )}
                              </div>
                              {spot.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {spot.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span className="line-clamp-1">{spot.location}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {spot.category.slice(0, 2).map((cat) => (
                                  <Badge key={cat} variant="outline" className="text-xs">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {session?.user && (
        <CreateItineraryModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={fetchItineraries}
          userId={session.user.id}
        />
      )}
    </div>
  );
};

export default MyItinerary;
