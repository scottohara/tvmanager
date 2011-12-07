#!/bin/bash
PARENT_DIR="$(cd "$(dirname "$0")/../.." && pwd)";
SOURCE_DIR="${PARENT_DIR}/public"
OUTPUT_DIR="${PARENT_DIR}/testCoverage";
jscoverage --exclude=.git --exclude=.gitignore --no-instrument=framework --no-instrument=test/framework $SOURCE_DIR $OUTPUT_DIR
