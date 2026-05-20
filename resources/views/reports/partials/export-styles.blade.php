<style>
        @page Section1 {
            size: 8.5in 11in;
            margin: 0.45in 0.55in 0.45in 0.55in;
            mso-page-orientation: portrait;
            mso-header-margin: 0in;
            mso-footer-margin: 0in;
        }

        @page {
            size: 8.5in 11in;
            margin: 0.45in 0.55in 0.45in 0.55in;
            mso-page-orientation: portrait;
            mso-fit-to-page: yes;
        }

        body {
            color: #111827;
            font-family: Calibri, Arial, Helvetica, sans-serif;
            font-size: 12pt;
            margin: 0;
        }

        .Section1 {
            page: Section1;
            width: 100%;
        }

        .report-inner {
            margin: 0 auto;
            width: 7.35in;
        }

        .export-header,
        .school-letterhead {
            border-collapse: collapse;
            margin: 0 auto 20pt;
            width: 6.55in;
        }

        .school-letterhead td {
            border: 0;
            padding: 0;
            vertical-align: middle;
        }

        .letterhead-logo-cell {
            text-align: center;
            width: 1.05in;
        }

        .letterhead-logo {
            height: 0.95in;
            width: 0.95in;
        }

        .letterhead-text,
        .export-header {
            text-align: center;
        }

        .letterhead-text {
            width: 4.45in;
        }

        .school-name {
            color: #000000;
            font-size: 18pt;
            font-weight: 700;
            line-height: 1.15;
            margin: 0 0 3pt;
        }

        .school-address,
        .school-contact {
            color: #000000;
            font-size: 12pt;
            margin: 0;
        }

        .school-contact span:first-child {
            color: #0645ad;
            text-decoration: underline;
        }

        .report-title {
            color: {{ $titleColor ?? '#010440' }};
            font-size: 18pt;
            font-weight: 700;
            margin: 0 0 8pt;
            text-align: center;
        }

        .meta-table {
            border-collapse: collapse;
            margin: 0 auto 12pt;
            width: 4.55in;
        }

        .meta-table td {
            border: 0;
            font-size: 12pt;
            padding: 1pt 12pt;
            text-align: left;
            white-space: nowrap;
        }

        .meta-label {
            color: #000000;
            font-weight: 700;
        }

@include('reports.partials.export-table-styles')
    </style>
