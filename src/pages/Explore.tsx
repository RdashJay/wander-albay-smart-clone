import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Search, Star, Building2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import AccommodationsSection from "@/components/AccommodationsSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TouristSpot {
  id: string;
  name: string;
  description: string | null;
  location: string;
  municipality: string | null;
  category: string[];
  image_url: string | null;
  rating: number;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
}

const Explore = () => {
  const navigate = useNavigate();
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<TouristSpot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [session, setSession] = useState<Session | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    fetchSpots();
    fetchCategories();
    fetchSubcategories();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const categoriesChannel = supabase
      .channel("categories-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        fetchCategories
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

  useEffect(() => {
    filterSpots();
  }, [searchQuery, selectedCategory, selectedSubcategory, spots]);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredSubcategories([]);
      setSelectedSubcategory("all");
    } else {
      const category = categories.find(c => c.name === selectedCategory);
      if (category) {
        const filtered = subcategories.filter(s => s.category_id === category.id);
        setFilteredSubcategories(filtered);
        setSelectedSubcategory("all");
      }
    }
  }, [selectedCategory, categories, subcategories]);

  const fetchSpots = async () => {
    const { data } = await supabase
      .from("tourist_spots")
      .select("*")
      .order("name");

    if (data) setSpots(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (data) setCategories(data);
  };

  const fetchSubcategories = async () => {
    const { data } = await supabase
      .from("subcategories")
      .select("*")
      .order("name");

    if (data) setSubcategories(data);
  };

  const filterSpots = () => {
    let filtered = spots;

    // Search
    if (searchQuery) {
      filtered = filtered.filter(
        (spot) =>
          spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          spot.municipality?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((spot) =>
        spot.category.some((cat) => cat.toLowerCase().includes(selectedCategory.toLowerCase()))
      );
    }

    // Subcategory filter
    if (selectedSubcategory !== "all") {
      filtered = filtered.filter((spot) =>
        spot.category.some((cat) => cat.toLowerCase().includes(selectedSubcategory.toLowerCase()))
      );
    }

    setFilteredSpots(filtered);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Nature: "bg-secondary text-secondary-foreground",
      NATURE: "bg-secondary text-secondary-foreground",
      Culture: "bg-accent text-accent-foreground",
      CULTURE: "bg-accent text-accent-foreground",
      Adventure: "bg-primary text-primary-foreground",
      ADVENTURE: "bg-primary text-primary-foreground",
      Food: "bg-orange-500 text-white",
      FOOD: "bg-orange-500 text-white",
      Beach: "bg-blue-500 text-white",
      BEACHES: "bg-blue-500 text-white",
      Heritage: "bg-purple-500 text-white",
      HERITAGE: "bg-purple-500 text-white",
      "WILDLIFE / ECO": "bg-green-600 text-white",
      SHOPPING: "bg-pink-600 text-white",
    };
    return colors[category] || "bg-muted";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-12">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explore <span className="text-primary">Albay</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing destinations and places to stay across the province
          </p>
        </div>

        <Tabs defaultValue="destinations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="destinations">
              <MapPin className="w-4 h-4 mr-2" />
              Tourist Destinations
            </TabsTrigger>
            <TabsTrigger value="accommodations">
              <Building2 className="w-4 h-4 mr-2" />
              Hotels & Accommodations
            </TabsTrigger>
          </TabsList>

          {/* DESTINATIONS TAB */}
          <TabsContent value="destinations" className="space-y-8">
            {/* Search & Filter */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-[1fr_250px_250px] gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search destinations or municipalities..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* CATEGORY DROPDOWN */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder="All Categories" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Categories ({spots.length})
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* SUBCATEGORY DROPDOWN */}
                {selectedCategory !== "all" && filteredSubcategories.length > 0 && (
                  <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        <SelectValue placeholder="All Subcategories" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Subcategories
                      </SelectItem>
                      {filteredSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.name}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Active Filter Badges */}
              {(selectedCategory !== "all" || selectedSubcategory !== "all") && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Filtered by:</span>
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" className="gap-2">
                      {categories.find(c => c.name === selectedCategory)?.icon} {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedSubcategory !== "all" && (
                    <Badge variant="secondary" className="gap-2">
                      {selectedSubcategory}
                      <button
                        onClick={() => setSelectedSubcategory("all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    ({filteredSpots.length} {filteredSpots.length === 1 ? 'spot' : 'spots'})
                  </span>
                </div>
              )}
            </div>

            {/* SPOTS GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpots.length > 0 ? (
                filteredSpots.map((spot) => (
                  <Card
                    key={spot.id}
                    className="overflow-hidden hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                    onClick={() => navigate(`/spot/${spot.id}`)}
                  >
                    {spot.image_url && (
                      <div className="h-48 overflow-hidden bg-muted">
                        <img
                          src={spot.image_url}
                          alt={spot.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <CardHeader>
                      <CardTitle className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2">{spot.name}</span>
                        {spot.rating > 0 && (
                          <div className="flex items-center gap-1 text-yellow-500 text-sm">
                            <Star className="w-4 h-4 fill-current" />
                            {spot.rating}
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      {spot.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {spot.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{spot.location}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {spot.category.map((cat) => (
                          <Badge
                            key={cat}
                            className={getCategoryColor(cat)}
                            variant="secondary"
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-lg text-muted-foreground">
                  No destinations found
                </div>
              )}
            </div>
          </TabsContent>

          {/* ACCOMMODATIONS TAB */}
          <TabsContent value="accommodations">
            <AccommodationsSection userId={session?.user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Explore;