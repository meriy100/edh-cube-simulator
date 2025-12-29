# EDH Cube Draft Simulator - Claude Code Guidelines

This is a Magic: The Gathering EDH (Elder Dragon Highlander) Cube Draft Simulator built with Next.js. This application allows users to manage card pools and simulate cube drafts.

## Project Structure

- **Framework**: Next.js 15.4.10 with App Router
- **Frontend**: React 19.1.0, TypeScript, Tailwind CSS 4
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: NextAuth with Google OAuth
- **Package Manager**: yarn 4.6.0
- **Node Version**: 22.18.0 (managed by Volta)

## Development Setup

### Package Manager
**Always use yarn for this project.** The project is configured to use yarn 4.6.0:

```bash
# Install dependencies
yarn install

# Start development server with Turbopack
yarn dev

# Build project
yarn build

# Run database migrations
yarn prisma:push

# Generate Prisma client
yarn prisma:generate

# Code formatting
yarn format

# Lint and type check
yarn check
```

### Environment Setup
1. Configure DATABASE_URL in your environment
2. Set up Google OAuth credentials for NextAuth
3. Run `yarn prisma:push` to create database tables

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth configuration
│   │   ├── cards/         # Card management API
│   │   ├── drafts/        # Draft session API
│   │   └── pools/         # Pool management API
│   ├── admin/             # Admin interface
│   ├── drafts/            # Draft pages
│   ├── pools/             # Pool management pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI component library (create here)
│   ├── CardGridWithPreview.tsx
│   ├── CombosMermaidGraph.tsx
│   ├── DraftPickClient.tsx
│   ├── ExportPickedList.tsx
│   └── PickedBoard.tsx
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── cardImage.ts      # Card image handling
│   ├── cardTypes.ts      # Type definitions
│   └── prisma.ts         # Prisma client
└── middleware.ts         # Next.js middleware
```

### Key Features
- **Pool Management**: Import card pools from Moxfield format or CubeCobra CSV
- **Draft Simulation**: Multi-player cube draft simulation
- **Card Database**: Stores parsed card information with tags and metadata
- **Admin Interface**: Google OAuth protected admin features
- **Combo Analysis**: Mermaid graph visualization of card combinations

## Development Guidelines

### UI Components
**Always create reusable UI components in `src/components/ui/`.**

**For each UI component, create a corresponding Storybook story file following the naming convention: `ui/{ComponentName}.stories.tsx`.**

Examples of components to create in this directory:
- Button variants
- Form controls (Input, Select, Textarea)
- Layout components (Card, Container)
- Loading states and skeletons
- Modal and dialog components
- Toast notifications

#### Storybook Stories
When creating UI components, always include a Storybook story to document:
- Component API and props
- Visual states and variations
- Interactive examples
- Usage guidelines

Example structure:
```
src/components/ui/
├── Button.tsx
├── Button.stories.tsx
├── Input.tsx
├── Input.stories.tsx
└── ...
```

### Code Standards
- Use TypeScript for all new files
- Follow the existing pattern of "use client" for client components
- Use Tailwind CSS for styling with the existing dark/light mode classes
- Implement proper error handling with user-friendly messages
- Use React Server Components where appropriate (default in App Router)

### Database
- Use Prisma for database operations
- Run `yarn prisma:generate` after schema changes
- Use `yarn prisma:push` for development database updates
- Follow the existing patterns in API routes for database queries

### Authentication
- Google OAuth is configured through NextAuth
- Admin routes are protected with middleware
- Use the auth utilities in `src/lib/auth.ts`

### API Design
- Follow REST conventions for API routes
- Include proper error handling and HTTP status codes
- Use TypeScript interfaces for request/response types
- Support both JSON and FormData where appropriate

## Testing & Quality

```bash
# Type checking
yarn typecheck

# Linting
yarn lint

# Formatting check
yarn format:check

# All checks
yarn check
```

## Deployment

The application is designed to deploy on Vercel:
- Automatic deployments from main branch
- Environment variables configured in Vercel dashboard
- Database hosted on Vercel Postgres

## Card Data Format

The application supports two input formats:

### Moxfield Format
```
1 Abrade (TDC) 203 #2-targeted-disruption #9-1-R
1 Abrupt Decay (MB2) 78 #2-targeted-disruption #9-2-BG
```

### CubeCobra CSV
Standard CSV export from CubeCobra platform.

## Contributing

1. Use yarn for all package operations
2. Create UI components in `src/components/ui/`
3. Follow existing TypeScript patterns
4. Test thoroughly with both input formats
5. Ensure proper error handling for user interactions
6. Maintain responsive design with Tailwind CSS