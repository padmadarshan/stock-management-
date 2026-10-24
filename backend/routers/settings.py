import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=schemas.SettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    settings_records = db.query(models.Setting).all()
    data = {"threshold": 10, "expiry": 30, "dark": False}
    for s in settings_records:
        try:
            data[s.key] = json.loads(s.value)
        except Exception:
            data[s.key] = s.value
    return data

@router.put("", response_model=schemas.SettingsSchema)
def update_settings(settings_in: schemas.SettingsSchema, db: Session = Depends(get_db)):
    dict_val = settings_in.dict()
    for k, v in dict_val.items():
        record = db.query(models.Setting).filter(models.Setting.key == k).first()
        if not record:
            record = models.Setting(key=k, value=json.dumps(v))
            db.add(record)
        else:
            record.value = json.dumps(v)
    db.commit()
    return settings_in
