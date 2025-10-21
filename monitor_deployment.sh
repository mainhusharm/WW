#!/bin/bash

echo "🔍 Monitoring AWS Amplify deployment..."
echo "Checking for new JavaScript file deployment..."
echo ""

while true; do
    # Get current JS file from production
    CURRENT_JS=$(curl -s "https://traderedgepro.com" | grep -o 'src="[^"]*\.js"' | head -1 | sed 's/src="//' | sed 's/"//')
    
    echo "$(date): Current JS file: $CURRENT_JS"
    
    # Check if it's the new file
    if [[ "$CURRENT_JS" == *"b1fce9ca"* ]]; then
        echo "✅ DEPLOYMENT COMPLETE! New JavaScript file detected: $CURRENT_JS"
        echo "🎉 The customer service dashboard should now show real database users!"
        break
    elif [[ "$CURRENT_JS" == *"e9fe74d4"* ]]; then
        echo "⏳ Still deploying... Old file detected: $CURRENT_JS"
    else
        echo "❓ Unknown file detected: $CURRENT_JS"
    fi
    
    echo "Waiting 30 seconds before next check..."
    sleep 30
done
