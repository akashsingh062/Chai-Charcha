import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Meetup } from "@/lib/models/Meetup";

// Helper to seed sample upcoming meetups if none exist
async function seedDefaultMeetups() {
  const sampleMeetups = [
    {
      title: "Scaling React 19 Server Actions to 10M Pageviews",
      description: "Join us for an exclusive online deep-dive with core engineers on optimizing server activity overheads, caching patterns, and streaming layouts in serverless environments.",
      dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      location: "LIVE ONLINE AMA",
      type: "online",
      link: "https://zoom.us/j/charcha-ama-actions",
      attendees: [],
      maxSeats: 500,
    },
    {
      title: "Offline Chai & Networking Meetup - Indiranagar",
      description: "A casual physical networking session. Pull up a chair, grab some hot cutting chai, and pair program or talk architecture with fellow Bangalore developers.",
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      location: "Chai Point, 100ft Road, Indiranagar, Bangalore",
      type: "offline",
      attendees: [],
      maxSeats: 45,
    },
    {
      title: "Next.js Core Web Vitals Optimization Masterclass",
      description: "Learn actionable strategies to push your LCP, INP, and CLS scores into the green zone using advanced prefetching and dynamic font loading.",
      dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      location: "LIVE CHAI LABS",
      type: "online",
      link: "https://youtube.com/live/charcha-cwv-masterclass",
      attendees: [],
      maxSeats: 1000,
    }
  ];

  await Meetup.insertMany(sampleMeetups);
}

// GET /api/meetups - Get list of upcoming meetups
export async function GET() {
  try {
    await connectDB();

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id || null;

    // Fetch meetups occurring in the future or within the last 4 hours
    const threshold = new Date(Date.now() - 4 * 60 * 60 * 1000);
    let upcomingMeetups = await Meetup.find({ dateTime: { $gte: threshold } })
      .sort({ dateTime: 1 })
      .populate("attendees", "name username avatar");

    // Seed if empty to guarantee beautiful user onboarding
    if (upcomingMeetups.length === 0) {
      await seedDefaultMeetups();
      upcomingMeetups = await Meetup.find({ dateTime: { $gte: threshold } })
        .sort({ dateTime: 1 })
        .populate("attendees", "name username avatar");
    }

    // Format meetups response
    const meetups = upcomingMeetups.map((meetup) => {
      const hasJoined = userId ? meetup.attendees.some((att: any) => att._id.toString() === userId.toString()) : false;
      return {
        id: meetup._id.toString(),
        title: meetup.title,
        description: meetup.description || "",
        dateTime: meetup.dateTime.toISOString(),
        location: meetup.location,
        type: meetup.type,
        link: meetup.link || "",
        maxSeats: meetup.maxSeats || null,
        attendeesCount: meetup.attendees.length,
        hasJoined,
        attendees: meetup.attendees.map((att: any) => ({
          id: att._id.toString(),
          name: att.name,
          username: att.username,
          avatar: att.avatar,
        })),
      };
    });

    return NextResponse.json({ meetups });
  } catch (error) {
    console.error("Error fetching meetups:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
