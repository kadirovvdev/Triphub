from pydantic import BaseModel, ConfigDict, Field


class RegionBase(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    slug: str = Field(min_length=2, max_length=80)


class RegionCreate(RegionBase):
    pass


class RegionResponse(RegionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)