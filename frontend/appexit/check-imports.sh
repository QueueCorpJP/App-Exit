#!/bin/bash

echo "=== lucide-react使用箇所 ==="
grep -r "from 'lucide-react'" components/ --include="*.tsx" | wc -l
echo "ファイル数"

echo ""
echo "=== lucide-reactでインポートしているアイコン数 ==="
grep -rh "from 'lucide-react'" components/ --include="*.tsx" | sed 's/.*{\(.*\)}.*/\1/' | tr ',' '\n' | wc -l

echo ""
echo "=== @supabase使用箇所 ==="
grep -r "@supabase/supabase-js" --include="*.ts" --include="*.tsx" | wc -l

echo ""
echo "=== next-intl使用箇所 ==="
grep -r "next-intl" --include="*.ts" --include="*.tsx" | wc -l

