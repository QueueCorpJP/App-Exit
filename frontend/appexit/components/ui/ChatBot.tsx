'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp: Date }>>([
    {
      text: 'こんにちは！AppExitのサポートチャットボットです。ご質問がありましたらお気軽にお聞きください。',
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
          text: 'ご質問ありがとうございます。現在、チャットボット機能は準備中です。お急ぎの場合は、お問い合わせフォームからご連絡ください。',
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
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
        style={{ backgroundColor: '#E65D65' }}
        aria-label="チャットボットを開く"
      >
        <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
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
        className="flex items-center justify-between p-4 rounded-t-lg cursor-pointer"
        style={{ backgroundColor: '#E65D65' }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <MessageCircle className="w-5 h-5" style={{ color: '#E65D65' }} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="font-bold text-white text-base">AppExit サポート</h3>
            <p className="text-white text-xs opacity-90">オンライン</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label={isMinimized ? '展開' : '最小化'}
          >
            <Minimize2 className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* チャットエリア */}
      {!isMinimized && (
        <>
          {/* メッセージ一覧 */}
          <div className="h-[calc(100%-8rem)] overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#F9F8F7' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${msg.isUser ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-lg px-4 py-2.5 ${
                      msg.isUser
                        ? 'rounded-br-none'
                        : 'rounded-bl-none'
                    }`}
                    style={{
                      backgroundColor: msg.isUser ? '#E65D65' : '#fff',
                      color: msg.isUser ? '#fff' : '#323232'
                    }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 入力エリア */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
              />
              <button
                onClick={handleSendMessage}
                disabled={message.trim() === ''}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                style={{ backgroundColor: '#E65D65' }}
                aria-label="送信"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
