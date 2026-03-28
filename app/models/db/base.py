from sqlalchemy.ext.asyncio import AsyncAttrs, create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase


class Base(AsyncAttrs, DeclarativeBase):
    pass
