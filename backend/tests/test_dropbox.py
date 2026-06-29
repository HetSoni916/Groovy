import pytest
from app.services.dropbox_service import DropboxService


@pytest.fixture
def service():
    return DropboxService()


def test_supported_extensions(service):
    assert ".mp4" in service.supported_extensions
    assert ".mov" in service.supported_extensions
    assert ".avi" in service.supported_extensions
    assert ".mkv" in service.supported_extensions
    assert ".webm" in service.supported_extensions


def test_validate_access_invalid_url(service):
    result = service.validate_access("https://example.com/not-dropbox")
    assert result["valid"] is False
    assert "error" in result


def test_list_video_files_empty(service):
    files = service.list_video_files("https://www.dropbox.com/s/abc123")
    assert isinstance(files, list)


def test_close(service):
    service.close()  # Should not raise