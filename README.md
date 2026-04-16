# WeAreOpen

A high-precision "Business Open" status service tailored for Copenhagen-based businesses. It intelligently combines standard business hours, Danish public holidays, and custom closing days to provide a reliable status API.

## Features

- **Smart Status Logic**: Automatically determines if the business is open based on:
  - Standard Business Hours (Mon–Fri, 08:00–16:00 Europe/Copenhagen).
  - Danish Public Holidays (via Kalendarium API integration).
  - Custom Special Closing Days (manually managed via Admin).
- **Public API**: Extremely simple `GET /api/open` endpoint returning a boolean.
- **Admin Dashboard**: Secure UI for managing special closing days.
- **Production-Ready Security**:
  - API Key protection for admin endpoints using timing-safe comparisons.
  - Built-in rate limiting.
  - Fail-open integration with external holiday APIs.
- **Modern Tech Stack**: Built with Next.js 16, React 19, Tailwind CSS 4, and TypeScript.

## Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Database/Persistence**: [Vercel Blob](https://vercel.com/storage/blob)
- **Testing**: [Vitest](https://vitest.dev)
- **Runtime**: Node.js

## Getting Started

### Prerequisites

- Node.js 20+
- A Vercel account (for Blob storage)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Copy `env.example` to `.env.local` and fill in the values:
   - `ADMIN_API_KEY`: A secure string for authorizing admin actions.
   - `BLOB_READ_WRITE_TOKEN`: Your Vercel Blob token.

### Development

Run the development server:
```bash
npm run dev
```

### Testing

Run the test suite:
```bash
npm run test
```

## API Documentation

### Public API

#### `GET /api/open`
Returns `true` if the business is currently open, `false` otherwise.

### Admin API
*Requires Header: `Authorization: Bearer <ADMIN_API_KEY>`*

#### `GET /api/admin/closing-days`
List all scheduled special closing days.

#### `POST /api/admin/closing-days`
Add a new closing day.
**Body:** `{ "date": "YYYY-MM-DD", "reason": "Optional reason" }`

#### `DELETE /api/admin/closing-days/[date]`
Remove a scheduled closing day.

## License

Private / Internal Project.
