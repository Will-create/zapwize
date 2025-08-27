#!/usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer');
const open = require('open');
const qrcode = require('qrcode-terminal');
const Conf = require('conf').default;
const WebSocket = require('ws');
const crypto = require('crypto');
const { makeApiRequest } = require('../src/api');
const numbersCommand = require('../src/commands/numbers');
const apiKeysCommand = require('../src/commands/apikeys');
const aiCommand = require('../src/commands/ai');
const billingCommand = require('../src/commands/billing');

// Configuration storage
const config = new Conf({
  projectName: 'zapwize-cli',
  encryptionKey: 'zapwize-secure-storage'
});

// Version from package.json
const { version } = require('../package.json');

// Configuration
const WS_SERVER =  'wss://zapwize.com';
const AUTH_URL =  'https://zapwize.com';

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

// Generate secure random state
const generateState = () => {
  return crypto.randomBytes(32).toString('hex');
};

// WebSocket authentication handler
const authenticateWithWebSocket = (state) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_SERVER}/cli/${state}`);
    let timeoutId;
    
    ws.on('open', () => {
      console.log('Connected to authentication server...');
      // Set timeout for 5 minutes
      timeoutId = setTimeout(() => {
        ws.close();
        reject(new Error('Authentication timeout. Please try again.'));
      }, 300000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case 'auth_success':
            clearTimeout(timeoutId);
            ws.close();
            resolve({
              token: message.state,
              user: message.user,
              expiresAt: message.expiresAt
            });
            break;
        }
      } catch (error) {
        reject(new Error('Invalid message from server'));
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(new Error(`WebSocket error: ${error.message}`));
    });
    ws.on('close', () => {
      clearTimeout(timeoutId);
      if (!timeoutId._destroyed) {
        reject(new Error('Connection closed unexpectedly'));
      }
    });
  });
};

// Enhanced login command with WebSocket
program
  .command('login')
  .description('Log in to your Zapwize account')
  .option('-m, --manual', 'Use manual token input instead of WebSocket')
  .action(async (options) => {
    if (isLoggedIn()) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'You are already logged in. Do you want to log in again?',
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log('Login cancelled.');
        return;
      }
    }
    
    console.log('🚀 Starting Zapwize CLI authentication...');
    
    // Generate a unique state for this login attempt
    const state = generateState();
    config.set('loginState', state);
    
    const authUrl = `${AUTH_URL}/cli-auth?state=${state}&timestamp=${Date.now()}`;
    try {
        // WebSocket method (default)
        console.log('Opening browser for authentication...');
        try {
          await open(authUrl);
          console.log(`✅ Browser opened to: ${authUrl}`);
        } catch (error) {
          console.warn('⚠️  Failed to open browser automatically');
          console.log(`Please manually open: ${authUrl}`);
        }
        console.log('🔗 Establishing secure connection...');
        try {
          const authResult = await authenticateWithWebSocket(state);
          // Store the session
          config.set('session', {
            token: authResult.token,
            user: authResult.user,
            createdAt: new Date().toISOString()
          });
          
          console.log('🎉 Successfully logged in!');
          console.log(`👤 Welcome, ${authResult.user.email || authResult.user.name || 'User'}!`);
        } catch (wsError) {
          console.error('❌ WebSocket authentication failed:', wsError.message);
        }
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      config.delete('loginState');
      process.exit(1);
    } finally {
      config.delete('loginState');
    }
  });

// Enhanced logout command
program
  .command('logout')
  .description('Log out from your Zapwize account')
  .action(async () => {
    if (!isLoggedIn()) {
      console.log('You are not logged in');
      return;
    }
    
    try {
      // Optionally notify the server about logout
      await makeApiRequest('cli_logout');
    } catch (error) {
      // Ignore logout API errors
    }
    
    config.delete('session');
    console.log('✅ Successfully logged out');
  });

// Check session validity
program
  .command('whoami')
  .description('Show current user information')
  .action(requireAuth(async () => {
    try {
      const session = config.get('session');
      
      console.log('Verifying session...');
      
      const response = await makeApiRequest('account');
      
      if (response.success) {
        const user = response.user;
        
        console.log('\n👤 Current User:');
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name || 'Not set'}`);
        console.log(`Account Type: ${user.accountType || 'Standard'}`);
        console.log(`Login Time: ${new Date(session.createdAt).toLocaleString()}`);
        
        if (session.expiresAt) {
          const expiresAt = new Date(session.expiresAt);
          const now = new Date();
          const timeLeft = expiresAt - now;
          
          if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            console.log(`Session expires in: ${hours}h ${minutes}m`);
          } else {
            console.log('⚠️  Session has expired. Please log in again.');
          }
        }
      } else {
        console.log('❌ Session is invalid. Please log in again.');
        config.delete('session');
      }
    } catch (error) {
      console.error('❌ Error verifying session:', error.message);
      console.log('💡 Try logging in again with: zapwize login');
    }
  }));

// Rest of the commands remain the same...
// [Include all the existing commands: numbers, create-key, link, plans, subscribe, status, check-number]
program.addCommand(numbersCommand);
program.addCommand(apiKeysCommand);
program.addCommand(aiCommand);
program.addCommand(billingCommand);

// Enhanced error handling and help
program.configureOutput({
  writeErr: (str) => process.stdout.write(`❌ ${str}`),
  writeOut: (str) => process.stdout.write(str)
});

program.parse(process.argv);

// If no arguments, show enhanced help
if (process.argv.length === 2) {
  console.log('🔥 Zapwize CLI - WhatsApp Integration Made Easy\n');
  if (isLoggedIn()) {
    const user = config.get('session.user');
    console.log(`👋 Welcome back, ${user?.email || 'User'}!\n`);
  } else {
    console.log('🚀 Get started by logging in: zapwize login\n');
  }
  program.help();
}