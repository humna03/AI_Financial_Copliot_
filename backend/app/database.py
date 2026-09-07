from sqlmodel import SQLModel, create_engine

from app.config import settings
import app.models  # noqa: F401 — ensure all models are registered with SQLModel.metadata

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)


def _ensure_auth_user_id_column():
    """Additive, safe migration: adds users.auth_user_id if it's missing from an
    already-existing database, without touching any other column or table."""
    from sqlalchemy import text

    with engine.connect() as conn:
        existing_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        if existing_columns and "auth_user_id" not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN auth_user_id INTEGER"))
            conn.commit()


def _deduplicate_auth_user_links():
    """Safety net for a one-account -> one-financial-profile relationship.

    If (e.g. from a prior client-side bug, or a user who lost localStorage and
    re-triggered `POST /api/users`) more than one financial `users` row ended
    up linked to the same `auth_user_id`, keep the oldest row (lowest id) as
    the canonical profile for that account and null out `auth_user_id` on the
    rest. This does NOT delete any row or any financial data — the extra
    profiles simply become unowned (same safe-by-default state as legacy
    pre-auth records), so a future unique index can be added without either
    losing data or failing on existing duplicates.
    """
    from sqlalchemy import text

    with engine.connect() as conn:
        existing_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        if "auth_user_id" not in existing_columns:
            return

        duplicate_owners = conn.execute(
            text(
                """
                SELECT auth_user_id FROM users
                WHERE auth_user_id IS NOT NULL
                GROUP BY auth_user_id
                HAVING COUNT(*) > 1
                """
            )
        ).fetchall()

        for (owner_id,) in duplicate_owners:
            rows = conn.execute(
                text("SELECT id FROM users WHERE auth_user_id = :owner ORDER BY id ASC"),
                {"owner": owner_id},
            ).fetchall()
            # Keep the first (oldest) row; unlink the rest.
            for (row_id,) in rows[1:]:
                conn.execute(
                    text("UPDATE users SET auth_user_id = NULL WHERE id = :id"),
                    {"id": row_id},
                )
        if duplicate_owners:
            conn.commit()


def _ensure_auth_user_id_unique_index():
    """Additive, idempotent migration: enforces one financial profile per
    auth account going forward. A partial unique index (WHERE auth_user_id IS
    NOT NULL) is used so it never conflicts with NULL/legacy/unowned rows —
    SQL treats each NULL as distinct under a unique index, and duplicates
    among non-NULL values were already resolved by
    `_deduplicate_auth_user_links()` above, so this is always safe to create."""
    from sqlalchemy import text

    with engine.connect() as conn:
        existing_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        if "auth_user_id" not in existing_columns:
            return
        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_auth_user_id_unique "
                "ON users(auth_user_id) WHERE auth_user_id IS NOT NULL"
            )
        )
        conn.commit()


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    _ensure_auth_user_id_column()
    _deduplicate_auth_user_links()
    _ensure_auth_user_id_unique_index()


def get_session():
    from sqlmodel import Session

    with Session(engine) as session:
        yield session
