import mongoose, { Document, Schema } from "mongoose";

export interface IConversationParticipant {
  id: string;
  name: string;
  avatar?: string;
}

export interface IConversation extends Document {
  groupTitle: string;
  members: string[];
  userId: string;
  sellerId: string;
  user: IConversationParticipant;
  seller: IConversationParticipant;
  lastMessage?: string;
  lastMessageId?: string;
  unreadCounts?: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IConversationParticipant>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
  },
  { _id: false }
);

const conversationSchema: Schema<IConversation> = new mongoose.Schema(
  {
    groupTitle: {
      type: String,
      required: true,
      unique: true,
    },
    members: {
      type: [String],
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    sellerId: {
      type: String,
      required: true,
    },
    user: {
      type: participantSchema,
      required: true,
    },
    seller: {
      type: participantSchema,
      required: true,
    },
    lastMessage: {
      type: String,
    },
    lastMessageId: {
      type: String,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ members: 1 });
conversationSchema.index({ userId: 1 });
conversationSchema.index({ sellerId: 1 });

const ConversationModel = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);

export default ConversationModel;