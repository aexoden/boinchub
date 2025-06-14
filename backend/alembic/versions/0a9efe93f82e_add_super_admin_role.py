"""Add super admin role.

Revision ID: 0a9efe93f82e
Revises: 4ce5569175a5
Create Date: 2025-06-14 12:26:45.855055

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision: str = '0a9efe93f82e'
down_revision: Union[str, None] = '4ce5569175a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    connection = op.get_bind()

    # Promote the first admin user to super_admin if no super_admin exists
    result = connection.execute(sa.text("""
        SELECT COUNT(*) as count FROM users WHERE role = 'super_admin'
    """)).fetchone()

    super_admin_count = result[0] if result else 0

    if super_admin_count == 0:
        # Find the first admin user and promote them to super_admin
        result = connection.execute(sa.text("""
            SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1
        """))

        first_admin = result.fetchone()

        if first_admin:
            connection.execute(sa.text("""
                UPDATE users SET role = 'super_admin' WHERE id = :user_id
            """), {'user_id': first_admin[0]})

            print(f"Promoted first admin user to super_admin")
        else:
            # If no admin exists, promote the first user (if any) to super_admin
            result = connection.execute(sa.text("""
                SELECT id FROM users ORDER BY created_at ASC LIMIT 1
            """))

            first_user = result.fetchone()

            if first_user:
                connection.execute(sa.text("""
                    UPDATE users SET role = 'super_admin' WHERE id = :user_id
                """), {'user_id': first_user[0]})

                print(f"Promoted first user to super_admin")


def downgrade() -> None:
    """Downgrade schema."""
    # Convert all super_admin users back to admin
    connection = op.get_bind()

    connection.execute(sa.text("""
        UPDATE users SET role = 'admin' WHERE role = 'super_admin'
    """))
