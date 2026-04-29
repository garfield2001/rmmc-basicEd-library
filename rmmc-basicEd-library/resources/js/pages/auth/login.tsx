import { Head, Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';

interface LoginForm {
    [key: string]: string;
    email: string;
    password: string;
}

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />

            <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12 text-zinc-950">
                <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <div>
                        <p className="text-sm font-medium tracking-[0.18em] text-emerald-700 uppercase">Library tracker</p>
                        <h1 className="mt-3 text-2xl font-semibold">Log in</h1>
                        <p className="mt-2 text-sm leading-6 text-zinc-500">Use your librarian account to manage RFID visit tracking.</p>
                    </div>

                    <form onSubmit={submit} className="mt-8 space-y-5">
                        <div>
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                                autoComplete="email"
                                autoFocus
                            />
                            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="text-sm font-medium">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                                autoComplete="current-password"
                            />
                            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {processing ? 'Logging in...' : 'Log in'}
                        </button>
                    </form>

                    <Link href="/" className="mt-6 block text-center text-sm font-medium text-zinc-600 hover:text-zinc-950">
                        Back to dashboard
                    </Link>
                </section>
            </main>
        </>
    );
}
