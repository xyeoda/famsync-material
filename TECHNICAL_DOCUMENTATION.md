# YeoDa Family Calendar - Technical Documentation

## Project Overview

The YeoDa Family Calendar is a specialized React-based web application designed to manage family scheduling, with a focus on children's activities, transportation logistics, and family member coordination. Built with TypeScript, it provides a clean interface for managing recurring events with flexible scheduling patterns.

## Technology Stack

### Frontend Framework
- **React 18.3.1** - Core UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **React Router DOM 6.30.1** - Client-side routing

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Shadcn/ui** - Pre-built component library
- **Lucide React** - Icon library
- **next-themes** - Dark/light mode support

### State & Data Management
- **React Hooks** - Local state management
- **TanStack Query** - Server state management (future backend integration)
- **localStorage** - Client-side data persistence
- **date-fns** - Date manipulation and formatting

### Utilities
- **UUID** - Unique identifier generation
- **class-variance-authority** - Component variant handling
- **tailwind-merge** - Tailwind class merging
- **zod** - Schema validation
- **react-hook-form** - Form state management

## Application Architecture

### High-Level Structure

```
src/
├── components/          # Reusable UI components
│   ├── Calendar/       # Calendar-specific components
│   │   ├── BulkDeleteDialog.tsx
│   │   ├── CalendarHeader.tsx
│   │   ├── EventCard.tsx
│   │   ├── EventDialog.tsx
│   │   ├── FamilySettingsDialog.tsx
│   │   ├── InstanceDialog.tsx
│   │   ├── MonthView.tsx
│   │   └── WeekView.tsx
│   ├── ui/             # Shadcn UI components
│   ├── NavLink.tsx
│   └── ThemeToggle.tsx
├── contexts/           # React contexts
│   └── FamilySettingsContext.tsx
├── hooks/              # Custom React hooks
│   ├── useEventInstances.ts
│   ├── useEvents.ts
│   ├── useFamilySettings.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/                # Utility libraries
│   ├── eventStore.ts
│   ├── initSampleData.ts
│   ├── sampleData.ts
│   └── utils.ts
├── pages/              # Route pages
│   ├── Dashboard.tsx
│   ├── Index.tsx (Calendar)
│   └── NotFound.tsx
├── types/              # TypeScript definitions
│   └── event.ts
├── App.tsx             # Root component
├── main.tsx            # Entry point
└── index.css           # Global styles & design tokens
```

## Data Models

### Core Types

#### FamilyMember
```typescript
type FamilyMember = "parent1" | "parent2" | "kid1" | "kid2" | "housekeeper";
```

Family members are categorized into:
- **Parents** (Shawn, Wynne) - Can be responsible for transportation
- **Kids** (Vince, Maeve) - Event participants only
- **Helper** (Nuru) - Can be responsible for transportation

#### FamilyEvent
```typescript
interface FamilyEvent {
  id: string;                    // UUID
  title: string;                 // Event name
  description?: string;          // Optional details
  category: ActivityCategory;    // sports, education, social, chores, health, other
  recurrenceSlots: RecurrenceSlot[]; // Multiple weekly time slots
  participants: FamilyMember[];  // Kids attending (kid1, kid2)
  transportation?: TransportationDetails;
  startDate: Date;               // When pattern starts
  endDate?: Date;                // Optional pattern end
  location?: string;             // Event location
  notes?: string;                // Additional notes
  color?: string;                // Custom color override
  createdAt: Date;
  updatedAt: Date;
}
```

#### RecurrenceSlot
```typescript
interface RecurrenceSlot {
  dayOfWeek: number;    // 0 = Sunday, 6 = Saturday
  startTime: string;    // HH:mm format (e.g., "16:00")
  endTime: string;      // HH:mm format (e.g., "18:00")
}
```

Supports flexible multi-slot scheduling:
- Example: BJJ class on Monday 4-6pm, Wednesday 5-6pm, Friday 12-1pm
- Each event can have multiple time slots per week

#### TransportationDetails
```typescript
interface TransportationDetails {
  dropOffMethod?: TransportMethod;   // car, bus, walk, bike
  dropOffPerson?: FamilyMember;      // Who handles drop-off
  pickUpMethod?: TransportMethod;    // car, bus, walk, bike
  pickUpPerson?: FamilyMember;       // Who handles pick-up
}
```

