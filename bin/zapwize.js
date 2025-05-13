#!/usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer');
const open = require('open');
const qrcode = require('qrcode-terminal');
const Conf = require('conf').default;
const Zapwize = require('../src/index');
const path = require('path');
const os = require('os');

// Configuration storage
const config = new Conf({
  projectName: 'zapwize-cli',
  encryptionKey: 'zapwize-secure-storage'
});

// Version from package.json
const { version } = require('../package.json');

program
  .name('zapwize')
  .description('Zapwize CLI - Manage your WhatsApp integration')
  .version(version);

// Check if user is logged in
const isLoggedIn = () => {
  return config.has('session') && config.get('session.token');
};

// Authentication check middleware
const requireAuth = (callback) => {
  return (...args) => {
    if (!isLoggedIn()) {
      console.log('You need to log in first. Run: zapwize login');
      process.exit(1);
    }
    callback(...args);
  };
};

// Login command
program
  .command('login')
  .description('Log in to your Zapwize account')
  .action(async () => {
    console.log('Opening browser to log in to Zapwize...');
    
    // Generate a unique state for this login attempt
    const state = Math.random().toString(36).substring(2, 15);
    config.set('loginState', state);
    
    const authUrl = `https://app.zapwize.com/cli-auth?state=${state}`;
    
    // Open browser with login URL - Fixed to work cross-platform
    try {
      await open(authUrl);  // Use the open function directly
      console.log(`Browser opened to: ${authUrl}`);
    } catch (error) {
      console.error('Failed to open browser:', error.message);
      console.log(`Please manually open this URL in your browser: ${authUrl}`);
    }
    
    console.log('After logging in through the browser, you will be redirected back to the CLI.');
    console.log('Waiting for authentication...');
    
    // Here you would implement a way to receive the token
    // This could be a local server listening for a callback or polling an endpoint
    // For simplicity, we'll use a manual token input for now
    
    const { token } = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Paste the authentication token from the browser:',
        validate: input => input.length > 0 ? true : 'Token is required'
      }
    ]);
    
    // Validate token (in a real implementation, you'd verify this with the server)
    try {
      // Create a temporary client to validate the token
      const zapwize = new Zapwize({ apiKey: token });
      
      // Store the session
      config.set('session', {
        token,
        createdAt: new Date().toISOString()
      });
      
      console.log('Successfully logged in!');
    } catch (error) {
      console.error('Authentication failed:', error.message);
    }
  });

// Logout command
program
  .command('logout')
  .description('Log out from your Zapwize account')
  .action(() => {
    if (isLoggedIn()) {
      config.delete('session');
      console.log('Successfully logged out');
    } else {
      console.log('You are not logged in');
    }
  });

// List WhatsApp numbers
program
  .command('numbers')
  .description('List your WhatsApp numbers')
  .action(requireAuth(async () => {
    try {
      const zapwize = new Zapwize({ apiKey: config.get('session.token') });
      
      console.log('Fetching your WhatsApp numbers...');
      
      // This would be a custom API call to fetch numbers
      const response = await zapwize.client.get('/numbers');
      
      if (response.data.success) {
        const numbers = response.data.value;
        
        if (numbers.length === 0) {
          console.log('You don\'t have any WhatsApp numbers registered yet.');
          return;
        }
        
        console.log('\nYour WhatsApp numbers:');
        numbers.forEach((number, index) => {
          console.log(`${index + 1}. ${number.phoneNumber} - Status: ${number.status}`);
        });
      } else {
        console.error('Failed to fetch numbers:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching numbers:', error.message);
    }
  }));

// Create API key
program
  .command('create-key <phoneNumber>')
  .description('Create a new API key for a WhatsApp number')
  .action(requireAuth(async (phoneNumber) => {
    try {
      const zapwize = new Zapwize({ apiKey: config.get('session.token') });
      
      console.log(`Creating API key for ${phoneNumber}...`);
      
      // This would be a custom API call to create an API key
      const response = await zapwize.client.post('/apikeys', { phoneNumber });
      
      if (response.data.success) {
        const apiKey = response.data.value.key;
        console.log('\nAPI Key created successfully!');
        console.log(`API Key: ${apiKey}`);
        console.log('\nStore this key securely. It won\'t be shown again.');
      } else {
        console.error('Failed to create API key:', response.data.message);
      }
    } catch (error) {
      console.error('Error creating API key:', error.message);
    }
  }));

// Link WhatsApp number via QR code
program
  .command('link')
  .description('Link a new WhatsApp number by scanning QR code')
  .action(requireAuth(async () => {
    try {
      const zapwize = new Zapwize({ apiKey: config.get('session.token') });
      
      console.log('Generating QR code for WhatsApp linking...');
      
      // This would be a custom API call to get a QR code
      const response = await zapwize.client.get('/qrcode');
      
      if (response.data.success) {
        const qrData = response.data.value.qrCode;
        
        console.log('\nScan this QR code with your WhatsApp app:');
        qrcode.generate(qrData, { small: true });
        
        console.log('\nWaiting for scan...');
        
        // Poll for status
        const checkInterval = setInterval(async () => {
          const statusResponse = await zapwize.client.get('/qrcode/status');
          
          if (statusResponse.data.success) {
            const status = statusResponse.data.value.status;
            
            if (status === 'CONNECTED') {
              clearInterval(checkInterval);
              console.log('\nWhatsApp number linked successfully!');
              process.exit(0);
            } else if (status === 'FAILED') {
              clearInterval(checkInterval);
              console.error('\nFailed to link WhatsApp number. Please try again.');
              process.exit(1);
            }
          }
        }, 2000);
        
        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          console.error('\nQR code expired. Please try again.');
          process.exit(1);
        }, 120000);
      } else {
        console.error('Failed to generate QR code:', response.data.message);
      }
    } catch (error) {
      console.error('Error generating QR code:', error.message);
    }
  }));

