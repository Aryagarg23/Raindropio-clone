# Project Plan: Raindrop.io Clone (Phase 1 Foundation + Extended Roadmap)

## 1. Vision & Scope
**Goal**: Build an extensible foundation for a Raindrop.io-like collaborative bookmarking/knowledge organization platform supporting user auth, team membership, and admin operations.
**Out of Scope (Phase 1)**: Full bookmark storage, tagging, search relevance ranking, browser extensions, mobile apps, real-time collaboration.
**Success Criteria (Phase 1)**:
- Users can authenticate with Google via Supabase.
- Public `users` table mirrors `auth.users` and is synced/verified via trigger + `/users/sync`.
- Admin can create teams and assign users; users can view their teams.
- Role-based access enforced (RLS + backend guards).
- Deployed frontend (Vercel) + backend (Render) + database (Supabase) with CI/CD.

## 2. Functional Requirements
- Authentication: Google OAuth through Supabase, session persistence in Next.js.
- User Profile Sync: Auto-create public profile; manual re-sync endpoint.
- Team Management: Admin creates teams and adds members.
- Team Visibility: Authenticated users fetch only teams they belong to.
- Admin Panel: List users, create teams, add members.
- Authorization: Only admins can access `/admin/*` endpoints.

## 3. Non-Functional Requirements
- Availability: >= 99% (leveraging managed platforms).
- Latency: API median < 300ms for simple queries.
- Security: RLS on all tables; least privilege keys in frontend.
- Observability: Basic structured logging (FastAPI + Vercel logs) + error surfaces.
- Scalability: Design to scale horizontally (stateless backend, Supabase managed). 
- Maintainability: Typed code (TS + Python type hints), modular layout.
- Documentation: Setup & API docs in repo.

## 4. High-Level Architecture
- Frontend (Next.js / Vercel) calls backend (FastAPI) for domain operations requiring service role access (admin ops).
- Backend communicates with Supabase via service role key (secure, never exposed to client).
- Direct Supabase client in frontend used only for auth/session retrieval (anon key).
- Auth Flow: User logs in -> session stored in client -> backend endpoints receive JWT via `Authorization: Bearer <access_token>` -> backend validates with Supabase.

```
[Browser] --(Auth OAuth)--> [Supabase Auth]
[Browser] --(JWT)--> [FastAPI Backend] --(service role)--> [Supabase DB]
[Browser] --(public queries minimal)--> [Supabase (anon)]
```

## 5. Detailed Data Model (Phase 1)
Tables: `users`, `teams`, `team_memberships` (+ Supabase `auth.users`).
Future (Not Implemented Yet): `collections`, `bookmarks`, `tags`, `collection_memberships`, `audit_logs`.

## 6. Database Migrations Strategy
Approach: Store SQL migration files in `/supabase/migrations` (or custom `/db/migrations`) and apply sequentially via dashboard initially; later use CLI.
- 001_init_roles_users.sql
- 002_teams_and_memberships.sql
- 003_triggers_and_functions.sql
- 004_rls_policies.sql
Each migration idempotent where possible; destructive changes require new files.

## 7. Row Level Security (RLS) Policies (Planned)
Enable RLS on `users`, `teams`, `team_memberships`.
Policies (pseudo):
- users: user can `SELECT` own row; admin can `SELECT` all.
- teams: member can `SELECT` teams joined; admin `ALL`.
- team_memberships: user can `SELECT` rows where `user_id = auth.uid()`; admin `ALL`.
- Inserts to `team_memberships`: only via backend (service role) or admin role claims.
JWT Custom Claims: Add `role` from public profile (backend may mint custom JWT or rely on Supabase if using metadata sync approach).

### 7.1 RLS Activation SQL
```
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
```

### 7.2 Helper Function For Role Lookup (Optional)
Instead of trusting client-side custom claims initially, query the `public.users` table.
```
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;
```