Separates drop-off and pick-up logistics:
- Different people can handle each
- Different transport methods for each direction

#### EventInstance
```typescript
interface EventInstance {
  id: string;
  eventId: string;              // Reference to parent event
  date: Date;                   // Specific date for override
  transportation?: TransportationDetails;
  participants?: FamilyMember[];
  cancelled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Allows per-date overrides without modifying the series:
- Change transportation for one occurrence
- Modify participants for specific dates
- Mark individual occurrences as cancelled

### FamilySettings
```typescript
interface FamilySettings {
  parent1Name: string;        // Default: "Shawn"
  parent2Name: string;        // Default: "Wynne"
  kid1Name: string;           // Default: "Vince"
  kid2Name: string;           // Default: "Maeve"
  housekeeperName: string;    // Default: "Nuru"
  kid1Color: string;          // HSL: "266 100% 60%" (Purple)
  kid2Color: string;          // HSL: "39 100% 50%" (Gold)
  parent1Color: string;       // HSL: "217 71% 58%" (Soft Blue)
  parent2Color: string;       // HSL: "340 65% 55%" (Rose/Coral)
  housekeeperColor: string;   // HSL: "180 50% 45%" (Teal)
}
```

Stored in localStorage as `family-settings`

## Core Features

### 1. Recurring Event Management

**Multi-Slot Recurrence Pattern:**
- Events can occur multiple times per week at different times
- Each slot specifies day of week and time range
- Pattern continues from startDate until optional endDate

**Event CRUD Operations:**
- Create: New events with multiple recurrence slots
- Read: Display in calendar views (month/week)
- Update: Edit event details, affecting all future occurrences
- Delete: Remove single events or bulk delete by title

### 2. Instance Override System

**Per-Date Customization:**
- Override transportation for specific dates
- Change participants for individual occurrences
- Mark specific dates as cancelled
- Overrides stored separately from parent event

**Use Cases:**
- "This Friday, Dad is picking up instead of Mom"
- "Next Tuesday, only Vince is attending"
- "Cancel the occurrence on December 25th"

### 3. Transportation Logistics

**Separate Drop-off/Pick-up:**
- Independent person assignment
- Independent transport method
- Supports different people for each direction

**Transport Methods:**
- Car 🚗
- Bus 🚌
- Walk 🚶
- Bike 🚴

**Constraints:**
- Only parents and helpers can be assigned
- Kids are never selectable as responsible persons

### 4. Family Member Color Coding

**Visual System:**
- Each family member has a customizable HSL color
- Kid colors appear on event card left border
- Parent/helper colors appear on participant and transportation badges

**Border Logic:**
- Single kid: Solid color border
- Both kids: Gradient border (kid1 → kid2)
- Parents/helpers: Colored badges only, not border

**CSS Custom Properties:**
```css
--kid1-color: 266 100% 60%;
--kid2-color: 39 100% 50%;
--parent1-color: 217 71% 58%;
--parent2-color: 340 65% 55%;
--housekeeper-color: 180 50% 45%;
```

### 5. Calendar Views

**Month View:**
- Grid layout of entire month
- Events displayed in day cells
- Minimal card format with time and participants
- Click to view/edit details

**Week View:**
- 7-column layout of current week
- More detailed event cards
- Transportation details visible
- Better for daily planning

**Today's Schedule (Dashboard):**
- Card-based grid layout
- Full event details including location
- Clickable Google Maps links
- Transportation badges with colors

### 6. Dashboard Overview

**Quick Stats:**
- Events This Week: Count of events occurring this week
- Total Events: Count of all recurring activities
- Both update in real-time

**Today's Schedule:**
- Filtered events for current day
- Sorted by start time
- Full details displayed
- Color-coded by participants

### 7. Family Settings

**Customization:**
- Edit all family member names
- Customize colors for each member (Hex picker → HSL storage)
- Reset to defaults
- Persisted in localStorage

**Color System:**
- Internal storage: HSL format
- UI: Hex color picker for ease of use
- Automatic conversion between formats
- Applied via CSS custom properties

### 8. Bulk Operations

**Bulk Delete by Title:**
- Delete all events with the same name
- Useful for ending a season/activity
- Removes all instances for those events
- Confirmation dialog prevents accidents

## State Management

### Event Store (src/lib/eventStore.ts)

**Singleton Pattern:**
```typescript
class EventStore {
  private events: FamilyEvent[];
  private instances: EventInstance[];
  private listeners: Set<() => void>;
}

