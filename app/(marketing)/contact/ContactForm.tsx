"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    setSending(false);

    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
  }

  if (sent) {
    return (
      <Card>
        <p className="text-sm text-foreground">
          Thanks — your message has been sent. We&apos;ll get back to you soon.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-sm text-accent hover:underline mt-3"
        >
          Send another message
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="contact-name"
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          id="contact-email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Textarea
          id="contact-message"
          label="Message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </Card>
  );
}
