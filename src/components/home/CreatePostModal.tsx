import React, { useState } from "react";

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (post: { title: string; excerpt: string; category: string; tagsStr: string }) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSubmit }) => {
  const [newTitle, setNewTitle] = useState("");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newCategory, setNewCategory] = useState("Tech & Architecture");
  const [newTagsStr, setNewTagsStr] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newExcerpt.trim()) return;
    
    onSubmit({
      title: newTitle,
      excerpt: newExcerpt,
      category: newCategory,
      tagsStr: newTagsStr,
    });
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] p-6 shadow-2xl backdrop-blur-lg">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--divider-color)] pb-3.5">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Start a New Discussion</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-[var(--btn-icon-hover-bg)] text-dust-grey hover:text-[var(--foreground)] cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          
          {/* Title input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Discussion Title</label>
            <input
              type="text"
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Is anyone else seeing CSS import warnings under Turbopack?"
              className="block w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-dust-grey/50 outline-none focus:border-[var(--input-focus-border)] focus:bg-[var(--input-focus-bg)] focus:ring-1 focus:ring-[var(--input-focus-ring)]"
              required
            />
          </div>

          {/* Category input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Category</label>
            <select
              id="category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="block w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--input-focus-border)] focus:bg-[var(--input-focus-bg)] cursor-pointer"
            >
              <option value="Tech & Architecture">🛠️ Tech & Architecture</option>
              <option value="Career Prep">💼 Career Prep</option>
            </select>
          </div>

          {/* Excerpt Textarea */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="excerpt" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Discussion Body</label>
            <textarea
              id="excerpt"
              value={newExcerpt}
              onChange={(e) => setNewExcerpt(e.target.value)}
              placeholder="Elaborate on your problem or prompt. Share background context, code structures, or interview setups..."
              rows={4}
              className="block w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-dust-grey/50 outline-none focus:border-[var(--input-focus-border)] focus:bg-[var(--input-focus-bg)] focus:ring-1 focus:ring-[var(--input-focus-ring)] resize-none"
              required
            />
          </div>

          {/* Tags input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tags" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Hashtags (Comma-separated)</label>
            <input
              type="text"
              id="tags"
              value={newTagsStr}
              onChange={(e) => setNewTagsStr(e.target.value)}
              placeholder="e.g. react19, nextjs, styling"
              className="block w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-dust-grey/50 outline-none focus:border-[var(--input-focus-border)] focus:bg-[var(--input-focus-bg)] focus:ring-1 focus:ring-[var(--input-focus-ring)]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-3.5 border-t border-[var(--divider-color)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--btn-secondary-hover-bg)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-spicy-paprika hover:bg-spicy-paprika-600 px-6 py-2.5 text-sm font-bold text-floral-white shadow-md cursor-pointer"
            >
              Post Charcha
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
