# Code Citations

## License: GPL-3.0

https://github.com/Ericsson/CodeCompass/blob/d2b0ee675d01456658c7dd710661562022fc0398/webgui-new/src/utils/utils.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2,
```

## License: unknown

https://github.com/blurfx/xo.dev/blob/b934fd950e6e1115aebfe8706435156ca431060d/src/utils/date.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}
```

## License: GPL-3.0

https://github.com/Ericsson/CodeCompass/blob/d2b0ee675d01456658c7dd710661562022fc0398/webgui-new/src/utils/utils.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2,
```

## License: unknown

https://github.com/blurfx/xo.dev/blob/b934fd950e6e1115aebfe8706435156ca431060d/src/utils/date.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}
```

## License: GPL-3.0

https://github.com/Ericsson/CodeCompass/blob/d2b0ee675d01456658c7dd710661562022fc0398/webgui-new/src/utils/utils.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2,
```

## License: unknown

https://github.com/blurfx/xo.dev/blob/b934fd950e6e1115aebfe8706435156ca431060d/src/utils/date.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}
```

## License: GPL-3.0

https://github.com/Ericsson/CodeCompass/blob/d2b0ee675d01456658c7dd710661562022fc0398/webgui-new/src/utils/utils.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2,
```

## License: unknown

https://github.com/blurfx/xo.dev/blob/b934fd950e6e1115aebfe8706435156ca431060d/src/utils/date.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}
```

## License: GPL-3.0

https://github.com/Ericsson/CodeCompass/blob/d2b0ee675d01456658c7dd710661562022fc0398/webgui-new/src/utils/utils.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2,
```

## License: unknown

https://github.com/blurfx/xo.dev/blob/b934fd950e6e1115aebfe8706435156ca431060d/src/utils/date.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}
```

## License: GPL-3.0

https://github.com/Ericsson/CodeCompass/blob/d2b0ee675d01456658c7dd710661562022fc0398/webgui-new/src/utils/utils.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2,
```

## License: unknown

https://github.com/blurfx/xo.dev/blob/b934fd950e6e1115aebfe8706435156ca431060d/src/utils/date.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}
```

## License: GPL-3.0

https://github.com/Ericsson/CodeCompass/blob/d2b0ee675d01456658c7dd710661562022fc0398/webgui-new/src/utils/utils.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2,
```

## License: unknown

https://github.com/blurfx/xo.dev/blob/b934fd950e6e1115aebfe8706435156ca431060d/src/utils/date.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}
```

## License: unknown

https://github.com/blurfx/xo.dev/blob/b934fd950e6e1115aebfe8706435156ca431060d/src/utils/date.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}
```

## License: GPL-3.0

https://github.com/Ericsson/CodeCompass/blob/d2b0ee675d01456658c7dd710661562022fc0398/webgui-new/src/utils/utils.ts

````
Perfect! I've fixed the day pass display issues. Here's what was wrong and what I corrected:

## 🔧 Issues Fixed

### 1️⃣ **Timezone Date Handling Bug** (Primary Issue)
**Problem:**
- Client sent: `?date=2026-02-16`
- API parsed: `new Date('2026-02-16')` → Creates UTC midnight
- Database stores: Local time when day pass was sold
- **Result:** Mismatch between query time range and actual data timestamps

**Fix:**
```typescript
// Before (UTC conversion issue):
const dayStart = new Date(date); // UTC midnight
dayStart.setHours(0, 0, 0, 0);

// After (local timezone parsing):
const [year, month, day] = date.split('-').map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
````

### 2️⃣ **Date String Formatting**

**Problem:** Using `.toISOString().split('T')[0]` converts to UTC date string

**Fix:**

```typescript
// Helper function for consistent local date formatting
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}
```