### 7.3 Policies: `public.users`
```
-- Allow a user to see their own profile
CREATE POLICY select_own_user ON public.users
  FOR SELECT USING ( id = auth.uid() );

-- Allow admins to see all users
CREATE POLICY admin_select_all_users ON public.users
  FOR SELECT USING ( public.current_role() = 'admin' );

-- Prevent direct INSERT/UPDATE/DELETE by non-service roles (no policy added) -> only service key.
```

### 7.4 Policies: `public.teams`
```
-- Members can read teams they belong to
CREATE POLICY select_member_teams ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships m
      WHERE m.team_id = teams.id AND m.user_id = auth.uid()
    )
  );

-- Admin can read all teams
CREATE POLICY admin_select_all_teams ON public.teams
  FOR SELECT USING ( public.current_role() = 'admin' );

-- Creation restricted: only admins (if wanting to allow client direct insert) else via backend service key
CREATE POLICY admin_insert_team ON public.teams
  FOR INSERT WITH CHECK ( public.current_role() = 'admin' );

-- Updates (optional) - only admins
CREATE POLICY admin_update_team ON public.teams
  FOR UPDATE USING ( public.current_role() = 'admin' );
```

### 7.5 Policies: `public.team_memberships`
```
-- Read memberships of self
CREATE POLICY select_own_memberships ON public.team_memberships
  FOR SELECT USING ( user_id = auth.uid() );

-- Admin read all
CREATE POLICY admin_select_all_memberships ON public.team_memberships
  FOR SELECT USING ( public.current_role() = 'admin' );

-- Admin add membership (if not relying solely on service key)
CREATE POLICY admin_insert_membership ON public.team_memberships
  FOR INSERT WITH CHECK ( public.current_role() = 'admin' );

-- Optional removal by admin
CREATE POLICY admin_delete_membership ON public.team_memberships
  FOR DELETE USING ( public.current_role() = 'admin' );
```

### 7.6 Service Role Operations
The backend will use the service role key which bypasses RLS for administrative operations (team creation & assignment). Keep policies conservative because future endpoints might introduce direct Supabase client usage from frontend.

### 7.7 Testing RLS
Manual psql tests (script later):
1. Set role via `SET request.jwt.claim.sub = '<user_uuid>';` (Supabase simulation) if using local Postgres.
2. Attempt unauthorized selects to ensure denial.
3. Ensure admin user can access all.

### 7.8 Migration Ordering Notes
- Function `current_role()` must be created before policies referencing it.
- Policies can be dropped & re-created safely with `DROP POLICY IF EXISTS` in future migrations.

### 7.9 Future Considerations
- Add `collection` related policies mirroring membership model.
- Introduce soft deletes (`deleted_at`) requiring policy updates.


## 8. Backend (FastAPI) Design
Structure (proposed):
```
backend/
  main.py
  api/
    deps.py
    routers/
      users.py
      teams.py
      admin.py
  core/
    config.py
    security.py
    supabase_client.py
  models/ (pydantic schemas)
    user.py
    team.py
    membership.py
  middleware/
    auth.py
  tests/
```
Key Concerns:
- Dependency injection for supabase client.
- Auth middleware: validate JWT, fetch role from `users` table.
- Error handling: unified JSON error responses.

## 9. API Specifications (Overview)
(All responses JSON; errors use `{ "error": { "code": string, "message": string } }`)
1. POST `/users/sync`
2. GET `/teams`
3. GET `/admin/users`
4. POST `/admin/teams`
5. POST `/admin/teams/{team_id}/members`
Detailed spec to be elaborated (next task).

### 9.1 Conventions
- Base URL (production backend): `https://<render-app>.onrender.com`
- Auth: Bearer token header `Authorization: Bearer <supabase_access_token>`.
- Content-Type: `application/json` for request & response unless noted.
- Time Format: ISO 8601 UTC.
- UUID Validation: 400 if malformed.
- Error Envelope:
```
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Team not found",
    "details": { "team_id": "..." }
  }
}
```
- Common Error Codes: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.

