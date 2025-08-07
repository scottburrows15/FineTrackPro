# Overview

TeamFines Pro is a comprehensive fine management system designed specifically for UK sports teams. The application streamlines the process of issuing, tracking, and paying team fines through an automated system that replaces traditional spreadsheet-based approaches. The system provides role-based access with separate interfaces for players and administrators, integrated payment processing via Stripe, real-time notifications, and comprehensive reporting capabilities.

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