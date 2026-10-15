PRODUCT SPECIFICATION SERIES
WooCommerce CRM
Product Requirements Document (PRD)


|  |  |  |
| --- | --- | --- |




| Document type | Product requirements |
| --- | --- |
| Version | 1.0 - Draft baseline |
| Date | 15 October 2026 |
| Product | WooCommerce CRM |
| Database platform | Supabase Database (managed PostgreSQL) |
| Scope note | Defines product behavior, scope, users, requirements, and acceptance criteria. |


Document status: Requirements baseline for review. This document describes the intended product; it does not certify the current source code as complete or verified.

# Document control



| Field | Value |
| --- | --- |
| Document purpose | Define the intended capabilities and boundaries of the WooCommerce CRM. |
| Version | 1.0 - Draft baseline |
| Status | Draft for review; product-specific thresholds and deployment choices remain to be confirmed. |
| Source of requirements | Requirements provided in the project conversation and reported implementation gaps. |
| Database platform terminology | Supabase Database, which provides a managed PostgreSQL database. Prisma remains the ORM. |



# Contents at a glance

1. Executive summary and product goals
2. Users, scope, and exclusions
3. Functional requirements by module
4. System behavior and key flows
5. Data, integrations, and security requirements
6. Non-functional requirements and acceptance criteria
7. Assumptions, open decisions, and references

# 1. Executive summary

The WooCommerce CRM is a web application that centralizes customer context, synchronized order history, customer notes, communication records, follow-up tasks, retention insights, and evidence-based recommendations. It connects to a WooCommerce store through REST API v3 and webhooks and uses a transactional email provider for approved customer communications.
The product is intended to help an authenticated business user understand customer activity, organize follow-ups, and act on customer-retention opportunities from one interface. It is a CRM application, not an online store or order-management console.


| Database decision: Use Supabase as the database platform. Supabase provides a managed PostgreSQL database; Prisma ORM connects the Node.js backend to that database. Do not describe Supabase as a different relational database engine. |
| --- |



## 1.1 Problem statement

Customer information, WooCommerce orders, communication activity, and follow-up work can be difficult to review together when they are spread across separate tools. The CRM aims to put the relevant records and actions in one place while preserving WooCommerce as the source of truth for commerce-managed customer and order fields.

## 1.2 Product goals

Provide one searchable view of customers and their relevant order and communication history.
Keep customer and order data synchronized from WooCommerce without creating duplicate records during repeated imports or webhook delivery.
Help users record customer context and manage follow-up tasks.
Support reviewed, traceable email communication through a transactional email provider.
Surface explainable customer segments and retention insights from recorded data.
Offer evidence-based CRM recommendations and controlled actions without inventing facts or claiming unsupported AI capabilities.
Provide a polished, responsive, accessible interface using the agreed brand colors.

## 1.3 Success measures

The product should expose observable measures such as synchronization outcomes, number of linked customer/order records, workflow execution outcomes, email delivery states where supplied by the provider, task completion, and availability of usable retention metrics. Numeric targets are not defined in the available requirements and must be agreed separately; this PRD does not invent targets.

# 2. Users, roles, and scope


## 2.1 User roles



| Role | Intended responsibilities |
| --- | --- |
| Authenticated CRM user | View customer and order information, maintain CRM notes and tasks, review insights, prepare communication, and use permitted agent actions. |
| Administrator | Perform administrator-restricted configuration and synchronization operations, manage email templates and workflows, and administer access as implemented. |


The exact user-role matrix beyond administrator-restricted actions has not been supplied. The implementation must enforce permissions on the backend and document the role rules it actually supports.

## 2.2 In scope

Customer data management: list, search, filter, sort, profile, CRM-only contact creation/editing, notes, and related activity.
WooCommerce customer/order synchronization, status visibility, order detail view, and webhook-driven updates.
Communication history, template management, email preview and approval, sending, and provider-reported delivery outcomes.
Follow-up tasks and reminders linked to customers.
Rule-based workflow configuration and execution, with persistent execution history and duplicate-action prevention.
Customer segmentation, dashboard metrics, retention charts, and navigable insights.
A deterministic CRM Action Agent that explains evidence and routes approved actions through normal task/email flows.
Authentication, authorization, validation, safe configuration, and setup documentation.

