# @kumix/utils

[![Version](https://img.shields.io/npm/v/@kumix/utils.svg)](https://www.npmjs.com/package/@kumix/utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive library of utility functions for building modern SaaS applications. This package provides type-safe utilities for string manipulation, date/time formatting, cryptography, validation, URL handling, and more.

## Installation

```bash
npm install @kumix/utils
# or
bun add @kumix/utils
```

## Quick Start

```typescript
import { cn, formatDate, validateEmail, nanoid, truncate } from "@kumix/utils";

// Tailwind-aware class merging
const className = cn("px-4 py-2", isActive && "bg-blue-500");

// Date formatting
const formatted = formatDate(new Date()); // "November 26, 2025"

// Email validation
const result = validateEmail("user@example.com");
if (result.isValid) {
  console.log(result.normalized); // Normalized email
}

// Generate unique IDs
const id = nanoid(); // "a1B2c3D" (7 chars by default)

// Smart text truncation
const short = truncate("Long text here...", 20); // "Long text here..."
```

## Key Features

- **Type-Safe**: Full TypeScript support with comprehensive types
- **Tree-Shakeable**: Import only what you need
- **Zero Dependencies**: Most utilities have no external dependencies
- **Client & Server**: Works in both browser and Node.js environments
- **Well-Tested**: Comprehensive test coverage
- **ESM-Only**: Modern ES modules format

## Available Utilities

### String Manipulation

```typescript
import {
  cn, // Tailwind-aware class merging
  capitalize, // Capitalize strings
  camelCase, // Convert to camelCase
  slugify, // Create URL-friendly slugs
  truncate, // Truncate text
  smartTruncate, // Smart truncation (word-aware)
  pluralize, // Pluralize words
  getInitials, // Extract initials from names
} from "@kumix/utils";

// Examples
cn("text-sm", isActive && "font-bold"); // "text-sm font-bold"
capitalize("hello world"); // "Hello world"
slugify("Hello World!"); // "hello-world"
getInitials("John Doe"); // "JD"
```

### Date & Time

```typescript
import {
  formatDate,
  formatDateTime,
  formatTime,
  timeAgo,
  getDatetimeLocal,
} from "@kumix/utils";

// Examples
formatDate(new Date()); // "November 26, 2025"
formatDateTime(new Date()); // "Nov 26, 2025, 3:45 PM"
timeAgo(new Date(Date.now() - 3600000)); // "1 hour ago"
```

### Email Validation

```typescript
import {
  validateEmail,
  normalizeEmail,
  isDisposableEmail,
  isBusinessEmail,
  getEmailDomain,
} from "@kumix/utils";

// Comprehensive validation
const result = validateEmail("user+tag@gmail.com", {
  allowDisposable: false,
});
// result.isValid, result.normalized, result.details

// Check disposable emails
isDisposableEmail("test@10minutemail.com"); // true

// Check business emails
isBusinessEmail("user@company.com"); // true
```

### Cryptography & IDs

```typescript
import { nanoid, uid, cuid, hashString } from "@kumix/utils";

// Generate IDs
nanoid(); // "a1B2c3D" (7 chars, customizable)
nanoid(12); // "a1B2c3De5F6g" (12 chars)
uid(); // "1732632000123" (timestamp-based)
cuid(); // "clj5...abc" (collision-resistant)

// Hash strings
hashString("secret"); // "5en6G6MezRroT3..."
```

### URL Utilities

```typescript
import {
  constructMetadata,
  getUrlFromString,
  isValidUrl,
  getDomainWithoutWWW,
} from "@kumix/utils";

// Build metadata for SEO
const metadata = constructMetadata({
  title: "My Page",
  description: "Page description",
  image: "/og-image.png",
});

// URL validation
isValidUrl("https://example.com"); // true
getDomainWithoutWWW("www.example.com"); // "example.com"
```

### File Utilities

```typescript
import { formatFileSize } from "@kumix/utils";

formatFileSize(1024); // "1 KB"
formatFileSize(1048576); // "1 MB"
formatFileSize(1073741824); // "1 GB"
```

### Number Formatting

```typescript
import { nformatter, currencyFormatter } from "@kumix/utils";

nformatter(1234); // "1.2K"
nformatter(1234567); // "1.2M"
currencyFormatter(1234.56); // "$1,234.56"
```

### Array Utilities

```typescript
import { chunk, randomValue, stableSort } from "@kumix/utils";

// Split array into chunks
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// Get random element
randomValue([1, 2, 3, 4]); // Random element

// Stable sorting
stableSort(array, (a, b) => a.name.localeCompare(b.name));
```

### Validation

```typescript
import { deepEqual, keys, isIframeable } from "@kumix/utils";

// Deep object comparison
deepEqual(obj1, obj2); // true/false

// Type-safe object keys
const myKeys = keys({ a: 1, b: 2 }); // ('a' | 'b')[]

// Check if URL can be embedded
isIframeable("https://example.com"); // true/false
```

### Browser Utilities (Client-side only)

```typescript
import { storage, cookies, getHeight, resizeImage } from "@kumix/utils";

// localStorage wrapper
storage.set("key", { value: "data" });
const data = storage.get("key");

// Cookie management
cookies.set("name", "value", { maxAge: 3600 });
const value = cookies.get("name");

// DOM utilities
const height = getHeight(element);
const resized = await resizeImage(file, { width: 800, height: 600 });
```

## Configuration

### Client vs Server

Most utilities work in both environments. For server-only utilities:

```typescript
// Server-only exports (Node.js/Bun)
import { ... } from '@kumix/utils/server';
```

## API Categories

- **String**: Text manipulation, formatting, slugification
- **Date/Time**: Date formatting, time ago, period calculations
- **Crypto**: ID generation, hashing, random strings
- **Email**: Validation, normalization, disposable detection
- **URL**: URL parsing, validation, metadata construction
- **File**: File size formatting, type detection
- **Array**: Chunking, sorting, random selection
- **Validation**: Email, URL, deep equality checks
- **Browser**: Storage, cookies, DOM utilities (client-only)
- **Number**: Formatting, currency, abbreviations

## Runtime Compatibility

| Export              | Node.js  | Bun      | CF Workers | Deno     | Browser   |
| ------------------- | -------- | -------- | ---------- | -------- | --------- |
| `.` (main)          | Yes      | Yes      | Yes        | Yes      | Yes       |
| `./server`          | Yes      | Yes      | No         | Yes      | No        |
| Browser functions\* | SSR-safe | SSR-safe | SSR-safe   | SSR-safe | Yes       |
| Constants (env)     | Filled   | Filled   | Undefined  | Filled   | Undefined |

\* `getHeight`, `resizeImage`, `resizeAndCropImage`, `loadImage`, `fileToBase64` — all have runtime guards, return `0` or throw descriptive errors when called outside browser.

### Entry Points

- **`@kumix/utils`** — Safe everywhere. Constants use runtime-guarded `process.env` access (returns `undefined` when process is unavailable). Browser-only functions have SSR guards.
- **`@kumix/utils/server`** — Node.js / Bun / Deno only. Contains `generateRandomString` (node:crypto), JWT utilities (jsonwebtoken), password hashing (bcryptjs), and `parseDatetime` (chrono-node).

## Links

- [npm Package](https://www.npmjs.com/package/@kumix/utils)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Code of Conduct](../../CODE_OF_CONDUCT.md)
- [License](../../LICENSE)

## License

MIT © [Kumix Inc.](../../LICENSE)
