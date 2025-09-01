const { Command } = require('commander');
const inquirer = require('inquirer');
const qrcode = require('qrcode-terminal');
const { makeApiRequest } = require('../api');
const program = new Command();

program
    .name('numbers')
    .description('Manage your WhatsApp numbers')
    
program.command('create')
    .description('Create a new WhatsApp number')
    .action(async () => {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter a name for the number:',
            },
            {
                type: 'input',
                name: 'phonenumber',
                message: 'Enter the phone number (with country code):',
            },
            {
                type: 'input',
                name: 'webhook',
                message: 'Enter a webhook URL (optional):',
            },
            {
                type: 'list',
                name: 'type',
                message: 'Select the connection type:',
                choices: ['qrcode', 'code'],
            },
        ]);

        try {
            const response = await makeApiRequest('numbers_insert', {
                name: answers.name,
                phone: answers.phonenumber,
                webhook: answers.webhook,
                type: answers.type,
            });

            if (response.success) {
                const { value } = response;
                if (answers.type === 'qrcode') {
                    console.log('Scan the QR code below with your WhatsApp app:');
                    qrcode.generate(value, { small: true });
                } else {
                    console.log(`Enter the following code on your device: ${value}`);
                }

                // Poll for connection status
                const poll = setInterval(async () => {
                    try {
                        const stateResponse = await makeApiRequest('instance_state/' + answers.phonenumber);
                        if (stateResponse.value === 'open' || stateResponse.value === 'connected') {
                            clearInterval(poll);
                            console.log('Number connected successfully!');
                        }
                    } catch (error) {
                        // Ignore errors while polling
                    }
                }, 3000);

            } else {
                console.error('Error creating number:', response.message);
            }
        } catch (error) {
            console.error('Error creating number:', error.message);
        }
    });

program.command('list')
    .description('List all your WhatsApp numbers')
    .action(async () => {
        try {
            console.log('📱 Fetching your WhatsApp numbers...');
            const response = await makeApiRequest('numbers_list');
            if (response) {
                const numbers = response;
                if (numbers.length === 0) {
                    console.log('📵 You don\'t have any WhatsApp numbers registered yet.');
                    console.log('💡 Use "zapwize numbers:create" to connect a WhatsApp number.');
                    return;
                }
                console.log('\n📱 Your WhatsApp numbers:');
                numbers.forEach((number, index) => {
                    const statusIcon = number.status === 'connected' ? '🟢' :
                        number.status === 'disconnected' ? '🔴' : '🟡';
                    console.log(`${index + 1}. ${statusIcon} ${number.phonenumber} - ${number.status}`);
                    if (number.lastSeen) {
                        console.log(`   Last seen: ${new Date(number.lastSeen).toLocaleString()}`);
                    }
                });
            } else {
                console.error('❌ Failed to fetch numbers:', response.message);
            }
        } catch (error) {
            console.error('❌ Error fetching numbers:', error.message);
        }
    });

program.command('delete')
    .description('Delete a WhatsApp number')
    .action(async () => {
        try {
            const numbers = await makeApiRequest('numbers_list');
            if (numbers.length === 0) {
                console.log('You don\'t have any numbers to delete.');
                return;
            }

            const { numberToDelete } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'numberToDelete',
                    message: 'Select a number to delete:',
                    choices: numbers.map(n => ({ name: `${n.name} (${n.phonenumber})`, value: n.id }))
                },
            ]);

            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Are you sure you want to delete this number?',
                    default: false,
                },
            ]);

            if (confirm) {
                const response = await makeApiRequest('numbers_remove/' + numberToDelete);
                if (response.success) {
                    console.log('Number deleted successfully.');
                } else {
                    console.error('Error deleting number:', response.message);
                }
            } else {
                console.log('Deletion cancelled.');
            }
        } catch (error) {
            console.error('Error deleting number:', error.message);
        }
    });

program.command('scan')
    .description('Scan a QR code for a WhatsApp number')
    .action(async () => {
        try {
            const numbers = await makeApiRequest('numbers_list');
            if (numbers.length === 0) {
                console.log('You don\'t have any numbers to scan.');
                return;
            }

            const { numberToScan } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'numberToScan',
                    message: 'Select a number to scan:',
                    choices: numbers.map(n => ({ name: `${n.name} (${n.phonenumber})`, value: n.phonenumber })),
                },
            ]);

            const response = await makeApiRequest('instance_qr/' + numberToScan);

            if (response.success) {
                const { value } = response;
                console.log('Scan the QR code below with your WhatsApp app:');
                qrcode.generate(value, { small: true });

                // Poll for connection status
                const poll = setInterval(async () => {
                    try {
                        const stateResponse = await makeApiRequest('instance_state/' + numberToScan);
                        if (stateResponse.value === 'open' || stateResponse.value === 'connected') {
                            clearInterval(poll);
                            console.log('Number connected successfully!');
                        }
                    } catch (error) {
                        // Ignore errors while polling
                    }
                }, 3000);
            } else {
                console.error('Error getting QR code:', response.message);
            }
        } catch (error) {
            console.error('Error getting QR code:', error.message);
        }
    });

program.command('link')
    .description('Link a WhatsApp number with a pairing code')
    .action(async () => {
        try {
            const numbers = await makeApiRequest('numbers_list');
            if (numbers.length === 0) {
                console.log('You don\'t have any numbers to link.');
                return;
            }

            const { numberToLink } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'numberToLink',
                    message: 'Select a number to link:',
                    choices: numbers.map(n => ({ name: `${n.name} (${n.phonenumber})`, value: n.phonenumber }))
                },
            ]);

            const response = await makeApiRequest('instance_pairring/' + numberToLink);

            if (response.success) {
                const { value } = response;
                console.log(`Enter the following code on your device: ${value}`);

                // Poll for connection status
                const poll = setInterval(async () => {
                    try {
                        const stateResponse = await makeApiRequest('instance_state/' + numberToLink);
                        if (stateResponse.value === 'open' || stateResponse.value === 'connected') {
                            clearInterval(poll);
                            console.log('Number connected successfully!');
                        }
                    } catch (error) {
                        // Ignore errors while polling
                    }
                }, 3000);
            } else {
                console.error('Error getting pairing code:', response.message);
            }
        } catch (error) {
            console.error('Error getting pairing code:', error.message);
        }
    });

module.exports = program;