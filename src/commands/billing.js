
const { Command } = require('commander');
const open = require('open');
const program = new Command();

const BASE_URL = 'https://zapwize.com/dashboard/billing';

program
    .name('billing')
    .description('Manage your billing and subscription');

program.command('plans')
    .description('View and manage your subscription plans')
    .action(() => {
        const url = `${BASE_URL}/plans`;
        console.log(`Redirecting you to the billing plans dashboard: ${url}`);
        open(url);
    });

program.command('usage')
    .description('Check your current usage')
    .action(() => {
        const url = `${BASE_URL}/usage`;
        console.log(`Redirecting you to the usage dashboard: ${url}`);
        open(url);
    });

program.command('history')
    .description('View your billing history')
    .action(() => {
        const url = `${BASE_URL}/history`;
        console.log(`Redirecting you to the billing history dashboard: ${url}`);
        open(url);
    });

module.exports = program;
