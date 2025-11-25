import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, RefreshCw } from "lucide-react";

const EmailVerification = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Get email from session or localStorage
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
        if (session.user.email_confirmed_at) {
          navigate("/");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Email not found. Please sign up again.");
      navigate("/auth");
      return;
    }

    // Rate limiting - prevent spam
    const lastResend = localStorage.getItem('lastResendTime');
    if (lastResend) {
      const timeDiff = Date.now() - parseInt(lastResend);
      if (timeDiff < 60000) { // 1 minute
        toast.error("Please wait before requesting another email");
        return;
      }
    }

    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    setIsResending(false);

    if (error) {
      toast.error(error.message);
    } else {
      localStorage.setItem('lastResendTime', Date.now().toString());
      toast.success("Verification email sent! Check your inbox.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-4 bg-gradient-to-br from-primary to-accent rounded-full w-20 h-20 flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription className="text-base">
            📩 We've sent a verification link to:
            <br />
            <span className="font-semibold text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground text-center">
                Please click the verification link in your email to confirm your account.
              </p>
            </div>
          </div>

          <div className="space-y-3">

            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full"
            >
              Log Out
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Didn't receive the email? Check your spam folder or click resend above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;
