from pydantic import BaseModel, ConfigDict, EmailStr


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: str | None = None
    updated_at: str | None = None

    model_config = ConfigDict(from_attributes=True)
