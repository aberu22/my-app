'use client';
import Image from 'next/image';

export default function ImageCard({ img }) {
  return (
    <figure className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <Image
        src={img.src}
        alt={img.user}
        width={img.w}
        height={img.h}
        className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.02]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <figcaption className="absolute inset-x-0 bottom-0 p-3 text-sm">
        <span className="glass inline-flex items-center gap-2 px-3 py-1 rounded-2xl">
          {img.user}
        </span>
      </figcaption>
    </figure>
  );
}
