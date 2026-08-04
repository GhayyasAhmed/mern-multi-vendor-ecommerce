import mongoose, { Document, Schema } from "mongoose";

export interface IMessageImage {
  public_id?: string;
  url?: string;
}

export interface IMessage extends Document {
  conversationId?: string;
  text?: string;
  sender?: string;
  images?: IMessageImage;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema: Schema<IMessage> = new mongoose.Schema(
  {
    conversationId: {
      type: String,
    },
    text: {
      type: String,
    },
    sender: {
      type: String,
    },
    images: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1 });

const MessageModel = mongoose.model<IMessage>("Messages", messageSchema);

export default MessageModel;