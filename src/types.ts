/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Super Admin' | 'Organization Admin' | 'Mentor' | 'Assistant' | 'Student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  status: 'Active' | 'Inactive' | 'Pending';
  avatar: string;
  createdDate: string;
  lastLogin: string;
}

export interface Organization {
  id: string;
  name: string;
  plan: 'Enterprise' | 'Premium Growth' | 'Standard' | 'Basic';
  users: number;
  students: number;
  mentors: number;
  status: 'Active' | 'Suspended' | 'Trialing';
  renewalDate: string;
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  studentsAssigned: string[]; // Student names or IDs
  experience: string;
  rating: number;
  availability: 'Full-time' | 'Part-time' | 'Weekends Only' | 'On-demand';
  upcomingSessions: number;
  performance: 'Outstanding' | 'Exceeding' | 'Meeting' | 'Needs Review';
  avatar: string;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  grade: string;
  mentor: string; // Mentor Name
  guardian: string;
  progress: number; // 0-100
  attendance: number; // 0-100
  upcomingSession: string; // Date or description
  status: 'Active' | 'On Leave' | 'Graduated' | 'Suspended';
  avatar: string;
}

export interface Session {
  id: string;
  student: string;
  mentor: string;
  date: string;
  time: string;
  duration: string;
  meetingLink: string;
  attendance: 'Present' | 'Absent' | 'Excused' | 'Pending';
  homework: string;
  notes: string;
  privateNotes?: string;
  sharedNotes?: string;
  voiceNotesUrl?: string;
  files: string[];
  status: 'Completed' | 'Upcoming' | 'Cancelled';
  category: 'Academic' | 'Behavioral' | 'Doubt Clearing' | 'Exam Prep' | 'Special Need';
}

export interface Message {
  id: string;
  senderName: string;
  senderRole: string;
  avatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  unread: boolean;
  attachments?: { name: string; size: string; type: string }[];
  voiceNoteDuration?: string;
  image?: string;
}

export interface Conversation {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online: boolean;
  typing?: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  student: string;
  organization: string;
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  date: string;
  invoiceNumber: string;
  plan: 'Monthly Pro' | 'Annual Elite' | 'Quarterly Basic' | 'One-Time Session';
  refundAmount?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  organization: string;
  action: string;
  ipAddress: string;
  status: 'Success' | 'Failed' | 'Warning';
  severity: 'Info' | 'Medium' | 'High' | 'Critical';
  details: string;
}

export interface PermissionMatrix {
  module: string;
  roles: {
    [key in UserRole]: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
      approve: boolean;
      export: boolean;
      assign: boolean;
    };
  };
}
