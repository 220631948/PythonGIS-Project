"""Add workspace_items table for collaborative analysis results

Revision ID: 008
Revises: 007
Create Date: 2026-02-12
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry


# revision identifiers, used by Alembic.
revision: str = '008'
down_revision: Union[str, None] = '007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the workspace_items table
    op.create_table(
        'workspace_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('item_type', sa.String(length=100), nullable=False),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.String(length=255), nullable=True),
        sa.Column('geom', Geometry(geometry_type='GEOMETRY', srid=4326, spatial_index=False), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add indexes
    op.create_index(op.f('ix_workspace_items_id'), 'workspace_items', ['id'], unique=False)
    op.create_index(op.f('ix_workspace_items_tenant_id'), 'workspace_items', ['tenant_id'], unique=False)
    
    # Spatial index (GIST)
    op.create_index(
        'idx_workspace_items_geom', 
        'workspace_items', 
        ['geom'], 
        postgresql_using='gist'
    )


def downgrade() -> None:
    op.drop_index('idx_workspace_items_geom', table_name='workspace_items')
    op.drop_index(op.f('ix_workspace_items_tenant_id'), table_name='workspace_items')
    op.drop_index(op.f('ix_workspace_items_id'), table_name='workspace_items')
    op.drop_table('workspace_items')
