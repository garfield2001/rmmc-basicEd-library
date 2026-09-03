            @media print {
                .top-actions {
                    display: none;
                }
                body {
                    margin: 0;
                }
                .report-shell {
                    padding-bottom: 0.45in;
                }
                thead {
                    display: table-header-group;
                }
                .report-table tr,
                .group-summary {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                .group-title {
                    break-after: avoid;
                    page-break-after: avoid;
                }
                .print-page-number {
                    color: #020659;
                    display: block;
                    font-size: 9pt;
                    line-height: 1;
                    position: absolute;
                    right: 0;
                    text-align: right;
                    width: 2in;
                    pointer-events: none;
                }
            }
