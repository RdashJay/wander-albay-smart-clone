import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Star, Phone, Mail, Wifi, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AddToItineraryDialog } from "@/components/AddToItineraryDialog";
import { Session } from "@supabase/supabase-js";

interface Accommodation {
  id: string;
  name: string;
  description: string;
  location: string;
  municipality: string;
  category: string[];
  image_url: string;
  contact_number: string;
  email: string;
  price_range: string;
  amenities: string[];
  rating: number;
}

interface AccommodationsSectionProps {
  userId?: string;
  filters?: {
    category?: string;
    priceRange?: string;
    municipality?: string;
  };
}

const AccommodationsSection = ({ userId, filters }: AccommodationsSectionProps) => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState<{ id: string; name: string } | null>(null);

  const categories = [
    "All",
    "Luxury",
    "Mid-range",
    "Budget",
    "Resort",
    "Boutique",
    "Beach Resort",
    "Business Hotel"
  ];

  useEffect(() => {
    fetchAccommodations();
  }, [selectedCategory, filters]);

  const fetchAccommodations = async () => {
    try {
      let query = supabase
        .from("accommodations")
        .select("*")
        .order("rating", { ascending: false });

      // Apply filters
      if (filters?.municipality) {
        query = query.ilike("municipality", `%${filters.municipality}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Filter by selected category
        let filtered = data;
        if (selectedCategory !== "All") {
          filtered = data.filter(acc =>
            acc.category?.includes(selectedCategory)
          );
        }

        // Apply price range filter if provided
        if (filters?.priceRange) {
          filtered = filtered.filter(acc =>
            acc.price_range?.toLowerCase().includes(filters.priceRange.toLowerCase())
          );
        }

        setAccommodations(filtered);
      }
    } catch (error) {
      console.error("Error fetching accommodations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-accent" />
          <h2 className="text-3xl font-bold">Accommodations & Hotels 🏨</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-accent" />
          <h2 className="text-3xl font-bold">Accommodations & Hotels 🏨</h2>
        </div>
        <p className="text-muted-foreground">{accommodations.length} places to stay</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Accommodations Grid */}
      {accommodations.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {accommodations.map((accommodation) => (
            <Card
              key={accommodation.id}
              className="group cursor-pointer hover:shadow-xl transition-all overflow-hidden"
              onClick={() => {
                if (userId) {
                  setSelectedAccommodation({ id: accommodation.id, name: accommodation.name });
                  setDialogOpen(true);
                }
              }}
            >
              <div className="relative h-48 overflow-hidden bg-muted">
                {accommodation.image_url ? (
                  <img
                    src={accommodation.image_url}
                    alt={accommodation.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                    <Building2 className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                {accommodation.category && accommodation.category.length > 0 && (
                  <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm">
                    {accommodation.category[0]}
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {accommodation.name}
                  </h3>
                  {userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccommodation({ id: accommodation.id, name: accommodation.name });
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{accommodation.municipality || accommodation.location}</span>
                </div>

                {accommodation.rating > 0 && (
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{accommodation.rating.toFixed(1)}</span>
                  </div>
                )}

                {accommodation.price_range && (
                  <div className="mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {accommodation.price_range}
                    </Badge>
                  </div>
                )}

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {accommodation.description}
                </p>

                {/* Amenities */}
                {accommodation.amenities && accommodation.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {accommodation.amenities.slice(0, 3).map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {amenity === "WiFi" && <Wifi className="w-3 h-3 mr-1" />}
                        {amenity}
                      </Badge>
                    ))}
                    {accommodation.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{accommodation.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  {accommodation.contact_number && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{accommodation.contact_number}</span>
                    </div>
                  )}
                  {accommodation.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{accommodation.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No accommodations found</h3>
            <p className="text-muted-foreground">
              Try selecting a different category or filter.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedAccommodation && userId && (
        <AddToItineraryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          itemId={selectedAccommodation.id}
          itemName={selectedAccommodation.name}
          itemType="accommodation"
          userId={userId}
        />
      )}
    </div>
  );
};

export default AccommodationsSection;
