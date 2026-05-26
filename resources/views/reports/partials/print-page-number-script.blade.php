<script>
            (() => {
                const pageContentHeight = 9.83;
                const footerOffset = 0.25;

                function clearPageNumbers(shell) {
                    shell.querySelectorAll('.print-page-number').forEach((node) => node.remove());
                }

                function addPageNumbers() {
                    const shell = document.querySelector('.report-shell');

                    if (!shell) {
                        return;
                    }

                    clearPageNumbers(shell);

                    const pixelsPerInch = 96;
                    const pageCount = Math.max(1, Math.ceil(shell.scrollHeight / (pageContentHeight * pixelsPerInch)));

                    for (let page = 1; page <= pageCount; page += 1) {
                        const marker = document.createElement('div');
                        marker.className = 'print-page-number';
                        marker.textContent = `Page ${page} of ${pageCount}`;
                        marker.style.top = `${page * pageContentHeight - footerOffset}in`;
                        shell.appendChild(marker);
                    }
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