export const eventStore = new EventStore();
```

**Key Features:**
- In-memory storage with localStorage persistence
- Observable pattern for reactivity
- Subscribe/notify mechanism
- Automatic save on mutations

**Persistence:**
- Events: `localStorage['family-events']`
- Instances: `localStorage['family-event-instances']`
- Date objects serialized/deserialized automatically

**API Methods:**
```typescript
// Events
getEvents(): FamilyEvent[]
getEventById(id: string): FamilyEvent | undefined
addEvent(event: FamilyEvent): void
updateEvent(id: string, updates: Partial<FamilyEvent>): void
deleteEvent(id: string): void
deleteEventsByTitle(title: string): void

// Instances
getInstances(): EventInstance[]
getInstanceForDate(eventId: string, date: Date): EventInstance | undefined
addInstance(instance: EventInstance): void
updateInstance(id: string, updates: Partial<EventInstance>): void
deleteInstance(id: string): void
```

### Custom Hooks

**useEvents:**
```typescript
const {
  events,              // Current event list
  addEvent,           // Create new event
  updateEvent,        // Update existing event
  deleteEvent,        // Delete single event
  deleteEventsByTitle, // Bulk delete
  getEventById        // Retrieve by ID
} = useEvents();
```

**useEventInstances:**
```typescript
const {
  instances,           // All overrides
  getInstanceForDate, // Get override for specific date
  addInstance,        // Create override
  updateInstance,     // Update override
  deleteInstance      // Remove override
} = useEventInstances();
```

**useFamilySettings:**
```typescript
const {
  settings,              // Current settings object
  updateSettings,        // Partial update
  resetSettings,         // Reset to defaults
  getFamilyMemberName,   // Get name by member key
  getFamilyMembers       // Get all names as object
} = useFamilySettings();
```

## Design System

### Color Architecture

**Semantic Tokens (index.css):**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --border: 214.3 31.8% 91.4%;
  /* ... more tokens */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode variants */
}
```

**Tailwind Config Extensions:**
```javascript
colors: {
  border: "hsl(var(--border))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  // ... all semantic tokens mapped
}
```

**Component Variants:**
- Button: filled, outlined, text, ghost
- Card: surface-elevation-1, surface-elevation-2
- All components use semantic tokens, never direct colors

## Key Implementation Details

### Event Rendering Logic

**Determining Today's Events:**
```typescript
const todayEvents = events
  .filter((event) => {
    const dayOfWeek = getDay(today);
    return event.recurrenceSlots.some(
      (slot) => slot.dayOfWeek === dayOfWeek
    );
  })
  .sort((a, b) => {
    const timeA = a.recurrenceSlots[0]?.startTime || "00:00";
    const timeB = b.recurrenceSlots[0]?.startTime || "00:00";
    return timeA.localeCompare(timeB);
  });
```

**Instance Override Merging:**
```typescript
const instance = getInstanceForDate(event.id, date);
const transportation = instance?.transportation || event.transportation;
const participants = instance?.participants || event.participants;
```

### Border Color Logic

**Two Kids (Gradient):**
```typescript
if (bothKids) {
  borderBackground = `linear-gradient(to bottom, 
    hsl(${settings.kid1Color}), 
    hsl(${settings.kid2Color}))`;
}
```

**Single Kid (Solid):**
```typescript
const participant = participants[0];
if (participant === "kid1") 
  borderColorStyle = `hsl(${settings.kid1Color})`;
else if (participant === "kid2") 
  borderColorStyle = `hsl(${settings.kid2Color})`;
```

### Participant Badge Colors

```typescript
const getParticipantBadgeColor = (member: FamilyMember) => {
  if (member === "kid1" || member === "kid2") {
    return "bg-surface-container text-foreground"; // Neutral for kids
  }
  
  const colorMap = {
    parent1: settings.parent1Color,
    parent2: settings.parent2Color,
    housekeeper: settings.housekeeperColor,
  };
  
  return `text-white`; // White text on colored background
};
```

