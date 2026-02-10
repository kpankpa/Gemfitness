# Quick Testing Guide 🧪

## How to Test All New UI Features

### Prerequisites

1. Start development server: `npm run dev`
2. Login as admin user
3. Navigate to `/admin/dashboard`

---

## 1️⃣ Test Enhanced Class Cancellation

### Steps:

1. Click **Classes** tab in dashboard
2. Find any active class card
3. Click **⋮** (three dots) → **Cancel Class**

### Expected Behavior:

- ✅ Modal opens with class name in header
- ✅ Shows enrolled member count (e.g., "5 members")
- ✅ Reason textarea is empty (required field)
- ✅ Alternative classes list shows filtered active classes
- ✅ Can select multiple alternative classes (checkboxes)
- ✅ Counter shows "✓ X alternative classes selected"
- ✅ "Cancel Class" button disabled until reason entered

### Test Cases:

- **No reason:** Button stays disabled
- **With reason:** Button enabled
- **Select 2 alternatives:** Counter shows "✓ 2 alternative classes selected"
- **Submit:** Success toast appears with member count
- **Check email:** Enrolled members receive cancellation email with alternative class links

---

## 2️⃣ Test Event Cancellation with Refunds

### Steps:

1. Click **Events** tab in dashboard
2. Find any upcoming event (preferably paid)
3. Click **⋮** → **Cancel Event** (orange text)

### Expected Behavior:

- ✅ Modal opens with event title in header
- ✅ Warning banner shows: attendee count, refund details (if paid)
- ✅ Estimated refund calculation displayed (e.g., "GH₵ 500.00")
- ✅ Reason textarea is empty (required)
- ✅ "Cancel Event" button disabled until reason entered

### Test Cases:

**Paid Event:**

```
- Shows: "Process automatic refunds for all paid registrations (GH₵ 50.00 each)"
- Shows: "Estimated Total Refunds: GH₵ 500.00" (if 10 attendees)
- Success toast includes: "X refunds processed (GH₵ Y)"
```

**Free Event:**

```
- No refund warnings shown
- Only attendee notification mentioned
- Success toast shows attendee notification count only
```

---

## 3️⃣ Test Event Promotional Emails

### Steps:

1. Click **Events** tab in dashboard
2. Find any event card
3. Click **Promote** button (purple, on card)

### Expected Behavior:

- ✅ Modal opens with "Send Promotional Email" title
- ✅ Three radio button options:
  - All Users
  - Active Members Only
  - New Users / Prospects
- ✅ Default selection: "All Users"
- ✅ Custom message textarea (optional)
- ✅ "Send Promotional Email" button enabled

### Test Cases:

**Audience Targeting:**

```
1. Select "All Users" → Submit → Toast: "sent to X recipients"
2. Select "Active Members Only" → Submit → Toast shows member count
3. Select "New Users / Prospects" → Submit → Toast shows prospect count
```

**Custom Message:**

```
1. Leave blank → Email uses default template
2. Add custom text → Email includes custom message at top
```

**Email Content Check:**

- Should include event title, date, location, pricing automatically
- Custom message appears first (if provided)
- CTA button to register/learn more

---

## 4️⃣ Test Event Dropdown Menu Changes

### Steps:

1. Click **Events** tab
2. Click **⋮** on any event card

### Expected Menu Items:

```
✅ View Details
✅ Manage Attendees
✅ Generate Tickets (if paid)
✅ Event Check-in
✅ Set Deadline
✅ Edit Event
✅ Bulk Email ← (moved from button)
── (separator) ──
✅ Cancel Event ← (NEW, orange)
✅ Delete ← (red)
```

### Verify:

- "Bulk Email" still works (opens BulkEmailModal)
- "Cancel Event" opens new cancellation modal
- Color coding: orange (cancel), red (delete)

---

## 5️⃣ Security Testing

### Test Admin Permissions:

**As Admin User:**

```
1. Classes: ✅ "Cancel Class" visible in dropdown
2. Events: ✅ "Cancel Event" visible in dropdown
3. Events: ✅ "Promote" button visible on cards
```

**As Non-Admin (if applicable):**

