<?php
// POST /api/contact.php: the contact form on /contact/.
// Every submission is logged (data_dir/submissions.jsonl) before the email goes out,
// so an enquiry is never lost if mail delivery fails.

declare(strict_types=1);
require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    bog_json(405, ['ok' => false, 'error' => 'Method not allowed']);
}

$fail = function (string $msg, int $status = 422): never {
    if (bog_wants_json()) {
        bog_json($status, ['ok' => false, 'error' => $msg]);
    }
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Bin Othaimeen Group</title>'
        . '<body style="font-family:sans-serif;background:#0c0437;color:#f5f1e8;padding:40px"><p>' . htmlspecialchars($msg)
        . '</p><p><a style="color:#e2b45c" href="javascript:history.back()">Go back</a></p>';
    exit;
};

if (bog_field('type', 20) !== 'contact') {
    $fail('Unknown form.', 400);
}

// --- spam checks: honeypot, fill-time, rate limit ---------------------------------------
$ts = (int) bog_field('ts', 20);
$tooFast = $ts > 0 && (int) (microtime(true) * 1000) - $ts < 2500;
if (bog_field('website') !== '' || $tooFast) {
    bog_log('contact', ['email' => bog_field('email', 160)], 'spam');
    bog_json(200, ['ok' => true]);   // pretend success so bots learn nothing
}
if (bog_rate_limited()) {
    $fail('Too many submissions from your connection. Please try again in a few minutes.', 429);
}

// --- validate ---------------------------------------------------------------------------
$reasons = ['Inquiry', 'Book a call', 'General comments', 'Complaint', 'Careers'];
$areas = ['General', 'Advisory / Consulting', 'Marketing', 'SEO', 'Market Entry', 'Leadcrystal'];

$email = bog_field('email', 160);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $fail('Please enter a valid email address.');
}
$f = [
    'email' => $email,
    'name' => bog_one_line(bog_field('name', 120)),
    'company' => bog_one_line(bog_field('company', 160)),
    'phone' => bog_one_line(bog_field('phone', 40)),
    'reason' => bog_one_line(bog_field('reason', 40)),
    'area' => bog_one_line(bog_field('area', 40)),
    'message' => bog_field('message', 5000),
];
if (!in_array($f['reason'], $reasons, true)) {
    $f['reason'] = 'Inquiry';
}
if (!in_array($f['area'], $areas, true)) {
    $f['area'] = 'General';
}
if ($f['name'] === '' || $f['message'] === '') {
    $fail('Please fill in your name and message.');
}

$subject = "Website {$f['reason']}: {$f['name']}" . ($f['company'] ? " ({$f['company']})" : '') . " re {$f['area']}";
$body = "New message from othaimeengrp.com\n\n"
    . "Reason:   {$f['reason']}\n"
    . "Area:     {$f['area']}\n"
    . "Name:     {$f['name']}\n"
    . "Email:    {$email}\n"
    . 'Company:  ' . ($f['company'] ?: '-') . "\n"
    . 'Phone:    ' . ($f['phone'] ?: '-') . "\n\n"
    . "Message:\n{$f['message']}\n"
    . "\n--\nSent from " . bog_one_line((string) ($_SERVER['HTTP_REFERER'] ?? 'othaimeengrp.com')) . ' at ' . date('Y-m-d H:i T') . "\n";

// --- send, then log the outcome ---------------------------------------------------------
$err = bog_send_mail($subject, $body, $email, $f['name']);
bog_log('contact', $f, $err === '' ? 'sent' : 'logged-only: ' . $err);
if ($err !== '') {
    error_log('[othaimeen form] ' . $err);
}

if (bog_wants_json()) {
    bog_json(200, ['ok' => true]);
}
header('Location: /contact/?sent=1#enquiry', true, 303);   // no-JavaScript fallback
exit;
