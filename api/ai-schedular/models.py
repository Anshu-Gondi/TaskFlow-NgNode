# models.py (FastAPI service)

from pydantic import BaseModel, Field
from typing import List, Optional

class Task(BaseModel):
    id: Optional[str] = Field(alias="_id")
    title: str
    listId: str = Field(alias="_listId")
    completed: bool = False
    priority: Optional[int] = 0
    priorityLabel: Optional[str] = None  # New field
    dueDate: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "alias_generator": None,
        "extra": "ignore"
    }


class TaskRequest(BaseModel):
    tasks: List[Task]

    model_config = {
        "populate_by_name": True
    }
