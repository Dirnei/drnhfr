---
title: 'PLACEHOLDER: Event Sourcing Without Regret'
summary: 'PLACEHOLDER: One aggregate, 40 million events, and what I changed on the second attempt.'
role: 'Architecture and implementation'
period: '2024–2026'
stack: ['.NET', 'Akka.NET', 'PostgreSQL']
featured: true
order: 10
translationKey: 'event-sourcing'
links: {}
---

*Placeholder — this post will be replaced by a real one.*

The first model worked, right up until the projections started taking
longer to catch up than the business side had patience for. The second
attempt moved the aggregate boundaries instead of trying to make the
database faster.
