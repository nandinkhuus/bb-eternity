import mongoose, { Schema, Document } from "mongoose";

export interface AirportContentDoc extends Document {
  title: string;
  content: string;
  images: string[];
  videos: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<AirportContentDoc>(
  {
    title: { type: String, required: true },
    content: { type: String, default: "" },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AirportContent = mongoose.model<AirportContentDoc>("AirportContent", schema);
