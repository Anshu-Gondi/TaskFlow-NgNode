# test_scheduler.py

import pytest
from scheduler import schedule_tasks
from models import Task

def create_task(title, completed=False, priority=0, dueDate=None):
    return Task(
        _id=None,  # Explicitly pass `_id` as None
        title=title,
        completed=completed,
        priority=priority,
        dueDate=dueDate,
        _listId="list123"
    )

def test_empty_task_list():
    assert schedule_tasks([]) == []

def test_sort_by_completion():
    t1 = create_task("Incomplete", completed=False)
    t2 = create_task("Completed", completed=True)
    result = schedule_tasks([t2, t1])
    assert result[0].title == "Incomplete"
    assert result[1].title == "Completed"

def test_sort_by_priority():
    t1 = create_task("Low", priority=1)
    t2 = create_task("High", priority=5)
    result = schedule_tasks([t1, t2])
    assert result[0].title == "High"
    assert result[1].title == "Low"

def test_sort_by_due_date():
    t1 = create_task("Due Later", dueDate="2025-12-31")
    t2 = create_task("Due Sooner", dueDate="2025-01-01")
    result = schedule_tasks([t1, t2])
    assert result[0].title == "Due Sooner"
    assert result[1].title == "Due Later"

def test_sort_by_title_when_all_same():
    t1 = create_task("Alpha")
    t2 = create_task("Beta")
    result = schedule_tasks([t2, t1])
    assert result[0].title == "Alpha"
    assert result[1].title == "Beta"

def test_full_sorting_order():
    # Mixed attributes
    t1 = create_task("A", completed=True, priority=1, dueDate="2025-12-31")
    t2 = create_task("B", completed=False, priority=1, dueDate="2025-12-30")
    t3 = create_task("C", completed=False, priority=3, dueDate="2025-12-31")
    t4 = create_task("D", completed=False, priority=3, dueDate="2025-01-01")
    result = schedule_tasks([t1, t2, t3, t4])

    titles = [t.title for t in result]
    # Should prioritize: not completed > higher priority > earlier due > title
    assert titles == ["D", "C", "B", "A"]

def test_malformed_due_date_handled_gracefully():
    t1 = create_task("Valid Due Date", dueDate="2025-12-31")
    t2 = create_task("Bad Due Date", dueDate="not-a-date")  # Malformed
    t3 = create_task("No Due Date")  # None

    try:
        result = schedule_tasks([t1, t2, t3])
        titles = [t.title for t in result]
        assert set(titles) == {"Valid Due Date", "Bad Due Date", "No Due Date"}
    except Exception as e:
        assert False, f"Scheduler crashed on malformed date: {e}"

def test_missing_priority_defaults_to_zero():
    t1 = create_task("Default Priority")  # priority=0
    t2 = create_task("Higher Priority", priority=3)

    result = schedule_tasks([t1, t2])
    assert [t.title for t in result] == ["Higher Priority", "Default Priority"]


def test_mixed_validity_tasks():
    valid = create_task("Valid", completed=False, priority=3, dueDate="2025-01-01")
    bad_date = create_task("Bad Date", dueDate="31-12-2025")  # wrong format
    missing_title = create_task("", dueDate="2025-01-02")     # empty title

    try:
        result = schedule_tasks([valid, bad_date, missing_title])
        assert valid in result
        assert len(result) == 3
    except Exception as e:
        assert False, f"Scheduler failed with mixed input: {e}"

def test_empty_titles_sorted_first():
    t1 = create_task("", priority=1)
    t2 = create_task("Alpha", priority=1)

    result = schedule_tasks([t1, t2])
    assert [t.title for t in result] == ["", "Alpha"]
