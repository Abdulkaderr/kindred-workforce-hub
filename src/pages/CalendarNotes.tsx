import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  format,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO,
} from "date-fns";

type Profile = { user_id: string; full_name: string | null; email: string | null };
type ProjectRef = { id: string; name: string };

type Note = {
  id: string;
  title: string;
  description: string | null;
  note_date: string;
  note_end_date: string | null;
  category: string;
  color: string;
  project_id: string | null;
  created_by: string;
};

type NoteEmployee = { note_id: string; user_id: string };

const CATEGORIES = ["general", "project", "meeting", "reminder"];
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

type ViewMode = "month" | "week" | "day";

export default function CalendarNotesPage() {
  const { role, user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = role === "admin";

  const [notes, setNotes] = useState<Note[]>([]);
  const [noteEmployees, setNoteEmployees] = useState<Record<string, string[]>>({});
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<ProjectRef[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formColor, setFormColor] = useState("#3b82f6");
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formEmployees, setFormEmployees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Detail popover
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: n }, { data: ne }, { data: emp }, { data: proj }] = await Promise.all([
      supabase.from("notes").select("*").order("note_date", { ascending: true }),
      supabase.from("note_employees").select("note_id, user_id"),
      supabase.from("profiles").select("user_id, full_name, email"),
      supabase.from("projects").select("id, name"),
    ]);
    setNotes((n as Note[]) || []);
    const map: Record<string, string[]> = {};
    ((ne as any[]) || []).forEach((r: any) => {
      if (!map[r.note_id]) map[r.note_id] = [];
      map[r.note_id].push(r.user_id);
    });
    setNoteEmployees(map);
    setEmployees(emp || []);
    setProjects((proj as ProjectRef[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Navigation
  const goNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };
  const goPrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  // Calendar days
  const calendarDays = useMemo(() => {
    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    return [currentDate];
  }, [viewMode, currentDate]);

  const getNotesForDay = (day: Date) => {
    return notes.filter((n) => {
      const noteStart = parseISO(n.note_date);
      if (n.note_end_date) {
        const noteEnd = parseISO(n.note_end_date);
        return day >= new Date(noteStart.toDateString()) && day <= new Date(noteEnd.toDateString());
      }
      return isSameDay(noteStart, day);
    });
  };

  const headerLabel = useMemo(() => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  }, [viewMode, currentDate]);

  // CRUD
  const openAdd = (day?: Date) => {
    setEditing(null);
    setFormTitle(""); setFormDesc("");
    setFormDate(day ? format(day, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setFormEndDate("");
    setFormCategory("general"); setFormColor("#3b82f6");
    setFormProjectId(""); setFormEmployees([]);
    setModalOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setFormTitle(note.title);
    setFormDesc(note.description || "");
    setFormDate(note.note_date.slice(0, 16));
    setFormEndDate(note.note_end_date ? note.note_end_date.slice(0, 16) : "");
    setFormCategory(note.category);
    setFormColor(note.color);
    setFormProjectId(note.project_id || "");
    setFormEmployees(noteEmployees[note.id] || []);
    setModalOpen(true);
    setDetailOpen(false);
  };

  const handleSave = async () => {
    if (!formTitle || !formDate) return;
    if (formEndDate && formDate >= formEndDate) {
      toast({ title: t("calendar.invalidDates"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      title: formTitle,
      description: formDesc || null,
      note_date: new Date(formDate).toISOString(),
      note_end_date: formEndDate ? new Date(formEndDate).toISOString() : null,
      category: formCategory,
      color: formColor,
      project_id: formProjectId || null,
      created_by: user?.id,
    };

    let noteId: string | null = null;

    if (editing) {
      const { error } = await supabase.from("notes").update(payload).eq("id", editing.id);
      if (error) { toast({ title: t("calendar.saveFailed"), description: error.message, variant: "destructive" }); setSaving(false); return; }
      noteId = editing.id;
    } else {
      const { data, error } = await supabase.from("notes").insert(payload).select("id").single();
      if (error || !data) { toast({ title: t("calendar.saveFailed"), description: error?.message, variant: "destructive" }); setSaving(false); return; }
      noteId = data.id;
    }

    // Sync employees
    if (noteId) {
      await supabase.from("note_employees").delete().eq("note_id", noteId);
      if (formEmployees.length > 0) {
        const rows = formEmployees.map((uid) => ({ note_id: noteId!, user_id: uid }));
        await supabase.from("note_employees").insert(rows);
      }
    }

    toast({ title: editing ? t("calendar.noteUpdated") : t("calendar.noteAdded") });
    setSaving(false); setModalOpen(false); fetchData();
  };

  const handleDelete = async (note: Note) => {
    if (!confirm(t("calendar.deleteConfirm", { title: note.title }))) return;
    const { error } = await supabase.from("notes").delete().eq("id", note.id);
    if (error) { toast({ title: t("calendar.deleteFailed"), variant: "destructive" }); return; }
    toast({ title: t("calendar.noteDeleted") });
    setDetailOpen(false);
    fetchData();
  };

  const toggleEmployee = (uid: string) => {
    setFormEmployees((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  };

  const getProjectName = (id: string | null) => projects.find((p) => p.id === id)?.name || "";
  const getEmployeeName = (uid: string) => {
    const emp = employees.find((e) => e.user_id === uid);
    return emp?.full_name || emp?.email || uid.slice(0, 8);
  };

  const openNoteDetail = (note: Note) => {
    setSelectedNote(note);
    setDetailOpen(true);
  };

  const weekDayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">{t("calendar.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("calendar.subtitle")}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => openAdd()}>
            <Plus className="h-4 w-4 mr-1.5" /> {t("calendar.addNote")}
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToday}>{t("calendar.today")}</Button>
          <Button variant="outline" size="sm" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
          <span className="text-lg font-semibold ml-2">{headerLabel}</span>
        </div>
        <div className="flex gap-1">
          {(["month", "week", "day"] as ViewMode[]).map((m) => (
            <Button key={m} variant={viewMode === m ? "default" : "outline"} size="sm" onClick={() => setViewMode(m)}>
              {t(`calendar.${m}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-10">{t("loading")}</p>
      ) : viewMode === "month" ? (
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDayHeaders.map((d) => (
              <div key={d} className="px-2 py-2 text-xs font-semibold text-muted-foreground text-center border-b bg-muted/30">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayNotes = getNotesForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r p-1 cursor-pointer transition-colors hover:bg-accent/5 ${
                    !inMonth ? "bg-muted/10 opacity-50" : ""
                  } ${isToday(day) ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""}`}
                  onClick={() => isAdmin && openAdd(day)}
                >
                  <div className={`text-xs font-medium mb-0.5 px-1 ${isToday(day) ? "text-primary font-bold" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayNotes.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate text-white cursor-pointer"
                        style={{ backgroundColor: n.color }}
                        onClick={(e) => { e.stopPropagation(); openNoteDetail(n); }}
                      >
                        {n.title}
                      </div>
                    ))}
                    {dayNotes.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{dayNotes.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === "week" ? (
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayNotes = getNotesForDay(day);
              return (
                <div key={i} className={`border-r last:border-r-0 ${isToday(day) ? "bg-primary/5" : ""}`}>
                  <div className={`text-center py-2 border-b text-sm font-medium ${isToday(day) ? "text-primary font-bold" : "text-foreground"}`}>
                    {format(day, "EEE d")}
                  </div>
                  <div
                    className="min-h-[300px] p-1 space-y-1 cursor-pointer hover:bg-accent/5"
                    onClick={() => isAdmin && openAdd(day)}
                  >
                    {dayNotes.map((n) => (
                      <div
                        key={n.id}
                        className="text-xs px-2 py-1 rounded text-white cursor-pointer truncate"
                        style={{ backgroundColor: n.color }}
                        onClick={(e) => { e.stopPropagation(); openNoteDetail(n); }}
                      >
                        <div className="font-medium">{n.title}</div>
                        <div className="opacity-80">{format(parseISO(n.note_date), "HH:mm")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Day view */
        <div className="rounded-lg border bg-card shadow-sm p-4">
          <div className="space-y-2">
            {getNotesForDay(currentDate).length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">{t("calendar.noNotes")}</p>
            ) : (
              getNotesForDay(currentDate).map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/5"
                  onClick={() => openNoteDetail(n)}
                >
                  <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: n.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{n.title}</div>
                    <div className="text-sm text-muted-foreground">{format(parseISO(n.note_date), "HH:mm")}{n.note_end_date ? ` – ${format(parseISO(n.note_end_date), "HH:mm")}` : ""}</div>
                    {n.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.description}</p>}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">{n.category}</Badge>
                      {n.project_id && <Badge variant="outline" className="text-[10px]">{getProjectName(n.project_id)}</Badge>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Note detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNote && <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedNote.color }} />}
              {selectedNote?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedNote && format(parseISO(selectedNote.note_date), "PPPp")}
              {selectedNote?.note_end_date && ` – ${format(parseISO(selectedNote.note_end_date), "PPPp")}`}
            </DialogDescription>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-3">
              {selectedNote.description && <p className="text-sm">{selectedNote.description}</p>}
              <div className="flex gap-1 flex-wrap">
                <Badge variant="secondary">{selectedNote.category}</Badge>
                {selectedNote.project_id && <Badge variant="outline">{getProjectName(selectedNote.project_id)}</Badge>}
              </div>
              {(noteEmployees[selectedNote.id] || []).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("calendar.linkedEmployees")}</p>
                  <div className="flex flex-wrap gap-1">
                    {(noteEmployees[selectedNote.id] || []).map((uid) => (
                      <Badge key={uid} variant="outline" className="text-xs">{getEmployeeName(uid)}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {isAdmin && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => openEdit(selectedNote)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> {t("calendar.edit")}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(selectedNote)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> {t("calendar.delete")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit note dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("calendar.editNote") : t("calendar.addNote")}</DialogTitle>
            <DialogDescription>{editing ? t("calendar.editNoteDesc") : t("calendar.addNoteDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("calendar.noteTitle")}</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={t("calendar.noteTitlePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("calendar.description")}</Label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder={t("calendar.descriptionPlaceholder")} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("calendar.startDateTime")}</Label>
                <Input type="datetime-local" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("calendar.endDateTime")}</Label>
                <Input type="datetime-local" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("calendar.category")}</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{t(`calendar.cat_${c}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("calendar.project")}</Label>
                <Select value={formProjectId} onValueChange={setFormProjectId}>
                  <SelectTrigger><SelectValue placeholder={t("calendar.noProject")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("calendar.noProject")}</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("calendar.color")}</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${formColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setFormColor(c)}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("calendar.linkedEmployees")} ({formEmployees.length})</Label>
              <div className="border rounded-md">
                <ScrollArea className="h-36">
                  <div className="p-2 space-y-1">
                    {employees.map((emp) => (
                      <label key={emp.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/10 cursor-pointer text-sm">
                        <Checkbox
                          checked={formEmployees.includes(emp.user_id)}
                          onCheckedChange={() => toggleEmployee(emp.user_id)}
                        />
                        <span>{emp.full_name || emp.email || emp.user_id.slice(0, 8)}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={saving || !formTitle || !formDate}>
              {saving ? t("calendar.saving") : editing ? t("calendar.saveChanges") : t("calendar.addNote")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
