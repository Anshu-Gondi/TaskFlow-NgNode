def schedule_tasks(tasks):
    """
    Scheduling logic:
    1. Uncompleted tasks first
    2. Then by descending priority (higher first)
    3. Then by due date (earlier first)
    4. Then alphabetically by title
    """
    if not tasks:
        return []

    return sorted(
        tasks,
        key=lambda t: (
            t.completed,                        # False (not done) first
            -t.priority if t.priority else 0,   # Higher priority first
            t.dueDate or "",                    # Earlier due date first
            t.title.lower()                     # Alphabetical title
        )
    )
