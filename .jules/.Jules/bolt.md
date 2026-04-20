
## 2025-04-20 - O(N*M) Multiple Filter Aggregation Anti-Pattern
**Learning:** Found an anti-pattern where statistics (overall, by category, and by severity) were being aggregated using multiple consecutive `.filter(c => c.status === x).length` operations. This resulted in O(N*M) time complexity (where M is the number of possible states, categories, and severities).
**Action:** When calculating statistics across multiple categories or enum values, always use a single-pass O(N) loop to accumulate all required counts simultaneously into state dictionaries/objects rather than repeatedly filtering the array.
