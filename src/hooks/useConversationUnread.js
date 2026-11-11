import { useEffect, useRef, useState } from 'react';
import { conversationsAPI } from '../services/api';
import { isRemotePushRegistered, notifyLocally } from '../services/push';

const POLL_MS = 60000;

export default function useConversationUnread(tokenKey = 'token', enabled = true) {
  const [unread, setUnread] = useState(0);
  const previousRef = useRef(0);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    if (!enabled) {
      firstLoadRef.current = true;
      previousRef.current = 0;
      setUnread(0);
      return undefined;
    }
    let active = true;

    const load = async () => {
      try {
        const res = await conversationsAPI.summary(tokenKey);
        const next = Number(res?.totalUnread) || 0;
        if (!active) return;
        setUnread(next);
        if (
          !firstLoadRef.current &&
          next > previousRef.current &&
          !isRemotePushRegistered(tokenKey)
        ) {
          const added = next - previousRef.current;
          notifyLocally({
            title: 'New message',
            body:
              added === 1
                ? 'You have a new message.'
                : `You have ${added} new messages.`,
            data: { type: 'message' },
          });
        }
        firstLoadRef.current = false;
        previousRef.current = next;
      } catch {
        // Badge is best-effort; the inbox surfaces real errors.
      }
    };

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tokenKey, enabled]);

  return unread;
}