## 2.3 Out of scope

E-commerce storefront, checkout, payments, refunds, inventory, and product catalog administration.
Creating, editing, cancelling, or refunding WooCommerce orders from the CRM.
Unconfigured AI-model integration or claims of predictive accuracy without an implemented model.
Automatic outbound email by default; user approval remains the baseline unless an authorized workflow is explicitly configured.
Customer merging based only on matching names.

# 3. Functional requirements

The identifiers below are normative requirement IDs for implementation and traceability. Acceptance statements define observable product behavior; they do not imply that the current code has already met them.

## 3.1 Customer Data Management



| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-CUS-01 | Customer list and discovery | List comes from persisted records; search supports available name, email, and phone fields; filters, sorting, and pagination affect the displayed result set. |
| FR-CUS-02 | Customer profile | Profile shows supported contact fields, linked orders, order summary, segment, notes, tasks, and communication history. Missing fields are handled gracefully. |
| FR-CUS-03 | CRM-only contact management | Authorized users can create and edit CRM-managed contact data; changes persist after reload. |
| FR-CUS-04 | WooCommerce-owned fields | WooCommerce-sourced customer fields are identified and protected from unintended local edits. |
| FR-CUS-05 | Notes | Users can add, edit, and delete notes according to permissions; notes are timestamped and linked to the correct customer. |
| FR-CUS-06 | Identity and duplicates | Link by stable WooCommerce identifiers when available; normalized email can support cautious matching; name similarity alone never triggers automatic merging. |



## 3.2 WooCommerce Order Tracking and Sync



| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-ORD-01 | Order list | Displays persisted synced orders with identifiers, customer association where known, date, status, total, currency, and relevant item summary. |
| FR-ORD-02 | Order search and filtering | Search, status filter, date-range filter, sorting, and pagination work on actual records. |
| FR-ORD-03 | Order detail | Shows available order details, line items, quantities, totals, currency, relevant billing fields, and a customer link where applicable. |
| FR-SYNC-01 | Initial/manual synchronization | Uses REST API v3 pagination and stable external identifiers; repeat sync updates records rather than duplicating them. |
| FR-SYNC-02 | Synchronization status | Shows honest connection and sync states, last successful sync where available, and understandable errors. |
| FR-SYNC-03 | Webhook synchronization | Verifies WooCommerce signatures against the raw request body, validates payloads, handles repeats idempotently, and updates applicable records. |
| FR-ORD-04 | Order authority | WooCommerce-sourced order records are read-only in the CRM; no order mutations or payment operations are in scope. |



## 3.3 Communication, templates, and tasks



| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-COM-01 | Communication timeline | Customer profile displays timestamped communication records with the actual known status and associated provider message ID where available. |
| FR-COM-02 | Template management | Authorized users can create, view, edit, delete, and preview saved templates stored in Supabase. |
| FR-COM-03 | Template placeholders | Only documented placeholders are accepted. The current baseline supports {{name}} and {{email}}; unsupported placeholders are rejected or clearly flagged. |
| FR-COM-04 | Approved sending flow | User selects customer/template, previews, confirms, sends through Resend or configured provider, and sees the actual result. |
| FR-COM-05 | Delivery events | Verified provider webhooks update message status idempotently. Provider acceptance is not mislabeled as delivery. |
| FR-TASK-01 | Follow-up tasks | Users can create, edit as supported, complete, and view tasks with customer association, due date, status, and persistence. |
| FR-TASK-02 | Task visibility | Pending, completed, and overdue tasks are accessible from the task page and related customer profile. |



## 3.4 Workflow automation



| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-WF-01 | Workflow configuration | Authorized administrators can view, create, edit, enable, disable, and delete supported workflow rules. |
| FR-WF-02 | Supported triggers and actions | Rules use documented conditions and implemented actions, such as identifying inactive customers or creating follow-up tasks. |
| FR-WF-03 | Execution history | Each execution records its outcome, time, and useful error/status information. |
| FR-WF-04 | Safe repeated execution | Repeated events, scheduler runs, or manual triggers do not create duplicate tasks/actions for the same logical trigger. |
| FR-WF-05 | Outbound communication safety | Automated email remains disabled by default and requires explicit authorized configuration and applicable consent. |



