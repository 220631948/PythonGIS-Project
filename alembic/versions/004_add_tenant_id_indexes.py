"""Add tenant_id indexes to spatial tables

Revision ID: 004_add_tenant_id_indexes
Revises: 003_add_tenants_table
Create Date: 2026-02-11

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "004_add_tenant_id_indexes"
down_revision: Union[str, None] = "003_add_tenants_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tenant_id column to spatial_layers if not exists
    # (Already exists in model, but ensure it's in database)
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Check if tenant_id column exists in spatial_layers
    columns = [c['name'] for c in inspector.get_columns('spatial_layers')]
    if 'tenant_id' not in columns:
        op.add_column(
            "spatial_layers",
            sa.Column("tenant_id", sa.Integer(), nullable=True)
        )

    # Add foreign key constraint
    op.create_foreign_key(
        "fk_spatial_layers_tenant_id",
        "spatial_layers",
        "tenants",
        ["tenant_id"],
        ["id"],
        ondelete="CASCADE"
    )

    # Create composite index (tenant_id, id) for fast tenant-scoped queries
    op.create_index(
        "idx_spatial_layers_tenant_id",
        "spatial_layers",
        ["tenant_id"],
        unique=False
    )

    # Create composite index (tenant_id, name) for unique constraints per tenant
    op.create_index(
        "idx_spatial_layers_tenant_name",
        "spatial_layers",
        ["tenant_id", "name"],
        unique=False
    )

    # List of spatial tables that need tenant_id
    # Note: These tables may not exist yet - we'll check before adding columns
    spatial_tables = [
        "suburbs",
        "informal_settlements",
        "service_facilities",
        "transport_stops",
        "transport_routes",
        "land_use_zones",
        "building_footprints",
        "flood_zones",
    ]

    for table_name in spatial_tables:
        # Check if table exists
        if inspector.has_table(table_name):
            # Check if tenant_id column exists
            columns = [c['name'] for c in inspector.get_columns(table_name)]
            if 'tenant_id' not in columns:
                # Add tenant_id column
                op.add_column(
                    table_name,
                    sa.Column("tenant_id", sa.Integer(), nullable=True)
                )

            # Add foreign key
            try:
                op.create_foreign_key(
                    f"fk_{table_name}_tenant_id",
                    table_name,
                    "tenants",
                    ["tenant_id"],
                    ["id"],
                    ondelete="CASCADE"
                )
            except Exception:
                # Foreign key may already exist
                pass

            # Create index
            try:
                op.create_index(
                    f"idx_{table_name}_tenant_id",
                    table_name,
                    ["tenant_id"],
                    unique=False
                )
            except Exception:
                # Index may already exist
                pass


def downgrade() -> None:
    # Drop indexes from spatial_layers
    op.drop_index("idx_spatial_layers_tenant_name", table_name="spatial_layers")
    op.drop_index("idx_spatial_layers_tenant_id", table_name="spatial_layers")

    # Drop foreign key from spatial_layers
    op.drop_constraint(
        "fk_spatial_layers_tenant_id",
        "spatial_layers",
        type_="foreignkey"
    )

    # List of spatial tables
    spatial_tables = [
        "suburbs",
        "informal_settlements",
        "service_facilities",
        "transport_stops",
        "transport_routes",
        "land_use_zones",
        "building_footprints",
        "flood_zones",
    ]

    conn = op.get_bind()
    inspector = sa.inspect(conn)

    for table_name in spatial_tables:
        if inspector.has_table(table_name):
            # Drop index
            try:
                op.drop_index(f"idx_{table_name}_tenant_id", table_name=table_name)
            except Exception:
                pass

            # Drop foreign key
            try:
                op.drop_constraint(
                    f"fk_{table_name}_tenant_id",
                    table_name,
                    type_="foreignkey"
                )
            except Exception:
                pass

            # Drop column
            try:
                op.drop_column(table_name, "tenant_id")
            except Exception:
                pass
