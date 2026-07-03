/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
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
  Sparkles,
  ChevronLeft
} from 'lucide-react';


import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

interface ChatChannel {
  id: string;
  name: string;
  type: 'channel' | 'direct';
  unreadCount: number;
  subtitle: string;
  avatar?: string;
}

interface MessagingViewProps {
  selectedOrg?: string;
}

export default function MessagingView({ selectedOrg = 'All Organizations' }: MessagingViewProps) {
  const { currentUser } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [textInput, setTextInput] = useState('');
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [notification, setNotification] = useState<{ sender: string; text: string } | null>(null);
  const [adminNames, setAdminNames] = useState<string[]>(['f2fintech', 'codevamo', 'mahin bhat']);

  useEffect(() => {
    if (!currentUser) return;
    async function loadChannels() {
      let query = supabase.from('chat_channels').select('*');
      
      const orgToFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
        : currentUser.organization;
      if (orgToFilter) {
        query = query.eq('organization', orgToFilter);
      }
      
      const { data, error } = await query;
      if (!error && data) {
        let filtered = data;

        // Fetch users in the active organization to identify their roles
        let usersQuery = supabase.from('users').select('id, name, role, organization, mentor_id, avatar');
        if (orgToFilter) {
          usersQuery = usersQuery.eq('organization', orgToFilter);
        }
        const { data: orgUsers, error: usersErr } = await usersQuery;

        if (!usersErr && orgUsers) {
          const mentorsAndAssistants = orgUsers
            .filter(u => u.role === 'Mentor' || u.role === 'Assistant')
            .map(u => u.name.toLowerCase().trim());
          const admins = orgUsers
            .filter(u => u.role === 'Organization Admin' || u.role === 'Super Admin')
            .map(u => u.name.toLowerCase().trim());
          setAdminNames(admins);

          if (currentUser.role === 'Organization Admin' || currentUser.role === 'Super Admin') {
            // Admin chats with Mentors and Assistants
            filtered = data.filter(c =>
              c.type === 'channel' ||
              mentorsAndAssistants.includes(c.name.toLowerCase().trim())
            );
          } else if (currentUser.role === 'Mentor') {
            // Mentor chats with Admin (the channel matching their own name)
            // AND their Assistants (channels matching the assistant's name)
            const myAssistants = orgUsers
              .filter(u => u.role === 'Assistant' && u.mentor_id === currentUser.id)
              .map(u => u.name.toLowerCase().trim());

            filtered = data.filter(c =>
              c.type === 'channel' ||
              c.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim() ||
              myAssistants.includes(c.name.toLowerCase().trim())
            );

            const adminName = orgUsers.find(u => u.role === 'Organization Admin')?.name || 'Organization Admin';
            filtered = filtered.map(c => {
              if (c.type === 'direct' && c.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) {
                return {
                  ...c,
                  name: adminName,
                  subtitle: 'Organization Administrator',
                  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
                };
              }
              return c;
            });
          } else if (currentUser.role === 'Assistant') {
            // Assistant only chats with their Mentor (the channel matching their own name)
            filtered = data.filter(c =>
              c.type === 'channel' ||
              c.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
            );

            const myMentor = orgUsers.find(u => u.id === currentUser.mentor_id);
            const mentorName = myMentor ? myMentor.name : 'Mentor';

            filtered = filtered.map(c => {
              if (c.type === 'direct' && c.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) {
                return {
                  ...c,
                  name: mentorName,
                  subtitle: 'Mentor',
                  avatar: myMentor?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                };
              }
              return c;
            });
          } else {
            // Students or other roles get no channels
            filtered = [];
          }
        }
        setChannels(filtered);
        
        if (filtered.length > 0) {
          const hasActive = filtered.some(c => c.id === activeChannelId);
          if (!hasActive) {
            setActiveChannelId(filtered[0].id);
          }
        } else {
          setActiveChannelId('');
        }
      }
    }
    loadChannels();
  }, [currentUser, selectedOrg]);

  useEffect(() => {
    if (!activeChannelId) {
      setActiveMessages([]);
      return;
    }
    async function loadMessages() {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', activeChannelId)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setActiveMessages(data);
      }
    }
    loadMessages();
  }, [activeChannelId]);

  // Supabase Realtime Postgres Changes Subscription
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg.channel_id === activeChannelId) {
            setActiveMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) {
                return prev;
              }
              return [...prev, newMsg];
            });
          } else {
            // Message in another channel: update unread counter & show toast
            setChannels((prev) =>
              prev.map((ch) => {
                if (ch.id === newMsg.channel_id) {
                  if (newMsg.sender.toLowerCase().trim() !== currentUser.name.toLowerCase().trim()) {
                    setNotification({
                      sender: newMsg.sender,
                      text: newMsg.text
                    });
                    setTimeout(() => setNotification(null), 4000);
                    return { ...ch, unreadCount: (ch.unreadCount || 0) + 1 };
                  }
                }
                return ch;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannelId, currentUser]);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat stream to bottom when message arrives
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeMessages, activeChannelId]);

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || !currentUser || !activeChannelId) return;

    // Ensure activeChannelId actually exists in loaded channels to avoid foreign key errors
    if (!channels.some(c => c.id === activeChannelId)) {
      alert('No active channel selected or channel does not exist.');
      return;
    }

    const userMsg = {
      id: `live-m-${Date.now()}`,
      channel_id: activeChannelId,
      sender: currentUser.name,
      text: textInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      avatar: currentUser.avatar || '',
      organization: currentUser.organization || 'Global'
    };

    const { error } = await supabase.from('chat_messages').insert([userMsg]);
    if (error) {
      console.error(error);
      alert('Error sending message: ' + error.message);
      return;
    }

    setActiveMessages((prev) => [...prev, userMsg]);
    setTextInput('');

    // Clear unreads
    await supabase
      .from('chat_channels')
      .update({ unreadCount: 0 })
      .eq('id', activeChannelId);

    setChannels((prev) =>
      prev.map((ch) => (ch.id === activeChannelId ? { ...ch, unreadCount: 0 } : ch))
    );

    // Simulate reactive parent reply if texting Tariq
    if (activeChannelId === 'ch-parent-tariq') {
      setTimeout(async () => {
        const replyMsg = {
          id: `live-reply-${Date.now()}`,
          channel_id: 'ch-parent-tariq',
          sender: 'Tariq Khan',
          avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
          text: 'Thank you for the update sir. I will sit with her this evening to review her quotient calculations and keep her stress free. Looking forward to the scheduled parent meeting!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false,
          organization: currentUser.organization || 'Global'
        };

        const { error: replyErr } = await supabase.from('chat_messages').insert([replyMsg]);
        if (!replyErr) {
          setActiveMessages((prev) => [...prev, replyMsg]);
        }
      }, 2500);
    }
  };



  const activeChannel = channels.find((ch) => ch.id === activeChannelId);

  return (
    <div className="relative h-[calc(100vh-170px)] flex flex-col lg:flex-row bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-850 overflow-hidden shadow-sm">
      {/* Toast Notification for Real-Time messages */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-700 shadow-xl rounded-xl p-3.5 max-w-sm pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="text-[11px] font-bold text-slate-800 dark:text-white">{notification.sender}</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{notification.text}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 text-xs shrink-0 font-medium cursor-pointer"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sidebar: Channels/Threads list (4 columns equivalence) */}
      <div className={`w-full lg:w-80 border-r border-slate-100 dark:border-slate-850 flex flex-col shrink-0 bg-slate-50/50 dark:bg-slate-900/10 ${
        showMobileChat ? 'hidden lg:flex' : 'flex'
      }`}>
        
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
                      onClick={() => {
                        setActiveChannelId(ch.id);
                        setShowMobileChat(true);
                      }}
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
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-2">Chats</span>
            <div className="space-y-1">
              {channels
                .filter((ch) => ch.type === 'direct' && ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((ch) => {
                  const isSelected = ch.id === activeChannelId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setActiveChannelId(ch.id);
                        setShowMobileChat(true);
                      }}
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
      <div className={`flex-1 flex flex-col justify-between bg-white dark:bg-slate-800 ${
        !showMobileChat ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* Chat Stream Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between shrink-0 bg-slate-50/10">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setShowMobileChat(false)}
              className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
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
          {!activeChannelId || channels.length === 0 ? (
            <div className="py-24 text-center text-slate-450 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 animate-pulse" />
              <span>No chat channels found for this organization.</span>
            </div>
          ) : (
            <>
              {activeMessages.map((msg) => {
                const isMessageSelf = msg.sender.toLowerCase().trim() === currentUser.name.toLowerCase().trim();
                const isAdminSender = adminNames.includes(msg.sender.toLowerCase().trim());
                const bubbleColorClass = isAdminSender
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-emerald-600 dark:bg-emerald-700 text-white font-semibold';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isMessageSelf ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMessageSelf && msg.avatar && (
                      <img
                        src={msg.avatar}
                        alt={msg.sender}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-100 shrink-0 shadow-xs"
                      />
                    )}
                    <div className={`max-w-[70%] space-y-1 ${isMessageSelf ? 'order-1' : 'order-2'}`}>
                      {/* Meta details */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-250 text-[10px]">{msg.sender}</span>
                        <span className="text-[8px] text-slate-400 font-mono">{msg.time}</span>
                      </div>
                      {/* Message Body Bubble */}
                      <div className={`p-3 rounded-2xl text-[11.5px] leading-relaxed ${bubbleColorClass} ${
                        isMessageSelf ? 'rounded-tr-xs' : 'rounded-tl-xs'
                      }`}>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {activeMessages.length === 0 && (
                <div className="py-24 text-center text-slate-400 text-xs">
                  Secure messaging timeline begins here. Direct chat transcripts are locked.
                </div>
              )}
            </>
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
              disabled={!activeChannelId}
              placeholder={activeChannel ? `Write a reply to ${activeChannel.name}...` : "No channel selected"}
              className="flex-1 min-w-0 bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none placeholder-slate-400 font-medium disabled:opacity-50"
            />

            <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400">
              <Smile className="w-4.5 h-4.5" />
            </button>
            <button
              type="submit"
              disabled={!textInput.trim() || !activeChannelId}
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
