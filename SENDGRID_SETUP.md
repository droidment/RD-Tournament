# SendGrid Setup Instructions

This guide will help you complete the email automation setup for the tournament waiver system.

## What's Been Done ✅

1. ✅ Firebase Functions initialized in `/functions` directory
2. ✅ Cloud Function code written in `/functions/index.js`
3. ✅ Firebase Storage rules created in `storage.rules`
4. ✅ Client code updated to auto-upload PDFs to Storage
5. ✅ npm packages installed (SendGrid, Firebase Admin)

## What You Need to Do

### Step 1: Create SendGrid Account (5 minutes)

1. Go to https://sendgrid.com/
2. Click "Start for Free"
3. Create account with email: `rbalakr@gmail.com` (or any email)
4. Verify your email address
5. **Free tier includes 100 emails/day** - perfect for your tournament

### Step 2: Get SendGrid API Key (2 minutes)

1. Login to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Name it: "Tournament Waiver Emails"
5. Permission: **"Full Access"** (for simplicity)
6. Click **"Create & View"**
7. **COPY THE API KEY** - it looks like: `SG.xxxxxxxxxxxxxxxxxxxxxx`
8. **IMPORTANT:** Save it somewhere safe - you can't see it again!

### Step 3: Verify Sender Email (5 minutes)

SendGrid requires you to verify the "from" email address before you can send emails.

1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in the form:
   - **From Name:** Republic Day Tournament
   - **From Email:** `rbalakr@gmail.com`
   - **Reply To:** `rbalakr@gmail.com`
   - **Company:** Republic Day Tournament
   - **Address:** (Your address)
   - **City/State/Zip:** (Your location)
   - **Country:** United States
4. Click **"Create"**
5. **Check your email** (`rbalakr@gmail.com`)
6. **Click the verification link** in the SendGrid email
7. Done! Your sender email is verified

### Step 4: Configure Firebase with API Key (1 minute)

Open your terminal in the project directory and run:

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY_HERE"
```

Replace `YOUR_SENDGRID_API_KEY_HERE` with the actual API key you copied in Step 2.

Example:
```bash
firebase functions:config:set sendgrid.key="SG.abc123xyz789..."
```

### Step 5: Deploy Everything (2 minutes)

Deploy Functions, Storage rules, and the updated client code:

```bash
firebase deploy
```

This will deploy:
- Cloud Function (`sendWaiverEmail`)
- Storage rules
- Hosting (updated app-v2.js with PDF upload)

Wait for deployment to complete (usually 1-2 minutes).

### Step 6: Test the System (5 minutes)

1. Go to your tournament website
2. Login as a test player
3. Fill out and submit a waiver
4. You should see:
   - "Registration submitted successfully!"
   - "Generating PDF and sending email..."
   - "Email will be sent shortly!"

5. **Check your email** (both player email and `rbalakr@gmail.com`)
6. You should receive an email with:
   - Subject: "Tournament Waiver Received - [Player Name] - [Team Name]"
   - PDF attachment with signature
   - Player details in email body

### Step 7: Monitor (Optional)

To see Cloud Function logs:

```bash
firebase functions:log
```

You'll see messages like:
```
✅ Waiver email sent successfully to player@email.com and rbalakr@gmail.com
```

## How It Works

### Player Flow:
```
Player signs waiver on form
  ↓
Submits form
  ↓
PDF auto-generates (client-side with signature)
  ↓
PDF uploads to Firebase Storage
  ↓
Database updated with PDF path
  ↓
Cloud Function detects new PDF path
  ↓
Function downloads PDF from Storage
  ↓
Function sends email via SendGrid
  ↓
Email arrives at player email + rbalakr@gmail.com
```

### Files Created:

- `/functions/package.json` - Dependencies
- `/functions/index.js` - Cloud Function code
- `/functions/.gitignore` - Ignore node_modules
- `storage.rules` - Firebase Storage security rules
- `firebase.json` - Updated with functions and storage config
- `app-v2.js` - Updated with PDF upload logic

### What Gets Emailed:

**TO:** Player's email address
**CC:** `rbalakr@gmail.com`
**SUBJECT:** `Tournament Waiver Received - [Player Name] - [Team Name]`
**ATTACHMENT:** PDF with signed waiver and embedded signature
**BODY:** Player details (name, team, league, date signed, lunch preference)

## Cost Estimate

- **Firebase Functions:** FREE (2M invocations/month, you'll use ~200)
- **Firebase Storage:** FREE (5GB storage, your PDFs = ~10MB total)
- **SendGrid:** FREE (100 emails/day, you'll send ~200 over several days)
- **Firebase Hosting:** FREE (10GB bandwidth/month)

**Total Monthly Cost: $0**

## Troubleshooting

### "SendGrid API key not configured" error
Run this command:
```bash
firebase functions:config:set sendgrid.key="YOUR_KEY"
firebase deploy --only functions
```

### "Sender not verified" error
- Go back to Step 3 and verify `rbalakr@gmail.com` in SendGrid
- Check your email for the verification link

### Email not arriving
1. Check Firebase Functions logs: `firebase functions:log`
2. Check SendGrid Activity: SendGrid Dashboard → Email Activity
3. Check spam folder

### PDF not uploading
1. Check browser console for errors
2. Verify you're logged in when submitting waiver
3. Check Firebase Storage rules are deployed: `firebase deploy --only storage`

## Next Steps

After successful test:
1. You'll receive ALL waiver PDFs automatically at `rbalakr@gmail.com`
2. Players get a copy too for their records
3. No manual downloading or emailing needed!
4. All ~200 tournament waivers will auto-email as players submit them

## Questions?

Check the logs:
```bash
# View recent Cloud Function logs
firebase functions:log

# View specific function logs
firebase functions:log --only sendWaiverEmail
```
