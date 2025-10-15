# 🔑 Stripe Payment Setup Guide for ARWEAR

## 📋 Overview
This guide will help you set up Stripe payments for your ARWEAR application. Follow these steps to get your payment system running.

## 🚀 Quick Setup Steps

### 1. Create a Stripe Account
- Go to [stripe.com](https://stripe.com)
- Click "Start now" and create your account
- Complete the account verification process

### 2. Get Your API Keys

#### Test Mode Keys (for development):
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top left)
3. Navigate to **Developers > API Keys**
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal live key token"

#### Add Keys to Your Environment:
Open `.env.local` and replace the placeholder values:

```bash
# Stripe Test Keys
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
```

### 3. Test Your Setup
Run the test script to verify your keys:

```bash
node scripts/test_stripe.js
```

You should see:
- ✅ All environment variables set
- ✅ Connected to Stripe successfully
- ✅ Test product creation works

### 4. Set Up Webhooks (Optional for basic setup)

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click "Add endpoint"
3. Enter endpoint URL: `https://yourdomain.com/api/stripe-webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

## 🧪 Test Payment Flow

### Test Cards for Development:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Insufficient funds:** `4000 0000 0000 9995`
- **Any future expiry date** (e.g., 12/34)
- **Any 3-digit CVC** (e.g., 123)

### Testing Process:
1. Start your development server: `npm run dev`
2. Go to `/products` and add items to cart
3. Navigate to `/checkout`
4. Click "Pay with Stripe"
5. Use test card `4242 4242 4242 4242`
6. Complete the payment

## 🔒 Security Best Practices

### ✅ Do's:
- Keep secret keys secure and never commit them to version control
- Use test keys during development
- Validate webhook signatures
- Handle errors gracefully

### ❌ Don'ts:
- Never expose secret keys in client-side code
- Don't store card details on your servers
- Don't skip webhook signature verification in production

## 🌍 Going Live (Production)

When ready for production:

1. **Complete Stripe Account Setup:**
   - Provide business information
   - Add bank account details
   - Complete identity verification

2. **Switch to Live Keys:**
   - Toggle to "Live mode" in Stripe Dashboard
   - Get your live keys (start with `pk_live_` and `sk_live_`)
   - Update production environment variables

3. **Update Environment Variables:**
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

## 📊 Current Integration Features

Your ARWEAR app includes:

- ✅ **Shopping Cart:** Add AR wearables to cart
- ✅ **Checkout Page:** Secure payment processing
- ✅ **Price Conversion:** USD to INR conversion
- ✅ **Order Summary:** Detailed cart review
- ✅ **Error Handling:** Comprehensive error messages
- ✅ **Success/Cancel URLs:** Proper redirect handling
- ✅ **Webhook Support:** Payment confirmation handling

## 🛠️ Troubleshooting

### Common Issues:

**"Invalid API Key" Error:**
- Double-check your keys are copied correctly
- Ensure no extra spaces or characters
- Verify you're using the right mode (test vs live)

**"Stripe public key not found" Error:**
- Check `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` in `.env.local`
- Restart your development server after adding keys

**Payment not processing:**
- Check browser console for JavaScript errors
- Verify webhook endpoint is accessible
- Check Stripe Dashboard logs

### Getting Help:
- Check [Stripe Documentation](https://stripe.com/docs)
- Review [Stripe Dashboard logs](https://dashboard.stripe.com/test/logs)
- Use the test script: `node scripts/test_stripe.js`

## 📞 Support

If you need help:
1. Run the test script and share the output
2. Check the browser console for errors
3. Review Stripe Dashboard for transaction logs
4. Ensure all environment variables are set correctly

---

**🎉 Once configured, your ARWEAR app will have full payment processing capabilities!**