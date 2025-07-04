"""Add invite codes.

Revision ID: b1ad875e4791
Revises: cbb27e63e213
Create Date: 2025-06-19 20:49:18.822271

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision: str = 'b1ad875e4791'
down_revision: Union[str, None] = 'cbb27e63e213'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('invite_codes',
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_by_user_id', sa.Uuid(), nullable=False),
    sa.Column('used_by_user_id', sa.Uuid(), nullable=True),
    sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['used_by_user_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_invite_codes_created_by_user_id'), 'invite_codes', ['created_by_user_id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_invite_codes_created_by_user_id'), table_name='invite_codes')
    op.drop_table('invite_codes')
    # ### end Alembic commands ###
