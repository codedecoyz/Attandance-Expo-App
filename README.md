# University Attendance Management App

A complete mobile attendance management system for universities built with React Native, Expo SDK 55, and Convex DB. Features role-based authentication for Faculty, Students, and Admins, offline sync, QR code attendance, and comprehensive reporting.

## Features

### For Faculty
- ✅ Dashboard with subject overview and statistics
- ✅ Mark attendance manually with date selection
- ✅ Generate QR codes for quick attendance (10-minute validity)
- ✅ View and edit past attendance records
- ✅ Generate PDF and Excel reports
- ✅ Real-time attendance tracking
- ✅ Offline support with auto-sync
- ✅ Announcements & assignment management

### For Students
- ✅ View overall attendance percentage
- ✅ Subject-wise attendance breakdown
- ✅ Scan QR codes to mark attendance
- ✅ Calendar view of attendance history
- ✅ Export personal attendance reports
- ✅ Low attendance warnings

### For Admins
- ✅ Dashboard with total user/subject statistics
- ✅ Create and manage users (faculty, students, admins)
- ✅ Create and manage subjects
- ✅ Assign faculty to subjects

## Tech Stack

### Frontend
- **Framework**: React Native 0.83.2 with Expo SDK 55
- **UI Library**: React Native Paper (Material Design)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Local Storage**: AsyncStorage for offline data
- **Camera**: expo-camera for QR codes
- **Fonts**: Google Fonts (Poppins family)

