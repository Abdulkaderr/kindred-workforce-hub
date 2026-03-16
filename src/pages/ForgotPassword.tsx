import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, ArrowLeft, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({
        title: t("login.resetLinkSent"),
        description: t("login.resetLinkSentDesc"),
      });
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
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-8">
      <div className="w-full max-w-[420px] space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary p-2 border border-primary/20">
            <Clock className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">WorkforceOS</span>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mx-auto">
              <Mail className="h-8 w-8 text-success" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">{t("login.resetLinkSent")}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{t("login.resetLinkSentDesc")}</p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("login.backToLogin")}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {t("login.forgotPasswordTitle")}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                {t("login.forgotPasswordDesc")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-sm font-semibold gap-2 shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? t("login.pleaseWait") : t("login.sendResetLink")}
              </Button>
            </form>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("login.backToLogin")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
