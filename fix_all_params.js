const fs = require('fs');
const path = require('path');

const files = [
    'app/api/sessions/[id]/players/[playerId]/chips/route.ts',
    'app/api/sessions/[id]/players/[playerId]/rejoin/route.ts',
    'app/api/sessions/[id]/players/[playerId]/route.ts',
    'app/api/sessions/[id]/players/[playerId]/leave/route.ts',
    'app/api/sessions/[id]/status/route.ts',
    'app/api/users/[id]/route.ts',
    'app/api/users/[id]/restore/route.ts',
    'app/api/users/[id]/undelete/route.ts'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`Fixing ${file}...`);
        let content = fs.readFileSync(file, 'utf8');
        
        // Fix params type
        content = content.replace(
            /{ params: { ([^}]+) } }/g,
            '{ params: Promise<{ $1 }> }'
        );
        
        // Fix params destructuring
        content = content.replace(
            /const { ([^}]+) } = params;/g,
            'const { $1 } = await params;'
        );
        
        // Replace params.xyz with destructured variables
        content = content.replace(/params\.([a-zA-Z]+)/g, '$1');
        
        fs.writeFileSync(file, content);
    }
});

console.log('Done!');
