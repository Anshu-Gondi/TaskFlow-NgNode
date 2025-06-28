from datetime import datetime

def parse_due_date(date_str):
    try:
        return datetime.fromisoformat(date_str)
    except Exception:
        return datetime.max  # Push malformed dates to the end

def resolve_priority(task):
    label = getattr(task, "priorityLabel", None)
    if label:
        levels = {
            "urgent": 3,
            "high": 2,
            "medium": 1,
            "low": 0
        }
        return levels.get(label.lower(), 0)
    return getattr(task, "priority", 0)

def schedule_tasks(tasks):
    """
    Sort tasks:
    1. Incomplete first
    2. Higher priority (int or label-based)
    3. Earlier due date (real datetime sort)
    4. Alphabetical title
    """
    if not tasks:
        return []

    return sorted(
        tasks,
        key=lambda t: (
            t.completed,                          # False (incomplete) first
            -resolve_priority(t),                 # Higher priority
            parse_due_date(t.dueDate),            # Earlier due date first
            t.title.lower()                       # Alphabetically by title
        )
    )