```
1. Classes: ❌ "Cancel Class" NOT visible
2. Events: ❌ "Cancel Event" NOT visible
3. Events: ❌ "Promote" button hidden or disabled
```

---

## 6️⃣ Edge Case Testing

### Empty States:

- **No alternative classes:** Shows "No alternative classes available"
- **No upcoming classes:** List is empty (expected)
- **Event with 0 attendees:** Modal still opens, shows "0 registered attendees"

### Validation:

- **Empty reason field:** Button disabled ✅
- **Whitespace only reason:** Should be rejected (trim() check)
- **Network error:** Error toast appears ✅

### Loading States:

- **During cancellation:** Button shows "Cancelling..." and is disabled
- **During promo send:** Button shows "Sending..." and is disabled
- **Modal close during API call:** Modal stays open until completion

---

## 7️⃣ Email Verification (Backend)

### Check Console Logs:

```bash
# Class Cancellation Email
✅ Subject: "Class Cancelled: [Class Name]"
✅ Contains: Reason, alternative classes (if selected)
✅ Recipients: All enrolled members

# Event Cancellation Email
✅ Subject: "Event Cancelled: [Event Title]"
✅ Contains: Reason, refund information (if paid)
✅ Recipients: All registered attendees

# Event Promotional Email
✅ Subject: "Don't Miss: [Event Title]"
✅ Contains: Event details, custom message, CTA
✅ Recipients: Based on audience selection
```

### Production Email Testing:

1. Use real email addresses in test accounts
2. Check spam folders
3. Verify email formatting (HTML)
4. Test links (if any)

---

## 📊 Success Criteria Checklist

### Functionality

- [ ] All modals open/close correctly
- [ ] Required fields validated
- [ ] API calls succeed
- [ ] Success toasts appear with correct data
- [ ] Error toasts appear on failures
- [ ] Loading states work during API calls

### UI/UX

- [ ] Modals are responsive (mobile/tablet)
- [ ] Icons display correctly
- [ ] Color coding is intuitive
- [ ] Text is readable (contrast)
- [ ] Buttons have hover states
- [ ] Checkboxes/radio buttons styled correctly

### Security

- [ ] Permissions enforced (admin-only actions)
- [ ] No console errors
- [ ] No XSS vulnerabilities (input sanitization)
- [ ] API endpoints return 401 for unauthorized users

### Performance

- [ ] Modals open/close smoothly
- [ ] No lag when selecting alternative classes
- [ ] API calls complete in <3 seconds
- [ ] No memory leaks (check DevTools)

---

## 🐛 Common Issues & Solutions

### Issue: Modal doesn't open

**Solution:** Check console for errors, verify state variables initialized

### Issue: "Cancel Class" button stays disabled

**Solution:** Enter text in reason field (required field validation)

### Issue: Alternative classes list is empty

**Solution:** Ensure active classes exist with future dates

### Issue: Success toast doesn't appear

**Solution:** Check `showToast` function, verify API response format

### Issue: Emails not sending

**Solution:**

1. Check email service configuration
2. Verify environment variables (SMTP settings)
3. Check console logs for email errors

### Issue: Refund calculation shows NaN

**Solution:** Verify event has valid `price` field (number type)

---

## 🔧 Development Tools

### Useful Commands:

```bash
# Check TypeScript errors
npm run build

# Check ESLint warnings
npm run lint

# View email previews (if configured)
# Visit: http://localhost:3000/api/emails/preview
```

### Browser DevTools:

- **Network Tab:** Monitor API calls, check request/response
- **Console:** Watch for errors, warnings
- **React DevTools:** Inspect state changes
- **Application Tab:** Check localStorage, cookies

---

## 📸 Screenshots to Capture

For documentation/bug reports:

1. Class cancellation modal with alternative classes selected
2. Event cancellation modal showing refund estimate
3. Event promotional modal with audience selection
4. Success toast messages
5. Email previews (HTML view)

---

**Testing Time Estimate:** 30-45 minutes for comprehensive testing  
**Critical Paths:** Class cancellation, Event promotion  
**Nice-to-Have:** Bulk email functionality (existing feature)
