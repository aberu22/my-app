"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

// shadcn/ui
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const guides = [
  { title: "Introduction ", image: "images/image4.jpg", tag: "Introduction ", href: "/guides/upscaling" },
  { title: "Nsfw Demo", image: "images/guide2.jpg", tag: "How to Use", href: "/guides/style-reference" },
  { title: "Text to Video ", image: "images/guide3.jpg", tag: "Text to video", href: "/guides/characters" },
];

export default function FeaturedGuides() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-purple-400">Featured Guides</h2>
        <Button asChild variant="ghost" className="gap-2 text-purple-400 hover:text-purple-300">
          
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide, index) => (
          <Card key={index} className="group overflow-hidden border-white/10 bg-white/5 hover:shadow-lg transition">
            <div className="relative h-40 w-full overflow-hidden">
              <Image
                src={guide.image}
                alt={guide.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80"
              />
              <div className="absolute bottom-3 left-3">
                <Badge variant="secondary" className="bg-black/60 text-white border-white/10 backdrop-blur">
                  {guide.tag}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{guide.title}</h3>
              <p className="text-xs text-white/60">Learn how to master {guide.tag.toLowerCase()} in your workflow.</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button asChild variant="secondary" className="w-full gap-2 bg-white/10 border-white/10">
                <Link href={guide.href}>
                  watch video <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
