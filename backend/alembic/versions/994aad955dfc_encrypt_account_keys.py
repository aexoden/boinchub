"""Encrypt account keys.

Revision ID: 994aad955dfc
Revises: b1ad875e4791
Create Date: 2025-06-20 22:23:42.519247

"""
import logging
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

from boinchub.core.encryption import decrypt_account_key, encrypt_account_key

# revision identifiers, used by Alembic.
revision: str = '994aad955dfc'
down_revision: Union[str, None] = 'b1ad875e4791'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

logger = logging.getLogger(__name__)

def upgrade() -> None:
    """Upgrade schema."""
    connection = op.get_bind()

    # Encrypt existing account keys
    result = connection.execute(sa.text("""
        SELECT id, account_key FROM user_project_keys WHERE account_key IS NOT NULL AND account_key != ''
    """))

    rows = result.fetchall()
    logger.info(f"Found {len(rows)} keys to encrypt.")

    for row in rows:
        try:
            row_id, plaintext_key = row
            connection.execute(sa.text("""
                UPDATE user_project_keys
                SET account_key = :encrypted_key
                WHERE id = :row_id
            """), {"encrypted_key": encrypt_account_key(plaintext_key), "row_id": row_id})
        except Exception as e:
            logger.error(f"Failed to encrypt key for row {row_id}: {e}")


def downgrade() -> None:
    """Downgrade schema."""
    connection = op.get_bind()

    # Decrypt existing account keys
    result = connection.execute(sa.text("""
        SELECT id, account_key FROM user_project_keys WHERE account_key IS NOT NULL AND account_key != ''
    """))

    rows = result.fetchall()
    logger.info(f"Found {len(rows)} keys to decrypt.")

    for row in rows:
        try:
            row_id, encrypted_key = row
            connection.execute(sa.text("""
                UPDATE user_project_keys
                SET account_key = :decrypted_key
                WHERE id = :row_id
            """), {"decrypted_key": decrypt_account_key(encrypted_key), "row_id": row_id})
        except Exception as e:
            logger.error(f"Failed to decrypt key for row {row_id}: {e}")
