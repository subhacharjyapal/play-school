import { api } from "./client";

export interface StaffProfile {
  id: string;
  fullName: string;
  qualification: string | null;
  photoUrl: string | null;
  bio: string | null;
  classrooms: Array<{ name: string }>;
}

export async function fetchStaff(): Promise<StaffProfile[]> {
  const { data } = await api.get<{ staff: StaffProfile[] }>("/site/staff");
  return data.staff;
}
