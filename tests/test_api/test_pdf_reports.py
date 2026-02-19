import pytest
import asyncio
from unittest.mock import patch, MagicMock
from app.api.pdf_reports_api import (
    generate_report,
    get_report_templates,
    schedule_report,
    ReportGenerate,
    ReportSchedule,
    reports_db,
    templates_db
)

class TestPdfReportsApi:
    """Tests for PDF Reports API endpoints."""

    def test_get_templates(self):
        """Test getting available report templates."""
        result = asyncio.run(get_report_templates())
        assert "templates" in result
        assert len(result["templates"]) > 0
        assert result["templates"][0]["id"] == "urban_analysis"

    @patch("app.api.pdf_reports_api._generate_pdf")
    def test_generate_report_success(self, mock_generate_pdf):
        """Test successful report generation request."""
        async def run_test():
            # Setup input data
            report_data = {
                "template_id": "urban_analysis",
                "title": "Test Report",
                "data": {"some": "data"},
                "sections": ["executive_summary"],
                "format": "pdf"
            }
            # We must use kwargs because MockBaseModel uses them
            report = ReportGenerate(**report_data)

            # Mock background tasks
            background_tasks = MagicMock()

            # Call handler
            response = await generate_report(report, background_tasks)

            # Verify response
            assert response["success"] is True
            assert "report_id" in response
            assert response["message"] == "Report generation started"

            # Verify background task was added
            background_tasks.add_task.assert_called_once()
            args, _ = background_tasks.add_task.call_args
            # args[0] is the function _generate_pdf (which is mocked by patch)
            assert args[0] == mock_generate_pdf
            assert args[1] == response["report_id"]
            # Since we mocked BaseModel, .dict() returns the dict
            # Check dict content
            assert args[2]["title"] == "Test Report"

            # Check reports_db was updated
            assert any(r["id"] == response["report_id"] for r in reports_db)

        asyncio.run(run_test())

    def test_schedule_report_success(self):
        """Test successful report scheduling."""
        async def run_test():
            schedule_data = {
                "template_id": "urban_analysis",
                "name": "Weekly Report",
                "frequency": "weekly",
                "recipients": ["test@example.com"],
                "data_sources": ["crime_stats"]
            }
            schedule = ReportSchedule(**schedule_data)

            response = await schedule_report(schedule)

            assert response["success"] is True
            assert "schedule_id" in response
            assert "Report scheduled" in response["message"]

        asyncio.run(run_test())

    @patch("app.api.pdf_reports_api.reports_db")
    def test_generate_report_exception(self, mock_db):
        """Test exception handling in generate_report."""
        async def run_test():
            # Make append raise an exception
            mock_db.append.side_effect = Exception("Database error")

            report = ReportGenerate(
                template_id="t", title="t", data={}, sections=[], format="pdf"
            )
            background_tasks = MagicMock()

            # Expect Exception (HTTPException is mocked as Exception)
            with pytest.raises(Exception) as excinfo:
                 await generate_report(report, background_tasks)

            assert "Database error" in str(excinfo.value)

        asyncio.run(run_test())
