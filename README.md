# Consulting Platform — EECS 3311 Project

A backend REST API for a consulting booking platform built with Spring Boot and PostgreSQL. Clients can browse services, book sessions, and make payments. Consultants can accept, reject, or complete bookings. Admins manage consultant approvals and system policies.

**GitHub Repository:** https://github.com/bhanuRakshita/EECS-3311-Project

---

## Architecture Overview

The application follows a **layered, package-by-feature architecture**:

```
com.consultingplatform
├── user/           # User management — Client, Consultant, Admin (inheritance)
├── consultant/     # Consulting services, availability slots, booking decisions
├── booking/        # Booking lifecycle and state machine
├── payment/        # Payment processing, payment methods, payment history
└── admin/          # Consultant approval, system policy management
```

Each package is internally organized into:
- `domain/` — JPA entities and enums
- `repository/` — Spring Data JPA interfaces
- `service/` — Business logic (interface + implementation)
- `web/` — REST controllers and DTOs

**Project layout:**
- `backend/` — Spring Boot application (API, business logic, persistence)
- `frontend/` — Static demo UI (`index.html`) for exercising all API flows
- `diagrams/` — UML and design diagrams

**Tech Stack:** Java 17, Spring Boot 4.0.3, Spring Data JPA, PostgreSQL, Lombok

**High-level flow:**
1. Consultants create services and availability slots
2. Clients browse services and create bookings from available slots
3. Consultants accept or reject bookings
4. Confirmed bookings can be paid through the payment module
5. After payment, consultants mark sessions as complete

---

## Design Patterns

### 1. State Pattern — Booking Lifecycle

**Location:** `backend/src/main/java/com/consultingplatform/booking/state/`

The `BookingState` interface defines all valid booking transitions: `accept`, `reject`, `cancel`, `processPayment`, and `complete`. Each concrete state class enforces which transitions are legal, throwing an exception for invalid ones.

```
BookingState (interface)
├── RequestedState   — allows: accept, reject, cancel
├── ConfirmedState   — allows: processPayment, cancel
├── PaidState        — allows: complete
├── RejectedState    — terminal state
├── CancelledState   — terminal state
└── CompletedState   — terminal state
```

**Normal flow:** `REQUESTED → CONFIRMED → PAID → COMPLETED`
**Alternate paths:** `REQUESTED → REJECTED`, any non-terminal state → `CANCELLED`

This eliminates conditional transition logic from the service layer. Each state is responsible for its own allowed actions.

---

### 2. Strategy Pattern — Payment Processing

**Location:** `backend/src/main/java/com/consultingplatform/payment/domain/`

The `PaymentStrategy` interface defines: `validatePaymentDetails()`, `processPayment(amount)`, and `getPaymentType()`. Each payment method is a concrete strategy with its own validation and processing logic.

```
PaymentStrategy (interface)
├── CreditCardPayment
├── DebitCardPayment
├── PayPalPayment
└── BankTransferPayment
```

`PaymentService` selects the correct strategy at runtime based on the `paymentType` field in the incoming request. Adding a new payment method only requires implementing the interface — no changes to the service.

---

### 3. Factory Pattern — Booking State Creation

**Location:** `backend/src/main/java/com/consultingplatform/booking/state/BookingStateFactory.java`

`BookingStateFactory` provides a static `createState(String status)` method that maps a booking status string to the correct concrete `BookingState` object. This centralizes object creation and decouples the service layer from concrete state classes.

```
"REQUESTED" → new RequestedState()
"CONFIRMED" → new ConfirmedState()
"PAID"      → new PaidState()
"COMPLETED" → new CompletedState()
"CANCELLED" → new CancelledState()
"REJECTED"  → new RejectedState()
```

When a booking is loaded from the database, its status string is passed to the factory to reconstruct the correct state object, without any `if/else` chains in the service layer.

---

## How to Run

### Prerequisites

- Java 17+
- Maven 3.8+
- A PostgreSQL database with the schema from `backend/docs/consulting_db_schema.sql`

### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/bhanuRakshita/EECS-3311-Project.git
   cd EECS-3311-Project/backend
   ```

2. **Set the required environment variables:**

   ```bash
   export SPRING_DATASOURCE_URL=jdbc:postgresql://<host>/<database>?sslmode=require
   export SPRING_DATASOURCE_USERNAME=<username>
   export SPRING_DATASOURCE_PASSWORD=<password>
   export SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
   export SPRING_JPA_HIBERNATE_DDL_AUTO=update
   ```

3. **Build and run:**

   ```bash
   mvn spring-boot:run
   ```

   The backend starts at `http://localhost:8080`.

### Option 2: Docker Compose (no external database required)

**Prerequisites:** Docker Desktop installed and running.

1. From the project root, start both the database and backend:

   ```bash
   docker compose --profile localdb up --build
   ```

2. The backend starts at `http://localhost:8080`.
   Database: `consulting_db`, user: `admin`, password: `changeme`.

3. To stop:

   ```bash
   docker compose --profile localdb down
   ```

4. To stop and delete the database volume:

   ```bash
   docker compose --profile localdb down -v
   ```

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/services` | List all consulting services |
| GET | `/api/consultant/{id}/availability` | Get available slots for a consultant |
| POST | `/bookings` | Create a booking `{ clientId, slotId }` |
| GET | `/bookings/{id}` | Get booking by ID |
| PUT | `/bookings/{id}/cancel` | Client cancels a booking |
| PUT | `/api/consultant/{cid}/bookings/{bid}/accept` | Consultant accepts |
| PUT | `/api/consultant/{cid}/bookings/{bid}/reject` | Consultant rejects |
| PUT | `/api/consultant/{cid}/bookings/{bid}/complete` | Consultant completes |
| POST | `/api/payments/process` | Process a payment |
| GET | `/api/payments/client/{id}/history` | Client payment history |
| GET | `/users` | List all users |
| POST | `/users` | Create a user `{ role, firstName, lastName, email, ... }` |

---

## Team Member Contributions

Contributions are visible from the Git commit history (`git log --oneline --all`).

| Member | Commits | Primary Contributions |
|--------|---------|-----------------------|
| **Bhanu Rakshita Paul** | 31 | Project lead. User module with JPA inheritance (`Client`, `Consultant`, `Admin`). Admin module (consultant approval, system policies). Booking module refactoring and endpoint cleanup. Database schema design and migrations.  |
| **Vansh Bhasin** | 30 |  Consultant availability slot management. Booking–payment integration. Docker and environment configuration. `ConsultingService` package refactoring. |
| **Rudra (RD-1205)** | 7 | Payment module implementing Strategy Pattern (`CreditCardPayment`, `DebitCardPayment`, `PayPalPayment`, `BankTransferPayment`). End-to-end integration testing and seed data.PR reviews and merges. |
