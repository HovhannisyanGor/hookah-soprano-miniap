export type Branch = {
  id: string;
  name: string;
  address: string;
  nearestMetro?: string;
  hours: string;
  phone: string;
};

export type ServiceItem = {
  name: string;
  price: string;
  description: string;
};

export type StrengthOption = {
  id: string;
  title: string;
  note: string;
};

export type ConsultationTopic = {
  id: string;
  title: string;
  prompt: string;
};

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

export type BusinessConfig = {
  name: string;
  tagline: string;
  hero: string;
  phone: string;
  managerHandle: string;
  responseWindow: string;
  branches: Branch[];
  timeSlots: string[];
  services: ServiceItem[];
  strengths: StrengthOption[];
  consultationTopics: ConsultationTopic[];
  faq: FAQItem[];
};

export type BookingDraft = {
  branchId: string;
  date: string;
  time: string;
  guests: number;
  strengthId: string;
  flavorNotes: string;
  phone: string;
  comment: string;
};

export type ConsultationDraft = {
  topicId: string;
  question: string;
  phone: string;
};

export type BookingRecord = BookingDraft & {
  id: string;
  createdAt: string;
  status: "new" | "confirmed" | "completed" | "cancelled";
  userId: number;
  username?: string;
  fullName: string;
};

export type ConsultationRecord = ConsultationDraft & {
  id: string;
  createdAt: string;
  status: "new" | "in_progress" | "resolved";
  userId: number;
  username?: string;
  fullName: string;
};

export type Database = {
  bookings: BookingRecord[];
  consultations: ConsultationRecord[];
};

export type FlowType = "idle" | "booking" | "consultation";

export type BookingStep =
  | "branch"
  | "date"
  | "time"
  | "guests"
  | "strength"
  | "flavor"
  | "phone"
  | "comment"
  | "confirm";

export type ConsultationStep = "topic" | "question" | "phone" | "confirm";

export type SessionData = {
  flow: FlowType;
  step: BookingStep | ConsultationStep | null;
  bookingDraft: Partial<BookingDraft>;
  consultationDraft: Partial<ConsultationDraft>;
};
