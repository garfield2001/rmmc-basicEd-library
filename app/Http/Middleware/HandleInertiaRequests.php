<?php

namespace App\Http\Middleware;

use App\Models\SchoolYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        $manifest = public_path('build/manifest.json');

        return File::exists($manifest)
            ? md5_file($manifest) ?: parent::version($request)
            : parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'name' => config('app.display_name'),
            'schoolYear' => fn () => $this->schoolYearRow(SchoolYear::active()->first()),
            'schoolYears' => fn () => SchoolYear::query()
                ->orderByDesc('starts_at')
                ->get()
                ->map(fn (SchoolYear $schoolYear): array => $this->schoolYearRow($schoolYear))
                ->values(),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'sessionId' => $request->session()->getId(),
                    'activeSessionId' => $request->user()->active_session_id,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'recentVisit' => fn () => $request->session()->get('recentVisit'),
                'importSummary' => fn () => $request->session()->get('importSummary'),
            ],
        ]);
    }

    private function schoolYearRow(?SchoolYear $schoolYear): ?array
    {
        if (! $schoolYear) {
            return null;
        }

        return [
            'id' => $schoolYear->id,
            'name' => $schoolYear->name,
            'starts_at' => $schoolYear->startDateString(),
            'ends_at' => $schoolYear->endDateString(),
            'student_required_visits' => $schoolYear->student_required_visits,
            'employee_required_visits' => $schoolYear->employee_required_visits,
            'is_active' => $schoolYear->is_active,
        ];
    }
}
