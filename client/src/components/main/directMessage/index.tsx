import React from 'react';
import './index.css';
import useDirectMessage from '../../../hooks/useDirectMessage';
import ChatsListCard from './chatsListCard';
import UsersListPage from '../usersListPage';
import MessageCard from '../messageCard';

/**
 * DirectMessage component renders a page for direct messaging between users.
 * It includes a list of users and a chat window to send and receive messages.
 */
const DirectMessage = () => {
  const {
    selectedChat,
    chatToCreate,
    chats,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    handleUserSelect,
    handleCreateChat,
  } = useDirectMessage();

  return (
    <>
      <div className='create-panel'>
        <button
          className='custom-button'
          onClick={() => setShowCreatePanel(prevState => !prevState)}>
          {showCreatePanel ? 'Hide Create Chat Panel' : 'Start a Chat'}
        </button>

        {/* ✅ Task 3 - Create Chat Panel UI */}
        {showCreatePanel && (
          <>
            <p>Selected user: {chatToCreate || 'None'}</p>
            <button className='custom-button' onClick={handleCreateChat} disabled={!chatToCreate}>
              Create Chat
            </button>
            <UsersListPage handleUserSelect={handleUserSelect} />
          </>
        )}
      </div>

      <div className='direct-message-container'>
        <div className='chats-list'>
          {/* ✅ Task 3 - Render list of existing chats */}
          {chats.map(chat => (
            <ChatsListCard
              key={chat._id}
              chat={chat}
              handleChatSelect={() => handleChatSelect(chat._id)}
            />
          ))}
        </div>

        <div className='chat-container'>
          {selectedChat ? (
            <>
              <h2>Chat Participants: {selectedChat.participants.join(', ')}</h2>
              <div className='chat-messages'>
                {/* ✅ Task 3 - Render chat messages */}
                {selectedChat.messages.map(message => (
                  <MessageCard key={message._id} message={message} />
                ))}
              </div>
              <div className='message-input'>
                {/* ✅ Task 3 - Message input */}
                <input
                  type='text'
                  className='custom-input'
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder='Type a message...'
                />
                <button
                  className='custom-button'
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <h2>Select a user to start chatting</h2>
          )}
        </div>
      </div>
    </>
  );
};

export default DirectMessage;
