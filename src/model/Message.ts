import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage extends Document {
  userId: Types.ObjectId;
  content: string;
  createdAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [300, "Message must be no longer than 300 characters"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const MessageModel =
  (mongoose.models.Message as mongoose.Model<IMessage>) ||
  mongoose.model<IMessage>("Message", MessageSchema);

export default MessageModel;
