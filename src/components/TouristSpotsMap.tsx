import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

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
}

const TouristSpotsMap = () => {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpots();
    getUserLocation();

    // Real-time updates
    const channel = supabase
      .channel('tourist-spots-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tourist_spots' },
        () => {
          fetchSpots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSpots = async () => {
    const { data, error } = await supabase
      .from("tourist_spots")
      .select("*")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (!error && data) {
      setSpots(data);
    }
  };

  const getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        console.log("Location access denied");
      }
    );
  };

  const handleNavigate = (spot: TouristSpot) => {
    if (spot.latitude && spot.longitude) {
      navigate(`/map?lat=${spot.latitude}&lng=${spot.longitude}&name=${encodeURIComponent(spot.name)}`);
    }
  };

  return (
    <MapContainer
      center={userLocation || [13.143, 123.735]}
      zoom={10}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {userLocation && (
        <Marker position={userLocation} icon={markerIcon}>
          <Popup>
            <div className="text-center py-2">
              <strong className="text-primary">Your Location</strong>
            </div>
          </Popup>
        </Marker>
      )}

      {spots.map((spot) => {
        if (!spot.latitude || !spot.longitude) return null;
        
        return (
          <Marker
            key={spot.id}
            position={[spot.latitude, spot.longitude]}
            icon={markerIcon}
          >
            <Popup maxWidth={300}>
              <div className="space-y-3 py-2">
                {spot.image_url && (
                  <img
                    src={spot.image_url}
                    alt={spot.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                
                <div>
                  <h3 className="font-bold text-lg mb-1">{spot.name}</h3>
                  
                  {spot.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {spot.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{spot.location}</span>
                  </div>

                  {spot.category && spot.category.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {spot.category.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/spot/${spot.id}`)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNavigate(spot)}
                      className="gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      Navigate
                    </Button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default TouristSpotsMap;
