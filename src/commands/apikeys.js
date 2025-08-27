
const { Command } = require('commander');
const inquirer = require('inquirer');
const { makeApiRequest } = require('../api');
const program = new Command();

program
    .name('apikeys')
    .description('Manage your API keys')

program.command('list')
    .description('List all your API keys')
    .action(async () => {
        try {
            console.log('🔑 Fetching your API keys...');
            const response = await makeApiRequest('apikeys_list');
            if (response) {
                const apiKeys = response;
                if (apiKeys.length === 0) {
                    console.log('You don\'t have any API keys yet.');
                    console.log('💡 Use "zapwize apikeys:create" to create one.');
                    return;
                }
                console.log('\n🔑 Your API keys:');
                apiKeys.forEach((key, index) => {
                    console.log(`${index + 1}. ${key.name} - ${key.token}`);
                });
            } else {
                console.error('❌ Failed to fetch API keys:', response.message);
            }
        } catch (error) {
            console.error('❌ Error fetching API keys:', error.message);
        }
    });

program.command('create')
    .description('Create a new API key')
    .action(async () => {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter a name for the API key:',
            },
        ]);

        try {
            const response = await makeApiRequest('apikeys_create', {
                name: answers.name,
            });

            if (response.success) {
                console.log('API key created successfully:');
                console.log(`Name: ${response.value.name}`);
                console.log(`Token: ${response.value.token}`);
            } else {
                console.error('Error creating API key:', response.message);
            }
        } catch (error) {
            console.error('Error creating API key:', error.message);
        }
    });

program.command('delete')
    .description('Delete an API key')
    .action(async () => {
        try {
            const apiKeys = await makeApiRequest('apikeys_list');
            if (apiKeys.length === 0) {
                console.log('You don\'t have any API keys to delete.');
                return;
            }

            const { keyToDelete } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'keyToDelete',
                    message: 'Select an API key to delete:',
                    choices: apiKeys.map(k => ({ name: k.name, value: k.id })),
                },
            ]);

            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Are you sure you want to delete this API key?',
                    default: false,
                },
            ]);

            if (confirm) {
                const response = await makeApiRequest('apikeys_remove/' + keyToDelete);
                if (response.success) {
                    console.log('API key deleted successfully.');
                } else {
                    console.error('Error deleting API key:', response.message);
                }
            } else {
                console.log('Deletion cancelled.');
            }
        } catch (error) {
            console.error('Error deleting API key:', error.message);
        }
    });

module.exports = program;
