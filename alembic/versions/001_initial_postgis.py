"""Initial PostGIS setup with spatial tables

Revision ID: 001_initial_postgis
Revises:
Create Date: 2026-02-03

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = "001_initial_postgis"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS extension (should already be enabled, but ensure)
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.execute("CREATE EXTENSION IF NOT EXISTS hstore;")
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis_topology;")

    # Create spatial_data schema
    op.execute("CREATE SCHEMA IF NOT EXISTS spatial_data;")

    # Create datasets_metadata table
    op.create_table(
        "datasets_metadata",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column(
            "last_updated",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("feature_count", sa.Integer(), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema="spatial_data",
    )

    # Create spatial_cache table with geometry column
    op.create_table(
        "spatial_cache",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("dataset_id", sa.Integer(), nullable=False),
        sa.Column(
            "geometry",
            geoalchemy2.Geometry(srid=4326, spatial_index=False),
            nullable=True,
        ),
        sa.Column("properties", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["dataset_id"], ["spatial_data.datasets_metadata.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        schema="spatial_data",
    )

    # Create GIST spatial index on geometry column
    op.create_index(
        "idx_spatial_cache_geometry",
        "spatial_cache",
        ["geometry"],
        unique=False,
        schema="spatial_data",
        postgresql_using="gist",
    )

    # Create GIN index on properties JSONB column
    op.create_index(
        "idx_spatial_cache_properties",
        "spatial_cache",
        ["properties"],
        unique=False,
        schema="spatial_data",
        postgresql_using="gin",
    )


def downgrade() -> None:
    # Drop indices
    op.drop_index(
        "idx_spatial_cache_properties",
        table_name="spatial_cache",
        schema="spatial_data",
    )
    op.drop_index(
        "idx_spatial_cache_geometry", table_name="spatial_cache", schema="spatial_data"
    )

    # Drop tables
    op.drop_table("spatial_cache", schema="spatial_data")
    op.drop_table("datasets_metadata", schema="spatial_data")

    # Drop schema (optional, uncomment if needed)
    # op.execute("DROP SCHEMA IF EXISTS spatial_data CASCADE;")
