PRODUCT SPECIFICATION SERIES
WooCommerce CRM
Technology Stack & Requirements Traceability


|  |  |  |
| --- | --- | --- |




| Document type | Architecture and traceability |
| --- | --- |
| Version | 1.0 - Draft baseline |
| Date | 15 October 2026 |
| Product | WooCommerce CRM |
| Database platform | Supabase Database (managed PostgreSQL) |
| Scope note | Maps product requirements to application layers, technologies, implementation artifacts, and observable acceptance evidence. |


Document status: Requirements baseline for review. This document describes the intended product; it does not certify the current source code as complete or verified.

# Document control



| Field | Value |
| --- | --- |
| Document purpose | Define the target technology stack and traceability from product requirements to implementation layers and acceptance evidence. |
| Version | 1.0 - Draft baseline |
| Status | Target architecture; current-source implementation status is not asserted. |
| Related document | WooCommerce CRM - Product Requirements Document (PRD), version 1.0. |
| Database platform decision | Supabase Database (managed PostgreSQL) with Prisma ORM in the Express backend. |



# 1. Purpose and reading guide

This document is the technical companion to the PRD. It specifies the intended application layers, technology responsibilities, integration boundaries, important data flows, and requirement-to-component traceability. The traceability rows define what must exist and what observable evidence demonstrates the requirement; they do not certify that the current source archive already contains those implementations.


| Terminology: Use “Supabase” when naming the selected database platform. Technically, Supabase provides a managed PostgreSQL database; Prisma uses its PostgreSQL connector to access it. The baseline does not assume the use of Supabase Auth, Storage, Realtime, or Data API unless separately selected. |
| --- |



# 2. Target architecture



| Layer | Components | Responsibility |
| --- | --- | --- |
| Presentation | React.js, JavaScript, Vite, React Router, Tailwind CSS, shadcn/ui, Lucide | Pages, layouts, forms, filtering, visual feedback, data display, and user-triggered actions. |
| Application API | Node.js, Express.js, Zod | REST endpoints, request validation, controllers, authorization, CSRF handling, response contracts, and error mapping. |
| Domain services | Customer/order services, segmentation, workflow engine, agent tools, email/sync services | Business rules, calculations, identity linking, safe action orchestration, and idempotency. |
| Data access | Prisma ORM | Typed database access from JavaScript services, model mapping, transactions where appropriate, and migration workflow. |
| Database platform | Supabase Database (managed PostgreSQL) | Persistent customer records, orders, notes, tasks, communications, templates, workflows, webhook processing, synchronization metadata, users/sessions where applicable. |
| External services | WooCommerce REST API v3, WooCommerce webhooks, Resend | Remote commerce data, event-driven sync, transactional email sending, and provider delivery events. |



## 2.1 Request and data flow

1.  A user interacts with a React page. The frontend calls a named Express REST endpoint and displays the response state.
2.  Express authenticates the session, checks authorization and CSRF requirements for browser mutations, then validates parameters/body with Zod.
3.  A controller delegates to a focused service that implements the business rule.
4.  The service accesses Supabase Database through Prisma for persistent CRM data. Secrets remain server-side.
5.  Where required, the service calls WooCommerce REST API v3 or the configured email provider. Remote failures are mapped to honest UI status and recorded where useful.
6.  Inbound webhooks use separate signature-verification paths rather than browser-session authentication. They are validated, deduplicated, processed, and recorded.

## 2.2 Architecture boundaries

Browser boundary: No direct database connection and no WooCommerce consumer secret or email provider secret in the frontend.
Domain boundary: Customer segmentation, total calculations, workflow conditions, and agent actions belong in backend services, not duplicated in React components.
Source-of-truth boundary: WooCommerce owns commerce-managed customer and order fields. The CRM owns notes, tasks, communication history, workflow definitions, and CRM-only contacts.
Webhook boundary: A valid signature establishes origin/integrity under the provider protocol; payload validation and idempotency are still required.
Action boundary: Agent recommendations and workflow actions may only call allowlisted, validated services. Creating a draft is not the same as sending an email.