### 9.2 Schemas (Pydantic Models)
```
UserProfile {
  id: string(uuid)
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
}

Team {
  id: string(uuid)
  name: string
  created_at: string(datetime)
  created_by: string(uuid) | null
}

TeamMembership {
  team_id: string(uuid)
  user_id: string(uuid)
  joined_at: string(datetime)
}

CreateTeamRequest { name: string(minLength=2,maxLength=80) }
CreateTeamResponse = Team

AddMemberRequest { user_id: string(uuid) }
AddMemberResponse { message: string, team_id: string(uuid), user_id: string(uuid) }

SyncResponse = UserProfile
ListTeamsResponse Team[]
ListUsersResponse UserProfile[]
```

### 9.3 Endpoint Details
#### POST /users/sync
Purpose: Ensure public profile exists and is updated with latest metadata.
Request: (no body)
Response 200:
```
{
  "id": "...",
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "avatar_url": "https://...",
  "role": "user"
}
```
Possible Errors: `UNAUTHORIZED` (no/invalid token), `INTERNAL_ERROR`.
Idempotent: Yes.

#### GET /teams
Purpose: Return teams for authenticated user.
Response 200:
```
[
  { "id": "...", "name": "Team A", "created_at": "2025-09-13T12:00:00Z", "created_by": "..." }
]
```
Empty list if none.
Errors: `UNAUTHORIZED`.

#### GET /admin/users (Admin Only)
Response 200:
```
[
  { "id": "...", "email": "user@example.com", "role": "user", "full_name": null, "avatar_url": null }
]
```
Errors: `UNAUTHORIZED`, `FORBIDDEN`.
Pagination (Phase 2): Will add `?limit=&cursor=` pattern.

#### POST /admin/teams (Admin Only)
Request:
```
{ "name": "Research Squad" }
```
Response 201:
```
{ "id": "...", "name": "Research Squad", "created_at": "2025-09-13T12:00:00Z", "created_by": "<admin_uuid>" }
```
Errors: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT` (if enforcing unique name later).

#### POST /admin/teams/{team_id}/members (Admin Only)
Request:
```
{ "user_id": "<uuid>" }
```
Response 200:
```
{ "message": "User added to team successfully.", "team_id": "<uuid>", "user_id": "<uuid>" }
```
Errors: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND` (team or user), `CONFLICT` (already member).

### 9.4 OpenAPI & Documentation
- Generate OpenAPI via FastAPI auto docs; export static JSON on CI (`python -c 'import json,requests; ...'` or custom script).
- Commit `openapi.json` for contract tests.

### 9.5 Future Endpoints (Phase 2+ Placeholder)
- `GET /profile` (explicit cached profile fetch)
- `POST /admin/users/{id}/role` (role elevation)
- `GET /admin/teams` (list teams) / pagination
- `DELETE /admin/teams/{team_id}/members/{user_id}`

### 9.6 Error Examples
Validation Error (422 mapped to 400 externally):
```
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'name' must be at least 2 characters",
    "details": { "field": "name", "min_length": 2 }
  }
}
```

Forbidden:
```
{
  "error": { "code": "FORBIDDEN", "message": "Admin role required" }
}
```

Not Found:
```
{
  "error": { "code": "RESOURCE_NOT_FOUND", "message": "Team not found" }
}
```

## 10. Frontend (Next.js) Structure (Proposed)
```
frontend/
  app/ (or pages/)
    layout.tsx
    page.tsx (dashboard)
    login/page.tsx
    admin/page.tsx
  lib/
    supabaseClient.ts
    api.ts (fetch wrappers)
    auth.ts (helpers)
  components/
    AuthGate.tsx
    TeamList.tsx
    Admin/
      UserTable.tsx
      CreateTeamForm.tsx
      AddMemberForm.tsx
  hooks/
    useSessionUser.ts
  types/
    api.ts
```
State: Prefer server components + `@supabase/auth-helpers-nextjs`; client components for interactive forms.

