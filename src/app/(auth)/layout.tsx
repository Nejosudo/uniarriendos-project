import type { Metadata } from 'next';

export const metadata: Metadata = {
    robots: 'noindex, nofollow', // No indexar páginas de autenticación
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
