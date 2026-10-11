# TicketHub: Event Ticketing System Design

## 1. Requirements

### 1.1 Context

TicketHub is a website where users can discover concerts and events, view available seats, purchase tickets, and view their bookings.

The system must support 2 million registered users. It must handle normal daily traffic efficiently and remain reliable when a popular concert goes on sale and hundreds of thousands of people attempt to purchase tickets simultaneously.

### 1.2 Functional Requirements

The system must allow users to:

1. Register, sign in, and manage their accounts.
2. Browse upcoming events and search for concerts.
3. View event details, prices, and available seats.
4. Temporarily hold an available seat while completing checkout.
5. Pay for a reservation using a payment provider.
6. Receive confirmation after a successful purchase.
7. View their purchased tickets and order history.
8. Release expired seat holds so other customers can purchase those seats.

### 1.3 Non-Functional Requirements

**Performance:** Event listings and ordinary pages should load within approximately 300 milliseconds under normal conditions, excluding unusually slow networks and external services. Seat availability and checkout may take longer during a major sale, but the system should provide clear progress and status messages.

**Correctness:** A seat must never be sold to two customers. Purchases must be recorded consistently, and a failed payment must not result in a confirmed ticket.

**Fairness:** Customers should receive consistent access to the sale. A waiting room should control the rate at which customers enter the purchasing process. The system should avoid allowing repeated requests to overwhelm customers who are waiting their turn.

**Availability:** Event browsing should remain available even if the purchasing system is temporarily overloaded. The system should recover gracefully from failures.

**Security:** Users must only access their own orders and tickets. Payment information must be handled by a trusted payment provider, and sensitive information must be protected in transit and at rest.

**Scalability:** The system must support 2 million registered users and handle a sudden increase in traffic during popular ticket sales.

**Data consistency:** Seat reservations, payments, orders, and ticket issuance must be coordinated so that customers do not receive duplicate tickets or lose valid bookings.

## 2. Traffic and Capacity Estimates

### 2.1 Given Information

* Registered users: 2,000,000
* Normal daily visitors: 50,000
* Average pages viewed per visitor: 10
* Tickets sold on a normal day: 5,000
* Visitors attempting to buy tickets during a major sale: 200,000 in 10 minutes
* Seats available for the major sale: 20,000

These calculations are estimates for planning purposes, not measured production traffic.

### 2.2 Normal Traffic

**Daily page views**

50,000 visitors × 10 pages = 500,000 page views per day.

**Average page requests per second**

500,000 ÷ 86,400 seconds ≈ 5.8 page requests per second.

This is an average. Actual traffic will fluctuate throughout the day.

**Average ticket sales**

5,000 tickets ÷ 86,400 seconds ≈ 0.058 tickets per second.

Ticket sales are not evenly distributed throughout the day, so the actual checkout rate may be much higher during busy periods.

### 2.3 Major Sale Traffic

**Potential buyers arriving per second**

200,000 people ÷ 600 seconds ≈ 333 people per second.

**Demand compared with supply**

200,000 potential buyers ÷ 20,000 available seats = 10 potential buyers per seat.

There are ten potential buyers for every available seat if all 200,000 people attempt to buy during the sale.

Even if each visitor makes only five requests during the purchasing process, the system could receive approximately:

333 visitors per second × 5 requests = 1,665 requests per second.

This is an illustrative estimate. Real request rates depend on how many requests each visitor makes and how many requests the client retries.

### 2.4 Comparison

| Metric                           |                     Normal day |                                                                Major sale |
| -------------------------------- | -----------------------------: | ------------------------------------------------------------------------: |
| Visitors                         |                 50,000 per day |                                                     200,000 in 10 minutes |
| Page views or assumed requests   |     500,000 page views per day | Approximately 1,665 requests per second under the five-request assumption |
| Approximate average arrival rate |   5.8 page requests per second |                                          333 arriving visitors per second |
| Tickets available or sold        |     5,000 tickets sold per day |                                                    20,000 seats available |
| Main concern                     | Efficient everyday performance |                         Overload, fairness, and preventing double-booking |

The major sale creates a sudden burst of traffic. The system must protect the database from excessive requests and carefully control seat reservations.

## 3. API Design

TicketHub will expose a REST API using JSON. HTTPS will protect communication between clients and the service.

### 3.1 Browse Events

**GET /api/events**

Returns a paginated list of upcoming events.

Example response:

