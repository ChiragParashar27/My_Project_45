// src/app/chat/page.tsx - GLOBAL CHAT ONLY VERSION (FIXED CONNECTION)

'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import moment from 'moment';
import React from 'react';
// Note: apiClient is not used in this global-only version.

let stompClient: Client | null = null;
const API_BASE_URL = 'http://localhost:8080/api';
// Interface for chat message DTO (matching backend Message.java)
interface Message {
    sender: string;
    content: string;
    timestamp: string | Date;
    recipient?: string; 
}

const ChatContent = () => {
    const { user } = useAuthStore();
    const accessToken = useAuthStore((state) => state.token);
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // All private/history states removed

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    const connect = () => {
        if (!user || !accessToken) {
            console.error("User or token missing. Cannot connect.");
            return;
        }

        // --- CORE FIX: Remove token from query param in the factory ---
        // SockJS connection must use the simple /ws URL for the initial HTTP handshake.
        const webSocketFactory = () => {
             return new SockJS(`http://localhost:8080/ws`); 
        };
        
        // Pass Authorization header in connectHeaders (for the STOMP CONNECT frame)
        const connectHeaders = { 
            'Authorization': `Bearer ${accessToken}`,
        };

        stompClient = new Client({
            webSocketFactory: webSocketFactory, 
            reconnectDelay: 5000,
            connectHeaders: connectHeaders, // This is where WsAuthChannelInterceptor reads the JWT
        });

        stompClient.onConnect = () => {
            console.log('Connected to STOMP');
            setIsConnected(true);

            setTimeout(() => {
                // Subscribe ONLY to PUBLIC messages
                stompClient!.subscribe('/topic/messages', (message: IMessage) => {
                    const newMessage: Message = JSON.parse(message.body);
                    setMessages((prev) => [...prev, newMessage]);
                });
            }, 50); 
        };

        stompClient.onStompError = (frame) => {
            console.error('STOMP Error: Connection Forbidden', frame);
            setIsConnected(false);
        };

        stompClient.activate();
    };

    useEffect(() => {
        if (user && accessToken) connect(); 

        return () => {
            stompClient?.deactivate();
        };
    // Dependency array ensures reconnection if token changes (though usually not needed)
    }, [user, accessToken]); 

    useEffect(scrollToBottom, [messages]);

    const sendMessage = (e: FormEvent<HTMLFormElement>) => { 
        e.preventDefault();
        if (!stompClient || !user || inputMessage.trim() === '') return;

        const chatMessage: Message = {
            sender: user.name, // The backend will override this securely with Principal.getName()
            content: inputMessage,
            timestamp: new Date(),
        };

        stompClient.publish({
            destination: '/app/chat', // Global destination
            body: JSON.stringify(chatMessage),
            headers: {}
        });
        
        setInputMessage('');
    };


    return (
        <div className="flex flex-col min-h-[80vh] max-w-4xl mx-auto shadow-lg rounded-lg border bg-white">
            
            <h1 className="text-2xl font-bold text-gray-800 p-4 border-b">
                Global EMS Chat 
                <span className={`ml-2 text-xs font-semibold px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
            </h1>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!isConnected && (
                    <div className="text-center text-red-500">
                        Attempting to connect...
                    </div>
                )}
                
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.sender === user?.name ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs px-4 py-2 rounded-xl ${
                                msg.sender === user?.name
                                    ? 'bg-indigo-500 text-white rounded-tr-none'
                                    : 'bg-gray-200 text-gray-800 rounded-tl-none'
                            }`}
                        >
                            <p className="font-semibold text-xs mb-1">{msg.sender}</p>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                                {moment(msg.timestamp).format('HH:mm A')}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t flex">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isConnected ? 'Message Global EMS Chat...' : 'Connecting...'}
                    disabled={!isConnected}
                    className="flex-1 px-4 py-2 border rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                    type="submit"
                    disabled={!isConnected || inputMessage.trim() === ''}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-r-md hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default function ChatPage() {
    return (
        <ProtectedRoute requiredRole="EMPLOYEE">
            <ChatContent />
        </ProtectedRoute>
    );
}   