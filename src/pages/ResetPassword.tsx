import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if we have a recovery token in the URL hash
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setValid(true);
    } else {
      // Also check for access_token which means the session was restored
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setValid(true);
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t("login.error"),
        description: t("login.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({
        title: t("login.passwordUpdated"),
        description: t("login.passwordUpdatedDesc"),
      });
      navigate("/login", { replace: true });
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

  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="w-full max-w-[420px] text-center space-y-6">
          <div className="flex items-center gap-2.5 justify-center">
            <div className="rounded-xl bg-primary p-2">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">WorkforceOS</span>
          </div>
          <p className="text-muted-foreground text-sm">{t("login.invalidResetLink")}</p>
          <Button variant="outline" className="rounded-xl" onClick={() => navigate("/forgot-password")}>
            {t("login.forgotPasswordTitle")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-8">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary p-2 border border-primary/20">
            <Clock className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">WorkforceOS</span>
        </div>

        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-5">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {t("login.resetPasswordTitle")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            {t("login.resetPasswordDesc")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">{t("login.newPassword")}</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">{t("login.confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 rounded-xl bg-muted/50 border-border/50 px-4 text-sm transition-all focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-sm font-semibold gap-2 shadow-lg shadow-primary/20"
            disabled={loading || password.length < 6}
          >
            {loading ? t("login.pleaseWait") : t("login.updatePassword")}
          </Button>
        </form>
      </div>
    </div>
  );
}
