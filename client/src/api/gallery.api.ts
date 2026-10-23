import { api } from "./client";

export interface GalleryImage {
  id: string;
  title: string;
  category: "EVENT" | "CLASSROOM" | "SPORTS" | "FESTIVAL" | "ACTIVITY";
  imageUrl: string;
  createdAt: string;
}

export async function fetchGalleryImages(): Promise<GalleryImage[]> {
  const { data } = await api.get<{ images: GalleryImage[] }>("/gallery");
  return data.images;
}
