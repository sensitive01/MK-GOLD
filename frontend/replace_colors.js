const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) { 
            /* Is a file */
            results.push(file);
        }
    });
    return results;
}

const files = walk('e:/SensitiveTechnologies/Gold-New/Gold-New/Frontend/src/pages');
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('<Typography variant="h4" gutterBottom>')) {
        content = content.replace(/<Typography variant="h4" gutterBottom>/g, '<Typography variant="h4" gutterBottom sx={{ color: \'#fff\' }}>');
        changed = true;
    }

    if (content.match(/<p>([\s\S]*?)From Date:/)) {
       content = content.replace(/<p>([\s\S]*?From Date:)/g, '<p style={{ color: \'#fff\' }}>$1');
       changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
    }
}
console.log('Modified ' + modifiedCount + ' files.');
