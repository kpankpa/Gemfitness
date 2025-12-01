# QR Code & Check-In System - Testing Guide

## 🎯 Test Scenarios

### Test 1: View QR Code on Member Dashboard

**Objective**: Verify QR code displays visually

**Steps:**

1. Navigate to http://localhost:3000
2. Login with test user:
   - Email: `junior@example.com` (or your test account)
   - Password: (your test password)
3. Navigate to Member Dashboard
4. Scroll to "Your QR Code" card
5. **Expected Result**:
   - ✅ Actual QR code image displays (not just text/icon)
   - ✅ QR code is scannable quality (256x256px)
   - ✅ Text label shows below QR: `GYM-{userId}-{nanoid}`
   - ✅ "Download QR Code" button appears

### Test 2: Download QR Code

**Objective**: Verify download functionality

**Steps:**

1. From Member Dashboard → "Your QR Code" card
2. Click "Download QR Code" button
3. **Expected Result**:
   - ✅ Browser downloads PNG file
   - ✅ Filename: `gemfitness-qr-{firstName}.png`
   - ✅ Image opens and shows QR code
   - ✅ QR code is scannable from downloaded image

### Test 3: Manual Check-In via Admin Dashboard

**Objective**: Verify check-in by typing QR code

**Steps:**

1. Get member's QR code text (from member dashboard)
   - Example: `GYM-cmin5ks300000tpekh0dhdzvu-5dwuxm7ct`
2. Navigate to Admin Dashboard: http://localhost:3000/admin/dashboard
3. Go to "Check-In" tab
4. Find "QR Code Scanner" section
5. Type/paste the QR code in input field
6. Click "Scan" button (or press Enter)
7. **Expected Result**:
   - ✅ Alert: "✅ Check-in successful for {Name}!"
   - ✅ Member appears in "Recent Check-Ins" list
   - ✅ Today's check-in count increases
   - ✅ Input field clears after successful check-in

### Test 4: QR Format Validation

**Objective**: Verify invalid QR codes are rejected

**Steps:**

1. Admin Dashboard → Check-In tab → QR Scanner
2. Enter invalid QR code: `INVALID-QR-CODE`
3. Click "Scan"
4. **Expected Result**:
   - ✅ Red error box appears
   - ✅ Message: "Invalid QR code format"
   - ✅ Check-in NOT created
   - ✅ No API call made

**Test with different invalid formats:**

- `GYM-123` (too short)
- `ABC-cmin5ks300000tpekh0dhdzvu-5dwuxm7ct` (wrong prefix)
- `GYM-invalid-nanoid` (wrong UUID format)

### Test 5: Expired Subscription Check

**Objective**: Verify expired members can't check-in

**Steps:**

1. Create test member with expired subscription OR
2. Use existing member and update subscription in database:
   ```sql
   UPDATE "Subscription"
   SET status = 'EXPIRED'
   WHERE "userId" = '{test-user-id}';
   ```
3. Try to check-in with their QR code
4. **Expected Result**:
   - ✅ Alert: "Member does not have an active subscription"
   - ✅ Check-in NOT created
   - ✅ Member NOT added to check-ins list

### Test 6: Scanner Mode Activation

**Objective**: Verify scanner mode for barcode scanners

**Steps:**

1. Admin Dashboard → Check-In tab
2. Click "Activate Scanner" button
3. **Expected Result**:
   - ✅ Button text changes to "Scanning Active..."
   - ✅ Blue info box appears: "Ready to scan - Point scanner at QR code"
   - ✅ Input field receives focus
   - ✅ Scanner mode auto-stops after 30 seconds

### Test 7: Physical Barcode Scanner (If Available)

**Objective**: Test with USB/Bluetooth barcode scanner

**Prerequisites**: USB barcode scanner configured as keyboard input

**Steps:**

1. Print member QR code (from download feature)
2. Admin Dashboard → Check-In tab
3. Click "Activate Scanner"
4. Point barcode scanner at printed QR code
5. Scanner should beep and auto-type QR code
6. **Expected Result**:
   - ✅ QR code auto-populates input field
   - ✅ Check-in triggers automatically (or press Enter)
   - ✅ Success alert shows immediately
   - ✅ Fast check-in process (< 3 seconds)

### Test 8: Multiple Check-Ins Same Day

**Objective**: Verify members can check-in multiple times

**Steps:**

1. Check-in a member via QR code
2. Wait 1 minute
3. Check-in same member again with same QR code
4. **Expected Result**:
   - ✅ Both check-ins succeed
   - ✅ Both appear in "Recent Check-Ins" list
   - ✅ Different timestamps shown
   - ✅ No "already checked-in" error

### Test 9: Check-In Method Tracking

**Objective**: Verify method field records correctly

**Steps:**

1. Check-in via QR scanner → method should be 'qr'
2. Check database:
   ```sql
   SELECT * FROM "CheckIn"
   WHERE "userId" = '{test-user-id}'
   ORDER BY "checkInTime" DESC
   LIMIT 1;
   ```
3. **Expected Result**:
   - ✅ `method` field = 'qr'
   - ✅ `checkedBy` field = admin email
   - ✅ `checkInTime` is current timestamp
   - ✅ `checkOutTime` is NULL

### Test 10: Real-Time Updates

**Objective**: Verify dashboard updates after check-in

**Steps:**

1. Open Admin Dashboard in browser
2. Note current check-in count
3. Perform check-in
4. **Expected Result**:
   - ✅ "Recent Check-Ins" list updates immediately
   - ✅ "Today" count increases by 1
   - ✅ No page refresh needed
   - ✅ New check-in appears at top of list

### Test 11: Member Not Found

**Objective**: Verify error handling for non-existent QR

**Steps:**

