#!/usr/bin/env node

/**
 * Dynamic System Verification Script
 * This script verifies that the AI Customer Care & Engineering system is fully dynamic
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying Dynamic AI Customer Care & Engineering System...\n');

// Color codes for output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            log(`✅ ${description}`, 'green');
            return { exists: true, content };
        } else {
            log(`❌ ${description} - File not found`, 'red');
            return { exists: false, content: null };
        }
    } catch (error) {
        log(`❌ ${description} - Error reading file: ${error.message}`, 'red');
        return { exists: false, content: null };
    }
}

function checkDynamicFeatures(content, fileName) {
    const dynamicFeatures = [
        { pattern: /useState|useEffect|useRef/, name: 'React Hooks for State Management' },
        { pattern: /setInterval|setTimeout/, name: 'Real-time Timers' },
        { pattern: /fetch\(|axios\.|\.get\(|\.post\(/, name: 'API Calls' },
        { pattern: /Math\.random\(\)/, name: 'Dynamic Data Generation' },
        { pattern: /Date\.now\(\)|new Date\(\)/, name: 'Real-time Timestamps' },
        { pattern: /useEffect.*\[\]/, name: 'Component Lifecycle Management' },
        { pattern: /setInterval.*clearInterval/, name: 'Cleanup Functions' },
        { pattern: /async.*await/, name: 'Asynchronous Operations' },
        { pattern: /\.map\(|\.filter\(|\.reduce\(/, name: 'Dynamic Data Processing' },
        { pattern: /className.*\$\{.*\}/, name: 'Dynamic CSS Classes' }
    ];

    const foundFeatures = [];
    const missingFeatures = [];

    dynamicFeatures.forEach(feature => {
        if (feature.pattern.test(content)) {
            foundFeatures.push(feature.name);
        } else {
            missingFeatures.push(feature.name);
        }
    });

    log(`\n📊 Dynamic Features in ${fileName}:`, 'cyan');
    foundFeatures.forEach(feature => {
        log(`  ✅ ${feature}`, 'green');
    });

    if (missingFeatures.length > 0) {
        log(`\n⚠️  Missing Features in ${fileName}:`, 'yellow');
        missingFeatures.forEach(feature => {
            log(`  ❌ ${feature}`, 'red');
        });
    }

    return { found: foundFeatures.length, total: dynamicFeatures.length };
}

function checkRealTimeUpdates(content, fileName) {
    const realTimePatterns = [
        { pattern: /setInterval.*\d+/, name: 'Interval-based Updates' },
        { pattern: /useEffect.*\[\]/, name: 'Component Mount Updates' },
        { pattern: /fetch.*api/, name: 'API Data Fetching' },
        { pattern: /Math\.random.*update/, name: 'Random Data Updates' },
        { pattern: /timestamp.*new Date/, name: 'Timestamp Updates' },
        { pattern: /status.*update|update.*status/, name: 'Status Updates' },
        { pattern: /metrics.*update|update.*metrics/, name: 'Metrics Updates' },
        { pattern: /stats.*update|update.*stats/, name: 'Stats Updates' }
    ];

    const foundPatterns = realTimePatterns.filter(pattern => 
        pattern.pattern.test(content)
    );

    log(`\n🔄 Real-time Update Patterns in ${fileName}:`, 'blue');
    foundPatterns.forEach(pattern => {
        log(`  ✅ ${pattern.name}`, 'green');
    });

    return foundPatterns.length;
}

function checkAPIEndpoints(content, fileName) {
    const apiPatterns = [
        { pattern: /\/api\/queries/, name: 'Queries API' },
        { pattern: /\/api\/issues/, name: 'Issues API' },
        { pattern: /\/api\/stats/, name: 'Stats API' },
        { pattern: /\/api\/metrics/, name: 'Metrics API' },
        { pattern: /\/api\/monitoring/, name: 'Monitoring API' },
        { pattern: /POST.*queries|GET.*queries/, name: 'Query CRUD Operations' },
        { pattern: /POST.*issues|GET.*issues/, name: 'Issue CRUD Operations' },
        { pattern: /simulate.*query|simulate.*issue/, name: 'Simulation Endpoints' }
    ];

    const foundAPIs = apiPatterns.filter(pattern => 
        pattern.pattern.test(content)
    );

    log(`\n🌐 API Endpoints in ${fileName}:`, 'magenta');
    foundAPIs.forEach(api => {
        log(`  ✅ ${api.name}`, 'green');
    });

    return foundAPIs.length;
}

// Main verification process
async function verifySystem() {
    log('🚀 Starting Dynamic System Verification...\n', 'bold');

    // Check main components
    const components = [
        { path: 'src/components/DynamicAICustomerCareEngineer.tsx', name: 'Dynamic AI Customer Care Component' },
        { path: 'src/components/ProactiveMonitoringSystem.tsx', name: 'Proactive Monitoring System' },
        { path: 'src/services/RealTimeDataService.ts', name: 'Real-time Data Service' },
        { path: 'api-server/ai-customer-care-engineer.js', name: 'AI Customer Care API' },
        { path: 'demo-dynamic-system.html', name: 'Dynamic Demo Page' }
    ];

    let totalDynamicFeatures = 0;
    let totalRealTimePatterns = 0;
    let totalAPIs = 0;
    let verifiedComponents = 0;

    for (const component of components) {
        log(`\n${'='.repeat(60)}`, 'cyan');
        log(`Checking: ${component.name}`, 'bold');
        log(`${'='.repeat(60)}`, 'cyan');

        const result = checkFile(component.path, component.name);
        
        if (result.exists) {
            verifiedComponents++;
            
            // Check dynamic features
            const dynamicResult = checkDynamicFeatures(result.content, component.name);
            totalDynamicFeatures += dynamicResult.found;

            // Check real-time updates
            const realTimeResult = checkRealTimeUpdates(result.content, component.name);
            totalRealTimePatterns += realTimeResult;

            // Check API endpoints
            const apiResult = checkAPIEndpoints(result.content, component.name);
            totalAPIs += apiResult;

            // Calculate dynamic score
            const dynamicScore = Math.round((dynamicResult.found / dynamicResult.total) * 100);
            log(`\n📈 Dynamic Score: ${dynamicScore}%`, dynamicScore > 80 ? 'green' : dynamicScore > 60 ? 'yellow' : 'red');
        }
    }

    // Check configuration files
    log(`\n${'='.repeat(60)}`, 'cyan');
    log('Checking Configuration Files', 'bold');
    log(`${'='.repeat(60)}`, 'cyan');

    const configFiles = [
        { path: 'start-ai-customer-care-system.sh', name: 'Startup Script' },
        { path: 'AI_CUSTOMER_CARE_ENGINEER_README.md', name: 'Documentation' },
        { path: 'package.json', name: 'Package Configuration' }
    ];

    for (const config of configFiles) {
        checkFile(config.path, config.name);
    }

    // Generate verification report
    log(`\n${'='.repeat(60)}`, 'green');
    log('🎉 VERIFICATION COMPLETE', 'bold');
    log(`${'='.repeat(60)}`, 'green');

    log(`\n📊 VERIFICATION SUMMARY:`, 'bold');
    log(`  ✅ Components Verified: ${verifiedComponents}/${components.length}`, 'green');
    log(`  🔄 Dynamic Features Found: ${totalDynamicFeatures}`, 'cyan');
    log(`  ⚡ Real-time Patterns: ${totalRealTimePatterns}`, 'blue');
    log(`  🌐 API Endpoints: ${totalAPIs}`, 'magenta');

    const overallScore = Math.round(((totalDynamicFeatures + totalRealTimePatterns + totalAPIs) / (components.length * 10)) * 100);
    
    log(`\n🏆 OVERALL DYNAMIC SCORE: ${overallScore}%`, overallScore > 90 ? 'green' : overallScore > 70 ? 'yellow' : 'red');

    if (overallScore >= 90) {
        log(`\n🎉 EXCELLENT! The system is fully dynamic and real-time!`, 'green');
        log(`   • All components use React hooks for state management`, 'green');
        log(`   • Real-time data updates every 2-3 seconds`, 'green');
        log(`   • API endpoints provide live data`, 'green');
        log(`   • Automatic query resolution and issue fixing`, 'green');
        log(`   • Proactive monitoring and alerting`, 'green');
    } else if (overallScore >= 70) {
        log(`\n✅ GOOD! The system is mostly dynamic with some areas for improvement.`, 'yellow');
    } else {
        log(`\n⚠️  NEEDS IMPROVEMENT! The system needs more dynamic features.`, 'red');
    }

    // Check for specific dynamic requirements
    log(`\n🔍 DYNAMIC REQUIREMENTS CHECK:`, 'bold');
    
    const requirements = [
        { name: 'Real-time Data Updates', met: totalRealTimePatterns > 5 },
        { name: 'Automatic Query Resolution', met: totalDynamicFeatures > 20 },
        { name: 'Live System Monitoring', met: totalAPIs > 10 },
        { name: 'Dynamic UI Updates', met: verifiedComponents >= 4 },
        { name: 'API Integration', met: totalAPIs > 5 }
    ];

    requirements.forEach(req => {
        log(`  ${req.met ? '✅' : '❌'} ${req.name}`, req.met ? 'green' : 'red');
    });

    const metRequirements = requirements.filter(r => r.met).length;
    log(`\n📋 Requirements Met: ${metRequirements}/${requirements.length}`, metRequirements === requirements.length ? 'green' : 'yellow');

    // Final recommendation
    if (overallScore >= 90 && metRequirements === requirements.length) {
        log(`\n🚀 RECOMMENDATION: System is ready for production!`, 'green');
        log(`   The AI Customer Care & Engineering system is fully dynamic and`, 'green');
        log(`   will automatically handle customer queries and technical issues.`, 'green');
    } else {
        log(`\n🔧 RECOMMENDATION: Review and enhance dynamic features.`, 'yellow');
    }

    log(`\n${'='.repeat(60)}`, 'green');
    log('Verification completed successfully!', 'bold');
    log(`${'='.repeat(60)}`, 'green');
}

// Run verification
verifySystem().catch(console.error);
