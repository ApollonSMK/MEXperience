# AI Rules & Guidelines

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (built on Radix UI)
- **Icons:** Lucide React
- **Backend/Database:** Supabase (PostgreSQL, Auth, Realtime)
- **Payments:** Stripe
- **Form Handling:** React Hook Form + Zod
- **Date Handling:** date-fns

## Development Rules

### 1. UI & Styling
- **Library:** ALWAYS use Tailwind CSS for styling.
- **Components:** ALWAYS prioritize using existing shadcn/ui components located in `src/components/ui`.
- **New Components:** If a new UI primitive is needed, implement it using Radix UI and Tailwind, following the shadcn/ui pattern.
- **Responsive Design:** ALWAYS ensure layouts are responsive using standard Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).

### 2. State & Data Fetching
- **Supabase Client:**
  - For client components: Use `getSupabaseBrowserClient` from `@/lib/supabase/client`.
  - For server components/actions: Use `createSupabaseRouteClient` from `@/lib/supabase/route-handler-client`.
- **Realtime:** Use Supabase Realtime subscriptions for live updates (e.g., appointments, notifications).

### 3. Forms & Validation
- **Library:** Use `react-hook-form` for form state management.
- **Validation:** Use `zod` for schema validation.
- **Integration:** Use `@hookform/resolvers/zod` to connect Zod schemas to React Hook Form.

### 4. File Structure
- **Root:** All source code must reside in the `src/` directory.
- **Pages:** `src/app/` (App Router structure).
- **Components:** `src/components/`.
- **Utilities:** `src/lib/`.
- **Hooks:** `src/hooks/`.

### 5. Date & Time
- **Library:** Use `date-fns` for all date manipulation and formatting.
- **Localization:** Use the `fr` locale from `date-fns/locale` for user-facing dates.

### 6. Icons
- **Library:** Use `lucide-react` for all icons. Do not import icons from other libraries.

### 7. Payments
- **Library:** Use `@stripe/react-stripe-js` and `@stripe/stripe-js` for client-side payment elements.
- **Backend:** Use the `stripe` npm package for server-side operations.

### 8. Code Style
- **Functional Components:** Use React functional components with hooks.
- **Types:** Strictly use TypeScript interfaces/types for props and data structures.
- **Clean Code:** Keep components small and focused. Extract complex logic into custom hooks or utility functions.