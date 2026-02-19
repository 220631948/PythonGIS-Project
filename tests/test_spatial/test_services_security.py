import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy import text
from app.spatial_analysis.services import ServicesAnalyzer

class TestServicesAnalyzerSecurity:

    @patch('app.spatial_analysis.services.require_engine')
    def test_run_analysis_uses_bind_params(self, mock_require_engine):
        """
        Verify that the `simplify` parameter is passed as a bind parameter
        and NOT injected directly into the SQL string.
        """
        # Setup mock
        mock_engine = MagicMock()
        mock_conn = MagicMock()
        mock_require_engine.return_value = mock_engine

        # Configure context manager for connection
        mock_engine.connect.return_value.__enter__.return_value = mock_conn

        # Mock execute result
        mock_result = MagicMock()
        mock_result.scalar.return_value = '{"test": "result"}'
        mock_conn.execute.return_value = mock_result

        # Instantiate analyzer
        analyzer = ServicesAnalyzer()

        # Test with simplify parameter
        simplify_val = 0.0012345
        analyzer.run_analysis(simplify=simplify_val)

        # Verify execute was called
        assert mock_conn.execute.called, "execute should have been called"

        # Inspect call args
        args, kwargs = mock_conn.execute.call_args

        # The first arg should be the text() construct
        query_obj = args[0]
        # Inspect the SQL string inside the TextClause
        query_str = str(query_obj)

        # 1. Verify the simplify value is NOT directly in the SQL string
        assert str(simplify_val) not in query_str, \
            f"Vulnerability found: simplify value {simplify_val} found directly in SQL string!"

        # 2. Verify the SQL string uses the bind parameter placeholder
        assert ":simplify_val" in query_str, \
            "Expected bind parameter :simplify_val not found in SQL string"

        # 3. Verify the simplify value is passed in the parameters
        # Depending on how it's called, params might be the second arg or in kwargs
        params = {}
        if len(args) > 1:
            params = args[1]
        elif 'parameters' in kwargs:
            params = kwargs['parameters']
        elif kwargs:
             params = kwargs

        assert params.get('simplify_val') == simplify_val, \
            f"Expected simplify_val {simplify_val} in parameters, found {params.get('simplify_val')}"
