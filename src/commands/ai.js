
const { Command } = require('commander');
const open = require('open');
const program = new Command();

const BASE_URL = 'https://zapwize.com/dashboard/ai';

program
    .name('ai')
    .description('Manage AI features and bots');

program.command('bots')
    .description('View and manage your AI bots')
    .action(() => {
        const url = `${BASE_URL}/bots`;
        console.log(`Redirecting you to the AI bots dashboard: ${url}`);
        open(url);
    });

program.command('integrations')
    .description('Configure AI integrations')
    .action(() => {
        const url = `${BASE_URL}/integrations`;
        console.log(`Redirecting you to the AI integrations dashboard: ${url}`);
        open(url);
    });

program.command('settings')
    .description('Adjust AI settings')
    .action(() => {
        const url = `${BASE_URL}/settings`;
        console.log(`Redirecting you to the AI settings dashboard: ${url}`);
        open(url);
    });

module.exports = program;
