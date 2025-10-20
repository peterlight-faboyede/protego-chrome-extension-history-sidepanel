import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.app import create_app
from db.session import get_db
from models.visit import Base

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_engine():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_visit_data():
    return {
        "url": "https://example.com",
        "title": "Example Domain",
        "description": "Example website for testing",
        "link_count": 10,
        "word_count": 500,
        "image_count": 5
    }


@pytest.fixture
def sample_visits_batch():
    return [
        {
            "url": "https://example.com",
            "title": "Example 1",
            "description": "Test 1",
            "link_count": 10,
            "word_count": 500,
            "image_count": 5
        },
        {
            "url": "https://example.org",
            "title": "Example 2",
            "description": "Test 2",
            "link_count": 15,
            "word_count": 750,
            "image_count": 8
        }
    ]

