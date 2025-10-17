#!/bin/bash

# Script to batch fix common 'any' type patterns in TypeScript files

# Fix pattern: (error: any) => to (error: unknown) =>
find src -type f -name "*.ts" -o -name "*.tsx" | while read file; do
  sed -i.bak 's/(error: any)/(error: unknown)/g' "$file"
  sed -i.bak 's/(e: any)/(e: unknown)/g' "$file"
  sed -i.bak 's/(err: any)/(err: unknown)/g' "$file"
  sed -i.bak 's/(data: any)/(data: Record<string, unknown>)/g' "$file"
  sed -i.bak 's/(body: any)/(body: Record<string, unknown>)/g' "$file"
  sed -i.bak 's/(result: any)/(result: Record<string, unknown>)/g' "$file"
  sed -i.bak 's/(response: any)/(response: Record<string, unknown>)/g' "$file"
  sed -i.bak 's/(value: any)/(value: unknown)/g' "$file"
  sed -i.bak 's/(item: any)/(item: Record<string, unknown>)/g' "$file"
  sed -i.bak 's/(obj: any)/(obj: Record<string, unknown>)/g' "$file"

  # Remove backup files
  rm -f "$file.bak"
done

echo "Fixed common 'any' type patterns"
