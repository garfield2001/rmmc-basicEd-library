<?php

namespace App\Http\Middleware;

use App\Models\SchoolYear;
use Illuminate\Http\Request;
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
        return parent::version($request);
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
            'schoolYear' => fn() => $this->schoolYearRow(SchoolYear::active()->first()),
            'schoolYears' => fn() => SchoolYear::query()
                ->orderByDesc('starts_at')
                ->get()
                ->map(fn(SchoolYear $schoolYear): array => $this->schoolYearRow($schoolYear))
                ->values(),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'sessionId' => $request->session()->getId(),
                ] : null,
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'recentVisit' => fn() => $request->session()->get('recentVisit'),
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
