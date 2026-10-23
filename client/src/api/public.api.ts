import { api } from "./client";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  eventDate: string | null;
  createdAt: string;
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data } = await api.get<{ announcements: Announcement[] }>("/announcements");
  return data.announcements;
}

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function submitContact(input: ContactInput): Promise<void> {
  await api.post("/contact", input);
}