### Transportation Badge Colors

```typescript
const getTransportBadgeStyle = (person: FamilyMember) => {
  const colorMap = {
    parent1: settings.parent1Color,
    parent2: settings.parent2Color,
    housekeeper: settings.housekeeperColor,
  };
  
  return {
    backgroundColor: `hsl(${colorMap[person]})`,
    color: 'white'
  };
};
```

## VPS Deployment Guide

### Prerequisites

**Server Requirements:**
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ or 20+
- Nginx (web server)
- SSL certificate (Let's Encrypt recommended)
- Domain name pointed to VPS IP

### Step 1: Build the Application

**Local Build:**
```bash
# Install dependencies
npm install

# Create production build
npm run build

# This creates a 'dist' folder with static files
```

**Build Output:**
```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
├── index.html
└── robots.txt
```

### Step 2: Server Setup

**1. Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**2. Install Nginx:**
```bash
sudo apt update
sudo apt install nginx
```

**3. Install Certbot (SSL):**
```bash
sudo apt install certbot python3-certbot-nginx
```

### Step 3: Deploy Application

**1. Create Application Directory:**
```bash
sudo mkdir -p /var/www/yeoda-calendar
sudo chown $USER:$USER /var/www/yeoda-calendar
```

**2. Upload Build Files:**
```bash
# Using SCP
scp -r dist/* user@your-vps-ip:/var/www/yeoda-calendar/

# Or using rsync
rsync -avz dist/ user@your-vps-ip:/var/www/yeoda-calendar/
```

### Step 4: Configure Nginx

**Create Nginx Config:**
```bash
sudo nano /etc/nginx/sites-available/yeoda-calendar
```

**Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    root /var/www/yeoda-calendar;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # React Router support - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

**Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/yeoda-calendar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically:
- Obtain SSL certificate
- Configure Nginx for HTTPS
- Set up auto-renewal

### Step 6: Firewall Configuration

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Deployment Automation

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to VPS
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USERNAME }}
        key: ${{ secrets.VPS_SSH_KEY }}
        source: "dist/*"
        target: "/var/www/yeoda-calendar"
        strip_components: 1
```

**Required Secrets:**
- `VPS_HOST`: Your VPS IP address
- `VPS_USERNAME`: SSH username
- `VPS_SSH_KEY`: Private SSH key

### Manual Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

echo "Building application..."
npm run build

echo "Deploying to VPS..."
rsync -avz --delete dist/ user@your-vps:/var/www/yeoda-calendar/

echo "Deployment complete!"
```

## Suggested Enhancements

### 1. Backend Integration

**Current State:**
- All data in localStorage (client-side only)
- No data synchronization across devices
- No backup/recovery mechanism

**Recommended: Add Lovable Cloud (Supabase)**

**Benefits:**
- PostgreSQL database for reliable storage
- Real-time synchronization across devices
- User authentication (multi-user support)
- Automatic backups
- Row Level Security (RLS) for data privacy

**Migration Path:**
```typescript
// Current: localStorage
const events = eventStore.getEvents();

// Future: Supabase
const { data: events } = await supabase
  .from('events')
  .select('*')
  .order('start_date');
```

**Database Schema:**
```sql
-- events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  recurrence_slots JSONB NOT NULL,
  participants JSONB NOT NULL,
  transportation JSONB,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  location TEXT,
  notes TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- event_instances table
CREATE TABLE event_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  transportation JSONB,
  participants JSONB,
  cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own events"
  ON events FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own instances"
  ON event_instances FOR ALL
  USING (auth.uid() = user_id);
```

### 2. Mobile App (Progressive Web App)

**Recommendations:**
- Add PWA manifest
- Service worker for offline support
- Install prompt for mobile devices
- Push notifications for reminders

