<style>
            @page {
                size: 8.5in 11in;
                margin: 0.5in 0.6in 0.75in;
            }
            body {
                color: #1F2937;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.5;
                margin: 36px 44px;
                -webkit-font-smoothing: antialiased;
            }
            .report-shell {
                margin: 0 auto;
                max-width: 7.3in;
                padding-bottom: 0.35in;
                position: relative;
            }
            .top-actions {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 16px;
                position: sticky;
                top: 16px;
                z-index: 10;
            }
            .report-action {
                align-items: center;
                background: linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%);
                border: 1px solid #1e3a8a;
                border-radius: 6px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                color: #ffffff;
                cursor: pointer;
                display: inline-flex;
                font-size: 10.5pt;
                font-weight: 600;
                gap: 8px;
                padding: 10px 16px;
                text-decoration: none;
                transition: all 0.2s ease;
            }
            .export-header,
            .school-letterhead {
                border-collapse: collapse;
                margin: 0 auto 32px;
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
                color: #111827;
                font-size: 16pt;
                font-weight: 800;
                letter-spacing: -0.01em;
                line-height: 1.2;
                margin-bottom: 4px;
            }
            .school-address,
            .school-contact {
                color: #4B5563;
                font-size: 10.5pt;
                margin: 0;
            }
            .school-contact span:first-child {
                color: #2563EB;
                text-decoration: none;
                font-weight: 500;
            }
            h1 {
                color: {{ $titleColor ?? '#111827' }};
                font-size: 18pt;
                font-weight: 700;
                letter-spacing: -0.02em;
                margin: 0 0 12px;
                text-align: center;
            }
            .meta-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 12px 24px;
                justify-content: center;
                margin-bottom: 24px;
                background: #F9FAFB;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                padding: 12px 20px;
            }
            .meta-grid div {
                color: #374151;
                font-size: 10pt;
                white-space: nowrap;
            }
            .meta-label {
                color: #6B7280;
                font-weight: 600;
                margin-right: 4px;
                text-transform: uppercase;
                font-size: 8.5pt;
                letter-spacing: 0.05em;
            }
            .group-summary {
                break-inside: avoid;
                display: flex;
                gap: 30px;
                justify-content: flex-start;
                margin: 12px auto 24px;
                width: 100%;
            }
            .group-summary div {
                color: #374151;
                font-weight: 600;
                font-size: 10pt;
            }
            .comparison-summary {
                background: #ffffff;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                box-sizing: border-box;
                break-inside: avoid;
                margin: 0 auto 24px;
                padding: 16px;
                width: 100%;
            }
            .comparison-summary h2 {
                color: #111827;
                font-size: 12.5pt;
                font-weight: 700;
                margin: 0 0 4px;
                text-align: center;
            }
            .comparison-summary p {
                color: #6B7280;
                font-size: 9.5pt;
                margin: 0 0 12px;
                text-align: center;
            }
            .comparison-chart {
                display: block;
                height: auto;
                margin: 0 auto 12px;
                width: 100%;
            }
            .comparison-table {
                border-collapse: collapse;
                font-size: 9.5pt;
                margin: 0 auto;
                table-layout: fixed;
                width: 100%;
            }
            .comparison-table th,
            .comparison-table td {
                border-bottom: 1px solid #E5E7EB;
                padding: 8px 10px;
                text-align: left;
                vertical-align: middle;
            }
            .comparison-table th {
                background: #F9FAFB;
                color: #4B5563;
                font-weight: 600;
                font-size: 8.5pt;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .comparison-table td:nth-child(1),
            .comparison-table td:nth-child(4),
            .comparison-table td:nth-child(5),
            .comparison-table td:nth-child(6) {
                text-align: right;
                white-space: nowrap;
            }
            .summary-bar-container {
                align-items: center;
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }
            .summary-bar-wrapper {
                background: #E5E7EB;
                border-radius: 999px;
                height: 6px;
                width: 60px;
                overflow: hidden;
            }
            .summary-bar-fill {
                background: linear-gradient(90deg, #3B82F6 0%, #10B981 100%);
                border-radius: 999px;
                display: block;
                height: 100%;
            }
            .summary-bar-fill.secondary {
                background: linear-gradient(90deg, #F59E0B 0%, #3B82F6 100%);
            }
            .pdf-analytics-page {
                break-before: page;
                page-break-before: always;
                break-inside: avoid;
                margin: 0 auto;
                width: 100%;
            }
            .pdf-analytics-page h2 {
                color: #111827;
                font-size: 18pt;
                font-weight: 700;
                letter-spacing: -0.02em;
                margin: 0 0 8px;
                text-align: center;
            }
            .analytics-subtitle,
            .analytics-note {
                color: #4B5563;
                font-size: 10.5pt;
                margin: 0 0 16px;
                text-align: center;
            }
            .analytics-metrics {
                display: grid;
                gap: 12px;
                grid-template-columns: repeat(4, 1fr);
                margin: 0 auto 16px;
            }
            .analytics-metrics div {
                background: #ffffff;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                box-sizing: border-box;
                padding: 12px;
                text-align: center;
            }
            .analytics-metrics span {
                color: #6B7280;
                display: block;
                font-size: 8.5pt;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 4px;
            }
            .analytics-metrics strong {
                color: #111827;
                display: block;
                font-size: 16pt;
                font-weight: 700;
                line-height: 1;
            }
            .analytics-vertical-chart {
                background: #ffffff;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                box-sizing: border-box;
                display: block;
                height: auto;
                margin: 0 auto 12px;
                padding: 8px;
                width: 100%;
            }
            .analytics-legend {
                display: flex;
                gap: 16px;
                justify-content: center;
                margin: 8px 0 16px;
            }
            .analytics-legend span {
                color: #4B5563;
                font-size: 9pt;
                font-weight: 500;
                display: flex;
                align-items: center;
            }
            .analytics-legend b {
                display: inline-block;
                height: 8px;
                margin-right: 6px;
                width: 8px;
                border-radius: 99px;
            }
            .legend-green { background: #10B981; }
            .legend-blue { background: #3B82F6; }
            .legend-amber { background: #F59E0B; }
            .legend-red { background: #EF4444; }
            
            .analytics-table {
                margin-top: 12px;
            }
            .comparison-axis {
                color: #6B7280;
                display: grid;
                font-size: 8.5pt;
                font-weight: 600;
                text-transform: uppercase;
                grid-template-columns: repeat(3, 1fr);
                margin: 0 1.45in 6px 1.35in;
            }
            .comparison-axis span:nth-child(2) { text-align: center; }
            .comparison-axis span:last-child { text-align: right; }
            
            .comparison-row {
                align-items: center;
                border-top: 1px solid #F3F4F6;
                display: grid;
                gap: 12px;
                grid-template-columns: 1.35in 3.24in 1.28in;
                padding: 8px 0;
            }
            .comparison-row:first-of-type { border-top: 0; }
            .comparison-label {
                color: #111827;
                font-size: 10pt;
                font-weight: 600;
                line-height: 1.2;
            }
            .comparison-bars {
                display: grid;
                gap: 4px;
            }
            .comparison-bar-line {
                align-items: center;
                display: grid;
                gap: 8px;
                grid-template-columns: 0.68in 1fr 0.36in;
            }
            .comparison-bar-caption,
            .comparison-value,
            .comparison-facts {
                color: #4B5563;
                font-size: 9pt;
                font-weight: 500;
            }
            .comparison-value { text-align: right; }
            
            .comparison-bar {
                background: #E5E7EB;
                border-radius: 999px;
                height: 6px;
                overflow: hidden;
            }
            .comparison-bar span {
                background: linear-gradient(90deg, #3B82F6 0%, #10B981 100%);
                display: block;
                height: 100%;
                border-radius: 999px;
            }
            .comparison-bar-secondary span {
                background: linear-gradient(90deg, #F59E0B 0%, #3B82F6 100%);
            }
            .comparison-facts {
                text-align: right;
            }
            
            .group-title {
                color: {{ $titleColor ?? '#111827' }};
                font-size: 13pt;
                font-weight: 700;
                margin: 28px auto 8px;
                width: 100%;
                border-bottom: 2px solid #E5E7EB;
                padding-bottom: 4px;
                break-after: avoid;
                page-break-after: avoid;
            }
            .report-group {
                /* Removed break-inside: avoid to allow tables to split naturally across pages */
            }
            .report-group + .report-group {
                break-before: page;
                page-break-before: always;
            }
            .group-statistics {
                background: #ffffff;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                box-sizing: border-box;
                break-inside: avoid;
                margin: 0 auto 12px;
                padding: 12px 16px;
                width: 100%;
            }
            .stat-row {
                align-items: center;
                display: grid;
                gap: 12px;
                grid-template-columns: 0.95in 1fr 0.45in;
                margin-bottom: 8px;
            }
            .stat-row:last-child { margin-bottom: 0; }
            .stat-label,
            .stat-value,
            .stat-facts {
                color: #111827;
                font-size: 9.5pt;
                font-weight: 600;
            }
            .stat-value { text-align: right; }
            .stat-bar {
                background: #E5E7EB;
                border-radius: 999px;
                height: 6px;
                overflow: hidden;
            }
            .stat-bar span {
                background: linear-gradient(90deg, #3B82F6 0%, #10B981 100%);
                display: block;
                height: 100%;
                border-radius: 999px;
            }
            .stat-bar-secondary span {
                background: linear-gradient(90deg, #F59E0B 0%, #3B82F6 100%);
            }
            .stat-facts {
                display: flex;
                gap: 24px;
                justify-content: flex-start;
                padding-top: 4px;
            }
            
            .report-table {
                break-inside: auto;
                border-collapse: collapse;
                border: 1px solid #E5E7EB;
                border-radius: 6px;
                box-sizing: border-box;
                font-size: 10pt;
                margin: 0 auto;
                table-layout: fixed;
                width: 100%;
            }
            .report-table th,
            .report-table td {
                border-bottom: 1px solid #E5E7EB;
                box-sizing: border-box;
                padding: 8px 12px;
                text-align: left;
                vertical-align: middle;
                word-break: break-word;
                overflow-wrap: break-word;
            }
            .report-table tr {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            .report-table th {
                background: #F9FAFB;
                color: #4B5563;
                font-weight: 600;
                font-size: 8.5pt;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .report-table tbody tr:nth-child(even) td {
                background: #F9FAFB;
            }
            .report-table tbody tr:last-child td {
                border-bottom: 0;
            }
            .report-table tfoot td {
                background: #ffffff;
                border-top: 2px solid #E5E7EB;
                font-weight: 700;
                padding: 10px 12px;
                white-space: nowrap;
                color: #111827;
            }
            .report-table tfoot .summary-center {
                text-align: center;
            }
            .print-page-number { display: none; }
            @include('reports.partials.print-media-styles')
        </style>