## 11. Authentication Flow (Detailed)
1. User clicks "Login with Google" -> `supabase.auth.signInWithOAuth`.
2. Redirect back with session -> Supabase helper sets cookies.
3. Root layout loads session; if new sign-in event, call `/users/sync`.
4. Dashboard server component fetches teams via backend using stored access token (passed via header using a fetch wrapper that reads from cookie/client helper).
5. Admin page guards on `role === 'admin'` (fetched from `/users/sync` response or a cached user profile endpoint added later).

## 12. Configuration & Secrets Management
- Frontend `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, `NEXTAUTH_SECRET` (if NextAuth is actually adopted; may be redundant if only Supabase auth).
- Backend: `SUPABASE_URL`, `SUPABASE_KEY` (service), optional `LOG_LEVEL`.
- Future: rotate keys; consider adding a minimal config loader.

## 13. Dev Environment Setup
Scripts (future):
- `make dev-front` (runs `next dev`).
- `make dev-back` (runs `uvicorn main:app --reload`).
- Docker (optional later) with multi-stage for backend.

## 14. Logging & Observability
- Backend: Use FastAPI logger + structured log adapter (JSON) for request id, user id.
- Frontend: Minimal console logging; avoid leaking tokens.
- Later: Add OpenTelemetry exporter (OTLP) + tracing if needed.

## 15. Testing Strategy (High-Level)
To expand later: unit (schemas, util), integration (API + Supabase test project), contract (OpenAPI diff), e2e (Playwright hitting deployed preview). Seed script to insert mock users & teams with deterministic UUIDs.

### 15.1 Scope Matrix
| Layer | Goal | Tools |
|-------|------|-------|
| Unit (backend) | Validate pure logic (parsers, validators) | pytest, mypy |
| Integration (backend) | Endpoints + Supabase interaction (staging/test project) | pytest + httpx AsyncClient |
| Contract | Ensure API responses match OpenAPI | schemathesis / openapi-core |
| E2E (frontend) | Validate full user/admin flows | Playwright |
| Security (basic) | Block unauthorized access | targeted tests |

### 15.2 Backend Unit Tests
- Test pydantic models: required fields, validation errors.
- Utility functions in `security.py` (JWT decode, role extraction) using mocked tokens.

### 15.3 Integration Tests
Setup:
- Use separate Supabase test project (different keys via GitHub Action secrets).
- Migrations applied before suite.
- Create fixture to seed: one admin user, two normal users, one team with one member.
Scenarios:
- `/users/sync` creates missing profile and returns existing on second call.
- `/teams` returns empty list vs populated list depending on membership.
- Admin endpoints reject non-admin tokens.
- Adding existing membership returns 409 style error.

### 15.4 Contract Tests
- Export `openapi.json` from running FastAPI.
- Validate each endpoint success + error examples covered by schema.
- Detect breaking changes on PR (fail CI if diff introduces removal without version bump label).

### 15.5 E2E Tests (Phase 2 / Optional in Phase 1 Stretch)
Flow Cases:
1. Login -> redirected to dashboard -> sees lobby (no teams).
2. Admin login -> create team -> assign user -> user dashboard shows team.
3. Non-admin attempts to navigate to `/admin` -> redirected or shown forbidden.
Implementation: Playwright with storage state for authenticated context (stub Supabase login via API if possible, else interactive first run).

### 15.6 Test Data & Seeding
Deterministic UUIDs (pre-generated) to simplify assertions:
```
ADMIN_USER_ID=11111111-1111-1111-1111-111111111111
USER_A_ID=22222222-2222-2222-2222-222222222222
TEAM_ALPHA_ID=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
```
Seeding script `scripts/seed_test_data.py` (invoked in CI) performing inserts with service key.

### 15.7 Coverage Targets
- Backend: line >= 80%, branches >= 70% for core modules.
- Critical security paths (auth, role guard) 100% branch.

### 15.8 CI Integration
- Jobs: `backend-tests` (pytest + coverage), `contract-tests`, `lint`.
- Fail fast on schema drift or unauthorized policy gaps.

### 15.9 Linting & Static Analysis
- Python: `ruff` + `mypy`.
- TypeScript: `eslint` + `tsc --noEmit`.

### 15.10 Future Additions
- Mutation testing (cosmic-ray / mutmut) for critical security functions.
- Performance micro-benchmarks for heavy queries once bookmark features exist.


## 16. CI/CD Pipeline (Future Setup)
- GitHub Actions workflows:
  - `lint-and-test.yml`: run `pnpm lint`, `pytest` (backend), `mypy`.
  - `build-preview.yml`: deploy preview to Vercel (auto) & Render (manual or triggered).
  - `openapi-check.yml`: ensure OpenAPI schema committed.
- Branch Strategy: `main` (protected), feature branches + PR review.

## 17. Security Considerations
- Never expose service key to frontend.
- Enforce HTTPS-only cookies.
- Validate `team_id` UUID format before DB calls.
- Rate limiting (Phase 2) via middleware (e.g., Redis).
- Audit logging table (Phase 2).

## 18. Performance Considerations
- Indexes: `team_memberships (user_id)`, `team_memberships (team_id)`, `teams (created_by)`.
- Avoid N+1: Single join query for `/teams`.

## 19. Future Extension Points
- Collections & bookmarks.
- Tagging & search (Postgres full-text or Meilisearch).
- Browser extension capturing page metadata.
- Real-time presence with Supabase Realtime.
- Notification system (email / webhooks).

## 20. Milestones (Draft)
M1: Repo scaffolds (front + back), DB schema applied, auth working.
M2: Backend endpoints functional + RLS policies.
M3: Frontend dashboard + team visibility.
M4: Admin panel features.
M5: Testing & CI pass, documentation baseline.

### 20.1 Milestone Acceptance Criteria
**M1**
- Next.js app boots locally & deployed preview
- FastAPI app health endpoint returns 200 deployed
- Supabase schema (users, teams, team_memberships) & trigger created
- Google OAuth sign-in returns a session; user row inserted

**M2**
- All 5 core endpoints implemented & documented
- RLS policies active and deny unauthorized test cases
- OpenAPI file committed & matches live API

**M3**
- Authenticated dashboard shows teams (empty state + list)
- Protected route redirect works (/ redirects to /login if signed out)
- Sync call executed on first login and not redundantly spamming network afterwards

**M4**
- Admin page gated by role
- Create team form persists and appears immediately in admin view
- Add member form prevents duplicate membership
- Error toasts for failure paths

**M5**
- Backend coverage >= 80%
- Lint & type checks pass (front + back)
- Playwright basic happy path (login + view teams) green (if implemented in phase)
- README updated with setup & API usage

### 20.2 Backlog (Initial Stories)
| ID | Title | Description | Acceptance Criteria | Est (pts) |
|----|-------|-------------|---------------------|-----------|
| B1 | Frontend Scaffold | Create Next.js TS app + base layout | App runs, ESLint configured | 2 |
| B2 | Backend Scaffold | FastAPI app + health route | `GET /health` 200 JSON | 2 |
| B3 | DB Schema Migration | Apply initial SQL | Tables exist & match plan | 3 |
| B4 | Google Auth Integration | Supabase Google login | Sign-in returns session | 3 |
| B5 | User Sync Endpoint | Implement `/users/sync` | Returns profile, idempotent | 2 |
| B6 | Teams Query Endpoint | Implement `/teams` | Returns correct membership set | 2 |
| B7 | Admin Users Endpoint | Implement `/admin/users` | Admin sees all; user forbidden | 2 |
| B8 | Create Team Endpoint | Implement `/admin/teams` | Team persisted; validation errors | 3 |
| B9 | Add Member Endpoint | Implement `/admin/teams/{id}/members` | Duplicate blocked | 2 |
| B10 | RLS Policies | Add and verify policies | Unauthorized queries blocked | 5 |
| B11 | Dashboard Page | Show team list or empty state | UI toggles correctly | 3 |
| B12 | Admin Page | CRUD forms working | All actions succeed | 5 |
| B13 | API Client Wrapper | Centralized fetch with token | 401 auto-handled | 2 |
| B14 | Testing Framework Setup | pytest + basic tests | CI passes | 3 |
| B15 | OpenAPI Export | Commit schema + check | CI blocks drift | 1 |
| B16 | Seed Script | Insert test data | Playwright uses seeds | 2 |
| B17 | Playwright Baseline | One full login flow test | Test passes | 3 |
| B18 | Logging Middleware | Add request id + user id logs | Appears in log output | 2 |

### 20.3 Definition of Done (DoD)
- Code reviewed & merged to main.
- Tests (relevant layers) passing.
- Lint & type checks clean.
- Documentation (README or inline) updated for new behaviors.
- No secrets committed; environment vars documented.

### 20.4 Estimation Notes
Assumes small team velocity ~20-25 pts / iteration; Milestones M1-M3 could fit in ~2 sprints.


## 21. Risks & Mitigations (Initial)
- RLS misconfiguration: Use staging DB & automated policy tests.
- Role drift between JWT & table: Always fetch role server-side per request initially.
- Vendor coupling (Supabase): Abstract DB access in backend layer.
- Accidental exposure of service key: Restrict environment variable scope & code review.

### 21.1 Expanded Risk Register
| Risk | Impact | Likelihood | Mitigation | Owner |
|------|--------|------------|-----------|-------|
| RLS Misconfig allows data leakage | High | Medium | Automated integration tests cover unauthorized access; manual review of policies | Backend Lead |
| Stale role in client after privilege change | Medium | Medium | Force fresh fetch on admin panel load; short TTL cache only server-side | Backend |
| Supabase outage | High | Low | Graceful error messaging; plan read replicas (future) | Infra |
| Render cold starts delay first request | Low | Medium | Keep-alive ping (cron) if needed; move to always-on tier if necessary | Infra |
| API schema drift w/o versioning | Medium | Medium | Contract tests + PR check requiring updated `openapi.json` | Dev Lead |
| Insufficient logging for incident triage | Medium | Medium | Introduce structured logging early + correlation id middleware | Backend |
| Key leakage in repo history | High | Low | Pre-commit secret scan (gitleaks), rotation runbook | All |
| Unauthorized admin role escalation | High | Low | No client-side role mutation; server-side validation only | Backend |
| Unexpected Supabase rate limits | Medium | Low | Implement basic exponential retry wrapper; monitor usage | Backend |
| Performance degradation with future joins | Medium | Medium | Add appropriate indexes; use EXPLAIN in integration tests (optional) | Backend |
| Scope creep delays core delivery | Medium | Medium | Phase gate: freeze scope after M1 sign-off | PM |
| Lack of test isolation causes flakes | Low | Medium | Deterministic seeds, DB reset fixture | QA |

### 21.2 Incident Response (Lightweight)
1. Identify severity (user impact?).
2. Capture logs & failing request ids.
3. Rollback recent deploy (Vercel/Render provides previous version quick restore).
4. Patch fix branch -> PR -> redeploy.
5. Post-mortem doc (if High severity) capturing root cause & action items.

### 21.3 Key Rotation Plan
- Maintain a secrets inventory (Supabase anon, service, Render env, Vercel env).
- Quarterly rotation scheduled; emergency rotation if exposure suspected.
- After rotation: run smoke tests to confirm auth & admin flows.


## 22. Open Questions
- Use NextAuth in addition or rely solely on Supabase? (Currently leaning: Supabase only.)
- Need a dedicated user profile endpoint for future expansions? (Likely yes.)
- Introduce background worker (RQ/Celery) later for heavy tasks? (Phase 3.)

---
(Next steps: Flesh out Sections 7 (RLS specifics), 9 (API full spec), 15 (Testing detail), 21 (Expanded risks), 20 (Backlog with acceptance criteria).)