1. Create valid-format but non-existent QR code:
   - `GYM-00000000-0000-0000-0000-000000000000-1234567890`
2. Try to check-in with this QR code
3. **Expected Result**:
   - ✅ Alert: "Member not found"
   - ✅ HTTP 404 error from API
   - ✅ Check-in NOT created
   - ✅ Error displayed to user

### Test 12: QR Code Generation on Signup

**Objective**: Verify new members get QR codes automatically

**Steps:**

1. Navigate to signup page: http://localhost:3000/auth/signup
2. Create new test member with all details
3. Complete signup process
4. Login to member dashboard
5. Check "Your QR Code" card
6. **Expected Result**:
   - ✅ QR code generated during signup
   - ✅ QR code displays immediately on dashboard
   - ✅ QR code is unique (check in database)
   - ✅ QR code follows format: `GYM-{userId}-{nanoid}`

### Test 13: Mobile Responsiveness

**Objective**: Verify QR system works on mobile

**Steps:**

1. Open on mobile device or browser DevTools mobile view
2. Login to member dashboard
3. View QR code
4. **Expected Result**:
   - ✅ QR code displays at appropriate size
   - ✅ Download button accessible
   - ✅ QR code readable on mobile screen
   - ✅ No layout issues or overflow

### Test 14: API Performance

**Objective**: Measure check-in speed

**Steps:**

1. Open browser DevTools → Network tab
2. Perform check-in via QR code
3. Check API response time for `/api/checkins` POST
4. **Expected Result**:
   - ✅ Response time < 500ms
   - ✅ Database query efficient
   - ✅ No timeout errors
   - ✅ Consistent performance across multiple check-ins

### Test 15: Concurrent Check-Ins

**Objective**: Test multiple simultaneous check-ins

**Steps:**

1. Open 2-3 browser windows/tabs with admin dashboard
2. Check-in different members at same time
3. **Expected Result**:
   - ✅ All check-ins succeed
   - ✅ No race conditions
   - ✅ All dashboards update correctly
   - ✅ Correct check-in counts

## 🐛 Known Issues / Limitations

1. **No Camera Scanner Yet**: Currently text input only, physical scanners work
2. **No Check-Out**: System tracks check-in but not check-out times (future)
3. **No Duplicate Prevention**: Same member can check-in multiple times/day
4. **No Auto-Refresh**: Check-ins list doesn't auto-update (need manual refresh)
5. **Limited Error Details**: API errors could be more descriptive

## ✅ Success Criteria

A successful implementation should have:

- ✅ QR codes display as actual images (not text)
- ✅ Download functionality works
- ✅ Scanner accepts manual input and validates format
- ✅ Check-in creates database record
- ✅ Subscription validation prevents expired members
- ✅ Real-time updates refresh lists
- ✅ No console errors in browser
- ✅ Mobile-responsive design
- ✅ Fast performance (< 500ms)

## 🔍 Debugging Tips

### QR Code Not Displaying

```javascript
// Check browser console for:
- "Failed to generate QR code"
- Network errors
- Missing qrcode library

// Fix:
npm install qrcode
npm run dev
```

### Check-In Fails

```javascript
// Check API response in Network tab:
- 404 = Member not found (wrong QR code)
- 403 = No active subscription
- 500 = Server error (check logs)

// Verify QR format:
const pattern = /^GYM-[a-f0-9-]{36}-[a-zA-Z0-9_-]{10}$/;
console.log(pattern.test(qrCode));
```

### Scanner Not Responsive

```javascript
// Check:
1. Input field receives focus
2. Keyboard events fire
3. Validation function runs
4. No JavaScript errors

// Test barcode scanner:
- Open Notepad, scan QR
- Should type the QR text
- If not, scanner needs configuration
```

## 📊 Test Results Template

```markdown
## Test Results - [Date]

### Environment

- Browser: Chrome/Firefox/Safari
- Device: Desktop/Mobile
- Next.js: 16.0.5
- Database: PostgreSQL

### Test Results

| Test # | Test Name          | Status  | Notes                  |
| ------ | ------------------ | ------- | ---------------------- |
| 1      | View QR Code       | ✅ PASS | QR displays correctly  |
| 2      | Download QR        | ✅ PASS | PNG downloads          |
| 3      | Manual Check-In    | ✅ PASS | Check-in successful    |
| 4      | Format Validation  | ✅ PASS | Rejects invalid QR     |
| 5      | Subscription Check | ✅ PASS | Blocks expired members |
| ...    | ...                | ...     | ...                    |

### Issues Found

1. Issue: [Description]
   - Severity: High/Medium/Low
   - Steps to Reproduce: ...
   - Expected: ...
   - Actual: ...

### Performance

- QR Generation: ~50ms
- Check-in API: ~300ms
- Page Load: ~2s

### Recommendations

1. Add camera scanner library
2. Implement check-out tracking
3. Add duplicate check-in prevention
```

## 🎓 User Training

### For Reception Staff:

1. **Check-In Process**:

   - Open Admin Dashboard
   - Click "Check-In" tab
   - Click "Activate Scanner"
   - Scan member QR code
   - Confirm success message

2. **Troubleshooting**:
   - If scanner fails → use manual entry
   - If subscription expired → notify member
   - If QR not working → check member dashboard

### For Members:

1. **Access QR Code**:

   - Login to website
   - View "Your QR Code" card
   - Save QR to phone

2. **Check-In**:
   - Show QR code to reception
   - Wait for confirmation
   - Proceed to gym

## 🚀 Next Steps

After testing, consider:

1. Add camera-based QR scanner (html5-qrcode)
2. Implement check-out system
3. Add attendance analytics
4. Create mobile app with scanner
5. Integrate with access control hardware
