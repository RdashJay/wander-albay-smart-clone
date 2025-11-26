import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Plus, List } from "lucide-react";

interface Itinerary {
  id: string;
  name: string;
  spots: any;
}

interface AddToItineraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  itemType: "spot" | "accommodation";
  userId: string;
}

export const AddToItineraryDialog = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  itemType,
  userId,
}: AddToItineraryDialogProps) => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<string>("");
  const [newItineraryName, setNewItineraryName] = useState("");
  const [mode, setMode] = useState<"select" | "create">("select");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchItineraries();
    }
  }, [open, userId]);

  const fetchItineraries = async () => {
    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching itineraries:", error);
      return;
    }

    setItineraries(data || []);
    if (data && data.length > 0) {
      setSelectedItinerary(data[0].id);
      setMode("select");
    } else {
      setMode("create");
    }
  };

  const handleAddToItinerary = async () => {
    setLoading(true);
    try {
      let itineraryId = selectedItinerary;

      // Create new itinerary if needed
      if (mode === "create") {
        if (!newItineraryName.trim()) {
          toast.error("Please enter an itinerary name");
          setLoading(false);
          return;
        }

        const { data: newItinerary, error: createError } = await supabase
          .from("itineraries")
          .insert({
            user_id: userId,
            name: newItineraryName,
            spots: [],
          })
          .select()
          .single();

        if (createError) throw createError;
        itineraryId = newItinerary.id;
      }

      // Fetch current itinerary
      const { data: currentItinerary, error: fetchError } = await supabase
        .from("itineraries")
        .select("spots")
        .eq("id", itineraryId)
        .single();

      if (fetchError) throw fetchError;

      // Add item to spots array
      const currentSpots = Array.isArray(currentItinerary.spots) ? currentItinerary.spots : [];
      const itemData = {
        id: itemId,
        name: itemName,
        type: itemType,
        added_at: new Date().toISOString(),
      };

      // Check if item already exists
      const exists = currentSpots.some((spot: any) => spot.id === itemId);
      if (exists) {
        toast.info(`${itemName} is already in this itinerary`);
        onOpenChange(false);
        setLoading(false);
        return;
      }

      const updatedSpots = [...currentSpots, itemData];

      // Update itinerary
      const { error: updateError } = await supabase
        .from("itineraries")
        .update({ spots: updatedSpots })
        .eq("id", itineraryId);

      if (updateError) throw updateError;

      toast.success(`Added ${itemName} to itinerary!`);
      onOpenChange(false);
      setNewItineraryName("");
    } catch (error) {
      console.error("Error adding to itinerary:", error);
      toast.error("Failed to add to itinerary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Itinerary</DialogTitle>
          <DialogDescription>
            Add {itemName} to one of your itineraries
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {itineraries.length > 0 && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={mode === "select" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("select")}
                  className="flex-1"
                >
                  <List className="w-4 h-4 mr-2" />
                  Select Existing
                </Button>
                <Button
                  variant={mode === "create" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("create")}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>

              {mode === "select" && (
                <RadioGroup
                  value={selectedItinerary}
                  onValueChange={setSelectedItinerary}
                  className="space-y-2"
                >
                  {itineraries.map((itinerary) => (
                    <div
                      key={itinerary.id}
                      className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value={itinerary.id} id={itinerary.id} />
                      <Label
                        htmlFor={itinerary.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{itinerary.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {itinerary.spots?.length || 0} items
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="itinerary-name">New Itinerary Name</Label>
              <Input
                id="itinerary-name"
                placeholder="e.g., Weekend Getaway"
                value={newItineraryName}
                onChange={(e) => setNewItineraryName(e.target.value)}
              />
            </div>
          )}

          <Button
            onClick={handleAddToItinerary}
            disabled={loading || (mode === "select" && !selectedItinerary)}
            className="w-full"
          >
            {loading ? "Adding..." : "Add to Itinerary"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
