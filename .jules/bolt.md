## 2026-02-20 - Batching N+1 Queries in Spatial Analysis
**Learning:** Checking for table existence inside a loop (N+1 query problem) is a common anti-pattern in dynamic spatial queries. Using `ANY(:list)` in SQL allows checking all tables at once.
**Action:** When handling multiple dynamic layers/tables, always batch the existence/metadata checks into a single query before iterating.

## 2026-02-20 - Mocking SQLAlchemy Results
**Learning:** When mocking `sqlalchemy.engine.Result`, `fetchall()` returns a list of Row objects (which behave like tuples). Mocking it with a simple list of values (e.g. `[True]`) causes indexing errors (`row[0]`) if the code expects a Row.
**Action:** Always mock `fetchall()` return values as a list of tuples/rows (e.g. `[('my_table',)]`) to match real DB behavior.
