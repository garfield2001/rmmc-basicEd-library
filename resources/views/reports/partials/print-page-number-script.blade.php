<script>
            (() => {
                // Printable content height per Letter page: 11in - 0.5in (top) - 0.75in (bottom) = 9.75in
                const pageContentHeightInches = 9.75;
                const footerOffsetInches = 0.22;
                const pixelsPerInch = 96;
                const pageContentHeightPx = pageContentHeightInches * pixelsPerInch;
                const footerOffsetPx = footerOffsetInches * pixelsPerInch;

                function clearPageNumbers(shell) {
                    shell.querySelectorAll('.print-page-number').forEach((node) => node.remove());
                }

                function addPageNumbers() {
                    const shell = document.querySelector('.report-shell');

                    if (!shell) {
                        return;
                    }

                    clearPageNumbers(shell);

                    const shellRect = shell.getBoundingClientRect();
                    const shellTop = shellRect.top + window.scrollY;

                    // Detect elements with forced page breaks
                    const breakSelectors = [
                        '[style*="page-break-before: always"]',
                        '[style*="page-break-before:always"]',
                        '[style*="break-before: page"]',
                        '[style*="break-before:page"]',
                        '.pdf-analytics-page',
                    ];
                    const breakElements = Array.from(shell.querySelectorAll(breakSelectors.join(', ')))
                        .filter((el) => !el.classList.contains('print-page-number'));

                    const breakOffsets = breakElements
                        .map((el) => {
                            const rect = el.getBoundingClientRect();
                            return Math.max(0, rect.top + window.scrollY - shellTop);
                        })
                        .sort((a, b) => a - b);

                    // Divide document into distinct segments based on forced page breaks
                    const segments = [];
                    let prevOffset = 0;

                    for (const bOffset of breakOffsets) {
                        if (bOffset > prevOffset) {
                            segments.push({ startOffset: prevOffset, height: bOffset - prevOffset });
                        }
                        prevOffset = bOffset;
                    }
                    const totalShellHeight = Math.max(shell.scrollHeight, shell.offsetHeight);
                    if (totalShellHeight > prevOffset) {
                        segments.push({ startOffset: prevOffset, height: totalShellHeight - prevOffset });
                    }

                    if (segments.length === 0) {
                        segments.push({ startOffset: 0, height: totalShellHeight });
                    }

                    // For each segment, calculate how many pages it spans and register footer positions
                    const footerTopsPx = [];

                    for (const seg of segments) {
                        const segPages = Math.max(1, Math.ceil(seg.height / pageContentHeightPx));
                        for (let p = 1; p <= segPages; p += 1) {
                            footerTopsPx.push(seg.startOffset + (p * pageContentHeightPx) - footerOffsetPx);
                        }
                    }

                    const totalPages = footerTopsPx.length;

                    footerTopsPx.forEach((topPx, index) => {
                        const marker = document.createElement('div');
                        marker.className = 'print-page-number';
                        marker.textContent = `Page ${index + 1} of ${totalPages}`;
                        marker.style.top = `${topPx}px`;
                        shell.appendChild(marker);
                    });
                }

                window.addEventListener('beforeprint', addPageNumbers);
                window.addEventListener('afterprint', () => {
                    const shell = document.querySelector('.report-shell');

                    if (shell) {
                        clearPageNumbers(shell);
                    }
                });
                document.querySelector('.report-action')?.addEventListener('click', addPageNumbers);
            })();
        </script>