**Implementation:**
```json
// public/manifest.json
{
  "name": "YeoDa Family Calendar",
  "short_name": "Family Calendar",
  "theme_color": "#222",
  "background_color": "#ffffff",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 3. Event Notifications

**Features to Add:**
- Email reminders before events
- SMS notifications for transportation changes
- Browser notifications (if PWA)
- Daily/weekly digest emails

**Implementation with Edge Functions:**
```typescript
// Daily reminder function (runs at 7am)
const sendDailyReminders = async () => {
  const today = new Date();
  const events = await getTodayEvents(today);
  
  for (const event of events) {
    await sendEmail({
      to: parentEmails,
      subject: `Today's Schedule - ${event.title}`,
      body: renderEventEmail(event)
    });
  }
};
```

### 4. Calendar Integrations

**Google Calendar Sync:**
- Export events to Google Calendar
- Import from Google Calendar
- Two-way synchronization

**iCal Export:**
- Generate .ics files
- Subscribe via calendar apps
- Automatic updates

### 5. Shared Family View

**Multi-User Support:**
- Family account system
- Invite family members
- Role-based permissions (parent, viewer)
- Activity feed of changes

**Features:**
- Real-time updates when others make changes
- Comments/notes on events
- Approval workflow for changes

### 6. Analytics & Insights

**Statistics:**
- Most active days/times
- Transportation efficiency metrics
- Participant workload balance
- Activity category breakdown

**Reports:**
- Weekly summary emails
- Monthly activity reports
- Exportable analytics data

### 7. Event Templates

**Quick Add:**
- Save common events as templates
- One-click event creation
- Template library (sports, lessons, etc.)

**Example Templates:**
```typescript
const templates = [
  {
    name: "Soccer Practice",
    category: "sports",
    duration: "1.5 hours",
    defaultLocation: "City Sports Complex",
    defaultTransportation: { method: "car" }
  },
  {
    name: "Piano Lesson",
    category: "education",
    duration: "1 hour",
    defaultLocation: "Music Academy"
  }
];
```

### 8. Advanced Recurrence

**Additional Patterns:**
- Every other week
- Monthly on specific day
- Custom recurrence (e.g., "2nd Tuesday of month")
- Holiday exclusions

**UI Enhancement:**
```typescript
interface RecurrencePattern {
  type: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  interval: number;
  excludeHolidays: boolean;
  customRule?: string;
}
```

### 9. Conflict Detection

**Features:**
- Detect scheduling conflicts
- Warn about overlapping events
- Suggest alternative times
- Transportation availability check

**Logic:**
```typescript
const checkConflicts = (newEvent: FamilyEvent) => {
  return events.filter(event => 
    event.participants.some(p => 
      newEvent.participants.includes(p)
    ) && 
    hasTimeOverlap(event, newEvent)
  );
};
```

### 10. Export/Import

**Features:**
- Export all data as JSON
- Import from backup file
- CSV export for spreadsheet analysis
- PDF calendar printouts

### 11. Location Intelligence

**Enhancements:**
- Geocoding for addresses
- Travel time estimates
- Traffic-aware notifications
- Multi-stop route optimization

**Integration:**
```typescript
const calculateTravelTime = async (
  origin: string,
  destination: string,
  departureTime: Date
) => {
  // Google Maps API or similar
  const route = await getMapsRoute(origin, destination, departureTime);
  return route.duration;
};
```

### 12. Weather Integration

**Features:**
- Weather forecast for outdoor activities
- Automatic notifications for bad weather
- Suggest activity changes based on forecast

### 13. Carpool Coordination

**Features:**
- Mark availability for carpooling
- Match families with similar schedules
- Carpool rotation tracking
- Cost splitting calculator

## Performance Optimization

### Current Performance

**Bundle Size:**
- Initial JS: ~500KB (gzipped)
- Initial CSS: ~50KB (gzipped)
- Good for most use cases

**Optimization Opportunities:**

### 1. Code Splitting
```typescript
// Lazy load calendar views
const MonthView = lazy(() => import('./components/Calendar/MonthView'));
const WeekView = lazy(() => import('./components/Calendar/WeekView'));
```

### 2. Image Optimization
- Use WebP format
- Lazy loading for images
- Responsive images with srcset

### 3. Caching Strategy
```nginx
# Nginx config
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4. Virtual Scrolling
For large event lists:
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={events.length}
  itemSize={80}
>
  {EventRow}
</FixedSizeList>
```

## Security Considerations

### Current State (Client-Side Only)

**Data Security:**
- localStorage is accessible via browser console
- No authentication/authorization
- Single-device usage
- No data encryption

### Recommendations for VPS Deployment

**1. HTTPS Only:**
```nginx
# Force HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