# 3. Technology stack matrix



| Technology | Required use | Design constraints / notes |
| --- | --- | --- |
| React.js + JavaScript | Interactive CRM frontend. | Do not use TypeScript in the requested implementation. Keep components focused and consume backend APIs. |
| Vite | Frontend development/build tooling. | Provide reproducible npm scripts and a production build configuration. |
| Tailwind CSS | Primary styling system. | The migration is complete only when the real pages use Tailwind utilities/configuration, not just when the dependency is installed. |
| shadcn/ui | Reusable UI controls. | Add actual required components and dependencies; forms, tables, dialogs, menus, and feedback should be functional. |
| React Router | Application navigation. | Protected routes must align with backend session state; every navigation item must lead to a real route. |
| Node.js + Express.js | Backend REST API and integration execution. | Keep integration keys on the server; use appropriate methods/status codes and central error handling. |
| Zod | Validate request bodies, params, queries, config shapes, and supported placeholders. | Validation must be invoked in request paths; schemas alone do not provide protection. |
| Supabase Database | Managed database platform and persistent store. | Underlying engine is PostgreSQL. Configure environment-specific connection strings from Supabase dashboard rather than constructing host values by guess. |
| Prisma ORM | Application database access and schema migrations. | Keep Prisma as ORM. Use a migration strategy compatible with the selected Prisma version and Supabase connection mode. |
| WooCommerce REST API v3 | Initial/manual customer and order import; on-demand remote retrieval where needed. | Handle pagination, authentication failures, limits, stable remote IDs, and idempotent upserts. |
| WooCommerce webhooks | Event-driven customer/order change notifications. | Use provider signature validation against the raw request body; deduplicate event delivery. |
| Resend (preferred) | Transactional email and delivery events. | Use server-side credentials; verify provider webhooks; do not confuse accepted with delivered. |
| Chart library (implementation choice) | Retention and trend visualizations. | Use an appropriate React-compatible library such as Recharts if selected. This is a supporting implementation choice, not a separately confirmed business dependency. |



# 4. Supabase database integration


## 4.1 Terminology and responsibility

Supabase is the selected database platform. Its core database is PostgreSQL. The backend uses Prisma ORM with the PostgreSQL provider/connector to access the Supabase-managed database; replacing the infrastructure provider does not require replacing relational data modeling or Prisma.
Official reference: Supabase architecture | Database connections | Prisma with Supabase

## 4.2 Configuration principles

Create a Supabase project and obtain the connection details from the Supabase dashboard. Do not guess the project host, pooler host, username, port, or region.
Configure the runtime database connection and migration connection according to the selected Prisma version and deployment topology. These may be separate environment variables, commonly named DATABASE_URL and DIRECT_URL, where supported by the version/configuration in use.
Choose a direct connection or an appropriate Supabase pooler mode according to whether the app runs as a persistent backend, a serverless function, or on a network with IPv4/IPv6 constraints.
Keep connection strings and passwords in server-side environment variables. Never bundle database connection strings in Vite frontend variables.
Use Prisma migrations as the reproducible schema-change mechanism. Keep generated migration SQL and required migration metadata in source control.
Do not assume Supabase Auth is part of the baseline: the PRD currently requires secure authenticated sessions, while the authentication provider remains an explicit open decision.

## 4.3 Supabase features not assumed

The baseline does not require Supabase Auth, Storage, Realtime, Edge Functions, or the Supabase Data API. Add one only if a specific product requirement justifies it and the architecture is updated accordingly. In the current target architecture, Express and Prisma handle normal application data operations.

# 5. Data model traceability



