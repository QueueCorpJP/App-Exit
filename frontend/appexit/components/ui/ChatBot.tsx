'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function ChatBot() {
  const locale = useLocale();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp: Date }>>([
    {
      text: t('chatbotWelcome'),
      isUser: false,
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = () => {
    if (message.trim() === '') return;

    // ユーザーメッセージを追加
    const newMessages = [
      ...messages,
      {
        text: message,
        isUser: true,
        timestamp: new Date()
      }
    ];
    setMessages(newMessages);
    setMessage('');

    // ボットの自動応答（実際の機能は未実装）
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          text: t('chatbotResponse'),
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center z-50 group overflow-hidden"
        aria-label={t('openChatbot')}
      >
        <img
          src="/chat.png"
          alt={t('chat')}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
        />
      </button>
    );
  }

  return (
    <div
      className={`fixed right-6 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
        isMinimized
          ? 'bottom-6 w-80 h-14'
          : 'bottom-6 w-96 h-[600px]'
      }`}
      style={{ maxWidth: 'calc(100vw - 3rem)' }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between p-4 rounded-t-lg cursor-pointer border-b"
        style={{ backgroundColor: '#323232', borderColor: '#323232' }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fff' }}>
              <MessageCircle className="w-5 h-5" style={{ color: '#323232' }} />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: '#fff' }}>
              {t('appexitSupport')}
            </h3>
            <p className="text-xs" style={{ color: '#fff', opacity: 0.9 }}>
              {t('askQuestion')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1.5 rounded transition-colors hover:bg-white/10"
            aria-label={isMinimized ? t('expand') : t('minimize')}
          >
            <Minimize2 className="w-5 h-5" style={{ color: '#fff' }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="p-1.5 rounded transition-colors hover:bg-white/10"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" style={{ color: '#fff' }} />
          </button>
        </div>
      </div>

      {/* チャットエリア */}
      {!isMinimized && (
        <>
          {/* メッセージ一覧 */}
          <div className="h-[calc(100%-8rem)] overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#fff' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${msg.isUser ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-lg px-4 py-2.5 border ${
                      msg.isUser
                        ? 'rounded-br-none'
                        : 'rounded-bl-none'
                    }`}
                    style={{
                      backgroundColor: msg.isUser ? '#323232' : '#fff',
                      color: msg.isUser ? '#fff' : '#323232',
                      borderColor: '#323232'
                    }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  <p className={`text-xs mt-1 ${msg.isUser ? 'text-right' : 'text-left'}`} style={{ color: '#323232', opacity: 0.6 }}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 入力エリア */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t rounded-b-lg" style={{ backgroundColor: '#fff', borderColor: '#323232' }}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('typeMessage')}
                className="flex-1 px-4 py-2.5 border rounded-full focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{
                  borderColor: '#323232',
                  '--tw-ring-color': '#323232',
                  color: '#323232'
                } as React.CSSProperties}
              />
              <button
                onClick={handleSendMessage}
                disabled={message.trim() === ''}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                style={{ backgroundColor: '#323232' }}
                aria-label={t('submit')}
              >
                <Send className="w-5 h-5" style={{ color: '#fff' }} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
