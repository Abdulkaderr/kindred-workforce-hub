import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Eye, EyeOff, ArrowRight, UserPlus, LogIn as LogInIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { session } = useAuth();

  // Redirect when session is established (after login or if already logged in)
  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: t("login.accountCreated"),
          description: t("login.checkEmail"),
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/", { replace: true });
      }
    } catch (error: any) {
      toast({
        title: t("login.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel - branding (desktop) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-2.5 border border-white/20">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <span className="text-xl font-bold text-white">WorkforceOS</span>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              {t("login.brandDescription").split("—")[0]}
            </h1>
            <p className="text-white/60 text-base leading-relaxed">
              — {t("login.brandDescription").split("—")[1]?.trim() || "all in one platform."}
            </p>
          </div>

          <div />
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full lg:w-[55%] items-center justify-center px-5 py-8">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="rounded-xl bg-primary p-2 border border-primary/20">
                <Clock className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">WorkforceOS</span>
            </div>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {isSignUp ? t("login.createAccount") : t("login.welcomeBack")}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              {isSignUp ? t("login.signUpToStart") : t("login.signInToAccount")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">{t("login.fullName")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-12 rounded-xl bg-muted/50 border-border/50 px-4 text-sm transition-all focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-muted/50 border-border/50 px-4 text-sm transition-all focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">{t("login.password")}</Label>
                {!isSignUp && (
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {t("login.forgotPassword")}
                  </Link>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 rounded-xl bg-muted/50 border-border/50 px-4 pr-12 text-sm transition-all focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-sm font-semibold gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              disabled={loading}
            >
              {loading ? (
                t("login.pleaseWait")
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  {t("login.createAccountBtn")}
                </>
              ) : (
                <>
                  <LogInIcon className="h-4 w-4" />
                  {t("login.signIn")}
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
          </div>

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? t("login.alreadyHaveAccount") : t("login.dontHaveAccount")}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
            >
              {isSignUp ? t("login.signInLink") : t("login.signUpLink")}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
