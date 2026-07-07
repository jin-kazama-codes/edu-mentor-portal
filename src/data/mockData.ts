/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Organization, Mentor, Student, Session, Message, Conversation, Payment, AuditLog, User, PermissionMatrix } from '../types';

// ==========================================
// 1. ORGANIZATIONS (5 items)
// ==========================================
export const organizations: Organization[] = [
  { id: 'org-1', name: 'Bright Future Academy', plan: 'Enterprise', users: 142, students: 1250, mentors: 65, status: 'Active', renewalDate: '2027-01-15' },
  { id: 'org-2', name: 'LearnHub Institute', plan: 'Premium Growth', users: 84, students: 820, mentors: 42, status: 'Active', renewalDate: '2026-11-30' },
  { id: 'org-3', name: 'Smart Minds J&K', plan: 'Enterprise', users: 95, students: 910, mentors: 48, status: 'Active', renewalDate: '2027-04-10' },
  { id: 'org-4', name: 'Aspire Education', plan: 'Standard', users: 48, students: 430, mentors: 25, status: 'Active', renewalDate: '2026-09-18' },
  { id: 'org-5', name: 'Valley Crest Academics', plan: 'Basic', users: 18, students: 72, mentors: 6, status: 'Suspended', renewalDate: '2026-05-12' },
];

// ==========================================
// 2. MENTORS (15+ items)
// ==========================================
export const mentors: Mentor[] = [
  {
    id: 'm-1',
    name: 'Aadil Bhat',
    email: 'aadil.bhat@brightfuture.com',
    subjects: ['Physics', 'Mathematics', 'Astronomy'],
    studentsAssigned: ['Zoya Khan', 'Sameer Rather', 'Iqra Jan'],
    experience: '8 Years',
    rating: 4.9,
    availability: 'Full-time',
    upcomingSessions: 12,
    performance: 'Outstanding',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-2',
    name: 'Sarah Johnson',
    email: 'sarah.j@learnhub.com',
    subjects: ['English Literature', 'Creative Writing'],
    studentsAssigned: ['Rohan Das', 'Emily Miller'],
    experience: '6 Years',
    rating: 4.8,
    availability: 'Part-time',
    upcomingSessions: 8,
    performance: 'Exceeding',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-3',
    name: 'Mehreen Shafi',
    email: 'mehreen.shafi@smartminds.org',
    subjects: ['Chemistry', 'Biology'],
    studentsAssigned: ['Rayees Mir', 'Tabasum Ara', 'Bisma Yusuf'],
    experience: '5 Years',
    rating: 4.7,
    availability: 'Full-time',
    upcomingSessions: 14,
    performance: 'Meeting',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-4',
    name: 'Suhail Ahmad',
    email: 'suhail.ahmad@aspire.in',
    subjects: ['Computer Science', 'Python', 'Data Structures'],
    studentsAssigned: ['Faisal Dar', 'Yawar Lone'],
    experience: '10 Years',
    rating: 4.95,
    availability: 'Full-time',
    upcomingSessions: 18,
    performance: 'Outstanding',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-5',
    name: 'Emily Carter',
    email: 'emily.carter@valleycrest.edu',
    subjects: ['World History', 'Social Studies'],
    studentsAssigned: ['Lina Shah', 'Adil Shah'],
    experience: '4 Years',
    rating: 4.6,
    availability: 'Part-time',
    upcomingSessions: 4,
    performance: 'Meeting',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-6',
    name: 'Yasir Wani',
    email: 'yasir.wani@brightfuture.com',
    subjects: ['Economics', 'Business Studies'],
    studentsAssigned: ['Saima Akhter', 'Moomin Shah'],
    experience: '7 Years',
    rating: 4.75,
    availability: 'Weekends Only',
    upcomingSessions: 6,
    performance: 'Exceeding',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-7',
    name: 'David Wilson',
    email: 'david.wilson@learnhub.com',
    subjects: ['Algebra', 'Geometry', 'Calculus'],
    studentsAssigned: ['Rahul Verma', 'Aryan Kumar'],
    experience: '12 Years',
    rating: 4.88,
    availability: 'Full-time',
    upcomingSessions: 15,
    performance: 'Outstanding',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-8',
    name: 'Tabasum Ara',
    email: 'tabasum.ara@smartminds.org',
    subjects: ['Urdu Literature', 'Islamic Studies'],
    studentsAssigned: ['Mehak Jan', 'Madiha Yusuf'],
    experience: '9 Years',
    rating: 4.9,
    availability: 'Part-time',
    upcomingSessions: 7,
    performance: 'Exceeding',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-9',
    name: 'Michael Smith',
    email: 'michael.smith@aspire.in',
    subjects: ['Physics', 'Applied Mechanics'],
    studentsAssigned: ['Animesh Sen', 'Aditya Roy'],
    experience: '5 Years',
    rating: 4.5,
    availability: 'On-demand',
    upcomingSessions: 5,
    performance: 'Meeting',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-10',
    name: 'Saima Akhter',
    email: 'saima.akhter@brightfuture.com',
    subjects: ['Biology', 'Ecology', 'Botany'],
    studentsAssigned: ['Zahid Bhat', 'Danish Malik'],
    experience: '6 Years',
    rating: 4.68,
    availability: 'Full-time',
    upcomingSessions: 9,
    performance: 'Exceeding',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-11',
    name: 'Priya Patel',
    email: 'priya.patel@learnhub.com',
    subjects: ['Data Science', 'Machine Learning'],
    studentsAssigned: ['Riya Sharma', 'Varun Shah'],
    experience: '7 Years',
    rating: 4.82,
    availability: 'Part-time',
    upcomingSessions: 8,
    performance: 'Exceeding',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-12',
    name: 'Amit Sharma',
    email: 'amit.sharma@smartminds.org',
    subjects: ['Political Science', 'Civics'],
    studentsAssigned: ['Kabir Mehta', 'Deepak Sen'],
    experience: '8 Years',
    rating: 4.4,
    availability: 'Full-time',
    upcomingSessions: 11,
    performance: 'Needs Review',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-13',
    name: 'Shahnawaz Malik',
    email: 'shahnawaz.malik@brightfuture.com',
    subjects: ['Organic Chemistry', 'Bio-tech'],
    studentsAssigned: ['Hassan Mir', 'Shabnam Dar'],
    experience: '11 Years',
    rating: 4.92,
    availability: 'Full-time',
    upcomingSessions: 14,
    performance: 'Outstanding',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-14',
    name: 'Mushtaq Lone',
    email: 'mushtaq.lone@aspire.in',
    subjects: ['Geography', 'Geology'],
    studentsAssigned: ['Imran Bhat', 'Basit Lone'],
    experience: '15 Years',
    rating: 4.85,
    availability: 'Weekends Only',
    upcomingSessions: 5,
    performance: 'Exceeding',
    avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-15',
    name: 'Bisma Yusuf',
    email: 'bisma.y@brightfuture.com',
    subjects: ['Mathematics', 'Statistics'],
    studentsAssigned: ['Arsalan Bhat', 'Nadia Jan'],
    experience: '5 Years',
    rating: 4.76,
    availability: 'Full-time',
    upcomingSessions: 10,
    performance: 'Meeting',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  }
];

