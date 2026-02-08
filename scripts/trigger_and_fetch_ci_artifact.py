#!/usr/bin/env python3
"""Trigger the manual E2E workflow and fetch the `e2e-evidence` artifact when it's ready.

Usage:
  # Trigger a manual run and wait for artifact (recommended)
  export GITHUB_TOKEN=ghp_... && python3 scripts/trigger_and_fetch_ci_artifact.py --trigger

  # Just fetch the artifact for the latest completed run (no trigger)
  export GITHUB_TOKEN=ghp_... && python3 scripts/trigger_and_fetch_ci_artifact.py

Notes:
- Requires GITHUB_TOKEN env var to be set. For private repos, create a PAT with repository access and Actions permissions.
- The script will look for a workflow file named `e2e-manual.yml` by default and dispatch it on the 'master' branch.
"""

from __future__ import annotations

import os
import sys
import time
import argparse
import requests
import zipfile
import io
from pathlib import Path
from typing import Optional

REPO = "220631948/PythonGIS-Project"
WORKFLOW_FILENAME = "e2e-manual.yml"
BRANCH = "master"
ARTIFACT_NAME = "e2e-evidence"
OUTPUT_DIR = Path("frontend/tests/e2e/evidence_artifacts")
POLL_INTERVAL = 15  # seconds
MAX_RETRIES = 60  # up to 15 minutes


def get_token() -> str:
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("Error: GITHUB_TOKEN environment variable is missing.")
        print("Create a GitHub Personal Access Token and export it in your shell: )")
        print("  export GITHUB_TOKEN=ghp_...")
        sys.exit(1)
    return token


def headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


# Workflow helpers

def find_workflow_id(token: str, filename: str = WORKFLOW_FILENAME) -> Optional[int]:
    url = f"https://api.github.com/repos/{REPO}/actions/workflows"
    r = requests.get(url, headers=headers(token))
    r.raise_for_status()
    data = r.json()
    for wf in data.get("workflows", []):
        if wf.get("path", "").endswith(f"/{filename}") or wf.get("name") == filename:
            return wf.get("id")
    return None


def trigger_workflow(token: str, workflow_id: int, ref: str = BRANCH) -> bool:
    url = f"https://api.github.com/repos/{REPO}/actions/workflows/{workflow_id}/dispatches"
    body = {"ref": ref}
    r = requests.post(url, headers=headers(token), json=body)
    if r.status_code in (204, 201):
        print(f"Workflow dispatched (workflow_id={workflow_id}, ref={ref}).")
        return True
    print(f"Failed to dispatch workflow: {r.status_code} {r.text}")
    return False


# Poll for a recent workflow run for given workflow_id (if provided) or for HEAD commit on master

def find_latest_run_for_workflow(token: str, workflow_id: Optional[int] = None) -> Optional[dict]:
    if workflow_id:
        url = f"https://api.github.com/repos/{REPO}/actions/workflows/{workflow_id}/runs"
        params = {"branch": BRANCH, "event": "workflow_dispatch", "per_page": 5}
    else:
        url = f"https://api.github.com/repos/{REPO}/actions/runs"
        params = {"branch": BRANCH, "per_page": 5}

    r = requests.get(url, headers=headers(token), params=params)
    r.raise_for_status()
    data = r.json()
    runs = data.get("workflow_runs", [])
    if not runs:
        return None
    # Return the most recent
    return runs[0]


def wait_for_run_completion(token: str, workflow_id: Optional[int] = None) -> dict:
    retries = 0
    print("Waiting for workflow run to appear and complete...")
    while retries < MAX_RETRIES:
        run = find_latest_run_for_workflow(token, workflow_id)
        if run:
            run_id = run.get("id")
            status = run.get("status")
            concl = run.get("conclusion")
            print(f"Found run id={run_id} status={status} conclusion={concl}")
            if status == "completed":
                return run
            else:
                print("Run is in progress; waiting...")
        else:
            print("No run found yet; waiting...")
        time.sleep(POLL_INTERVAL)
        retries += 1

    raise RuntimeError("Timed out waiting for workflow run to complete")


