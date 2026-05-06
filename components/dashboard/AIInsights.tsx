"use client";

import { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getCareerAssistantReply } from "@/lib/ai";

export default function AIInsights() {
  const [messages, setMessages] = useState([
    { role: "assistant", body: "Your strongest hiring signal is operations ownership. I recommend strengthening your resume with metrics around vendor coordination, reporting, and team support." }
  ]);
  const [input, setInput] = useState("How can I improve my interview readiness?");
  const [typing, setTyping] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    const prompt = input.trim();
    setMessages((current) => [...current, { role: "user", body: prompt }]);
    setInput("");
    setTyping(true);
    const reply = await getCareerAssistantReply(prompt);
    setMessages((current) => [...current, { role: "assistant", body: reply }]);
    setTyping(false);
  }

  return (
    <Card className="p-6">
      <Badge variant="primary">AI career assistant</Badge>
      <h2 className="mt-2 text-2xl font-black dark:text-white">Personal career copilot</h2>
      <div className="mt-5 max-h-80 space-y-3 overflow-y-auto rounded-3xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${message.role === "user" ? "bg-primary text-white" : "bg-surface text-text-muted shadow-soft dark:bg-slate-900 dark:text-slate-200"}`}>
              {message.role === "assistant" ? <Bot className="mr-2 inline h-4 w-4 text-primary" /> : null}{message.body}
            </div>
          </div>
        ))}
        {typing ? <div className="inline-flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-bold text-text-muted shadow-soft dark:bg-slate-900"><Sparkles className="h-4 w-4 animate-pulse text-primary" /> AI is thinking...</div> : null}
      </div>
      <div className="mt-4 flex gap-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} className="focus-ring min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white" />
        <Button onClick={sendMessage} className="gap-2"><Send className="h-4 w-4" /> Send</Button>
      </div>
    </Card>
  );
}
