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
            .comparison-summary {
                background: #ffffff;
                border: 1.25px solid #bfc9f5;
                box-sizing: border-box;
                break-inside: avoid;
                margin: 0 auto 18px;
                padding: 10px 12px 12px;
                width: 6.48in;
            }
            .comparison-summary h2 {
                color: #010440;
                font-size: 12pt;
                margin: 0 0 3px;
                text-align: center;
            }
            .comparison-summary p {
                color: #020659;
                font-size: 9pt;
                font-weight: 700;
                margin: 0 0 7px;
                text-align: center;
            }
            .comparison-chart {
                display: block;
                height: auto;
                margin: 2px auto 8px;
                width: 6.18in;
            }
            .comparison-table {
                border-collapse: collapse;
                font-size: 9.2pt;
                margin: 0 auto;
                table-layout: fixed;
                width: 6.18in;
            }
            .comparison-table th,
            .comparison-table td {
                border: 1px solid #bfc9f5;
                padding: 4px 6px;
                text-align: left;
                vertical-align: middle;
            }
            .comparison-table th {
                background: #e8eefc;
                color: #010440;
                font-weight: 700;
            }
            .comparison-table td:nth-child(1),
            .comparison-table td:nth-child(3),
            .comparison-table td:nth-child(4),
            .comparison-table td:nth-child(5),
            .comparison-table td:nth-child(6) {
                text-align: right;
                white-space: nowrap;
            }
            .pdf-analytics-page {
                break-before: page;
                page-break-before: always;
                break-inside: avoid;
                margin: 0 auto;
                width: 6.48in;
            }
            .pdf-analytics-page h2 {
                color: #010440;
                font-size: 18pt;
                margin: 0 0 4px;
                text-align: center;
            }
            .analytics-subtitle,
            .analytics-note {
                color: #020659;
                font-size: 10pt;
                font-weight: 700;
                margin: 0 0 12px;
                text-align: center;
            }
            .analytics-metrics {
                display: grid;
                gap: 8px;
                grid-template-columns: repeat(4, 1fr);
                margin: 0 auto 12px;
            }
            .analytics-metrics div {
                background: #f6f8ff;
                border: 1px solid #bfc9f5;
                box-sizing: border-box;
                padding: 8px;
                text-align: center;
            }
            .analytics-metrics span {
                color: #020659;
                display: block;
                font-size: 8.5pt;
                font-weight: 700;
                margin-bottom: 3px;
            }
            .analytics-metrics strong {
                color: #010440;
                display: block;
                font-size: 13pt;
                line-height: 1.1;
            }
            .analytics-vertical-chart {
                background: #ffffff;
                border: 1.25px solid #bfc9f5;
                box-sizing: border-box;
                display: block;
                height: auto;
                margin: 0 auto 8px;
                padding: 4px;
                width: 6.48in;
            }
            .analytics-legend {
                display: flex;
                gap: 16px;
                justify-content: center;
                margin: 4px 0 10px;
            }
            .analytics-legend span {
                color: #020659;
                font-size: 8.5pt;
                font-weight: 700;
                white-space: nowrap;
            }
            .analytics-legend b {
                display: inline-block;
                height: 8px;
                margin-right: 4px;
                width: 14px;
            }
            .legend-green {
                background: #16a34a;
            }
            .legend-blue {
                background: #2563eb;
            }
            .legend-amber {
                background: #f59e0b;
            }
            .legend-red {
                background: #dc2626;
            }
            .analytics-table {
                margin-top: 8px;
            }
            .analytics-note {
                margin-top: 10px;
            }
            .comparison-axis {
                color: #020659;
                display: grid;
                font-size: 8.5pt;
                font-weight: 700;
                grid-template-columns: repeat(3, 1fr);
                margin: 0 1.45in 3px 1.35in;
            }
            .comparison-axis span:nth-child(2) {
                text-align: center;
            }
            .comparison-axis span:last-child {
                text-align: right;
            }
            .comparison-row {
                align-items: center;
                border-top: 1px solid #dbe4ff;
                display: grid;
                gap: 7px;
                grid-template-columns: 1.35in 3.24in 1.28in;
                padding: 5px 0;
            }
            .comparison-row:first-of-type {
                border-top: 0;
            }
            .comparison-label {
                color: #010440;
                font-size: 9.5pt;
                font-weight: 700;
                line-height: 1.2;
            }
            .comparison-bars {
                display: grid;
                gap: 3px;
            }
            .comparison-bar-line {
                align-items: center;
                display: grid;
                gap: 5px;
                grid-template-columns: 0.68in 1fr 0.36in;
            }
            .comparison-bar-caption,
            .comparison-value,
            .comparison-facts {
                color: #020659;
                font-size: 8.6pt;
                font-weight: 700;
            }
            .comparison-value {
                text-align: right;
            }
            .comparison-bar {
                background: #dbe4ff;
                border-radius: 999px;
                height: 7px;
                overflow: hidden;
            }
            .comparison-bar span {
                background: linear-gradient(90deg, #0284c7 0%, #2563eb 48%, #16a34a 100%);
                display: block;
                height: 100%;
            }
            .comparison-bar-secondary span {
                background: linear-gradient(90deg, #f59e0b 0%, #2563eb 100%);
            }
            .comparison-facts {
                line-height: 1.25;
                text-align: right;
            }
            .group-title {
                color: {{ $titleColor ?? '#010440' }};
                font-size: 12pt;
                font-weight: 700;
                margin: 22px auto 6px;
                width: 6.55in;
            }
            .report-group {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            .report-group + .report-group {
                break-before: page;
                page-break-before: always;
            }
            .group-statistics {
                background: #f6f8ff;
                border: 1px solid #bfc9f5;
                box-sizing: border-box;
                break-inside: avoid;
                margin: 0 auto 8px;
                padding: 8px 10px;
                width: 6.48in;
            }
            .stat-row {
                align-items: center;
                display: grid;
                gap: 8px;
                grid-template-columns: 0.95in 1fr 0.45in;
                margin-bottom: 5px;
            }
            .stat-label,
            .stat-value,
            .stat-facts {
                color: #010440;
                font-size: 9.5pt;
                font-weight: 700;
            }
            .stat-value {
                text-align: right;
            }
            .stat-bar {
                background: #dbe4ff;
                border-radius: 999px;
                height: 8px;
                overflow: hidden;
            }
            .stat-bar span {
                background: linear-gradient(90deg, #0284c7 0%, #2563eb 48%, #16a34a 100%);
                display: block;
                height: 100%;
            }
            .stat-bar-secondary span {
                background: linear-gradient(90deg, #f59e0b 0%, #2563eb 100%);
            }
            .stat-facts {
                display: flex;
                gap: 18px;
                justify-content: flex-start;
                padding-top: 2px;
            }
            .report-table {
                break-inside: auto;
                border-collapse: collapse;
                border-left: 1.5px solid #111827;
                border-right: 1.5px solid #111827;
                border-top: 1.5px solid #111827;
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
                word-break: break-word;
                overflow-wrap: break-word;
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
                line-height: 1.18;
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
