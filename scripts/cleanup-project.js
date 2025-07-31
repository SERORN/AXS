#!/usr/bin/env node

/**
 * AXS360 Project Cleanup Script
 * Cleans unused files, dependencies, and validates the project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 AXS360 Project Cleanup Starting...\n');

// Utility functions
const log = {
  info: (msg) => console.log('ℹ️  ' + msg),
  success: (msg) => console.log('✅ ' + msg),
  error: (msg) => console.log('❌ ' + msg),
  warn: (msg) => console.log('⚠️  ' + msg),
  step: (msg) => console.log('\n🔄 ' + msg)
};

// Function to run command safely
function runCommand(command, description) {
  log.step(description);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    if (output.trim()) {
      console.log(output);
    }
    log.success(`${description} - Completed`);
    return true;
  } catch (error) {
    log.error(`${description} - Failed: ${error.message}`);
    return false;
  }
}

// Function to check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Function to remove file/directory safely
function removeIfExists(itemPath, description) {
  if (fileExists(itemPath)) {
    try {
      if (fs.statSync(itemPath).isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
      log.success(`Removed ${description}: ${itemPath}`);
      return true;
    } catch (error) {
      log.error(`Failed to remove ${description}: ${error.message}`);
      return false;
    }
  } else {
    log.info(`${description} not found: ${itemPath}`);
    return false;
  }
}

// Main cleanup function
async function cleanup() {
  try {
    // 1. Check for unused dependencies
    log.step('Checking for unused dependencies...');
    if (runCommand('depcheck', 'Dependency analysis')) {
      log.info('Review the output above for unused dependencies');
    }

    // 2. TypeScript type checking
    log.step('Running TypeScript type checking...');
    runCommand('npx tsc --noEmit', 'TypeScript validation');

    // 3. Clean temporary files and directories
    log.step('Cleaning temporary files...');
    const tempPaths = [
      'node_modules/.cache',
      '.vite',
      'dist',
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      '.npm',
      '.eslintcache'
    ];

    tempPaths.forEach(item => {
      if (item.includes('*')) {
        // Handle glob patterns (simplified)
        const files = fs.readdirSync('.').filter(file => file.endsWith(item.replace('*', '')));
        files.forEach(file => removeIfExists(file, 'temporary file'));
      } else {
        removeIfExists(item, 'temporary directory/file');
      }
    });

    // 4. Check .gitignore completeness
    log.step('Validating .gitignore...');
    const gitignoreContent = fileExists('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : '';
    const requiredIgnores = [
      'node_modules',
      '.env',
      '.env.local',
      'dist',
      '.vite',
      '*.log',
      '.DS_Store',
      'Thumbs.db'
    ];

    const missingIgnores = requiredIgnores.filter(item => !gitignoreContent.includes(item));
    if (missingIgnores.length > 0) {
      log.warn(`Missing .gitignore entries: ${missingIgnores.join(', ')}`);
    } else {
      log.success('.gitignore is complete');
    }

    // 5. Check for sensitive files
    log.step('Checking for sensitive files...');
    const sensitivePatterns = ['.env', 'private', 'secret', 'key', 'password'];
    let sensitiveFound = false;
    
    function checkDirectory(dir) {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          checkDirectory(fullPath);
        } else {
          sensitivePatterns.forEach(pattern => {
            if (item.toLowerCase().includes(pattern) && !item.includes('.example')) {
              log.warn(`Potential sensitive file found: ${fullPath}`);
              sensitiveFound = true;
            }
          });
        }
      });
    }
    
    checkDirectory('.');
    if (!sensitiveFound) {
      log.success('No sensitive files detected in repository');
    }

    // 6. Validate package.json scripts
    log.step('Validating package.json scripts...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = ['dev', 'build', 'type-check', 'setup'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      log.warn(`Missing package.json scripts: ${missingScripts.join(', ')}`);
    } else {
      log.success('All required scripts are present');
    }

    // 7. Final cleanup commands
    log.step('Running final cleanup commands...');
    runCommand('npm prune', 'Removing unused packages');
    runCommand('npm dedupe', 'Deduplicating packages');

    // Summary
    console.log('\n' + '='.repeat(50));
    log.success('Project cleanup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Review any warnings above');
    console.log('2. Run: npm run type-check');
    console.log('3. Run: npm run dev:full');
    console.log('4. Test all functionality');
    console.log('5. Commit changes to git\n');

  } catch (error) {
    log.error(`Cleanup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run cleanup
cleanup().catch(error => {
  log.error(`Cleanup script error: ${error.message}`);
  process.exit(1);
});
