<?php

namespace App\Support\Reports;

use Spatie\Browsershot\Browsershot;

class ReportPdfBrowser
{
    public function configure(Browsershot $browser): Browsershot
    {
        $chromePath = $this->executablePath();

        if ($chromePath) {
            $browser->setChromePath($chromePath);
        }

        return $browser
            ->setNodeModulePath(base_path('node_modules'))
            ->noSandbox()
            ->newHeadless()
            ->timeout(120)
            ->protocolTimeout(120);
    }

    private function executablePath(): ?string
    {
        $configuredPath = env('BROWSERSHOT_CHROME_PATH');

        if ($configuredPath && is_file($configuredPath)) {
            return $configuredPath;
        }

        if (PHP_OS_FAMILY !== 'Windows') {
            return null;
        }

        foreach ($this->windowsBrowserPaths() as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    private function windowsBrowserPaths(): array
    {
        return [
            'C:\Program Files\Google\Chrome\Application\chrome.exe',
            'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
            'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
            'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        ];
    }
}
