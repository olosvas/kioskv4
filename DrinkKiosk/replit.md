# Replit.md

## Overview

This is a full-stack TypeScript kiosk application for a smart beverage dispensing system. The application consists of a React frontend with a Node.js/Express backend, designed to handle beverage ordering, age verification, payment processing, and hardware control for an automated drink dispensing machine.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Structure
- **Frontend**: React 18 with TypeScript using Vite as the build tool
- **Backend**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for database management
- **State Management**: TanStack Query for server state management
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Build System**: Vite for frontend, esbuild for backend bundling

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend
├── shared/          # Shared TypeScript types and schemas
├── migrations/      # Database migration files
└── dist/           # Built application output
```

## Key Components

### Frontend Architecture
- **Component Library**: Uses shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom kiosk-specific color scheme
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query for server state, React hooks for local state

### Backend Architecture
- **API Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Validation**: Zod schemas for request/response validation
- **Storage Layer**: Abstracted storage interface with in-memory fallback
- **Hardware Integration**: Service layer for Raspberry Pi GPIO control

### Database Schema
- **beverages**: Drink inventory with pricing, stock levels, and GPIO pin assignments
- **orders**: Order tracking with items, status, and verification flags
- **kiosk_config**: System configuration including language and alcohol settings

### Hardware Integration
- **GPIO Control**: Valve control for beverage dispensing
- **Flow Sensors**: Volume measurement during dispensing
- **Age Verification**: Camera integration for age verification

## Data Flow

### Order Processing Flow
1. **Beverage Selection**: User selects drinks and volumes from available inventory
2. **Age Verification**: For alcoholic beverages, triggers camera-based age verification
3. **GDPR Compliance**: Requests consent for image processing
4. **Payment Processing**: Handles card/contactless payments
5. **Hardware Control**: Controls valves and monitors flow sensors for dispensing
6. **Order Completion**: Updates order status and provides user feedback

### State Management
- **Server State**: TanStack Query manages API calls and caching
- **Local State**: React hooks for UI state and shopping cart
- **Form State**: React Hook Form for complex form interactions

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with TypeScript support
- **Express.js**: Backend web server framework
- **Drizzle ORM**: Type-safe database ORM for PostgreSQL
- **TanStack Query**: Server state management and caching

### UI and Styling
- **shadcn/ui**: Component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI component primitives

### Database and Validation
- **PostgreSQL**: Primary database with Neon serverless option
- **Zod**: Runtime type validation and schema definition
- **connect-pg-simple**: PostgreSQL session store

### Hardware and External Services
- **Camera API**: Browser MediaDevices for age verification
- **Payment Processing**: Placeholder for payment gateway integration
- **GPIO Control**: Planned integration with pigpio library for Raspberry Pi

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with hot reload
- **Database**: Uses DATABASE_URL environment variable for connections

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server to `dist/index.js`
- **Static Serving**: Express serves built frontend files in production

### Environment Configuration
- **Database**: Requires DATABASE_URL for PostgreSQL connection
- **External APIs**: Configurable endpoints for cloud services
- **Hardware**: GPIO pin configurations in database

### Key Architectural Decisions

1. **Monorepo Structure**: Single repository with shared types between frontend and backend for type safety
2. **Storage Abstraction**: Interface-based storage layer allows switching between in-memory and database implementations
3. **Component-Based UI**: shadcn/ui provides consistent, accessible components optimized for kiosk interfaces
4. **Hardware Service Layer**: Abstracted hardware control allows development without actual GPIO hardware
5. **Age Verification Flow**: GDPR-compliant image processing with external API integration
6. **Real-time Updates**: TanStack Query provides optimistic updates and real-time state synchronization

The architecture prioritizes type safety, hardware abstraction, and user experience while maintaining compliance with data protection regulations for a commercial kiosk environment.

## Recent Changes (July 24, 2025)

### Payment Integration Fixed
- ✓ Connected kiosk to main app API at https://kiosk-manager-uzisinapoj.replit.app/
- ✓ Fixed order creation and payment processing with cloud database
- ✓ Orders now properly stored in both local cache and cloud database
- ✓ Payment requests routed to main app with local fallback simulation

### Hardware Documentation Added
- ✓ Created comprehensive Raspberry Pi setup guide (RASPBERRY_PI_SETUP.md)
- ✓ GPIO pin assignments and wiring diagrams for 12V valves and YF-S301 flow sensors
- ✓ Complete installation and configuration instructions for production deployment
- ✓ Auto-start kiosk mode configuration for 7" touchscreen (800x480)