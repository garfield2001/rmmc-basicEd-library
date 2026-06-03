        .group-summary {
            border: 0;
            margin: 5pt auto 12pt;
            width: 6.55in;
        }

        .group-summary td {
            border: 0;
            font-size: 12pt;
            font-weight: 700;
            padding: 3pt 12pt;
            text-align: left;
            white-space: nowrap;
        }

        .group-title {
            color: {{ $titleColor ?? '#010440' }};
            font-size: 12pt;
            font-weight: 700;
            margin: 18pt auto 4pt;
            text-align: center;
            width: 6.55in;
        }

        .report-table {
            border-collapse: collapse;
            font-size: 11pt;
            margin-left: auto;
            margin-right: auto;
            mso-table-layout-alt: fixed;
            table-layout: fixed;
            width: 6.55in;
        }

        td {
            border: 1px solid #111827;
            mso-number-format: '\@';
            padding: 4pt 6pt;
            text-align: left;
            vertical-align: middle;
            word-break: break-word;
            overflow-wrap: break-word;
        }

        th {
            background: #e8eefc;
            color: #111827;
            font-size: 11pt;
            font-weight: 700;
            padding: 4pt 6pt;
            text-align: left;
            vertical-align: middle;
        }

        tbody tr:nth-child(even) td {
            background: #f8fafc;
        }

        tbody tr:nth-child(odd) td {
            background: #ffffff;
        }

        tfoot td {
            background: #ffffff;
            border: 0;
            font-weight: 700;
            padding: 5pt 0 0;
            white-space: nowrap;
        }

        tfoot .summary-center {
            text-align: center;
        }

        .text-cell {
            mso-number-format: '\@';
        }
