'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { getGatewayWsUrl } from '@/lib/gateway';
import { useToast } from '@/components/toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamBufferRef = useRef('');
  const { toast } = useToast();

  useEffect(() => {
    const ws = new WebSocket(getGatewayWsUrl());
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      toast('error', 'Connection lost');
    };
    ws.onerror = () => {
      setConnected(false);
      toast('error', 'Connection error');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'stream' && data.data.content) {
        streamBufferRef.current += data.data.content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.id === 'streaming') {
            return [...prev.slice(0, -1), { ...last, content: streamBufferRef.current }];
          }
          return [...prev, { id: 'streaming', role: 'assistant', content: streamBufferRef.current }];
        });
      }

      if (data.type === 'done') {
        setMessages(prev =>
          prev.map(m => m.id === 'streaming' ? { ...m, id: data.data.messageId || 'done' } : m)
        );
        streamBufferRef.current = '';
        setLoading(false);
        if (data.sessionId) setSessionId(data.sessionId);
      }

      if (data.type === 'error') {
        setLoading(false);
        streamBufferRef.current = '';
        toast('error', data.data?.message || 'Something went wrong');
      }
    };

    return () => ws.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || loading || !wsRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    streamBufferRef.current = '';

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: input,
      sessionId,
    }));
  };

  const MAX_LENGTH = 4000;

  return (
    <div className="flex h-full flex-col">
      <header className="page-header">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Chat</h1>
          {sessionId && connected && (
            <span className="badge-blue">{sessionId.slice(0, 8)}</span>
          )}
        </div>
        <span className={connected ? 'badge-green' : 'badge-red'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </header>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-500 animate-fade-in">
            <div className="text-center">
              <Bot size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-300">Start a conversation</p>
              <p className="text-sm mt-1">Your AI agent is ready to help</p>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600">
                <Bot size={16} />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
            {msg.role === 'user' && (
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3 animate-slide-up">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600">
              <Bot size={16} />
            </div>
            <div className="rounded-xl bg-gray-800 px-4 py-3 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-800 px-6 py-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="input w-full pr-16"
              disabled={loading}
            />
            {input.length > MAX_LENGTH * 0.8 && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                input.length >= MAX_LENGTH ? 'text-red-400' : 'text-gray-500'
              }`}>
                {input.length}/{MAX_LENGTH}
              </span>
            )}
          </div>
          <button
            onClick={sendMessage}
            className="btn-primary flex items-center gap-2"
            disabled={loading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