| Data entity | Primary responsibility | Constraints and links |
| --- | --- | --- |
| Customer | Customer identity and CRM-managed contact fields. | Maintain source distinction; associate orders, notes, tasks, and communication records. |
| WooCommerce identity | Map a customer to external WooCommerce identifiers. | Unique external identifiers; do not match or merge on name alone. |
| Order | Synchronized commerce order header. | Unique WooCommerce order ID; read-only in the CRM; linked customer is optional for guest orders. |
| Order item | Relevant line-item details used by order details and analytics. | Link to the correct order; retain only needed data. |
| Customer note | CRM-owned customer context. | Foreign key to customer; timestamps and authorized mutations. |
| Task | Follow-up work and reminders. | Customer relationship, status, due date, completion metadata, workflow idempotency where generated. |
| Communication | Email attempts and customer communication timeline. | Customer link; provider message ID where available; status history/metadata. |
| Email template | Saved email subject/body and supported placeholders. | Validate {{name}} and {{email}} in the current baseline; store in Supabase. |
| Workflow and workflow run | Configurable rules and execution history. | Enabled state, rule definition, event/run identity, outcomes, and duplicate prevention. |
| Webhook event | Process inbound WooCommerce/Resend events. | Provider/event identity or equivalent idempotency key; processing outcome; safe payload retention policy. |
| Sync state | Connection and synchronization tracking. | Timestamps, outcome, and enough context to explain failed/partial syncs. |
| User and session | Authenticated access. | Password hashes if app-managed login is retained; session expiration/revocation; role authorization. |



# 6. Requirements traceability matrix

The matrix links each requirement ID in the PRD to the intended UI, API/service, storage or integration, technology, and observable acceptance evidence. Evidence examples are artifacts or product behavior to inspect during implementation; they are not a separate testing phase.