// ==========================================
// 3. STUDENTS (50+ items)
// ==========================================
const baseStudents: Omit<Student, 'id'>[] = [
  { name: 'Zoya Khan', age: 16, grade: '11th Grade', mentor: 'Aadil Bhat', guardian: 'Tariq Khan', progress: 94, attendance: 96, upcomingSession: 'July 3, 2026 - Math Refresher', status: 'Active', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { name: 'Sameer Rather', age: 17, grade: '12th Grade', mentor: 'Aadil Bhat', guardian: 'Manzoor Rather', progress: 88, attendance: 92, upcomingSession: 'July 4, 2026 - Physics Lab Prep', status: 'Active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Iqra Jan', age: 15, grade: '10th Grade', mentor: 'Aadil Bhat', guardian: 'Abdul Rashid', progress: 91, attendance: 95, upcomingSession: 'July 3, 2026 - Calculus Basics', status: 'Active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { name: 'Rohan Das', age: 14, grade: '9th Grade', mentor: 'Sarah Johnson', guardian: 'Subhash Das', progress: 79, attendance: 85, upcomingSession: 'July 5, 2026 - Story Archetypes', status: 'Active', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
  { name: 'Rayees Mir', age: 17, grade: '12th Grade', mentor: 'Mehreen Shafi', guardian: 'Mohammad Yusuf Mir', progress: 85, attendance: 90, upcomingSession: 'July 4, 2026 - Organic Chemistry', status: 'Active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Tabasum Ara', age: 16, grade: '11th Grade', mentor: 'Mehreen Shafi', guardian: 'Nazir Ahmad Ara', progress: 92, attendance: 98, upcomingSession: 'July 5, 2026 - Cell Division', status: 'Active', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Faisal Dar', age: 18, grade: '12th Grade', mentor: 'Suhail Ahmad', guardian: 'Showkat Dar', progress: 96, attendance: 99, upcomingSession: 'July 3, 2026 - Graph Theory', status: 'Active', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { name: 'Yawar Lone', age: 15, grade: '10th Grade', mentor: 'Suhail Ahmad', guardian: 'Hilal Lone', progress: 82, attendance: 89, upcomingSession: 'July 4, 2026 - Python File I/O', status: 'Active', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
  { name: 'Emily Miller', age: 13, grade: '8th Grade', mentor: 'Sarah Johnson', guardian: 'Alice Miller', progress: 87, attendance: 91, upcomingSession: 'July 6, 2026 - Analytical Reading', status: 'Active', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
  { name: 'Lina Shah', age: 16, grade: '11th Grade', mentor: 'Emily Carter', guardian: 'Bashir Shah', progress: 74, attendance: 82, upcomingSession: 'July 5, 2026 - French Revolution', status: 'On Leave', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80' },
  { name: 'Adil Shah', age: 17, grade: '12th Grade', mentor: 'Emily Carter', guardian: 'Bashir Shah', progress: 89, attendance: 94, upcomingSession: 'July 5, 2026 - Cold War Era', status: 'Active', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Saima Akhter', age: 15, grade: '10th Grade', mentor: 'Yasir Wani', guardian: 'Farooq Akhter', progress: 95, attendance: 97, upcomingSession: 'July 4, 2026 - Microeconomics', status: 'Active', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { name: 'Moomin Shah', age: 16, grade: '11th Grade', mentor: 'Yasir Wani', guardian: 'Gowhar Shah', progress: 83, attendance: 88, upcomingSession: 'July 6, 2026 - Market Structures', status: 'Active', avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&auto=format&fit=crop&q=80' },
  { name: 'Rahul Verma', age: 17, grade: '12th Grade', mentor: 'David Wilson', guardian: 'Suresh Verma', progress: 90, attendance: 93, upcomingSession: 'July 3, 2026 - Vectors & 3D Geometry', status: 'Active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Aryan Kumar', age: 16, grade: '11th Grade', mentor: 'David Wilson', guardian: 'Vikram Kumar', progress: 62, attendance: 71, upcomingSession: 'July 4, 2026 - Limits & Continuity', status: 'Suspended', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
];

// Let's generate a list of 52 students programmatically
export const students: Student[] = [];

// Expand baseStudents deterministicly
for (let i = 0; i < 52; i++) {
  const base = baseStudents[i % baseStudents.length];
  const kashmiriFirstNames = [
    'Zoya', 'Sameer', 'Iqra', 'Rayees', 'Tabasum', 'Faisal', 'Yawar', 'Saima', 'Moomin', 'Bisma', 'Zahid', 'Danish', 
    'Mushtaq', 'Arsalan', 'Nadia', 'Insha', 'Aamir', 'Yasmeen', 'Junaid', 'Rumaysa', 'Burhan', 'Aadil', 'Mehak', 'Basit'
  ];
  const kashmiriLastNames = ['Khan', 'Rather', 'Jan', 'Mir', 'Ara', 'Dar', 'Lone', 'Bhat', 'Malik', 'Yusuf', 'Shah', 'Wani', 'Ganie', 'Sofie'];
  
  const firstName = kashmiriFirstNames[i % kashmiriFirstNames.length];
  const lastName = kashmiriLastNames[(i + 3) % kashmiriLastNames.length];
  const fullName = `${firstName} ${lastName}`;
  const mentorObj = mentors[i % mentors.length];

  students.push({
    id: `s-${i + 1}`,
    name: fullName,
    age: 12 + (i % 7),
    grade: `${8 + (i % 5)}th Grade`,
    mentor: mentorObj.name,
    guardian: `${kashmiriLastNames[(i + 7) % kashmiriLastNames.length]} Ahmad`,
    progress: Math.min(100, Math.max(45, 60 + ((i * 17) % 41))),
    attendance: Math.min(100, Math.max(70, 75 + ((i * 13) % 26))),
    upcomingSession: `July ${(i % 10) + 3}, 2026 - Subject Booster`,
    status: i % 18 === 0 ? 'On Leave' : i % 25 === 0 ? 'Suspended' : i % 30 === 0 ? 'Graduated' : 'Active',
    avatar: mentors[(i + 5) % mentors.length].avatar // Mix profile avatars
  });
}

// ==========================================
// 4. USERS (Multi-tenant users table)
// ==========================================
export const users: User[] = [
  { id: 'u-1', name: 'Zoya Khan', email: 'zoya.khan@brightfuture.com', role: 'Student', organization: 'Bright Future Academy', status: 'Active', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', createdDate: '2025-09-01', lastLogin: '2026-07-02 08:32 AM', number: '+91 98765 00001', gender: 'Female', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-2', name: 'Aadil Bhat', email: 'aadil.bhat@brightfuture.com', role: 'Mentor', organization: 'Bright Future Academy', status: 'Active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', createdDate: '2025-08-15', lastLogin: '2026-07-02 09:15 AM', number: '+91 98765 00002', gender: 'Male', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-3', name: 'Mahin Bhat', email: 'mahinbhat@gmail.com', role: 'Super Admin', organization: 'All Organizations', status: 'Active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', createdDate: '2025-01-01', lastLogin: '2026-07-02 10:42 AM', number: '+91 98765 00003', gender: 'Male', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-4', name: 'Mehreen Shafi', email: 'mehreen@smartminds.org', role: 'Mentor', organization: 'Smart Minds J&K', status: 'Active', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', createdDate: '2025-10-10', lastLogin: '2026-07-01 04:22 PM', number: '+91 98765 00004', gender: 'Female', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-5', name: 'Tariq Al-Hamid', email: 'tariq.admin@brightfuture.com', role: 'Organization Admin', organization: 'Bright Future Academy', status: 'Active', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', createdDate: '2025-07-20', lastLogin: '2026-07-02 06:11 AM', number: '+91 98765 00005', gender: 'Male', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-6', name: 'Sameer Rather', email: 'sameer.rather@gmail.com', role: 'Student', organization: 'Bright Future Academy', status: 'Active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', createdDate: '2025-09-02', lastLogin: '2026-07-01 11:30 AM', number: '+91 98765 00006', gender: 'Male', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-7', name: 'Tabasum Ara', email: 'tabasum@smartminds.org', role: 'Student', organization: 'Smart Minds J&K', status: 'Active', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80', createdDate: '2025-10-15', lastLogin: '2026-07-02 07:18 AM', number: '+91 98765 00007', gender: 'Female', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-8', name: 'Shabir Ganie', email: 'shabir@learnhub.com', role: 'Assistant', organization: 'LearnHub Institute', status: 'Active', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', createdDate: '2025-11-05', lastLogin: '2026-07-01 02:40 PM', number: '+91 98765 00008', gender: 'Male', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-9', name: 'Rayees Mir', email: 'rayees.mir@outlook.com', role: 'Student', organization: 'Smart Minds J&K', status: 'Pending', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', createdDate: '2026-06-28', lastLogin: 'Never', number: '+91 98765 00009', gender: 'Male', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-10', name: 'Sarah Johnson', email: 'sarah@learnhub.com', role: 'Mentor', organization: 'LearnHub Institute', status: 'Active', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', createdDate: '2025-05-15', lastLogin: '2026-07-02 09:30 AM', number: '+91 98765 00010', gender: 'Female', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-11', name: 'Faisal Dar', email: 'faisal.dar@gmail.com', role: 'Student', organization: 'Bright Future Academy', status: 'Active', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', createdDate: '2025-09-01', lastLogin: '2026-07-01 05:10 PM', number: '+91 98765 00011', gender: 'Male', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' },
  { id: 'u-12', name: 'Nuzhat Jan', email: 'nuzhat@aspire.in', role: 'Assistant', organization: 'Aspire Education', status: 'Inactive', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', createdDate: '2025-12-01', lastLogin: '2026-05-20 01:15 PM', number: '+91 98765 00012', gender: 'Female', password: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' }
];

// ==========================================
// 5. SESSIONS (300+ items)
// ==========================================
export const sessions: Session[] = [];

const categories: Session['category'][] = ['Academic', 'Behavioral', 'Doubt Clearing', 'Exam Prep', 'Special Need'];
const sampleHomework = [
  'Complete Chapter 4 Review Exercises and submit on Portal.',
  'Read Page 112 to 140 of World History book, write 300 words essay.',
  'Debug the binary search script and fix the boundary condition bug.',
  'Solve CBSE 2025 Board paper Section B and C.',
  'Write a short speech about Climate Change in Urdu.',
  'No homework assigned, focus on self study for mid-terms.'
];
const sampleNotes = [
  'Student demonstrated a solid understanding of the concepts. Solved algebraic inequalities accurately. Attention is required on exponential formulas.',
  'Student was focused and prepared. Analyzed the characters of Hamlet in detail. Showing good growth in creative writing modules.',
  'Slightly distracted. Behavioral issues discussed. We focused on setting concrete milestones. Homework was partially complete.',
  'Excellent session. Covered Python data files and exception handling with try-except blocks. Faisal solved 3 hard questions live.',
  'Focused heavily on the upcoming organic chemistry test. Rayees is anxious but well prepared. Practiced mechanism drawings.'
];

const meetingLinks = [
  'https://meet.google.com/abc-defg-hij',
  'https://meet.google.com/xyz-pqrs-tuv',
  'https://meet.google.com/mno-klmn-opq',
  'https://meet.google.com/uvw-rstu-xyz'
];

// Let's generate 305 sessions programmatically
for (let i = 0; i < 305; i++) {
  const studentObj = students[i % students.length];
  const mentorObj = mentors[i % mentors.length];
  const daysOffset = (i % 20) - 10; // Sessions ranging from 10 days ago to 9 days from now
  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() + daysOffset);
  const formattedDate = dateObj.toISOString().split('T')[0];
  
  const status: Session['status'] = daysOffset < 0 ? (i % 12 === 0 ? 'Cancelled' : 'Completed') : (daysOffset === 0 ? 'Completed' : 'Upcoming');
  const attendance: Session['attendance'] = status === 'Completed' ? (i % 22 === 0 ? 'Absent' : i % 28 === 0 ? 'Excused' : 'Present') : 'Pending';

  sessions.push({
    id: `sess-${i + 1}`,
    student: studentObj.name,
    mentor: mentorObj.name,
    date: formattedDate,
    time: `${9 + (i % 8)}:00 ${i % 2 === 0 ? 'AM' : 'PM'}`,
    duration: i % 3 === 0 ? '90 mins' : '60 mins',
    meetingLink: meetingLinks[i % meetingLinks.length],
    attendance,
    homework: sampleHomework[i % sampleHomework.length],
    notes: sampleNotes[i % sampleNotes.length],
    privateNotes: i % 2 === 0 ? 'Focus on retention. Student appears under pressure from guardians.' : undefined,
    sharedNotes: 'Practice formulas daily. Revision test scheduled next Wednesday.',
    voiceNotesUrl: i % 4 === 0 ? 'https://example.com/audio/session_v_note.mp3' : undefined,
    files: i % 3 === 0 ? ['homework_rubric.pdf', 'geometry_cheat_sheet.png'] : [],
    status,
    category: categories[i % categories.length]
  });
}

// ==========================================
// 6. MESSAGES (200+ items)
// ==========================================
// We'll generate messages for 1 select chat with "Zoya Khan" (student) and "Aadil Bhat" (mentor)
// to make the chat view fully populated with 200+ historical messages.
export const conversations: Conversation[] = [
  { id: 'c-1', name: 'Zoya Khan', role: 'Student', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', lastMessage: 'Thank you for explaining the calculus derivatives so clearly today!', time: '10:45 AM', unreadCount: 3, online: true, typing: true },
  { id: 'c-2', name: 'Aadil Bhat', role: 'Mentor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', lastMessage: 'The syllabus update for July is uploaded to the library.', time: 'Yesterday', unreadCount: 0, online: true },
  { id: 'c-3', name: 'Mehreen Shafi', role: 'Mentor', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', lastMessage: 'Evaluating Rayees Mir\'s recent mock exam right now.', time: 'Yesterday', unreadCount: 0, online: false },
  { id: 'c-4', name: 'Suhail Ahmad', role: 'Mentor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', lastMessage: 'Faisal is ready for the Python assessment tomorrow.', time: '2 days ago', unreadCount: 0, online: true },
  { id: 'c-5', name: 'Sameer Rather', role: 'Student', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', lastMessage: 'Can we reschedule our physics slot?', time: '3 days ago', unreadCount: 0, online: false }
];

export const chatMessages: Record<string, Message[]> = {};

// Let's generate 202 chat messages programmatically for Zoya Khan (c-1)
const zoyaMsgs: Message[] = [];
for (let i = 0; i < 202; i++) {
  const isMe = i % 2 === 0;
  const timeObj = new Date();
  timeObj.setMinutes(timeObj.getMinutes() - (202 - i) * 15);
  
  const sampleMeTexts = [
    'Hello Zoya, how is your mathematics revision going?',
    'Make sure to review the calculus concepts before tomorrow\'s session.',
    'I have uploaded the worksheet in the resources folder.',
    'Did you find the derivatives video helpful?',
    'Don\'t worry about the mock grades, focus on learning and regular practice.',
    'Excellent progress on the assignment! Keep it up.',
    'Let me know if Aadil is providing sufficient homework feedback.',
    'Yes, we can definitely schedule a counseling slot with your father next week.'
  ];
  
  const sampleZoyaTexts = [
    'Hi Admin, it is going quite well. Working on limits right now.',
    'I will absolutely do that. The derivative rules are a bit tricky.',
    'Yes, I downloaded it! The worksheets are super structured.',
    'Yes, it made visual differentiation so much easier to understand.',
    'Thank you for the encouragement. It really helps me feel less stressed.',
    'I am trying my best to stay regular and attend all mentor sessions.',
    'Yes, Aadil sir is fantastic. He clears every single doubt immediately.',
    'Thank you for explaining the calculus derivatives so clearly today!'
  ];

  const text = isMe 
    ? sampleMeTexts[i % sampleMeTexts.length] 
    : sampleZoyaTexts[i % sampleZoyaTexts.length];

  zoyaMsgs.push({
    id: `msg-${i + 1}`,
    senderName: isMe ? 'Mahin Bhat (Admin)' : 'Zoya Khan',
    senderRole: isMe ? 'Super Admin' : 'Student',
    avatar: isMe ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    text,
    timestamp: timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isMe,
    unread: !isMe && i >= 199, // last 3 Zoya messages are unread
    attachments: i === 150 ? [{ name: 'trigonometry_solutions.pdf', size: '1.4 MB', type: 'PDF' }] : undefined,
    voiceNoteDuration: i === 180 ? '0:42' : undefined,
    image: i === 120 ? 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&auto=format&fit=crop&q=80' : undefined
  });
}
chatMessages['c-1'] = zoyaMsgs;

// Populating c-2 messages (Aadil Bhat)
const aadilMsgs: Message[] = [];
for (let i = 0; i < 15; i++) {
  const isMe = i % 2 !== 0;
  const text = isMe 
    ? ['Hi Aadil, how is the new batch progress?', 'Excellent, keep up the high standard.'][i % 2]
    : ['All students in the batch are showing steady improvement.', 'The syllabus update for July is uploaded to the library.'][i % 2];
  
  aadilMsgs.push({
    id: `aadil-msg-${i}`,
    senderName: isMe ? 'Mahin Bhat (Admin)' : 'Aadil Bhat',
    senderRole: isMe ? 'Super Admin' : 'Mentor',
    avatar: isMe ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text,
    timestamp: 'Yesterday',
    isMe,
    unread: false
  });
}
chatMessages['c-2'] = aadilMsgs;

// Other chats get default brief arrays
chatMessages['c-3'] = [
  { id: 'c3-1', senderName: 'Mehreen Shafi', senderRole: 'Mentor', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', text: 'Evaluating Rayees Mir\'s recent mock exam right now.', timestamp: 'Yesterday', isMe: false, unread: false }
];
chatMessages['c-4'] = [
  { id: 'c4-1', senderName: 'Suhail Ahmad', senderRole: 'Mentor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', text: 'Faisal is ready for the Python assessment tomorrow.', timestamp: '2 days ago', isMe: false, unread: false }
];
chatMessages['c-5'] = [
  { id: 'c5-1', senderName: 'Sameer Rather', senderRole: 'Student', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', text: 'Can we reschedule our physics slot?', timestamp: '3 days ago', isMe: false, unread: false }
];

// ==========================================
// 7. PAYMENTS (100+ items)
// ==========================================
export const payments: Payment[] = [];
const paymentPlans: Payment['plan'][] = ['Monthly Pro', 'Annual Elite', 'Quarterly Basic', 'One-Time Session'];
const statuses: Payment['status'][] = ['Paid', 'Pending', 'Failed', 'Refunded'];

// Generate 105 payments programmatically
for (let i = 0; i < 105; i++) {
  const studentName = students[i % students.length].name;
  const orgName = organizations[i % organizations.length].name;
  const status: Payment['status'] = i % 15 === 0 ? 'Failed' : i % 25 === 0 ? 'Refunded' : i % 10 === 0 ? 'Pending' : 'Paid';
  const plan = paymentPlans[i % paymentPlans.length];
  
  let amount = 12000; // default (Monthly Pro in INR is e.g. 12,000)
  if (plan === 'Annual Elite') amount = 98000;
  if (plan === 'Quarterly Basic') amount = 32000;
  if (plan === 'One-Time Session') amount = 2500;

  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() - (i % 30)); // scattered in last 30 days
  const formattedDate = dateObj.toISOString().split('T')[0];

  payments.push({
    id: `pay-${1000 + i}`,
    amount,
    student: studentName,
    organization: orgName,
    status,
    date: formattedDate,
    invoiceNumber: `INV-2026-${8400 + i}`,
    plan,
    refundAmount: status === 'Refunded' ? amount : undefined
  });
}

// ==========================================
// 8. AUDIT LOGS (Enterprise Logs)
// ==========================================
export const auditLogs: AuditLog[] = [];
const logActions = [
  'User Login Successful',
  'Modified Organization Configuration',
  'Assigned Mentor to Student',
  'Generated Evaluation Report',
  'Created Content Resource',
  'Updated Integration Keys',
  'Exported Audit Logs to CSV',
  'Failed Login Attempt',
  'Role Permission Template Updated',
  'Approved Subscription Upgrade',
  'Suspended User Account'
];
const ipAddresses = ['192.168.1.104', '103.241.12.82', '152.199.19.160', '14.139.61.12', '182.70.122.9'];

// Generate 35 detailed audit logs
for (let i = 0; i < 35; i++) {
  const logDate = new Date();
  logDate.setMinutes(logDate.getMinutes() - i * 45); // scattered minutes/hours
  
  const action = logActions[i % logActions.length];
  const mentorObj = mentors[i % mentors.length];
  const orgObj = organizations[i % organizations.length];
  
  let user = 'Mahin Bhat';
  let role: AuditLog['role'] = 'Super Admin';
  if (i % 3 === 1) {
    user = mentorObj.name;
    role = 'Mentor';
  } else if (i % 3 === 2) {
    user = 'Tariq Al-Hamid';
    role = 'Organization Admin';
  }

  let status: AuditLog['status'] = 'Success';
  let severity: AuditLog['severity'] = 'Info';
  let details = `Successfully performed operation: ${action}`;

  if (action.includes('Failed')) {
    status = 'Failed';
    severity = 'High';
    details = `Warning: Unauthenticated user attempted access to admin panel from location J&K, India.`;
  } else if (action.includes('Suspended')) {
    status = 'Warning';
    severity = 'Medium';
    details = `User account was temporarily suspended due to inactivity or billing issues.`;
  } else if (action.includes('Assigned Mentor')) {
    details = `Assigned mentor ${mentorObj.name} to Student Zoya Khan under ${orgObj.name}.`;
  } else if (action.includes('Integration Keys')) {
    severity = 'Critical';
    details = `Rotated Google Maps API key and re-configured OAuth scope parameters.`;
  }

  auditLogs.push({
    id: `log-${i + 1}`,
    timestamp: logDate.toLocaleString(),
    user,
    role,
    organization: orgObj.name,
    action,
    ipAddress: ipAddresses[i % ipAddresses.length],
    status,
    severity,
    details
  });
}

// ==========================================
// 9. PERMISSION MATRIX
// ==========================================
export const permissionsData: PermissionMatrix[] = [
  {
    module: 'Dashboard Analytics',
    roles: {
      'Super Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Organization Admin': { create: false, read: true, update: false, delete: false, approve: false, export: true, assign: false },
      'Mentor': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false },
      'Assistant': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false },
      'Student': { create: false, read: false, update: false, delete: false, approve: false, export: false, assign: false }
    }
  },
  {
    module: 'Organization Settings',
    roles: {
      'Super Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Organization Admin': { create: false, read: true, update: true, delete: false, approve: false, export: false, assign: false },
      'Mentor': { create: false, read: false, update: false, delete: false, approve: false, export: false, assign: false },
      'Assistant': { create: false, read: false, update: false, delete: false, approve: false, export: false, assign: false },
      'Student': { create: false, read: false, update: false, delete: false, approve: false, export: false, assign: false }
    }
  },
  {
    module: 'Mentor Assignments',
    roles: {
      'Super Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Organization Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Mentor': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false },
      'Assistant': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: true },
      'Student': { create: false, read: false, update: false, delete: false, approve: false, export: false, assign: false }
    }
  },
  {
    module: 'Session Transcripts & Notes',
    roles: {
      'Super Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Organization Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Mentor': { create: true, read: true, update: true, delete: false, approve: true, export: true, assign: false },
      'Assistant': { create: true, read: true, update: true, delete: false, approve: false, export: false, assign: false },
      'Student': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false }
    }
  },
  {
    module: 'Student Evaluations',
    roles: {
      'Super Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Organization Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Mentor': { create: true, read: true, update: true, delete: false, approve: true, export: false, assign: false },
      'Assistant': { create: true, read: true, update: true, delete: false, approve: false, export: false, assign: false },
      'Student': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false }
    }
  },
  {
    module: 'Financial Transactions',
    roles: {
      'Super Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Organization Admin': { create: false, read: true, update: false, delete: false, approve: false, export: true, assign: false },
      'Mentor': { create: false, read: false, update: false, delete: false, approve: false, export: false, assign: false },
      'Assistant': { create: false, read: false, update: false, delete: false, approve: false, export: false, assign: false },
      'Student': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false }
    }
  },
  {
    module: 'User and Role Management',
    roles: {
      'Super Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Organization Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Mentor': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false },
      'Assistant': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false },
      'Student': { create: false, read: false, update: false, delete: false, approve: false, export: false, assign: false }
    }
  },
  {
    module: 'Session Scheduling',
    roles: {
      'Super Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Organization Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Mentor': { create: true, read: true, update: true, delete: false, approve: true, export: false, assign: false },
      'Assistant': { create: true, read: true, update: true, delete: false, approve: false, export: false, assign: false },
      'Student': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false }
    }
  },
  {
    module: 'Messaging',
    roles: {
      'Super Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Organization Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Mentor': { create: true, read: true, update: true, delete: false, approve: true, export: false, assign: false },
      'Assistant': { create: true, read: true, update: true, delete: false, approve: false, export: false, assign: false },
      'Student': { create: true, read: true, update: false, delete: false, approve: false, export: false, assign: false }
    }
  },
  {
    module: 'Content Library',
    roles: {
      'Super Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Organization Admin': { create: true, read: true, update: true, delete: true, approve: true, export: true, assign: true },
      'Mentor': { create: true, read: true, update: true, delete: false, approve: true, export: false, assign: false },
      'Assistant': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false },
      'Student': { create: false, read: true, update: false, delete: false, approve: false, export: false, assign: false }
    }
  }
];

