import { Schema, Types } from 'mongoose';

/**
 * Mongoose schema for the Chat collection.
 *
 * - `participants`: an array of ObjectIds referencing the User collection.
 * - `messages`: an array of ObjectIds referencing the Message collection.
 * - Timestamps store `createdAt` & `updatedAt`.
 */
// TODO: Task 3 - Define the schema for the Chat
const chatSchema = new Schema(
  {
    // Array of usernames (strings) participating in the chat
    participants: {
      type: [String],
      required: true,
      validate: [(arr: string[]) => arr.length > 0, 'Participants cannot be empty'],
    },

    // Array of ObjectIds referencing the Message collection
    messages: [
      {
        type: Types.ObjectId,
        ref: 'Message',
      },
    ],
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  },
);

export default chatSchema;
