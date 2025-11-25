import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Spot {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  municipality: string | null;
}

interface ItineraryMapProps {
  spots: Spot[];
}

const ItineraryMap = ({ spots }: ItineraryMapProps) => {
  const [center, setCenter] = useState<[number, number]>([13.1391, 123.7437]); // Albay center
  const [validSpots, setValidSpots] = useState<Spot[]>([]);

  useEffect(() => {
    // Filter spots with valid coordinates
    const spotsWithCoords = spots.filter(
      (spot) => spot.latitude !== null && spot.longitude !== null
    );
    setValidSpots(spotsWithCoords);

    // If we have spots, center on the first one
    if (spotsWithCoords.length > 0 && spotsWithCoords[0].latitude && spotsWithCoords[0].longitude) {
      setCenter([spotsWithCoords[0].latitude, spotsWithCoords[0].longitude]);
    }
  }, [spots]);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border shadow-md">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validSpots.map((spot) => (
          spot.latitude && spot.longitude && (
            <Marker
              key={spot.id}
              position={[spot.latitude, spot.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-base mb-1">{spot.name}</h3>
                  {spot.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                      {spot.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    📍 {spot.location}
                  </p>
                  {spot.municipality && (
                    <p className="text-xs text-muted-foreground">
                      {spot.municipality}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};

export default ItineraryMap;
