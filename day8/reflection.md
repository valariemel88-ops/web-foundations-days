# Day 8: Learning Reflection

The most difficult concept in this course was understanding how to design a system that continues working when many users access it at the same time. At first, concepts such as horizontal scaling, caching, load balancing, database relationships, and transactions seemed separate and confusing. I gradually understood how they work together by studying the examples and applying them to my QuickNotes project. Building the API client and documenting the architecture helped me see the difference between writing code that works for one user and designing a system that can support many users reliably.

One important lesson from my TicketHub capstone is that showing a seat as available is not enough to guarantee that it can be purchased. Two customers could select the same seat simultaneously. I learned that an atomic database update, a transaction, and a unique constraint are needed to prevent double-booking. I also learned that adding more servers does not automatically solve every scaling problem because the database can become a bottleneck.

Based on feedback and further review, I would improve my capstone by testing the design under simulated heavy traffic and documenting more detailed capacity estimates. I would also explore how payment failures and expired reservations are handled in practice.

Next, I plan to strengthen my JavaScript skills and learn Node.js, Express, and PostgreSQL. I want to build a backend API that stores real data instead of relying on a mock API. I will continue practising system design so I can build applications that are reliable, secure, and capable of growing.
