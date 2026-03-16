import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Shield, Bell, Lock, Globe, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { supported, permission, enabled, enable, disable } = useNotifications();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleNotificationToggle = async () => {
    if (enabled) {
      disable();
      toast({ title: t("settings.notificationsDisabled") });
    } else {
      if (!supported) {
        toast({ title: t("settings.notSupported"), variant: "destructive" });
        return;
      }
      const success = await enable();
      if (success) {
        toast({ title: t("settings.notificationsEnabled") });
      } else {
        toast({ title: t("settings.permissionDenied"), variant: "destructive" });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("settings.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {/* Language Selector */}
        <div className="flex items-center justify-between rounded-md border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2.5">
              <Languages className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("settings.language")}</h3>
              <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
            </div>
          </div>
          <Select value={i18n.language?.startsWith("nl") ? "nl" : "en"} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("settings.english")}</SelectItem>
              <SelectItem value="nl">{t("settings.dutch")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Push Notifications Toggle */}
        <div className="flex items-center justify-between rounded-md border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2.5">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("settings.pushNotifications")}</h3>
              <p className="text-xs text-muted-foreground">{t("settings.pushNotificationsDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${enabled ? "text-success" : "text-muted-foreground"}`}>
              {enabled ? t("settings.enabled") : t("settings.disabled")}
            </span>
            <Switch checked={enabled} onCheckedChange={handleNotificationToggle} />
          </div>
        </div>

        {/* Other settings */}
        {[
          { icon: Shield, title: t("settings.security"), desc: t("settings.securityDesc") },
          { icon: Lock, title: t("settings.accessControl"), desc: t("settings.accessControlDesc") },
          { icon: Globe, title: t("settings.general"), desc: t("settings.generalDesc") },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2.5">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{t("configure")}</Button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
