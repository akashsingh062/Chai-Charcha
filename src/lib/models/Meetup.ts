import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Meetup extends Document {
  title: string;
  description?: string;
  dateTime: Date;
  location: string;
  type: 'online' | 'offline';
  link?: string;
  attendees: mongoose.Types.ObjectId[];
  maxSeats?: number;
}

export const MeetupSchema = new Schema<Meetup>({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  dateTime: {
    type: Date,
    required: [true, "Date and Time is required"],
  },
  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true,
  },
  type: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online',
  },
  link: {
    type: String,
    trim: true,
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  maxSeats: {
    type: Number,
  }
}, { timestamps: true });

export const Meetup = mongoose.models.Meetup as Model<Meetup> || mongoose.model<Meetup>("Meetup", MeetupSchema, "meetup");
