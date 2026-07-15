## 2024-05-20 - Refactored array filter chains into single loop
**Learning:** Found multiple instances of `.filter().length` chained on the same array to calculate statistics in `generateConcernStatistics` and `getConcernStatistics`. This resulted in O(k*N) complexity where k was the number of categories and severities.
**Action:** Replaced these chains with a single O(N) traversal, creating tallies in a single pass. This is a common pattern in statistics calculations and significantly reduces redundant traversals.
## 2024-05-20 - Refactored array filter chains into single loop
**Learning:** Found multiple instances of `.filter().length` chained on the same array to calculate statistics in `generateConcernStatistics` and `getConcernStatistics`. This resulted in O(k*N) complexity where k was the number of categories and severities.
**Action:** Replaced these chains with a single O(N) traversal, creating tallies in a single pass. This is a common pattern in statistics calculations and significantly reduces redundant traversals.
