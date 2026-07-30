"""
PostGIS Query Benchmarking and Index Tuning Utilities

Provides tools for:
- EXPLAIN ANALYZE query execution
- Index usage analysis
- Performance recommendations
- Spatial index optimization
"""

import logging
import time
from typing import Dict, Any, Optional, List
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class PostGISBenchmark:
    """Benchmark and analyze PostGIS queries."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def explain_analyze(self, query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute EXPLAIN ANALYZE on a query and return detailed execution plan.
        
        Args:
            query: SQL query to analyze
            params: Query parameters
            
        Returns:
            Dict with execution plan, timing, and index usage
        """
        try:
            # Execute EXPLAIN ANALYZE
            explain_query = f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {query}"
            
            result = await self.session.execute(text(explain_query), params or {})
            explain_data = result.scalar()
            
            # Parse the JSON result
            if isinstance(explain_data, list) and len(explain_data) > 0:
                plan = explain_data[0]
            else:
                plan = explain_data
            
            # Extract key metrics
            execution_time = plan.get('Execution Time', 0)
            planning_time = plan.get('Planning Time', 0)
            
            return {
                'success': True,
                'execution_time_ms': execution_time,
                'planning_time_ms': planning_time,
                'total_time_ms': execution_time + planning_time,
                'plan': plan,
                'uses_index': self._check_index_usage(plan),
                'recommendations': self._generate_recommendations(plan),
            }
            
        except Exception as e:
            logger.error(f"EXPLAIN ANALYZE failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    def _check_index_usage(self, plan: Dict[str, Any]) -> bool:
        """Check if the query uses spatial indexes."""
        plan_str = str(plan).lower()
        
        # Look for index scan indicators
        index_indicators = [
            'index scan',
            'index only scan',
            'bitmap index scan',
            'gist',  # GiST index (spatial)
        ]
        
        return any(indicator in plan_str for indicator in index_indicators)
    
    def _generate_recommendations(self, plan: Dict[str, Any]) -> List[str]:
        """Generate optimization recommendations based on execution plan."""
        recommendations = []
        plan_str = str(plan).lower()
        
        # Check for sequential scans
        if 'seq scan' in plan_str:
            recommendations.append(
                "Sequential scan detected. Consider adding a spatial index (GiST) if querying geometry columns."
            )
        
        # Check for nested loops
        if 'nested loop' in plan_str:
            recommendations.append(
                "Nested loop join detected. May benefit from index on join column."
            )
        
        # Check for high planning time
        planning_time = plan.get('Planning Time', 0)
        if planning_time > 100:
            recommendations.append(
                f"High planning time ({planning_time:.2f}ms). Consider using prepared statements or connection pooling."
            )
        
        # Check for execution time
        execution_time = plan.get('Execution Time', 0)
        if execution_time > 1000:
            recommendations.append(
                f"Slow execution time ({execution_time:.2f}ms). Review query complexity and data volume."
            )
        
        return recommendations
    
    async def benchmark_query(
        self,
        query: str,
        params: Optional[Dict[str, Any]] = None,
        iterations: int = 5
    ) -> Dict[str, Any]:
        """
        Benchmark a query by running it multiple times and collecting statistics.
        
        Args:
            query: SQL query to benchmark
            params: Query parameters
            iterations: Number of times to run the query
            
        Returns:
            Dict with timing statistics
        """
        timings = []
        
        try:
            for i in range(iterations):
                start_time = time.time()
                
                await self.session.execute(text(query), params or {})
                
                end_time = time.time()
                duration_ms = (end_time - start_time) * 1000
                timings.append(duration_ms)
                
                logger.info(f"Iteration {i+1}/{iterations}: {duration_ms:.2f}ms")
            
            # Calculate statistics
            avg_time = sum(timings) / len(timings)
            min_time = min(timings)
            max_time = max(timings)
            
            return {
                'success': True,
                'iterations': iterations,
                'avg_time_ms': avg_time,
                'min_time_ms': min_time,
                'max_time_ms': max_time,
                'timings': timings,
            }
            
        except Exception as e:
            logger.error(f"Benchmark failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'iterations_completed': len(timings),
                'timings': timings,
            }
    
    async def check_indexes(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Check what indexes exist on a table.
        
        Args:
            table_name: Name of the table to check
            
        Returns:
            List of index information
        """
        try:
            query = text("""
                SELECT
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE tablename = :table_name
                ORDER BY indexname;
            """)
            
            result = await self.session.execute(query, {'table_name': table_name})
            rows = result.fetchall()
            
            indexes = []
            for row in rows:
                indexes.append({
                    'schema': row.schemaname,
                    'table': row.tablename,
                    'name': row.indexname,
                    'definition': row.indexdef,
                    'is_spatial': 'gist' in row.indexdef.lower(),
                })
            
            return indexes
            
        except Exception as e:
            logger.error(f"Failed to check indexes: {e}")
            return []
    
    async def suggest_spatial_index(self, table_name: str, geometry_column: str = 'geom') -> str:
        """
        Generate SQL for creating a spatial index.
        
        Args:
            table_name: Name of the table
            geometry_column: Name of the geometry column (default: 'geom')
            
        Returns:
            SQL statement to create the index
        """
        index_name = f"{table_name}_{geometry_column}_gist_idx"
        
        sql = f"""
CREATE INDEX IF NOT EXISTS {index_name}
ON {table_name}
USING GIST ({geometry_column});
        """.strip()
        
        return sql
    
    async def analyze_spatial_query(
        self,
        table_name: str,
        geometry_column: str = 'geom',
        test_point: tuple = (18.4241, -33.9249),  # Cape Town default
        radius_meters: float = 1000
    ) -> Dict[str, Any]:
        """
        Analyze performance of a typical spatial query.
        
        Args:
            table_name: Name of the table to query
            geometry_column: Name of the geometry column
            test_point: (lon, lat) for testing
            radius_meters: Search radius in meters
            
        Returns:
            Analysis results with timing and recommendations
        """
        try:
            # Build a typical spatial query
            query = f"""
                SELECT COUNT(*)
                FROM {table_name}
                WHERE ST_DWithin(
                    {geometry_column}::geography,
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                    :radius
                )
            """
            
            params = {
                'lon': test_point[0],
                'lat': test_point[1],
                'radius': radius_meters,
            }
            
            # Check existing indexes
            indexes = await self.check_indexes(table_name)
            has_spatial_index = any(idx['is_spatial'] for idx in indexes)
            
            # Run EXPLAIN ANALYZE
            explain_result = await self.explain_analyze(query, params)
            
            # Run benchmark
            benchmark_result = await self.benchmark_query(query, params, iterations=3)
            
            # Generate recommendation
            recommendation = None
            if not has_spatial_index:
                recommendation = await self.suggest_spatial_index(table_name, geometry_column)
            
            return {
                'table': table_name,
                'has_spatial_index': has_spatial_index,
                'indexes': indexes,
                'explain': explain_result,
                'benchmark': benchmark_result,
                'recommendation': recommendation,
            }
            
        except Exception as e:
            logger.error(f"Spatial query analysis failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }


async def run_benchmark_suite(session: AsyncSession, tables: List[str]) -> Dict[str, Any]:
    """
    Run a comprehensive benchmark suite on multiple tables.
    
    Args:
        session: Database session
        tables: List of table names to benchmark
        
    Returns:
        Dict with results for all tables
    """
    benchmark = PostGISBenchmark(session)
    results = {}
    
    for table in tables:
        logger.info(f"Benchmarking table: {table}")
        try:
            result = await benchmark.analyze_spatial_query(table)
            results[table] = result
        except Exception as e:
            logger.error(f"Failed to benchmark {table}: {e}")
            results[table] = {'success': False, 'error': str(e)}
    
    return {
        'tables': results,
        'summary': {
            'total_tables': len(tables),
            'successful': sum(1 for r in results.values() if r.get('success', True)),
            'failed': sum(1 for r in results.values() if not r.get('success', True)),
        }
    }
