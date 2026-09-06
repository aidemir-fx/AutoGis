const { spawn } = require('child_process');
const child = spawn('npm', ['run', 'dev']);

child.stdout.on('data', (data) => {
    require('fs').appendFileSync('dev_out.log', data);
});
child.stderr.on('data', (data) => {
    require('fs').appendFileSync('dev_out.log', data);
});

setTimeout(() => {
    child.kill();
    console.log(require('fs').readFileSync('dev_out.log', 'utf8'));
}, 5000);