```json
{
  "events": [
    {
      "id": "event-101",
      "name": "Summer Music Festival",
      "date": "2027-06-20",
      "venue": "City Arena"
    }
  ],
  "page": 1
}
```

### 3.2 View an Event's Seats

**GET /api/events/{eventId}/seats**

Returns the seat map and the current availability information for an event.

Example response:

```json
{
  "eventId": "event-101",
  "seats": [
    {
      "id": "seat-501",
      "label": "A12",
      "status": "AVAILABLE"
    },
    {
      "id": "seat-502",
      "label": "A13",
      "status": "HELD"
    }
  ]
}
```

Seat availability may change immediately after the response is generated. The database must verify availability again when a customer attempts to hold a seat.

### 3.3 Hold a Seat

**POST /api/events/{eventId}/holds**

Creates a temporary reservation for an available seat.

Example request:

```json
{
  "seatId": "seat-501"
}
```

Example successful response:

```json
{
  "holdId": "hold-901",
  "seatId": "seat-501",
  "status": "HELD",
  "expiresAt": "2027-06-20T12:10:00Z"
}
```

The server checks and changes the seat's status atomically in the database. A successful hold lasts for a limited period, such as five minutes.

If another customer already holds or purchased the seat, the request returns **409 Conflict**.

### 3.4 Complete a Purchase

**POST /api/orders**

Creates an order and starts the payment process for the customer's valid seat hold.

Example request:

```json
{
  "holdId": "hold-901",
  "paymentMethodId": "provider-payment-method"
}
```

Example successful response:

```json
{
  "orderId": "order-701",
  "status": "CONFIRMED"
}
```

The payment provider processes the payment. The server verifies the payment result before confirming the order and issuing the ticket.

The API uses an idempotency key so that retrying a request does not accidentally create duplicate orders or charge a customer twice.

### 3.5 View My Tickets

**GET /api/me/tickets**

Returns the tickets belonging to the authenticated user.

Example response:

```json
{
  "tickets": [
    {
      "ticketId": "ticket-801",
      "eventId": "event-101",
      "seatId": "seat-501",
      "status": "VALID"
    }
  ]
}
```

The server obtains the user identity from the authenticated session or token and checks ownership before returning ticket information.

### 3.6 View an Order

**GET /api/orders/{orderId}**

Returns the status of an order belonging to the authenticated user.

Possible statuses include `PENDING`, `CONFIRMED`, `FAILED`, and `CANCELLED`.

### 3.7 API Error Handling

The API uses appropriate HTTP status codes:

* `200 OK`: A request succeeded.
* `201 Created`: A resource was created.
* `400 Bad Request`: The request contains invalid data.
* `401 Unauthorized`: Authentication is required.
* `403 Forbidden`: The user is not permitted to perform the operation.
* `404 Not Found`: The requested event, seat, or order does not exist.
* `409 Conflict`: A seat is unavailable or a conflicting operation occurred.
* `429 Too Many Requests`: The client has exceeded a rate limit.
* `500 Internal Server Error`: An unexpected server error occurred.
* `503 Service Unavailable`: The system cannot currently accept the operation.

Error responses should provide a useful message without exposing sensitive information.

## 4. Data Model

TicketHub will use a relational database such as PostgreSQL because ticket purchases require reliable transactions, relationships, and constraints.

### 4.1 Users Table

Stores registered customers.

| Column        | Type              | Purpose                       |
| ------------- | ----------------- | ----------------------------- |
| id            | UUID, primary key | Unique user identifier        |
| email         | VARCHAR, unique   | Login email                   |
| password_hash | VARCHAR           | Securely stored password hash |
| created_at    | TIMESTAMP         | Account creation time         |

Passwords must never be stored as plain text.

### 4.2 Events Table

Stores concerts and other events.

| Column    | Type              | Purpose                    |
| --------- | ----------------- | -------------------------- |
| id        | UUID, primary key | Unique event identifier    |
| name      | VARCHAR           | Event name                 |
| venue     | VARCHAR           | Event location             |
| starts_at | TIMESTAMP         | Event start time           |
| status    | VARCHAR           | Publication or sale status |

### 4.3 Seats Table

Stores the seats available for each event.

| Column          | Type                       | Purpose                    |
| --------------- | -------------------------- | -------------------------- |
| id              | UUID, primary key          | Unique seat identifier     |
| event_id        | UUID, foreign key          | References Events          |
| seat_label      | VARCHAR                    | Label such as A12          |
| price           | DECIMAL                    | Seat price                 |
| status          | VARCHAR                    | AVAILABLE, HELD, or SOLD   |
| held_by_user_id | UUID, nullable foreign key | User holding the seat      |
| hold_expires_at | TIMESTAMP, nullable        | Time when the hold expires |

