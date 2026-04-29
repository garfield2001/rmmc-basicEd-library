# Architecture

This project currently follows a practical layered Laravel architecture.

## Layers

- Presentation: routes, controllers, Inertia pages, Blade report views, and form requests.
- Application: service classes in `app/Services` that coordinate dashboard data, RFID visit logging, and reports.
- Domain/data: Eloquent models in `app/Models` and database migrations.

## Current Rules

- Controllers should stay thin. They receive requests, call services, and return responses.
- Validation belongs in `app/Http/Requests`.
- Business workflows belong in `app/Services`.
- Eloquent models may keep relationship definitions, casts, scopes, and small computed attributes.
- React pages should receive prepared props and focus on presentation.

## Not Clean Architecture Yet

The app does not need full clean architecture yet. There are no repository interfaces, DTO layers, or framework-independent domain entities because the project is still early and Laravel's Eloquent patterns are enough.

Consider moving toward clean architecture only if the app grows to need multiple data sources, complex domain rules, background workflows, external RFID integrations, or a large test suite that becomes hard to manage with Eloquent-backed services.
