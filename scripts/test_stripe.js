#!/usr/bin/env node

/**
 * Stripe Integration Test Script
 * Tests basic Stripe configuration and connectivity
 */

require('dotenv').config({ path: '.env.local' });

async function testStripeConfiguration() {
  console.log('🔑 Testing Stripe Configuration...\n');

  // Check environment variables
  const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('📋 Environment Variables:');
  console.log(`✅ NEXT_PUBLIC_STRIPE_PUBLIC_KEY: ${publicKey ? 'Set ✓' : 'Missing ✗'}`);
  console.log(`✅ STRIPE_SECRET_KEY: ${secretKey ? 'Set ✓' : 'Missing ✗'}`);
  console.log(`✅ STRIPE_WEBHOOK_SECRET: ${webhookSecret ? 'Set ✓' : 'Missing ✗'}`);

  if (!publicKey || !secretKey) {
    console.log('\n❌ Missing required Stripe keys. Please check your .env.local file.');
    return;
  }

  // Validate key formats
  const isTestMode = secretKey.startsWith('sk_test_');
  const publicKeyValid = publicKey.startsWith('pk_test_') || publicKey.startsWith('pk_live_');
  
  console.log(`\n🧪 Mode: ${isTestMode ? 'Test Mode' : 'Live Mode'}`);
  console.log(`🔍 Public Key Format: ${publicKeyValid ? 'Valid ✓' : 'Invalid ✗'}`);

  // Test Stripe connection
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(secretKey, { apiVersion: '2025-08-27.basil' });
    
    console.log('\n🌐 Testing Stripe API Connection...');
    
    // Test basic API call
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Connected to Stripe successfully!`);
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Display Name: ${account.settings?.dashboard?.display_name || 'Not set'}`);

    // Test creating a product (test mode only)
    if (isTestMode) {
      console.log('\n🧪 Testing product creation...');
      const product = await stripe.products.create({
        name: 'Test Product - ARWEAR',
        description: 'Test product for ARWEAR integration',
        metadata: {
          test: 'true',
          app: 'arwear'
        }
      });
      
      console.log(`✅ Test product created: ${product.id}`);
      
      // Clean up - delete the test product
      await stripe.products.del(product.id);
      console.log(`🗑️  Test product deleted`);
    }

    console.log('\n🎉 All Stripe tests passed! Your integration is ready.');
    
  } catch (error) {
    console.log('\n❌ Stripe API Error:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Type: ${error.type || 'Unknown'}`);
    console.log(`   Code: ${error.code || 'Unknown'}`);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 Suggestion: Check that your STRIPE_SECRET_KEY is correct and active.');
    }
  }
}

// Test Stripe configuration
testStripeConfiguration().catch(console.error);