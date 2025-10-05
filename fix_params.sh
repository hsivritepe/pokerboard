#!/bin/bash

# Fix all API route files with params type issues
files=(
    "app/api/sessions/[id]/status/route.ts"
    "app/api/sessions/[id]/players/[playerId]/add-chips/route.ts"
    "app/api/sessions/[id]/players/[playerId]/rejoin/route.ts"
    "app/api/sessions/[id]/players/[playerId]/chips/route.ts"
    "app/api/sessions/[id]/players/[playerId]/cashout/route.ts"
    "app/api/sessions/[id]/players/[playerId]/route.ts"
    "app/api/sessions/[id]/players/[playerId]/leave/route.ts"
    "app/api/users/[id]/route.ts"
    "app/api/users/[id]/restore/route.ts"
    "app/api/users/[id]/undelete/route.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Fixing $file..."
        # Replace params type
        sed -i '' 's/{ params: { \([^}]*\) } }/{ params: Promise<{ \1 }> }/g' "$file"
        # Replace params.id with await params destructuring
        sed -i '' 's/const \([a-zA-Z]*\) = params\.\([a-zA-Z]*\);/const { \2: \1 } = await params;/g' "$file"
        # Replace remaining params.xyz with the destructured variable
        sed -i '' 's/params\.\([a-zA-Z]*\)/\1/g' "$file"
    fi
done

echo "Done!"
