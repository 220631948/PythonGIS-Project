#!/usr/bin/env python3
"""
Audit Spatial Queries for Index Usage

This script:
1. Scans the codebase for spatial queries
2. Identifies tables being queried
3. Checks for spatial index usage
4. Generates recommendations for optimization

Usage:
    python scripts/audit_spatial_queries.py [--check-db]
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Any


# Pattern to find spatial queries
SPATIAL_PATTERNS = [
    r"ST_\w+\(",  # PostGIS spatial functions
    r"ST_DWithin",
    r"ST_Intersects",
    r"ST_Contains",
    r"ST_Distance",
    r"ST_Buffer",
    r"SELECT.*FROM\s+(\w+)",  # Table names in SELECT
    r"\.query\(['\"]SELECT",  # SQLAlchemy queries
    r"\.execute\(['\"]SELECT",  # Direct execute
]


def scan_file_for_queries(file_path: Path) -> List[Dict[str, Any]]:
    """Scan a Python file for spatial queries."""
    findings = []
    
    try:
        content = file_path.read_text()
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for spatial functions
            for pattern in SPATIAL_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    findings.append({
                        'file': str(file_path.relative_to(Path.cwd())),
                        'line': i,
                        'code': line.strip(),
                        'pattern': pattern,
                    })
                    break
    except Exception as e:
        print(f"Error scanning {file_path}: {e}")
    
    return findings


def extract_table_names(findings: List[Dict[str, Any]]) -> List[str]:
    """Extract unique table names from findings."""
    tables = set()
    
    for finding in findings:
        code = finding['code']
        
        # Try to extract table name from FROM clause
        match = re.search(r"FROM\s+([a-zA-Z_]\w+)", code, re.IGNORECASE)
        if match:
            tables.add(match.group(1))
    
    return sorted(tables)


def generate_index_recommendations(tables: List[str]) -> List[Dict[str, str]]:
    """Generate index creation recommendations."""
    recommendations = []
    
    for table in tables:
        # Assume standard geometry column name
        geometry_col = 'geom'
        
        recommendations.append({
            'table': table,
            'geometry_column': geometry_col,
            'sql': f"""
-- Create spatial index for {table}
CREATE INDEX IF NOT EXISTS {table}_{geometry_col}_gist_idx
ON {table}
USING GIST ({geometry_col});

-- Analyze table to update statistics
ANALYZE {table};
            """.strip()
        })
    
    return recommendations


def scan_codebase(base_path: Path = None) -> Dict[str, Any]:
    """Scan the entire codebase for spatial queries."""
    if base_path is None:
        base_path = Path.cwd()
    
    # Directories to scan
    app_dir = base_path / 'app'
    
    if not app_dir.exists():
        print(f"Error: {app_dir} not found")
        return {}
    
    # Scan all Python files
    all_findings = []
    
    for py_file in app_dir.rglob('*.py'):
        # Skip __pycache__ and test files
        if '__pycache__' in str(py_file) or 'test' in str(py_file):
            continue
        
        findings = scan_file_for_queries(py_file)
        all_findings.extend(findings)
    
    # Extract tables
    tables = extract_table_names(all_findings)
    
    # Generate recommendations
    recommendations = generate_index_recommendations(tables)
    
    return {
        'total_queries': len(all_findings),
        'findings': all_findings,
        'tables': tables,
        'recommendations': recommendations,
    }


def print_report(results: Dict[str, Any]):
    """Print audit report."""
    print("\n" + "=" * 80)
    print("SPATIAL QUERY AUDIT REPORT")
    print("=" * 80 + "\n")
    
    print(f"Total spatial queries found: {results['total_queries']}\n")
    
    if results['findings']:
        print("Query Locations:")
        print("-" * 80)
        
        # Group by file
        by_file = {}
        for finding in results['findings']:
            file = finding['file']
            if file not in by_file:
                by_file[file] = []
            by_file[file].append(finding)
        
        for file, findings in sorted(by_file.items()):
            print(f"\n📁 {file}")
            for finding in findings[:5]:  # Show first 5 per file
                print(f"   Line {finding['line']}: {finding['code'][:80]}")
            if len(findings) > 5:
                print(f"   ... and {len(findings) - 5} more")
    
    print("\n" + "-" * 80)
    print(f"\nTables requiring indexes: {len(results['tables'])}")
    if results['tables']:
        print("\nTables found:")
        for table in results['tables']:
            print(f"  • {table}")
    
    print("\n" + "-" * 80)
    print("\nIndex Recommendations:")
    print("-" * 80)
    
    if results['recommendations']:
        for rec in results['recommendations']:
            print(f"\n-- {rec['table']}")
            print(rec['sql'])
    else:
        print("No recommendations (no tables found)")
    
    print("\n" + "=" * 80)
    print("\nNext Steps:")
    print("=" * 80)
    print("""
1. Review the spatial queries identified above
2. Run EXPLAIN ANALYZE on slow queries to check index usage
3. Create missing spatial indexes using the SQL above
4. Use the benchmark API to verify performance improvements:
   
   POST /api/benchmark/analyze-spatial
   {
     "table_name": "table_name",
     "geometry_column": "geom",
     "test_lon": 18.4241,
     "test_lat": -33.9249,
     "radius_meters": 1000
   }

5. Monitor query performance in production
6. Update performance budgets as needed
    """)


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Audit spatial queries for index usage'
    )
    parser.add_argument(
        '--check-db',
        action='store_true',
        help='Check database for existing indexes (requires DB connection)'
    )
    
    args = parser.parse_args()
    
    print("🔍 Scanning codebase for spatial queries...")
    
    results = scan_codebase()
    
    if results:
        print_report(results)
    else:
        print("❌ Failed to scan codebase")
        return 1
    
    if args.check_db:
        print("\n⚠️  Database checking not yet implemented")
        print("Use the benchmark API: GET /api/benchmark/indexes/{table_name}")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
