# Firebase Deployment Guide

## Important: Prerequisites Before Deploying

Firebase Cloud Functions require the **Blaze (pay-as-you-go) plan**, but **you'll stay within the free tier** for this tournament.

### What You Need to Do (In Order):

---

## Step 1: Upgrade to Blaze Plan (5 minutes)

**Don't worry - it's still FREE for your usage!**

1. Go to: https://console.firebase.google.com/project/rdtournament2026/usage/details

2. Click **"Upgrade to Blaze"** or **"Modify Plan"**

3. **Add a payment method** (required, but you won't be charged for tournament usage)

4. **Set a budget alert** (recommended):
   - Set budget to **$5/month**
   - Get email alerts if costs approach this (they won't)

5. **Confirm upgrade**

### Why You Won't Be Charged:

**Free Tier Limits (more than enough for tournament):**
- Cloud Functions: 2M invocations/month (you'll use ~200)
- Cloud Functions: 400,000 GB-seconds compute (you'll use ~0.1%)
- Storage: 5GB storage (your PDFs = ~10MB total)
- Storage: 1GB/day downloads (you'll use ~2MB/day)
- SendGrid: 100 emails/day free (you'll send ~200 total over several days)

**Your estimated cost: $0.00**

---

## Step 2: Enable Firebase Storage (2 minutes)

1. Go to: https://console.firebase.google.com/project/rdtournament2026/storage

2. Click **"Get Started"**

3. Choose **"Start in production mode"** (we have custom rules)

4. Select location: **us-central** (recommended)

5. Click **"Done"**

---

## Step 3: Set SendGrid API Key (3 minutes)

We need to set your SendGrid API key as an environment variable.

### Option A: Via Firebase Console (Easier)

1. Go to: https://console.firebase.google.com/project/rdtournament2026/functions

2. Click on **"Environment variables"** or **"Configuration"** tab

3. Click **"Add variable"**

4. Enter:
   - **Key:** `SENDGRID_API_KEY`
   - **Value:** `[YOUR_SENDGRID_API_KEY_FROM_STEP_2]`

5. Click **"Save"**

### Option B: Via CLI (After Blaze upgrade)

```bash
firebase functions:secrets:set SENDGRID_API_KEY
```

When prompted, paste your SendGrid API key from Step 2

---

## Step 4: Deploy Functions and Storage Rules (2 minutes)

Run this command from your project directory:

```bash
firebase deploy
```

This will deploy:
- ✅ Cloud Function (`sendWaiverEmail`)
- ✅ Storage rules (PDF security)
- ✅ Updated hosting (with PDF upload code)

Wait for deployment to complete (~1-2 minutes).

---

## Step 5: Verify SendGrid Sender Email (5 minutes)

**Important:** SendGrid requires you to verify `rbalakr@gmail.com` before sending emails.

1. Login to SendGrid: https://app.sendgrid.com/

2. Go to **Settings** → **Sender Authentication**

3. Click **"Verify a Single Sender"**

4. Fill in:
   - **From Name:** Republic Day Tournament
   - **From Email:** `rbalakr@gmail.com`
   - **Reply To:** `rbalakr@gmail.com`
   - **Company:** Republic Day Tournament
   - **Address, City, State, Zip:** (Your info)
   - **Country:** United States

5. Click **"Create"**

6. **Check your email** at `rbalakr@gmail.com`

7. **Click the verification link** from SendGrid

8. Done! ✅

---

## Step 6: Test the System (5 minutes)

1. Go to your tournament website: https://rdtournament2026.web.app/

2. Login as a test player (or use a test player link)

3. Fill out and submit a waiver form

4. Watch for these messages:
   - ✅ "Registration submitted successfully!"
   - ✅ "Generating PDF and sending email..."
   - ✅ "Email will be sent shortly!"

5. **Check emails** (usually arrives within 10-30 seconds):
   - Player's email inbox
   - `rbalakr@gmail.com` inbox

6. Verify email contains:
   - ✅ PDF attachment with signature
   - ✅ Player details in body
   - ✅ Subject: "Tournament Waiver Received - [Name] - [Team]"

---

## Step 7: Monitor Function Logs (Optional)

To see real-time logs of your Cloud Function:

```bash
firebase functions:log --only sendWaiverEmail
```

You should see:
```
✅ Waiver email sent successfully to player@email.com and rbalakr@gmail.com
```

Or view logs in Firebase Console:
https://console.firebase.google.com/project/rdtournament2026/functions/logs

---

## Troubleshooting

### "Project must be on Blaze plan" error
- Complete Step 1 (upgrade to Blaze)
- Wait 1-2 minutes for changes to propagate
- Try `firebase deploy` again

### "Storage has not been set up" error
- Complete Step 2 (enable Storage in console)
- Try `firebase deploy` again

### "Sender not verified" error in logs
- Complete Step 5 (verify sender email in SendGrid)
- Check your `rbalakr@gmail.com` inbox for verification email

### Email not arriving
1. Check Firebase Functions logs: `firebase functions:log`
2. Look for errors or "Email sent successfully" message
3. Check SendGrid Activity Feed: https://app.sendgrid.com/email_activity
4. Check spam folder in both emails

### PDF upload fails in browser
1. Open browser console (F12)
2. Look for Storage permission errors
3. Verify you're logged in when submitting waiver
4. Check that Storage rules deployed: `firebase deploy --only storage`

---

## Summary of Changes

### Code Changes Made:
- ✅ Updated `functions/index.js` to use `process.env.SENDGRID_API_KEY`
- ✅ Created `.env` file for local testing (not committed to git)
- ✅ Updated `.gitignore` to exclude `.env` file

### What Happens After Setup:

```
Player submits waiver
  ↓
PDF auto-generates in browser (with signature)
  ↓
PDF uploads to Firebase Storage
  ↓
Cloud Function detects upload (triggers automatically)
  ↓
Function downloads PDF from Storage
  ↓
Function sends email via SendGrid
  ↓
Email arrives at:
  - Player's email (TO)
  - rbalakr@gmail.com (CC)
```

### Files in Email:
- **PDF Attachment:** Signed waiver with embedded signature
- **Email Body:** Player name, team, league, date signed, lunch preference

---

## Cost Monitoring

Set up budget alerts in Firebase:
https://console.firebase.google.com/project/rdtournament2026/usage/details

Recommended alerts:
- **$5/month** - First warning
- **$10/month** - Second warning (you'll never hit this)

Your actual cost should be **$0.00** for the tournament.

---

## Next Steps After Deployment

1. ✅ All waivers will auto-email as players submit them
2. ✅ You'll receive copies at `rbalakr@gmail.com`
3. ✅ Players get their own copy for records
4. ✅ No manual work needed!

Ready to go? Start with **Step 1: Upgrade to Blaze Plan**
