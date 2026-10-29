#!/usr/bin/env bash
# ==============================================================================
# Firebase Test Lab Automated Test Execution Script
# Runs Robo Test with Robo Script JSON on Physical & Virtual Matrix
# ==============================================================================

set -e

APK_PATH="./firebase/TodoMaster-Release.apk"
ROBO_SCRIPT="./firebase/firebase-robo-script.json"

if [ ! -f "$APK_PATH" ]; then
  echo "Error: APK not found at $APK_PATH"
  exit 1
fi

echo "=========================================================="
echo "Starting Google Firebase Test Lab Robo Test Run"
echo "Target APK: $APK_PATH (Signed Production Release)"
echo "Robo Script JSON: $ROBO_SCRIPT"
echo "=========================================================="

gcloud firebase test android run \
  --type robo \
  --app "$APK_PATH" \
  --robo-script "$ROBO_SCRIPT" \
  --device model=panther,version=33,locale=en,orientation=portrait \
  --device model=oriole,version=31,locale=en,orientation=portrait \
  --device model=dm3q,version=33,locale=en,orientation=portrait \
  --device model=Pixel2,version=30,locale=en,orientation=portrait \
  --timeout 3m \
  --results-bucket="gs://todomaster-testlab-results" \
  --use-orchestrator

echo "=========================================================="
echo "Test Lab Execution Submitted Successfully!"
echo "Check your Firebase Console for live video and logs."
echo "=========================================================="
