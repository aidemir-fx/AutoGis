const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /        \} catch \(err: any\) \{[\s\S]*?res\.status\(500\)\.send\(err\.message\);\n        \}/,
    `        } catch (err: any) {
            require('fs').writeFileSync('debug_error.log', String(err.stack || err));
            res.status(500).send(String(err));
        }`
);

fs.writeFileSync('server.ts', code);