## 3.5 Retention & Insights



| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-RET-01 | Customer segments | Provides New, Repeat, Loyal, and Inactive segments using documented configurable rules and consistent precedence. |
| FR-RET-02 | Metrics | Displays defined metrics such as customer counts, synced orders, purchase frequency, average order value, and task counts where source data supports them. |
| FR-RET-03 | Charts and time range | Charts use actual calculated records and respond to the selected date range. |
| FR-RET-04 | Actionable insight navigation | Selecting an insight can navigate to the relevant customer list/profile or appropriate task action. |
| FR-RET-05 | Honest metrics | Empty or incomplete source data is disclosed; order value is not described as profit or accounting revenue. |



## 3.6 CRM Action Agent



| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-AGT-01 | Evidence-based recommendations | Recommendations cite relevant stored customer/order/task facts and distinguish facts from rule-based inferences. |
| FR-AGT-02 | Task action | Prefill task action opens an editable form; confirmed creation saves a task through the backend and reports the real outcome. |
| FR-AGT-03 | Email draft action | Draft email opens the existing preview and explicit approval workflow; no email is sent merely by generating a draft. |
| FR-AGT-04 | Bounded capability | Without an explicitly configured AI provider, the agent remains a deterministic rules-based assistant and does not claim to use an AI model. |



## 3.7 Dashboard, authentication, and configuration



| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-DASH-01 | Dashboard | Metrics, recent orders, recent CRM activity, tasks, and integration state come from actual stored or synchronized data. |
| FR-AUTH-01 | Authentication | Login verifies a stored password hash and establishes a server-validated session; logout invalidates it. |
| FR-AUTH-02 | Authorization and CSRF | Protected API routes enforce user permissions. State-changing browser requests use a consistent CSRF-protection mechanism. |
| FR-AUTH-03 | Admin provisioning | The project documents and provides a safe first-administrator provisioning command; credentials are not hardcoded. |
| FR-CONF-01 | Integration configuration | Required keys/URLs are loaded from server environment configuration and are never returned to the browser. |
| FR-UI-01 | Brand and responsive UI | The application uses #F2F2F2, #111844, and #4B5694 as its core palette and adapts to desktop, tablet, and mobile layouts. |



# 4. Key system flows


## 4.1 WooCommerce synchronization

1.  An authorized user triggers a sync or the system receives a supported WooCommerce webhook.
2.  The backend checks configuration and validates the request; webhooks must pass signature verification before their payload is trusted.
3.  REST responses are paginated. Records are upserted using stable WooCommerce identifiers, and webhook handlers record an idempotency key before applying a duplicate-sensitive action.
4.  The database state and synchronization outcome are updated. Errors are recorded and exposed as understandable status without leaking secrets.
5.  The frontend refreshes the visible customer/order information and displays the actual outcome.

## 4.2 Email communication

1.  The user chooses a customer and saved template or writes a message.
2.  The backend validates inputs and supported placeholders; the UI previews the rendered content.
3.  The user explicitly approves sending. The backend calls the configured transactional email provider.
4.  The attempt and provider response are persisted. Provider webhooks, after signature verification, may update delivery status idempotently.
5.  The UI distinguishes draft, attempt, accepted, delivered, failed, bounced, or complaint states only when supported by recorded evidence.

## 4.3 Workflow execution and agent action

Workflow rules evaluate defined conditions against persisted CRM data. Execution records and idempotency safeguards prevent repeat runs from duplicating actions. The CRM Action Agent is evidence-based; it may prefill a task or draft an email, but creation/sending still goes through normal authorized backend flows. Email automation is disabled by default.

# 5. Data requirements



