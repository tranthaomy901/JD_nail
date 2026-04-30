const ADMIN_EMAIL = "your-email@example.com";
const SHEET_NAME = "Leads";

const HEADERS = [
  "Created At",
  "Last Submitted At",
  "Full Name",
  "Phone",
  "Email",
  "Course Interested",
  "Message",
  "Source",
  "Status",
  "Submit Count",
  "Latest Message",
  "Latest Course Interested",
];

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
    const sheet = setupSheet();
    const data = parseRequestData(e);

    if (data.website) {
      return createJsonResponse({ ok: true, status: "ignored" });
    }

    const fullName = String(data.fullName || "").trim();
    const phone = String(data.phone || "").trim();
    const email = String(data.email || "").trim();
    const courseInterested = String(data.courseInterested || "").trim();
    const message = String(data.message || "").trim().slice(0, 1000);
    const source = String(data.source || "website").trim();

    if (!fullName || !phone) {
      return createJsonResponse({
        ok: false,
        status: "validation_error",
        error: "Full name and phone are required.",
      });
    }

    const now = new Date();
    const existingRow = findExistingLead(sheet, phone, email);

    if (existingRow) {
      const submitCountCell = sheet.getRange(existingRow, 10);
      const currentCount = Number(submitCountCell.getValue()) || 1;

      sheet.getRange(existingRow, 2).setValue(now);
      sheet.getRange(existingRow, 9).setValue("Updated");
      sheet.getRange(existingRow, 10).setValue(currentCount + 1);
      sheet.getRange(existingRow, 11).setValue(message);
      sheet.getRange(existingRow, 12).setValue(courseInterested);

      return createJsonResponse({
        ok: true,
        status: "updated",
        duplicate: true,
        row: existingRow,
      });
    }

    const lead = {
      createdAt: now,
      lastSubmittedAt: now,
      fullName,
      phone,
      email,
      courseInterested,
      message,
      source,
      status: "New",
      submitCount: 1,
      latestMessage: message,
      latestCourseInterested: courseInterested,
    };

    sheet.appendRow([
      lead.createdAt,
      lead.lastSubmittedAt,
      lead.fullName,
      lead.phone,
      lead.email,
      lead.courseInterested,
      lead.message,
      lead.source,
      lead.status,
      lead.submitCount,
      lead.latestMessage,
      lead.latestCourseInterested,
    ]);

    sendNewLeadEmail(lead);

    return createJsonResponse({
      ok: true,
      status: "new",
      duplicate: false,
    });
  } catch (error) {
    return createJsonResponse({
      ok: false,
      status: "error",
      error: error && error.message ? error.message : String(error),
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (error) {
      // Lock may not have been acquired.
    }
  }
}

function setupSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every(function(header, index) {
    return firstRow[index] === header;
  });

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function parseRequestData(e) {
  if (!e) return {};

  if (e.postData && e.postData.contents) {
    const contents = e.postData.contents;
    const type = String(e.postData.type || "").toLowerCase();

    if (type.indexOf("application/json") !== -1 || contents.trim().charAt(0) === "{") {
      try {
        return JSON.parse(contents);
      } catch (error) {
        // Fall through to form data.
      }
    }
  }

  return e.parameter || {};
}

function normalizePhone(phone) {
  const value = String(phone || "").trim();
  if (!value) return "";

  const hasPlus = value.charAt(0) === "+";
  const cleaned = value.replace(/[\s().-]/g, "").replace(/[^\d+]/g, "");

  if (hasPlus) {
    return "+" + cleaned.replace(/\+/g, "");
  }

  return cleaned.replace(/\+/g, "");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function findExistingLead(sheet, phone, email) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return null;

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowPhone = normalizePhone(row[3]);
    const rowEmail = normalizeEmail(row[4]);

    if (normalizedPhone && rowPhone && normalizedPhone === rowPhone) {
      return i + 2;
    }

    if (normalizedEmail && rowEmail && normalizedEmail === rowEmail) {
      return i + 2;
    }
  }

  return null;
}

function sendNewLeadEmail(lead) {
  if (!ADMIN_EMAIL || ADMIN_EMAIL === "your-email@example.com") return;

  const subject = "New website lead - Nail Coaching";
  const body = [
    "A new website lead has been submitted.",
    "",
    "Full Name: " + lead.fullName,
    "Phone: " + lead.phone,
    "Email: " + (lead.email || "-"),
    "Course Interested: " + (lead.courseInterested || "-"),
    "Message: " + (lead.message || "-"),
    "Created At: " + lead.createdAt,
    "Source: " + lead.source,
  ].join("\n");

  MailApp.sendEmail(ADMIN_EMAIL, subject, body);
}

function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
