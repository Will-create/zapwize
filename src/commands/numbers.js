const { Command } = require('commander');
const inquirer = require('inquirer');
const qrcode = require('qrcode-terminal');
const { makeApiRequest } = require('../api');
const program = new Command();

program
    .name('numbers')
    .description('Manage your WhatsApp numbers');

program.command('link')
    .description('Link a new WhatsApp number')
    .action(async () => {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'type',
                message: 'Select the connection type:',
                choices: ['qrcode', 'code'],
            },
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
            }
        ]);

        try {
            console.log('➡️  Sending request to create number...');
            const response = await makeApiRequest('numbers_insert', {
                name: answers.name,
                phone: answers.phonenumber,
                webhook: answers.webhook,
                type: answers.type,
            });
            console.log('⬅️  Received response:', JSON.stringify(response, null, 2));

            if (response) {
                const value = response;
                if (answers.type === 'qrcode') {
                    console.log('Scan the QR code below with your WhatsApp app:');
                    qrcode.generate(value, { small: true });
                } else {
                    console.log(`Enter the following code on your device: ${value}`);
                }

                // Poll for connection status
                let dots = '';
                process.stdout.write('Waiting for connection...');
                const poll = setInterval(async () => {
                    try {
                        const stateResponse = await makeApiRequest('instance_state/' + answers.phonenumber);
                        if (stateResponse.value === 'open' || stateResponse.value === 'connected') {
                            clearInterval(poll);
                            process.stdout.clearLine(0);
                            process.stdout.cursorTo(0);
                            console.log('✅ Number connected successfully!');
                        } else {
                            dots = dots.length >= 3 ? '' : dots + '.';
                            process.stdout.clearLine(0);
                            process.stdout.cursorTo(0);
                            process.stdout.write(`Waiting for connection${dots}`);
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

module.exports = program;
