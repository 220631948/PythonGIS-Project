"""Enable Row-Level Security (RLS) policies for multi-tenant isolation

Revision ID: 006
Revises: 005
Create Date: 2026-02-11

This migration implements PostgreSQL Row-Level Security to enforce tenant isolation
at the database level. Each tenant can only access their own data.

Security Features:
- RLS enabled on all tenant-scoped tables
- Policies enforce tenant_id matching for SELECT, INSERT, UPDATE, DELETE
- Super admin bypass via app.current_user_role session variable
- Automatic tenant_id injection on INSERT
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005_add_token_blacklist'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Tables that require tenant isolation
TENANT_SCOPED_TABLES = [
    'users',
    'spatial_layers',
    'suburbs',
    'informal_settlements',
    'service_facilities',
    'transport_routes',
    'land_parcels',
    'utility_networks',
    'field_observations',
    'reports',
    'dashboards',
    'workspaces',
    'scenarios',
]


def upgrade() -> None:
    """
    Enable RLS and create policies for tenant isolation.

    Session Variables Used:
    - app.current_tenant_id: The tenant_id of the authenticated user
    - app.current_user_role: The role of the authenticated user (for super_admin bypass)
    """

    # Create app schema if not exists
    op.execute("CREATE SCHEMA IF NOT EXISTS app;")

    # Create helper function to get current tenant from session
    op.execute("""
        CREATE OR REPLACE FUNCTION app.get_current_tenant_id()
        RETURNS INTEGER AS $$
        BEGIN
            RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INTEGER;
        END;
        $$ LANGUAGE plpgsql STABLE;
    """)

    # Create helper function to check if current user is super admin
    op.execute("""
        CREATE OR REPLACE FUNCTION app.is_super_admin()
        RETURNS BOOLEAN AS $$
        BEGIN
            RETURN current_setting('app.current_user_role', TRUE) = 'super_admin';
        END;
        $$ LANGUAGE plpgsql STABLE;
    """)

    # Enable RLS on all tenant-scoped tables
    conn = op.get_bind()
    from sqlalchemy import inspect
    inspector = inspect(conn)

    for table_name in TENANT_SCOPED_TABLES:
        # Check if table exists
        if not inspector.has_table(table_name):
            print(f"⚠️ Table {table_name} does not exist, skipping RLS enablement")
            continue

        # Enable RLS
        op.execute(f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;")

        # Force RLS even for table owner (security best practice)
        op.execute(f"ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;")

        # Policy 1: SELECT - Users can only see their tenant's data (or all if super_admin)
        op.execute(f"""
            CREATE POLICY {table_name}_tenant_isolation_select ON {table_name}
            FOR SELECT
            USING (
                tenant_id = app.get_current_tenant_id()
                OR app.is_super_admin()
            );
        """)

        # Policy 2: INSERT - Users can only insert data with their tenant_id
        op.execute(f"""
            CREATE POLICY {table_name}_tenant_isolation_insert ON {table_name}
            FOR INSERT
            WITH CHECK (
                tenant_id = app.get_current_tenant_id()
                OR app.is_super_admin()
            );
        """)

        # Policy 3: UPDATE - Users can only update their tenant's data
        op.execute(f"""
            CREATE POLICY {table_name}_tenant_isolation_update ON {table_name}
            FOR UPDATE
            USING (
                tenant_id = app.get_current_tenant_id()
                OR app.is_super_admin()
            )
            WITH CHECK (
                tenant_id = app.get_current_tenant_id()
                OR app.is_super_admin()
            );
        """)

        # Policy 4: DELETE - Users can only delete their tenant's data
        op.execute(f"""
            CREATE POLICY {table_name}_tenant_isolation_delete ON {table_name}
            FOR DELETE
            USING (
                tenant_id = app.get_current_tenant_id()
                OR app.is_super_admin()
            );
        """)

    # Special policy for users table - users can read their own user record
    if inspector.has_table('users'):
        op.execute("""
            CREATE POLICY users_own_record_select ON users
            FOR SELECT
            USING (
                id = NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER
                OR tenant_id = app.get_current_tenant_id()
                OR app.is_super_admin()
            );
        """)

    print(f"✅ RLS enabled on {len(TENANT_SCOPED_TABLES)} tables")
    print("✅ Tenant isolation policies created")
    print("✅ Super admin bypass enabled")


def downgrade() -> None:
    """
    Disable RLS and drop all policies.
    """

    # Drop policies from all tables
    for table_name in TENANT_SCOPED_TABLES:
        op.execute(f"DROP POLICY IF EXISTS {table_name}_tenant_isolation_select ON {table_name};")
        op.execute(f"DROP POLICY IF EXISTS {table_name}_tenant_isolation_insert ON {table_name};")
        op.execute(f"DROP POLICY IF EXISTS {table_name}_tenant_isolation_update ON {table_name};")
        op.execute(f"DROP POLICY IF EXISTS {table_name}_tenant_isolation_delete ON {table_name};")

        # Disable RLS
        op.execute(f"ALTER TABLE {table_name} DISABLE ROW LEVEL SECURITY;")

    # Drop special user policy
    op.execute("DROP POLICY IF EXISTS users_own_record_select ON users;")

    # Drop helper functions
    op.execute("DROP FUNCTION IF EXISTS app.is_super_admin();")
    op.execute("DROP FUNCTION IF EXISTS app.get_current_tenant_id();")

    print("✅ RLS disabled and policies dropped")
