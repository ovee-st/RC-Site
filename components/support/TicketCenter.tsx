"use client";

import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileUp,
  Inbox,
  Loader2,
  MessageSquareText,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  StickyNote,
  UserPlus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSupportRealtime } from "@/hooks/useSupportRealtime";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import {
  canEditTicket,
  demoSupportTickets,
  demoTicketMessages,
  formatTicketStatus,
  getTicketTone,
  normalizeSupportRole,
  ticketPriorities,
  ticketStatuses
} from "@/lib/support";
import { useSupportStore } from "@/store/useSupportStore";
import type { SupportTicket, SupportTicketPriority, SupportTicketStatus, TicketMessage } from "@/types/support";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type TicketCenterProps = {
  mode: "user" | "employee" | "admin";
};

type TicketDraft = {
  subject: string;
  message: string;
  priority: SupportTicketPriority;
  files: File[];
};

const emptyDraft: TicketDraft = {
  subject: "",
  message: "",
  priority: "MEDIUM",
  files: []
};

function getInitials(name?: string | null) {
  return (name || "RC")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusIcon(status: SupportTicketStatus) {
  if (status === "RESOLVED" || status === "CLOSED") return CheckCircle2;
  if (status === "ESCALATED") return AlertTriangle;
  if (status === "IN_PROGRESS" || status === "WAITING_USER") return Clock3;
  return Inbox;
}

function getPriorityClass(priority: SupportTicketPriority) {
  if (priority === "URGENT") return "border-red-200 bg-red-50 text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300";
  if (priority === "HIGH") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300";
  if (priority === "MEDIUM") return "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300";
  return "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
}

async function uploadTicketFiles(files: File[], ticketId: string) {
  if (!files.length || !isSupabaseConfigured) return [];

  const uploads = await Promise.all(files.map(async (file) => {
    const path = `${ticketId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("support-attachments").upload(path, file, { upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from("support-attachments").getPublicUrl(path);
    return data.publicUrl;
  }));

  return uploads.filter(Boolean) as string[];
}

export default function TicketCenter({ mode }: TicketCenterProps) {
  const { user, role, loading } = useAuth();
  const {
    tickets,
    messagesByTicket,
    selectedTicketId,
    setTickets,
    upsertTicket,
    setMessages,
    addMessage,
    selectTicket,
    moveTicket
  } = useSupportStore();
  const [draft, setDraft] = useState<TicketDraft>(emptyDraft);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const roleValue = role as string | null;

  const isAgent = mode === "employee" || mode === "admin";
  const currentRole = normalizeSupportRole(roleValue);
  const userMetadata = (user?.user_metadata || {}) as Record<string, unknown>;
  const displayName = user?.name || user?.user_metadata?.full_name || user?.email || "RC user";
  const username = user?.username || String(userMetadata.username || "") || `${currentRole}_${String(user?.id || "000000").slice(0, 6)}`;
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) || tickets[0] || null;
  const selectedMessages = selectedTicket ? messagesByTicket[selectedTicket.id] || [] : [];

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setDataLoading(true);

      if (!isSupabaseConfigured || !user) {
        if (!active) return;
        setTickets(demoSupportTickets.filter((ticket) => isAgent || ticket.user_id === "candidate-demo"));
        setMessages("support-demo-1", demoTicketMessages);
        setDataLoading(false);
        return;
      }

      let query = supabase.from("support_tickets").select("*").order("created_at", { ascending: false });

      if (!isAgent) {
        query = query.eq("user_id", user.id);
      } else if (mode === "employee") {
        query = query.or(`assigned_employee_id.is.null,assigned_employee_id.eq.${user.id}`);
      }

      const { data } = await query.limit(100);

      if (!active) return;

      const rows = (data || []) as SupportTicket[];
      setTickets(rows);
      setDataLoading(false);
    }

    if (!loading) loadTickets();

    return () => {
      active = false;
    };
  }, [isAgent, loading, mode, setMessages, setTickets, user]);

  useSupportRealtime({
    channelKey: mode,
    onTicketChange: upsertTicket,
    onMessageCreate: addMessage
  });

  useEffect(() => {
    let active = true;

    async function loadMessages(ticketId: string) {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (!active) return;
      setMessages(ticketId, (data || []) as TicketMessage[]);
    }

    if (selectedTicket?.id) loadMessages(selectedTicket.id);

    return () => {
      active = false;
    };
  }, [selectedTicket?.id, setMessages]);

  const counts = useMemo(() => {
    return ticketStatuses.reduce<Record<SupportTicketStatus, number>>((acc, status) => {
      acc[status] = tickets.filter((ticket) => ticket.status === status).length;
      return acc;
    }, {} as Record<SupportTicketStatus, number>);
  }, [tickets]);

  async function createTicket() {
    if (!user || !draft.subject.trim() || !draft.message.trim()) return;

    setIsCreating(true);
    const id = crypto.randomUUID();
    const attachment_urls = await uploadTicketFiles(draft.files, id);
    const ticket: Omit<SupportTicket, "created_at"> & { created_at?: string } = {
      id,
      ticket_number: `RC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`,
      user_id: user.id,
      user_role: currentRole,
      username,
      subject: draft.subject.trim(),
      message: draft.message.trim(),
      priority: draft.priority,
      status: "OPEN",
      assigned_employee_id: null,
      attachment_urls
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("support_tickets").insert(ticket).select("*").maybeSingle();
      if (error) {
        setStatusMessage(error.message);
        setIsCreating(false);
        return;
      }
      upsertTicket(data as SupportTicket);
      selectTicket((data as SupportTicket).id);
    } else {
      const localTicket = { ...ticket, created_at: new Date().toISOString() } as SupportTicket;
      upsertTicket(localTicket);
      selectTicket(localTicket.id);
    }

    setDraft(emptyDraft);
    setStatusMessage("Ticket created. Support will follow up from this thread.");
    setIsCreating(false);
  }

  async function sendReply() {
    if (!user || !selectedTicket || !reply.trim()) return;

    const message: Omit<TicketMessage, "created_at"> = {
      id: crypto.randomUUID(),
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      sender_role: currentRole,
      message: reply.trim(),
      internal_note: isAgent && internalNote,
      attachment_urls: []
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("ticket_messages").insert(message).select("*").maybeSingle();
      if (error) {
        setStatusMessage(error.message);
        return;
      }
      addMessage(data as TicketMessage);
    } else {
      addMessage({ ...message, created_at: new Date().toISOString() });
    }

    setReply("");
    setInternalNote(false);
  }

  async function updateStatus(ticketId: string, status: SupportTicketStatus) {
    moveTicket(ticketId, status);
    if (isSupabaseConfigured) {
      await supabase.from("support_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", ticketId);
    }
  }

  async function assignToMe(ticketId: string) {
    if (!user || !canEditTicket(roleValue)) return;
    const patch = { assigned_employee_id: user.id, status: "IN_PROGRESS" as SupportTicketStatus, updated_at: new Date().toISOString() };
    const ticket = tickets.find((item) => item.id === ticketId);
    if (ticket) upsertTicket({ ...ticket, ...patch });
    if (isSupabaseConfigured) await supabase.from("support_tickets").update(patch).eq("id", ticketId);
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination || !canEditTicket(roleValue)) return;
    const ticketId = result.draggableId;
    const nextStatus = result.destination.droppableId as SupportTicketStatus;
    await updateStatus(ticketId, nextStatus);
  }

  if (loading || dataLoading) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6">
        <Card className="flex items-center gap-3 rounded-3xl p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-bold text-text-muted">Loading support workspace...</span>
        </Card>
      </main>
    );
  }

  if ((mode === "employee" && roleValue !== "employee" && roleValue !== "admin") || (mode === "admin" && roleValue !== "admin" && roleValue !== "viewer")) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6">
        <Card className="max-w-md rounded-3xl p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 text-2xl font-black text-text-main dark:text-white">Access restricted</h1>
          <p className="mt-2 text-sm font-semibold text-text-muted">This support workspace is only available to authorized RC team members.</p>
        </Card>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="mb-6 grid gap-4 rounded-[2rem] border border-white/60 bg-white/82 p-5 shadow-elevated backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 lg:grid-cols-[1fr_auto]">
        <div>
          <Badge variant="primary" className="type-label">{isAgent ? "Employee Support Desk" : "Support Center"}</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white sm:text-4xl">
            {isAgent ? "Resolve tickets with context, speed, and care." : "Get help from the RC support team."}
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-text-muted">
            Realtime ticket tracking, threaded replies, internal notes, assignments, and a Kanban workflow designed for support teams.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[520px]">
          {[
            { label: "Open", value: counts.OPEN || 0, icon: Inbox },
            { label: "In progress", value: counts.IN_PROGRESS || 0, icon: Clock3 },
            { label: "Escalated", value: counts.ESCALATED || 0, icon: AlertTriangle },
            { label: "Resolved", value: (counts.RESOLVED || 0) + (counts.CLOSED || 0), icon: CheckCircle2 }
          ].map((item) => {
            const Icon = item.icon;
            return (
            <Card key={item.label} className="rounded-2xl p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-2xl font-black text-text-main dark:text-white">{item.value}</p>
              <p className="text-xs font-bold text-text-muted">{item.label}</p>
            </Card>
            );
          })}
        </div>
      </div>

      {statusMessage ? (
        <div className="mb-5 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-bold text-success">
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="grid gap-5">
          {!isAgent ? (
            <Card className="rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-text-main dark:text-white">Create a ticket</h2>
                  <p className="mt-1 text-sm font-semibold text-text-muted">Use your username <span className="text-primary">{username}</span> for tracking.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <Input value={draft.subject} onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} placeholder="Ticket subject" />
                <textarea
                  value={draft.message}
                  onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Describe what happened..."
                  className="min-h-28 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary dark:border-white/10 dark:bg-slate-900"
                />
                <select
                  value={draft.priority}
                  onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as SupportTicketPriority }))}
                  className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900"
                >
                  {ticketPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-border bg-bg px-4 py-3 text-sm font-bold text-text-muted dark:border-white/10 dark:bg-white/5">
                  <span className="flex items-center gap-2"><FileUp className="h-4 w-4" />Upload screenshots/files</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => setDraft((current) => ({ ...current, files: Array.from(event.target.files || []) }))}
                  />
                </label>
                {draft.files.length ? <p className="text-xs font-bold text-text-muted">{draft.files.length} file(s) selected</p> : null}
                <Button disabled={isCreating || !draft.subject || !draft.message} onClick={createTicket} className="gap-2">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit ticket
                </Button>
              </div>
            </Card>
          ) : null}

          <Card className="rounded-3xl p-0">
            <div className="border-b border-border p-5 dark:border-white/10">
              <p className="type-label text-primary">Ticket queue</p>
              <h2 className="mt-1 text-xl font-black text-text-main dark:text-white">{isAgent ? "Assigned and open tickets" : "Your tickets"}</h2>
            </div>
            <div className="max-h-[620px] overflow-y-auto p-3">
              {tickets.length ? tickets.map((ticket) => {
                const active = selectedTicket?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => selectTicket(ticket.id)}
                    className={cn(
                      "mb-3 w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-hover",
                      active ? "border-primary bg-primary/5 shadow-primary dark:bg-primary/10" : "border-border bg-white dark:border-white/10 dark:bg-slate-900"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wider text-primary">{ticket.ticket_number}</p>
                        <h3 className="mt-1 line-clamp-2 text-sm font-black text-text-main dark:text-white">{ticket.subject}</h3>
                        <p className="mt-1 truncate text-xs font-semibold text-text-muted">{ticket.username} • {ticket.user_role}</p>
                      </div>
                      <Badge variant={getTicketTone(ticket.status) as any}>{formatTicketStatus(ticket.status)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", getPriorityClass(ticket.priority))}>{ticket.priority}</span>
                      {ticket.attachment_urls?.length ? <span className="flex items-center gap-1 text-xs font-bold text-text-muted"><Paperclip className="h-3 w-3" />{ticket.attachment_urls.length}</span> : null}
                    </div>
                  </button>
                );
              }) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center dark:border-white/10">
                  <Sparkles className="mx-auto h-6 w-6 text-primary" />
                  <p className="mt-3 text-sm font-black text-text-main dark:text-white">No tickets yet</p>
                  <p className="mt-1 text-xs font-semibold text-text-muted">New support requests will appear here.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6">
          {isAgent ? (
            <Card className="rounded-3xl p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="type-label text-primary">Kanban workflow</p>
                  <h2 className="mt-1 text-xl font-black text-text-main dark:text-white">Ticket movement</h2>
                </div>
                <p className="text-xs font-bold text-text-muted">Drag cards to update status</p>
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {ticketStatuses.map((status) => {
                    const StatusIcon = statusIcon(status);
                    const statusTickets = tickets.filter((ticket) => ticket.status === status);
                    return (
                      <Droppable key={status} droppableId={status} isDropDisabled={!canEditTicket(roleValue)}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "min-h-[220px] w-64 shrink-0 rounded-2xl border border-border bg-bg p-3 transition dark:border-white/10 dark:bg-white/5",
                              snapshot.isDraggingOver && "border-primary bg-primary/5"
                            )}
                          >
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <h3 className="flex items-center gap-2 text-sm font-black text-text-main dark:text-white">
                                <StatusIcon className="h-4 w-4 text-primary" />
                                {formatTicketStatus(status)}
                              </h3>
                              <Badge>{statusTickets.length}</Badge>
                            </div>
                            <div className="grid gap-2">
                              {statusTickets.map((ticket, index) => (
                                <Draggable key={ticket.id} draggableId={ticket.id} index={index} isDragDisabled={!canEditTicket(roleValue)}>
                                  {(dragProvided) => (
                                    <button
                                      type="button"
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      onClick={() => selectTicket(ticket.id)}
                                      className="rounded-2xl border border-border bg-white p-3 text-left shadow-soft transition hover:border-primary/30 dark:border-white/10 dark:bg-slate-900"
                                    >
                                      <p className="text-xs font-black text-primary">{ticket.ticket_number}</p>
                                      <p className="mt-1 line-clamp-2 text-sm font-black text-text-main dark:text-white">{ticket.subject}</p>
                                      <p className="mt-2 text-xs font-bold text-text-muted">{ticket.priority} • {ticket.username}</p>
                                    </button>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              </DragDropContext>
            </Card>
          ) : null}

          <Card className="rounded-3xl p-0">
            {selectedTicket ? (
              <>
                <div className="border-b border-border p-5 dark:border-white/10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="type-label text-primary">{selectedTicket.ticket_number}</p>
                      <h2 className="mt-1 text-2xl font-black text-text-main dark:text-white">{selectedTicket.subject}</h2>
                      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-text-muted">{selectedTicket.message}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getTicketTone(selectedTicket.status) as any}>{formatTicketStatus(selectedTicket.status)}</Badge>
                      <span className={cn("rounded-full border px-3 py-1 text-xs font-black", getPriorityClass(selectedTicket.priority))}>{selectedTicket.priority}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-xs font-black text-white">
                      {getInitials(selectedTicket.username)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-main dark:text-white">{selectedTicket.username}</p>
                      <p className="text-xs font-bold text-text-muted">{selectedTicket.user_role} • Created {new Date(selectedTicket.created_at).toLocaleString()}</p>
                    </div>
                    {isAgent ? (
                      <Button variant="secondary" className="ml-auto gap-2 px-3 py-2" onClick={() => assignToMe(selectedTicket.id)}>
                        <UserPlus className="h-4 w-4" />
                        Assign to me
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[1fr_260px]">
                  <div className="grid gap-3">
                    {selectedMessages.length ? selectedMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "rounded-2xl border p-4",
                          message.internal_note
                            ? "border-amber-200 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-500/10"
                            : "border-border bg-bg dark:border-white/10 dark:bg-white/5"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="flex items-center gap-2 text-sm font-black text-text-main dark:text-white">
                            {message.internal_note ? <StickyNote className="h-4 w-4 text-amber-500" /> : <MessageSquareText className="h-4 w-4 text-primary" />}
                            {message.sender_role}
                          </p>
                          <p className="text-xs font-bold text-text-muted">{new Date(message.created_at).toLocaleString()}</p>
                        </div>
                        <p className="text-sm font-semibold leading-6 text-text-muted">{message.message}</p>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-border p-6 text-center dark:border-white/10">
                        <MessageSquareText className="mx-auto h-6 w-6 text-primary" />
                        <p className="mt-2 text-sm font-black text-text-main dark:text-white">No replies yet</p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-border bg-white p-3 dark:border-white/10 dark:bg-slate-900">
                      <textarea
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        placeholder={isAgent ? "Reply to the user or add an internal note..." : "Reply to support..."}
                        className="min-h-24 w-full resize-none bg-transparent px-2 py-2 text-sm font-semibold outline-none"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {isAgent ? (
                          <label className="flex items-center gap-2 text-xs font-bold text-text-muted">
                            <input type="checkbox" checked={internalNote} onChange={(event) => setInternalNote(event.target.checked)} />
                            Internal note
                          </label>
                        ) : <span />}
                        <Button onClick={sendReply} disabled={!reply.trim()} className="gap-2">
                          <Send className="h-4 w-4" />
                          Send reply
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid content-start gap-3">
                    <Card className="rounded-2xl p-4">
                      <p className="type-label text-primary">Activity timeline</p>
                      <div className="mt-4 grid gap-3">
                        {[
                          ["Created", selectedTicket.created_at],
                          ["Last update", selectedTicket.updated_at || selectedTicket.created_at],
                          ["Current status", formatTicketStatus(selectedTicket.status)]
                        ].map(([label, value]) => (
                          <div key={label} className="flex gap-3">
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <div>
                              <p className="text-xs font-black text-text-main dark:text-white">{label}</p>
                              <p className="text-xs font-semibold text-text-muted">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                    {isAgent ? (
                      <Card className="rounded-2xl p-4">
                        <p className="type-label text-primary">Move ticket</p>
                        <div className="mt-3 grid gap-2">
                          {ticketStatuses.map((status) => (
                            <Button
                              key={status}
                              variant={selectedTicket.status === status ? "primary" : "secondary"}
                              className="justify-start px-3 py-2"
                              onClick={() => updateStatus(selectedTicket.id, status)}
                            >
                              {formatTicketStatus(status)}
                            </Button>
                          ))}
                        </div>
                      </Card>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
                <h2 className="mt-3 text-xl font-black text-text-main dark:text-white">Select a ticket</h2>
                <p className="mt-2 text-sm font-semibold text-text-muted">Ticket details, messages, and actions will appear here.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