**2. Security Headers:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**3. Rate Limiting:**
```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req zone=general burst=20;
```

**4. If Adding Backend:**
- Implement JWT authentication
- Use environment variables for secrets
- Enable CORS properly
- Validate all inputs
- Use prepared statements (SQL injection prevention)
- Implement RLS in database

## Monitoring & Maintenance

### Log Management

**Nginx Logs:**
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

**Application Logs:**
Consider adding:
- Sentry for error tracking
- Google Analytics for usage
- LogRocket for session replay

### Backup Strategy

**Database Backup (when added):**
```bash
# Daily Supabase backup
pg_dump -h db.supabase.co -U postgres -d yeoda_calendar > backup_$(date +%Y%m%d).sql
```

**Application Files:**
```bash
# Backup script
tar -czf backup_$(date +%Y%m%d).tar.gz /var/www/yeoda-calendar
```

### Update Process

**1. Test Locally:**
```bash
npm run dev
# Test all features
```

**2. Build & Deploy:**
```bash
npm run build
./deploy.sh
```

**3. Verify Deployment:**
- Check site loads
- Test critical features
- Review error logs

## Testing Strategy

### Current State
No automated tests currently implemented.

### Recommended Testing Setup

**Unit Tests (Vitest):**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// Example test
import { describe, it, expect } from 'vitest';
import { eventStore } from './eventStore';

describe('EventStore', () => {
  it('should add event', () => {
    const event = createMockEvent();
    eventStore.addEvent(event);
    expect(eventStore.getEvents()).toContain(event);
  });
});
```

**E2E Tests (Playwright):**
```typescript
import { test, expect } from '@playwright/test';

test('create new event', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Add Event');
  await page.fill('[name="title"]', 'Soccer Practice');
  await page.click('button:has-text("Save")');
  
  await expect(page.locator('text=Soccer Practice')).toBeVisible();
});
```

## Troubleshooting Common Issues

### Issue: Events Not Persisting
**Cause:** localStorage quota exceeded or browser privacy mode
**Solution:** Implement data compression or move to backend

### Issue: Date/Time Display Incorrect
**Cause:** Timezone handling
**Solution:** Use date-fns with explicit timezone or UTC

### Issue: Slow Performance with Many Events
**Cause:** Re-rendering all events
**Solution:** Implement memoization and virtual scrolling

### Issue: Build Fails on VPS
**Cause:** Insufficient memory
**Solution:** 
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

## Cost Estimation

### VPS Hosting
- Basic VPS (2GB RAM, 1 CPU): $5-10/month
- Domain name: $10-15/year
- SSL certificate: Free (Let's Encrypt)

**Total:** ~$60-120/year

### With Lovable Cloud (Future)
- Database & Auth: Usage-based, ~$0-25/month
- Edge Functions: Usage-based
- Storage: Usage-based

**Total:** ~$100-500/year depending on usage

## Conclusion

The YeoDa Family Calendar is a modern, type-safe React application built for managing family activities with sophisticated scheduling needs. The current implementation provides a solid foundation with client-side storage, while the suggested enhancements offer a clear path toward a full-featured, multi-user family coordination platform.

The modular architecture makes it easy to extend, and the component-based design ensures maintainability. Deployment to a VPS is straightforward, and adding backend capabilities through Lovable Cloud would unlock significant additional functionality.

## Quick Reference

### Important Commands
```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)

# Build
npm run build           # Create production build
npm run preview         # Preview production build

# Deploy
./deploy.sh             # Deploy to VPS (custom script)
sudo systemctl restart nginx  # Restart web server
```

### Important Files
- `src/lib/eventStore.ts` - Core data management
- `src/types/event.ts` - Type definitions
- `src/hooks/useFamilySettings.ts` - Family customization
- `src/index.css` - Design system tokens
- `tailwind.config.ts` - Tailwind configuration

### Storage Keys
- `family-events` - Event data
- `family-event-instances` - Instance overrides
- `family-settings` - Family member settings

---

**Version:** 1.0  
**Last Updated:** November 2025  
**Author:** YeoDa Family Calendar Development Team