// ==========================================
// 10. CONTENT LIBRARY RESOURCES
// ==========================================
export const contentResources = [
  // ── Global resources (visible to all orgs) ──
  { id: 'c-res-1', title: 'Calculus Made Simple: Derivatives', type: 'Video', duration: '24 mins', category: 'Mathematics', author: 'Aadil Bhat', rating: 4.9, size: '254 MB', thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&auto=format&fit=crop&q=80', bookmarked: true, organization: 'Global' },
  { id: 'c-res-2', title: 'Organic Chemistry Reactions Cheat-Sheet', type: 'PDF', category: 'Chemistry', author: 'Mehreen Shafi', rating: 4.8, size: '4.8 MB', thumbnail: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=300&auto=format&fit=crop&q=80', bookmarked: false, organization: 'Global' },
  { id: 'c-res-3', title: 'Python Basics Workbook', type: 'Worksheet', category: 'Computer Science', author: 'Suhail Ahmad', rating: 4.95, size: '12.4 MB', thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=300&auto=format&fit=crop&q=80', bookmarked: true, organization: 'Global' },
  { id: 'c-res-4', title: 'World History: French Revolution Notes', type: 'PDF', category: 'History', author: 'Emily Carter', rating: 4.5, size: '2.1 MB', thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&auto=format&fit=crop&q=80', bookmarked: false, organization: 'Global' },
  { id: 'c-res-5', title: 'Grammar and Creative Writing Rubrics', type: 'Worksheet', category: 'English', author: 'Sarah Johnson', rating: 4.7, size: '3.5 MB', thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=300&auto=format&fit=crop&q=80', bookmarked: true, organization: 'Global' },
  { id: 'c-res-6', title: 'Basics of Microeconomics Lecture', type: 'Video', duration: '45 mins', category: 'Economics', author: 'Yasir Wani', rating: 4.6, size: '412 MB', thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=300&auto=format&fit=crop&q=80', bookmarked: false, organization: 'Global' },
  { id: 'c-res-7', title: 'Trigonometry Assignment Questions', type: 'Assignment', category: 'Mathematics', author: 'Bisma Yusuf', rating: 4.8, size: '1.9 MB', thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&auto=format&fit=crop&q=80', bookmarked: false, organization: 'Global' },
  { id: 'c-res-8', title: 'Genetics & Cell Division Practice Paper', type: 'Assignment', category: 'Biology', author: 'Saima Akhter', rating: 4.75, size: '1.2 MB', thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1ea06073e5?w=300&auto=format&fit=crop&q=80', bookmarked: true, organization: 'Global' },
  // ── Bright Future Academy ──
  { id: 'c-res-9',  title: 'JEE Advanced Physics Problem Set', type: 'Assignment', category: 'Physics', author: 'Aadil Bhat', rating: 4.85, size: '2.8 MB', thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=300&auto=format&fit=crop&q=80', bookmarked: false, organization: 'Bright Future Academy' },
  { id: 'c-res-10', title: 'CBSE Board Exam Preparation Guide', type: 'PDF', category: 'General', author: 'Aadil Bhat', rating: 4.7, size: '8.3 MB', thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&auto=format&fit=crop&q=80', bookmarked: true, organization: 'Bright Future Academy' },
  // ── Smart Minds J&K ──
  { id: 'c-res-11', title: 'Kashmir History & Culture Study Notes', type: 'PDF', category: 'History', author: 'Mehreen Shafi', rating: 4.6, size: '5.1 MB', thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&auto=format&fit=crop&q=80', bookmarked: false, organization: 'Smart Minds J&K' },
  { id: 'c-res-12', title: 'Advanced Biology: NEET Practice Papers', type: 'Assignment', category: 'Biology', author: 'Mehreen Shafi', rating: 4.9, size: '3.2 MB', thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1ea06073e5?w=300&auto=format&fit=crop&q=80', bookmarked: true, organization: 'Smart Minds J&K' },
  // ── LearnHub Institute ──
  { id: 'c-res-13', title: 'Creative Writing Workshop Templates', type: 'Worksheet', category: 'English', author: 'Sarah Johnson', rating: 4.8, size: '2.4 MB', thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=300&auto=format&fit=crop&q=80', bookmarked: false, organization: 'LearnHub Institute' },
  { id: 'c-res-14', title: 'Financial Literacy for Teens', type: 'Video', duration: '32 mins', category: 'Economics', author: 'David Wilson', rating: 4.65, size: '380 MB', thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&auto=format&fit=crop&q=80', bookmarked: false, organization: 'LearnHub Institute' },
  // ── Aspire Education ──
  { id: 'c-res-15', title: 'Vedic Mathematics Speed Techniques', type: 'Video', duration: '38 mins', category: 'Mathematics', author: 'Shahnawaz Malik', rating: 4.92, size: '290 MB', thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&auto=format&fit=crop&q=80', bookmarked: true, organization: 'Aspire Education' },
  { id: 'c-res-16', title: 'Data Structures & Algorithms Notes', type: 'PDF', category: 'Computer Science', author: 'Suhail Ahmad', rating: 4.88, size: '6.7 MB', thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=300&auto=format&fit=crop&q=80', bookmarked: false, organization: 'Aspire Education' },
];

// ==========================================
// 11. REPORTS & CHARTS ANALYTICS
// ==========================================
export const reportsAnalytics = {
  studentGrowth: [
    { month: 'Jan', ActiveStudents: 2800, NewRegistrations: 120 },
    { month: 'Feb', ActiveStudents: 2950, NewRegistrations: 180 },
    { month: 'Mar', ActiveStudents: 3100, NewRegistrations: 210 },
    { month: 'Apr', ActiveStudents: 3220, NewRegistrations: 150 },
    { month: 'May', ActiveStudents: 3350, NewRegistrations: 230 },
    { month: 'Jun', ActiveStudents: 3482, NewRegistrations: 280 }
  ],
  mentorActivity: [
    { name: 'Aadil Bhat', Sessions: 48, Hours: 72, FeedbackRating: 4.9 },
    { name: 'Mehreen Shafi', Sessions: 42, Hours: 63, FeedbackRating: 4.7 },
    { name: 'Suhail Ahmad', Sessions: 52, Hours: 80, FeedbackRating: 4.95 },
    { name: 'David Wilson', Sessions: 45, Hours: 67, FeedbackRating: 4.88 },
    { name: 'Sarah Johnson', Sessions: 32, Hours: 48, FeedbackRating: 4.8 },
    { name: 'Shahnawaz Malik', Sessions: 38, Hours: 57, FeedbackRating: 4.92 },
    { name: 'Bisma Yusuf', Sessions: 30, Hours: 45, FeedbackRating: 4.76 }
  ],
  monthlySessions: [
    { month: 'Jan', Completed: 2100, Cancelled: 120, Upcoming: 0 },
    { month: 'Feb', Completed: 2300, Cancelled: 110, Upcoming: 0 },
    { month: 'Mar', Completed: 2450, Cancelled: 140, Upcoming: 0 },
    { month: 'Apr', Completed: 2600, Cancelled: 90, Upcoming: 50 },
    { month: 'May', Completed: 2820, Cancelled: 150, Upcoming: 180 },
    { month: 'Jun', Completed: 3120, Cancelled: 130, Upcoming: 240 }
  ],
  revenueTrend: [
    { month: 'Jan', Revenue: 950000, Subscriptions: 380000, Sessions: 570000 },
    { month: 'Feb', Revenue: 1040000, Subscriptions: 420000, Sessions: 620000 },
    { month: 'Mar', Revenue: 1120000, Subscriptions: 450000, Sessions: 670000 },
    { month: 'Apr', Revenue: 1180000, Subscriptions: 480000, Sessions: 700000 },
    { month: 'May', Revenue: 1240000, Subscriptions: 500000, Sessions: 740000 },
    { month: 'Jun', Revenue: 1284000, Subscriptions: 520000, Sessions: 764000 }
  ]
};

// Post-process mock data to inject organization and email properties
mentors.forEach(m => {
  m.organization = m.email.includes('brightfuture') ? 'Bright Future Academy' :
                   m.email.includes('learnhub') ? 'LearnHub Institute' :
                   m.email.includes('smartminds') ? 'Smart Minds J&K' :
                   m.email.includes('aspire') ? 'Aspire Education' : 'Valley Crest Academics';
});

students.forEach(s => {
  const mentorObj = mentors.find(m => m.name === s.mentor) || mentors[0];
  s.organization = mentorObj.organization;
  const emailDomain = s.organization === 'Bright Future Academy' ? 'brightfuture.com' :
                      s.organization === 'LearnHub Institute' ? 'learnhub.com' :
                      s.organization === 'Smart Minds J&K' ? 'smartminds.org' :
                      s.organization === 'Aspire Education' ? 'aspire.in' : 'valleycrest.edu';
  s.email = `${s.name.split(' ')[0].toLowerCase()}.${s.name.split(' ')[1]?.toLowerCase() || 'student'}@${emailDomain}`;
});

sessions.forEach(sess => {
  const studentObj = students.find(s => s.name === sess.student) || students[0];
  const mentorObj = mentors.find(m => m.name === studentObj.mentor) || mentors[0];
  sess.mentor = mentorObj.name;
  sess.organization = studentObj.organization;
});

users.forEach(u => {
  if (u.role === 'Assistant') {
    u.mentor_id = u.id === 'u-8' ? 'u-10' : 'm-4'; // Shabir maps to Sarah Johnson (u-10), Nuzhat maps to Suhail Ahmad (m-4)
  }
});

permissionsData.forEach(p => {
  p.organization = 'Global';
});

