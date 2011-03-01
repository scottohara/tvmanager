#!/bin/bash
PARENT_DIR="$(cd "$(dirname "$0")/.." && pwd)";
OUTPUT_DIR="${PARENT_DIR}Coverage";
jscoverage --exclude=.git --exclude=.gitignore --no-instrument=src/framework --no-instrument=test/framework $PARENT_DIR $OUTPUT_DIR