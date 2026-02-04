"""Add spatial_layers table

Revision ID: 002_add_spatial_layers
Revises: 001_initial_postgis
Create Date: 2026-02-04

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "002_add_spatial_layers"
down_revision: Union[str, None] = "001_initial_postgis"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create spatial_layers metadata table
    op.create_table(
        "spatial_layers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), unique=True, nullable=False),
        sa.Column("table_name", sa.String(255), nullable=True),
        sa.Column("layer_type", sa.String(50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source_url", sa.String(512), nullable=True),
        sa.Column("attribution", sa.String(512), nullable=True),
        sa.Column("srid", sa.Integer(), server_default="4326", nullable=True),
        sa.Column(
            "last_updated",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("record_count", sa.Integer(), server_default="0", nullable=True),
        sa.Column("bounds", sa.JSON(), nullable=True),
        sa.Column("properties_schema", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create index on name for fast lookups
    op.create_index(
        "idx_spatial_layers_name",
        "spatial_layers",
        ["name"],
        unique=True,
    )

    # Create index on is_active for filtering
    op.create_index(
        "idx_spatial_layers_active",
        "spatial_layers",
        ["is_active"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_spatial_layers_active", table_name="spatial_layers")
    op.drop_index("idx_spatial_layers_name", table_name="spatial_layers")
    op.drop_table("spatial_layers")