| Req. ID | Requirement | Implementation mapping | Observable acceptance evidence |
| --- | --- | --- | --- |
| FR-CUS-01 | Customer list: search/filter/sort/page | UI: Customers page and reusable table/filter componentsAPI/service: Customer API + query validation/serviceData/integration: Supabase Customer records via PrismaStack: React, shadcn/ui, Tailwind, Express, Zod, Prisma | Changing query controls changes the returned/displayed record set; pagination and sort are consistent. |
| FR-CUS-02 | Customer profile | UI: Customer profile page/tabsAPI/service: Customer detail serviceData/integration: Customer, orders, notes, tasks, communicationsStack: React Router, Express, Prisma | Profile values and linked sections correspond to persisted records; missing fields render safely. |
| FR-CUS-03 | Create/edit CRM-only contact | UI: Customer create/edit formsAPI/service: Customer create/update endpointsData/integration: Customer CRM-owned fieldsStack: React, Zod, Express, Prisma | Saved changes persist after reload; WooCommerce-owned fields are not silently overwritten. |
| FR-CUS-04 | Protect WooCommerce fields | UI: Source labels/read-only controlsAPI/service: Authorization and update service rulesData/integration: Customer/Woo identity mappingsStack: Express, Zod, Prisma | Attempted unauthorized/unsupported edits are rejected by the backend. |
| FR-CUS-05 | Customer notes | UI: Notes section and dialogsAPI/service: Note CRUD endpointsData/integration: CustomerNoteStack: React, Express, Prisma | Create/edit/delete changes appear in the timeline and survive reload. |
| FR-CUS-06 | Identity/duplicate handling | UI: Customer profile warning and sync feedbackAPI/service: Identity matching serviceData/integration: Customer, Woo identity, order/customer linksStack: Express, Prisma | Matching uses stable identifiers and cautious email logic; no name-only automatic merge. |
| FR-ORD-01 | Order list | UI: Orders pageAPI/service: Order query endpointData/integration: Order and order-line recordsStack: React, Express, Prisma | Displayed orders are synced records, not static mock values. |
| FR-ORD-02 | Order filters/sort/page | UI: Order filters and table controlsAPI/service: Validated order query endpointData/integration: Indexed order fields where appropriateStack: React, Zod, Express, Prisma | Date/status/search/sort/page inputs change result set and remain coherent together. |
| FR-ORD-03 | Order detail and billing | UI: Order detail pageAPI/service: Order detail endpoint/serviceData/integration: Order and line itemsStack: React Router, Express, Prisma | Available billing fields and lines display accurately; guest/missing data is handled. |
| FR-SYNC-01 | Manual and initial Woo sync | UI: Sync Now and status UIAPI/service: WooCommerce sync serviceData/integration: Customer, order, line item, sync stateStack: Express, WooCommerce REST v3, Prisma | REST pagination is handled and repeated sync upserts by stable IDs. |
| FR-SYNC-02 | Sync status/errors | UI: Integration status viewAPI/service: Sync status endpointData/integration: SyncState/log metadataStack: React, Express, Prisma | Status and last-success information reflect actual backend outcomes. |
| FR-SYNC-03 | Woo webhooks | UI: No browser UI required; status/log display optionalAPI/service: Raw-body verified webhook handlerData/integration: WebhookEvent plus updated customer/order recordsStack: Express, WooCommerce webhooks, Prisma | Invalid signature is rejected; repeated event does not repeat side effects. |
| FR-ORD-04 | Read-only orders | UI: No mutation controlsAPI/service: Backend route/authorization boundaryData/integration: Order recordsStack: Express, Prisma | No CRM order write endpoint is introduced for create/edit/cancel/refund. |
| FR-COM-01 | Communication timeline | UI: Customer communication sectionAPI/service: Communication list endpointData/integration: CommunicationStack: React, Express, Prisma | Known message state and timestamps are displayed as recorded. |
| FR-COM-02 | Template CRUD | UI: Template management pageAPI/service: Template endpoints and serviceData/integration: EmailTemplateStack: React, shadcn/ui, Express, Zod, Prisma | Create/edit/delete persists; permission is enforced server-side. |
| FR-COM-03 | Placeholder validation | UI: Template form/previewAPI/service: Template rendering and Zod validationData/integration: EmailTemplate contentStack: Zod, Express, React | Only supported placeholders render; unsupported placeholders are rejected or flagged. |
| FR-COM-04 | Approved email send | UI: Composer, preview, confirmationAPI/service: Send endpoint/serviceData/integration: Communication record + provider responseStack: Express, Resend | No send before explicit approval; outcome reflects actual provider response. |
| FR-COM-05 | Delivery webhook | UI: Optional delivery status UIAPI/service: Signed Resend webhook handlerData/integration: Communication status/event metadataStack: Express, Resend webhooks, Prisma | Valid events update status idempotently; accepted is not displayed as delivered. |
| FR-TASK-01 | Create/update/complete task | UI: Task page and customer task panelAPI/service: Task endpoints/serviceData/integration: TaskStack: React, Express, Zod, Prisma | Mutations persist and report backend outcome. |
| FR-TASK-02 | Task views | UI: Task filters/status tabsAPI/service: Task query endpointData/integration: TaskStack: React, Express, Prisma | Pending/completed/overdue views use consistent status/due-date logic. |
| FR-WF-01 | Workflow rule management | UI: Workflow page/formsAPI/service: Workflow CRUD endpoints/serviceData/integration: WorkflowStack: React, shadcn/ui, Express, Zod, Prisma | Admin can manage stored rules; disabled rules do not execute. |
| FR-WF-02 | Workflow execution | UI: Enable/run/scheduler viewsAPI/service: Rule evaluator/action dispatcherData/integration: Workflow, WorkflowRun, Task and optional draft recordsStack: Node.js, Express services, Prisma | Each rule has supported trigger/condition/action semantics; execution produces an actual defined outcome. |
| FR-WF-03 | Execution history | UI: Workflow detail/historyAPI/service: Run history endpointData/integration: WorkflowRunStack: React, Express, Prisma | Run status, timestamp, and useful failure information are persisted and visible. |
| FR-WF-04 | Duplicate prevention | UI: No special UI; run/action state visibleAPI/service: Idempotency/locking logicData/integration: Unique event/run/action keysStack: Prisma, Supabase Database | Repeated delivery/scheduler/manual invocation does not duplicate the same logical action. |
| FR-WF-05 | Safe messaging automation | UI: Workflow configuration warningsAPI/service: Authorization/consent checks and email pathData/integration: Workflow config and communicationsStack: Express, Zod, Resend | Automatic send remains disabled unless explicit authorized conditions are met. |
| FR-RET-01 | Segments | UI: Customer badges/filterAPI/service: Segment serviceData/integration: Customer and order recordsStack: Express, Prisma | Segment thresholds and precedence are centralized and consistent. |
| FR-RET-02 | Metrics | UI: Dashboard/retention cardsAPI/service: Analytics endpoints/servicesData/integration: Orders, customers, tasksStack: React, Express, Prisma | Metric definitions match stored records and documented qualifying-status rules. |
| FR-RET-03 | Charts/date range | UI: Retention charts/period selectorAPI/service: Range-aware aggregation endpointData/integration: Orders/customer/task recordsStack: React chart library, Express, Prisma | Changing range changes actual aggregation; no hardcoded chart arrays. |
| FR-RET-04 | Insight actions | UI: Links/actions from chart or segment listAPI/service: Filtered customer query/task endpointData/integration: Customers and tasksStack: React Router, Express, Prisma | Navigation opens the relevant filtered records or valid action form. |
| FR-RET-05 | Honest metrics | UI: Labels, empty states, definitionsAPI/service: Metric serviceData/integration: Source data with timestamps/currencyStack: React, Express, Prisma | Unsupported metrics are omitted or explained; no profit claims based on order totals. |
| FR-AGT-01 | Evidence-based recommendations | UI: Agent recommendation viewAPI/service: Deterministic rule/evidence serviceData/integration: Customers, orders, tasks, communicationStack: Express, Prisma | Facts and inferences are distinguishable and trace to existing records/rules. |
| FR-AGT-02 | Prefill/create task | UI: Prefilled task form and confirmationAPI/service: Task creation endpointData/integration: TaskStack: React, Express, Zod, Prisma | Confirming creates a real persisted task; generating a suggestion alone does not. |
| FR-AGT-03 | Draft email | UI: Draft action, preview, approvalAPI/service: Template/send workflowData/integration: EmailTemplate, CommunicationStack: React, Express, Resend | Draft enters the normal preview path and is not sent without required approval. |
| FR-AGT-04 | No fabricated AI | UI: Agent explanation/capability copyAPI/service: Rules-based service unless provider is configuredData/integration: Existing CRM recordsStack: Node.js, Express, Prisma | UI does not claim an unconfigured AI model or unsupported predictive capability. |
| FR-DASH-01 | Dashboard metrics and activity | UI: Dashboard pageAPI/service: Dashboard aggregation endpointData/integration: Customer/order/task/activity recordsStack: React, Express, Prisma | Values are derived from actual records and navigable where appropriate. |
| FR-AUTH-01 | Login/session/logout | UI: Login form/account controlsAPI/service: Auth/session endpointsData/integration: User/session data in Supabase where app-managed auth is usedStack: React, Express, password hashing/session mechanism, Prisma | Bad credentials fail; valid login establishes session; logout invalidates it. |
| FR-AUTH-02 | Authorization and CSRF | UI: Protected views and mutation callsAPI/service: Auth middleware + CSRF verificationData/integration: Session/role dataStack: Express, cookies, CSRF mechanism | Unauthenticated/unauthorized writes are rejected; webhook routes use signature verification instead. |
| FR-AUTH-03 | First admin provisioning | UI: Documented CLI commandAPI/service: Provisioning scriptData/integration: User recordStack: Node.js, Prisma, Supabase Database | Command creates account from environment values without hardcoded production credentials. |
| FR-CONF-01 | Secure integration settings | UI: Status/settings UI without exposed secretsAPI/service: Backend environment configurationData/integration: Environment/deployment configurationStack: Node.js, Supabase connection strings, provider secrets | Secrets are not present in frontend bundles or API responses. |
| FR-UI-01 | Brand and responsive UI | UI: Shared layout/theme/componentsAPI/service: Frontend build/styling configurationData/integration: Not applicableStack: Tailwind CSS, shadcn/ui, React | Actual pages use exact core palette and adapt to supported viewport sizes. |
| NFR-SEC-01 | Security baseline | UI: Safe UI/error statesAPI/service: Validation, authorization, signature, session and secret boundariesData/integration: Protected data and event recordsStack: Express, Zod, Supabase, Prisma | No secret exposure; protected mutations and inbound webhook verification follow policy. |
| NFR-DATA-01 | Data integrity | UI: Consistent related screensAPI/service: Transactions and idempotent servicesData/integration: Constraints, foreign keys, unique keysStack: Prisma, Supabase Database | Repeated operations do not create duplicate identities/events/actions. |
| NFR-UX-01 | Usability | UI: Forms, responsive pages, empty/errorsAPI/service: Consistent API error contractsData/integration: Not applicableStack: React, Tailwind, shadcn/ui | Actions have clear labels, confirmations, and accurate outcomes. |
| NFR-A11Y-01 | Accessibility | UI: Controls, labels, focus statesAPI/service: Accessible component usageData/integration: Not applicableStack: shadcn/ui, Tailwind, React | Keyboard and focus states work; inputs have labels and status is understandable. |
| NFR-PERF-01 | Bounded data access | UI: Paginated tables/filtersAPI/service: Limited queries and remote API paginationData/integration: Indexes for search/filter use casesStack: Express, Prisma, Supabase | List endpoints do not return unbounded full tables; sync respects API pagination/limits. |
| NFR-MAINT-01 | Maintainability | UI: Reusable UI componentsAPI/service: Modular controllers and servicesData/integration: Clear schema/migrationsStack: JavaScript, Express, Prisma | Business logic is not duplicated across pages or route handlers. |
| NFR-OBS-01 | Operational status | UI: Connection/sync/workflow/email feedbackAPI/service: Structured and sanitized application errorsData/integration: Sync/run/webhook/provider outcome dataStack: Express, Prisma, Supabase | Users can distinguish success, failure, pending, and not configured without seeing secrets. |
| NFR-DEP-01 | Reproducible setup | UI: README instructionsAPI/service: Startup scripts and environment loadingData/integration: Committed Prisma migrationsStack: npm, Prisma, Supabase | Fresh setup has exact documented commands and committed schema migration artifacts. |



