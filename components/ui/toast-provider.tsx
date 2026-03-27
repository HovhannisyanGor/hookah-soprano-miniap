"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

import { cn } from "@/lib/format";

type ToastTone = "default" | "success" | "error";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  pushToast: (input: Omit<ToastItem, "id" | "tone"> & { tone?: ToastTone }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneMap: Record<ToastTone, string> = {
  default: "border-white/10 bg-zinc-900/90",
  success: "border-emerald-500/30 bg-emerald-950/80",
  error: "border-rose-500/30 bg-rose-950/80"
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const pushToast = useCallback<ToastContextValue["pushToast"]>((input) => {
    const id = crypto.randomUUID();
    setItems((current) => [
      ...current,
      {
        id,
        tone: input.tone ?? "default",
        title: input.title,
        description: input.description
      }
    ]);

    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-lounge backdrop-blur-xl",
              toneMap[item.tone]
            )}
          >
            <p className="font-medium text-cream">{item.title}</p>
            {item.description && (
              <p className="mt-1 text-xs text-zinc-300">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
