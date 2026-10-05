# QR Library Cards and Book-Copy Labels

## Purpose

The system assigns a persistent QR value to every member account and every physical book copy. These codes support the future web-based circulation workflow without placing passwords, email addresses, or loan history inside a QR code.

## Member QR library card

- The Android member app displays a digital library card in **Profile**.
- The QR value begins with `RCJK-MEMBER-`.
- A librarian will later scan it from the web circulation page to look up the member.
- If a member does not have a working phone, the librarian can still search or enter the member ID manually.

## Book-copy QR label

- Every physical copy, including copies of the same title, has its own QR value.
- The QR value begins with `RCJK-COPY-`.
- In the web admin panel, open **Books**, choose a title, then use **View label** for a copy.
- Print the displayed label and attach it to that particular physical copy.

## Security rule

A QR code identifies an account or copy. It does not prove identity and does not authorize borrowing by itself. During circulation, the librarian must still verify the member shown by the system and confirm the transaction.

## Current scope

This release creates and displays the unique QR codes. Webcam scanning and the dedicated borrow/return circulation screen are the next implementation phase.
