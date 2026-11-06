// FAQ Data for Axxspace Landlord Portal Help Center

export const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using Axxspace Manager',
  },
  {
    id: 'managing-properties',
    title: 'Managing Properties',
    description: 'How to add, edit, and manage your properties',
  },
  {
    id: 'qr-posters',
    title: 'QR Code Posters',
    description: 'Generate and use QR code marketing posters',
  },
  {
    id: 'caretakers',
    title: 'Caretaker Management',
    description: 'Invite and manage your property caretakers',
  },
  {
    id: 'account-settings',
    title: 'Account Settings',
    description: 'Manage your account and preferences',
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Solutions to common problems',
  },
];

export const faqs = [
  // ============================================
  // Getting Started (5 FAQs)
  // ============================================
  {
    id: 'gs-1',
    categoryId: 'getting-started',
    question: 'How do I create an account?',
    answer: `To create an account:

1. Download Axxspace Manager from Play Store
2. Tap "Register"
3. Enter your name, email, and phone number
4. Create a strong password
5. Verify your email
6. You're ready to start!

Your email and phone number will be used for notifications and account recovery.`,
  },
  {
    id: 'gs-2',
    categoryId: 'getting-started',
    question: 'How do I add my first property?',
    answer: `To add a property:

1. Tap the '+' button on the Dashboard
2. Fill in property details:
   - Property title
   - Property type (Apartment, Bedsitter, etc.)
   - Number of rooms
   - Monthly rent
3. Add photos of the property
4. Set location on the map
5. Add amenities (water, parking, etc.)
6. Tap 'Save'

Your property will be visible on www.axxspace.com immediately!`,
  },
  {
    id: 'gs-3',
    categoryId: 'getting-started',
    question: 'How do I invite caretakers?',
    answer: `To invite a caretaker:

1. Go to Settings → My Caretakers
2. Tap "Invite Caretaker"
3. Enter their phone number
4. They'll receive an SMS invitation
5. Once they register, they can help manage your properties

Caretakers can view your properties and respond to tenant inquiries, but cannot delete properties or change your account settings.`,
  },
  {
    id: 'gs-4',
    categoryId: 'getting-started',
    question: 'What are QR code posters?',
    answer: `QR code posters are marketing materials that tenants can scan to view your property.

How it works:
- Generate a QR code for any property
- Print the poster
- Place it at your property gate, noticeboard, or nearby shops
- When someone scans it with their phone camera, they go directly to your property listing on www.axxspace.com

This makes it easy for tenants to find your contact information and property details!`,
  },
  {
    id: 'gs-5',
    categoryId: 'getting-started',
    question: 'How do I verify my account?',
    answer: `Account verification is automatic:

1. Check your email for a verification link
2. Click the link in the email
3. Your account is now verified

If you didn't receive the email:
- Check your spam/junk folder
- Go to Settings → Account
- Tap "Resend Verification Email"

Verified accounts have access to all features and appear more trustworthy to potential tenants.`,
  },

  // ============================================
  // Managing Properties (8 FAQs)
  // ============================================
  {
    id: 'mp-1',
    categoryId: 'managing-properties',
    question: 'How do I edit property details?',
    answer: `To edit a property:

1. Tap on the property from your Dashboard
2. Tap the 'Edit' button (pencil icon)
3. Update any details you want to change
4. Tap 'Save Changes'

You can edit:
- Property title and description
- Rent amount
- Number of rooms
- Amenities
- Photos
- Location`,
  },
  {
    id: 'mp-2',
    categoryId: 'managing-properties',
    question: 'How do I add photos to my property?',
    answer: `To add or change photos:

1. Open the property
2. Tap 'Edit'
3. Scroll to Photos section
4. Tap '+' to add new photos
5. Choose from:
   - Take Photo (use camera)
   - Choose from Gallery
6. You can add up to 10 photos
7. Drag to reorder photos (first photo is the cover)
8. Tap 'Save'

Tips:
- Use good lighting
- Show all rooms
- Include exterior and surrounding area
- Avoid blurry or dark photos`,
  },
  {
    id: 'mp-3',
    categoryId: 'managing-properties',
    question: 'How do I mark a property as rented?',
    answer: `To mark a property as rented:

1. Open the property
2. Tap 'Edit'
3. Change availability status to "Rented"
4. Optionally add tenant details
5. Tap 'Save'

The property will:
- No longer appear in public listings
- Still be visible in your Dashboard
- Can be changed back to "Available" anytime`,
  },
  {
    id: 'mp-4',
    categoryId: 'managing-properties',
    question: 'How do I delete a property?',
    answer: `To delete a property:

1. Open the property
2. Tap 'Edit'
3. Scroll to the bottom
4. Tap 'Delete Property' (red button)
5. Confirm deletion

⚠️ Warning: This cannot be undone! All property data, photos, and QR code statistics will be permanently deleted.

Alternative: Instead of deleting, you can mark it as "Rented" to keep the data.`,
  },
  {
    id: 'mp-5',
    categoryId: 'managing-properties',
    question: 'Can I manage multiple properties?',
    answer: `Yes! You can add unlimited properties.

Each property:
- Has its own listing page
- Has its own QR code
- Can be managed independently
- Shows separate statistics

On the Dashboard, you'll see all your properties in a list. You can filter by:
- Available
- Rented
- All Properties`,
  },
  {
    id: 'mp-6',
    categoryId: 'managing-properties',
    question: 'How do I set property location?',
    answer: `To set or update location:

1. When adding/editing a property
2. Tap 'Locate on Map' button
3. The map will show your current location
4. You can:
   - Tap 'Use Current Location'
   - Or drag the map to the property location
   - Or search for the address
5. Tap 'Confirm Location'

Accurate location helps tenants:
- Find your property easily
- See nearby amenities
- Calculate commute distance`,
  },
  {
    id: 'mp-7',
    categoryId: 'managing-properties',
    question: 'What property types are supported?',
    answer: `Axxspace supports various property types:

Residential:
- Bedsitter
- One Bedroom
- Two Bedroom
- Three+ Bedroom
- Studio Apartment
- Mansion/House
- Hostel

Commercial:
- Shop/Store
- Office Space
- Warehouse
- Restaurant Space

Each type has specific fields relevant to that category.`,
  },
  {
    id: 'mp-8',
    categoryId: 'managing-properties',
    question: 'How do I add amenities?',
    answer: `To add amenities:

1. When adding/editing a property
2. Scroll to 'Amenities' section
3. Tap checkboxes for available amenities:
   - Water (24/7 or rationed)
   - Electricity
   - Wi-Fi
   - Parking
   - Security
   - Garbage collection
   - Laundry area
   - Backup generator
4. Tap 'Save'

Amenities help your property stand out and attract more tenants!`,
  },

  // ============================================
  // QR Code Posters (4 FAQs)
  // ============================================
  {
    id: 'qr-1',
    categoryId: 'qr-posters',
    question: 'How do I generate a QR code?',
    answer: `To generate a QR code poster:

1. Open any property
2. Tap "QR Poster" button
3. Select where you'll place the QR code:
   - Gate Poster
   - Noticeboard
   - Shop/Kiosk Nearby
   - Office
   - Vacancy Sign
4. Preview the poster
5. Choose what to do:
   - Share Poster (send via WhatsApp, email, etc.)
   - Download Poster (save to your phone)
   - Print Poster (opens print dialog)

Each placement location is tracked separately so you know which marketing method works best!`,
  },
  {
    id: 'qr-2',
    categoryId: 'qr-posters',
    question: 'Where should I place QR posters?',
    answer: `Best places to place QR posters:

Most Effective:
✅ Property gate (tenants see it when passing)
✅ Building entrance
✅ Nearby shops or kiosks

Also Effective:
- Noticeboard in the building
- Local matatu stages
- Community centers
- Barbershops/salons nearby
- Churches/mosques

Tips:
- Make sure the poster is visible
- Protect from rain (laminate or place under cover)
- Place at eye level
- Ensure good lighting for scanning
- Replace if damaged or faded`,
  },
  {
    id: 'qr-3',
    categoryId: 'qr-posters',
    question: 'Can I customize my QR code?',
    answer: `QR codes are automatically customized with:

✅ Your property details
✅ Axxspace branding
✅ Professional design
✅ Contact information
✅ Website link

The design is optimized to:
- Be easy to scan
- Look professional
- Include all necessary information
- Work when printed in black & white

Currently, you cannot change colors or design, but the standard design works great and has high scan rates!`,
  },
  {
    id: 'qr-4',
    categoryId: 'qr-posters',
    question: 'How do I track QR scans?',
    answer: `QR scan tracking is automatic:

To view stats:
1. Open any property
2. Tap "QR Stats" button
3. See:
   - Total scans
   - Scans by source (gate, noticeboard, etc.)
   - Scans over time
   - Peak scan times

This helps you:
- Know which marketing works
- Understand tenant interest
- Decide where to place more posters
- Track your property's visibility

Stats update in real-time as people scan your QR codes!`,
  },

  // ============================================
  // Caretaker Management (6 FAQs)
  // ============================================
  {
    id: 'ct-1',
    categoryId: 'caretakers',
    question: 'How do I invite a caretaker?',
    answer: `To invite a caretaker:

1. Go to Settings → My Caretakers
2. Tap "Invite Caretaker"
3. Enter their phone number
4. Tap "Send Invitation"
5. They'll receive an SMS with:
   - Download link for the app
   - Invitation code
6. Once they register and enter the code, they're added to your team

You can invite multiple caretakers at no extra cost!`,
  },
  {
    id: 'ct-2',
    categoryId: 'caretakers',
    question: 'Can caretakers add properties?',
    answer: `Yes! Caretakers have permission to:

✅ Add new properties on your behalf
✅ Edit existing properties
✅ Upload photos
✅ Generate QR codes
✅ View property statistics
✅ Respond to inquiries

They CANNOT:
❌ Delete properties
❌ Remove other caretakers
❌ Change your account settings
❌ Access your payment information

This allows them to help you manage properties while keeping your account secure.`,
  },
  {
    id: 'ct-3',
    categoryId: 'caretakers',
    question: 'How do I remove a caretaker?',
    answer: `To remove a caretaker:

1. Go to Settings → My Caretakers
2. Find the caretaker you want to remove
3. Tap the three dots (...) next to their name
4. Tap "Remove Caretaker"
5. Confirm removal

Once removed:
- They lose access immediately
- They can no longer view or edit your properties
- All property data remains intact
- You can re-invite them later if needed`,
  },
  {
    id: 'ct-4',
    categoryId: 'caretakers',
    question: 'What can caretakers see?',
    answer: `Caretakers can see:

✅ All your properties
✅ Property details and photos
✅ Tenant inquiries and messages
✅ QR code statistics
✅ Property performance data

They CANNOT see:
❌ Your personal information
❌ Your payment details
❌ Your bank account
❌ Other landlords' properties
❌ Your password

Caretakers only see property-related information needed to help you manage your listings effectively.`,
  },
  {
    id: 'ct-5',
    categoryId: 'caretakers',
    question: 'How many caretakers can I have?',
    answer: `You can add unlimited caretakers at no extra cost!

Common scenarios:
- 1 caretaker: Small landlord with few properties
- 2-3 caretakers: Multiple buildings or locations
- 5+ caretakers: Property management company

Each caretaker:
- Has their own login
- Can work independently
- Sees all your properties
- Actions are tracked (who added/edited what)

This flexibility helps you scale your property management as you grow!`,
  },
  {
    id: 'ct-6',
    categoryId: 'caretakers',
    question: 'Can caretakers edit property details?',
    answer: `Yes! Caretakers can edit most property details:

Can Edit:
✅ Property title and description
✅ Rent amount
✅ Number of rooms
✅ Amenities
✅ Photos
✅ Availability status
✅ Location

Cannot Edit:
❌ Property ownership
❌ Delete property permanently

All edits are tracked, so you can see who made changes and when. This accountability helps maintain quality while allowing your team to work efficiently.`,
  },

  // ============================================
  // Account Settings (7 FAQs)
  // ============================================
  {
    id: 'as-1',
    categoryId: 'account-settings',
    question: 'How do I change my password?',
    answer: `To change your password:

1. Go to Settings
2. Tap "Change Password"
3. Enter your current password
4. Enter your new password
5. Confirm new password
6. Tap "Save"

Password requirements:
- At least 8 characters
- Mix of letters and numbers
- At least one uppercase letter recommended

For security, you'll be logged out and need to log in again with your new password.`,
  },
  {
    id: 'as-2',
    categoryId: 'account-settings',
    question: 'How do I update my phone number?',
    answer: `To update your phone number:

1. Go to Settings
2. Tap "Change Contact"
3. Enter your new phone number
4. Tap "Send Verification Code"
5. Enter the code sent to your new number
6. Tap "Verify and Save"

Your phone number is used for:
- Account recovery
- Notifications
- Tenant communication
- Security verification

Make sure to use a phone number you have access to!`,
  },
  {
    id: 'as-3',
    categoryId: 'account-settings',
    question: 'How do I change my email?',
    answer: `To change your email:

1. Go to Settings
2. Tap "Change Email"
3. Enter your new email address
4. Tap "Send Verification Link"
5. Check your new email inbox
6. Click the verification link
7. Your email is updated

Your email is used for:
- Login
- Important notifications
- Password recovery
- Support communication

You'll need to verify your new email before it becomes active.`,
  },
  {
    id: 'as-4',
    categoryId: 'account-settings',
    question: 'How do I enable notifications?',
    answer: `To manage notifications:

1. Go to Settings
2. Tap "Notifications"
3. Toggle notification types:
   - New tenant inquiries
   - Property updates
   - QR code scans
   - System updates
   - Marketing messages

You can also manage notifications at the system level:
- Android: Settings → Apps → Axxspace Manager → Notifications
- Make sure notifications are allowed

Recommended: Keep inquiry notifications ON so you don't miss potential tenants!`,
  },
  {
    id: 'as-5',
    categoryId: 'account-settings',
    question: 'Can I delete my account?',
    answer: `Yes, you can delete your account:

1. Go to Settings
2. Scroll to bottom
3. Tap "Delete Account"
4. Read the warning carefully
5. Enter your password to confirm
6. Tap "Permanently Delete"

⚠️ Warning: This is permanent and cannot be undone!

What gets deleted:
- Your account and profile
- All your properties
- All photos and data
- QR code statistics
- Caretaker connections

Alternative: Instead of deleting, you can mark all properties as "Rented" to hide them temporarily.`,
  },
  {
    id: 'as-6',
    categoryId: 'account-settings',
    question: 'How do I logout?',
    answer: `To logout:

1. Go to Settings
2. Scroll to bottom
3. Tap "Logout"
4. Confirm logout

After logging out:
- You'll return to the login screen
- Your data remains safe on our servers
- You can log back in anytime with your email and password

Tip: Only logout if someone else will use your phone. The app is designed to stay logged in for convenience.`,
  },
  {
    id: 'as-7',
    categoryId: 'account-settings',
    question: 'Is my data secure?',
    answer: `Yes! Your data is highly secure:

Security Measures:
✅ Encrypted data transmission (HTTPS)
✅ Secure password storage (hashed)
✅ Regular security audits
✅ Protected servers
✅ No sharing with third parties

Your privacy:
- We never sell your data
- We never share your personal information
- We only use your email for account-related communication
- You control what data is public (property listings) vs private (personal info)

For questions about security or privacy, contact support@axxspace.com`,
  },

  // ============================================
  // Troubleshooting (10 FAQs)
  // ============================================
  {
    id: 'ts-1',
    categoryId: 'troubleshooting',
    question: 'App is crashing on startup',
    answer: `If the app crashes when you open it:

1. Force close the app completely
2. Clear app cache:
   - Settings → Apps → Axxspace Manager → Storage → Clear Cache
3. Restart your phone
4. Open the app again

If still crashing:
5. Check for updates in Play Store
6. Uninstall and reinstall the app (your data is safe on our servers)
7. Make sure you have Android 8.0 or higher

Still having issues? Contact us with:
- Your phone model
- Android version
- When the crash happens`,
  },
  {
    id: 'ts-2',
    categoryId: 'troubleshooting',
    question: "Can't upload images",
    answer: `If you can't upload property photos:

1. Check permissions:
   - Settings → Apps → Axxspace Manager → Permissions
   - Enable Camera and Storage permissions

2. Check your internet connection:
   - Make sure you're connected to WiFi or mobile data
   - Try again with a stronger connection

3. Check image size:
   - Max size: 10MB per image
   - Try compressing large images

4. Clear app cache and try again

5. Make sure you have enough storage space on your phone

Still not working? Try:
- Taking a new photo instead of selecting from gallery
- Restarting the app
- Updating to the latest version`,
  },
  {
    id: 'ts-3',
    categoryId: 'troubleshooting',
    question: 'QR code not working when scanned',
    answer: `If QR codes aren't working:

1. Check the QR code quality:
   - Is it printed clearly?
   - Is it damaged or faded?
   - Is there good lighting?

2. How to scan properly:
   - Use your phone camera app (not WhatsApp)
   - Hold steady, don't move
   - Make sure the entire QR code is visible
   - Try from different distances (15-30cm away)

3. Test the QR code:
   - Scan it yourself before printing
   - Try with different phones
   - Make sure your property is still published

4. Regenerate the QR code:
   - Open the property
   - Generate a new QR poster
   - Print and test again

Note: All modern phones (2017+) can scan QR codes with the default camera app!`,
  },
  {
    id: 'ts-4',
    categoryId: 'troubleshooting',
    question: 'Location not detecting',
    answer: `If location isn't working:

1. Enable location services:
   - Settings → Location → Turn ON
   - Make sure GPS is enabled

2. Check app permissions:
   - Settings → Apps → Axxspace Manager → Permissions
   - Enable Location permission

3. Go outside if you're indoors:
   - GPS works better outdoors
   - Move away from tall buildings

4. Wait a moment:
   - GPS can take 10-30 seconds to lock on
   - Don't move while it's detecting

5. Restart the app and try again

Alternative:
- Instead of using current location, drag the map manually to your property location
- Or search for your property address`,
  },
  {
    id: 'ts-5',
    categoryId: 'troubleshooting',
    question: 'Push notifications not working',
    answer: `If you're not receiving notifications:

1. Check app notification settings:
   - Settings → Apps → Axxspace Manager → Notifications
   - Make sure notifications are ALLOWED

2. Check in-app settings:
   - Open Axxspace Manager
   - Go to Settings → Notifications
   - Make sure notification types are enabled

3. Check Do Not Disturb mode:
   - Make sure your phone isn't in silent/DND mode

4. Check battery optimization:
   - Settings → Battery → Battery Optimization
   - Find Axxspace Manager
   - Set to "Don't optimize"

5. Reinstall the app:
   - Sometimes notification tokens need to be refreshed

Note: New tenant inquiries are important! Make sure those notifications are enabled so you don't miss opportunities.`,
  },
  {
    id: 'ts-6',
    categoryId: 'troubleshooting',
    question: 'App is very slow',
    answer: `If the app is running slowly:

1. Check your internet connection:
   - Switch between WiFi and mobile data
   - Run a speed test
   - Move closer to your WiFi router

2. Clear app cache:
   - Settings → Apps → Axxspace Manager → Storage → Clear Cache
   - This won't delete your data

3. Close other apps:
   - Free up RAM by closing background apps
   - Restart your phone

4. Check for updates:
   - Update Axxspace Manager from Play Store
   - Update your Android OS if available

5. Check storage space:
   - Make sure you have at least 1GB free space
   - Delete unnecessary files/apps

6. Older phones:
   - App requires at least 2GB RAM
   - Works best on phones from 2018 or newer

If using on a slow network, some features may take time to load, especially property images.`,
  },
  {
    id: 'ts-7',
    categoryId: 'troubleshooting',
    question: "Can't see my properties",
    answer: `If your properties aren't showing:

1. Check if you're logged in:
   - Go to Settings
   - Verify you're logged into the correct account

2. Check your internet connection:
   - Properties load from our servers
   - Make sure you're connected

3. Pull to refresh:
   - Swipe down on the Dashboard to refresh
   - Wait a few seconds

4. Check if properties were deleted:
   - Go to Settings → Activity Log (if available)
   - Check if someone deleted them

5. Check if you're viewing the right filter:
   - Make sure "All Properties" is selected
   - Not just "Available" or "Rented"

6. Logout and login again:
   - Settings → Logout
   - Login with your credentials

Still missing? Contact support with:
- Your account email
- Property names
- When they disappeared`,
  },
  {
    id: 'ts-8',
    categoryId: 'troubleshooting',
    question: 'Login issues',
    answer: `If you can't log in:

Wrong password:
1. Tap "Forgot Password?"
2. Enter your email
3. Check email for reset link
4. Create a new password

Account doesn't exist:
- Make sure you're using the correct email
- Check if you registered with a different email
- Try registering again if needed

Email not verified:
- Check your inbox for verification email
- Check spam/junk folder
- Tap "Resend Verification Email"

App won't accept login:
1. Check internet connection
2. Make sure app is up to date
3. Try uninstalling and reinstalling
4. Contact support if still not working

Security tip: Never share your password with anyone, including people claiming to be from Axxspace!`,
  },
  {
    id: 'ts-9',
    categoryId: 'troubleshooting',
    question: 'Forgot password',
    answer: `To reset your password:

1. On the login screen, tap "Forgot Password?"
2. Enter your registered email address
3. Tap "Send Reset Link"
4. Check your email inbox
5. Click the reset link (valid for 1 hour)
6. Create a new password
7. Confirm your new password
8. Log in with your new password

Didn't receive the email?
- Check spam/junk folder
- Make sure you entered the correct email
- Try again after a few minutes
- Email support@axxspace.com if still not received

Note: For security, reset links expire after 1 hour. If expired, request a new one.`,
  },
  {
    id: 'ts-10',
    categoryId: 'troubleshooting',
    question: 'Email not verified',
    answer: `If your email isn't verified:

1. Check your inbox:
   - Look for email from noreply@axxspace.com
   - Subject: "Verify your Axxspace account"

2. Check spam/junk folder:
   - Verification emails sometimes go to spam
   - Mark as "Not Spam" if found

3. Resend verification email:
   - Go to Settings → Account
   - Tap "Resend Verification Email"
   - Wait a few minutes

4. Try a different email:
   - If you no longer have access to the email
   - Settings → Change Email
   - Verify the new email

Why verify?
- Unlock all features
- Recover account if you forget password
- Receive important notifications
- Build trust with potential tenants

Still having issues? Contact support@axxspace.com from your registered email address.`,
  },
];

// Helper function to get FAQs by category
export const getFAQsByCategory = (categoryId) => {
  return faqs.filter(faq => faq.categoryId === categoryId);
};

// Helper function to search FAQs
export const searchFAQs = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return faqs.filter(faq => 
    faq.question.toLowerCase().includes(lowercaseQuery) ||
    faq.answer.toLowerCase().includes(lowercaseQuery)
  );
};

// Helper function to get category by ID
export const getCategoryById = (categoryId) => {
  return faqCategories.find(cat => cat.id === categoryId);
};
