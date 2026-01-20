const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Get SendGrid API key from environment variable
// Set this in Firebase console: Project Settings > Functions > Configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

// Organizer email to receive waiver copies
const ORGANIZER_EMAIL = 'rbalakr@gmail.com';

/**
 * Cloud Function triggered when a waiver PDF is uploaded to Firebase Storage
 * Sends email with PDF attachment to player and organizer
 */
exports.sendWaiverEmail = functions.database
    .ref('/teams/{teamId}/players/{playerId}/pdfPath')
    .onCreate(async (snapshot, context) => {
        try {
            const pdfPath = snapshot.val();
            const { teamId, playerId } = context.params;

            console.log(`Processing waiver email for player ${playerId} in team ${teamId}`);
            console.log(`PDF path: ${pdfPath}`);

            // Validate SendGrid is configured
            if (!SENDGRID_API_KEY) {
                console.error('SendGrid API key not configured. Set it with: firebase functions:config:set sendgrid.key="YOUR_KEY"');
                return null;
            }

            // Get player data from database
            const playerSnapshot = await admin.database()
                .ref(`/teams/${teamId}/players/${playerId}`)
                .once('value');
            const playerData = playerSnapshot.val();

            if (!playerData) {
                console.error(`Player data not found for ${playerId}`);
                return null;
            }

            // Get team data from database
            const teamSnapshot = await admin.database()
                .ref(`/teams/${teamId}`)
                .once('value');
            const teamData = teamSnapshot.val();

            if (!teamData) {
                console.error(`Team data not found for ${teamId}`);
                return null;
            }

            console.log(`Player: ${playerData.name}, Team: ${teamData.name}, Email: ${playerData.email}`);

            // Download PDF from Firebase Storage
            const bucket = admin.storage().bucket();
            const file = bucket.file(pdfPath);

            const [exists] = await file.exists();
            if (!exists) {
                console.error(`PDF file not found at path: ${pdfPath}`);
                return null;
            }

            const [pdfBuffer] = await file.download();
            console.log(`Downloaded PDF, size: ${pdfBuffer.length} bytes`);

            // Convert to base64 for email attachment
            const pdfBase64 = pdfBuffer.toString('base64');

            // Get league name for email
            const leagueNames = {
                'pro-volleyball': 'Professional Volleyball League',
                'regular-volleyball': 'Regular Volleyball League',
                'masters-volleyball': 'Volleyball 45+ League',
                'women-throwball': 'Women Throwball League'
            };
            const leagueName = leagueNames[teamData.leagueId] || teamData.leagueId;

            // Get lunch choice display
            const lunchChoices = {
                'veg': 'Vegetarian Menu',
                'nonveg': 'Non-Vegetarian Menu',
                'none': 'No Food'
            };
            const lunchDisplay = lunchChoices[playerData.lunchChoice] || playerData.lunchChoice;

            // Format date
            const signedDate = new Date(playerData.waiverSignedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Email content
            const emailBody = `Dear ${playerData.name},

Thank you for signing the waiver for Republic Day Tournament 2026!

Your Registration Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Team: ${teamData.name}
  League: ${leagueName}
  Date Signed: ${signedDate}
  Lunch Preference: ${lunchDisplay}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your signed waiver is attached to this email for your records.

Important Tournament Information:
  📅 Date: January 24, 2026
  📍 Location: [Will be announced]
  🏐 Format: [Will be announced]

If you have any questions, please contact the tournament organizers.

See you at the tournament!

Republic Day Tournament Team
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated email. The organizer has been copied on this message.`;

            // Email message configuration
            const msg = {
                to: playerData.email,
                cc: ORGANIZER_EMAIL,
                from: ORGANIZER_EMAIL, // Must be verified in SendGrid
                subject: `Tournament Waiver Received - ${playerData.name} - ${teamData.name}`,
                text: emailBody,
                attachments: [
                    {
                        content: pdfBase64,
                        filename: `Waiver_${playerData.name.replace(/\s+/g, '_')}_${teamData.name.replace(/\s+/g, '_')}.pdf`,
                        type: 'application/pdf',
                        disposition: 'attachment'
                    }
                ]
            };

            // Send email via SendGrid
            await sgMail.send(msg);

            console.log(`✅ Waiver email sent successfully to ${playerData.email} and ${ORGANIZER_EMAIL}`);

            // Update database to mark email as sent
            await admin.database()
                .ref(`/teams/${teamId}/players/${playerId}`)
                .update({
                    emailSent: true,
                    emailSentAt: new Date().toISOString()
                });

            return null;

        } catch (error) {
            console.error('Error sending waiver email:', error);

            // If it's a SendGrid error, log more details
            if (error.response) {
                console.error('SendGrid error response:', error.response.body);
            }

            throw error;
        }
    });
