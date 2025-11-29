import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/app-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash from the URL - could be either hashed_token or access_token format
        const hash = window.location.hash.substring(1);
        
        if (!hash) {
          setErrorMessage('Invalid authentication link');
          setStatus('error');
          return;
        }

        // Check if it's a hashed_token (from magic invite) or access_token format
        const hashParams = new URLSearchParams(hash);
        const hashedToken = hashParams.get('access_token') || hash; // If no params, treat whole hash as token
        
        // Verify the token and establish session
        const { data, error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: hashedToken,
          type: 'magiclink'
        });

        if (sessionError || !data.session) {
          console.error('Session error:', sessionError);
          setErrorMessage('Invalid or expired authentication link');
          setStatus('error');
          return;
        }

        console.log('Session established for user:', data.session.user.email);

        // Check if user needs to change password
        const { data: profile } = await supabase
          .from('profiles')
          .select('must_change_password')
          .eq('id', data.session.user.id)
          .single();

        // Get user's household
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('household_id')
          .eq('user_id', data.session.user.id)
          .limit(1)
          .maybeSingle();

        setStatus('success');

        // Redirect based on user state
        setTimeout(() => {
          if (profile?.must_change_password) {
            navigate('/change-password');
          } else if (userRole?.household_id) {
            navigate(`/family/${userRole.household_id}`);
          } else {
            navigate('/auth');
          }
        }, 1500);

      } catch (error: any) {
        console.error('Auth callback error:', error);
        setErrorMessage(error.message || 'An unexpected error occurred');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-15"
        style={{ backgroundImage: `url('/src/assets/dashboard-bg.png')` }}
      />
      <Card className="w-full max-w-md mx-4 bg-card/80 backdrop-blur-md border-border/50 relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
            {status === 'loading' && 'Setting up your account...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we set up your account'}
            {status === 'success' && 'Account setup complete. Redirecting...'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        {status === 'error' && (
          <CardContent>
            <Button
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Return to Sign In
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
