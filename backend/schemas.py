import re
from enum import Enum
from typing import List, Optional, Union, Any

from pydantic import BaseModel, validator, Field

from .models import AttrType, AttributeDefinition

class AttrTypeMapping(Enum):
    STR = 'STR'
    BOOL = 'BOOL'
    INT = 'INT'
    FLOAT = 'FLOAT'
    FK = 'FK'
    DT = 'DT'

assert set(AttrType.__members__.keys()) == set(AttrTypeMapping.__members__.keys())


class AttributeCreateSchema(BaseModel):
    name: str
    type: AttrTypeMapping


class AttributeDefinitionBase(BaseModel):
    required: bool
    unique: bool
    list: bool
    key: bool
    description: Optional[str]
    bind_to_schema: Optional[int]

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class AttrDefSchema(AttributeDefinitionBase):
    attr_id: int = Field(alias='attribute_id')


class AttrDefWithAttrDataSchema(AttributeDefinitionBase, AttributeCreateSchema):
    @classmethod
    def from_orm(cls, obj: Any):
        if isinstance(obj, AttributeDefinition):
            obj.type = obj.attribute.type.name
            obj.name = obj.attribute.name
        return super().from_orm(obj)


class AttributeDefinitionUpdateSchema(AttributeDefinitionBase):
    attr_def_id: int


class AttributeDefinitionUpdateWithNameSchema(AttributeDefinitionBase):
    name: str


def validate_slug(cls, slug: str):
    if re.match('^[a-zA-Z]+[0-9]*(-[a-zA-Z0-9]+)*$', slug) is None:
        raise ValueError(f'`{slug}` is invalid value for slug field')
    return slug


class SchemaCreateSchema(BaseModel):
    name: str
    slug: str
    attributes: List[Union[AttrDefSchema, AttrDefWithAttrDataSchema]]

    slug_validator = validator('slug', allow_reuse=True)(validate_slug)


class SchemaUpdateSchema(BaseModel):
    name: str
    slug: str

    update_attributes: List[Union[AttributeDefinitionUpdateSchema, AttributeDefinitionUpdateWithNameSchema]]
    add_attributes: List[Union[AttrDefSchema, AttrDefWithAttrDataSchema]]

    slug_validator = validator('slug', allow_reuse=True)(validate_slug)


class SchemaBaseSchema(BaseModel):
    id: int
    name: str
    slug: str

    slug_validator = validator('slug', allow_reuse=True)(validate_slug)

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class SchemaForListSchema(SchemaBaseSchema):
    pass


class SchemaDetailSchema(SchemaBaseSchema):
    deleted: bool
    attr_defs: List[AttrDefWithAttrDataSchema] = Field(alias='attributes')


class AttributeSchema(BaseModel):
    id: int
    name: str
    type: str

    @validator('type', pre=True)
    def convert_to_str(cls, v):
        if isinstance(v, AttrType) or isinstance(v, AttrTypeMapping):
            return v.name
        elif isinstance(v, str):
            return v
        else:
            raise ValueError('valid types for type field: str, AttrType, AttrTypeMapping')

    class Config:
        orm_mode = True


class EntityBaseSchema(BaseModel):
    id: int
    slug: str
    name: str
    deleted: bool

    slug_validator = validator('slug', allow_reuse=True)(validate_slug)
    class Config:
        orm_mode = True


class EntityListSchema(BaseModel):
    total: int
    entities: List[dict]