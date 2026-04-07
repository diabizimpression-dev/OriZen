import type { ReactNode } from "react";

type EmergencyContact = {
  label: string;
  number: string;
  color: string;
};

interface EmergencyBarProps {
  contacts: EmergencyContact[];
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function EmergencyBar({
  contacts,
  title = "Danger immédiat ?",
  description = "Appelez directement si la situation est critique.",
  action,
}: EmergencyBarProps) {
  return (
    <div className="w-full bg-red-950/55 border-b border-red-900/40 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-300">🚨 {title}</p>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {contacts.map((contact) => (
          <a
            key={contact.number}
            href={`tel:${contact.number}`}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition hover:scale-105 active:scale-95"
            style={{
              color: contact.color,
              borderColor: `${contact.color}55`,
              backgroundColor: `${contact.color}15`,
            }}
          >
            <span>{contact.label}</span>
            <span className="font-mono">{contact.number}</span>
          </a>
        ))}

        {action}
      </div>
    </div>
  );
}
