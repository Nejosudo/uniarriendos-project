'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                duration: 3500,
                style: {
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-main)',
                },
                success: { iconTheme: { primary: 'var(--color-primary)', secondary: 'white' } },
            }}
        />
    );
}
