"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FileUpload } from "@/components/ui/FileUpload";

export default function NewCoursePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceNaira, setPriceNaira] = useState("0");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const slug = slugify(title);
    const price_kobo = Math.round(parseFloat(priceNaira || "0") * 100);

    const { data, error: insertError } = await supabase
      .from("courses")
      .insert({
        title,
        slug,
        description,
        price_kobo,
        cover_image_url: coverImageUrl || null,
        instructor_id: user.id,
        status: "draft",
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/admin/courses/${data.slug}/edit`);
  }

  return (
    <div className="max-w-2xl mx-auto py-14 px-6">
      <p className="text-sm font-mono text-accent mb-1">new course</p>
      <h1
        className="text-3xl font-semibold text-foreground mb-8"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Create a course
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="title"
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Frontend Fundamentals"
          // hint={title ? `/courses/${slugify(title)}` : undefined}
        />

        <Textarea
          id="description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        <FileUpload
          bucket="course-covers"
          accept="image/*"
          label="Cover Image"
          resizeTo={{ width: 1280, height: 720 }}
          onUploaded={setCoverImageUrl}
        />

        <Input
          id="price"
          label="Price (₦, 0 for free)"
          type="number"
          min="0"
          step="0.01"
          value={priceNaira}
          onChange={(e) => setPriceNaira(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Course"}
        </Button>
      </form>
    </div>
  );
}