# 7. Integration configuration inventory



| Configuration item | Purpose | Handling / notes |
| --- | --- | --- |
| Supabase connection string | Prisma runtime database access. | Store in backend environment only. Use the connection mode selected for the hosting environment; do not construct endpoint values manually. |
| Migration connection string (if applicable) | Prisma migration commands and schema changes. | Use a migration-capable connection appropriate to the configured Prisma version. Often separated from the pooled runtime URL. |
| WooCommerce store URL | Base URL for REST API and webhook endpoint setup. | Server-side configuration; require HTTPS for deployed integrations. |
| WooCommerce consumer key and secret | Authenticate REST API requests. | Server-side secrets; never return to frontend. |
| WooCommerce webhook secret | Verify inbound WooCommerce webhook signatures. | Must match the secret configured for the webhook in WooCommerce. |
| Resend API key and sender | Send approved transactional email. | Provider account/sender configuration must be completed outside the source code. |
| Resend webhook signing secret | Verify delivery-event webhooks. | Use the current provider-specified verification procedure and configured endpoint. |
| Application session/auth settings | Configure cookies, session expiry, and secure deployment behavior. | Document actual environment variable names from the final code. Do not invent names until code configuration is inspected. |
| Public webhook base URL | Allows WooCommerce/Resend to reach webhook routes. | Local development may require a public tunnel; use the real deployed URL in the provider dashboard. |



