'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { logoutAction } from '@/app/(auth)/actions';
import styles from './Navbar.module.css';

type NavbarMobileMenuProps = {
    isLoggedIn: boolean;
    isAdmin: boolean;
    avatarUrl: string | null;
    nombre: string;
};

export default function NavbarMobileMenu({ isLoggedIn, isAdmin, avatarUrl, nombre }: NavbarMobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className={styles.mobileMenuButton}
                aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((value) => !value)}
            >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {isOpen && (
                <div className={styles.mobileMenuOverlay} onClick={() => setIsOpen(false)}>
                    <div className={styles.mobileMenuPanel} onClick={(event) => event.stopPropagation()}>
                        <nav className={styles.mobileMenuLinks}>
                            <Link href="/" onClick={() => setIsOpen(false)}>Inicio</Link>
                            <Link href="/explorar" onClick={() => setIsOpen(false)}>Explorar</Link>
                            <Link href="/nosotros" onClick={() => setIsOpen(false)}>Nosotros</Link>
                        </nav>

                        {isLoggedIn ? (
                            <div className={styles.mobileUserSection}>
                                <Link href="/dashboard/perfil" className={styles.mobileProfileLink} onClick={() => setIsOpen(false)}>
                                    {avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={avatarUrl} alt={nombre || 'Avatar'} className={styles.mobileAvatar} />
                                    ) : (
                                        <div className={styles.mobileDefaultAvatar}>
                                            {nombre ? nombre.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <span>{nombre || 'Mi perfil'}</span>
                                </Link>

                                {isAdmin && (
                                    <Link href="/admin" className={styles.mobileAdminLink} onClick={() => setIsOpen(false)}>
                                        Admin
                                    </Link>
                                )}

                                <form action={logoutAction}>
                                    <button type="submit" className={styles.mobileLogoutBtn} onClick={() => setIsOpen(false)}>
                                        Salir
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <Link href="/login" className={styles.mobileAuthButton} onClick={() => setIsOpen(false)}>
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
