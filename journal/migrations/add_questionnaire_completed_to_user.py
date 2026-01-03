
"""add questionnaire_completed to user

Revision ID: 1234567890ab
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1234567890ab'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('questionnaire_completed', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade():
    op.drop_column('users', 'questionnaire_completed')
