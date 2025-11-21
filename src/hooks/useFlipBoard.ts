import { useState, useEffect, useCallback } from "react";

interface FlipBoardMessage {
  text: string;
  priority: "high" | "normal";
  timestamp: number;
}

const STORAGE_KEY = "flipboard_messages";
const DEFAULT_MESSAGE = "Welcome to YeoDa Family Dash";
const MESSAGE_DURATION = 10000; // 10 seconds per message
const ROTATION_PAUSE = 5000; // 5 seconds between messages

export function useFlipBoard() {
  const [messages, setMessages] = useState<FlipBoardMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Start with blank characters for visible animation on load
  const [currentMessage, setCurrentMessage] = useState("-".repeat(DEFAULT_MESSAGE.length));
  const [isInitialized, setIsInitialized] = useState(false);

  // Animate on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentMessage(DEFAULT_MESSAGE);
      setIsInitialized(true);
    }, 500); // Slightly longer delay for more visible flip
    return () => clearTimeout(timer);
  }, []);

  // Load messages from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      } catch (e) {
        console.error("Failed to parse flip board messages:", e);
      }
    }
  }, []);

  // Add a new message
  const addMessage = useCallback((text: string, priority: "high" | "normal" = "normal") => {
    const newMessage: FlipBoardMessage = {
      text,
      priority,
      timestamp: Date.now(),
    };

    setMessages((prev) => {
      const updated = [...prev, newMessage].sort((a, b) => {
        // High priority messages first, then by timestamp
        if (a.priority === "high" && b.priority !== "high") return -1;
        if (a.priority !== "high" && b.priority === "high") return 1;
        return b.timestamp - a.timestamp;
      });
      
      // Keep only last 10 messages
      const limited = updated.slice(0, 10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      return limited;
    });
  }, []);

  // Remove old messages (older than 24 hours)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      setMessages((prev) => {
        const filtered = prev.filter((msg) => now - msg.timestamp < dayInMs);
        if (filtered.length !== prev.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }
        return filtered;
      });
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // Rotate through messages
  useEffect(() => {
    if (!isInitialized) return;

    if (messages.length === 0) {
      setCurrentMessage(DEFAULT_MESSAGE);
      return;
    }

    const rotateMessages = () => {
      const message = messages[currentIndex];
      setCurrentMessage(message.text);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
      }, MESSAGE_DURATION + ROTATION_PAUSE);
    };

    rotateMessages();
  }, [messages, currentIndex, isInitialized]);

  // Expose methods for testing and Home Assistant integration
  useEffect(() => {
    // @ts-ignore - Add to window for external access
    window.addFlipBoardMessage = addMessage;
    
    // @ts-ignore - Add test function
    window.testFlipBoard = () => {
      const testMessages = [
        "Soccer practice at 3pm today!",
        "Don't forget dance recital tmrw",
        "Pizza night tonight!",
        "Dentist appointment at 2pm",
        "School assembly tomorrow 9am",
      ];
      const randomMsg = testMessages[Math.floor(Math.random() * testMessages.length)];
      addMessage(randomMsg, "high");
      console.log("🎯 Test message added:", randomMsg);
    };
    
    console.log("🎪 FlipBoard ready! Test with: window.testFlipBoard()");
  }, [addMessage]);

  return {
    currentMessage,
    messages,
    addMessage,
  };
}
