import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import TouristSpotsMap from "@/components/TouristSpotsMap";

const SpotsMapPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-12">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Tourist Spots <span className="text-primary">Map</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore all tourist destinations across Albay with images and real-time updates
          </p>
        </div>

        <div className="h-[600px]">
          <Card className="overflow-hidden h-full">
            <TouristSpotsMap />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SpotsMapPage;
