import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Navigation, MapPin, Clock, Gauge, Car, PersonStanding, Bike, Loader2 } from "lucide-react";

const userLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

type TravelMode = "driving" | "walking" | "cycling";

interface RouteData {
  distance: number;
  duration: number;
  coordinates: [number, number][];
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
      easeLinearity: 0.5,
    });
  }, [center, zoom, map]);

  return null;
}

const RoutePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const destLat = parseFloat(searchParams.get("lat") || "0");
  const destLng = parseFloat(searchParams.get("lng") || "0");
  const destName = searchParams.get("name") || "Destination";
  const destImage = searchParams.get("image") || "";

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [mapCenter, setMapCenter] = useState<[number, number]>([destLat, destLng]);
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchRoute();
    }
  }, [userLocation, travelMode]);

  const getUserLocation = () => {
    setIsLoadingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(userPos);
          setIsLoadingLocation(false);
          
          // Center map between user and destination
          const centerLat = (userPos[0] + destLat) / 2;
          const centerLng = (userPos[1] + destLng) / 2;
          setMapCenter([centerLat, centerLng]);
          setMapZoom(11);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location. Please enable location services.");
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
    }
  };

  const fetchRoute = async () => {
    if (!userLocation) return;

    setIsLoadingRoute(true);

    const profile = travelMode === "driving" ? "driving" : travelMode === "cycling" ? "cycling" : "foot";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${userLocation[1]},${userLocation[0]};${destLng},${destLat}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );

        setRouteData({
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
          coordinates,
        });

        toast.success("Route calculated successfully!");
      } else {
        toast.error("Unable to calculate route");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      toast.error("Failed to fetch route");
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const travelModes = [
    { mode: "driving" as TravelMode, icon: Car, label: "Driving" },
    { mode: "walking" as TravelMode, icon: PersonStanding, label: "Walking" },
    { mode: "cycling" as TravelMode, icon: Bike, label: "Cycling" },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-background border-b p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Navigation</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="md:w-96 bg-background border-r overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Destination Card */}
            <Card>
              <CardContent className="p-4">
                {destImage && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={destImage}
                      alt={destName}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}
                <h2 className="text-xl font-bold mb-2">{destName}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Destination</span>
                </div>
              </CardContent>
            </Card>

            {/* Travel Mode Selection */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Travel Mode
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {travelModes.map(({ mode, icon: Icon, label }) => (
                  <Button
                    key={mode}
                    variant={travelMode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTravelMode(mode)}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    disabled={isLoadingRoute || isLoadingLocation}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Route Info */}
            {isLoadingLocation ? (
              <Card>
                <CardContent className="p-6 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2">Getting your location...</span>
                </CardContent>
              </Card>
            ) : isLoadingRoute ? (
              <Card>
                <CardContent className="p-6 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2">Calculating route...</span>
                </CardContent>
              </Card>
            ) : routeData ? (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Distance</span>
                    </div>
                    <Badge variant="secondary" className="text-base">
                      {routeData.distance.toFixed(2)} km
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Duration</span>
                    </div>
                    <Badge variant="secondary" className="text-base">
                      {Math.round(routeData.duration)} min
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : userLocation ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Unable to calculate route. Please try again.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Location access is required to calculate routes
                  </p>
                  <Button onClick={getUserLocation} size="sm" className="gap-2">
                    <Navigation className="w-4 h-4" />
                    Enable Location
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Directions */}
            {userLocation && (
              <div>
                <h3 className="font-semibold mb-3">Route Points</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Your Location</p>
                      <p className="text-xs text-muted-foreground">
                        {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="w-3 h-3 rounded-full bg-red-500 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{destName}</p>
                      <p className="text-xs text-muted-foreground">
                        {destLat.toFixed(4)}, {destLng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController center={mapCenter} zoom={mapZoom} />

            {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon} />
            )}

            <Marker position={[destLat, destLng]} icon={destinationIcon} />

            {routeData && (
              <Polyline
                positions={routeData.coordinates}
                color="#3b82f6"
                weight={5}
                opacity={0.7}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default RoutePage;
