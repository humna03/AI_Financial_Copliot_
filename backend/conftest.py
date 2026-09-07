"""
conftest.py — shared pytest setup for the backend test suite.

Why this exists
----------------
`app/auth.py` is intentionally self-contained (see its own docstring) and
creates its own module-level SQLAlchemy `engine` bound to whatever
`DATABASE_URL` is set the first time the module is imported. Because Python
caches imported modules for the lifetime of the process, that first import
"wins" for the entire pytest session — any later test file that reassigns
`os.environ["DATABASE_URL"]` before its own `from app.main import app` has no
effect, since `app.auth` (and `app.database`) are already cached from
whichever test file imported them first.

Individual test files used to each set their own `DATABASE_URL` and then
delete their own sqlite file in teardown, which worked when each file was
run alone, but broke when the full suite ran together: a later file's writes
would silently land in an earlier file's (now-deleted) database file via a
stale pooled connection, surfacing as confusing "readonly database" or
"table already exists" errors.

The fix: pick ONE shared sqlite file for the whole test session, set it
here (before any test module is collected/imported), and only create/delete
that file at session start/end — never mid-session, which is what caused the
stale-connection problems above. Tests stay isolated from each other via
unique per-test data (e.g. uuid4 emails) and per-test SQLModel table
create_all/drop_all, not via swapping the underlying database file.
"""

import os

_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_shared.db")

# Must happen before any test module does `from app.auth import ...` or
# `from app.main import app`, since those bind a module-level engine to
# whatever this value is at first import.
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ.setdefault("AUTH_SECRET_KEY", "test-secret-key-for-pytest-only")


def pytest_sessionstart(session):
    if os.path.exists(_TEST_DB_PATH):
        os.remove(_TEST_DB_PATH)


def pytest_sessionfinish(session, exitstatus):
    if os.path.exists(_TEST_DB_PATH):
        os.remove(_TEST_DB_PATH)
