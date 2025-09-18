import threading
import time
from fastapi.testclient import TestClient

from app.main import app
from app.config import get_database, connect_to_mongodb
from app.dependencies import get_current_user


client = TestClient(app)

# thread-local store used by the fake current_user dependency override
thread_local = threading.local()


async def _fake_current_user():
    return getattr(thread_local, "user", {"id": "anonymous", "is_mentor": False, "role": "developer"})


def setup_module(module):
    # try to connect to DB; if unavailable, tests will error early
    connect_to_mongodb()
    # override the dependency to use thread-local user
    app.dependency_overrides[get_current_user] = _fake_current_user


def test_create_submission_and_auto_assign():
    db = get_database()
    # create a mentor user
    db.users.insert_one({"_id": "mentor1", "email": "m1@example.com", "role": "mentor", "is_mentor": True})
    db.squads.insert_one({
        "_id": "s1",
        "name": "Alpha",
        "members": {"mentor1": {"role": "mentor"}}
    })

    # create a developer user record
    db.users.insert_one({"_id": "dev1", "email": "d1@example.com", "role": "developer", "is_mentor": False})

    # set thread-local current user to dev1
    thread_local.user = {"id": "dev1", "is_mentor": False, "role": "developer"}

    # POST /submissions with squad_id should pre-assign mentor1
    resp = client.post(
        "/submissions",
        json={
            "pr_url": "https://github.com/org/repo/pull/1",
            "title": "Add feature",
            "preferred_mentor_count": 1,
            "squad_id": "s1"
        }
    )

    assert resp.status_code in (200, 201)
    data = resp.json()
    assert data["preferred_mentor_count"] == 1
    assert data["assigned_mentors"]


def test_concurrent_claims():
    db = get_database()
    # create a submission needing 1 mentor slot
    sub = {
        "_id": "sub-claim",
        "pr_url": "https://github.com/org/repo/pull/2",
        "author_id": "dev1",
        "preferred_mentor_count": 1,
        "assigned_count": 0,
        "assigned_mentors": [],
        "status": "needs_review",
    }
    db.submissions.insert_one(sub)

    # insert two mentors
    db.users.insert_one({"_id": "mentorA", "email": "ma@example.com", "role": "mentor", "is_mentor": True})
    db.users.insert_one({"_id": "mentorB", "email": "mb@example.com", "role": "mentor", "is_mentor": True})

    results = {}

    def run_claim(name):
        # set thread-local user for this thread
        thread_local.user = {"id": name, "is_mentor": True, "role": "mentor"}
        r = client.post(f"/submissions/sub-claim/claim")
        results[name] = r.status_code

    t1 = threading.Thread(target=run_claim, args=("mentorA",))
    t2 = threading.Thread(target=run_claim, args=("mentorB",))
    t1.start(); t2.start()
    t1.join(); t2.join()

    # Exactly one should succeed (200) and the other should get 409 conflict
    statuses = list(results.values())
    assert 200 in statuses
    assert 409 in statuses or statuses.count(200) == 1
