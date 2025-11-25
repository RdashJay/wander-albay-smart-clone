import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { MapPin, Phone, Star, ArrowLeft, Loader2, Plus, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface TouristSpot {
  id: string;
  name: string;
  description: string | null;
  location: string;
  municipality: string | null;
  category: string[];
  image_url: string | null;
  contact_number: string | null;
  rating: number;
  latitude: number | null;
  longitude: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  user_name: string;
}

const SpotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [spot, setSpot] = useState<TouristSpot | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const [isAddingToItinerary, setIsAddingToItinerary] = useState(false);
  const [isInItinerary, setIsInItinerary] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchSpot();
    }
  }, [id]);

  useEffect(() => {
    if (session?.user && id) {
      checkIfInItinerary();
    }
  }, [session, id]);

  const fetchSpot = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tourist_spots")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setSpot(data);
    }
    setIsLoading(false);
  };

  const checkIfInItinerary = async () => {
    if (!session?.user || !id) return;

    const { data, error } = await supabase
      .from("itineraries")
      .select("spots")
      .eq("user_id", session.user.id);

    if (!error && data) {
      const inItinerary = data.some((itinerary: any) => {
        const spots = Array.isArray(itinerary.spots) ? itinerary.spots : [];
        return spots.some((spot: any) => spot.id === id);
      });
      setIsInItinerary(inItinerary);
    }
  };

  const handleAddToItinerary = async () => {
    if (!session?.user) {
      toast.error("Please sign in to add spots to your itinerary");
      return;
    }

    if (!spot) return;

    setIsAddingToItinerary(true);

    try {
      // Check if user has an active itinerary
      const { data: existingItineraries, error: fetchError } = await supabase
        .from("itineraries")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingItineraries && existingItineraries.length > 0) {
        // Add to existing itinerary
        const itinerary = existingItineraries[0];
        const currentSpots = Array.isArray(itinerary.spots) ? itinerary.spots : [];
        
        // Check for duplicate
        const isDuplicate = currentSpots.some((s: any) => s.id === spot.id);
        if (isDuplicate) {
          toast.error("This spot is already in your itinerary");
          setIsAddingToItinerary(false);
          return;
        }

        const updatedSpots = [...currentSpots, spot];

        const { error: updateError } = await supabase
          .from("itineraries")
          .update({ spots: updatedSpots as any })
          .eq("id", itinerary.id);

        if (updateError) throw updateError;

        toast.success("Added to your itinerary!");
        setIsInItinerary(true);
      } else {
        // Create new itinerary
        const { error: insertError } = await supabase
          .from("itineraries")
          .insert([{
            user_id: session.user.id,
            name: "My Travel Itinerary",
            spots: [spot] as any,
            selected_categories: spot.category || [],
          }]);

        if (insertError) throw insertError;

        toast.success("Created new itinerary and added spot!");
        setIsInItinerary(true);
      }
    } catch (error: any) {
      console.error("Error adding to itinerary:", error);
      toast.error("Failed to add to itinerary");
    } finally {
      setIsAddingToItinerary(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Nature: "bg-secondary text-secondary-foreground",
      Culture: "bg-accent text-accent-foreground",
      Adventure: "bg-primary text-primary-foreground",
      Food: "bg-orange-500 text-white",
      Beach: "bg-blue-500 text-white",
      Heritage: "bg-purple-500 text-white",
    };
    return colors[category] || "bg-muted";
  };

  const [reviews, setReviews] = useState<Review[]>([]);
const [isReviewsLoading, setIsReviewsLoading] = useState(true);
const [userHasReviewed, setUserHasReviewed] = useState(false);

useEffect(() => {
  if (!spot) return;
  fetchReviews();
}, [spot, reviewRefreshTrigger]);

const fetchReviews = async () => {
  setIsReviewsLoading(true);

  const { data: reviewsData, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("spot_id", spot.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    setIsReviewsLoading(false);
    return;
  }

  const enrichedReviews: Review[] = [];
  for (const review of reviewsData || []) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", review.user_id)
      .single();

    enrichedReviews.push({
      ...review,
      user_name: profile?.full_name || "Anonymous",
    });
  }

  setReviews(enrichedReviews);
  setUserHasReviewed(enrichedReviews.some(r => r.user_id === session?.user?.id));
  setIsReviewsLoading(false);
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

  if (!spot) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <p className="text-center text-muted-foreground">Spot not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <Link to="/explore">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            {spot.image_url && (
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img
                  src={spot.image_url}
                  alt={spot.name}
                  className="w-full h-96 object-cover"
                />
              </div>
            )}

            {/* Details Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl">{spot.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {spot.category.map((cat) => (
                        <Badge key={cat} className={getCategoryColor(cat)}>
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleAddToItinerary}
                    disabled={isAddingToItinerary || isInItinerary}
                    className="gap-2"
                    variant={isInItinerary ? "secondary" : "default"}
                  >
                    {isAddingToItinerary ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : isInItinerary ? (
                      <>
                        <Check className="w-4 h-4" />
                        In Itinerary
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add to Itinerary
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {spot.description && (
                  <p className="text-muted-foreground">{spot.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{spot.location}</span>
                  </div>
                  {spot.municipality && (
                    <div className="text-sm text-muted-foreground ml-7">
                      {spot.municipality}
                    </div>
                  )}
                  {spot.contact_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      <span>{spot.contact_number}</span>
                    </div>
                  )}
                  {spot.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{spot.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="reviews">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reviews">All Reviews</TabsTrigger>
                    <TabsTrigger value="write" disabled={!session}>
                      {session ? "Write Review" : "Login to Review"}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="reviews" className="mt-6">
                    <ReviewList
                      {...({
                        spotId: spot.id,
                        currentUserId: session?.user?.id || null,
                        refreshTrigger: reviewRefreshTrigger,
                        reviews,
                        fetchReviews,
                      } as any)}
                    />
                  </TabsContent>
                  <TabsContent value="write" className="mt-6">
                    {session && (
                      <ReviewForm
                        spotId={spot.id}
                        userId={session.user.id}
                        onReviewSubmitted={() => {
                          setReviewRefreshTrigger((prev) => prev + 1);
                        }}
                        hasUserReviewed={userHasReviewed}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {spot.latitude && spot.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle>Location on Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Map view coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotDetail;