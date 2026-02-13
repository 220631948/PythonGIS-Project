"""Add token_blacklist table for JWT revocation

Revision ID: 005_add_token_blacklist
Revises: 004_add_tenant_id_indexes
Create Date: 2026-02-11

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "005_add_token_blacklist"
down_revision: Union[str, None] = "004_add_tenant_id_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create token_blacklist table for JWT revocation
    op.create_table(
        "token_blacklist",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("jti", sa.String(36), unique=True, nullable=False),  # JWT ID (UUID)
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_type", sa.String(20), nullable=False),  # 'access' or 'refresh'
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "revoked_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("reason", sa.String(255), nullable=True),  # 'logout', 'compromise', etc.
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for fast lookups
    op.create_index(
        "idx_token_blacklist_jti",
        "token_blacklist",
        ["jti"],
        unique=True,
    )

    op.create_index(
        "idx_token_blacklist_user_id",
        "token_blacklist",
        ["user_id"],
        unique=False,
    )

    op.create_index(
        "idx_token_blacklist_expires_at",
        "token_blacklist",
        ["expires_at"],
        unique=False,
    )

    # Create composite index for efficient cleanup queries
    op.create_index(
        "idx_token_blacklist_expires_revoked",
        "token_blacklist",
        ["expires_at", "revoked_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_token_blacklist_expires_revoked", table_name="token_blacklist")
    op.drop_index("idx_token_blacklist_expires_at", table_name="token_blacklist")
    op.drop_index("idx_token_blacklist_user_id", table_name="token_blacklist")
    op.drop_index("idx_token_blacklist_jti", table_name="token_blacklist")
    op.drop_table("token_blacklist")
