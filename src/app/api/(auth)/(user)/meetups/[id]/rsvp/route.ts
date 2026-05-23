import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Meetup } from "@/lib/models/Meetup";
import mongoose from "mongoose";

// POST /api/meetups/[id]/rsvp - RSVP or toggle participation in a meetup
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const meetup = await Meetup.findById(id);
    if (!meetup) {
      return NextResponse.json({ error: "Meetup not found" }, { status: 404 });
    }

    const userIdObj = new mongoose.Types.ObjectId(session.user.id);
    const hasJoined = meetup.attendees.some((attId) => attId.toString() === session.user.id);

    if (hasJoined) {
      // Pull user out of the list (Cancel RSVP)
      meetup.attendees = meetup.attendees.filter((attId) => attId.toString() !== session.user.id);
    } else {
      // Check if max seats reached
      if (meetup.maxSeats && meetup.attendees.length >= meetup.maxSeats) {
        return NextResponse.json({ error: "Chai table is full! Maximum seats reached for this meetup." }, { status: 400 });
      }
      // Push user into list (Join Meetup)
      meetup.attendees.push(userIdObj);
    }

    await meetup.save();

    // Populate attendees list
    const updatedMeetup = await Meetup.findById(id).populate("attendees", "name username avatar");

    return NextResponse.json({
      success: true,
      hasJoined: !hasJoined,
      attendeesCount: updatedMeetup?.attendees.length || 0,
      attendees: updatedMeetup?.attendees.map((att: any) => ({
        id: att._id.toString(),
        name: att.name,
        username: att.username,
        avatar: att.avatar,
      })) || [],
    });
  } catch (error) {
    console.error("Error toggling meetup RSVP:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
