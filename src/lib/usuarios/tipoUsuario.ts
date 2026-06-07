export type TipoUsuario = 'unipaz' | 'externo';

const DOMINIO_UNIPAZ = '@unipaz.edu.co';

export function inferTipoUsuario(email: string): TipoUsuario {
    const normalizado = email.trim().toLowerCase();
    return normalizado.endsWith(DOMINIO_UNIPAZ) ? 'unipaz' : 'externo';
}
