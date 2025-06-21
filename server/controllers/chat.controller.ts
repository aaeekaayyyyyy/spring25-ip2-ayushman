import express, { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import {
  saveChat,
  createMessage,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
} from '../services/chat.service';
import { populateDocument } from '../utils/database.util';
import {
  CreateChatRequest,
  AddMessageRequestToChat,
  AddParticipantRequest,
  ChatIdRequest,
  GetChatByParticipantsRequest,
  ChatUpdatePayload,
  ChatResponse,
  Chat,
} from '../types/chat';
import { FakeSOSocket } from '../types/socket';
import UserModel from '../models/users.model';

/*
 * This controller handles chat-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the chat routes.
 * @throws {Error} Throws an error if the chat creation fails.
 */
const chatController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Validates that the request body contains all required fields for a chat.
   * @param req The incoming request containing chat data.
   * @returns `true` if the body contains valid chat fields; otherwise, `false`.
   */
  const isCreateChatRequestValid = (req: CreateChatRequest): boolean =>
    // TODO: Task 3 - Implement the isCreateChatRequestValid function.
    {
      const { participants, messages } = req.body;

      // Validate participants: must be non-empty array of valid ObjectIds
      if (!Array.isArray(participants) || participants.length === 0) {
        return false;
      }

      // Validate messages if provided
      if (messages !== undefined) {
        if (!Array.isArray(messages)) return false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isValidMessage = (msg: any) =>
          msg &&
          typeof msg === 'object' &&
          typeof msg.msg === 'string' &&
          msg.msg.trim() !== '' &&
          isValidObjectId(msg.msgFrom);

        if (!messages.every(isValidMessage)) return false;
      }

      return true;
    };

  /**
   * Validates that the request body contains all required fields for a message.
   * @param req The incoming request containing message data.
   * @returns `true` if the body contains valid message fields; otherwise, `false`.
   */
  const isAddMessageRequestValid = (req: AddMessageRequestToChat): boolean =>
    // TODO: Task 3 - Implement the isAddMessageRequestValid function.
    {
      const { msg, msgFrom, msgDateTime } = req.body;

      // msg must be a non-empty string
      if (typeof msg !== 'string' || msg.trim() === '') return false;

      // msgFrom must be a valid ObjectId
      if (!msgFrom || !isValidObjectId(msgFrom)) return false;

      // msgDateTime is optional but if present must be a valid date
      if (msgDateTime !== undefined) {
        const date = new Date(msgDateTime);
        if (Number.isNaN(date.getTime())) return false;
      }

      return true;
    };

  /**
   * Validates that the request body contains all required fields for a participant.
   * @param req The incoming request containing participant data.
   * @returns `true` if the body contains valid participant fields; otherwise, `false`.
   */
  const isAddParticipantRequestValid = (req: AddParticipantRequest): boolean =>
    // TODO: Task 3 - Implement the isAddParticipantRequestValid function.
    {
      const { participantId } = req.body;

      // Ensure it's a valid ObjectId
      if (!participantId || !isValidObjectId(participantId)) return false;

      return true;
    };

  /**
   * Creates a new chat with the given participants (and optional initial messages).
   * @param req The request object containing the chat data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is created.
   * @throws {Error} Throws an error if the chat creation fails.
   */
  const createChatRoute = async (req: CreateChatRequest, res: Response): Promise<void> => {
    // TODO: Task 3 - Implement the createChatRoute function
    // Emit a `chatUpdate` event to share the creation of a new chat
    if (!isCreateChatRequestValid(req)) {
      res.status(400).send('Invalid chat creation request.');
      return;
    }

    try {
      const chat = await saveChat(req.body);

      if ('error' in chat || !chat._id) {
        res.status(500).send('Failed to save chat.');
        return;
      }
      const populatedChat = (await populateDocument(chat._id?.toString(), 'chat')) as ChatResponse;

      // Ensure chat is valid before emitting
      if ('error' in populatedChat) {
        res.status(500).send('Failed to populate chat.');
        return;
      }

      const payload: ChatUpdatePayload = {
        chat: populatedChat,
        type: 'created',
      };

      socket.emit('chatUpdate', payload);
      res.status(201).json(populatedChat);
    } catch (error) {
      res.status(500).send('Failed to create chat.');
    }
  };

  /**
   * Adds a new message to an existing chat.
   * @param req The request object containing the message data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the message is added.
   * @throws {Error} Throws an error if the message addition fails.
   */
  const addMessageToChatRoute = async (
    req: AddMessageRequestToChat,
    res: Response,
  ): Promise<void> => {
    // TODO: Task 3 - Implement the addMessageToChatRoute function
    // Emit a `chatUpdate` event to share the updated chat, specifically to
    // the chat room where the message was added (hint: look into socket rooms)
    // NOTE: Make sure to define the message type to be a direct message when creating it.
    if (!isAddMessageRequestValid(req)) {
      res.status(400).send('Invalid message data.');
      return;
    }

    const { chatId } = req.params;

    try {
      const { msg, msgFrom, msgDateTime } = req.body;

      const message = await createMessage({
        msg,
        msgFrom: msgFrom.toString(),
        msgDateTime: msgDateTime ?? new Date(),
        type: 'direct',
      });

      if ('error' in message || !message._id) {
        res.status(500).send('Failed to create message.');
        return;
      }

      const chat = await addMessageToChat(chatId, message._id.toString());

      if ('error' in chat || !chat._id) {
        res.status(500).send('Failed to update chat with new message.');
        return;
      }

      const populated = (await populateDocument(chat._id.toString(), 'chat')) as Chat;

      if ('error' in populated) {
        res.status(500).send('Failed to populate updated chat.');
        return;
      }

      const payload: ChatUpdatePayload = {
        chat: populated,
        type: 'newMessage',
      };

      socket.to(chatId).emit('chatUpdate', payload);
      res.status(200).json(populated);
    } catch (error) {
      res.status(500).send('Failed to add message to chat.');
    }
  };

  /**
   * Retrieves a chat by its ID, optionally populating participants and messages.
   * @param req The request object containing the chat ID.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is retrieved.
   * @throws {Error} Throws an error if the chat retrieval fails.
   */
  const getChatRoute = async (req: ChatIdRequest, res: Response): Promise<void> => {
    // TODO: Task 3 - Implement the getChatRoute function
    const { chatId } = req.params;

    if (!isValidObjectId(chatId)) {
      res.status(400).send('Invalid chat ID.');
      return;
    }

    try {
      const chat = await getChat(chatId);

      // Narrow down the ChatResponse type
      if ('error' in chat) {
        res.status(404).send(chat.error);
        return;
      }

      const populatedChat = await populateDocument(chat._id?.toString(), 'chat');
      res.status(200).json(populatedChat);
    } catch (error) {
      res.status(500).send('Failed to retrieve chat.');
    }
  };

  /**
   * Retrieves chats for a user based on their username.
   * @param req The request object containing the username parameter in `req.params`.
   * @param res The response object to send the result, either the populated chats or an error message.
   * @returns {Promise<void>} A promise that resolves when the chats are successfully retrieved and populated.
   */
  const getChatsByUserRoute = async (
    req: GetChatByParticipantsRequest,
    res: Response,
  ): Promise<void> => {
    // TODO: Task 3 - Implement the getChatsByUserRoute function
    const { username } = req.params;

    try {
      const user = await UserModel.findOne({ username });

      if (!user) {
        res.status(404).send('User not found.');
        return;
      }

      const chats = await getChatsByParticipants([user._id]);

      const populatedChats = await Promise.all(
        chats.map(async chat => {
          const populated = await populateDocument(chat._id?.toString(), 'chat');
          return 'error' in populated ? null : populated;
        }),
      );

      res.status(200).json(populatedChats.filter(Boolean));
    } catch (error) {
      res.status(500).send('Failed to retrieve user chats.');
    }
  };

  /**
   * Adds a participant to an existing chat.
   * @param req The request object containing the participant data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the participant is added.
   * @throws {Error} Throws an error if the participant addition fails.
   */
  const addParticipantToChatRoute = async (
    req: AddParticipantRequest,
    res: Response,
  ): Promise<void> => {
    // TODO: Task 3 - Implement the addParticipantToChatRoute function
    if (!isAddParticipantRequestValid(req)) {
      res.status(400).send('Invalid participant data.');
      return;
    }

    const { chatId } = req.params;
    const { participantId } = req.body;

    try {
      const updatedChat = await addParticipantToChat(chatId, participantId.toString());

      if ('error' in updatedChat) {
        res.status(404).send(updatedChat.error);
        return;
      }

      const populatedChat = await populateDocument(updatedChat._id?.toString(), 'chat');

      if ('error' in populatedChat) {
        res.status(500).send(populatedChat.error);
        return;
      }

      res.status(200).json(populatedChat);
    } catch (error) {
      res.status(500).send('Failed to add participant.');
    }
  };

  socket.on('connection', conn => {
    // TODO: Task 3 - Implement the `joinChat` event listener on `conn`
    // The socket room will be defined to have the chat ID as the room name
    // TODO: Task 3 - Implement the `leaveChat` event listener on `conn`
    // You should only leave the chat if the chat ID is provided/defined
    conn.on('joinChat', (chatId: string | undefined) => {
      if (chatId && isValidObjectId(chatId)) {
        conn.join(chatId);
      }
    });

    conn.on('leaveChat', (chatId: string | undefined) => {
      if (chatId && isValidObjectId(chatId)) {
        conn.leave(chatId);
      }
    });
  });

  // Register the routes
  // TODO: Task 3 - Add appropriate HTTP verbs and endpoints to the router
  router.post('/createChat', createChatRoute);
  router.post('/:chatId/addMessage', addMessageToChatRoute);
  router.get('/:chatId', getChatRoute);
  router.get('/getChatsByUser/:username', getChatsByUserRoute);
  router.post('/:chatId/participant', addParticipantToChatRoute);

  return router;
};

export default chatController;