# 8. Environment variable conventions

The names below are conventions to consider, not a claim that every name is already used by the current archive. Final documentation must match the variable names actually read by the application.


| Variable / group | Expected role | Required status |
| --- | --- | --- |
| DATABASE_URL | Supabase database connection used by the application/Prisma runtime. | Required if used by the selected Prisma configuration. |
| DIRECT_URL | Direct/migration-capable connection when needed by the selected Prisma version/configuration. | Conditional; document the exact setup used. |
| WOO_URL | WooCommerce store URL. | Required for live sync. |
| WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET | WooCommerce REST API credentials. | Required for live sync. |
| WOO_WEBHOOK_SECRET | WooCommerce signature verification. | Required to accept configured WooCommerce webhooks. |
| RESEND_API_KEY / EMAIL_FROM | Email delivery credentials and configured sender. | Required to send through Resend. |
| RESEND_WEBHOOK_SECRET | Resend delivery-event verification. | Required for verified delivery callbacks. |
| ADMIN_EMAIL / ADMIN_PASSWORD | Initial administrator provisioning input, if the CLI uses these names. | Used only by the provisioning command; never commit values. |
| Session / CSRF / CORS settings | Session security, allowed origins, cookie policy, and CSRF setup if configurable. | Document actual code-supported names. |



