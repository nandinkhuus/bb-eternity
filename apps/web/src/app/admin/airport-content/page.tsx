"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePicker } from "@/components/image-picker";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm";
import { Field, Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api";

type AirportItem = {
  _id: string;
  title: string;
  content: string;
  images: string[];
  videos: string[];
  active: boolean;
};

const empty = { title: "", content: "", active: true };

export default function AdminAirportContentPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-airport-content"],
    queryFn: () => api<{ items: AirportItem[] }>("/api/airport-content?all=1"),
  });
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);

  function reset() {
    setForm(empty);
    setEditing(null);
    setImages([]);
    setVideos([]);
  }

  async function uploadMedia(id: string) {
    if (!images.length && !videos.length) return;
    const fd = new FormData();
    images.forEach((file) => fd.append("images", file));
    videos.forEach((file) => fd.append("videos", file));
    await api(`/api/airport-content/${id}/media`, { method: "POST", body: fd });
  }

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        await api(`/api/airport-content/${editing}`, { method: "PATCH", body: JSON.stringify(form) });
        await uploadMedia(editing);
        return;
      }
      const created = await api<AirportItem>("/api/airport-content", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await uploadMedia(created._id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-airport-content"] });
      qc.invalidateQueries({ queryKey: ["airport-content"] });
      toast.success(editing ? "Шинэчиллээ" : "Нэмэгдлээ");
      reset();
    },
    onError: (err: Error) => toast.error(err.message || "Хадгалж чадсангүй"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/airport-content/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-airport-content"] });
      toast.success("Устгалаа");
    },
  });

  const dropMedia = useMutation({
    mutationFn: ({ item, kind, url }: { item: AirportItem; kind: "images" | "videos"; url: string }) =>
      api(`/api/airport-content/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ [kind]: item[kind].filter((value) => value !== url) }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-airport-content"] }),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold">Airport Content</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Reklam гаргах боломж хуудсанд гарах гарчиг, текст, зураг, видео.
      </p>

      <form
        className="card mt-4 space-y-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field label="Гарчиг">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Content">
          <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Нийтэд харуулах
        </label>
        <ImagePicker files={images} onChange={setImages} label="Зураг" max={12} />
        <Field label="Видео">
          <Input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            multiple
            onChange={(e) => setVideos(Array.from(e.target.files || []))}
          />
          {videos.length > 0 && (
            <p className="mt-1 text-[12px] text-[#6B7280]">{videos.map((file) => file.name).join(", ")}</p>
          )}
        </Field>
        <div className="flex gap-2">
          <Button disabled={save.isPending}>{save.isPending ? "..." : editing ? "Шинэчлэх" : "Нэмэх"}</Button>
          {editing && (
            <Button type="button" variant="outline" onClick={reset}>
              Болих
            </Button>
          )}
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {(data?.items || []).map((item) => (
          <article key={item._id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                {!item.active && <p className="text-[12px] text-[#6B7280]">Нуугдсан</p>}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(item._id);
                    setForm({ title: item.title, content: item.content, active: item.active });
                    setImages([]);
                    setVideos([]);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Засах
                </Button>
                <ConfirmDialog
                  title="Устгах уу?"
                  description={item.title}
                  confirmLabel="Устгах"
                  onConfirm={() => remove.mutateAsync(item._id)}
                  trigger={<Button size="sm" variant="danger">Устгах</Button>}
                />
              </div>
            </div>
            {item.content && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-[#6B7280]">{item.content}</p>}
            {item.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.images.map((src) => (
                  <div key={src} className="relative h-20 w-20 overflow-hidden rounded-lg border border-[#E5E7EB]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white"
                      onClick={() => dropMedia.mutate({ item, kind: "images", url: src })}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {item.videos.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {item.videos.map((src) => (
                  <li key={src} className="flex items-center justify-between gap-3">
                    <span className="truncate text-[#6B7280]">{src.split("/").pop()}</span>
                    <button
                      type="button"
                      className="text-[12px] text-red-600"
                      onClick={() => dropMedia.mutate({ item, kind: "videos", url: src })}
                    >
                      Хасах
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