def list_artifacts_for_run(token: str, run_id: int) -> list:
    url = f"https://api.github.com/repos/{REPO}/actions/runs/{run_id}/artifacts"
    r = requests.get(url, headers=headers(token))
    r.raise_for_status()
    return r.json().get("artifacts", [])


def download_artifact(token: str, download_url: str, output_path: Path) -> Path:
    # The archive_download_url requires authentication
    print(f"Downloading artifact to {output_path} ...")
    with requests.get(download_url, headers=headers(token), stream=True) as r:
        if r.status_code == 404:
            raise RuntimeError("Artifact not found (404). It might have expired.)")
        r.raise_for_status()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as fh:
            for chunk in r.iter_content(chunk_size=8192):
                fh.write(chunk)
    return output_path


def extract_zip(zip_path: Path, dest: Path) -> list:
    print(f"Extracting {zip_path} to {dest}")
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(dest)
    return [p for p in dest.rglob("*") if p.is_file()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--trigger", action="store_true", help="Trigger the manual workflow before waiting for artifact")
    parser.add_argument("--workflow-file", default=WORKFLOW_FILENAME, help="Workflow filename (defaults to e2e-manual.yml)")
    args = parser.parse_args()

    token = get_token()

    workflow_id = find_workflow_id(token, args.workflow_file)
    if not workflow_id:
        print(f"Workflow file {args.workflow_file} not found in repository workflows.")
        sys.exit(1)

    if args.trigger:
        print("Dispatching manual workflow run...")
        ok = trigger_workflow(token, workflow_id, BRANCH)
        if not ok:
            sys.exit(1)

    run = wait_for_run_completion(token, workflow_id)
    run_id = run.get("id")
    if run_id is None:
        print("Error: workflow run is missing an 'id' field.")
        sys.exit(1)
    try:
        # Ensure run_id is an int for subsequent API calls
        run_id = int(run_id)
    except (TypeError, ValueError):
        print(f"Error: unexpected run id value: {run_id!r}")
        sys.exit(1)

    conclusion = run.get("conclusion")

    if conclusion != "success":
        print(f"Workflow completed but concluded with: {conclusion}")
        # still attempt to fetch artifacts if available for debugging

    artifacts = list_artifacts_for_run(token, run_id)
    target = next((a for a in artifacts if a.get("name") == ARTIFACT_NAME), None)

    if not target:
        print("Could not find e2e-evidence artifact. Available artifacts:")
        for a in artifacts:
            print(" -", a.get("name"))
        sys.exit(1)

    # Download artifact
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = OUTPUT_DIR / f"{ARTIFACT_NAME}-{run_id}.zip"
    download_artifact(token, target.get("archive_download_url"), zip_path)

    # Extract and list contents
    extract_dir = OUTPUT_DIR / f"{ARTIFACT_NAME}-{run_id}"
    extracted_files = extract_zip(zip_path, extract_dir)

    print("Downloaded and extracted artifact. Files:")
    for p in extracted_files:
        print(" -", p)

    # Simple verification: check for 14 evidence images
    images = [p for p in extracted_files if p.suffix.lower() in (".png", ".jpg", ".jpeg")]
    logs = [p for p in extracted_files if p.suffix.lower() in (".log", ".txt")]

    print(f"Found {len(images)} screenshot images and {len(logs)} log files.")

    # Quick console log scan for errors
    error_logs = []
    for l in logs:
        with open(l, "r", encoding="utf-8", errors="replace") as fh:
            content = fh.read()
            if "error" in content.lower():
                error_logs.append((l, True))
            else:
                error_logs.append((l, False))

    if any(e for (_, e) in error_logs):
        print("Some logs contain 'error' (case-insensitive). Please review the following:")
        for (l, has_err) in error_logs:
            if has_err:
                print(" -", l)
        sys.exit(2)

    print("No errors found in console logs. E2E evidence looks clean (subject to manual review of screenshots).")


if __name__ == "__main__":
    main()
