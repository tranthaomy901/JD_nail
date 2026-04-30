# Google Sheets Lead Capture Setup

## 1. Create Google Sheet

1. Create a Google Sheet named `Nail Leads`.
2. Create or keep a tab named `Leads`.
3. Open `Extensions` -> `Apps Script`.
4. Paste the full code from `google-apps-script-code.gs`.
5. Change this line near the top:

```js
const ADMIN_EMAIL = "your-email@example.com";
```

Replace it with your real notification email.

## 2. Initialize Sheet

1. In Apps Script, choose function `setupSheet`.
2. Click `Run`.
3. Approve permissions.
4. Confirm the `Leads` tab has these headers:

```text
Created At
Last Submitted At
Full Name
Phone
Email
Course Interested
Message
Source
Status
Submit Count
Latest Message
Latest Course Interested
```

## 3. Deploy Web App

1. Click `Deploy` -> `New deployment`.
2. Select type: `Web app`.
3. Execute as: `Me`.
4. Who has access: `Anyone`.
5. Click `Deploy`.
6. Copy the Web App URL ending in `/exec`.
7. Open `js/main.js`.
8. Replace:

```js
const GOOGLE_SCRIPT_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_EXEC_URL_HERE';
```

with:

```js
const GOOGLE_SCRIPT_URL = 'YOUR_WEB_APP_EXEC_URL';
```

## 4. Test Cases

### New lead

Submit the form from `contact.html`.

Expected:
- A new row appears in `Leads`.
- `Submit Count` is `1`.
- Email notification is sent to `ADMIN_EMAIL`.

### Duplicate phone

Submit again with the same phone number.

Expected:
- No new row is created.
- Existing row updates:
  - `Last Submitted At`
  - `Submit Count`
  - `Latest Message`
  - `Latest Course Interested`
- No new-lead email is sent.

### Duplicate email

Submit again with the same email.

Expected:
- No new row is created.
- Existing row updates.

### Honeypot bot test

Manually add a value to the hidden `website` field in DevTools and submit.

Expected:
- No row is created.
- No email is sent.

### Missing required fields

Submit without full name or phone.

Expected:
- The frontend blocks submission.
- Nothing is saved to Google Sheets.

## Notes

- The frontend sends `application/x-www-form-urlencoded` data for better compatibility with static HTML and Google Apps Script.
- If a browser blocks reading the Apps Script response because of CORS, the form falls back to `no-cors`. The lead can still be saved, but the frontend may show a generic success message instead of the exact duplicate/new status.