# 9. Deployment and migration notes

The backend should create one reusable Prisma client instance, not create a new client for every request.
Use Supabase dashboard-provided connection strings. Supabase offers direct and pooled modes with environment-specific constraints; the runtime and migration paths must match the app host and Prisma version.
Prisma migrations must be committed and reproducible. Do not require an existing production database merely to provide the initial SQL migration artifact.
Never expose Supabase database credentials, WooCommerce consumer secrets, Resend API keys, or session secrets as frontend environment variables.
Use HTTPS and secure cookie settings in deployed environments; local development behavior may need a documented setting for localhost.
Webhook endpoints need externally reachable HTTPS URLs in production; local development requires a suitable publicly reachable tunnel or deployed backend.
Workflow scheduler operation must be explicit: document how it starts, what interval/configuration it uses, and how it avoids concurrent duplicate runs.
No live credentials or successful external-service connection is implied by this document.

# 10. Acceptance evidence mapping



| Evidence class | What should be inspectable |
| --- | --- |
| Frontend evidence | Real pages, wired controls, loading/empty/error/success states, responsive styling, accurate navigation, and no dummy actions. |
| API evidence | Named endpoints, Zod validation on inputs, authentication/authorization middleware, controlled error responses, and consistent response contracts. |
| Database evidence | Final Prisma schema, migration SQL and metadata, unique identifiers, foreign keys, and persisted feature records. |
| Integration evidence | Actual WooCommerce request/sync code, raw-body signature validation, Resend send code, provider webhook validation, and honest status handling. |
| Workflow evidence | Persisted workflow definitions and run history, explicit conditions/actions, scheduler/manual execution path, and idempotency constraints. |
| Documentation evidence | Environment template, Supabase setup notes, exact install/migration/admin/startup commands, webhook configuration, and disclosed limitations. |



# 11. Decisions and traceability maintenance

When requirements change, update the PRD requirement ID and the corresponding row in this matrix. If a requirement is deferred or cannot be implemented because of a real external dependency, record the reason and the affected requirement IDs. Do not mark a requirement complete solely because a page, endpoint name, or schema model exists.


| Open decision | Affected requirements | Resolution needed |
| --- | --- | --- |
| Segment thresholds, precedence, qualifying order states | FR-RET-01 to FR-RET-05, FR-DASH-01, FR-WF-02 | Agree on definitions and centralize them in configuration. |
| Authentication provider | FR-AUTH-01 to FR-AUTH-03, NFR-SEC-01 | Confirm whether application-managed sessions remain or Supabase Auth is adopted. |
| Prisma version and connection mode | NFR-DEP-01, database setup | Inspect actual package versions and deployment topology, then align runtime and migration URLs. |
| Workflow scheduler environment | FR-WF-01 to FR-WF-05 | Choose scheduler process/runtime and document its operation. |
| Automatic messaging permissions | FR-COM-04, FR-WF-05, FR-AGT-03 | Confirm consent/authorization policy; default remains manual approval. |
| Business targets and time zone | FR-RET-02 to FR-RET-05 | Define metric targets and date/time rules when product owner input is available. |

