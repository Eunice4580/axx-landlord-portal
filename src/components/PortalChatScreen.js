import React, { useState } from 'react';
import ChatInboxScreen from '../screens/ChatInboxScreen';
import ChatThreadScreen from '../screens/ChatThreadScreen';

/**
 * Inbox + thread for the self-contained portals (accommodation, agent,
 * biashara) that do not use the landlord navigation stack.
 */
export default function PortalChatScreen({ user, tokenKey }) {
  const [activeConversation, setActiveConversation] = useState(null);

  if (activeConversation) {
    return (
      <ChatThreadScreen
        conversationId={activeConversation._id}
        peerName={activeConversation.peer?.name || 'Conversation'}
        contextTitle={activeConversation.contextTitle}
        myId={user?._id || user?.id}
        tokenKey={tokenKey}
        onBack={() => setActiveConversation(null)}
      />
    );
  }

  return (
    <ChatInboxScreen
      user={user}
      tokenKey={tokenKey}
      onOpenThread={setActiveConversation}
    />
  );
}
