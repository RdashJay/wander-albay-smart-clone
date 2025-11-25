import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Plane,
  User,
  LogOut,
  Map,
  Menu,
  X,
  Shield,
  Cloud,
  PhoneCall,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Alert } from "@/components/ui/alert";

/* ------------------ WEATHER DIALOG COMPONENT ------------------ */
const WeatherDialog = () => {
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);

  return (
    <Dialog open={isWeatherOpen} onOpenChange={setIsWeatherOpen}>
      <DialogTrigger asChild>
        <button
          className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
          onClick={() => setIsWeatherOpen(!isWeatherOpen)}
        >
          <Cloud className="w-4 h-4" />
          Weather
        </button>
      </DialogTrigger>

      {/* ✅ Closes automatically on outside click or Esc key */}
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Current Weather</DialogTitle>
        </VisuallyHidden>
        <Alert />
      </DialogContent>
    </Dialog>
  );
};
/* ------------------------------------------------------------- */

const Navbar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdminRole(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) console.error("Error checking admin role:", error);

    const hasAdmin = data?.some((role) => role.role === "admin");
    setIsAdmin(hasAdmin || false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* === LEFT SIDE: Logo === */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Wanderer
          </span>
        </Link>

        {/* === CENTER LINKS === */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/explore"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Explore
            </Link>

            {/* ✅ WEATHER BUTTON HERE */}
            <WeatherDialog />

            {session && (
              <>
                <Link
                  to="/my-itinerary"
                  className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Map className="w-4 h-4" />
                  My Itineraries
                </Link>
              </>
            )}

            <Link
              to="/map"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Map className="w-4 h-4" />
              Navigate
            </Link>

            <Link
              to="/spots-map"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Map className="w-4 h-4" />
              Spots Map
            </Link>
          </div>

          {/* ✅ EMERGENCY HOTLINE BUTTON */}
          <Link
            to="/emergency-hotlines"
            className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
          >
            <PhoneCall className="w-4 h-4" />
            Emergency
          </Link>

          {/* === NOTIFICATION BELL === */}
          {session && <NotificationBell />}
          
          {/* === THEME TOGGLE === */}
          <ThemeToggle />

          {/* === RIGHT SIDE USER MENU === */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      Dashboard
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")} className="hidden md:flex">
                Get Started
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* === MOBILE MENU === */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <div className="container py-4 space-y-3">
            <Link
              to="/explore"
              className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Explore
            </Link>

            {/* ✅ WEATHER button inside mobile menu too */}
            <WeatherDialog />

            {session && (
              <>
                <Link
                  to="/my-itinerary"
                  className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Map className="w-4 h-4 inline mr-2" />
                  My Itineraries
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Admin Panel
                  </Link>
                )}
              </>
            )}

            <Link
              to="/map"
              className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              <Map className="w-4 h-4 inline mr-2" />
              Map
            </Link>

            {/* ✅ EMERGENCY HOTLINE BUTTON */}
            <Link
              to="/emergency-hotlines"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <PhoneCall className="w-4 h-4" />
              Emergency
            </Link>

            {session && (
              <Button onClick={handleLogout} variant="outline" className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            )}
            {!session && (
              <Button onClick={() => navigate("/auth")} className="w-full">
                Get Started
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