// Subscription plans
program
  .command('plans')
  .description('List available subscription plans')
  .action(requireAuth(async () => {
    try {
      const zapwize = new Zapwize({ apiKey: config.get('session.token') });
      
      console.log('Fetching available subscription plans...');
      
      // This would be a custom API call to fetch plans
      const response = await zapwize.client.get('/plans');
      
      if (response.data.success) {
        const plans = response.data.value;
        
        console.log('\nAvailable subscription plans:');
        plans.forEach((plan, index) => {
          console.log(`${index + 1}. ${plan.name} - $${plan.price}/month`);
          console.log(`   Features: ${plan.features.join(', ')}`);
          console.log('');
        });
      } else {
        console.error('Failed to fetch plans:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching plans:', error.message);
    }
  }));

// Subscribe to a plan
program
  .command('subscribe <phoneNumber> <planId>')
  .description('Subscribe a WhatsApp number to a plan')
  .action(requireAuth(async (phoneNumber, planId) => {
    try {
      const zapwize = new Zapwize({ apiKey: config.get('session.token') });
      
      console.log(`Subscribing ${phoneNumber} to plan ${planId}...`);
      
      // This would be a custom API call to subscribe to a plan
      const response = await zapwize.client.post('/subscribe', { 
        phoneNumber, 
        planId 
      });
      
      if (response.data.success) {
        console.log('\nSubscription successful!');
        console.log(`Phone: ${phoneNumber}`);
        console.log(`Plan: ${response.data.value.planName}`);
        console.log(`Valid until: ${new Date(response.data.value.validUntil).toLocaleDateString()}`);
      } else {
        console.error('Failed to subscribe:', response.data.message);
      }
    } catch (error) {
      console.error('Error subscribing to plan:', error.message);
    }
  }));

// Status command
program
  .command('status')
  .description('Check your Zapwize account status')
  .action(requireAuth(async () => {
    try {
      const zapwize = new Zapwize({ apiKey: config.get('session.token') });
      
      console.log('Fetching account status...');
      
      // This would be a custom API call to get account status
      const response = await zapwize.client.get('/account');
      
      if (response.data.success) {
        const account = response.data.value;
        
        console.log('\nAccount Information:');
        console.log(`Email: ${account.email}`);
        console.log(`Account Type: ${account.type}`);
        console.log(`Numbers: ${account.numbersCount}`);
        console.log(`API Keys: ${account.apiKeysCount}`);
        
        if (account.subscription) {
          console.log('\nSubscription:');
          console.log(`Plan: ${account.subscription.planName}`);
          console.log(`Status: ${account.subscription.status}`);
          console.log(`Renewal Date: ${new Date(account.subscription.renewalDate).toLocaleDateString()}`);
        }
      } else {
        console.error('Failed to fetch account status:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching account status:', error.message);
    }
  }));

// Check if a number is a WhatsApp number
program
  .command('check-number <phoneNumber>')
  .description('Check if a phone number is a valid WhatsApp number')
  .action(async (phoneNumber) => {
    try {
      const zapwize = new Zapwize({ apiKey: 'dummy' }); // API key not needed for this function
      
      console.log(`Checking if ${phoneNumber} is a WhatsApp number...`);
      
      const isWhatsApp = await zapwize.isWhatsAppNumber(phoneNumber);
      
      if (isWhatsApp) {
        console.log(`✅ ${phoneNumber} is a valid WhatsApp number.`);
      } else {
        console.log(`❌ ${phoneNumber} is not a WhatsApp number.`);
      }
    } catch (error) {
      console.error('Error checking number:', error.message);
    }
  });

program.parse(process.argv);

// If no arguments, show help
if (process.argv.length === 2) {
  program.help();
}