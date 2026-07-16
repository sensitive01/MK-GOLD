const fs = require('fs');

let content = fs.readFileSync('src/routes.js', 'utf8');

content = content.replace(/import TelecallingProfile from '\.\/pages\/telecalling\/Profile';/g, "import Profile from './pages/Profile';");
content = content.replace(/\{\s*path:\s*'profile',\s*element:\s*<TelecallingProfile \/>\s*\},/g, "");

if (!content.includes("import HrLeads from './pages/hr/Leads';")) {
    content = content.replace("import HrPayprocess from './pages/hr/Payprocess';", "import HrPayprocess from './pages/hr/Payprocess';\nimport HrLeads from './pages/hr/Leads';");
}

content = content.replace(/children:\s*\[/g, "children: [\n        { path: 'profile', element: <Profile /> },");

// Find HR block
const hrIndex = content.indexOf("path: '/hr'");
if (hrIndex !== -1) {
    const hrPayprocessStr = "{ path: 'payprocess', element: <HrPayprocess /> },";
    const hrPayprocessIndex = content.indexOf(hrPayprocessStr, hrIndex);
    if (hrPayprocessIndex !== -1) {
        content = content.slice(0, hrPayprocessIndex + hrPayprocessStr.length) + "\n        { path: 'leads', element: <HrLeads /> }," + content.slice(hrPayprocessIndex + hrPayprocessStr.length);
    }
}

fs.writeFileSync('src/routes.js', content);
console.log('Fixed routes.js successfully');
