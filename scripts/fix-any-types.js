#!/usr/bin/env node

/**
 * Script to automatically replace common 'any' type patterns
 * with proper TypeScript types
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common 'any' patterns and their replacements
const replacements = [
  // Error handling
  { pattern: /: any\) => void/g, replacement: ': unknown) => void', description: 'Error callback parameter' },
  { pattern: /: any\) \{/g, replacement: ': unknown) {', description: 'Error callback parameter in arrow function' },
  { pattern: /catch \(error: any\)/g, replacement: 'catch (error: unknown)', description: 'Catch block error' },
  { pattern: /catch\(error: any\)/g, replacement: 'catch(error: unknown)', description: 'Catch block error (no space)' },
  { pattern: /\(error: any\) =>/g, replacement: '(error: unknown) =>', description: 'Error arrow function param' },
  { pattern: /\(err: any\) =>/g, replacement: '(err: unknown) =>', description: 'Err arrow function param' },
  { pattern: /catch \(err: any\)/g, replacement: 'catch (err: unknown)', description: 'Catch block err' },
  { pattern: /catch\(err: any\)/g, replacement: 'catch(err: unknown)', description: 'Catch block err (no space)' },

  // Event handlers
  { pattern: /\(e: any\) =>/g, replacement: '(e: React.FormEvent) =>', description: 'Event handler e param' },
  { pattern: /\(event: any\) =>/g, replacement: '(event: React.FormEvent) =>', description: 'Event handler event param' },

  // Object types
  { pattern: /: Record<string, any>/g, replacement: ': Record<string, unknown>', description: 'Record with any value' },
  { pattern: /: \{ \[key: string\]: any \}/g, replacement: ': { [key: string]: unknown }', description: 'Index signature with any' },
  { pattern: /: Array<any>/g, replacement: ': Array<unknown>', description: 'Array of any' },
  { pattern: /: any\[\]/g, replacement: ': unknown[]', description: 'Any array shorthand' },

  // Function parameters and returns
  { pattern: /\(data: any\)/g, replacement: '(data: unknown)', description: 'Data parameter' },
  { pattern: /\(value: any\)/g, replacement: '(value: unknown)', description: 'Value parameter' },
  { pattern: /\(item: any\)/g, replacement: '(item: unknown)', description: 'Item parameter' },
  { pattern: /\(obj: any\)/g, replacement: '(obj: unknown)', description: 'Object parameter' },
  { pattern: /: any\)/g, replacement: ': unknown)', description: 'Function parameter' },
  { pattern: /: any =>/g, replacement: ': unknown =>', description: 'Arrow function param' },
  { pattern: /: Promise<any>/g, replacement: ': Promise<unknown>', description: 'Promise of any' },

  // JSON types
  { pattern: /JSON\.parse\(.*?\) as any/g, replacement: 'JSON.parse($&) as Record<string, unknown>', description: 'JSON.parse cast to any' },
];

// Get all TypeScript files from lint output
function getFilesWithAnyWarnings() {
  try {
    const lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const lines = lintOutput.split('\n');
    const files = new Set();

    let currentFile = null;
    for (const line of lines) {
      // Check if it's a file path line
      if (line.startsWith('/Users/') && (line.endsWith('.ts') || line.endsWith('.tsx'))) {
        currentFile = line.trim();
      } else if (currentFile && line.includes('@typescript-eslint/no-explicit-any')) {
        files.add(currentFile);
      }
    }

    return Array.from(files);
  } catch (error) {
    console.error('Error running lint:', error.message);
    return [];
  }
}

// Apply replacements to a file
function fixFileAnyTypes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changes = 0;

    for (const { pattern, replacement, description } of replacements) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        changes += matches.length;
        console.log(`  ✓ Fixed ${matches.length} occurrences: ${description}`);
      }
    }

    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return changes;
    }

    return 0;
  } catch (error) {
    console.error(`Error fixing file ${filePath}:`, error.message);
    return 0;
  }
}

// Main execution
console.log('🔍 Finding files with "any" type warnings...\n');
const files = getFilesWithAnyWarnings();

if (files.length === 0) {
  console.log('No files with "any" warnings found!');
  process.exit(0);
}

console.log(`Found ${files.length} files with "any" warnings\n`);
console.log('🔧 Applying automatic fixes...\n');

let totalChanges = 0;
for (const file of files) {
  const relPath = file.replace(process.cwd() + '/', '');
  console.log(`\n📝 Processing: ${relPath}`);
  const changes = fixFileAnyTypes(file);
  totalChanges += changes;

  if (changes === 0) {
    console.log('  ℹ️  No automatic fixes available');
  }
}

console.log(`\n\n✅ Complete! Made ${totalChanges} automatic replacements across ${files.length} files`);
console.log('\n🔍 Run "npm run lint" to see remaining "any" warnings that need manual fixes\n');
