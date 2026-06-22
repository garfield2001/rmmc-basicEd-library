<?php

namespace App\Support\Reports;

use Spatie\Browsershot\Browsershot;

class ReportPdfBrowser
{
    public function configure(Browsershot $browser): Browsershot
    {
        $chromePath = $this->executablePath();
        $userDataDir = $this->userDataDir();

        if (! is_dir($userDataDir)) {
            mkdir($userDataDir, 0755, true);
        }

        if ($chromePath) {
            $browser->setChromePath($chromePath);
        }

        return $browser
            ->setNodeModulePath(base_path('node_modules'))
            ->noSandbox()
            ->newHeadless()
            ->setUserDataDir($userDataDir)
            ->addChromiumArguments([
                'disable-dev-shm-usage',
                'disable-gpu',
                'disable-extensions',
                'disable-background-networking',
                'no-first-run',
                'no-default-browser-check',
            ])
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

    private function userDataDir(): string
    {
        return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
            . DIRECTORY_SEPARATOR
            . 'rmmc-basiced-library-browsershot-'
            . substr(sha1(base_path()), 0, 12);
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