| Entity / data group | Purpose and core rules |
| --- | --- |
| Customer | Customer contact fields and CRM-managed fields; maintain a clear distinction from WooCommerce-sourced values. |
| WooCommerce identity | External customer ID and source mapping where needed; enforce uniqueness for external identifiers. |
| Order and line item | Synchronized order header and relevant line-item information; WooCommerce is authoritative for order data. |
| Customer note | Customer-linked CRM note with creation/update metadata and permission-controlled changes. |
| Task | Customer-linked follow-up, due date, state, and completion metadata. |
| Communication and template | Provider identifiers, content metadata, timestamps, and actual message status; templates allow only defined placeholders. |
| Workflow and workflow run | Rule definition, enabled state, execution status, timestamps, and idempotency information. |
| Webhook event and sync state | Source, event identifier/deduplication key, processing outcome, and synchronization checkpoints. |
| User and session | Authentication identity, password hash/session metadata if retaining application-managed authentication, and authorization role. |



# 6. Non-functional requirements



| ID | Quality attribute | Requirement |
| --- | --- | --- |
| NFR-SEC-01 | Security | Keep integration secrets server-side; hash passwords; protect sessions and state-changing requests; verify signed webhooks; do not expose stack traces or credentials. |
| NFR-DATA-01 | Integrity | Use unique constraints, foreign keys, transactions where appropriate, and idempotent webhook/workflow processing. |
| NFR-UX-01 | Usability | Use consistent navigation, descriptive labels, inline validation, meaningful empty/error states, confirmation for consequential operations, and responsive layouts. |
| NFR-A11Y-01 | Accessibility | Provide keyboard access, visible focus states, labeled fields, readable contrast, and semantic controls. |
| NFR-PERF-01 | Data scale | Paginate large data sets, limit queries, avoid fetching every record for one view, and handle remote API pagination and rate limits. |
| NFR-MAINT-01 | Maintainability | Use modular JavaScript, clear responsibilities, descriptive naming, focused functions, and meaningful comments for non-obvious behavior. |
| NFR-OBS-01 | Operability | Expose connection/sync/workflow/email outcomes, record actionable errors without leaking personal or secret data, and document configuration. |
| NFR-DEP-01 | Deployment | Provide reproducible dependencies, environment templates, Supabase database setup guidance, Prisma migrations, administrator provisioning, and startup commands. |



# 7. Product constraints and assumptions



| Important distinction: This is a requirements baseline. It does not assert that the current ZIP already implements every item or that any integration has been run against live services. |
| --- |


Supabase: The database platform is Supabase. Its managed database is PostgreSQL; Prisma remains the ORM. A decision to use Supabase Auth, Storage, Realtime, or Data API directly has not been confirmed and is not assumed by this baseline.
Database connectivity: The deployment must use a Supabase-provided connection string appropriate to the environment. Direct and pooled connections have different constraints; migration connectivity and runtime connectivity must be configured for the selected Prisma version and deployment.
WooCommerce: A store URL, API credentials, webhook secret, public webhook endpoint, and suitable webhook configuration are external prerequisites.
Email: Resend is the preferred initial provider, subject to credentials, a configured sender, and webhook setup. An alternative requires explicit configuration.
AI: No AI provider is specified. The baseline agent is deterministic and rules-based.
Thresholds: Inactivity and loyalty thresholds, qualifying order states, time-zone policy, and segment precedence need an explicit product decision. They must be configurable/documented rather than silently invented.
Authentication: The recent implementation reported server-side sessions stored in the database. Whether to migrate authentication to Supabase Auth is an open architectural decision; the baseline requires secure, backend-enforced authentication regardless of provider.
Performance targets: No specific service-level, throughput, or latency targets have been supplied. Pagination and bounded queries are baseline requirements; numeric targets remain to be agreed.

# 8. Open decisions requiring confirmation



| Decision | Why it matters | Current handling |
| --- | --- | --- |
| Segment definitions and thresholds | Changes which customers are classified as new/repeat/loyal/inactive. | Centralize rules; document defaults only after they are agreed. |
| Qualifying WooCommerce order statuses | Affects purchase counts, average order value, and retention calculations. | Use an explicit configurable/documented status set; do not infer silently. |
| Authentication provider | Determines whether current application-managed sessions remain or Supabase Auth is adopted. | Keep secure login as a requirement; provider choice remains open. |
| Deployment environment | Determines Supabase direct/pooler connection strings, cookie flags, public webhook URL, and scheduler operation. | Document chosen deployment values during setup. |
| Automatic messaging policy | Determines if and when workflows can send customer emails without manual approval. | Disabled by default; explicit authorization and consent required. |

