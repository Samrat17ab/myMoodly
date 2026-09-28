import assert from "node:assert/strict";
import test from "node:test";
import { findContactDetail } from "../app/lib/contactDetails.ts";

test("blocks contact details in a check-in note", () => {
  const blocked = {
    phone: ["call me 9841234567", "+977 984-123-4567", "98 41 23 45 67", "(01) 4412345", "९८४१२३४५६७"],
    email: ["me@gmail.com", "write to sam.l@outlook.co.uk", "sam at gmail dot com", "samuel gmail.com"],
    link: ["https://example.org/x", "www.mysite.net", "insta.com/sam", "t.me/samuel", "bit.ly/abc"],
    handle: ["@sam_123", "insta: sam_123", "snap id - samuel", "add me on snapchat", "my number is below", "my insta is sam", "dm me on ig"],
  };
  for (const [kind, notes] of Object.entries(blocked)) {
    for (const note of notes) assert.equal(findContactDetail(note), kind, `expected ${kind}: ${note}`);
  }
});

test("allows ordinary notes, times, dates and small numbers", () => {
  const allowed = [
    "Exam tomorrow and my head won't slow down",
    "Long day",
    "Can't switch off",
    "Slept at 2:30 again",
    "Exam on 12/10, stressed",
    "Rent is 25000 this month",
    "Scrolling insta all night and feel worse",
    "Lost my job after 3 years",
    "e.g. just need someone to listen",
    "Feeling low since 2019",
    "Missing my mum. She lived at 14 Park Rd",
  ];
  for (const note of allowed) assert.equal(findContactDetail(note), null, `should allow: ${note}`);
});
