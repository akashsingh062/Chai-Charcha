import React, { useState } from "react";
import { toast } from "@/store/useToastStore";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";

interface CreateCommunityModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Helper to auto-generate slug from name if empty
  const handleNameChange = (val: string) => {
    setName(val);
    // Generate clean slug: lowercase, hyphens, alphanumeric only
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setSlug(autoSlug);
  };

  const handleSlugChange = (val: string) => {
    // Only allow lowercase alphanumeric and hyphens in slug
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !description.trim()) {
      toast.warning("Please fill out all required fields.");
      return;
    }

    if (name.length < 3 || name.length > 30) {
      toast.warning("Community name must be between 3 and 30 characters.");
      return;
    }

    if (slug.length < 3 || slug.length > 30) {
      toast.warning("Community slug must be between 3 and 30 characters.");
      return;
    }

    if (description.length < 10 || description.length > 200) {
      toast.warning("Description must be between 10 and 200 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axiosInstance.post("/api/communities", {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
      });

      if (res.data?.success && res.data?.community) {
        toast.success(`Community c/${res.data.community.slug} created successfully!`);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
        // Redirect to new community page
        router.push(`/c/${res.data.community.slug}`);
      }
    } catch (err: any) {
      console.error("Error creating community:", err);
      toast.error(err.response?.data?.error || "Failed to create community. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-(--dropdown-border) bg-(--dropdown-bg) p-6 shadow-2xl backdrop-blur-lg">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-(--divider-color) pb-3.5">
          <h2 className="text-lg font-bold text-(--foreground)">Create a New Community</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-(--btn-icon-hover-bg) text-dust-grey hover:text-(--foreground) cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          
          {/* Community Name input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="comm-name" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Community Name</label>
            <input
              type="text"
              id="comm-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. JavaScript Enthusiasts"
              className="block w-full rounded-xl border border-(--input-border) bg-(--input-bg) px-4 py-2.5 text-sm text-(--foreground) placeholder-dust-grey/50 outline-none focus:border-(--input-focus-border) focus:bg-(--input-focus-bg) focus:ring-1 focus:ring-(--input-focus-ring)"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Community Slug input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="comm-slug" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Community Slug (c/slug)</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-bold text-dust-grey select-none">c/</span>
              <input
                type="text"
                id="comm-slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="javascript-enthusiasts"
                className="block w-full rounded-xl border border-(--input-border) bg-(--input-bg) pl-8 pr-4 py-2.5 text-sm text-(--foreground) placeholder-dust-grey/50 outline-none focus:border-(--input-focus-border) focus:bg-(--input-focus-bg) focus:ring-1 focus:ring-(--input-focus-ring)"
                required
                disabled={isSubmitting}
              />
            </div>
            <p className="text-[10px] text-dust-grey italic px-1">Lowercase letters, numbers, and hyphens only.</p>
          </div>

          {/* Community Description textarea */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="comm-desc" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Description</label>
            <textarea
              id="comm-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief introduction to what this community is about..."
              className="block w-full rounded-xl border border-(--input-border) bg-(--input-bg) px-4 py-2.5 text-sm text-(--foreground) placeholder-dust-grey/50 outline-none focus:border-(--input-focus-border) focus:bg-(--input-focus-bg) focus:ring-1 focus:ring-(--input-focus-ring) resize-none"
              rows={3}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center justify-end gap-2.5 border-t border-(--divider-color) pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-(--foreground) hover:bg-(--btn-secondary-hover-bg) cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-orange hover:bg-orange-600 disabled:bg-orange/50 px-5 py-2.5 text-xs font-bold text-ink-black shadow-md cursor-pointer flex items-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-ink-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Brewing...</span>
                </>
              ) : (
                <span>Create Community</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
