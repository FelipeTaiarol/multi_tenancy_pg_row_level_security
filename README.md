

### Example of how to use postgres RLS to do tenant isolation.

Every table should have a **tenant_id** column and every database connection should have a configuration parameter **tenant.id**.


**WARNING: I haven't used this approach in production yet.**
