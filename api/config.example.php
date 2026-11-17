<?php
// Copy to  ../../othaimeen-private/config.php  (one level ABOVE public_html) and fill in.
// Never commit the real file.
return [
    // Who receives website enquiries.
    'to' => ['info@othaimeengrp.com'],

    // Sender address. Must be a mailbox whose provider's SPF/DKIM cover the SMTP host below.
    'from' => 'info@othaimeengrp.com',
    'from_name' => 'Bin Othaimeen Group website',

    // Send through a real mailbox, not PHP mail(): othaimeengrp.com publishes SPF -all and
    // DMARC p=quarantine, so mail from the web host's own mailer would be junked or rejected.
    // Implicit TLS: port 465 + 'ssl'. STARTTLS: port 587 + 'tls'.
    // A blank 'pass' means "not set up yet": submissions are logged, not emailed.
    'smtp' => [
        'host' => 'smtp.hostinger.com',
        'port' => 465,
        'secure' => 'ssl',
        'user' => 'info@othaimeengrp.com',
        'pass' => '',
    ],

    'php_mail' => false,

    // Optional. Auto-generated into data_dir if left empty.
    'secret' => '',

    // Optional. Where submissions.jsonl is written. Defaults to othaimeen-private/data.
    'data_dir' => '',
];