A unique constraint on `(event_id, seat_label)` prevents duplicate seat labels within the same event.

### 4.4 Orders Table

Stores purchase attempts and confirmed purchases.

| Column          | Type              | Purpose                                      |
| --------------- | ----------------- | -------------------------------------------- |
| id              | UUID, primary key | Unique order identifier                      |
| user_id         | UUID, foreign key | References Users                             |
| status          | VARCHAR           | PENDING, CONFIRMED, FAILED, or CANCELLED     |
| total_amount    | DECIMAL           | Total order amount                           |
| idempotency_key | VARCHAR, unique   | Prevents duplicate order creation on retries |
| created_at      | TIMESTAMP         | Order creation time                          |

### 4.5 Tickets Table

Stores the individual tickets issued to customers.

| Column    | Type                     | Purpose                   |
| --------- | ------------------------ | ------------------------- |
| id        | UUID, primary key        | Unique ticket identifier  |
| order_id  | UUID, foreign key        | References Orders         |
| seat_id   | UUID, unique foreign key | References Seats          |
| status    | VARCHAR                  | VALID, USED, or CANCELLED |
| issued_at | TIMESTAMP                | Ticket issue time         |

The unique constraint on `seat_id` ensures that a seat cannot have more than one ticket record. If cancelled seats can be resold, the cancellation and resale process must be designed so that the old ticket is invalidated before a new ticket is issued.

### 4.6 Relationships

* One user can have many orders.
* One event can have many seats.
* One order can contain multiple tickets.
* Each ticket belongs to one order.
* Each ticket refers to one seat.
* Each seat belongs to one event.

These relationships use foreign keys to maintain referential integrity.

### 4.7 Preventing Double-Booking

The seat map shown in the browser is not sufficient to guarantee availability because two customers may view the same seat before either purchases it.

TicketHub prevents double-booking through an atomic conditional update, a database transaction, and database constraints.

When a customer requests a seat hold, the server executes an operation equivalent to:

```sql
UPDATE seats
SET status = 'HELD',
    held_by_user_id = :user_id,
    hold_expires_at = :expiry_time
WHERE id = :seat_id
  AND status = 'AVAILABLE';
```

The application checks the number of rows affected.

* If one row is updated, the hold succeeded.
* If zero rows are updated, the seat was no longer available, so the request fails.

The database executes the update atomically. If two customers attempt to hold the same available seat simultaneously, only one can change its status from `AVAILABLE` to `HELD`.

For a purchase, the server verifies that the hold belongs to the customer and has not expired. It then uses a database transaction to create the order, mark the seat as sold, and issue the ticket after successful payment confirmation. A unique constraint on `tickets.seat_id` provides an additional safeguard.

If a transaction fails, its database changes are rolled back.

Payment processing requires extra care because an external payment provider cannot participate directly in the PostgreSQL transaction. TicketHub must use idempotent payment operations and a reliable payment-confirmation workflow. If payment succeeds but the application temporarily fails, the system must reconcile the payment and complete the order safely rather than issue a duplicate ticket.

Expired holds are released through a background process that only releases holds that have actually expired. It must not overwrite a seat that has already been sold.

## 5. High-Level Architecture

### 5.1 Architecture Diagram

```text
                  CUSTOMERS
                      |
                      v
              +----------------+
              |   DNS / CDN    |
              +----------------+
                      |
                      v
              +----------------+
              | Load Balancer  |
              +----------------+
                      |
          +-----------+-----------+
          |                       |
          v                       v
   +--------------+        +--------------+
   | App Server A |        | App Server B |
   +--------------+        +--------------+
          |                       |
          +-----------+-----------+
                      |
          +-----------+-----------+
          |                       |
          v                       v
   +--------------+        +--------------+
   | Redis Cache  |        | Waiting Room |
   +--------------+        +--------------+
          |                       |
          |                 Controls entry
          |                 to ticket sales
          |                       |
          +-----------+-----------+
                      |
                      v
              +----------------+
              | PostgreSQL     |
              | Primary DB     |
              +----------------+
                      |
                      v
              +----------------+
              | Read Replica   |
              +----------------+

   App Servers -----> Payment Provider
   App Servers -----> Message Queue
                           |
                           v
                    +--------------+
                    | Background   |
                    | Workers      |
                    +--------------+
```

