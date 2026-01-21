
import sys
import os

print("Script starting...")
sys.stdout.flush()

# Ensure we are in the correct directory for imports
if os.path.basename(os.getcwd()) != 'cape_town_geohub':
    # try to find it
    if os.path.exists('cape_town_geohub'):
        os.chdir('cape_town_geohub')

sys.path.insert(0, os.getcwd())

try:
    from app.spatial_analysis.site_suitability import site_analyzer
    from app.api.suitability_api import CriterionResultResponse
    import json
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Import Error: {e}")
    sys.exit(1)


def debug_suitability():
    print("Starting debug...")
    try:
        lat = -33.9249
        lng = 18.4241
        development_type = 'residential'

        print(f"Analyzing point: {lat}, {lng}")
        result = site_analyzer.analyze_point(lat, lng, development_type)
        print("Analysis complete.")
        print(f"Overall Score: {result.overall_score}")

        print("Constructing response objects...")
        responses = []
        for r in result.criteria_results:
            print(f"Processing result for {r.criterion}...")
            # This is where I suspect the issue is
            risk = "Low" if r.score > 70 else "Medium" if r.score > 40 else "High"

            resp = CriterionResultResponse(
                criterion=r.criterion,
                name=r.criterion.replace('_', ' ').title(),
                description=r.criterion.replace('_', ' ').title(),
                score=r.score,
                weight=r.weight,
                weighted_score=r.weighted_score,
                max_score=100,
                details=r.details,
                constraints=r.constraints,
                risk_level=risk,
                data_sources=[]
            )
            responses.append(resp)
        print("Response objects constructed successfully.")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_suitability()

