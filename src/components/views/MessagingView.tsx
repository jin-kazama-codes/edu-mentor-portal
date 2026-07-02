/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Search,
  Send,
  Hash,
  User,
  Check,
  CheckCheck,
  Volume2,
  Video,
  Phone,
  Paperclip,
  Smile,
  Plus,
  ShieldAlert,
  Sparkles
} from 'lucide-react';


interface ChatChannel {
  id: string;
  name: string;
  type: 'channel' | 'direct';
  unreadCount: number;
  subtitle: string;
  avatar?: string;
}

export default function MessagingView() {
  const [channels, setChannels] = useState<ChatChannel[]>([
    { id: 'ch-ann', name: 'announcements', type: 'channel', unreadCount: 2, subtitle: 'Public announcements broadcast' },
    { id: 'ch-calc', name: 'calculus-doubt-room', type: 'channel', unreadCount: 0, subtitle: 'Group calculus reviews' },
    { id: 'ch-parent-tariq', name: 'Tariq Khan (Parent)', type: 'direct', unreadCount: 1, subtitle: 'Zoya\'s parent', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { id: 'ch-mentor-aadil', name: 'Aadil Bhat (Mentor)', type: 'direct', unreadCount: 0, subtitle: 'Physics & Math faculty', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'ch-parent-shafi', name: 'Mehreen Yusuf (Parent)', type: 'direct', unreadCount: 0, subtitle: 'Bisma\'s parent', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' }
  ]);

  const [activeChannelId, setActiveChannelId] = useState('ch-parent-tariq');
  const [searchQuery, setSearchQuery] = useState('');
  const [textInput, setTextInput] = useState('');
  
  // Manage conversation messages inside UI state to support live appending and AI simulation
  const [conversationStreams, setConversationStreams] = useState<Record<string, Array<{
    id: string;
    sender: string;
    avatar?: string;
    text: string;
    time: string;
    isSelf: boolean;
  }>>>({
    'ch-parent-tariq': [
      { id: 'm-1', sender: 'Tariq Khan', text: 'Assalamu alaikum Aadil sir, wanted to check on Zoyas scores in derivatives mock test?', time: '10:14 AM', isSelf: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
      { id: 'm-2', sender: 'Aadil Bhat', text: 'Wa alaikumussalam Tariq sahab! Zoya scored 9/10. She did beautifully, although she made a quick algebraic error in the last quotient rule problem. Nothing to worry about.', time: '10:20 AM', isSelf: true }
    ],
    'ch-ann': [
      { id: 'm-ann-1', sender: 'System Node', text: 'Weekly faculty review has been set for Saturday morning at 10:00 AM UTC. Please ensure all student reports are drafted.', time: 'June 28', isSelf: false }
    ],
    'ch-calc': [
      { id: 'm-calc-1', sender: 'Bisma Yusuf', text: 'Can anyone explain why the limits calculation returns undefined for composite boundary fractions?', time: '09:00 AM', isSelf: false, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' }
    ]
  });

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat stream to bottom when message arrives
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversationStreams, activeChannelId]);

  const handleSendMessage = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;

    const currentStream = conversationStreams[activeChannelId] || [];
    const userMsg = {
      id: `live-m-${Date.now()}`,
      sender: 'Super Admin',
      text: textInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };

    setConversationStreams((prev) => ({
      ...prev,
      [activeChannelId]: [...currentStream, userMsg]
    }));

    setTextInput('');

    // Clear unreads
    setChannels((prev) =>
      prev.map((ch) => (ch.id === activeChannelId ? { ...ch, unreadCount: 0 } : ch))
    );

    // Simulate reactive parent reply if texting Tariq
    if (activeChannelId === 'ch-parent-tariq') {
      setTimeout(() => {
        const replyMsg = {
          id: `live-reply-${Date.now()}`,
          sender: 'Tariq Khan',
          avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
          text: 'Thank you for the update sir. I will sit with her this evening to review her quotient calculations and keep her stress free. Looking forward to the scheduled parent meeting!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false
        };
        setConversationStreams((prev) => ({
          ...prev,
          [activeChannelId]: [...(prev[activeChannelId] || []), replyMsg]
        }));
      }, 2500);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const activeChannel = channels.find((ch) => ch.id === activeChannelId);
  const activeMessages = conversationStreams[activeChannelId] || [];

  return (
    <div className="h-[calc(100vh-170px)] flex flex-col md:flex-row bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-850 overflow-hidden shadow-sm">
      
      {/* Sidebar: Channels/Threads list (4 columns equivalence) */}
      <div className="w-full md:w-80 border-r border-slate-100 dark:border-slate-850 flex flex-col shrink-0 bg-slate-50/50 dark:bg-slate-900/10">
        
        {/* Workspace Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-850 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>SaaS Messages</span>
            </h3>
            <span className="p-1 rounded-lg hover:bg-slate-150 text-slate-400 hover:text-slate-600 cursor-pointer">
              <Plus className="w-4 h-4" />
            </span>
          </div>
          <div className="relative">
            <Search className="absolute inset-y-0 left-3 h-3.5 w-3.5 my-auto text-slate-400" />
            <input
              type="text"
              placeholder="Search workspaces or direct threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.2 text-xs rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        {/* Directory Groups */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-5">
          
          {/* Discussion Channels list */}
          <div>
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-2">Discussion Rooms</span>
            <div className="space-y-1">
              {channels
                .filter((ch) => ch.type === 'channel' && ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((ch) => {
                  const isSelected = ch.id === activeChannelId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => { setActiveChannelId(ch.id); }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-bold' 
                          : 'hover:bg-slate-150 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Hash className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        <span className="text-xs truncate">{ch.name}</span>
                      </div>
                      {ch.unreadCount > 0 && !isSelected && (
                        <span className="bg-rose-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full shrink-0">
                          {ch.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Direct threads list */}
          <div>
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-2">Private Mentors & Parents</span>
            <div className="space-y-1">
              {channels
                .filter((ch) => ch.type === 'direct' && ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((ch) => {
                  const isSelected = ch.id === activeChannelId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => { setActiveChannelId(ch.id); }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/10' 
                          : 'hover:bg-slate-150 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {ch.avatar ? (
                          <img
                            src={ch.avatar}
                            alt={ch.name}
                            referrerPolicy="no-referrer"
                            className="w-6.5 h-6.5 rounded-md object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <User className={`w-6.5 h-6.5 rounded-md p-1 bg-slate-100 dark:bg-slate-850 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs truncate font-bold leading-normal">{ch.name}</h4>
                          <p className={`text-[9px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{ch.subtitle}</p>
                        </div>
                      </div>
                      {ch.unreadCount > 0 && !isSelected && (
                        <span className="bg-rose-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full shrink-0">
                          {ch.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

        </div>

      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-800">
        
        {/* Chat Stream Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between shrink-0 bg-slate-50/10">
          <div className="flex items-center gap-2 min-w-0">
            {activeChannel?.type === 'channel' ? (
              <Hash className="w-5 h-5 text-slate-400 shrink-0" />
            ) : (
              <User className="w-5 h-5 text-blue-500 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-xs truncate">
                {activeChannel?.name || 'Conversation thread'}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">{activeChannel?.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
              <Video className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message scroll container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/10 dark:bg-slate-900/5"
        >
          {activeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.isSelf ? 'justify-end' : 'justify-start'}`}
            >
              {!msg.isSelf && msg.avatar && (
                <img
                  src={msg.avatar}
                  alt={msg.sender}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-100 shrink-0 shadow-xs"
                />
              )}
              <div className={`max-w-[70%] space-y-1 ${msg.isSelf ? 'order-1' : 'order-2'}`}>
                {/* Meta details */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-250 text-[10px]">{msg.sender}</span>
                  <span className="text-[8px] text-slate-400 font-mono">{msg.time}</span>
                </div>
                {/* Message Body Bubble */}
                <div className={`p-3 rounded-2xl text-[11.5px] leading-relaxed ${
                  msg.isSelf
                    ? 'bg-blue-600 text-white font-semibold rounded-tr-xs'
                    : 'bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-tl-xs'
                }`}>
                  <p>{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          {activeMessages.length === 0 && (
            <div className="py-24 text-center text-slate-400 text-xs">
              Secure messaging timeline begins here. Direct chat transcripts are locked.
            </div>
          )}
        </div>

        {/* Chat input box */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-850 shrink-0 bg-white dark:bg-slate-800">
          <form onSubmit={handleSendMessage} className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl items-center">
            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400">
              <Paperclip className="w-4.5 h-4.5" />
            </button>
            
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Write a reply to ${activeChannel?.name}...`}
              className="flex-1 min-w-0 bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none placeholder-slate-400 font-medium"
            />

            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400">
              <Smile className="w-4.5 h-4.5" />
            </button>
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
