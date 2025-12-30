# EDH Cube Draft Simulator - Claude Code Guidelines

This is a Magic: The Gathering EDH (Elder Dragon Highlander) Cube Draft Simulator built with Next.js. This application allows users to manage card pools and simulate cube drafts.

## Project Structure

- **Framework**: Next.js 15.4.10 with App Router
- **Frontend**: React 19.1.0, TypeScript, Tailwind CSS 4
- **Database**: Google Cloud Firestore
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

# Firebase operations (no additional commands needed)
# Firebase setup is handled through configuration files

# Code formatting
yarn format

# Lint and type check
yarn check
```

### Environment Setup

1. Configure Firebase environment variables (see Firebase configuration section)
2. Set up Google OAuth credentials for NextAuth
3. Ensure Firebase project is set up with Firestore enabled
4. Configure service account for development or Workload Identity for production

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
│   └── firebase/         # Firebase configuration and utilities
│       ├── config.ts     # Firebase client configuration
│       ├── admin.ts      # Firebase admin SDK
│       └── types.ts      # Firestore type definitions
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

**IMPORTANT: When implementing UI components, always use the Storybook MCP to leverage component URLs and preview functionality for development and testing.**

Examples of components to create in this directory:

- Button variants
- Form controls (Input, Select, Textarea)
- Layout components (Card, Container)
- Loading states and skeletons
- Modal and dialog components
- Toast notifications

#### Storybook Stories and MCP Integration

When creating UI components, always include a Storybook story to document:

- Component API and props
- Visual states and variations
- Interactive examples
- Usage guidelines

**Use the Storybook MCP server to get component URLs for visual testing and verification during implementation:**

- Generate story URLs for component previews
- Test component variations in isolation
- Verify responsive behavior and styling
- Validate interactive states and accessibility

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
- **Define functions using arrow function syntax** - Use `const ComponentName = () => {}` instead of `function ComponentName() {}`
- Use Tailwind CSS for styling with the existing dark/light mode classes
- **Always add `cursor: pointer` to clickable UI elements** - Use `cursor-pointer` class for interactive elements (buttons, clickable areas, etc.) and `cursor-not-allowed` for disabled states
- Implement proper error handling with user-friendly messages
- Use React Server Components where appropriate (default in App Router)
- **CRITICAL: Always run `yarn typecheck` to verify TypeScript types are correct**
- **Always run `yarn lint` after implementation and ensure it passes without errors**
- Fix all linting and type errors before considering the implementation complete

### Database

- Use Firebase Firestore for database operations
- Utilize Firebase client SDK for client-side operations
- Use Firebase Admin SDK for server-side operations
- Follow TypeScript interfaces defined in `src/lib/firebase/types.ts`
- Implement proper Firestore security rules

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

**Before completing any implementation, always run these quality checks:**

```bash
# Type checking
yarn typecheck

# Linting (MUST pass without errors)
yarn lint

# Formatting check
yarn format:check

# All checks combined
yarn check
```

### Quality Requirements

- **CRITICAL: All TypeScript type errors must be fixed** - `yarn typecheck` must pass without errors
- **All lint errors must be fixed** - `yarn lint` must pass with zero errors
- Type checking must pass without TypeScript errors
- Code formatting should follow Prettier standards
- Run `yarn check` to verify all quality checks pass at once

**MANDATORY CHECK SEQUENCE:**
1. `yarn typecheck` - MUST pass before proceeding
2. `yarn lint` - MUST pass before completion
3. `yarn format:check` - Verify formatting compliance

## Deployment

The application is designed to deploy on Vercel:

- Automatic deployments from main branch
- Environment variables configured in Vercel dashboard
- Database hosted on Google Cloud Firestore
- Workload Identity integration for secure GCP authentication

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
7. **MANDATORY: Run `yarn typecheck` and ensure it passes without errors**
8. **Run `yarn lint` and ensure it passes before completing any implementation**
9. Verify all quality checks pass with `yarn check`
