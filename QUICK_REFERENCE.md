# Quick Reference - Classes & Events Management

## 🎯 What Was Built

### ClassEnrollmentModal

```
┌─────────────────────────────────────────────────┐
│ 🏋️ Yoga & Meditation Class                     │
│ Instructor: Sarah Johnson | Mon, Wed, Fri 6PM  │
├─────────────────────────────────────────────────┤
│ 🔍 Search members...                            │
│                                                 │
│ Enrolled: 15/20 (75% capacity)                  │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ 👤 John Doe                                │  │
│ │ 📧 john@email.com | 📱 +233...            │  │
│ │ 💳 Premium Plan | Joined: Jan 15, 2024    │  │
│ │ [🗑️ Remove from Class]                     │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ [📥 Export to CSV] [✕ Close]                   │
└─────────────────────────────────────────────────┘
```

### EventAttendeeModal

```
┌─────────────────────────────────────────────────┐
│ 🎉 Summer Fitness Challenge                    │
│ June 15, 2024 | GemFitness Tema | GH₵ 50       │
├─────────────────────────────────────────────────┤
│ STATS                                           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│ │  45  │ │  32  │ │ 30/15│ │ 2250 │           │
│ │Regis.│ │Atten.│ │ M/NM │ │ GH₵  │           │
│ └──────┘ └──────┘ └──────┘ └──────┘           │
├─────────────────────────────────────────────────┤
│ 🔍 Search  | [Status ▼] [Type ▼]               │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ 👤 Jane Smith [MEMBER]                     │  │
│ │ ✅ ATTENDED                                │  │
│ │ 📧 jane@email.com | 📱 +233...            │  │
│ │ [❌ Mark Unattended] [📱 View QR Ticket]   │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ [📥 Export CSV] [📧 Email All] [✕ Close]       │
└─────────────────────────────────────────────────┘
```

## 📍 Where to Find It

### In Admin Dashboard

**Classes Tab:**

```
Classes Management
┌───────────────────────────────────┐
│ Yoga & Meditation                 │
│ 🕒 60 min | 📅 Mon, Wed, Fri 6PM  │
│ Enrolled: 15/20 (75%)             │
│                                   │
│ [👥 View Enrollments] [✏️ Edit] [🗑️]│
└───────────────────────────────────┘
```

**Events Tab:**

```
Events Management
┌───────────────────────────────────┐
│ Summer Fitness Challenge          │
│ 📅 June 15, 2024 | 📍 Tema        │
│ Registered: 45 | GH₵ 50           │
│                                   │
│ [👥 View Attendees] [👁️] [✏️] [🗑️]│
└───────────────────────────────────┘
```

## 🔄 User Flow

### View Class Enrollments

1. Navigate to **Classes** tab
2. Find desired class card
3. Click **"View Enrollments"** button
4. Modal opens showing all enrolled members
5. Search/filter members if needed
6. Actions available:
   - Remove member from class
   - Export list to CSV

### View Event Attendees

1. Navigate to **Events** tab
2. Find desired event card
3. Click **"View Attendees"** button
4. Modal opens with stats dashboard
5. Filter by status/type or search
6. Actions available:
   - Mark attendee as attended/unattended
   - View QR ticket
   - Export list to CSV
   - Email all attendees

## 🔗 API Endpoints

### Classes

- `GET /api/classes/[id]/enrollments` - Get enrolled members
- `DELETE /api/classes/[id]/enroll?userId=X` - Remove member
- `GET /api/classes/[id]/attendance` - Get attendance (via check-ins)

### Events

- `GET /api/events/[id]/attendees` - Get attendees with stats
- `PATCH /api/events/[id]/attendees` - Update attendee status

## ⚙️ Key Features

### ClassEnrollmentModal

✅ Real-time search (name/email/phone)
✅ Member info display (avatar, plan, enrollment date)
✅ Unenroll with confirmation
✅ Export to CSV
✅ Capacity tracking (15/20 = 75%)
✅ Responsive design

### EventAttendeeModal

✅ Stats dashboard (registered, attended, revenue)
✅ Multi-filter (status + type)
✅ Search functionality
✅ Mark attended toggle
✅ QR ticket viewer (nested modal)
✅ Export to CSV
✅ Member vs non-member breakdown

## 🎨 Design Features

### Colors & Branding

- Primary: Orange (600-700) - GemFitness brand
- Success: Green (check-ins, attended)
- Danger: Red (remove, cancel)
- Info: Blue (general info)
- Gray: Neutral backgrounds

### Animations

- Modal: Slide up from bottom
- List items: Fade in sequentially
- Buttons: Hover scale effect
- Transitions: Smooth 200-300ms

### Responsive Breakpoints

- Mobile: Stack vertically, full-width buttons
- Tablet: 2-column grid for stats
- Desktop: Multi-column layout, centered modals

## 🔐 Permissions

**Who can use these features:**

- ✅ ADMIN - Full access
- ✅ MANAGER - Full access
- ❌ RECEPTIONIST - View only (no modify)
- ❌ MEMBER - No access

## 📊 Data Flow

### Attendance Tracking (IMPORTANT!)

```
General Check-In System (Single Source of Truth)
         ↓
    CheckIn Model
         ↓
    ┌────┴────┐
    ↓         ↓
Classes    Events
(auto)     (manual)
    ↓         ↓
Attendance Modal shows data from CheckIn records
```

**No duplicate check-in systems created!**

- Classes: Auto-correlation via time window (±15 min)
- Events: Manual mark attended + general check-ins

## 🚀 Quick Start

1. **Access Dashboard:**

   - Login as ADMIN or MANAGER
   - Navigate to `/admin/dashboard`

2. **View Class Enrollments:**

   - Click **Classes** tab
   - Click **"View Enrollments"** on any class

3. **View Event Attendees:**

   - Click **Events** tab
   - Click **"View Attendees"** on any event

4. **Export Data:**
   - Open any modal
   - Click **"Export to CSV"** button
   - CSV downloads automatically

## 📝 Notes

- All modals have loading states during API calls
- Error messages display if API fails
- Confirmation dialogs for destructive actions
- Data refreshes when modal reopens
- Search is case-insensitive
- CSV exports include all visible data

## 🐛 Troubleshooting

**Modal won't open:**

- Check user role (must be ADMIN/MANAGER)
- Verify class/event has valid ID

**No data showing:**

- Check API endpoints are running
- Verify database connection
- Check browser console for errors

**Export CSV not working:**

- Check browser allows downloads
- Verify data is loaded (not empty)
- Check browser console for errors

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** Phase 1 Implementation
