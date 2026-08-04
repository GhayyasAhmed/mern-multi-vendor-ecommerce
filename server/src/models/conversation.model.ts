import mongoose, { Document, Schema } from "mongoose";

export interface IConversation extends Document {
  groupTitle?: string;
  members: string[];
  lastMessage?: string;
  lastMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema: Schema<IConversation> = new mongoose.Schema(
  {
    groupTitle: {
      type: String,
    },
    members: {
      type: [String],
      required: true,
    },
    lastMessage: {
      type: String,
    },
    lastMessageId: {
      type: String,
    },
  },
  { timestamps: true }
);

const ConversationModel = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);

export default ConversationModel;