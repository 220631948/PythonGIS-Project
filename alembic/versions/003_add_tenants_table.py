"""Add tenants table for multi-tenant architecture

Revision ID: 003_add_tenants_table
Revises: 002_add_spatial_layers
Create Date: 2026-02-11

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003_add_tenants_table"
down_revision: Union[str, None] = "002_add_spatial_layers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create tenants table
    op.create_table(
        "tenants",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("domain", sa.String(255), unique=True, nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("max_users", sa.Integer(), server_default="100", nullable=True),
        sa.Column("max_storage_mb", sa.Integer(), server_default="5000", nullable=True),
        sa.Column("settings", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index("idx_tenants_domain", "tenants", ["domain"], unique=True)
    op.create_index("idx_tenants_slug", "tenants", ["slug"], unique=True)
    op.create_index("idx_tenants_active", "tenants", ["is_active"], unique=False)

    # Insert default tenant for development/migration
    op.execute(
        """
        INSERT INTO tenants (id, name, domain, slug, description, is_active)
        VALUES (
            1,
            'Default Organization',
            'localhost',
            'default',
            'Default tenant for local development and existing data',
            true
        );
        """
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index("idx_tenants_active", table_name="tenants")
    op.drop_index("idx_tenants_slug", table_name="tenants")
    op.drop_index("idx_tenants_domain", table_name="tenants")

    # Drop table
    op.drop_table("tenants")
