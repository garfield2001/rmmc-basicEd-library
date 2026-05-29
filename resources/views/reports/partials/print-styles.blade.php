<style>
            @page {
                size: 8.5in 11in;
                margin: 0.45in 0.55in 0.72in;
            }
            body {
                color: #111827;
                font-family: Calibri, Arial, Helvetica, sans-serif;
                font-size: 12pt;
                margin: 36px 44px;
            }
            .report-shell {
                margin: 0 auto;
                max-width: 7.35in;
                padding-bottom: 0.35in;
                position: relative;
            }
            .top-actions {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 14px;
                position: sticky;
                top: 14px;
                z-index: 10;
            }
            .report-action {
                align-items: center;
                background: #040dbf;
                border: 0;
                border-radius: 8px;
                color: #ffffff;
                cursor: pointer;
                display: inline-flex;
                font-size: 12pt;
                font-weight: 700;
                gap: 8px;
                padding: 11px 16px;
                text-decoration: none;
            }
            .export-header,
            .school-letterhead {
                border-collapse: collapse;
                margin: 0 auto 26px;
                text-align: center;
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
                object-fit: contain;
                width: 0.95in;
            }
            .letterhead-text {
                text-align: center;
                width: 4.45in;
            }
            .school-name {
                color: #000000;
                font-size: 18pt;
                font-weight: 700;
                line-height: 1.15;
                margin-bottom: 4px;
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
            h1 {
                color: {{ $titleColor ?? '#010440' }};
                font-size: 18pt;
                margin: 0 0 8px;
                text-align: center;
            }
            .meta-grid {
                display: grid;
                gap: 2px 34px;
                grid-template-columns: max-content max-content;
                justify-content: center;
                margin-bottom: 16px;
            }
            .meta-grid div {
                white-space: nowrap;
            }
            .meta-label {
                color: #000000;
                font-weight: 700;
            }
            .group-summary {
                break-inside: avoid;
                display: flex;
                gap: 30px;
                justify-content: flex-start;
                margin: 8px auto 20px;
                width: 6.55in;
            }
            .group-summary div {
                font-weight: 700;
                white-space: nowrap;
            }
            .group-title {
                color: {{ $titleColor ?? '#010440' }};
                font-size: 12pt;
                font-weight: 700;
                margin: 22px auto 6px;
                width: 6.55in;
            }
            .report-table {
                break-inside: auto;
                border-collapse: collapse;
                border-right: 1.5px solid #111827;
                box-sizing: border-box;
                font-size: 11pt;
                margin: 0 auto;
                table-layout: fixed;
                width: 6.48in;
            }
            .report-table th,
            .report-table td {
                border: 1px solid #111827;
                box-sizing: border-box;
                padding: 5px 8px;
                text-align: left;
                vertical-align: middle;
                white-space: nowrap;
            }
            .report-table tr {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            .report-table th:last-child,
            .report-table td:last-child {
                border-right: 1.5px solid #111827;
            }
            .report-table th {
                background: #e8eefc;
                color: #111827;
                font-weight: 700;
            }
            .report-table tbody tr:nth-child(even) td {
                background: #f8fafc;
            }
            .report-table tfoot td {
                background: #ffffff;
                border: 0;
                font-weight: 700;
                padding: 8px 0 0;
                white-space: nowrap;
            }
            .report-table tfoot .summary-center {
                text-align: center;
            }
            .print-page-number {
                display: none;
            }
            @include('reports.partials.print-media-styles')
        </style>