The diagram is a conceptual overview. In a production deployment, the waiting room would sit in front of the protected purchasing workflow, and read replicas would serve suitable read-only queries. Seat holds and final purchase decisions must go through the authoritative database.

### 5.2 Component Responsibilities

**DNS and CDN:** DNS directs customers to the service. The CDN caches static assets such as images, stylesheets, and JavaScript to reduce latency and origin-server load. It must not treat seat availability or checkout responses as ordinary public cacheable content.

**Load balancer:** Distributes incoming requests across application servers and removes unhealthy servers from service.

**Application servers:** Handle API requests, authentication, business rules, seat reservations, and order processing. They are stateless so that any healthy server can handle a request. Persistent session and purchase information belongs in shared services rather than one server's local memory.

**Redis cache:** Stores suitable frequently requested data, such as public event details. This reduces database queries. Cached seat information is only advisory; the database makes the final reservation decision.

**Waiting room:** Controls how quickly customers enter the purchasing workflow during a major sale. It helps protect the database and provides a more orderly experience when demand exceeds the available seats. It does not guarantee that everyone in the queue will get a ticket.

**PostgreSQL primary database:** Stores authoritative seat availability, holds, orders, and tickets. Transactions and constraints protect purchase correctness.

**Read replica:** Handles suitable read-only queries, such as browsing event information, reducing load on the primary database. It may lag behind the primary, so it must not be used to make final seat-purchase decisions.

**Payment provider:** Processes payments without TicketHub directly storing card details. Payment callbacks must be authenticated and verified.

**Message queue and background workers:** Handle tasks such as sending confirmation emails, processing payment events, releasing expired holds, and reconciling orders. These tasks can be retried without blocking every customer request.

### 5.3 How the Architecture Handles a Major Sale

1. The CDN serves static content without sending every asset request to the application.
2. The waiting room limits how many customers enter checkout at once.
3. The load balancer distributes requests across multiple stateless application servers.
4. Redis reduces unnecessary database queries for public information.
5. The primary database serializes conflicting seat updates and enforces constraints.
6. Read replicas handle appropriate browsing queries, while reservation and purchase decisions use the primary database.
7. Background workers process notifications and other slower tasks asynchronously.
8. Rate limits, request timeouts, health checks, and monitoring help detect and control overload.

The system should reject or defer excess purchasing requests gracefully instead of allowing uncontrolled traffic to overwhelm the database.

## 6. Trade-Offs

### 6.1 Caching Versus Freshness

Caching event details reduces database load and improves response times. However, cached information can become outdated.

**Decision:** Cache public event details and other data that can tolerate brief delays. Always verify seat availability and reservation ownership against the primary database.

**Trade-off:** This design improves browsing performance while accepting that some non-critical information may briefly be stale.

### 6.2 Strict Database Consistency Versus Checkout Throughput

Using transactions and constraints to protect seat reservations may cause requests for the same seat to wait or fail when many customers compete for it.

**Decision:** Prioritize purchase correctness over accepting every request immediately. Use conditional updates, short transactions, and a waiting room to control contention.

**Trade-off:** Some customers may experience delays or receive an unavailable-seat response, but the system avoids selling the same seat twice.

### 6.3 Fairness Versus Immediate Access

A waiting room introduces an additional step before checkout and may make customers wait even when application servers are healthy.

**Decision:** Enable controlled admission during major sales, while allowing ordinary browsing to continue independently.

**Trade-off:** Customers wait longer before checkout, but the system is less likely to collapse under a sudden traffic spike.

### 6.4 Read Replicas Versus Operational Complexity

Read replicas reduce the load on the primary database. However, they introduce replication lag and additional operational work.

**Decision:** Use replicas for suitable read-heavy workloads, but keep authoritative seat reservations and final purchase decisions on the primary database.

**Trade-off:** Browsing can scale more easily, but the team must monitor replication lag and ensure that critical operations use the correct database.

## Conclusion

TicketHub combines stateless application servers, caching, a waiting room, a relational database, and background workers to handle normal traffic and major ticket-sale spikes.

Its most important correctness guarantee comes from the database: atomic conditional updates, transactions, and unique constraints prevent conflicting reservations from producing duplicate tickets.

The design deliberately prioritizes correct purchases and controlled access over accepting unlimited checkout traffic at once.
