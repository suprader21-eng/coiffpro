#!/bin/bash
set -e
echo "🔧 Setup CoiffPro Mobile..."
echo "📦 Sync Capacitor..."
npx cap sync
echo "✅ Done! Open iOS: npx cap open ios | Android: npx cap open android"
