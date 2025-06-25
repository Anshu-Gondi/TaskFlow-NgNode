# main.py (FastAPI service)

from fastapi import FastAPI
from models import TaskRequest
from scheduler import schedule_tasks

app = FastAPI()

@app.post("/api/schedule")
def schedule_endpoint(req: TaskRequest):
    scheduled = schedule_tasks(req.tasks)
    # dump with alias so front-end receives the same shape:
    return {"scheduled": [t.model_dump(by_alias=True) for t in scheduled]}
