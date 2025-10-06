// src/types/chat.ts

export interface Message {
    sender: string;
    content: string;
    // FIX: Use string to represent the Java LocalDateTime
    timestamp: string;
    // ✅ Optional recipient for private messages
    recipient?: string;
}
