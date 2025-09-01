
const { Command } = require('commander');
const inquirer = require('inquirer');
const { makeApiRequest } = require('../api');
const program = new Command();

program
    .name('apikeys')
    .description('Manage your API keys');

program.command('list')
    .description('List all your API keys')
    .action(async () => {
        try {
            console.log('🔑 Fetching your API keys and numbers...');
            const [apiKeys, numbers] = await Promise.all([
                makeApiRequest('apikeys'),
                makeApiRequest('numbers_list')
            ]);

            if (Array.isArray(apiKeys) && apiKeys.length > 0) {
                const numberMap = new Map(numbers.map(n => [n.id, n.phonenumber]));

                const tableData = apiKeys.map((key, index) => ({
                    '#': index + 1,
                    'ID': key.id,
                    'Name': key.name,
                    'Phone': numberMap.get(key.numberid) || 'N/A',
                    'Value': key.value
                }));
                
                console.table(tableData);
            } else {
                console.log('You don\'t have any API keys yet.');
                console.log('💡 Use "zapwize apikeys:create" to create one.');
            }
        } catch (error) {
            console.error('❌ Error fetching API keys:', error.message);
        }
    });

const crypto = require('crypto');

program.command('create')
    .description('Create a new API key')
    .action(async () => {
        try {
            // Fetch available numbers
            const numbersResponse = await makeApiRequest('numbers_list');
            if (!Array.isArray(numbersResponse) || numbersResponse.length === 0) {
                console.log('❌ You need to link a WhatsApp number before creating an API key.');
                console.log('💡 Use "zapwize numbers link" to connect a number.');
                return;
            }

            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Enter a name for the API key:',
                },
                {
                    type: 'list',
                    name: 'numberid',
                    message: 'Select a number to associate with this API key:',
                    choices: numbersResponse.map(n => ({ name: `${n.name} (${n.phonenumber})`, value: n.id }))
                }
            ]);

            // Generate token
            const token = 'ZW_' + crypto.randomBytes(10).toString('hex');

            const response = await makeApiRequest('apikeys_create', {
                name: answers.name,
                numberid: answers.numberid,
                value: token,
            });

            if (response) {
                console.log('✅ API key created successfully:');
                console.log(`   Name: ${answers.name}`);
                console.log(`   Token: ${token}`);
            } else {
                console.error('❌ Error creating API key:', response.message || 'An unknown error occurred.');
            }
        } catch (error) {
            console.error('❌ Error creating API key:', error.message);
        }
    });

program.command('delete')
    .description('Delete an API key')
    .action(async () => {
        try {
            console.log('🔑 Fetching your API keys...');
            const response = await makeApiRequest('apikeys');
            if (!response) {
                console.error('❌ Failed to fetch API keys:', response.message || 'Unknown error');
                return;
            }
            // Ask user to select API key to delete
            const apiKeys = response;
            if (apiKeys.length === 0) {
                console.log('You don\'t have any API keys to delete.');
                return;
            }
            const { keyToDelete } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'keyToDelete',
                    message: 'Select an API key to delete:',
                    choices: apiKeys.map(k => ({ name: k.name + (' ' + k.phone.split(':')[0] + ' (' + k.value + ')'), value: k.id })),
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
                console.log('➡️  Deleting API key...');
                const deleteResponse = await makeApiRequest('apikeys_remove/' + keyToDelete);
                if (deleteResponse) {
                    console.log('API key deleted successfully.');
                } else {
                    console.error('Error deleting API key:', deleteResponse.message);
                }
            } else {
                console.log('Deletion cancelled.');
            }
        } catch (error) {
            console.error('Error deleting API key:', error.message);
        }
    });

module.exports = program;
