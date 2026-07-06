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

// Deterministic ID generator for direct channels
const getDirectChannelId = (org: string, name1: string, name2: string) => {
  const cleanOrg = org.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sorted = [clean1, clean2].sort();
  return `ch-${cleanOrg}-${sorted[0]}-${sorted[1]}`;
};

// Resolver for direct chat partner user information
const getDirectChatPartner = (channelName: string, currentUser: any, users: any[]) => {
  const parts = channelName.split(' - ');
  if (parts.length !== 2) return null;
  
  const cleanParts = parts.map(p => p.toLowerCase().trim());
  const cleanUser = currentUser.name.toLowerCase().trim();
  
  let partnerName = '';
  if (cleanParts[0] === cleanUser) {
    partnerName = parts[1];
  } else if (cleanParts[1] === cleanUser) {
    partnerName = parts[0];
  } else {
    // Fallback if currentUser name is slightly different or admin name matches differently
    const user0 = users.find(u => u.name.toLowerCase().trim() === cleanParts[0]);
    if (currentUser.role === 'Organization Admin' || currentUser.role === 'Super Admin') {
      if (user0 && user0.role !== 'Organization Admin' && user0.role !== 'Super Admin') {
        partnerName = parts[0];
      } else {
        partnerName = parts[1];
      }
    } else {
      partnerName = cleanParts[0] === 'admin' || cleanParts[0] === 'organization admin' ? parts[1] : parts[0];
    }
  }
  
  return users.find(u => u.name.toLowerCase().trim() === partnerName.toLowerCase().trim()) || {
    name: partnerName,
    role: 'User',
    avatar: ''
  };
};

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
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [studentRegistryList, setStudentRegistryList] = useState<any[]>([]);

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
        let currentChannels = data;

        // Fetch users to identify roles and build links
        let usersQuery = supabase.from('users').select('id, name, role, organization, mentor_id, avatar');
        if (orgToFilter) {
          usersQuery = usersQuery.eq('organization', orgToFilter);
        }
        const { data: fetchedUsers, error: usersErr } = await usersQuery;

        if (!usersErr && fetchedUsers) {
          setOrgUsers(fetchedUsers);

          const mentorsAndAssistants = fetchedUsers
            .filter(u => u.role === 'Mentor' || u.role === 'Assistant')
            .map(u => u.name.toLowerCase().trim());
          const admins = fetchedUsers
            .filter(u => u.role === 'Organization Admin' || u.role === 'Super Admin')
            .map(u => u.name.toLowerCase().trim());
          setAdminNames(admins);

          const superAdmins = fetchedUsers.filter(u => u.role === 'Super Admin');
          const orgAdmins = fetchedUsers.filter(u => u.role === 'Organization Admin');
          const mentors = fetchedUsers.filter(u => u.role === 'Mentor');
          const assistants = fetchedUsers.filter(u => u.role === 'Assistant');
          const students = fetchedUsers.filter(u => u.role === 'Student');
          
          const channelsToCreate: any[] = [];
          const existingIds = new Set(data.map(c => c.id));
          
          const registerChannelNeeded = (chOrg: string, name1: string, name2: string) => {
            const chId = getDirectChannelId(chOrg, name1, name2);
            if (!existingIds.has(chId) && !channelsToCreate.some(c => c.id === chId)) {
              channelsToCreate.push({
                id: chId,
                name: `${name1} - ${name2}`,
                type: 'direct',
                unreadCount: 0,
                subtitle: 'Direct Message',
                avatar: '',
                organization: chOrg
              });
            }
          };

          // 1. Super Admin <-> Org Admin, Mentor, Assistant of all organizations
          superAdmins.forEach(sa => {
            fetchedUsers.forEach(u => {
              if (u.role !== 'Super Admin' && u.role !== 'Student') {
                const chOrg = u.organization !== 'All Organizations' ? u.organization : 'Global';
                registerChannelNeeded(chOrg, sa.name, u.name);
              }
            });
          });

          // 2. Org Admin <-> Mentor and Assistant of same organization
          orgAdmins.forEach(admin => {
            mentors.filter(m => m.organization === admin.organization).forEach(mentor => {
              registerChannelNeeded(admin.organization, admin.name, mentor.name);
            });
            assistants.filter(a => a.organization === admin.organization).forEach(asst => {
              registerChannelNeeded(admin.organization, admin.name, asst.name);
            });
          });

          // 3. Mentor <-> Assigned Assistant
          mentors.forEach(mentor => {
            const mentorAssistants = assistants.filter(a => a.mentor_id === mentor.id);
            mentorAssistants.forEach(assistant => {
              registerChannelNeeded(mentor.organization, mentor.name, assistant.name);
            });
          });

          // 4. Student <-> Org Admin of same organization
          students.forEach(std => {
            orgAdmins.filter(admin => admin.organization === std.organization).forEach(admin => {
              registerChannelNeeded(std.organization, admin.name, std.name);
            });
          });

          // 5. Student <-> Assigned Mentor and Mentor's Assistants
          let studentsRegistryQuery = supabase.from('students').select('name, email, mentor, organization');
          if (orgToFilter) {
            studentsRegistryQuery = studentsRegistryQuery.eq('organization', orgToFilter);
          }
          const { data: studentsRegistry } = await studentsRegistryQuery;
          if (studentsRegistry) {
            setStudentRegistryList(studentsRegistry);
            studentsRegistry.forEach(registryItem => {
              const stdName = registryItem.name;
              const chOrg = registryItem.organization;
              const mentorName = registryItem.mentor;
              
              if (mentorName) {
                // Register Student <-> Mentor
                const mentorUser = mentors.find(m => m.name.toLowerCase().trim() === mentorName.toLowerCase().trim() && m.organization === chOrg);
                if (mentorUser) {
                  registerChannelNeeded(chOrg, mentorUser.name, stdName);
                  
                  // Register Student <-> Mentor's Assistants
                  const mentorAssistants = assistants.filter(a => a.mentor_id === mentorUser.id);
                  mentorAssistants.forEach(asst => {
                    registerChannelNeeded(chOrg, asst.name, stdName);
                  });
                }
              }
            });
          }

          if (channelsToCreate.length > 0) {
            const { error: insertErr } = await supabase.from('chat_channels').insert(channelsToCreate);
            if (!insertErr) {
              let refreshQuery = supabase.from('chat_channels').select('*');
              if (orgToFilter) {
                refreshQuery = refreshQuery.eq('organization', orgToFilter);
              }
              const { data: refreshedChannels, error: refreshErr } = await refreshQuery;
              if (!refreshErr && refreshedChannels) {
                currentChannels = refreshedChannels;
              }
            } else {
              console.error('Failed to auto-create channels:', insertErr);
            }
          }

          const allowedIds = new Set<string>();

          if (currentUser.role === 'Super Admin') {
            // Super Admin participates in direct chats with every user except students
            fetchedUsers.forEach(u => {
              if (u.id !== currentUser.id && u.role !== 'Student') {
                const chOrg = u.organization !== 'All Organizations' ? u.organization : 'Global';
                allowedIds.add(getDirectChannelId(chOrg, currentUser.name, u.name));
              }
            });
          } else if (currentUser.role === 'Organization Admin') {
            const myOrg = currentUser.organization;
            // Org Admin <-> Mentors
            mentors.filter(m => m.organization === myOrg).forEach(m => {
              allowedIds.add(getDirectChannelId(myOrg, currentUser.name, m.name));
            });
            // Org Admin <-> Assistants
            assistants.filter(a => a.organization === myOrg).forEach(a => {
              allowedIds.add(getDirectChannelId(myOrg, currentUser.name, a.name));
              registerChannelNeeded(myOrg, currentUser.name, a.name);
            });
            // Org Admin <-> Super Admins
            superAdmins.forEach(sa => {
              allowedIds.add(getDirectChannelId(myOrg, sa.name, currentUser.name));
              registerChannelNeeded(myOrg, sa.name, currentUser.name);
            });
            // Org Admin <-> Students
            students.filter(s => s.organization === myOrg).forEach(std => {
              allowedIds.add(getDirectChannelId(myOrg, currentUser.name, std.name));
              registerChannelNeeded(myOrg, currentUser.name, std.name);
            });
          } else if (currentUser.role === 'Mentor') {
            const myOrg = currentUser.organization;
            // Mentor <-> Org Admins
            orgAdmins.filter(a => a.organization === myOrg).forEach(admin => {
              allowedIds.add(getDirectChannelId(myOrg, admin.name, currentUser.name));
              registerChannelNeeded(myOrg, admin.name, currentUser.name);
            });
            // Mentor <-> My Assistants
            assistants.filter(a => a.mentor_id === currentUser.id).forEach(asst => {
              allowedIds.add(getDirectChannelId(myOrg, currentUser.name, asst.name));
              registerChannelNeeded(myOrg, currentUser.name, asst.name);
            });
            // Mentor <-> Super Admins
            superAdmins.forEach(sa => {
              allowedIds.add(getDirectChannelId(myOrg, sa.name, currentUser.name));
              registerChannelNeeded(myOrg, sa.name, currentUser.name);
            });
            // Mentor <-> All Students in organization
            students.filter(s => s.organization === myOrg).forEach(std => {
              allowedIds.add(getDirectChannelId(myOrg, currentUser.name, std.name));
              registerChannelNeeded(myOrg, currentUser.name, std.name);
            });
          } else if (currentUser.role === 'Assistant') {
            const myOrg = currentUser.organization;
            // Assistant <-> Org Admins
            orgAdmins.filter(a => a.organization === myOrg).forEach(admin => {
              allowedIds.add(getDirectChannelId(myOrg, admin.name, currentUser.name));
              registerChannelNeeded(myOrg, admin.name, currentUser.name);
            });
            // Assistant <-> My Mentor
            const myMentor = mentors.find(m => m.id === currentUser.mentor_id);
            if (myMentor) {
              allowedIds.add(getDirectChannelId(myOrg, myMentor.name, currentUser.name));
              registerChannelNeeded(myOrg, myMentor.name, currentUser.name);
              
              // Assistant <-> My Mentor's Students (Assigned in student registry)
              const { data: mentorStudents } = await supabase
                .from('students')
                .select('name')
                .eq('mentor', myMentor.name)
                .eq('organization', myOrg);
              if (mentorStudents) {
                mentorStudents.forEach(s => {
                  allowedIds.add(getDirectChannelId(myOrg, currentUser.name, s.name));
                  registerChannelNeeded(myOrg, currentUser.name, s.name);
                });
              }
            }
            // Assistant <-> Super Admins
            superAdmins.forEach(sa => {
              allowedIds.add(getDirectChannelId(myOrg, sa.name, currentUser.name));
              registerChannelNeeded(myOrg, sa.name, currentUser.name);
            });
          } else if (currentUser.role === 'Student') {
            const myOrg = currentUser.organization;
            // Student <-> Org Admins
            orgAdmins.filter(a => a.organization === myOrg).forEach(admin => {
              allowedIds.add(getDirectChannelId(myOrg, admin.name, currentUser.name));
              registerChannelNeeded(myOrg, admin.name, currentUser.name);
            });

            // Find student's assigned mentor name
            let studentMentorName: string | null = null;
            const { data: stdData } = await supabase
              .from('students')
              .select('mentor')
              .eq('email', currentUser.email)
              .maybeSingle();
            if (stdData) {
              studentMentorName = stdData.mentor;
            }

            if (studentMentorName) {
              const mentorUser = mentors.find(m => m.name.toLowerCase().trim() === studentMentorName!.toLowerCase().trim());
              if (mentorUser) {
                // Student <-> Mentor
                allowedIds.add(getDirectChannelId(myOrg, currentUser.name, mentorUser.name));
                registerChannelNeeded(myOrg, currentUser.name, mentorUser.name);

                // Student <-> Mentor's Assistants
                const mentorAssistants = assistants.filter(a => a.mentor_id === mentorUser.id);
                mentorAssistants.forEach(asst => {
                  allowedIds.add(getDirectChannelId(myOrg, currentUser.name, asst.name));
                  registerChannelNeeded(myOrg, currentUser.name, asst.name);
                });
              }
            }
          }

          const allowedChannels = currentChannels.filter(c => {
            if (c.type === 'channel') {
              if (currentUser.role === 'Super Admin') {
                return selectedOrg === 'All Organizations' || c.organization === selectedOrg;
              }
              return c.organization === currentUser.organization;
            }
            return allowedIds.has(c.id);
          });

          setChannels(allowedChannels);

          if (allowedChannels.length > 0) {
            const hasActive = allowedChannels.some(c => c.id === activeChannelId);
            if (!hasActive) {
              setActiveChannelId(allowedChannels[0].id);
            }
          } else {
            setActiveChannelId('');
          }
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
  const renderContactButton = (user: any, ch: ChatChannel, subLabel: string) => {
    const isSelected = ch.id === activeChannelId;
    return (
      <button
        key={user.id}
        onClick={() => {
          setActiveChannelId(ch.id);
          setShowMobileChat(true);
        }}
        className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition-all ${
          isSelected 
            ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/10' 
            : 'hover:bg-slate-150 text-slate-650 dark:text-slate-350'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-6.5 h-6.5 rounded-md object-cover shrink-0 border border-slate-200"
            />
          ) : (
            <div className={`w-6.5 h-6.5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 select-none ${
              isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-850 text-slate-400'
            }`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs truncate font-bold leading-normal">{user.name}</h4>
            <p className={`text-[9px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{subLabel}</p>
          </div>
        </div>
        {ch.unreadCount > 0 && !isSelected && (
          <span className="bg-rose-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full shrink-0">
            {ch.unreadCount}
          </span>
        )}
      </button>
    );
  };

  const activeChannel = channels.find((ch) => ch.id === activeChannelId);

  const resolvedHeaderInfo = activeChannel
    ? (activeChannel.type === 'direct'
        ? (() => {
            const partner = getDirectChatPartner(activeChannel.name, currentUser, orgUsers);
            return {
              name: partner?.name || activeChannel.name,
              subtitle: partner?.role || activeChannel.subtitle,
              avatar: partner?.avatar || activeChannel.avatar
            };
          })()
        : {
            name: activeChannel.name,
            subtitle: activeChannel.subtitle,
            avatar: activeChannel.avatar
          })
    : { name: 'Conversation thread', subtitle: '', avatar: '' };

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
                          : 'hover:bg-slate-150 text-slate-650 dark:text-slate-300'
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
              {(() => {
                if (currentUser.role === 'Super Admin') {
                  const orgs = Array.from(new Set(orgUsers.map(u => u.organization).filter(org => org && org !== 'All Organizations'))) as string[];
                  
                  if (orgs.length === 0) {
                    return (
                      <div className="px-2 py-4 text-[11px] text-slate-400 text-center">
                        No organizations or users found.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {orgs.map(orgName => {
                        const orgUsersInOrg = orgUsers.filter(u => u.organization === orgName);
                        const admins = orgUsersInOrg.filter(u => u.role === 'Organization Admin');
                        const mentors = orgUsersInOrg.filter(u => u.role === 'Mentor');
                        const assistants = orgUsersInOrg.filter(u => u.role === 'Assistant');

                        // Match search query if any
                        const matchesSearch = (u: any) => u.name.toLowerCase().includes(searchQuery.toLowerCase());
                        const filteredAdmins = admins.filter(matchesSearch);
                        const filteredMentors = mentors.filter(m => 
                          matchesSearch(m) || assistants.some(a => a.mentor_id === m.id && matchesSearch(a))
                        );
                        const filteredUnassignedAssistants = assistants.filter(a => 
                          !mentors.some(m => m.id === a.mentor_id) && matchesSearch(a)
                        );

                        if (filteredAdmins.length === 0 && filteredMentors.length === 0 && filteredUnassignedAssistants.length === 0) {
                          return null; // hide empty organization section during search
                        }

                        return (
                          <div key={orgName} className="space-y-1.5">
                            {/* Organization Header */}
                            <div className="px-2 py-1 bg-slate-200/50 dark:bg-slate-800/60 rounded-lg">
                              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
                                {orgName}
                              </span>
                            </div>

                            {/* Org Admins */}
                            {filteredAdmins.map(admin => {
                              const chId = getDirectChannelId(orgName, currentUser.name, admin.name);
                              const ch = channels.find(c => c.id === chId);
                              if (!ch) return null;
                              return renderContactButton(admin, ch, 'Org Admin');
                            })}

                            {/* Mentors with Assistants nested */}
                            {filteredMentors.map(mentor => {
                              const chId = getDirectChannelId(orgName, currentUser.name, mentor.name);
                              const ch = channels.find(c => c.id === chId);
                              const mentorAssistants = assistants.filter(a => a.mentor_id === mentor.id);

                              return (
                                <div key={mentor.id} className="space-y-1">
                                  {ch && renderContactButton(mentor, ch, 'Mentor')}
                                  {mentorAssistants.length > 0 && (
                                    <div className="pl-3 ml-4 border-l border-slate-200 dark:border-slate-700 space-y-1">
                                      {mentorAssistants.map(asst => {
                                        const asstChId = getDirectChannelId(orgName, currentUser.name, asst.name);
                                        const asstCh = channels.find(c => c.id === asstChId);
                                        if (!asstCh) return null;
                                        return renderContactButton(asst, asstCh, 'Assistant');
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Unassigned Assistants */}
                            {filteredUnassignedAssistants.map(asst => {
                              const chId = getDirectChannelId(orgName, currentUser.name, asst.name);
                              const ch = channels.find(c => c.id === chId);
                              if (!ch) return null;
                              return renderContactButton(asst, ch, 'Assistant (Unassigned)');
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (currentUser.role === 'Organization Admin') {
                  const orgName = currentUser.organization;
                  const mentors = orgUsers.filter(u => u.role === 'Mentor' && u.organization === orgName);
                  const assistants = orgUsers.filter(u => u.role === 'Assistant' && u.organization === orgName);
                  const students = orgUsers.filter(u => u.role === 'Student' && u.organization === orgName);

                  const matchesSearch = (u: any) => u.name.toLowerCase().includes(searchQuery.toLowerCase());
                  const filteredMentors = mentors.filter(m => 
                    matchesSearch(m) || assistants.some(a => a.mentor_id === m.id && matchesSearch(a))
                  );
                  const filteredUnassignedAssistants = assistants.filter(a => 
                    !mentors.some(m => m.id === a.mentor_id) && matchesSearch(a)
                  );
                  const filteredStudents = students.filter(matchesSearch);

                  if (filteredMentors.length === 0 && filteredUnassignedAssistants.length === 0 && filteredStudents.length === 0) {
                    return (
                      <div className="px-2 py-4 text-[11px] text-slate-400 text-center">
                        No contacts found.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filteredMentors.map(mentor => {
                        const chId = getDirectChannelId(orgName, currentUser.name, mentor.name);
                        const ch = channels.find(c => c.id === chId);
                        const mentorAssistants = assistants.filter(a => a.mentor_id === mentor.id);

                        return (
                          <div key={mentor.id} className="space-y-1">
                            {ch && renderContactButton(mentor, ch, 'Mentor')}
                            {mentorAssistants.length > 0 && (
                              <div className="pl-3 ml-4 border-l border-slate-200 dark:border-slate-700 space-y-1">
                                {mentorAssistants.map(asst => {
                                  const asstChId = getDirectChannelId(orgName, currentUser.name, asst.name);
                                  const asstCh = channels.find(c => c.id === asstChId);
                                  if (!asstCh) return null;
                                  return renderContactButton(asst, asstCh, 'Assistant');
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {filteredUnassignedAssistants.length > 0 && (
                        <div className="space-y-1 pt-2">
                          <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1.5">Unassigned Assistants</span>
                          {filteredUnassignedAssistants.map(asst => {
                            const chId = getDirectChannelId(orgName, currentUser.name, asst.name);
                            const ch = channels.find(c => c.id === chId);
                            if (!ch) return null;
                            return renderContactButton(asst, ch, 'Assistant (Unassigned)');
                          })}
                        </div>
                      )}

                      {filteredStudents.length > 0 && (
                        <div className="space-y-1 pt-2">
                          <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1">Students</span>
                          {filteredStudents.map(std => {
                            const chId = getDirectChannelId(orgName, currentUser.name, std.name);
                            const ch = channels.find(c => c.id === chId);
                            if (!ch) return null;
                            return renderContactButton(std, ch, 'Student');
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (currentUser.role === 'Mentor') {
                  const orgName = currentUser.organization;
                  const admins = orgUsers.filter(u => u.role === 'Organization Admin' && u.organization === orgName);
                  const myAssistants = orgUsers.filter(u => u.role === 'Assistant' && u.mentor_id === currentUser.id && u.organization === orgName);
                  const students = orgUsers.filter(u => u.role === 'Student' && u.organization === orgName);

                  const matchesSearch = (u: any) => u.name.toLowerCase().includes(searchQuery.toLowerCase());
                  const filteredAdmins = admins.filter(matchesSearch);
                  const filteredAssistants = myAssistants.filter(matchesSearch);
                  const filteredStudents = students.filter(matchesSearch);

                  if (filteredAdmins.length === 0 && filteredAssistants.length === 0 && filteredStudents.length === 0) {
                    return (
                      <div className="px-2 py-4 text-[11px] text-slate-400 text-center">
                        No contacts found.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filteredAdmins.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1">Organization Admins</span>
                          {filteredAdmins.map(admin => {
                            const chId = getDirectChannelId(orgName, admin.name, currentUser.name);
                            const ch = channels.find(c => c.id === chId);
                            if (!ch) return null;
                            return renderContactButton(admin, ch, 'Org Admin');
                          })}
                        </div>
                      )}

                      {filteredAssistants.length > 0 && (
                        <div className="space-y-1 pt-2">
                          <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1">My Assistants</span>
                          {filteredAssistants.map(asst => {
                            const chId = getDirectChannelId(orgName, currentUser.name, asst.name);
                            const ch = channels.find(c => c.id === chId);
                            if (!ch) return null;
                            return renderContactButton(asst, ch, 'Assistant');
                          })}
                        </div>
                      )}

                      {filteredStudents.length > 0 && (
                        <div className="space-y-1 pt-2">
                          <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1">Students</span>
                          {filteredStudents.map(std => {
                            const chId = getDirectChannelId(orgName, currentUser.name, std.name);
                            const ch = channels.find(c => c.id === chId);
                            if (!ch) return null;
                            return renderContactButton(std, ch, 'Student');
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (currentUser.role === 'Assistant') {
                  const orgName = currentUser.organization;
                  const admins = orgUsers.filter(u => u.role === 'Organization Admin' && u.organization === orgName);
                  const myMentor = orgUsers.find(u => u.role === 'Mentor' && u.id === currentUser.mentor_id && u.organization === orgName);
                  
                  const myMentorStudents = myMentor 
                    ? studentRegistryList.filter(s => s.mentor === myMentor.name && s.organization === orgName).map(s => s.name)
                    : [];
                  const assignedStudents = orgUsers.filter(u => u.role === 'Student' && u.organization === orgName && myMentorStudents.includes(u.name));

                  const matchesSearch = (u: any) => u.name.toLowerCase().includes(searchQuery.toLowerCase());
                  const filteredAdmins = admins.filter(matchesSearch);
                  const showMentor = myMentor && matchesSearch(myMentor);
                  const filteredStudents = assignedStudents.filter(matchesSearch);

                  if (filteredAdmins.length === 0 && !showMentor && filteredStudents.length === 0) {
                    return (
                      <div className="px-2 py-4 text-[11px] text-slate-400 text-center">
                        No contacts found.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filteredAdmins.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1">Organization Admins</span>
                          {filteredAdmins.map(admin => {
                            const chId = getDirectChannelId(orgName, admin.name, currentUser.name);
                            const ch = channels.find(c => c.id === chId);
                            if (!ch) return null;
                            return renderContactButton(admin, ch, 'Org Admin');
                          })}
                        </div>
                      )}

                      {showMentor && myMentor && (() => {
                        const chId = getDirectChannelId(orgName, myMentor.name, currentUser.name);
                        const ch = channels.find(c => c.id === chId);
                        if (!ch) return null;
                        return (
                          <div className="space-y-1 pt-2">
                            <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1">My Mentor</span>
                            {renderContactButton(myMentor, ch, 'Mentor')}
                          </div>
                        );
                      })()}

                      {filteredStudents.length > 0 && (
                        <div className="space-y-1 pt-2">
                          <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1">My Mentor's Students</span>
                          {filteredStudents.map(std => {
                            const chId = getDirectChannelId(orgName, currentUser.name, std.name);
                            const ch = channels.find(c => c.id === chId);
                            if (!ch) return null;
                            return renderContactButton(std, ch, 'Student');
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (currentUser.role === 'Student') {
                  const orgName = currentUser.organization;
                  const admins = orgUsers.filter(u => u.role === 'Organization Admin' && u.organization === orgName);
                  
                  const studentRegistryItem = studentRegistryList.find(s => s.email === currentUser.email);
                  const studentMentorName = studentRegistryItem?.mentor;
                  
                  const myMentor = studentMentorName 
                    ? orgUsers.find(u => u.role === 'Mentor' && u.name.toLowerCase().trim() === studentMentorName.toLowerCase().trim() && u.organization === orgName)
                    : null;
                  
                  const myAssistants = myMentor 
                    ? orgUsers.filter(u => u.role === 'Assistant' && u.mentor_id === myMentor.id && u.organization === orgName)
                    : [];

                  const matchesSearch = (u: any) => u.name.toLowerCase().includes(searchQuery.toLowerCase());
                  const filteredAdmins = admins.filter(matchesSearch);
                  const showMentor = myMentor && matchesSearch(myMentor);
                  const filteredAssistants = myAssistants.filter(matchesSearch);

                  if (filteredAdmins.length === 0 && !showMentor && filteredAssistants.length === 0) {
                    return (
                      <div className="px-2 py-4 text-[11px] text-slate-400 text-center">
                        No contacts found.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filteredAdmins.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1">Organization Admins</span>
                          {filteredAdmins.map(admin => {
                            const chId = getDirectChannelId(orgName, admin.name, currentUser.name);
                            const ch = channels.find(c => c.id === chId);
                            if (!ch) return null;
                            return renderContactButton(admin, ch, 'Org Admin');
                          })}
                        </div>
                      )}

                      {showMentor && myMentor && (() => {
                        const chId = getDirectChannelId(orgName, currentUser.name, myMentor.name);
                        const ch = channels.find(c => c.id === chId);
                        if (!ch) return null;
                        return (
                          <div className="space-y-1 pt-2">
                            <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1">My Mentor</span>
                            {renderContactButton(myMentor, ch, 'Mentor')}
                          </div>
                        );
                      })()}

                      {filteredAssistants.length > 0 && (
                        <div className="space-y-1 pt-2">
                          <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block px-2 mb-1">Mentor's Assistants</span>
                          {filteredAssistants.map(asst => {
                            const chId = getDirectChannelId(orgName, currentUser.name, asst.name);
                            const ch = channels.find(c => c.id === chId);
                            if (!ch) return null;
                            return renderContactButton(asst, ch, 'Assistant');
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })()}
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
            ) : resolvedHeaderInfo.avatar ? (
              <img
                src={resolvedHeaderInfo.avatar}
                alt={resolvedHeaderInfo.name}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-md object-cover shrink-0 border border-slate-200"
              />
            ) : (
              <div className="w-5 h-5 rounded-md bg-slate-150 text-slate-500 flex items-center justify-center font-extrabold text-[10px] shrink-0 border border-slate-200">
                {resolvedHeaderInfo.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-xs truncate">
                {resolvedHeaderInfo.name}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">{resolvedHeaderInfo.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-650">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-650">
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
                
                // Find sender details dynamically
                const senderUser = orgUsers.find(u => u.name.toLowerCase().trim() === msg.sender.toLowerCase().trim());
                const senderAvatar = senderUser?.avatar || msg.avatar || '';

                const bubbleColorClass = isMessageSelf
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-750 text-slate-850 dark:text-slate-100 font-semibold';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isMessageSelf ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMessageSelf && (
                      senderAvatar ? (
                        <img
                          src={senderAvatar}
                          alt={msg.sender}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-100 shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-slate-200">
                          {msg.sender.charAt(0).toUpperCase()}
                        </div>
                      )
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
              placeholder={activeChannel ? `Write a reply to ${resolvedHeaderInfo.name}...` : "No channel selected"}
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




