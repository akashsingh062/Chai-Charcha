import type { Metadata } from "next";
import FeedbackClient from "./FeedbackClient";

export const metadata: Metadata = {
  title: "Feedback Portal | Chai Charcha",
  description: "Share your feedback, report issues, suggest features, or contact the Chai Charcha team. We read every message and respond to all serious enquiries.",
  alternates: { canonical: "https://chai-charcha.vercel.app/feedback" },
};

export default function FeedbackPage() {
  return <FeedbackClient />;
}
