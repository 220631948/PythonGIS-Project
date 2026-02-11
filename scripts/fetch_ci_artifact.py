#!/usr/bin/env python3
import os
import sys
import time
import requests
import zipfile
import io
from pathlib import Path

# Constants
REPO = "220631948/PythonGIS-Project"
BRANCH = "master"
ARTIFACT_NAME = "e2e-evidence"
OUTPUT_DIR = Path("frontend/tests/e2e/evidence")
POLL_INTERVAL = 30  # seconds
MAX_RETRIES = 20    # 10 minutes total

def get_token():
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("Error: GITHUB_TOKEN environment variable is missing.")
        print("Please export your GitHub Personal Access Token:")
        print("  export GITHUB_TOKEN=your_token_here")
        print("  python3 scripts/fetch_ci_artifact.py")
        sys.exit(1)
    return token

def get_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }

def get_latest_commit_sha(token):
    url = f"https://api.github.com/repos/{REPO}/commits/{BRANCH}"
    print(f"Fetching latest commit SHA for branch '{BRANCH}'...")
    response = requests.get(url, headers=get_headers(token))
    
    if response.status_code != 200:
        print(f"Error fetching commit: {response.status_code} {response.text}")
        sys.exit(1)
        
    data = response.json()
    sha = data["sha"]
    print(f"Latest commit SHA: {sha}")
    return sha

def get_workflow_run(token, sha):
    url = f"https://api.github.com/repos/{REPO}/actions/runs"
    params = {"head_sha": sha, "branch": BRANCH, "exclude_pull_requests": "true"}
    
    response = requests.get(url, headers=get_headers(token), params=params)
    
    if response.status_code != 200:
        print(f"Error fetching runs: {response.status_code} {response.text}")
        return None
        
    data = response.json()
    if data["total_count"] == 0:
        return None
        
    # Return the most recent run
    return data["workflow_runs"][0]

def list_artifacts(token, run_id):
    url = f"https://api.github.com/repos/{REPO}/actions/runs/{run_id}/artifacts"
    response = requests.get(url, headers=get_headers(token))
    
    if response.status_code != 200:
        print(f"Error listing artifacts: {response.status_code} {response.text}")
        return []
        
    return response.json().get("artifacts", [])

def download_artifact(token, download_url, output_path):
    print(f"Downloading artifact from {download_url}...")
    # Follow redirects is True by default in requests, but headers might need stripping for S3 redirect?
    # Actually, GitHub API docs say for artifacts, we pass the token to the initial request, 
    # and it returns a 302 to a location (blob storage).
    # Newer requests handles auth headers on redirect intelligently usually, but let's be safe.
    
    # We explicitly stream the response
    with requests.get(download_url, headers=get_headers(token), stream=True) as r:
        if r.status_code == 404:
             # Sometimes artifacts are expired
            print("Error: Artifact not found (404). It might have expired.")
            return False
        r.raise_for_status()
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
                
    print(f"Artifact saved to {output_path}")
    return True

def poll_for_successful_run(token, sha):
    retries = 0
    while retries < MAX_RETRIES:
        run = get_workflow_run(token, sha)
        if not run:
            print("No workflow run found yet. Waiting...")
        else:
            status = run["status"]
            conclusion = run["conclusion"]
            print(f"Run ID: {run['id']}, Status: {status}, Conclusion: {conclusion}")
            if status == "completed":
                if conclusion == "success":
                    print("Workflow run succeeded. Looking for artifacts...")
                    return run
                else:
                    print(f"Workflow run finished with conclusion: {conclusion}. Aborting.")
                    sys.exit(1)
            else:
                 print(f"Workflow run in progress ({status}). Waiting...")
        time.sleep(POLL_INTERVAL)
        retries += 1
    print("Timeout waiting for workflow run to complete.")
    sys.exit(1)

def find_and_download_artifact(token, run_id):
    artifacts = list_artifacts(token, run_id)
    target_artifact = next((a for a in artifacts if a["name"] == ARTIFACT_NAME), None)
    if not target_artifact:
        print(f"Artifact '{ARTIFACT_NAME}' not found in run {run_id}.")
        print("Available artifacts:", [a["name"] for a in artifacts])
        sys.exit(1)
    output_file = OUTPUT_DIR / f"{ARTIFACT_NAME}.zip"
    download_url = target_artifact["archive_download_url"]
    success = download_artifact(token, download_url, output_file)
    if success:
        print("Done.")
    else:
        sys.exit(1)

def main():
    token = get_token()
    sha = get_latest_commit_sha(token)
    print(f"Checking workflow runs for commit {sha}...")
    run = poll_for_successful_run(token, sha)
    find_and_download_artifact(token, run["id"])

if __name__ == "__main__":
    main()