### Backend & Database
- **Backend**: [Convex](https://convex.dev) (real-time document database)
- **Authentication**: Convex Auth (`@convex-dev/auth`) with email/password provider
- **Server Functions**: Convex queries, mutations, and actions (TypeScript)
- **Access Control**: Enforced in server functions (replaces Supabase RLS)

### Additional Libraries
- date-fns - Date handling
- react-hook-form - Form management
- @react-native-community/netinfo - Network detection
- expo-linear-gradient - UI gradients
- react-native-svg - SVG rendering
- xlsx - Excel export

## Getting Started

### Prerequisites
- Node.js 20.19+ installed
- Expo CLI (`npm install -g expo-cli`)
- Android Studio or Xcode for testing (or use Expo Go)

### 1. Clone and Install

```bash
git clone https://github.com/codedecoyz/Attandance-Expo-App.git
cd Attandance-Expo-App
npm install
```

### 2. Set Up Convex

Start the Convex development server — it will prompt you to create an account or run locally:

```bash
npx convex dev
```

This will:
- Download the Convex backend binary
- Create your schema with all 10 tables and indexes
- Deploy all server functions (queries, mutations)
- Generate type-safe API bindings in `convex/_generated/`
- Create a `.env.local` file with your `EXPO_PUBLIC_CONVEX_URL`

> **Note**: Keep `npx convex dev` running in a separate terminal while developing.

### 3. Create Test Users

Since the database starts empty, the first sign-in for any email will automatically create an account. To set up proper user roles, use the admin flow:

1. Start the app and sign in with any email/password — this creates a default user
2. Use the Convex dashboard (`npx convex dashboard`) to manually set the first user's role to `admin`
3. Sign in as admin and use the **Add User** screen to create faculty and student accounts

### 4. Run the App

```bash
# Start Expo development server (in a second terminal)
npx expo start

# Run on Web
npx expo start --web

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

## Project Structure

```
attendance-app/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (ConvexProvider + AuthProvider)
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   ├── (admin)/                  # Admin screens
│   │   ├── dashboard.tsx
│   │   ├── users/
│   │   └── subjects/
│   ├── (faculty)/                # Faculty screens
│   │   └── (tabs)/
│   │       ├── index.tsx         # Dashboard
│   │       ├── mark-attendance.tsx
│   │       ├── qr-code.tsx
│   │       └── profile.tsx
│   └── (student)/                # Student screens
│       └── (tabs)/
│           ├── index.tsx         # Dashboard
│           ├── subjects.tsx
│           ├── scan-qr.tsx
│           └── profile.tsx
├── components/                   # Reusable components
│   ├── common/                   # Button, Card, Input, etc.
│   ├── dashboard/                # StatCard, SubjectCard, ProgressCircle
│   ├── attendance/               # Attendance-specific components
│   └── AdminGuard.tsx            # Admin role guard
├── contexts/                     # React contexts
│   ├── AuthContext.tsx           # Authentication state (Convex Auth)
│   └── OfflineContext.tsx        # Offline sync state
├── convex/                       # Convex backend (server-side)
│   ├── schema.ts                 # Database schema (10 tables)
│   ├── auth.ts                   # Auth configuration
│   ├── http.ts                   # HTTP router for auth
│   ├── users.ts                  # User queries & mutations
│   ├── attendance.ts             # Attendance CRUD & stats
│   ├── subjects.ts               # Subject queries & mutations
│   ├── qrSessions.ts             # QR session logic
│   ├── announcements.ts          # Announcement CRUD
│   └── assignments.ts            # Assignment & marks CRUD
├── services/                     # Client-side service layer
│   ├── authService.ts            # Auth compatibility layer
│   ├── attendanceService.ts      # Attendance operations
│   ├── subjectService.ts         # Subject operations
│   ├── qrService.ts              # QR code operations
│   ├── announcementService.ts    # Announcement operations
│   ├── assignmentService.ts      # Assignment operations
│   └── exportService.ts          # PDF/Excel export
├── lib/                          # Utilities
│   ├── convex.ts                 # Convex client initialization
│   ├── constants.ts              # App constants
│   └── utils.ts                  # Helper functions
├── types/                        # TypeScript types
│   ├── database.ts               # Table interfaces
│   └── models.ts                 # App models
└── scripts/                      # Legacy SQL scripts (archived)
```

## Design System

### Colors
- **Primary**: #4A90E2 (Professional Blue)
- **Success**: #10B981 (Green)
- **Warning**: #F59E0B (Amber)
- **Error**: #EF4444 (Red)

### Typography
- **Font Family**: Poppins (400, 500, 600, 700)
- **Headers**: Bold, 28px
- **Body**: Regular, 14px
- **Captions**: Regular, 11px

## Key Features Implementation

### 1. Authentication Flow
- Role-based navigation (Admin / Faculty / Student)
- Convex Auth with email/password provider
- Automatic account creation on first sign-in
- Secure session management via `@convex-dev/auth`

### 2. Offline Sync
- Queue operations in AsyncStorage when offline
- Auto-sync when connection restored
- Conflict resolution (server data takes precedence)
- Visual sync status indicators

### 3. QR Code Attendance
- Faculty generates time-limited QR codes (10 minutes)
- Students scan to mark attendance
- Late marking after timeout
- Real-time scan updates
- Duplicate scan prevention

### 4. Attendance Calculation
- Configurable "count late as present" per subject
- Overall and subject-wise percentages
- Color-coded indicators (>80% green, 60-80% orange, <60% red)

### 5. Convex Server Functions
All business logic runs server-side in TypeScript:
- **Queries** — reactive, auto-update UI when data changes
- **Mutations** — transactional writes with validation
- **Access control** — enforced in every function (replaces Supabase RLS)

## Database Schema

The app uses 10 tables defined in `convex/schema.ts`:

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles (faculty/student/admin) |
| `faculty` | Faculty profiles (employee ID, department) |
| `students` | Student profiles (roll number, semester) |
| `subjects` | Courses with faculty assignment |
| `enrollments` | Student ↔ Subject mapping |
| `attendanceRecords` | Daily attendance entries |
| `qrSessions` | Temporary QR attendance tokens |
| `announcements` | Faculty announcements per subject |
| `assignments` | Assignment definitions |
| `assignmentMarks` | Student marks per assignment |

Plus Convex Auth tables (`authAccounts`, `authSessions`, `authRefreshTokens`, etc.) managed automatically.

## Environment Variables

The Convex URL is auto-configured in `.env.local` when you run `npx convex dev`:
```
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

For production deployment, set it to your Convex cloud URL:
```
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

## Testing

### Test Login Credentials
After creating test users via the admin panel:
- Admin: `admin@test.com` / `password123`
- Faculty: `faculty@test.com` / `password123`
- Student: `student@test.com` / `password123`

### Test Flows
1. **Admin creates users**:
   - Login as admin → Dashboard → Add New User → Create faculty/student accounts

2. **Faculty marks attendance**:
   - Login as faculty → View dashboard → See assigned subjects
   - Navigate to Mark Attendance → Select subject and date
   - Mark students present/absent → Save

3. **Student views attendance**:
   - Login as student → View dashboard → See attendance percentage
   - Tap on subject → View detailed attendance history

4. **QR Code attendance**:
   - Faculty generates QR → Student scans → Attendance marked automatically

## Troubleshooting

### Common Issues

**1. "Cannot find module convex/_generated/api"**
```bash
# Make sure Convex dev server is running
npx convex dev
```

**2. Convex connection issues**
- Ensure `npx convex dev` is running in a separate terminal
- Check `.env.local` has the correct `EXPO_PUBLIC_CONVEX_URL`
- For local development, it should be `http://127.0.0.1:3210`

**3. Authentication errors**
- First sign-in auto-creates an account (signUp fallback)
- If role is wrong, update it via `npx convex dashboard`
- Ensure the user record exists in the `users` table

**4. Build errors**
```bash
# Clear cache
npx expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install

# Regenerate Convex types
npx convex dev
```

## Building for Production

### Deploy Convex to Cloud
```bash
npx convex deploy
```

### Android APK
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

### iOS IPA
```bash
eas build --platform ios --profile production
```

## Migration Note

This app was originally built with Supabase (PostgreSQL + Supabase Auth + RLS policies). It has been fully migrated to Convex DB. The `scripts/` directory contains the legacy SQL files for reference only — they are no longer used.

Key migration changes:
- Supabase client → Convex client (`lib/convex.ts`)
- Supabase Auth → `@convex-dev/auth` with password provider
- SQL RPC functions → Convex server functions (`convex/*.ts`)
- Row Level Security → Access control in server functions
- PostgreSQL queries → Convex document queries with indexes

## License

MIT License - feel free to use for educational purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review [Convex documentation](https://docs.convex.dev)
3. Check [Expo documentation](https://docs.expo.dev)
4. Open an issue in the repository

## Credits

Built with:
- [React Native](https://reactnative.dev) & [Expo SDK 55](https://expo.dev)
- [Convex](https://convex.dev)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Expo Router](https://expo.github.io/router)

---

**Note**: This app is designed for educational institutions. Ensure you comply with data privacy regulations when deploying to production.
