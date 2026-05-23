"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { CreatePostModal } from "@/components/home/CreatePostModal";
import axiosInstance from "@/lib/axios";
import { useRouter, usePathname } from "next/navigation";

import { toast } from "@/store/useToastStore";

export const GlobalCreatePostModal = () => {
  const { isCreatePostOpen, setIsCreatePostOpen } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!isCreatePostOpen) return null;

  const handleSubmit = async (post: { title: string; excerpt: string; category: string; tagsStr: string }) => {
    const tagsArray = post.tagsStr
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length >= 1 && t.length <= 30);

    try {
      const res = await axiosInstance.post("/api/posts", {
        title: post.title,
        content: post.excerpt,
        tags: tagsArray.length > 0 ? tagsArray : ["general"],
        category: post.category,
        community: null,
      });

      if (res.data?.post) {
        setIsCreatePostOpen(false);
        toast.success("Charcha posted successfully!");
        
        // Dispatch custom event to notify current page to reload/refresh posts list
        window.dispatchEvent(new Event("new-post-created"));
        
        // If the user is on page other than Home (/) or My Posts (/post), redirect to Home
        if (pathname !== "/" && pathname !== "/post") {
          router.push("/");
        }
      }
    } catch (err) {
      console.error("Error creating post:", err);
      toast.error("Failed to create post. Please check the character requirements (Title: 3-100 chars, Body: 10-1000 chars).");
    }
  };

  return (
    <CreatePostModal
      onClose={() => setIsCreatePostOpen(false)}
      onSubmit={handleSubmit}
    />
  );
};
