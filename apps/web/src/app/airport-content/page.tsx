"use client";

import { AppFooter, AppHeader } from "@/components/public-shell";
import { ErrorState, EmptyState } from "@/components/ui/empty";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type AirportItem = {
  _id: string;
  title: string;
  content: string;
  images: string[];
  videos: string[];
};

function ImageLightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const count = images.length;
  const current = images[index] || images[0];
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && count > 1) onIndex((index - 1 + count) % count);
      if (event.key === "ArrowRight" && count > 1) onIndex((index + 1) % count);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [count, index, onClose, onIndex]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <button
        type="button"
        aria-label="Хаах"
        className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
      {count > 1 && (
        <button
          type="button"
          aria-label="Өмнөх"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 md:left-6"
          onClick={(event) => {
            event.stopPropagation();
            onIndex((index - 1 + count) % count);
          }}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        alt=""
        className="max-h-[85vh] max-w-[calc(100%-5rem)] object-contain"
        onClick={(event) => event.stopPropagation()}
      />
      {count > 1 && (
        <button
          type="button"
          aria-label="Дараах"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 md:right-6"
          onClick={(event) => {
            event.stopPropagation();
            onIndex((index + 1) % count);
          }}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {index + 1} / {count}
        </div>
      )}
    </div>,
    document.body
  );
}

export default function AirportContentPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["airport-content"],
    queryFn: () => api<{ items: AirportItem[] }>("/api/airport-content"),
  });
  const items = data?.items || [];
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-[13px] font-semibold tracking-[0.16em] text-orange">ҮЙЛЧИЛГЭЭ</p>
        <h1 className="mt-2 text-[1.2rem] font-semibold leading-tight">
          &quot;Чингис хаан&quot; ОУНБ -дээр реклам 50 дэлгэцээр реклам гаргах боломжийг таньд санал болгож байна.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6B7280]">
          Реклам хүлээж авах Имэйл: info@bb-eternity.mn, Утас: 8690 7858
        </p>

        {isLoading && <div className="mt-8 text-sm text-[#6B7280]">Ачааллаж байна...</div>}
        {isError && (
          <div className="mt-8">
            <ErrorState onRetry={() => refetch()} />
          </div>
        )}
        {!isLoading && !isError && items.length === 0 && (
          <div className="mt-8">
            <EmptyState title="Мэдээлэл оруулаагүй байна" description="Удахгүй энд рекламын боломж тавигдана." />
          </div>
        )}

        <div className="mt-8 space-y-8">
          {items.map((item) => (
            <article key={item._id} className="card p-5 md:p-6">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              {item.images.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {item.images.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      className="overflow-hidden rounded-lg"
                      onClick={() => setViewer({ images: item.images, index })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-44 w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {item.videos.length > 0 && (
                <div className="mt-5 space-y-4">
                  {item.videos.map((src) => (
                    <video key={src} src={src} controls className="max-h-[480px] w-full rounded-lg bg-black" />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
      {viewer && (
        <ImageLightbox
          images={viewer.images}
          index={viewer.index}
          onIndex={(index) => setViewer((current) => (current ? { ...current, index } : current))}
          onClose={() => setViewer(null)}
        />
      )}
      <AppFooter />
    </div>
  );
}
