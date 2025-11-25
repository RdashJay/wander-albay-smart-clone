import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

const Verified = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Check if email is confirmed
          if (session.user.email_confirmed_at) {
            setIsVerified(true);
          } else {
            setIsVerified(false);
          }
        }
      } catch (error) {
        console.error("Error checking verification:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkVerification();
  }, []);

  const handleContinue = () => {
    navigate("/");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-card/95">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Checking verification status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full w-20 h-20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">
            {isVerified ? "Email Verified!" : "Verification Complete"}
          </CardTitle>
          <CardDescription className="text-base">
            {isVerified 
              ? "Your email has been successfully verified. You can now access all features of Wanderer."
              : "Your verification is being processed. You can now log in to your account."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button onClick={handleContinue} className="w-full" size="lg">
            Continue to Wanderer
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Ready to start exploring?
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verified;
