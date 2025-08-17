# Overview

TeamFines Pro is a comprehensive fine management system designed specifically for UK sports teams. The application streamlines the process of issuing, tracking, and paying team fines through an automated system that replaces traditional spreadsheet-based approaches. The system provides role-based access with separate interfaces for players and administrators, integrated payment processing via Stripe, real-time notifications, and comprehensive reporting capabilities.

## Recent Changes (January 2025)
- ✅ **Complete Mobile Optimization**: All popup windows and modals now fully optimized for mobile devices with 95vw responsive width, mobile-first grids, and touch-friendly button layouts
- ✅ **Analytics Dashboard**: Added comprehensive team analytics with charts, trends, and real-time data visualization
- ✅ **Modal Mobile Fixes**: Updated base Dialog and AlertDialog components for consistent mobile defaults across entire application
- ✅ **Audit Trail System**: Comprehensive audit logging with admin interface, search functionality, and migration system for existing data (user requested skip for now)
- ✅ **Advanced Fine Management (Task 5)**: Enhanced bulk operations with multi-select fine issuing, advanced filtering system with search, date ranges, player/category filters, sorting options, and bulk deletion capabilities

### Comprehensive Enhancement Initiative (January 12, 2025)
- ✅ **Step 1 - Modern Design System**: Enhanced CSS architecture with improved color palette, typography scale, spacing system, glass morphism effects, and comprehensive accessibility features
- ✅ **Theme System Implementation**: Complete theme provider with dark mode support and persistent theme storage
- ✅ **UI Component Library Expansion**: Added loading skeletons, error boundaries, empty states, and advanced search components for better UX
- ✅ **Enhanced Landing Page**: Modern hero section with gradient backgrounds, glass cards, animated elements, and improved call-to-action buttons
- ✅ **Step 2 - Feature Expansion**: Advanced fine search with date ranges, filtering, real-time updates system with automatic notifications and offline handling
- ✅ **Enhanced Dashboard**: Comprehensive analytics dashboard with time-range selection, real-time metrics, activity trends, and category breakdowns

### Open Banking Integration Implementation (January 17, 2025)
- ✅ **Complete Payment System**: Comprehensive database schema with payment intents, transactions, reconciliation matches, and Open Banking tokens
- ✅ **Backend Infrastructure**: Full Express.js API routes for payment intent creation, transaction sync, manual reconciliation, and Open Banking consent flow
- ✅ **Automated Reconciliation**: Smart matching algorithm with exact reference, amount + prefix, and fuzzy matching with confidence scoring
- ✅ **Sync Worker System**: Node-cron based worker for automatic transaction polling every 5 minutes during business hours with cleanup tasks
- ✅ **Frontend Payment Interface**: Modern React payment page with fine selection, payment intent creation, and bank transfer instructions
- ✅ **Mock Provider Integration**: Complete Open Banking provider abstraction ready for production API integration (TrueLayer/Yapily/Plaid)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built using React with TypeScript and follows a modern component-based architecture. Key architectural decisions include:

**UI Framework**: Uses shadcn/ui components built on Radix UI primitives for accessible, customizable components with Tailwind CSS for styling. This provides a consistent design system with minimal custom CSS required.

**State Management**: Implements TanStack Query for server state management, which handles caching, background updates, and optimistic updates. Local state is managed through React hooks, keeping the architecture simple and predictable.

**Routing**: Uses wouter for lightweight client-side routing, chosen for its minimal footprint compared to React Router while providing essential routing functionality.

**Forms & Validation**: Utilizes React Hook Form with Zod for form handling and validation, providing type-safe form schemas and efficient validation.

## Backend Architecture
The server-side follows an Express.js-based REST API architecture with clear separation of concerns:

**API Structure**: RESTful endpoints organized by resource type (users, teams, fines, payments) with consistent response formats and error handling middleware.

**Database Layer**: Uses Drizzle ORM with PostgreSQL for type-safe database operations. The ORM provides automatic TypeScript types from database schemas and supports both query building and raw SQL when needed.

**Authentication**: Integrates Replit's OpenID Connect (OIDC) authentication system with Passport.js for session management. Sessions are stored in PostgreSQL using connect-pg-simple for persistence.

**Storage Pattern**: Implements a storage abstraction layer that encapsulates all database operations, making the codebase easier to test and potentially migrate to different storage backends.

## Payment Processing
Stripe integration handles all payment operations with a secure server-side approach:

**Payment Intent Flow**: Creates payment intents on the server to maintain PCI compliance, with the client handling only the presentation layer through Stripe Elements.

**Webhook Handling**: Processes Stripe webhooks to confirm payments and update fine statuses, ensuring data consistency even if client-side confirmation fails.

## Data Model
The database schema supports multi-tenancy through teams with the following core entities:

**Users**: Store authentication details and team associations with role-based access control (player/admin).

**Teams**: Separate team spaces with unique invite codes for joining.

**Fine Categories/Subcategories**: Hierarchical organization of fine types with default amounts for quick fine creation.

**Fines**: Core transaction records linking players to specific infractions with payment status tracking.

**Notifications**: Real-time updates for fine assignments and payment confirmations.

**Audit Log**: Comprehensive activity tracking for administrative oversight.

## Security Considerations
Authentication is handled through Replit's OIDC provider with secure session management. API endpoints implement proper authorization checks, and sensitive operations require admin privileges. Payment data never touches the application servers directly, maintaining PCI compliance through Stripe's secure infrastructure.

# External Dependencies

## Database
- **Neon Database**: Serverless PostgreSQL database for production deployment
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL dialect
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Authentication
- **Replit OIDC**: Identity provider integration for user authentication
- **Passport.js**: Authentication middleware with OpenID Connect strategy
- **express-session**: Session management with secure cookie handling

## Payment Processing
- **Stripe**: Complete payment processing infrastructure including:
  - Payment Intents API for secure payment collection
  - Stripe Elements for PCI-compliant form handling
  - Webhooks for payment confirmation and status updates
  - Customer management for recurring payment scenarios

## UI Components & Styling
- **Radix UI**: Unstyled, accessible component primitives
- **shadcn/ui**: Pre-built component library based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Comprehensive icon library for consistent iconography

## Development Tools
- **Vite**: Fast build tool with HMR for development
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Development Tools**: Platform-specific development environment integration