## 2024-11-07 - In-Place Sort Mutation on Cached Arrays
**Learning:** Found that calling `.sort()` on arrays retrieved from a Map (like `this.history.get(userId)`) mutates the cached array in place. Also, using `.sort()[0]` to find an extremum is O(N log N) when it should be an O(N) pass.
**Action:** Always use a single O(N) pass (e.g. `reduce` or a loop) to find maximum/minimum values, and use spread `[...]` or `Array.from()` before sorting cached arrays.

## 2024-11-07 - Redundant Spread Operator before Filter
**Learning:** Found that using the spread operator `[...]` before calling `.filter()` (e.g. `[...array].filter()`) is redundant because `.filter()` inherently creates and returns a brand-new array. The initial shallow copy adds unnecessary memory allocation.
**Action:** Avoid using `[...]` when immediately chaining array methods that already return new arrays, such as `.filter()` or `.map()`.
